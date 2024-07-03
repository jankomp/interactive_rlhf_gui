<template>
    <div ref="chartContainer"></div>
</template>

<script>
import * as d3 from "d3";

export default {
    name: "RadialHierarchy",
    data() {
        return {
            fragmentData: null,
            suggestionData: null,
            group1: [],
            group2: [],
            width: 1000,
            height: 1000,
            root: null,
            svg: null,
            startRadius: null,
            innerRadius: null,
            outerRadius: null,
            leafNodeWidth: null,
        };
    },
    mounted() {
        //this.resumeStream();
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        this.createChart();
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
        async createChart() {
            const response = await fetch('clustered_fragments.json');
            this.fragmentData = await response.json();
            //console.log(this.fragment_data);
            const response2 = await fetch('active_learning_suggestions.json');
            this.suggestionData = await response2.json();
            //console.log(this.suggestion_data);
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
                this.createEdgeBundles();
            }
        },
        createEdgeBundles() {
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

            const descendants = this.root.descendants().filter(d => d.depth > 0);
            const maxVariance = this.suggestionData[0].var;

            // Create a radial line generator with a bundling factor of 0.85
            const line = d3.lineRadial()
                .curve(d3.curveBundle.beta(0.85))
                .radius(d => this.startRadius + d.y)
                .angle(d => d.x);

            // Create the edge bundles
            const edgeBundles = this.suggestionData.map(sug => {
                const node1 = descendants.find(node => node.data.id === sug.id1);
                const node2 = descendants.find(node => node.data.id === sug.id2);
                const estVar = sug.var / maxVariance;

                // Find the common ancestor of node1 and node2
                let ancestor = node1;
                while (!ancestor.descendants().includes(node2)) {
                    ancestor = ancestor.parent;
                }

                // Create a list of points from node1, up to the ancestor, and then down to node2
                const points = [...getAncestors(node1, ancestor), ancestor, ...getDescendants(node2, ancestor)].map(node => {
                    return { x: node.x, y: node.y, opacity: estVar };
                });

                return points;
            });

            // Draw the edge bundles
            this.svg.selectAll(".link")
                .data(edgeBundles)
                .enter().append("path")
                .attr("class", "link")
                .attr("d", line)
                .attr("stroke", "#555")
                .attr("stroke-opacity", d => d[0].opacity)
                .attr("stroke-width", 0.2)
                .attr("fill", "none");

            // Helper functions to get the ancestors and descendants of a node
            function getAncestors(node, ancestor) {
                const ancestors = [];
                while (node !== ancestor) {
                    ancestors.push(node);
                    node = node.parent;
                }
                return ancestors;
            }

            function getDescendants(node, ancestor) {
                const descendants = [];
                while (node !== ancestor) {
                    descendants.unshift(node);
                    node = node.parent;
                }
                return descendants;
            }
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
                            return "blue";
                        } else if (this.group2.some(node => node.id === d.data.id)) {
                            return "orange";
                        } else {
                            return "white";
                        }
                    } else {
                        const { group1Count, group2Count, noGroupCount } = this.countLeafDescendantsInGroups(d);
                        const totalCount = group1Count + group2Count + noGroupCount;

                        const colorWhite = d3.rgb("white");
                        const colorBlue = d3.rgb("blue");
                        const colorOrange = d3.rgb("orange");

                        return d3.rgb(
                            (colorWhite.r * noGroupCount + colorBlue.r * group1Count + colorOrange.r * group2Count) / totalCount,
                            (colorWhite.g * noGroupCount + colorBlue.g * group1Count + colorOrange.g * group2Count) / totalCount,
                            (colorWhite.b * noGroupCount + colorBlue.b * group1Count + colorOrange.b * group2Count) / totalCount
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
            if (currentEventId === null || currentEventId === '') {
                d3.select('#scatterPlot').select('svg').remove();
                this.feedbackComplete();
            } else if (currentEventId !== this.lastEventId) {
                this.lastEventId = currentEventId;
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
                        console.log('Data received:', data);
                        this.fragmentData = data;
                        this.createChart();
                        this.fragmentsReceived();
                    } else {
                        console.log('No data received');
                        this.feedbackComplete();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
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
        }
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
