# ApexSignal — Stakeholder Relationship Visualiser

## Technical Planning & System Design

---

# 1. Project Objective

Build an interactive **stakeholder relationship visualiser** for a major energy company that allows users to quickly understand the ecosystem surrounding the company and the current health of those relationships.

Unlike a generic network graph, this application focuses on **relationship intelligence**. Every connection should communicate:

* **Who** the stakeholder is
* **What** kind of relationship exists
* **How strong** that relationship currently is
* **What its current state is**
* **Where the relationship is likely heading**

Rather than storing the direction of a relationship as static metadata, the application derives it from a short history of relationship states, making the visualization more representative of an actual intelligence system.

This emphasis on relationship state and trajectory is the primary value proposition of the application and aligns directly with the assignment brief.

---

# 2. Client Company

**Chosen Client:** Shell

### Why Shell?

Shell naturally has one of the richest stakeholder ecosystems among global energy companies.

It interacts with:

* Governments
* Energy regulators
* National oil companies
* Financial institutions
* Investors
* Suppliers
* Large industrial customers
* Competitors
* Environmental NGOs
* Trade unions
* Individual political figures

This makes it possible to create a realistic network of **30–40 interconnected stakeholders** while keeping every relationship meaningful.

---

# 3. Functional Requirements

The application should allow users to:

* Visualize all stakeholders surrounding Shell
* Understand stakeholder categories at a glance
* Explore relationships interactively
* Inspect any stakeholder in detail
* Observe the current health and future trajectory of relationships
* Navigate large graphs comfortably through zooming, panning and interaction

---

# 4. System Architecture

```text
                     stakeholders.json
                    (Mock Dataset)
                           │
                           │
                    Data Parsing Layer
                           │
          ┌────────────────┴────────────────┐
          │                                 │
          │                                 │
      D3 Force Engine                 React State
          │                                 │
          │                                 │
          ▼                                 ▼
   Force Simulation                  Selected Node
   Node Positions                    Sidebar State
   Edge Positions                    Filters
          │                                 │
          └──────────────┬──────────────────┘
                         │
                         ▼
                  Interactive Graph UI
                  (SVG + D3 Rendering)
```

### Architecture Principles

* Completely client-side application
* Read-only data source
* No backend required
* Stateless rendering
* D3 manages graph physics
* React manages application state and UI
* Relationship trends are computed from historical data during rendering rather than stored directly

This separation keeps rendering performant while maintaining predictable UI state while also separating **raw data** from **derived insights**.

---

# 5. Data Model

The graph follows a classic **Graph Data Structure**, where:

* Stakeholders are represented as **Nodes**
* Relationships are represented as **Edges**

This mirrors how relationship intelligence platforms internally represent organizational networks.

---

## Node Model (Stakeholder)

```ts
{
    id: string;
    name: string;

    type:
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

    description: string;

    influence: 1 | 2 | 3 | 4 | 5;
}
```

### Why each field exists

| Field       | Purpose                                               |
| ----------- | ----------------------------------------------------- |
| id          | Unique identifier used by D3 and edge references      |
| name        | Display label                                         |
| type        | Drives node colour, filtering and grouping            |
| description | Sidebar information                                   |
| influence   | Encodes stakeholder importance and controls node size |

---

## Edge Model (Relationship)

```ts
{
    source: string;

    target: string;

    relationshipType:
        | "ownership"
        | "regulatory"
        | "contractual"
        | "competitive"
        | "financing"
        | "political"
        | "advocacy";

    direction:
        | "directed"
        | "undirected";

    strength: 1 | 2 | 3 | 4 | 5;

    status:
        | "cooperative"
        | "stable"
        | "strained"
        | "hostile";

    relationshipHistory: [
        {
            timestamp: string;

            status:
                | "cooperative"
                | "stable"
                | "strained"
                | "hostile";
        }
    ];

    note: string;
}
```

### Why each field exists

