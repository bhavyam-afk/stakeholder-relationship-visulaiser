"use client";

import { StakeholderType } from "@/lib/types";
import { STAKEHOLDER_COLOURS, TYPE_LABELS } from "@/lib/utils";

interface FilterPanelProps {
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

export default function FilterPanel({
  activeFilters,
  onToggleFilter,
  stakeholderCounts,
}: FilterPanelProps) {
  return (
    <div className="filter-panel">
      <h3 className="filter-title">Stakeholders</h3>
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
    </div>
  );
}
