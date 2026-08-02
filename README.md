# ApexSignal — Stakeholder Relationship Visualiser

ApexSignal is an interactive **stakeholder relationship visualiser** designed for a major energy company (Shell) to quickly understand its surrounding ecosystem and the current health of those relationships.
- live link: https://stakeholder-relationship-visulaiser.vercel.app/

## Table of Contents
- [Technical Documentation & Architecture](TECHNICAL_DOCUMENTATION.md)
- [Technical Approach](#technical-approach)
- [Architectural Decisions](#architectural-decisions)
- [Data Model](#data-model)
- [Scope Decisions](#scope-decisions)
- [Challenges Encountered](#challenges-encountered)
- [Getting Started](#getting-started)

---

## Technical Approach

The application focuses on **relationship intelligence** rather than being a generic network graph. The visualization conveys:
* **Who** the stakeholder is (categorized by type and color).
* **How strong** that relationship is (edge thickness).
* **What its current state is** (edge color).
* **Where the relationship is likely heading** (computed trend displayed in the sidebar).

**Tech Stack:**
* **Next.js (App Router)** for the framework.
* **React** for UI and state management.
* **D3.js** for force-directed graph physics, zooming, and panning.
* **Tailwind CSS v4** for layout and component styling.
* **TypeScript** for type safety across data and components.

---

## Architectural Decisions

* **Client-Side Rendering Focus:** The core visualization requires physics calculations (D3 Force Simulation) which run entirely in the browser. The architecture separates raw data from derived insights.
* **Separation of Concerns:** D3 manages graph physics, drag events, and rendering the SVG to maintain performance, while React manages application state, sidebar UI, and filtering logic.
* **Derived Insights over Stored State:** Instead of hardcoding a relationship's "trend" (improving, stable, deteriorating), the application computes this trend at runtime using a short history of relationship states (`relationshipHistory`). This keeps the dataset realistic to an actual intelligence platform.
* **Mock Data File:** The application relies on a comprehensive, read-only `stakeholders.json` file. No backend or database is necessary, keeping the deployment lightweight and focused on UI/UX evaluation.

---

## Data Model

The graph follows a classic Node/Edge graph data structure.

### Node (Stakeholder)
* `id` and `name`: Identifiers and display labels.
* `type`: Categorizes stakeholders (e.g., government, competitor, financier) and drives the color palette.
* `influence`: (1-5 scale) An intrinsic property driving node size (radius) and visual hierarchy.

### Edge (Relationship)
* `source` / `target`: Connects nodes.
* `relationshipType`: Describes the nature of the relationship (regulatory, contractual, etc.).
* `strength`: (1-5 scale) Drives the thickness of the connecting edge.
* `status`: Current health (cooperative, stable, strained, hostile), driving the edge color.
* `relationshipHistory`: An array of timestamped snapshots used to derive the relationship trend algorithmically.

---

## Scope Decisions

Following the project requirements, scope was carefully managed:
* **Excluded:** Live data integration, real geopolitical API datasets, authentication, and full CRUD editing.
* **Included:** Rich mock dataset (35 nodes), D3 interactive graph, dynamic UI sidebar, legibility features (contextual highlighting on hover/click), filtering by stakeholder type, and dynamic intelligence calculations (trend).

---

## Challenges Encountered

* **D3 and React Integration:** Integrating D3 (which wants imperative control over the DOM) with React (which handles declarative state) required careful boundary definitions. A `useEffect` hook in `ForceGraph.tsx` was used to hand off the `<svg>` container to D3, while React passes in filtered node and edge arrays.
* **Graph Legibility:** A force-directed graph with 35 nodes and multiple interconnections can quickly become a "hairball". Implementing contextual highlighting—where clicking a node dims all non-connected nodes and edges—was crucial for readability.
* **TypeScript and D3 Force Types:** D3's `forceLink` dynamically transforms `source` and `target` from string IDs into actual node object references during simulation. Typing this correctly in TypeScript required explicit type casting (`as unknown as SimulationNode`) to appease the compiler while allowing D3 to mutate the objects as intended.

---

## Getting Started

Open [https://stakeholder-relationship-visulaiser.vercel.app/](https://stakeholder-relationship-visulaiser.vercel.app/) with your browser to see the visualization.
