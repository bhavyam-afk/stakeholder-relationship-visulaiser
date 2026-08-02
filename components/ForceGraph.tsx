"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import {
  StakeholderNode,
  RelationshipEdge,
  SimulationNode,
  StakeholderType,
} from "@/lib/types";
import {
  STAKEHOLDER_COLOURS,
  STATUS_COLOURS,
  getNodeRadius,
} from "@/lib/utils";

interface ForceGraphProps {
  nodes: StakeholderNode[];
  edges: RelationshipEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (node: StakeholderNode | null) => void;
  activeFilters: Set<StakeholderType>;
}

export default function ForceGraph({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
  activeFilters,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, undefined> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Filter nodes and edges
  const filteredNodes = nodes.filter((n) => activeFilters.has(n.type));
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  // Get connected node IDs for highlighting
  const getConnectedIds = useCallback(
    (nodeId: string): Set<string> => {
      const connected = new Set<string>();
      connected.add(nodeId);
      filteredEdges.forEach((e) => {
        if (e.source === nodeId) connected.add(e.target);
        if (e.target === nodeId) connected.add(e.source);
      });
      return connected;
    },
    [filteredEdges]
  );

  const connectedIds = selectedNodeId
    ? getConnectedIds(selectedNodeId)
    : null;

  // Main D3 rendering
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0)
      return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Create simulation nodes (deep copy)
    const simNodes: SimulationNode[] = filteredNodes.map((n) => ({
      ...n,
    }));
    const simEdges = filteredEdges.map((e) => ({
      source: e.source,
      target: e.target,
      relationshipType: e.relationshipType,
      direction: e.direction,
      strength: e.strength,
      status: e.status,
      relationshipHistory: e.relationshipHistory,
      note: e.note,
    }));

    // Define arrowhead markers
    const defs = svg.append("defs");
    
    // Glow filter for selected node
    const glowFilter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Arrow markers for each status color
    Object.entries(STATUS_COLOURS).forEach(([status, color]) => {
      defs
        .append("marker")
        .attr("id", `arrow-${status}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", color);

      // Dimmed version
      defs
        .append("marker")
        .attr("id", `arrow-${status}-dim`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", color)
        .attr("opacity", 0.15);
    });

    // Zoom container
    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Center the view initially
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2);
    svg.call(zoom.transform, initialTransform);

    // Force simulation
    const simulation = d3
      .forceSimulation<SimulationNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink(simEdges)
          .id((d: d3.SimulationNodeDatum) => (d as SimulationNode).id)
          .distance((d) => {
            const edge = d as unknown as { strength: number };
            return 250 - edge.strength * 15;
          })
      )
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(0, 0))
      .force(
        "collide",
        d3.forceCollide<SimulationNode>().radius((d) => getNodeRadius(d.influence) + 25)
      )
      .force("x", d3.forceX(0).strength(0.03))
      .force("y", d3.forceY(0).strength(0.03));

    simulationRef.current = simulation;

    // Draw edges
    const linkGroup = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(simEdges)
      .enter()
      .append("line")
      .attr("stroke", (d) => STATUS_COLOURS[d.status])
      .attr("stroke-width", (d) => Math.max(1, d.strength * 0.8))
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", (d) =>
        d.direction === "directed" ? `url(#arrow-${d.status})` : null
      );

    // Draw nodes
    const nodeGroup = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(simNodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, SimulationNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            // Intentionally not setting d.fx and d.fy to null so the node stays pinned
          })
      )
      .on("dblclick", (event, d) => {
        // Allow user to unpin node by double clicking
        d.fx = null;
        d.fy = null;
      });

    // Node circles
    nodeGroup
      .append("circle")
      .attr("r", (d) => getNodeRadius(d.influence))
      .attr("fill", (d) => STAKEHOLDER_COLOURS[d.type])
      .attr("stroke", (d) =>
        d.id === selectedNodeId ? "#ffffff" : "rgba(255,255,255,0.2)"
      )
      .attr("stroke-width", (d) => (d.id === selectedNodeId ? 3 : 1.5))
      .attr("filter", (d) => (d.id === selectedNodeId ? "url(#glow)" : null));

    // Labels (hidden by default, shown on hover or selection)
    const labels = nodeGroup
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => getNodeRadius(d.influence) + 16)
      .attr("fill", "#e0e0e0")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("pointer-events", "none")
      .attr("opacity", (d) => {
        if (d.id === selectedNodeId) return 1;
        if (connectedIds && connectedIds.has(d.id)) return 0.9;
        return 0;
      });

    // Hover interactions
    nodeGroup
      .on("mouseenter", function (event, d) {
        if (d.id !== selectedNodeId) {
          d3.select(this)
            .select("circle")
            .transition()
            .duration(200)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2.5);
          d3.select(this)
            .select("text")
            .transition()
            .duration(200)
            .attr("opacity", 1);
        }
      })
      .on("mouseleave", function (event, d) {
        if (d.id !== selectedNodeId) {
          const isConnected = connectedIds && connectedIds.has(d.id);
          d3.select(this)
            .select("circle")
            .transition()
            .duration(200)
            .attr("stroke", isConnected ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)")
            .attr("stroke-width", 1.5);
          d3.select(this)
            .select("text")
            .transition()
            .duration(200)
            .attr("opacity", isConnected ? 0.9 : 0);
        }
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeSelect(d.id === selectedNodeId ? null : d);
      });

    // Click on background to deselect
    svg.on("click", () => {
      onNodeSelect(null);
    });

    // Apply contextual highlighting
    if (connectedIds) {
      nodeGroup
        .select("circle")
        .attr("opacity", (d) => (connectedIds.has(d.id) ? 1 : 0.12));
      labels.attr("opacity", (d) => {
        if (d.id === selectedNodeId) return 1;
        if (connectedIds.has(d.id)) return 0.9;
        return 0;
      });
      linkGroup.attr("stroke-opacity", (d) => {
        const src =
          typeof d.source === "object" ? (d.source as SimulationNode).id : d.source;
        const tgt =
          typeof d.target === "object" ? (d.target as SimulationNode).id : d.target;
        return connectedIds.has(src) && connectedIds.has(tgt) ? 0.8 : 0.06;
      })
      .attr("marker-end", (d) => {
        const src =
          typeof d.source === "object" ? (d.source as SimulationNode).id : d.source;
        const tgt =
          typeof d.target === "object" ? (d.target as SimulationNode).id : d.target;
        const isHighlighted = connectedIds.has(src) && connectedIds.has(tgt);
        if (d.direction !== "directed") return null;
        return isHighlighted
          ? `url(#arrow-${d.status})`
          : `url(#arrow-${d.status}-dim)`;
      });
    }

    // Simulation tick
    simulation.on("tick", () => {
      linkGroup
        .attr("x1", (d) => (d.source as unknown as SimulationNode).x!)
        .attr("y1", (d) => (d.source as unknown as SimulationNode).y!)
        .attr("x2", (d) => (d.target as unknown as SimulationNode).x!)
        .attr("y2", (d) => (d.target as unknown as SimulationNode).y!);

      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredEdges, selectedNodeId, connectedIds, dimensions, onNodeSelect]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}