| Field               | Purpose                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| source / target     | Defines graph connectivity                                             |
| relationshipType    | Classifies interaction type                                            |
| direction           | Supports asymmetric relationships if required                          |
| strength            | Visual weight and simulation tuning                                    |
| status              | Current health of the relationship                                     |
| relationshipHistory | Historical snapshots used to derive relationship trend algorithmically |
| note                | Human-readable explanation shown in sidebar                            |

---

# 6. Data Modelling Decisions

Several deliberate modelling decisions have been taken.

---

## Relationship Trend is Derived from History

Instead of storing a static value such as

```text
Trend:
Improving
```

each relationship stores a small chronological history of its state.

Example:

```text
Jan 2026  → Stable

Apr 2026  → Cooperative

Jul 2026  → Cooperative
```

The application computes the relationship trend at runtime by comparing the latest historical snapshots.

Example logic:

```text
Stable → Cooperative
= Improving

Cooperative → Cooperative
= Stable

Cooperative → Strained
= Deteriorating
```

This introduces a lightweight reasoning layer into the data model. Rather than displaying a manually entered trend, the application infers where the relationship is heading based on recent history, making the visualization more realistic while keeping the dataset simple.

This also avoids storing duplicated information, since trend is a derived property rather than persistent data.

---

## Influence is Stored on Nodes

Influence is an intrinsic property of a stakeholder rather than a relationship.

Examples:

* UK Government → High influence
* Local NGO → Medium influence
* Small Supplier → Low influence

This directly maps to node sizing and introduces visual hierarchy.

---

## Relationship Strength is Stored on Edges

Strength depends on a specific relationship.

For example:

```text
Shell ↔ UK Government
Strength = 5

Shell ↔ Greenpeace
Strength = 3
```

Encoding strength on edges allows edge thickness (and optionally link distance) to reflect the significance of each relationship.

---

## Historical Snapshots Instead of Full Time-Series Data

The assignment does not require historical analytics or event replay, so storing complete time-series data would unnecessarily increase complexity.

Instead, every relationship stores only **3–5 timestamped status snapshots**.

This provides enough information to infer relationship direction while keeping the dataset lightweight, readable and easy to maintain.

It also creates a clear separation between **raw historical observations** and **derived intelligence**, which is closer to how real analytical systems are designed.

---

# 7. Data Source

The assignment explicitly requests **mock stakeholder data**.

Therefore:

* No database
* No authentication
* No CRUD operations
* No API required

A single `stakeholders.json` file will contain:

* All nodes
* All edges
* Relationship history for each edge

This keeps the application deterministic, lightweight and aligned with the intended project scope.

If desired for code organization, a simple read-only API route may expose the JSON, but no persistence layer will be introduced.

---

# 8. Tech Stack

| Tech         | Responsibility                                   |
| ------------ | ------------------------------------------------ |
| Next.js      | Application framework                            |
| TypeScript   | Type safety and maintainability                  |
| D3.js        | Force simulation, drag, zoom and graph rendering |
| Tailwind CSS | Layout and styling                               |
| React        | UI state management                              |
| Vercel       | Deployment                                       |

---

# 9. Graph Rendering Strategy

The visualization will use **D3 Force Simulation**.

Core forces:

* `forceLink`
* `forceManyBody`
* `forceCenter`
* `forceCollide`

---

## Visual Encoding

### Node Colour

Represents stakeholder category.

Example:

* Government
* NGO
* Competitor
* Supplier
* Financier

Each receives a distinct colour.

---

### Node Size

Scaled according to:

```text
Influence
```

Higher influence stakeholders appear larger.

---

### Edge Thickness

Scaled according to:

```text
Relationship Strength
```

Thicker edges represent stronger relationships.

---

### Relationship Status

Encoded using edge colour.

Example:

```text
Green   → Cooperative

Yellow  → Stable

Orange  → Strained

Red     → Hostile
```

---

### Relationship Trend

The trend is **not stored directly**.

Instead, it is computed at runtime by comparing the latest entries in `relationshipHistory`.

The computed result is then displayed in the sidebar.

Example:

```text
↑ Improving

→ Stable

↓ Deteriorating
```

This keeps the visualization simple while ensuring that every displayed trend is backed by actual historical relationship data rather than a manually entered label.

---

# 10. Legibility Strategy

