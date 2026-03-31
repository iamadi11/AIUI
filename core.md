You are a **Senior Staff Engineer + System Architect**.

Design a **complete, production-grade architecture and phased implementation plan** for a system that acts as a **UI Operating System + Runtime Platform**, not just a drag-and-drop builder.

---

# 🧠 Core Product Idea

Build a **Drag-and-Drop UI Dashboard Creator** (like a mix of Retool, Webflow, and Figma) where users can:

* Visually build UI using drag-and-drop
* Configure logic (API calls, navigation, state updates)
* Define dynamic behavior (visibility, conditions, computed values)
* Create workflows using graph-based logic
* Export a **fully functional UI system**

---

# 🚀 MOST IMPORTANT ARCHITECTURAL DECISION

We will NOT export framework-specific code.

Instead, we will export:

## 1. Universal JSON DSL

This contains:

* UI Tree
* Layout metadata
* Logic definitions
* Events
* State model
* Expressions (e.g. {{user.name}})

---

## 2. Runtime Bundle (JavaScript SDK)

A self-contained runtime that:

* Interprets the DSL
* Renders UI
* Executes logic
* Manages state
* Handles events

---

# 🎯 FINAL USAGE MODEL (CRITICAL)

End users should only need to do:

```js
const runtime = await import("your-runtime-bundle");

runtime.render({
  container: document.getElementById("app"),
  config: exportedDSL
});
```

OR in React:

```jsx
const Runtime = dynamic(() => import("runtime"));

<Runtime config={dsl} />
```

NO additional setup required.

---

# 🧱 Mandatory Tech Stack

### Builder App

* Next.js (App Router)
* React
* TypeScript

### UI System

* Tailwind CSS
* shadcn/ui

### Drag & Graph System

* React Flow (for logic graph + relationships)

### Layout Philosophy

* Deterministic layout inspired by Pretext concepts from Cheng Lou
* Avoid DOM reflows and layout thrashing where possible

### State Management

* Zustand OR Redux Toolkit (you must justify choice)

### Utilities

* Zod (schema validation)
* Expression evaluator (custom or library)
* dnd-kit (if needed)
* Any performance-focused tools if required

---

# 🚨 Constraints

* DO NOT give shallow answers
* DO NOT jump into coding immediately
* Think deeply about scalability, performance, extensibility
* Treat this as a real-world startup-grade system
* Keep AI integration in mind for future phases, but DO NOT implement AI flows now

---

# 🏗️ What I Need From You

---

## 1. High-Level Architecture

Define clearly:

* Builder App (drag-drop editor)
* Component Registry System
* UI Tree Management
* Layout Engine (deterministic)
* Logic DSL System
* Event System
* State Management Layer
* Runtime Engine (interpreter)
* Runtime Bundle Packaging System
* Export System
* Adapter Layer (if needed)

Explain full data flow end-to-end.

---

## 2. Core Data Models (VERY IMPORTANT)

Define detailed schemas (TypeScript types or JSON schema) for:

* UI Tree
* Component definitions
* Layout metadata
* Logic DSL
* Event system
* State model
* Expression system ({{variable.path}})

Include realistic examples.

---

## 3. Runtime Bundle Design (CRITICAL SECTION)

Explain in depth:

### What goes inside the runtime bundle

* Renderer
* Layout engine
* State manager
* Event system
* DSL interpreter

### Bundle properties

* Framework-agnostic core
* Optional React wrapper
* Tree-shakeable
* Lazy-loadable
* Small bundle size

### Public API

Define clearly:

```ts
render({ container, config })
update(config)
destroy()
```

---

## 4. Execution Flow

Explain step-by-step:

Load DSL → Initialize runtime → Compute layout → Render UI → Bind events → Handle actions → Update state → Re-render

---

## 5. Phase-by-Phase Implementation Plan

---

### Phase 1: Builder MVP

* Setup Next.js app
* Drag-and-drop canvas
* Component palette
* UI Tree creation
* Basic React renderer
* Use shadcn components
* Simple layout (stack/grid)

---

### Phase 2: Layout Engine

* Deterministic layout computation
* Pretext-inspired approach
* Position calculation system
* Minimize DOM measurement

---

### Phase 3: Logic System

* Event bindings (onClick, etc.)
* Action system (API call, navigation, state update)
* Expression parser ({{...}})
* Data binding

---

### Phase 4: Runtime Engine

* DSL interpreter
* State execution engine
* Event execution pipeline
* Reactive updates

---

### Phase 5: Runtime Bundle Packaging

* Bundle runtime into SDK
* Dynamic import support
* Public API exposure
* Build tooling (Vite/Rollup)

---

### Phase 6: Export System

* Export DSL JSON
* Validate using Zod
* Versioning strategy

---

### Phase 7: Multi-platform Adapters

* React adapter
* Vanilla JS adapter
* Explain Python backend compatibility approach

