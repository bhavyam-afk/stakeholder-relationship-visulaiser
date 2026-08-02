# ApexSignal — Technical Documentation & System Architecture
**Stakeholder Relationship Visualiser for Shell plc**

---

## Executive Summary

ApexSignal is an interactive **geopolitical and relationship intelligence platform** built to visualize and analyze the stakeholder ecosystem surrounding **Shell plc**. Large energy enterprises operate within dense networks of governments, regulators, joint-venture partners, national oil companies, financial institutions, and advocacy groups. When these relationships shift, the enterprise's strategic exposure shifts with them.

Rather than presenting a static or generic network graph, ApexSignal is engineered around **relationship intelligence**:
- **Who** each actor is and their functional category.
- **How much influence** the actor wields over the corporate ecosystem.
- **How strong** the relationship currently is.
- **What the current health/state** of the interaction is.
- **Where the relationship is heading (Trajectory)**, derived algorithmically from historical observations.

This document details the data modeling decisions, system architecture, simulation mechanics, and the technical challenges solved during engineering—with particular focus on algorithmic design, data structures, and simulation stability over frontend styling.

---

## 1. Data Model & Schema Design

The domain is modeled as a **labeled, weighted, directed/undirected multigraph** $G = (V, E)$, where vertices $V$ represent stakeholder entities and edges $E$ represent multidimensional relationships.

### 1.1 Node Model (`StakeholderNode`)

```ts
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
  id: string;               // Unique, immutable graph identifier
  name: string;             // Display label
  type: StakeholderType;    // Functional classification
  description: string;      // Comprehensive intelligence summary
  influence: 1 | 2 | 3 | 4 | 5; // Intrinsic power/influence score
}
```

#### Rationale for Node Attributes:
- **`influence` (Intrinsic Node Attribute):** An entity’s influence is modeled as an attribute of the node rather than an edge. A sovereign government (`influence: 5`) or a major regulator holds systemic weight in the ecosystem regardless of the specific health of its relationship with Shell. In the physics simulation, `influence` directly governs node collision boundaries and visual prominence.
- **`type` (Categorization):** Enables deterministic filtering, subgraph isolation, and visual encoding without relying on arbitrary tagging.

---

### 1.2 Edge Model (`RelationshipEdge`)

```ts
export type RelationshipStatus = "cooperative" | "stable" | "strained" | "hostile";
export type RelationshipDirection = "directed" | "undirected";

export interface HistoricalSnapshot {
  timestamp: string;        // ISO-8601 or YYYY-MM date representation
  status: RelationshipStatus; // Historical relationship health
}

export interface RelationshipEdge {
  source: string;           // Source node ID
  target: string;           // Target node ID
  relationshipType:         // Category of relationship
    | "ownership"
    | "regulatory"
    | "contractual"
    | "competitive"
    | "financing"
    | "political"
    | "advocacy";
  direction: RelationshipDirection; // Structural symmetry ("directed" | "undirected")
  strength: 1 | 2 | 3 | 4 | 5;      // Significance/intensity of relationship
  status: RelationshipStatus;       // Current operational health
  relationshipHistory: HistoricalSnapshot[]; // Chronological status array
  note: string;                     // Contextual qualitative intelligence
}
```

#### Rationale for Edge Attributes:
- **`strength` vs. `status` Separation:** A relationship can be structurally vital (`strength: 5`) yet operationally adversarial (`status: "hostile"` or `"strained"`), such as Shell’s regulatory relationship with environmental oversight bodies or ongoing joint-venture renegotiations. Blending these into a single weight would destroy critical analytical nuance.
- **`direction` (Asymmetry):** Identifies whether an interaction is asymmetric (e.g., `"regulatory"` where a government regulates Shell, or `"ownership"` where Shell holds equity in an asset) versus symmetric/mutual (`"undirected"`).

---

## 2. Deriving Relationship Trajectory from Historical Arrays

A primary design requirement was representing the **state and trajectory** of a relationship—not just how it is doing today, but where it is heading.

