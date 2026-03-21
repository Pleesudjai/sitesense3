# Feature Spec: Frontend Reference Refresh
Date: 2026-03-21
Layer: frontend

## What We're Building
Refresh the SiteSense frontend using stronger product references that fit a land feasibility and property intelligence workflow.

This spec is for:

- frontend product direction
- UI reference alignment
- stack refresh guidance
- component architecture cleanup
- map-and-inspector interaction design

This is not a generic dashboard redesign.
The goal is to make SiteSense feel like a serious land intelligence product that is still understandable to landowners and decision-makers.

## Current Frontend Reality

Current frontend stack:

- React 18.3.1
- Vite 5.3.1
- Tailwind CSS 3.4.4
- MapLibre GL JS 4.5.0
- Recharts 2.12.7

Current structural pattern:

- full-screen app shell
- map on the left
- results dashboard on the right
- map-driven parcel selection
- risk cards, charts, costs, and AI report in a vertical inspector

This is already the right high-level direction.
The refresh should improve quality, clarity, and product feel rather than replace the entire app concept.

## Core Product Direction

The frontend should feel like a blend of:

1. `Regrid`
2. `Land id`
3. `Nearmap PropertyVision`
4. `Zillow climate risk`

### Why these references fit

- `Regrid` fits parcel-first exploration and map-driven workflows
- `Land id` fits landowner-friendly land intelligence UX
- `Nearmap PropertyVision` fits measurement, inspection, and site-review workflows
- `Zillow climate risk` fits clear consumer-facing risk communication

## Reference Products to Study

### 1. Regrid

Use as the main shell reference.

Key patterns to borrow:

- map-first layout
- persistent detail panel
- parcel-centric interactions
- clean search and context drill-down
- utility-style layer and map controls

Reference:

- https://regrid.com/property-app
- https://app.regrid.com/

### 2. Land id

Use as the tone and landowner-accessibility reference.

Key patterns to borrow:

- clean land-focused branding
- approachable layer toggles
- simple contextual summaries
- less "engineering console" feeling

Reference:

- https://www.id.land/
- https://support.id.land/import-surveys-and-site-plans-with-georeference-tool

### 3. Nearmap PropertyVision

Use as the inspection-workflow reference.

Key patterns to borrow:

- property review workflow
- measurement-first interaction
- comparison and review tooling
- evidence-oriented UI

Reference:

- https://help.nearmap.com/kb/articles/1294-launching-nearmap-propertyvision

### 4. Zillow climate risk

Use as the risk communication reference.

Key patterns to borrow:

- plain-English risk labels
- severity chips
- clear "what this means" summaries
- visually digestible risk explanation

Reference:

- https://www.zillow.com/news/zillow-introduces-first-streets-comprehensive-climate-risk-data-on-for-sale-listings-across-the-us/
- https://www.zillow.com/news/climate-risk-product-update/

## Technical Reference Stack

### Mapping and overlays

Recommended direction:

- `MapLibre` remains the core map engine
- evaluate `react-map-gl` MapLibre mode for better React integration
- add `deck.gl` for advanced overlays and map intelligence layers

Why:

- current app is already MapLibre-based
- deck.gl is a natural upgrade path for slope shading, heatmaps, masks, parcel overlays, and richer geospatial rendering
- react-map-gl can simplify map state coordination if the current imperative pattern becomes hard to scale

References:

- MapLibre examples: https://maplibre.org/maplibre-gl-js/docs/examples/
- MapLibre 3D terrain: https://maplibre.org/maplibre-gl-js/docs/examples/3d-terrain/
- MapLibre Terra Draw example: https://maplibre.org/maplibre-gl-js/docs/examples/maplibre-gl-terradraw/
- react-map-gl MapLibre docs: https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/map
- deck.gl: https://deck.gl/

### UI system

Recommended direction:

- keep Tailwind
- add `shadcn/ui` patterns for shells, drawers, tables, filters, and form controls
- use `Radix Primitives` if lower-level accessibility primitives are needed

Why:

- current custom UI works, but it needs a stronger product system
- shadcn provides modern, composable product UI patterns without forcing a generic SaaS look
- Radix gives durable primitives for dialogs, popovers, tabs, tooltips, and drawers

References:

- https://ui.shadcn.com/blocks
- https://ui.shadcn.com/docs/changelog/2024-03-blocks
- https://www.radix-ui.com/primitives/docs/overview/releases

### Map helper packages to evaluate

These are worth evaluating for the refresh:

- `@watergis/maplibre-gl-terradraw`
- `@watergis/maplibre-gl-export`
- `@watergis/maplibre-gl-legend`
- `react-map-gl`
- `deck.gl`

## Recommended UX Target

### Primary layout

The target layout should be:

- full-height map canvas
- collapsible right inspector
- top search + action bar
- top-left or top-right layer controls
- bottom compare tray or analysis timeline when needed
- sticky report/export actions

### Left side: map workspace

The map area should support:

- search
- parcel draw/edit
- layer toggles
- hover/select interactions
- measurement tools
- buildable area visualization
- hazard overlays
- print/export hooks

### Right side: inspector

The inspector should be structured into tabs or sections such as:

1. Overview
2. Constraints
3. Terrain
4. Water / flood
5. Soil / foundation
6. Cost / forecast
7. Report

This is easier to scan than one long vertical stack.

### Risk communication style

Risk cards should evolve from raw metric display into:

