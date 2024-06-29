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
            console.log(data);

            const width = 1080;
            const height = 1080;
            const innerRadius = 320;  // Radius for the inner tree
            const startRadius = 40;   // Starting radius for the inner tree
            const outerRadius = 560; // Radius for the outer mirrored tree

            const tree = d3.tree().size([2 * Math.PI, innerRadius - startRadius]);

            const root = d3.hierarchy(data);
            tree(root);

            const svg = d3.select(this.$refs.chartContainer).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width / 2},${height / 2})`);

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
                .attr("r", 5);

            node.append("text")
                .attr("dy", "0.31em")
                .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
                .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
                .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
                .text(d => d.data.name)
                .clone(true).lower()
                .attr("stroke", "white");

            node.append("text")
                .attr("dy", "0.31em")
                .attr("x", 0)
                .attr("text-anchor", "middle")
                .attr("fill", "red")
                .text(d => d.data.id);

            // Create the mirrored outer tree layout
            const reversedData = this.reverseHierarchy(data);
            const outerTree = d3.tree().size([2 * Math.PI, outerRadius - innerRadius]);

            const outerRoot = d3.hierarchy(reversedData);
            outerTree(outerRoot);

            const outerLinks = outerRoot.links().filter(d => d.source.depth > 0);
            const outerDescendants = outerRoot.descendants().filter(d => d.depth > 0);

            svg.selectAll(".outerLink")
                .data(outerLinks)
                .enter().append("path")
                .attr("class", "outerLink")
                .attr("d", d3.linkRadial()
                    .angle(d => d.x)
                    .radius(d => innerRadius + (outerRadius - innerRadius - d.y)));

            const outerNode = svg.selectAll(".outerNode")
                .data(outerDescendants)
                .enter().append("g")
                .attr("class", "outerNode")
                .attr("transform", d => `
                    rotate(${d.x * 180 / Math.PI - 90})
                    translate(${innerRadius + (outerRadius - innerRadius - d.y)},0)
                `);

            outerNode.append("circle")
                .attr("r", 5);

            outerNode.append("text")
                .attr("dy", "0.31em")
                .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
                .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
                .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
                .text(d => d.data.name)
                .clone(true).lower()
                .attr("stroke", "white");

            outerNode.append("text")
                .attr("dy", "0.31em")
                .attr("x", 0)
                .attr("text-anchor", "middle")
                .attr("fill", "red")
                .text(d => d.data.id);
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