### 2.1 Why an Array of Historical Snapshots (`relationshipHistory`)?
In naive graph implementations, trend is often stored as a static field (e.g., `trend: "improving"`). This creates a structural flaw: static trend fields become disconnected from actual historical data, leading to state duplication and synchronization bugs.

To solve this, we modeled historical context as an **array of timestamped snapshots (`relationshipHistory: HistoricalSnapshot[]`)** attached to each edge:

```json
"relationshipHistory": [
  { "timestamp": "2025-01", "status": "stable" },
  { "timestamp": "2025-06", "status": "strained" },
  { "timestamp": "2026-01", "status": "cooperative" }
]
```

### 2.2 Algorithmic Trajectory Derivation (`computeTrend`)
Rather than persisting trend, ApexSignal infers trajectory **algorithmically at runtime** by evaluating the chronological delta across the historical array.

```ts
const STATUS_RANK: Record<RelationshipStatus, number> = {
  hostile: 0,
  strained: 1,
  stable: 2,
  cooperative: 3,
};

export function computeTrend(history: HistoricalSnapshot[]): RelationshipTrend {
  if (history.length < 2) return "stable";

  // Ensure chronological ordering regardless of JSON source order
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
```

#### Technical Advantages:
1. **Single Source of Truth:** Current status and historical progression are strictly consistent.
2. **Auditability:** Analysts can inspect the timeline of discrete status changes (rendered as a connected chronological timeline in the intelligence sidebar) to verify *why* a relationship is classified as improving or deteriorating.
3. **Storage Efficiency:** Avoids full time-series database overhead while providing sufficient temporal depth (3–5 snapshots per edge) to capture geopolitical momentum.

---

## 3. Core Technical & Architectural Challenges

During the development of ApexSignal, several non-trivial engineering problems were solved, primarily around graph algorithms, simulation physics, data structures, and state management.

### 3.1 The D3 Physics Simulation vs. React Lifecycle Impedance Mismatch
**The Problem:**
React operates on declarative, immutable state transitions. D3’s force-directed graph engine (`d3-force`) operates imperatively, running a continuous physics simulation loop that directly mutates node coordinates (`x`, `y`, `vx`, `vy`) and DOM attributes at 60 FPS.

In early iterations, whenever the user toggled the sidebar or resized the viewport, React triggered a re-render. If the graph container dimensions changed, the simulation was torn down and re-initialized, causing **the entire network layout to collapse and restart from scratch**, destroying user spatial memory.

**The Solution:**
I decoupled the **physics simulation lifecycle** from **layout and resizing events** using a persistent position cache and stable zoom transform storage:

1. **Persistent Coordinate Caching (`nodePositionCache`):**
   A module-scoped memory cache stores the computed coordinates (`x, y, fx, fy`) of every vertex on each simulation tick:
   ```ts
   const nodePositionCache: Record<
     string,
     { x: number; y: number; fx: number | null; fy: number | null }
   > = {};
   ```
   When the simulation initializes or updates, vertices are seeded with their cached coordinates. If positions are restored, the simulation initializes with a very low alpha (`simulation.alpha(0.05)`), allowing micro-adjustments without visual disruption.

2. **Pan/Zoom State Persistence (`savedZoomTransform`):**
   The SVG view transform (`d3.ZoomTransform`) is cached across React renders so that opening an intelligence panel does not reset the user's pan or zoom level.

3. **Decoupled Dimension Updates:**
   SVG container resizing (`width`, `height` via `ResizeObserver`) was moved into an isolated effect that only updates HTML attributes (`svg.attr("width", ...)`) without invalidating the D3 simulation dependency array.

---

### 3.2 Graph Legibility & High-Degree Hub Optimization (The "Hairball" Problem)
**The Problem:**
In a stakeholder network around a central enterprise, the client node (**Shell plc**) is a high-degree hub ($deg(v) = 34$), while satellite actors have degrees between 1 and 4. In a standard force-directed layout:
- Satellite nodes cluster tightly around the hub, overlapping and obscuring labels.
- Strongly connected nodes collide, while weak relationships float aimlessly.
- Asymmetric directed edges become impossible to distinguish from undirected mutual edges.

