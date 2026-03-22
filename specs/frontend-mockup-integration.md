# Feature Spec: Frontend Mockup Integration
Date: 2026-03-21
Layer: frontend

## What We're Building
Use the provided HTML mockup as the new visual shell for SiteSense, but implement it as a real React + Tailwind frontend that preserves the current live data flow and map behavior.

This spec is specifically for Claude to execute.

Approved source file:

- [frontend-mockup-reference.html](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/frontend-mockup-reference.html)

Claude must open and use that HTML file together with this spec.
These two files are a paired set and should collaborate during execution.

The mockup should be treated as:

- a layout and visual reference
- a component structure guide
- a UX direction for the hackathon demo

The mockup should NOT be treated as:

- a static HTML file to paste directly into `App.jsx`
- a replacement for the live map and backend data
- a CDN-based prototype to keep in production

## Paired Source Contract

Claude should treat the two files like this:

- `frontend-mockup-reference.html`
  - the visual source of truth
  - the reference for shell layout, spacing intent, panel hierarchy, and UI tone
- `frontend-mockup-integration.md`
  - the implementation source of truth
  - the reference for what to preserve, what to replace, what to remove, and how to map the mockup into the real app

If the two files feel different in purpose, Claude should resolve that difference this way:

- use the HTML file for visual direction
- use this spec for execution rules
- preserve the real SiteSense frontend behavior over prototype behavior

Claude should not work from this spec alone.
Claude should not work from the HTML file alone.
Claude should use both together.

## How The Files Collaborate

The intended workflow is:

1. Open `frontend-mockup-reference.html` first to understand the target shell and information hierarchy.
2. Read this spec to understand how to translate that shell into the current React/Tailwind codebase.
3. Use the HTML file to guide layout and presentation choices.
4. Use this spec to decide what real components and live data must power each section.
5. If a mockup block has no live data yet, keep the visual slot but use a safe fallback instead of fake precision.

This means the HTML file answers:

- what the app should feel like
- what the page structure should look like
- how the map, top bar, rail, and inspector should relate visually

This spec answers:

- what Claude should implement now
- how to connect the mockup to live SiteSense components
- what must remain functional
- what shortcuts are acceptable for the hackathon

## Core Rule

Claude must preserve the working SiteSense analysis flow.

That means:

- keep the current data flow from `analyzeParcel()`
- keep the current `MapView.jsx` map operations
- keep the existing analysis result object as the source of truth
- reuse existing working components where possible
- only refactor the shell and presentation layer unless a small data-shape adjustment is required

## What Claude Should Do

### Phase 1 goal

Convert the provided HTML into a React/Tailwind application shell that:

- looks close to the mockup
- uses real SiteSense data
- keeps the app demo-stable
- improves the presentation for judges and non-technical users

### Phase 1 deliverable

A working app with:

- top app bar
- map workspace as the visual hero
- right-side inspector panel
- cleaner overview-first risk summary
- stronger report/export call-to-action

## What Claude Must Preserve

These current pieces should remain functional:

- `src/frontend/src/components/MapView.jsx`
- `src/frontend/src/api.js`
- `src/frontend/src/components/RiskCards.jsx`
- `src/frontend/src/components/ElevationChart.jsx`
- `src/frontend/src/components/CutFillVisual.jsx`
- `src/frontend/src/components/CostTable.jsx`
- `src/frontend/src/components/ReportButton.jsx`

Claude may wrap, restyle, or reorganize these components, but should not break the existing analysis workflow.

## What Claude Must Replace

The mockup includes static prototype elements that must be replaced with real app behavior.

Claude must:

- replace static map imagery with the real `MapView`
- replace hardcoded parcel metadata with real result data
- replace static risk examples with real risk summaries
- replace static terrain bars with real terrain content or existing chart entry points
- replace fake export/report buttons with real actions where possible

Claude should visually track the approved mockup file closely for:

- shell proportions
- top bar behavior
- utility rail placement
- inspector panel hierarchy
- overview-first property review flow

## Visual-To-Real Mapping

Claude should use the approved HTML mockup as the design reference for these real frontend areas:

- top app bar in the mockup
  - becomes the real `TopBar.jsx`
- left utility navigation in the mockup
  - becomes the real `UtilityRail.jsx`
- map canvas in the mockup
  - becomes the real `MapWorkspace.jsx` containing the live `MapView.jsx`
- selected parcel preview block in the mockup
  - becomes the top area of `OverviewTab.jsx` or the inspector header
- risk cards in the mockup
  - become live summary cards driven by current analysis results
- terrain summary card in the mockup
  - becomes a live terrain section using existing elevation/slope components
- report button in the mockup
  - becomes the real report/export call to action using existing report flow

The goal is not a literal one-to-one HTML port.
The goal is a faithful React implementation that visually resembles the approved mockup while using live SiteSense logic.

## What Claude Must Remove

Do NOT keep these mockup-only patterns:

- Tailwind CDN script
- inline `tailwind.config` script
- duplicated Google font includes
- static external placeholder images where real app data should be used
- fake parcel IDs and hardcoded addresses as live UI defaults

## Recommended Component Mapping

Claude should convert the mockup into components like this:

- `AppShell.jsx`
  - full page shell
- `TopBar.jsx`
  - logo, search, actions