---

### Phase 8: Future Enhancements

* AI UI generation (design only)
* Collaboration (multi-user editing)
* Plugin system
* Component marketplace

---

## 6. For EACH Phase Include

* Goals
* Features
* Technical design decisions
* Folder structure (Next.js App Router compatible)
* Key abstractions
* APIs to implement
* Risks and edge cases

---

## 7. Layout Engine Deep Dive

Explain:

* How layout is computed
* Handling text, containers, grids
* Tradeoffs vs browser layout engine
* When DOM measurement is still required

---

## 8. Logic DSL Design (VERY IMPORTANT)

Define:

* Action types (API call, state update, navigation, etc.)
* Expression evaluation system
* Event binding
* Execution model
* Error handling

---

## 9. Runtime Engine Design

Explain:

* Rendering pipeline
* State updates propagation
* Event execution
* Deterministic behavior

---

## 10. React Flow Integration

Explain clearly:

* How React Flow is used:

  * Logic graph (primary)
  * Optional UI relationships

* Node types

* Edge relationships

* Sync with UI tree

---

## 11. Export Philosophy

Explain:

* Why DSL + runtime bundle is better than exporting code
* How dynamic import simplifies usage
* How to ensure long-term compatibility

---

## 12. Implementation Strategy (CRITICAL)

* What to build first vs later
* What to hardcode initially
* Where to avoid over-engineering
* Performance considerations
* Tradeoffs

---

## 13. Final Output Requirements

* Well-structured
* Deep and thoughtful
* Actionable
* Can be directly used to start development
* Written like a real system design doc

---

# 🧠 Mindset

You are designing:

👉 A **UI Runtime Platform (like a mini operating system for UI)**

NOT just a drag-and-drop builder.

---

Take your time. Think deeply. This should be a blueprint for a real product.

---

## Appendix — Builder product UX (maintenance)

This appendix tracks **product-facing** builder experience work. **Engine milestones** (layout engine, runtime, export) are separate from these UX phases; see `PLAN.md` §14 and `TODO.md` for current status.

### Phase 1 — Builder UX foundation (shipped baseline)

- **Canvas:** Hover vs selected states, hierarchy indentation, empty-canvas click deselects, **Escape** clears selection.
- **Labels:** `props.label` (optional string) on **Box** and **Stack** for human-readable layers; **double-click** the label on a canvas card to edit inline; same field in the Properties inspector (`InspectorField` `kind: "text"`).
- **Discoverability:** Selection line shows a **breadcrumb** (`Type (label) › …`); tree list uses the same titles; node ids appear only in `title` tooltips / subtle hover chip on canvas — not the primary label.

### Phase 2 — Component system (shipped baseline)

- **Registry:** `paletteCategory`, optional `paletteKeywords` and `paletteDescription` on each `ComponentDefinition`; `listPaletteDefinitions()` and `matchesPaletteSearch()` for the builder.
- **Palette UI:** Search field (tokenized match), sections in fixed category order, subtle empty-state copy for categories with no primitives yet; cards show title + description; technical `type` is not emphasized (available in `title` tooltip).

### Phase 3 — Layout (shipped baseline)

- **Engine:** Optional `layout.width` / `layout.height` on **leaf** nodes (empty Box/Stack) set intrinsic size; `layout.padding` unchanged (number or per-side object).
- **Inspector:** Padding and intrinsic width/height for Box/Stack via `scope: "layout"` fields (no raw JSON for these keys).
- **Canvas:** **Grip** drag to **reorder siblings**; drop targets and palette drag unchanged.

### Phase 4 — Events (shipped baseline)

- **Inspector:** Event list with **When** presets (or custom name), **Visual steps** (update state, open URL, HTTP) or **Advanced JSON** for `sequence` / `condition`; collapsed header shows a short summary chain.

### Phase 5 — Logic / side effects (shipped baseline)

- **Events:** Visual **If** (expression + then/else, each branch: state / URL / HTTP only); top-level HTTP steps include optional **body** (JSON). `sequence` / nested logic stays in Advanced JSON.
- **Document:** **Initial state** panel edits `document.state` (key/value rows, JSON-friendly values) with undo via `setDocumentState`.

### Phase 6 — Advanced logic / React Flow (shipped baseline)

- **Graph:** `eventsToFlowElements` + `flattenActions()` turn each event’s `actions` into a linear chain (expanded `sequence` / `condition`); **Logic** panel shows counts, a sync note with Properties, and click-to-inspect JSON for a step when `data.action` is present.
- **Editing:** Event bindings are still edited in Properties (graph is read-only observability).

### Phases 7–8 (planned)

Builder/runtime convergence (preview parity); power features (multi-select, templates, shortcuts, diagnostics). Optional layout follow-ups (on-canvas resize, snapping, margin). Details in `PLAN.md` §14.
