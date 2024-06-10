<template>
    <div id="scatterPlot">
        <div v-if="data === null">
            <p>Loading...</p>
        </div>
    </div>
</template>

<script>
import * as d3 from 'd3';

export default {
    data() {
        const size = window.innerHeight * 0.8;
        return {
            width: size,
            height: size,
            margin: { top: 20, right: 20, bottom: 30, left: 40 },
            lastEventId: null,
            data: null,
            group1: [],
            group2: [],
            connections: [],
        };
    },
    methods: {
        updateConnections(newConnections) {
            this.connections = newConnections;
            console.log('Connections updated:', this.connections);
            this.createChart();
        },
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
                    if (data && data.length > 0) {
                        this.data = data;
                        this.createChart(data);
                        this.fragmentsReceived();
                    } else if (data && data.length === 0) {
                        console.log('No data received');
                        this.feedbackComplete();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        },
        createChart() {
            d3.select('#scatterPlot').select('svg').remove();

            const svg = d3.select('#scatterPlot')
                .append('svg')
                .attr('width', this.width + this.margin.left + this.margin.right)
                .attr('height', this.height + this.margin.top + this.margin.bottom)
                .append('g')
                .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

            const xScale = d3.scaleLinear()
                .domain(d3.extent(this.data, d => d.x))
                .range([0, this.width]);

            const yScale = d3.scaleLinear()
                .domain(d3.extent(this.data, d => d.y))
                .range([this.height, 0]);

            const line = d3.line()
                .x(d => xScale(d.x))
                .y(d => yScale(d.y));

            this.connections.forEach(connection => {
                const point1 = this.data.find(d => d.id === connection[0]);
                const point2 = this.data.find(d => d.id === connection[1]);

                if (point1 && point2) {
                    svg.append('path')
                        .datum([point1, point2])
                        .attr('fill', 'none')
                        .attr('stroke', 'lightgray')
                        .attr('stroke-width', 1.5)
                        .attr('d', line);
                }
            });

            svg.selectAll('.dot')
                .data(this.data)
                .enter().append('circle')
                .attr('class', d => {
                    if (this.group1.find(item => item.id === d.id)) {
                        return 'dot group1';
                    } else if (this.group2.find(item => item.id === d.id)) {
                        return 'dot group2';
                    } else {
                        return 'dot';
                    }
                })
                .attr('r', 3.5)
                .attr('cx', d => xScale(d.x))
                .attr('cy', d => yScale(d.y))
                .attr('data-id', d => d.id);

            svg.append('g')
                .attr('transform', `translate(0,${this.height})`)
                .call(d3.axisBottom(xScale));

            svg.append('g')
                .call(d3.axisLeft(yScale));

            // Create a single brush
            const brush = d3.brush()
                .extent([[0, 0], [this.width, this.height]])
                .filter((event) => event.button === 0 || event.button === 2)
                .on("start", (event) => {
                    // Set the fill style of the brush's selection rectangle based on the mouse button
                    const selectionColor = event.sourceEvent.button === 0 ? 'blue' : 'orange';
                    d3.select('.brush .selection').style('fill', selectionColor);
                })
                .on("end", (event) => {
                    if (!event.sourceEvent) return; // Only transition after input.
                    if (!event.selection) return; // Ignore empty selections.

                    const [[x0, y0], [x1, y1]] = event.selection;

                    const group = event.sourceEvent.button === 0 ? this.group1 : this.group2;
                    const otherGroup = event.sourceEvent.button === 0 ? this.group2 : this.group1;

                    if (!event.sourceEvent.ctrlKey) {
                        group.splice(0, group.length);
                    }

                    this.data.forEach(d => {
                        if (x0 <= xScale(d.x) && xScale(d.x) <= x1 && y0 <= yScale(d.y) && yScale(d.y) <= y1) {
                            const indexInOtherGroup = otherGroup.findIndex(item => item.id === d.id);
                            if (indexInOtherGroup !== -1) {
                                otherGroup.splice(indexInOtherGroup, 1);
                            }
                            group.push(d);

                            if (event.sourceEvent.button === 0) {
                                this.group1Updated();
                            } else {
                                this.group2Updated();
                            }
                        }
                    });
                });

            // Add the brush to the SVG
            svg.append("g")
                .attr("class", "brush")
                .call(brush);
        },
        resumeStream() {
            if (!this.eventSource) {
                this.eventSource = new EventSource('http://localhost:5000/stream');
                this.eventSource.onmessage = this.handleEvent;
            }
        },
    },
    mounted() {
        this.resumeStream();
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    },
    beforeUnmount() {
        window.removeEventListener('contextmenu', this.preventContextMenu);
    },
    watch: {
        group1: {
            handler() {
                this.createChart();
            },
            deep: true
        },
        group2: {
            handler() {
                this.createChart();
            },
            deep: true
        }
    },
};
</script>

<style>
#scatterPlot {
    font: 10px sans-serif;
}

.dot {
    fill: black;
}

.dot.group1 {
    fill: blue;
}

.dot.group2 {
    fill: orange;
}
</style>