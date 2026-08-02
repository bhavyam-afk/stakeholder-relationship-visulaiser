"use client";

import { useState, useMemo, useCallback } from "react";
import ForceGraph from "@/components/ForceGraph";
import Sidebar from "@/components/Sidebar";
import FilterPanel from "@/components/FilterPanel";
import Legend from "@/components/Legend";
import stakeholderData from "@/data/stakeholders.json";
import {
  StakeholderNode,
  StakeholderType,
  StakeholderDataset,
} from "@/lib/types";

const ALL_TYPES: StakeholderType[] = [
  "company",
  "government",
  "regulator",
  "competitor",
  "supplier",
  "customer",
  "financier",
  "union",
  "ngo",
  "individual",
];

export default function Home() {
  const data = stakeholderData as StakeholderDataset;

  const [selectedNode, setSelectedNode] = useState<StakeholderNode | null>(
    null
  );
  const [activeFilters, setActiveFilters] = useState<Set<StakeholderType>>(
    () => new Set(ALL_TYPES)
  );

  const stakeholderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.nodes.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts as Record<StakeholderType, number>;
  }, [data.nodes]);

  const handleNodeSelect = useCallback(
    (node: StakeholderNode | null) => {
      setSelectedNode(node);
    },
    []
  );

  const handleToggleFilter = useCallback((type: StakeholderType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  return (
    <main className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" stroke="url(#headerGrad)" strokeWidth="2" />
              <circle cx="14" cy="8" r="2.5" fill="url(#headerGrad)" />
              <circle cx="8" cy="18" r="2.5" fill="url(#headerGrad)" />
              <circle cx="20" cy="18" r="2.5" fill="url(#headerGrad)" />
              <line x1="14" y1="10.5" x2="9" y2="16" stroke="url(#headerGrad)" strokeWidth="1.5" />
              <line x1="14" y1="10.5" x2="19" y2="16" stroke="url(#headerGrad)" strokeWidth="1.5" />
              <line x1="10" y1="18" x2="18" y2="18" stroke="url(#headerGrad)" strokeWidth="1.5" />
              <defs>
                <linearGradient id="headerGrad" x1="0" y1="0" x2="28" y2="28">
                  <stop offset="0%" stopColor="#4A9EFF" />
                  <stop offset="100%" stopColor="#7B68EE" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="header-title">ApexSignal</h1>
            <p className="header-subtitle">Shell plc — Stakeholder Intelligence</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <span className="stat-value">{data.nodes.length}</span>
            <span className="stat-label">Stakeholders</span>
          </div>
          <div className="header-stat">
            <span className="stat-value">{data.edges.length}</span>
            <span className="stat-label">Relationships</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="app-content">
        {/* Left Panel: Filters */}
        <aside className="app-left-panel">
          <FilterPanel
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            stakeholderCounts={stakeholderCounts}
          />
          <Legend />
        </aside>

        {/* Center: Graph */}
        <div className="app-graph-area">
          <ForceGraph
            nodes={data.nodes}
            edges={data.edges}
            selectedNodeId={selectedNode?.id || null}
            onNodeSelect={handleNodeSelect}
            activeFilters={activeFilters}
          />
        </div>

        {/* Right Panel: Sidebar */}
        <aside className="app-right-panel">
          <Sidebar
            selectedNode={selectedNode}
            edges={data.edges}
            nodes={data.nodes}
            onNodeSelect={handleNodeSelect}
          />
        </aside>
      </div>
    </main>
  );
}