A force-directed graph becomes difficult to interpret beyond ~30 nodes, so deliberate readability improvements are necessary.

The following techniques will be implemented:

---

### 1. Stakeholder Type Filtering

Users can enable or disable stakeholder categories.

Example:

```text
☑ Governments

☑ NGOs

☐ Competitors
```

This reduces graph complexity without modifying the underlying data.

---

### 2. Contextual Highlighting

When a node is selected:

* Connected nodes remain fully visible
* Connected edges remain highlighted
* Unrelated nodes and edges fade into the background

This enables focused exploration of local relationships while preserving overall context.

---

### 3. Influence-Based Node Sizing

Node size scales with stakeholder influence, allowing important entities to stand out naturally.

---

### 4. Progressive Label Display

Displaying labels for every node at once quickly creates visual clutter.

Instead:

* Labels remain hidden by default
* Labels appear on hover
* Labels remain visible for the selected node

This maintains readability while preserving discoverability.

---

# 11. Scope Decisions

Following the assignment's guidance, the focus is on delivering a polished core experience rather than implementing unnecessary features.

The following features are intentionally excluded:

* Live data integration
* Real geopolitical datasets
* Authentication
* User editing
* Relationship creation/deletion
* Multiple client companies
* Full historical analytics or timeline playback
* Analytics dashboards

These features require backend infrastructure or significantly expand scope without improving the evaluation criteria for this assignment.

---

# 12. Development Roadmap

## Phase 0 — Planning

* Client company: Shell
* Finalize data model
* Finalize visual encoding
* Finalize legibility strategy
* Record deliberate scope decisions

---

## Phase 1 — Project Setup

* Initialize Next.js project
* Configure Tailwind CSS
* Install D3.js
* Create application layout
* Connect GitHub repository
* Configure Vercel deployment

---

## Phase 2 — Mock Dataset

* Create `stakeholders.json`
* Add 25–40 stakeholder nodes
* Add realistic relationships
* Add **3–5 historical status snapshots (`relationshipHistory`)** for every relationship
* Ensure every node participates in at least one relationship
* Validate consistency of references

---

## Phase 3 — Graph Rendering

* Initialize D3 force simulation
* Render nodes
* Render edges
* Apply sizing and colouring
* Tune simulation parameters

---

## Phase 4 — User Interaction

* Zoom
* Pan
* Node selection
* Sidebar
* Node dragging

---

## Phase 5 — Relationship Intelligence

* Relationship status visualization
* Compute relationship trend from historical snapshots
* Display derived trend indicators
* Relationship notes
* Sidebar relationship list

---

## Phase 6 — Legibility Pass

* Filtering
* Contextual highlighting
* Progressive labels
* Readability testing with full dataset

---

## Phase 7 — Polish

* Responsive layout
* Visual refinement
* Empty-state handling
* Performance check

---

## Phase 8 — Deployment

* Deploy to Vercel
* Validate deployment in an incognito browser
* Verify all interactions function correctly

---

## Phase 9 — Documentation

Document:

* Data model
* Architectural decisions
* Technical approach
* Scope decisions
* Challenges encountered

---

# 13. Submission Checklist

* [ ] Live Vercel deployment
* [ ] Mock stakeholder dataset (25–40 nodes)
* [ ] Interactive D3 force-directed graph
* [ ] Zoom and pan
* [ ] Clickable stakeholder nodes
* [ ] Sidebar with stakeholder information
* [ ] Relationship status visualization
* [ ] Relationship trend computed from historical snapshots
* [ ] Stakeholder colour coding
* [ ] Implemented legibility strategy
* [ ] Technical documentation

---

# 14. Guiding Principles

The project prioritizes:

* Clear and extensible data modelling
* Meaningful relationship intelligence
* High visual legibility
* Deliberate scope control
* Clean separation between rendering, application state and data
* Derived insights over duplicated data (relationship trends are computed from historical snapshots instead of being stored directly)

Rather than building a feature-heavy application, the objective is to deliver a focused, well-engineered visualization that communicates stakeholder relationships clearly and effectively while remaining faithful to the assignment brief.
