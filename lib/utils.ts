import {
  RelationshipStatus,
  RelationshipTrend,
  HistoricalSnapshot,
  StakeholderType,
} from "./types";

/**
 * Status hierarchy for computing relationship trends.
 * Higher values = more positive relationship state.
 */
const STATUS_RANK: Record<RelationshipStatus, number> = {
  hostile: 0,
  strained: 1,
  stable: 2,
  cooperative: 3,
};

/**
 * Derives a relationship trend from the historical snapshots.
 * Compares the two most recent statuses to determine direction.
 */
export function computeTrend(history: HistoricalSnapshot[]): RelationshipTrend {
  if (history.length < 2) return "stable";

  const sorted = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const previous = sorted[sorted.length - 2];
  const current = sorted[sorted.length - 1];

  const prevRank = STATUS_RANK[previous.status];
  const currRank = STATUS_RANK[current.status];

  if (currRank > prevRank) return "improving";
  if (currRank < prevRank) return "deteriorating";
  return "stable";
}

/**
 * Maps stakeholder types to display colours (HSL).
 * Curated palette designed for dark backgrounds.
 */
export const STAKEHOLDER_COLOURS: Record<StakeholderType, string> = {
  company: "#FFD700",      // Gold
  government: "#4A9EFF",   // Royal Blue
  regulator: "#7B68EE",    // Medium Slate Blue
  competitor: "#FF6B6B",   // Coral Red
  supplier: "#50C878",     // Emerald
  customer: "#FF8C42",     // Orange
  financier: "#00CED1",    // Dark Turquoise
  union: "#DDA0DD",        // Plum
  ngo: "#98FB98",          // Pale Green
  individual: "#F0E68C",   // Khaki
};

/**
 * Maps relationship status to edge colours.
 */
export const STATUS_COLOURS: Record<RelationshipStatus, string> = {
  cooperative: "#4ADE80", // Green
  stable: "#FACC15",      // Yellow
  strained: "#FB923C",    // Orange
  hostile: "#F87171",     // Red
};

/**
 * Maps relationship trend to display info.
 */
export const TREND_DISPLAY: Record<
  RelationshipTrend,
  { symbol: string; label: string; colour: string }
> = {
  improving: { symbol: "↑", label: "Improving", colour: "#4ADE80" },
  stable: { symbol: "→", label: "Stable", colour: "#FACC15" },
  deteriorating: { symbol: "↓", label: "Deteriorating", colour: "#F87171" },
};

/**
 * Friendly display labels for stakeholder types.
 */
export const TYPE_LABELS: Record<StakeholderType, string> = {
  company: "Company",
  government: "Government",
  regulator: "Regulator",
  competitor: "Competitor",
  supplier: "Supplier",
  customer: "Customer",
  financier: "Financier",
  union: "Union",
  ngo: "NGO",
  individual: "Individual",
};

/**
 * Friendly display labels for relationship types.
 */
export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  ownership: "Ownership",
  regulatory: "Regulatory",
  contractual: "Contractual",
  competitive: "Competitive",
  financing: "Financing",
  political: "Political",
  advocacy: "Advocacy",
};

/**
 * Calculates the node radius based on influence level.
 */
export function getNodeRadius(influence: number): number {
  const baseRadius = 8;
  const scale = 5;
  return baseRadius + influence * scale;
}
