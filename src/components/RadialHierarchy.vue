<template>
    <div ref="chartContainer"></div>
</template>

<script>
import * as d3 from "d3";

export default {
    name: "RadialHierarchy",
    mounted() {
        this.createChart();
    },
    methods: {
        async createChart() {
            const response = await fetch('clustered_fragments.json');
            const data = await response.json();
            const depth = d3.hierarchy(data).height;
            console.log('depth', depth);

            const width = 1000;
            const height = width;
            const startRadius = width / 8 / depth;
            const innerRadius = startRadius * 2 * depth;
            const outerRadius = innerRadius + (startRadius * 2 * (depth - 1));
            const tree = d3.cluster().size([2 * Math.PI, innerRadius - startRadius]);

            const root = d3.hierarchy(data);
            tree(root);

            const leafNodes = root.leaves();
            const leafNodeWidth = 2 * Math.PI / leafNodes.length;

            const svg = d3.select(this.$refs.chartContainer).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width / 2},${height / 2})`);

            this.createRadialTreeLayout(root, svg, startRadius, innerRadius, leafNodeWidth);
            this.createIcicleChart(data, svg, innerRadius, outerRadius, leafNodeWidth);
        },
        createRadialTreeLayout(root, svg, startRadius, innerRadius, leafNodeWidth) {
            // Set the x value of each leaf node
            let leafNodeIndex = 0;
            root.eachAfter(node => {
                if (!node.children) {
                    node.x = leafNodeIndex * leafNodeWidth + (leafNodeWidth / 2);
                    leafNodeIndex++;
                }
            });

            // Recompute the x value of non-leaf nodes
            root.eachAfter(node => {
                if (node.children) {
                    const firstChildX = node.children[0].x;
                    const lastChildX = node.children[node.children.length - 1].x;
                    node.x = (firstChildX + lastChildX) / 2;
                }
            });

            const links = root.links().filter(d => d.source.depth > 0);
            const descendants = root.descendants().filter(d => d.depth > 0);

            svg.selectAll(".link")
                .data(links)
                .enter().append("path")
                .attr("class", "link")
                .attr("d", d3.linkRadial()
                    .angle(d => d.x)
                    .radius(d => startRadius + d.y));

            const node = svg.selectAll(".node")
                .data(descendants)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", d => `
                    rotate(${d.x * 180 / Math.PI - 90})
                    translate(${startRadius + d.y},0)
                `);

            node.append("circle")
                .attr("r", 2);

        },
        createIcicleChart(data, svg, innerRadius, outerRadius, leafNodeWidth) {
            // Create the mirrored outer tree layout
            const reversedData = this.reverseHierarchy(data);
            const outerTree = d3.tree().size([2 * Math.PI, outerRadius - innerRadius]);

            const outerRoot = d3.hierarchy(reversedData);
            outerTree(outerRoot);

            let leafNodeIndex = 0;
            outerRoot.eachAfter(outerNode => {
                if (outerNode.children) {
                    outerNode.x0 = outerNode.children[0].x0;
                    outerNode.x1 = outerNode.children[outerNode.children.length - 1].x1;
                } else {
                    outerNode.x0 = leafNodeIndex * leafNodeWidth;
                    outerNode.x1 = (leafNodeIndex + 1) * leafNodeWidth;
                    leafNodeIndex++;
                }
                const depth = outerRoot.height - outerNode.depth; // Reverse the depth
                outerNode.y0 = innerRadius + depth * (outerRadius - innerRadius) / outerRoot.height;
                outerNode.y1 = innerRadius + (depth + 1) * (outerRadius - innerRadius) / outerRoot.height;
            });

            const outerDescendants = outerRoot.descendants().filter(d => d.depth > 0);

            const outerNode = svg.selectAll(".outerNode")
                .data(outerDescendants)
                .enter().append("g");

            // Define the color scale
            const colorScale = d3.scaleOrdinal()
                .domain([0, 1, 2, 3])
                .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]);

            const arc = d3.arc()
                .startAngle(d => d.x0)
                .endAngle(d => d.x1)
                .innerRadius(d => d.y0)
                .outerRadius(d => d.y1);

            outerNode.append("path")
                .attr("fill", d => colorScale(d.data.level))
                .attr("opacity", .5)
                .attr("stroke", "black")
                .attr("d", arc);

        },
        reverseHierarchy(data) {
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
            const reversedData = reverseNode(data);
            return reversedData;
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
