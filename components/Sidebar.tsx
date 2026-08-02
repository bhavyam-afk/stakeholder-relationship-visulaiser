"use client";

import {
  StakeholderNode,
  RelationshipEdge,
} from "@/lib/types";
import {
  STAKEHOLDER_COLOURS,
  STATUS_COLOURS,
  TREND_DISPLAY,
  TYPE_LABELS,
  RELATIONSHIP_TYPE_LABELS,
  computeTrend,
  getNodeRadius,
} from "@/lib/utils";

interface SidebarProps {
  selectedNode: StakeholderNode | null;
  edges: RelationshipEdge[];
  nodes: StakeholderNode[];
  onNodeSelect: (node: StakeholderNode | null) => void;
}

export default function Sidebar({
  selectedNode,
  edges,
  nodes,
  onNodeSelect,
}: SidebarProps) {
  if (!selectedNode) {
    return (
      <div className="sidebar sidebar-empty">
        <div className="sidebar-empty-content">
          <div className="sidebar-empty-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
          <h3>Select a Stakeholder</h3>
          <p>Click on any node in the graph to view detailed relationship intelligence.</p>
        </div>
      </div>
    );
  }

  // Get all relationships for the selected node
  const nodeEdges = edges.filter(
    (e) => e.source === selectedNode.id || e.target === selectedNode.id
  );

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="sidebar sidebar-active">
      {/* Header */}
      <div className="sidebar-header">
        <button
          className="sidebar-close"
          onClick={() => onNodeSelect(null)}
          aria-label="Close sidebar"
        >
          ✕
        </button>
        <div
          className="sidebar-node-indicator"
          style={{ backgroundColor: STAKEHOLDER_COLOURS[selectedNode.type] }}
        />
        <h2 className="sidebar-title">{selectedNode.name}</h2>
        <div className="sidebar-meta">
          <span
            className="sidebar-badge"
            style={{
              backgroundColor: `${STAKEHOLDER_COLOURS[selectedNode.type]}22`,
              color: STAKEHOLDER_COLOURS[selectedNode.type],
              borderColor: `${STAKEHOLDER_COLOURS[selectedNode.type]}44`,
            }}
          >
            {TYPE_LABELS[selectedNode.type]}
          </span>
          <span className="sidebar-influence">
            {"●".repeat(selectedNode.influence)}
            {"○".repeat(5 - selectedNode.influence)}
            <span className="sidebar-influence-label">Influence</span>
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="sidebar-section">
        <p className="sidebar-description">{selectedNode.description}</p>
      </div>

      {/* Relationships */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">
          Relationships
          <span className="sidebar-count">{nodeEdges.length}</span>
        </h3>
        <div className="sidebar-relationships">
          {nodeEdges.map((edge, i) => {
            const otherId =
              edge.source === selectedNode.id ? edge.target : edge.source;
            const otherNode = nodeMap.get(otherId);
            if (!otherNode) return null;

            const trend = computeTrend(edge.relationshipHistory);
            const trendInfo = TREND_DISPLAY[trend];

            // For directed relationships, determine the readable direction
            const isOutgoing = edge.direction === "directed" && selectedNode.id === edge.source;
            const isIncoming = edge.direction === "directed" && selectedNode.id === edge.target;
            const isDirected = edge.direction === "directed";

            // Build source/target display names for direction row
            const sourceName = isOutgoing ? selectedNode.name : otherNode.name;
            const targetName = isOutgoing ? otherNode.name : selectedNode.name;

            return (
              <div
                key={i}
                className="relationship-card"
                onClick={() => onNodeSelect(otherNode)}
              >
                <div className="relationship-card-header">
                  <div
                    className="relationship-node-dot"
                    style={{
                      backgroundColor: STAKEHOLDER_COLOURS[otherNode.type],
                    }}
                  />
                  <span className="relationship-node-name">
                    {isIncoming && "← "}
                    {otherNode.name}
                    {isOutgoing && " →"}
                  </span>
                  <span
                    className="relationship-status-badge"
                    style={{
                      backgroundColor: `${STATUS_COLOURS[edge.status]}18`,
                      color: STATUS_COLOURS[edge.status],
                      borderColor: `${STATUS_COLOURS[edge.status]}40`,
                    }}
                  >
                    {edge.status}
                  </span>
                </div>

                <div className="relationship-card-details">
                  <div className="relationship-detail">
                    <span className="relationship-detail-label">Type</span>
                    <span className="relationship-detail-value">
                      {RELATIONSHIP_TYPE_LABELS[edge.relationshipType]}
                    </span>
                  </div>
                  <div className="relationship-detail">
                    <span className="relationship-detail-label">Strength</span>
                    <div className="relationship-strength-bar">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className="strength-segment"
                          style={{
                            backgroundColor:
                              level <= edge.strength
                                ? STATUS_COLOURS[edge.status]
                                : "rgba(255,255,255,0.1)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="relationship-detail">
                    <span className="relationship-detail-label">Trend</span>
                    <span
                      className="relationship-trend"
                      style={{ color: trendInfo.colour }}
                    >
                      {trendInfo.symbol} {trendInfo.label}
                    </span>
                  </div>
                </div>

                {/* Direction indicator for directed relationships */}
                {isDirected && (
                  <div className="relationship-direction">
                    <span className="direction-label">Direction</span>
                    <span className="direction-arrow">
                      {sourceName} → {targetName}
                    </span>
                  </div>
                )}

                {edge.note && (
                  <p className="relationship-note">{edge.note}</p>
                )}

                {/* Mini timeline — Status over time */}
                <div className="relationship-timeline-container">
                  <div className="relationship-timeline-label">Status over time</div>
                  <div className="relationship-timeline">
                    {edge.relationshipHistory.map((snapshot, j) => (
                      <div key={j} className="timeline-dot-wrapper">
                        <div
                          className="timeline-dot"
                          style={{
                            backgroundColor: STATUS_COLOURS[snapshot.status],
                          }}
                          title={`${snapshot.timestamp}: ${snapshot.status}`}
                        />
                        {j < edge.relationshipHistory.length - 1 && (
                          <div className="timeline-connector" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
