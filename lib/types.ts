// Stakeholder Node Types
export type StakeholderType =
  | "company"
  | "government"
  | "regulator"
  | "competitor"
  | "supplier"
  | "customer"
  | "financier"
  | "union"
  | "ngo"
  | "individual";

export interface StakeholderNode {
  id: string;
  name: string;
  type: StakeholderType;
  description: string;
  influence: 1 | 2 | 3 | 4 | 5;
}

// Relationship Edge Types
export type RelationshipType =
  | "ownership"
  | "regulatory"
  | "contractual"
  | "competitive"
  | "financing"
  | "political"
  | "advocacy";

export type RelationshipDirection = "directed" | "undirected";

export type RelationshipStatus =
  | "cooperative"
  | "stable"
  | "strained"
  | "hostile";

export interface HistoricalSnapshot {
  timestamp: string;
  status: RelationshipStatus;
}

export interface RelationshipEdge {
  source: string;
  target: string;
  relationshipType: RelationshipType;
  direction: RelationshipDirection;
  strength: 1 | 2 | 3 | 4 | 5;
  status: RelationshipStatus;
  relationshipHistory: HistoricalSnapshot[];
  note: string;
}

// Derived Types
export type RelationshipTrend = "improving" | "stable" | "deteriorating";

// Dataset
export interface StakeholderDataset {
  nodes: StakeholderNode[];
  edges: RelationshipEdge[];
}

// D3 Simulation Types
export interface SimulationNode extends StakeholderNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

