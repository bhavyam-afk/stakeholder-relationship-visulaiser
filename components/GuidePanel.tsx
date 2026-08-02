"use client";

import { STAKEHOLDER_COLOURS, STATUS_COLOURS, TYPE_LABELS } from "@/lib/utils";
import { StakeholderType } from "@/lib/types";

interface GuidePanelProps {
  activeFilters: Set<StakeholderType>;
  onToggleFilter: (type: StakeholderType) => void;
  stakeholderCounts: Record<StakeholderType, number>;
}

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

export default function GuidePanel({
  activeFilters,
  onToggleFilter,
  stakeholderCounts,
}: GuidePanelProps) {
  return (
    <div className="guide-panel">
      {/* ── Filter by Stakeholder Type ── */}
      <section className="guide-section">
        <h3 className="guide-section-title">Filter by Type</h3>
        <p className="guide-hint">Click to show/hide stakeholder categories on the graph.</p>
        <div className="filter-list">
          {ALL_TYPES.map((type) => {
            const count = stakeholderCounts[type] || 0;
            if (count === 0) return null;
            const isActive = activeFilters.has(type);

            return (
              <button
                key={type}
                className={`filter-item ${isActive ? "filter-active" : "filter-inactive"}`}
                onClick={() => onToggleFilter(type)}
              >
                <span
                  className="filter-dot"
                  style={{
                    backgroundColor: isActive
                      ? STAKEHOLDER_COLOURS[type]
                      : "rgba(255,255,255,0.2)",
                  }}
                />
                <span className="filter-label">{TYPE_LABELS[type]}</span>
                <span className="filter-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Node Size ── */}
      <section className="guide-section">
        <h3 className="guide-section-title">Node Size</h3>
        <p className="guide-hint">Larger nodes represent more influential stakeholders.</p>
        <div className="guide-size-demo">
          <div className="guide-size-item">
            <span className="guide-size-circle guide-size-sm" />
            <span className="guide-legend-label">Low influence</span>
          </div>
          <div className="guide-size-item">
            <span className="guide-size-circle guide-size-md" />
            <span className="guide-legend-label">Medium</span>
          </div>
          <div className="guide-size-item">
            <span className="guide-size-circle guide-size-lg" />
            <span className="guide-legend-label">High influence</span>
          </div>
        </div>
      </section>

      {/* ── Edge Colours (Relationship Status) ── */}
      <section className="guide-section">
        <h3 className="guide-section-title">Edge Colours</h3>
        <p className="guide-hint">Lines connecting nodes represent relationships. The colour shows the current health of the relationship.</p>
        <div className="guide-legend-grid">
          {Object.entries(STATUS_COLOURS).map(([status, colour]) => (
            <div key={status} className="guide-legend-item">
              <span className="guide-colour-line" style={{ backgroundColor: colour }} />
              <span className="guide-legend-label">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Edge Thickness ── */}
      <section className="guide-section">
        <h3 className="guide-section-title">Edge Thickness</h3>
        <p className="guide-hint">Thicker edges represent stronger relationships between stakeholders.</p>
        <div className="guide-thickness-demo">
          <div className="guide-thickness-item">
            <span className="guide-thickness-line guide-thickness-thin" />
            <span className="guide-legend-label">Weak</span>
          </div>
          <div className="guide-thickness-item">
            <span className="guide-thickness-line guide-thickness-thick" />
            <span className="guide-legend-label">Strong</span>
          </div>
        </div>
      </section>

      {/* ── Arrows (Direction) ── */}
      <section className="guide-section">
        <h3 className="guide-section-title">Arrows</h3>
        <p className="guide-hint">An arrowhead on an edge means the relationship is <strong>directed</strong> (e.g. &quot;A regulates B&quot;). No arrow means the relationship is mutual.</p>
      </section>

      {/* ── Trend Symbols ── */}
      <section className="guide-section">
        <h3 className="guide-section-title">Trend Indicators</h3>
        <p className="guide-hint">Found in the sidebar when a node is selected. Trend is computed from historical status changes.</p>
        <div className="guide-legend-grid">
          <div className="guide-legend-item">
            <span className="guide-trend-symbol" style={{ color: "#4ADE80" }}>↑</span>
            <span className="guide-legend-label">Improving</span>
          </div>
          <div className="guide-legend-item">
            <span className="guide-trend-symbol" style={{ color: "#FACC15" }}>→</span>
            <span className="guide-legend-label">Stable</span>
          </div>
          <div className="guide-legend-item">
            <span className="guide-trend-symbol" style={{ color: "#F87171" }}>↓</span>
            <span className="guide-legend-label">Deteriorating</span>
          </div>
        </div>
      </section>

      {/* ── Status Over Time (Timeline Dots) ── */}
      <section className="guide-section">
        <h3 className="guide-section-title">Status Timeline</h3>
        <p className="guide-hint">Coloured dots at the bottom of each relationship card show how the relationship status changed over time (left = oldest, right = most recent). Hover over any dot for its date.</p>
        <div className="guide-timeline-demo">
          <span className="guide-demo-dot" style={{ backgroundColor: STATUS_COLOURS.cooperative }} />
          <span className="guide-demo-connector" />
          <span className="guide-demo-dot" style={{ backgroundColor: STATUS_COLOURS.stable }} />
          <span className="guide-demo-connector" />
          <span className="guide-demo-dot" style={{ backgroundColor: STATUS_COLOURS.strained }} />
        </div>
      </section>

      {/* ── Interactions ── */}
      <section className="guide-section">
        <h3 className="guide-section-title">Interactions</h3>
        <div className="guide-interactions">
          <div className="guide-interaction-row">
            <span className="guide-key">Click</span>
            <span className="guide-interaction-desc">Select a node to view details</span>
          </div>
          <div className="guide-interaction-row">
            <span className="guide-key">Drag</span>
            <span className="guide-interaction-desc">Move a node (pins it in place)</span>
          </div>
          <div className="guide-interaction-row">
            <span className="guide-key">Double-click</span>
            <span className="guide-interaction-desc">Unpin a dragged node</span>
          </div>
          <div className="guide-interaction-row">
            <span className="guide-key">Scroll</span>
            <span className="guide-interaction-desc">Zoom in / out</span>
          </div>
          <div className="guide-interaction-row">
            <span className="guide-key">Click + Drag</span>
            <span className="guide-interaction-desc">Pan the canvas</span>
          </div>
          <div className="guide-interaction-row">
            <span className="guide-key">Hover</span>
            <span className="guide-interaction-desc">Reveal node label</span>
          </div>
        </div>
      </section>

      {/* ── Sidebar Fields ── */}
      <section className="guide-section">
        <h3 className="guide-section-title">Sidebar Glossary</h3>
        <div className="guide-glossary">
          <div className="guide-glossary-item">
            <dt>Influence</dt>
            <dd>1–5 scale of the stakeholder&apos;s power (shown as filled/empty circles ●○).</dd>
          </div>
          <div className="guide-glossary-item">
            <dt>Strength</dt>
            <dd>1–5 scale of how significant the relationship is (shown as coloured bars).</dd>
          </div>
          <div className="guide-glossary-item">
            <dt>Status</dt>
            <dd>Current health: Cooperative, Stable, Strained, or Hostile.</dd>
          </div>
          <div className="guide-glossary-item">
            <dt>Trend</dt>
            <dd>Computed from historical snapshots — whether the relationship is improving, stable, or deteriorating.</dd>
          </div>
          <div className="guide-glossary-item">
            <dt>Direction</dt>
            <dd>Shows &quot;A → B&quot; for directed relationships (e.g. regulation, ownership). Omitted for mutual relationships.</dd>
          </div>
          <div className="guide-glossary-item">
            <dt>Type</dt>
            <dd>Category of relationship: Ownership, Regulatory, Contractual, Competitive, Financing, Political, or Advocacy.</dd>
          </div>
        </div>
      </section>
    </div>
  );
}
