"use client";

import { STATUS_COLOURS } from "@/lib/utils";

export default function Legend() {
  return (
    <div className="legend-panel">
      <h4 className="legend-title">Relationship Status</h4>
      <div className="legend-items">
        {Object.entries(STATUS_COLOURS).map(([status, colour]) => (
          <div key={status} className="legend-item">
            <div
              className="legend-line"
              style={{ backgroundColor: colour }}
            />
            <span className="legend-label">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