**The Solution:**
I engineered a multi-force equilibrium model tuned specifically for high-degree organizational graphs:

1. **Strength-Inverted Link Distances:**
   Standard D3 links use uniform resting lengths. I customized link distance to be inversely proportional to relationship strength:
   ```ts
   .distance((d) => 250 - (d.strength * 15))
   ```
   Stronger relationships ($strength = 5$) settle closer to the hub ($175\text{px}$), while peripheral relationships ($strength = 1$) maintain spatial clearance ($235\text{px}$).

2. **Influence-Scaled Collision Bounds:**
   To prevent node overlap, we applied an adaptive collision radius that scales with the intrinsic influence of each stakeholder:
   ```ts
   .force("collide", d3.forceCollide().radius((d) => getNodeRadius(d.influence) + 25))
   ```
   This guarantees a minimum $25\text{px}$ halo around every node, preventing visual crowding even around the 34-degree hub.

3. **Repulsive Body Force Tuning:**
   A strong electrostatic repulsion (`forceManyBody().strength(-1000)`) prevents satellite nodes from clumping, combined with weak gravitational centering forces (`forceX(0).strength(0.03)`, `forceY(0).strength(0.03)`).

4. **Directed Edge Arrowhead Accounting:**
   To cleanly display edge directionality without arrowhead occlusion, SVG `<marker>` elements were defined dynamically for each status color and bound via `marker-end`. For undirected edges, markers are stripped entirely.

---

### 3.3 Efficient Subgraph Isolation & Neighborhood Traversal
**The Problem:**
When analyzing a network of 40 nodes and ~50 edges, users must be able to inspect a single stakeholder's immediate ecosystem without visual noise.

**The Solution:**
We implemented **1-hop neighborhood subgraph isolation** in $O(|E|)$ time upon node selection:
```ts
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
```
When a node $v$ is selected:
- Vertices $u \in N(v) \cup \{v\}$ remain at full opacity ($1.0$).
- Peripheral vertices $w \notin N(v)$ attenuate to opacity $0.12$.
- Incident edges $(v, u)$ remain highlighted, while non-incident edges attenuate to $0.06$ opacity, and dimmed arrowheads (`#arrow-${status}-dim`) are swapped in to preserve contextual awareness without visual clutter.

---

### 3.4 TypeScript / D3 Runtime Mutation Mismatch
**The Problem:**
In static JSON datasets, edge connections are defined using string identifiers (`source: "shell"`, `target: "uk-gov"`). However, when D3's `forceLink` executes, it replaces these string literals in-place with references to the actual `SimulationNode` objects in memory.

In TypeScript, accessing `edge.source.id` fails before simulation initialization (when it is still a string), and accessing `edge.source` as a string fails after simulation initialization (when it is an object).

**The Solution:**
We created polymorphic simulation types and safe accessor patterns that handle both pre-tick and post-tick states cleanly:
```ts
export interface SimulationEdge {
  source: SimulationNode | string;
  target: SimulationNode | string;
  // ... other properties
}
```
During rendering and highlighting computations, accessors explicitly resolve node IDs regardless of runtime mutation state:
```ts
const src = typeof d.source === "object" ? (d.source as SimulationNode).id : d.source;
const tgt = typeof d.target === "object" ? (d.target as SimulationNode).id : d.target;
```

---

## 4. Verification & System Capabilities

The finalized architecture delivers:
- **Deterministic Layout Persistence:** Toggling the left-hand Application Guide or the right-hand Intelligence Sidebar does not reset node coordinates or zoom transforms.
- **Rich Intelligence Presentation:** Each relationship card surfaces Type, Strength (5-bar meter), Status, Algorithmically Computed Trend (with color-coded symbols), Explicit Direction (`Source → Target`), qualitative notes, and a chronological status timeline dot-matrix.
- **Complete Visual Documentation:** An integrated, interactive manual in the left panel explaining all visual encodings (colors, sizes, arrows, symbols) and user interactions for first-time operators.