- severity chip
- short title
- one-sentence implication
- optional "why" expander
- optional "recommended next step"

Example:

- `Flood Risk: Medium`
- `Part of the parcel appears to intersect mapped flood hazard.`
- `Why: FEMA flood zone overlap detected near the southern edge.`
- `Next step: confirm with local drainage and floodplain review before concept layout.`

## Design Rules for Claude

Claude should preserve:

- map-left / insights-right structure
- strong satellite-first parcel workflow
- plain-English engineering summaries
- print/report path

Claude should improve:

- typography hierarchy
- spacing and card consistency
- right-panel information architecture
- layer controls
- empty/loading states
- comparison workflow
- export/report call-to-action placement

Claude should avoid:

- generic admin-dashboard look
- overuse of purple gradients or trendy AI visuals
- burying the map behind oversized cards
- dumping all outputs into one endless scroll without grouping

## Recommended Stack Refresh

### Safe upgrades

These are reasonable to plan for:

- React 19
- MapLibre 5.x
- Recharts 3.x

### Careful upgrades

These need deliberate migration planning:

- Tailwind 4
- Vite 8

Reason:

- Tailwind 4 is a real migration, not a tiny bump
- newer Vite versions may require newer Node versions and config review

### Recommended package additions

- `react-map-gl`
- `deck.gl`
- `@watergis/maplibre-gl-terradraw`
- `@watergis/maplibre-gl-export`
- `@watergis/maplibre-gl-legend`

## Recommended Component Re-Architecture

### Current issue

The current app pushes many unrelated outputs into one large right-side scroll.
That works for a hackathon prototype, but it will get harder to use as more features are added.

### Target component split

- `AppShell.jsx`
  - top-level shell and global layout
- `TopBar.jsx`
  - search, actions, layer shortcuts, project controls
- `MapWorkspace.jsx`
  - map wrapper and overlay orchestration
- `LayerPanel.jsx`
  - map layer toggles and map tools
- `InspectorPanel.jsx`
  - tabbed right-side inspector
- `OverviewTab.jsx`
  - parcel summary and top risks
- `ConstraintsTab.jsx`
  - flood, wetlands, contamination, hydrography, zoning
- `TerrainTab.jsx`
  - elevation, slope, cut/fill, buildable area
- `SoilTab.jsx`
  - soil/foundation outputs
- `CostTab.jsx`
  - costs, inflation, forecast, key drivers
- `ReportTab.jsx`
  - AI summary, PDF/report actions

This does not all need to be built at once, but this should be the target structure.

## Implementation Strategy

### Phase 1

- preserve the current stack
- reorganize the inspector into tabs/sections
- improve header/search/action hierarchy
- rewrite risk cards into clearer plain-English modules
- improve empty/loading/result states

### Phase 2

- add advanced map layer controls
- add compare mode
- add deck.gl overlays for richer spatial visualization
- add export and share improvements

### Phase 3

- evaluate deeper stack upgrades
- evaluate react-map-gl integration if map orchestration becomes hard to maintain
- evaluate Tailwind 4 and Vite 8 only after confirming Node and build readiness

## Files to Create or Edit

- `specs/frontend-reference-refresh.md` - this spec
- `src/frontend/src/App.jsx` - shell refactor or handoff to `AppShell`
- `src/frontend/src/components/MapView.jsx` - preserve map operations, improve workspace framing
- `src/frontend/src/components/RiskCards.jsx` - redesign into clearer risk modules
- `src/frontend/src/components/CostTable.jsx` - prepare for forecast integration
- `src/frontend/src/components/ElevationChart.jsx` - integrate into terrain-focused tab
- `src/frontend/src/components/ReportButton.jsx` - better placement and hierarchy
- `src/frontend/src/components/AppShell.jsx` - new shell component
- `src/frontend/src/components/TopBar.jsx` - new top action/search bar
- `src/frontend/src/components/InspectorPanel.jsx` - new right-side inspector
- `src/frontend/src/components/LayerPanel.jsx` - optional map-layer control panel

## Implementation Steps

1. [ ] Audit the current frontend against the reference set
2. [ ] Define the new app shell and inspector structure
3. [ ] Refactor the right panel into grouped tabs or sections
4. [ ] Redesign risk cards into plain-English risk modules
5. [ ] Improve top bar, search, and action hierarchy
6. [ ] Improve loading, empty, and analysis-complete states
7. [ ] Add a lightweight layer-control pattern
8. [ ] Evaluate package additions for map tools and overlays
9. [ ] Decide whether stack version upgrades happen now or later

## Demo Test

### UX test goal

The product should feel like:

- a land intelligence application
- a parcel review workspace
- an engineer/landowner collaboration tool

It should not feel like:

- a generic admin dashboard
- a raw GIS developer demo
- a cluttered engineering spreadsheet in browser form

### Visual acceptance

- map remains the hero
- right panel becomes easier to scan
- top risks are understandable in under 10 seconds
- export/report path is obvious
- the interface feels more professional and current

## Out of Scope

- full design-system rewrite
- replacing MapLibre entirely
- photoreal 3D environment work
- mobile-native app design
- unrelated branding overhaul

## Success Criteria

- Claude can use this spec and immediately understand the target reference products
- the UI refresh preserves the map-first workflow
- the right-side panel becomes easier to navigate and extend
- the design feels closer to a real property intelligence product
- future GIS, cost, and engineering features can be added without collapsing the layout