- `UtilityRail.jsx`
  - left-side utility navigation
- `MapWorkspace.jsx`
  - wraps the live `MapView`
- `InspectorPanel.jsx`
  - right-side fixed/collapsible inspector
- `OverviewTab.jsx`
  - parcel metadata + top risks + key summary
- `ConstraintsTab.jsx`
  - risk cards / flood / wetlands / contamination / species
- `TerrainTab.jsx`
  - elevation / slope / cut-fill
- `WaterTab.jsx`
  - water/flood/stormwater content
- `CostTab.jsx`
  - cost table + now-vs-wait framing
- `ReportTab.jsx`
  - report CTA + AI summary

Claude does not need to build every tab fully in the first pass.
But the shell should support this structure.

## Recommended Execution Strategy

### Step 1

Refactor `App.jsx` into a shell-oriented structure.

Do not redesign the backend contract first.

### Step 2

Create the shell components and move current app content into:

- top bar
- map workspace
- inspector panel

### Step 3

Replace the current long right-side scroll with an `overview-first` inspector.

The first visible section should show:

- parcel summary
- feasibility/risk tone
- top 3 risks
- report action

### Step 4

Keep secondary analysis sections below or behind tabs/sections:

- terrain
- cost
- AI report
- detailed charts

### Step 5

Make the app look like the mockup without weakening demo stability.

### Step 6

Before finishing, compare the implemented UI back against `frontend-mockup-reference.html` and confirm that these are recognizable:

- top bar
- left utility rail
- map-dominant center
- right-side inspector
- overview-first parcel summary
- report action prominence

## UI Rules for Claude

Claude should preserve:

- map-left / inspector-right layout
- strong parcel-first workflow
- satellite-first feel
- report export path

Claude should improve:

- overall visual hierarchy
- top-level parcel metadata
- risk card presentation
- action button placement
- spacing and typography
- judge readability

Claude should avoid:

- turning the app into a generic dashboard
- hiding the map behind large cards
- rebuilding the whole frontend architecture if time is short
- introducing fragile dependencies just to match the mockup

## Data Mapping Rules

Claude should map these UI areas to real data where possible:

- `Parcel ID`
  - use real parcel identifier if available, otherwise use a clear fallback such as `Selected Parcel`
- `Address`
  - use searched address or fallback label
- `Acreage`
  - use `result.elevation.area_acres` or equivalent
- `Top risks`
  - derive from current analysis output
- `Terrain`
  - link to existing elevation/slope outputs
- `Cost`
  - use existing `costs` object

If a mockup field has no current live source, Claude should:

- use a safe fallback label
- not invent false precision

## Best Hackathon Implementation Scope

If time is limited, Claude should implement:

1. new shell
2. top bar
3. utility rail
4. right-side inspector redesign
5. better overview section
6. cleaner CTA placement

If more time remains, Claude can add:

7. tabs
8. collapsible sections
9. richer layer controls

## Files to Create or Edit

- `specs/frontend-mockup-reference.html` - approved visual source used together with this spec
- `specs/frontend-mockup-integration.md` - this spec
- `src/frontend/src/App.jsx` - refactor into shell
- `src/frontend/src/components/AppShell.jsx` - new shell wrapper
- `src/frontend/src/components/TopBar.jsx` - new header
- `src/frontend/src/components/UtilityRail.jsx` - new left rail
- `src/frontend/src/components/MapWorkspace.jsx` - wraps `MapView`
- `src/frontend/src/components/InspectorPanel.jsx` - new inspector shell
- `src/frontend/src/components/OverviewTab.jsx` - top-level parcel summary
- `src/frontend/src/components/RiskCards.jsx` - restyle and simplify for overview
- `src/frontend/src/components/CostTable.jsx` - better presentation inside inspector
- `src/frontend/src/components/ReportButton.jsx` - integrate into stronger CTA area

## Implementation Steps

1. [ ] Build `AppShell`, `TopBar`, and `UtilityRail`
2. [ ] Move the live `MapView` into `MapWorkspace`
3. [ ] Build a fixed/collapsible `InspectorPanel`
4. [ ] Create an `OverviewTab` or overview-first section using real result data
5. [ ] Restyle `RiskCards` to fit the new inspector
6. [ ] Restyle `CostTable` to fit the new inspector
7. [ ] Reposition `ReportButton` into a more prominent report/export area
8. [ ] Keep charts and detailed content below or behind sections/tabs
9. [ ] Verify that analyze flow still works end-to-end
10. [ ] Compare the finished shell against `frontend-mockup-reference.html` before handoff

## Demo Test

### Judge test

When the app loads and a parcel is analyzed, a judge should understand in under 10 seconds:

- what parcel is selected
- whether it looks risky or feasible
- what the main problems are
- where to click for the full report

### Functional test

The following must still work:

- search address
- draw parcel
- analyze parcel
- view risks
- view terrain section
- view cost section
- generate report

## Out of Scope

- replacing MapLibre
- rewriting the backend contract
- adding major new analysis features
- pixel-perfect recreation of every mockup detail
- introducing desktop-only assumptions

## Success Criteria

- Claude can implement the provided mockup as a real SiteSense shell
- the UI looks significantly more professional and client-facing
- the live analysis flow still works
- the app becomes easier to demo and easier for non-engineers to understand
