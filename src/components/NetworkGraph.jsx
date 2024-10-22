// src/components/NetworkGraph.js

import * as React from "react";
import * as d3 from "d3";

export async function NetworkGraph(connections, metrics) {
    const width = 1000;
    const height = 1000;
    const margin = { top: 0, right: 300, bottom: 0, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const nodeInfo = {};
    metrics.forEach(row => {
        const task = row.task;
        nodeInfo[task] = row;
    });

    const types = Array.from(new Set(connections.map(d => d.type)));
    const nodes = Array.from(new Set(connections.flatMap(l => [l.source, l.target])), id => ({ id }));
    const links = connections.map(d => Object.create(d));

    // Determine node order based on dependencies in connections

    function calculateNodeLevels() {
        const nodeDependencies = new Map(nodes.map(node => [node.id, new Set()]));
        const nodeDependents = new Map(nodes.map(node => [node.id, new Set()]));

        links.forEach(link => {
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;

            if (!nodeDependencies.has(targetId)) nodeDependencies.set(targetId, new Set());
            if (!nodeDependents.has(sourceId)) nodeDependents.set(sourceId, new Set());

            nodeDependencies.get(targetId).add(sourceId);
            nodeDependents.get(sourceId).add(targetId);
        });

        const levels = new Map();
        const visited = new Set();

        function assignLevel(nodeId, level = 0) {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const currentLevel = Math.max(
                level,
                ...Array.from(nodeDependencies.get(nodeId))
                    .map(depId => (levels.get(depId) || 0) + 1)
            );

            levels.set(nodeId, currentLevel);

            nodeDependents.get(nodeId).forEach(depId => {
                assignLevel(depId, currentLevel + 1);
            });
        }

        nodes.forEach(node => {
            if (nodeDependencies.get(node.id).size === 0) {
                assignLevel(node.id, 0);
            }
        });

        nodes.forEach(node => {
            if (!levels.has(node.id)) {
                assignLevel(node.id);
            }
        });

        return levels;
    }

    const nodeLevels = calculateNodeLevels();
    const maxLevel = Math.max(...nodeLevels.values());

    const levelHeight = chartHeight / (maxLevel + 2);
    const verticalSpacing = levelHeight;

    const linkForce = d3.forceLink(links).id(d => d.id).distance(100);
    const chargeForce = d3.forceManyBody().strength(-500);

    const simulation = d3.forceSimulation(nodes)
        .force("link", linkForce)
        .force("charge", chargeForce)
        .force("x", d3.forceX(chartWidth / 2).strength(0.1))
        .force("y", d3.forceY(d => {
            const level = nodeLevels.get(d.id);
            return (level + 1) * verticalSpacing;
        }).strength(0.3));

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto; font: 14px sans-serif;");

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Defining colours for legend and connections

    const customColors = {
        "No Poverty": "#E5243B",
        "Zero Hunger": "#DDA63A",
        "Good Health and Well-Being": "#4C9F38",
        "Quality Education": "#C5192D",
        "Gender Equality": "#FF3A21",
        "Clean Water and Sanitation": "#2AADD2",
        "Affordable and Clean Energy": "#F9C802",
        "Climate Action": "#3F7E44",
        "Life on Land": "#56C02B",
        "Sustainable Cities and Communities": "#FFA600",
        "Other": "#A81D11",
        "Life Below Water": "#1F97D4",
        "Decent Work and Economic Growth": "#CF4A22",
    };

    const color = d3.scaleOrdinal()
        .domain(types)
        .range(types.map(type => customColors[type]));

    chart.append("defs").selectAll("marker")
        .data(types)
        .join("marker")
        .attr("id", d => `arrow-${d.replace(/[\s&]/g, "_")}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", -0.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", d => customColors[d])
        .attr("d", "M0,-5L10,0L0,5");

    const link = chart.append("g")
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("stroke", d => customColors[d.type])
        .attr("marker-end", d => `url(#arrow-${d.type.replace(/[\s&]/g, "_")})`);

    const node = chart.append("g")
        .attr("fill", "currentColor")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(drag(simulation))
        .on("click", handleNodeClick);

    node.append("circle")
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("r", 5);

    node.append("text")
        .attr("x", 10)
        .attr("y", "0.31em")
        .text(d => d.id)
        .clone(true).lower()
        .attr("fill", "none")
        .attr("stroke", "none")
        .attr("stroke-width", 3);

    // Handling animation to reveal further information upon node click

    function handleNodeClick(event, d) {
        const nodeData = nodeInfo[d.id];
        if (nodeData) {
            animateNodeExpansion(d, nodeData);
        }
    }

    function animateNodeExpansion(node, data) {

        d3.selectAll(".node-panel").remove();

        const panelWidth = 600;
        const panelHeight = 200;

        const panelGroup = svg.append("g")
            .attr("class", "node-panel")
            .attr("transform", `translate(${node.x}, ${node.y})`);


        const panel = panelGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 0)
            .attr("height", 0)
            .attr("rx", 15)
            .attr("ry", 15)
            .attr("fill", "white")
            .attr("stroke", "black")
            .transition()
            .duration(500)
            .attr("width", panelWidth)
            .attr("height", panelHeight);

        panel.on("end", () => {
            const textGroup = panelGroup.append("g")
                .attr("transform", `translate(10, 20)`);

            const nodeTitle = data.task;

            textGroup.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("fill", "black")
                .style("font-weight", "bold")
                .text(nodeTitle);

            const filteredKeys = Object.keys(data).filter(key => key !== 'task');

            filteredKeys.forEach((key, index) => {
                const line = textGroup.append("text")
                    .attr("x", 0)
                    .attr("y", (index + 1) * 20)
                    .attr("fill", "black");

                line.append("tspan")
                    .text(`${key}: `)
                    .style("font-weight", "bold");

                line.append("tspan")
                    .text(`${data[key]}`);

                wrapText(line, panelWidth - 20);
            });
        });
    }

    function wrapText(text, width) {
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1;
        const y = text.attr("y");
        let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y);

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", ++lineNumber * lineHeight + +y).text(word);
            }
        }
    }

    // Handling dragging of individual nodes - possibly unnecessary since dependencies are already considered?

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    // Reset Button
    const resetButton = svg.append("g")
        .attr("cursor", "pointer")
        .attr("transform", `translate(10, 10)`)
        .on("click", resetLayout);

    resetButton.append("rect")
        .attr("width", 80)
        .attr("height", 30)
        .attr("fill", "white")
        .attr("stroke", "#666")
        .attr("rx", 5);

    resetButton.append("text")
        .attr("x", 40)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .text("Reset");

    function resetLayout() {
        simulation
            .force("y", d3.forceY(d => {
                const level = nodeLevels.get(d.id);
                return (level + 1) * verticalSpacing;
            }).strength(0.3))
            .alpha(1)
            .restart();
    }

    function linkArc(d) {
        const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
        return `
            M${d.source.x},${d.source.y}
            A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
          `;
    }

    simulation.on("tick", () => {
        link.attr("d", linkArc);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Create legend
    const legendData = Object.keys(customColors);
    const legendItemHeight = 25;
    const legendPadding = 5;

    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 20}, ${height / 2 - (legendData.length * (legendItemHeight + legendPadding)) / 2})`) // Positioned to the right, vertically centered
        .attr("font-family", "sans-serif")
        .attr("font-size", 12);

    legendData.forEach((d, i) => {
        const legendItem = legend.append("g")
            .attr("transform", `translate(100, ${i * (legendItemHeight + legendPadding)})`);

        legendItem.append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", customColors[d]);

        legendItem.append("text")
            .attr("x", 28)
            .attr("y", 10)
            .attr("dy", "0.35em")
            .text(d)
            .attr("fill", "white");
    });

    return Object.assign(svg.node(), { scales: { color } });
};


export default NetworkGraph;
