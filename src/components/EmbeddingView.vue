<template>
    <div id="scatterPlot">
        <p>EmbeddingView component</p>
    </div>
</template>

<script>
import * as d3 from 'd3';

export default {
    data() {
        return {
            width: 500,
            height: 500,
            margin: { top: 20, right: 20, bottom: 30, left: 40 },
            lastEventId: null,
        };
    },
    methods: {
        handleEvent(event) {
                const currentEventId = JSON.parse(event.data);
                console.log(currentEventId);
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
                        this.createChart(data);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        },
        createChart(data) {
            d3.select('#scatterPlot').select('svg').remove();

            const svg = d3.select('#scatterPlot')
                .append('svg')
                .attr('width', this.width + this.margin.left + this.margin.right)
                .attr('height', this.height + this.margin.top + this.margin.bottom)
                .append('g')
                .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

            const xScale = d3.scaleLinear()
                .domain(d3.extent(data, d => d.x))
                .range([0, this.width]);

            const yScale = d3.scaleLinear()
                .domain(d3.extent(data, d => d.y))
                .range([this.height, 0]);

            svg.selectAll('.dot')
                .data(data)
                .enter().append('circle')
                .attr('class', 'dot')
                .attr('r', 3.5)
                .attr('cx', d => xScale(d.x))
                .attr('cy', d => yScale(d.y));

            svg.append('g')
                .attr('transform', `translate(0,${this.height})`)
                .call(d3.axisBottom(xScale));

            svg.append('g')
                .call(d3.axisLeft(yScale));
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
    },
};
</script>

<style scoped>
#scatterPlot {
    font: 10px sans-serif;
}

.dot {
    fill: #4c78a8;
    stroke: #fff;
    stroke-width: 1.5px;
}
</style>