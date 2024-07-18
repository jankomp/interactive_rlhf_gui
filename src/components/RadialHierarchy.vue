<template>
    <div>
        <div ref="chartContainer"></div>
        <div>
            <input type="checkbox" id="suggestionsToggle" v-model="showSuggestions">
            <label for="suggestionsToggle">Show Suggestions</label>
        </div>
        <div>
            <input type="checkbox" id="preferencesToggle" v-model="showPreferences">
            <label for="preferencesToggle">Show Preferences</label>
        </div>
    </div>
</template>

<script>

import * as d3 from "d3";
import { Path2D } from "./HierarchicalEdgeBundling.js";

export default {
    name: "RadialHierarchy",
    props: ['chartSize', 'numberOfSuggestions', 'beta'],
    data() {
        return {
            fragmentData: null,
            suggestionData: null,
            preferenceData: null,
            group1: [],
            group2: [],
            width: this.chartSize,
            height: this.chartSize,
            root: null,
            svg: null,
            startRadius: null,
            innerRadius: null,
            outerRadius: null,
            leafNodeWidth: null,
            previousNumberOfSuggestions: 0,
            descendants: null,
            line: null,
            showSuggestions: true,
            showPreferences: true,
        };
    },
    mounted() {
        this.resumeStream();
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        this.fetchPreferences();
    },

    methods: {
        setGroup1(newGroup1) {
            this.group1 = newGroup1;
        },
        setGroup2(newGroup2) {
            this.group2 = newGroup2;
        },
        group1Updated() {
            this.$emit('group1Updated', this.group1);
        },
        group2Updated() {
            this.$emit('group2Updated', this.group2);
        },
        suggestionDataLoaded(totalNumberOfSuggestions) {
            this.$emit('suggestionDataLoaded', totalNumberOfSuggestions);
        },
        async createChart() {
            if (this.fragmentData) {
                const depth = d3.hierarchy(this.fragmentData).height;

                this.startRadius = this.width / 8 / depth;
                this.innerRadius = this.startRadius * 2 * depth;
                this.outerRadius = this.innerRadius + (this.startRadius * 2 * (depth - 1));
                const tree = d3.cluster().size([2 * Math.PI, this.innerRadius - this.startRadius]);

                this.root = d3.hierarchy(this.fragmentData);
                tree(this.root);

                const leafNodes = this.root.leaves();
                this.leafNodeWidth = 2 * Math.PI / leafNodes.length;

                this.svg = d3.select(this.$refs.chartContainer).append("svg")
                    .attr("width", this.width)
                    .attr("height", this.height)
                    .append("g")
                    .attr("transform", `translate(${this.width / 2},${this.height / 2})`);

                this.createIcicleChart();
                this.drawSuggestions();
            }
        },
        drawSuggestions(redraw = false) {
            if (!this.showSuggestions) {
                this.svg.selectAll(".suggestionLink").remove();
                return;
            }
            // Set the x value of each leaf node
            let leafNodeIndex = 0;
            this.root.eachAfter(node => {
                if (!node.children) {
                    node.x = leafNodeIndex * this.leafNodeWidth + (this.leafNodeWidth / 2);
                    leafNodeIndex++;
                }
            });

            // Recompute the x value of non-leaf nodes
            this.root.eachAfter(node => {
                if (node.children) {
                    const firstChildX = node.children[0].x;
                    const lastChildX = node.children[node.children.length - 1].x;
                    node.x = (firstChildX + lastChildX) / 2;
                }
            });

            this.descendants = this.root.descendants().filter(d => d.depth > 0);
            const maxVariance = this.suggestionData[0].var;

            // Create a radial this.line generator with a bundling factor of beta
            this.line = d3.lineRadial()
                .curve(d3.curveBundle.beta(this.beta))
                .radius(d => this.startRadius + d.y)
                .angle(d => d.x);

            // Create the edge bundles
            const edgeBundles = this.suggestionData.slice(0, this.numberOfSuggestions).map(sug => {
                const node1 = this.descendants.find(node => node.data.id === sug.id1);
                const node2 = this.descendants.find(node => node.data.id === sug.id2);
                const estVar = sug.var / maxVariance;

                // Find the common ancestor of node1 and node2
                let ancestor = node1;
                while (!ancestor.descendants().includes(node2)) {
                    ancestor = ancestor.parent;
                }

                // Create a list of points from node1, up to the ancestor, and then down to node2
                const points = [...this.getAncestors(node1, ancestor), ancestor, ...this.getDescendants(node2, ancestor)].map(node => {
                    return { x: node.x, y: node.y, opacity: estVar };
                });

                return points;
            });

            if (!redraw) {
                if (this.numberOfSuggestions > this.previousNumberOfSuggestions) {
                    // Add new edges
                    this.svg.selectAll(".suggestionLink")
                        .data(edgeBundles)
                        .enter().append("path")
                        .attr("class", "suggestionLink")
                        .attr("d", this.line)
                        .attr("stroke", "#555")
                        .attr("stroke-opacity", d => d[0].opacity)
                        .attr("stroke-width", 0.2)
                        .attr("fill", "none");
                } else if (this.numberOfSuggestions < this.previousNumberOfSuggestions) {
                    // Remove excess edges
                    this.svg.selectAll(".suggestionLink")
                        .data(edgeBundles)
                        .exit().remove();
                }
            } else {
                this.svg.selectAll(".suggestionLink")
                    .data(edgeBundles)
                    .join(
                        enter => enter.append("path")
                            .attr("class", "suggestionLink")
                            .attr("d", this.line)
                            .attr("stroke", "#555")
                            .attr("stroke-opacity", d => d[0].opacity)
                            .attr("stroke-width", 0.2)
                            .attr("fill", "none"),
                        update => update
                            .attr("d", this.line)
                            .attr("stroke-opacity", d => d[0].opacity),
                        exit => exit.remove()
                    );
            }
            this.drawPreferences();
        },
        drawPreferences() {
            if (!this.showPreferences) {
                this.svg.selectAll(".preferenceLink").remove();
                return;
            }
            if (!this.preferenceData || this.preferenceData.length === 0 || !this.svg) {
                return;
            }

            // Helper function to split a path into segments
            function splitPath(line, points, k) {
                const path = new Path2D();
                line.context(path)(points); // Ensure this works as expected

                return Array.from(path.split(k));
            }

            // Clear previous gradients and definitions
            this.svg.selectAll("defs").remove();

            const k = 6; // 2^k color segments per curve

            // Create the preference edge bundles and draw them
            const preferenceEdgeBundles = this.preferenceData.map(pref => {
                if (!pref || !this.descendants) {
                    return [];
                }

                const node1 = this.descendants.find(node => node.data.id === pref.id1);
                const node2 = this.descendants.find(node => node.data.id === pref.id2);

                // Find the common ancestor of node1 and node2
                let ancestor = node1;
                while (!ancestor.descendants().includes(node2)) {
                    ancestor = ancestor.parent;
                }

                // Create a list of points from node1, up to the ancestor, and then down to node2
                return [...this.getAncestors(node1, ancestor), ancestor, ...this.getDescendants(node2, ancestor)].map(node => {
                    return { x: node.x, y: node.y };
                });
            });

            // Generate path segments for each preference edge bundle
            const pathSegments = preferenceEdgeBundles.map((points, index) => {
                const segments = splitPath(this.line, points, k);
                // Associate the preference data with the segments
                segments.forEach(segment => {
                    segment.preference = this.preferenceData[index].preference;
                });
                return segments;
            });

            // Number of segments
            const numSegments = Math.pow(2, k);
            function interpolateColor(preference, i) {
                if (preference === 1.0) {
                    return d3.interpolate("#0000ff", "#ff0000")(i / (numSegments - 1));
                } else if (preference === 0.0) {
                    return d3.interpolate("#ff0000", "#0000ff")(i / (numSegments - 1));
                } else {
                    return "#7f007f";
                }
            }

            // Add the line segments to the SVG
            this.svg.select("g")
                .selectAll(".preferenceLink")
                .data(pathSegments)
                .join(
                    enter => enter.append("g")
                        .attr("class", "preferenceLink")
                        .selectAll("path")
                        .data(d => d)
                        .join("path")
                        .style("mix-blend-mode", "darken")
                        .attr("stroke", (d, i) => {
                            return interpolateColor(d.preference, i);
                        })
                        .attr("stroke-width", 1)
                        .attr("stroke-opacity", 1)
                        .attr("d", d => d),
                    update => update.selectAll("path")
                        .data(d => d)
                        .join("path")
                        .attr("d", d => d),
                    exit => exit.remove()
                );

            // Update lastDrawnBundleIndex
            this.lastDrawnBundleIndex = this.preferenceData.length - 1;
        },
        getAncestors(node, ancestor) {
            const ancestors = [];
            while (node !== ancestor) {
                ancestors.push(node);
                node = node.parent;
            }
            return ancestors;
        },
        getDescendants(node, ancestor) {
            const descendants = [];
            while (node !== ancestor) {
                descendants.unshift(node);
                node = node.parent;
            }
            return descendants;
        },
        createIcicleChart() {
            // Create the mirrored outer tree layout
            const reversedData = this.reverseHierarchy();
            const outerTree = d3.tree().size([2 * Math.PI, this.outerRadius - this.innerRadius]);

            const outerRoot = d3.hierarchy(reversedData);
            outerTree(outerRoot);

            let leafNodeIndex = 0;
            outerRoot.eachAfter(outerNode => {
                if (outerNode.children) {
                    outerNode.x0 = outerNode.children[0].x0;
                    outerNode.x1 = outerNode.children[outerNode.children.length - 1].x1;
                } else {
                    outerNode.x0 = leafNodeIndex * this.leafNodeWidth;
                    outerNode.x1 = (leafNodeIndex + 1) * this.leafNodeWidth;
                    leafNodeIndex++;
                }
                const depth = outerRoot.height - outerNode.depth; // Reverse the depth
                outerNode.y0 = this.innerRadius + depth * (this.outerRadius - this.innerRadius) / outerRoot.height;
                outerNode.y1 = this.innerRadius + (depth + 1) * (this.outerRadius - this.innerRadius) / outerRoot.height;
            });

            const outerDescendants = outerRoot.descendants().filter(d => d.depth > 0);

            const outerNode = this.svg.selectAll(".outerNode")
                .data(outerDescendants)
                .enter().append("g")
                .on("mousedown", (event, d) => {
                    if (event.button === 0) {
                        this.handleNodeClick(d, 'group1', event.ctrlKey);
                    } else if (event.button === 2) {
                        this.handleNodeClick(d, 'group2', event.ctrlKey);
                    }
                }).on("mouseenter", (event, d) => {
                    if (event.buttons === 1) {
                        this.handleNodeClick(d, 'group1', true);
                    } else if (event.buttons === 2) {
                        this.handleNodeClick(d, 'group2', true);
                    }
                });

            const arc = d3.arc()
                .startAngle(d => d.x0)
                .endAngle(d => d.x1)
                .innerRadius(d => d.y0)
                .outerRadius(d => d.y1);

            outerNode.append("path")
                .attr("fill", d => {
                    if (!d.children) {
                        if (this.group1.some(node => node.id === d.data.id)) {
                            return "#ff00ff";
                        } else if (this.group2.some(node => node.id === d.data.id)) {
                            return "#ffff00";
                        } else {
                            return "#ffffff";
                        }
                    } else {
                        const { group1Count, group2Count, noGroupCount } = this.countLeafDescendantsInGroups(d);
                        const totalCount = group1Count + group2Count + noGroupCount;

                        const colorWhite = d3.rgb(255, 255, 255);
                        const colorPink = d3.rgb(255, 0, 255);
                        const colorYellow = d3.rgb(255, 255, 0);

                        return d3.rgb(
                            (colorWhite.r * noGroupCount + colorPink.r * group1Count + colorYellow.r * group2Count) / totalCount,
                            (colorWhite.g * noGroupCount + colorPink.g * group1Count + colorYellow.g * group2Count) / totalCount,
                            (colorWhite.b * noGroupCount + colorPink.b * group1Count + colorYellow.b * group2Count) / totalCount
                        );
                    }
                })
                .attr("opacity", 1)
                .attr("stroke", "black")
                .attr("d", arc);
        },
        countLeafDescendantsInGroups(node) {
            const allDescendants = node.descendants();
            const leafDescendants = allDescendants.filter(node => !node.children);

            let group1Count = 0;
            let group2Count = 0;
            let noGroupCount = 0;

            leafDescendants.forEach(leaf => {
                if (this.group1.some(groupNode => groupNode.id === leaf.data.id)) {
                    group1Count++;
                } else if (this.group2.some(groupNode => groupNode.id === leaf.data.id)) {
                    group2Count++;
                } else {
                    noGroupCount++;
                }
            });

            return { group1Count, group2Count, noGroupCount };
        },
        reverseHierarchy() {
            // Reverse the hierarchy
            function reverseNode(node) {
                if (!node.children || node.children.length === 0) {
                    return { ...node };
                }
                return {
                    ...node,
                    children: node.children.map(reverseNode)
                };
            }
            const reversedData = reverseNode(this.fragmentData);
            return reversedData;
        },
        handleNodeClick(node, group, ctrlKey) {
            if (!ctrlKey) {
                this[group] = [];
            }

            const otherGroup = group === 'group1' ? 'group2' : 'group1';

            if (node.children) {
                // If the node is a parent node, add all leaf nodes descending from it
                node.each(node => {
                    if (!node.children) {
                        // Check if the node is already in the group
                        if (!this[group].some(groupNode => groupNode.id === node.data.id)) {
                            this[group].push(node.data);
                        }

                        // Check if the node is in the other group and remove it if it is
                        const indexInOtherGroup = this[otherGroup].findIndex(item => item.id === node.data.id);
                        if (indexInOtherGroup !== -1) {
                            this[otherGroup].splice(indexInOtherGroup, 1);
                        }
                    }
                });
            } else {
                // If the node is a leaf node, add it
                // Check if the node is already in the group
                if (!this[group].some(groupNode => groupNode.id === node.data.id)) {
                    this[group].push(node.data);
                }

                // Check if the node is in the other group and remove it if it is
                const indexInOtherGroup = this[otherGroup].findIndex(item => item.id === node.data.id);
                if (indexInOtherGroup !== -1) {
                    this[otherGroup].splice(indexInOtherGroup, 1);
                }
            }

            this[group + 'Updated']();
        },

        pauseStream() {
            console.log('Pausing stream');
            if (this.eventSource) {
                console.log('Closing event source');
                this.eventSource.close();
                this.eventSource = null;
            }
        },
        resumeStream() {
            console.log('Resuming stream');
            if (!this.eventSource) {
                this.eventSource = new EventSource('http://localhost:5000/stream');
                this.eventSource.onmessage = this.handleEvent;
            }
        },
        fragmentsReceived() {
            this.$emit('fragmentsReceived');
        },
        feedbackComplete() {
            this.$emit('feedbackComplete');
        },
        handleEvent(event) {
            const currentEventId = JSON.parse(event.data);
            console.log('Received event:', currentEventId);
            if (currentEventId === null || currentEventId === '') {
                d3.select('#scatterPlot').select('svg').remove();
                this.feedbackComplete();
            } else if (currentEventId !== this.lastEventId) {
                this.lastEventId = currentEventId;
                d3.select('#scatterPlot').select('svg').remove();
                this.fetchData();
            }
        },
        fetchData() {
            fetch('http://localhost:5000/fragments')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data) {
                        //console.log('Data received:', data);
                        this.fragmentData = data;
                        this.fetchSuggestionData();
                    } else {
                        console.log('No data received');
                        this.feedbackComplete();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        },
        fetchSuggestionData() {
            fetch('http://localhost:5000/suggestions')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data) {
                        //console.log('Data received:', data);
                        this.suggestionData = data;
                        this.suggestionDataLoaded(this.suggestionData.length);
                        this.svg = null;
                        this.createChart();
                        this.fragmentsReceived();
                    } else {
                        console.log('No data received');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        },
        fetchPreferences() {
            fetch('http://localhost:5000/given_preferences')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data) {
                        //console.log('Data received:', data);
                        this.preferenceData = data;
                        this.drawPreferences();
                    } else {
                        console.log('No data received');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        },
        updatePreferences(newPreferences) {
            if (newPreferences === null || newPreferences === undefined) {
                return;
            }
            if (this.preferenceData === null || this.preferenceData === undefined) {
                this.preferenceData = [];
            }
            this.preferenceData = this.preferenceData.concat(newPreferences);
            this.drawPreferences();
        },
    },

    watch: {
        group1: {
            handler() {
                this.createIcicleChart();
            },
            deep: true
        },
        group2: {
            handler() {
                this.createIcicleChart();
            },
            deep: true
        },
        numberOfSuggestions: {
            handler() {
                this.$nextTick(() => {
                    this.drawSuggestions();
                    this.previousNumberOfSuggestions = this.numberOfSuggestions;
                });
            },
            deep: true
        },
        beta: {
            handler() {
                this.$nextTick(() => {
                    this.drawSuggestions(true);
                    this.drawPreferences();
                });
            },
            deep: true
        },
        showSuggestions() {
            this.drawSuggestions(true);
        },
        showPreferences() {
            this.drawPreferences();
        },
    }
};
</script>

<style scoped>
.link {
    fill: none;
    stroke: #555;
    stroke-opacity: 0.4;
    stroke-width: 1.5px;
}

.outerLink {
    fill: none;
    stroke: #555;
    stroke-opacity: 0.4;
    stroke-width: 1.5px;
}

.node circle,
.outerNode circle {
    fill: #999;
}

.node text,
.outerNode text {
    font: 10px sans-serif;
    text-anchor: middle;
}
</style>
