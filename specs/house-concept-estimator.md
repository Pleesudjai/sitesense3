# Feature Spec: House Concept Estimator MVP
Date: 2026-03-21
Layer: backend-module + netlify-function + frontend + ai-prompt

## What We're Building
Add a new SiteSense workflow that turns a simple residential brief such as `2 bed / 2 bath / 2 storey` into:

- 3 candidate concept layouts
- 1 selected concept summary
- a simple 3D/BIM-ready geometry model
- a preliminary structural screen
- a rough U.S. construction cost estimate range

This is a concept-to-ROM feature, not permit-ready design automation.
All outputs are pre-design decision-support artifacts and must be reviewed, corrected, and advanced by a qualified licensed engineer and other required professionals before submission to any authority.

## Open-Source Strategy

### Use now in runtime
- Rule-based / procedural layout generation in Python
- Lightweight geometry model in Python
- Quantity takeoff in Python
- Structural screening using simplified engineering rules and load takedown
- Existing SiteSense AI/reporting stack for plain-English output

### Use as reference or Phase 2 integration
- `IfcOpenShell` for IFC export and BIM object structure
- `Bonsai` for IFC authoring workflow ideas and manual validation
- `FreeCAD FEM + CalculiX` for offline validation of structural assumptions
- `Ifc2CA` for future IFC-to-FEA workflow
- `Procedural-Building-Generator` as an algorithm reference for grid placement and squarified treemaps

### Do not require in the first Netlify thin slice
- Blender desktop runtime
- FreeCAD desktop runtime
- full FEM solving in the Lambda
- diffusion-based plan generation

## Inputs / Outputs

### Input
- bedrooms
- bathrooms
- storeys
- target floor area range
- location or ZIP code
- garage yes/no
- quality tier: economy / standard / premium
- structure template: auto / wood-frame / masonry / light steel

### Output
- 3 candidate plans with scores
- selected plan geometry summary
- gross floor area estimate
- story-by-story room program
- structural template used
- hazard/location assumptions
- top structural concerns
- top cost drivers
- ROM cost range
- plain-English summary for landowner/user
- professional-review-required disclaimer

## Product Positioning

This feature should feel like:

- a fast concept feasibility assistant
- a quantity-driven estimator
- a structural complexity screener

It should not be marketed as:

- stamped engineering
- permit-ready structural design
- exact contractor bid pricing
- authority-submittal documentation

## Professional Review Required

This feature must always be presented as an early-stage concept and screening workflow.

Required position:

- the generated plan is conceptual only
- the structural output is a preliminary screen only
- the estimate is a rough order of magnitude only
- final design must be reviewed and improved by a real engineer
- final permit documents must be prepared, checked, and stamped where required by licensed professionals
- jurisdictional submission requirements always control

This requirement is not optional.
The product should carry this message in the spec, API response language, UI language, and any generated report.

## Architecture Decision

### Decision
Build the first version as a separate workflow and endpoint, not as a risky modification to the existing parcel analysis flow.

### Why
- Keeps current SiteSense GIS demo stable
- Lets us iterate on concept-generation logic independently
- Avoids overloading the existing `analyze` function with unrelated responsibilities

## Runtime Design

### New backend modules
- `src/backend/concept/program.py`
  - normalize user brief into a room program
- `src/backend/concept/layout.py`
  - generate candidate rectangular plans
- `src/backend/concept/scoring.py`
  - score each plan for adjacency, circulation, compactness, and structural regularity
- `src/backend/concept/geometry.py`
  - convert chosen plan into simple wall/slab/roof/opening geometry
- `src/backend/concept/quantities.py`
  - derive takeoff quantities from concept geometry
- `src/backend/engineering/house_loads.py`
  - residential load assumptions and hazard lookups
- `src/backend/engineering/house_structural.py`
  - structural complexity screen and simple load takedown
- `src/backend/engineering/house_cost.py`
  - quantity-driven ROM estimate and benchmark calibration
- `src/backend/ai/concept_translate.py`
  - plain-English summary for concept estimate output

### New endpoint
- `netlify/functions/house_estimate.py`
  - POST endpoint for concept generation and estimate response

### Frontend additions
- `src/frontend/src/api.js`
  - add `estimateHouseConcept()`
- `src/frontend/src/components/HouseConceptForm.jsx`
  - collect simple residential brief
- `src/frontend/src/components/HouseEstimateResults.jsx`
  - render candidates, selected concept, structural notes, and estimate range

## Data Model

### Normalized room program
Each room should include:
- room type
- min area
- target area
- floor preference
- adjacency requirements
- exterior wall preference
- wet-room flag

### Concept plan object
Each candidate plan should include:
- footprint width/depth
- storey count
- room rectangles by storey
- stair geometry placeholder
- total circulation area
- plumbing core grouping
- structural spans by direction
- score breakdown

### Quantity model
Each selected plan should derive:
- gross floor area
- exterior wall area
- interior partition length
- roof area
- foundation/slab area or volume
- window count and area
- door count
- drywall area
- insulation area
- flooring area
- cabinet length proxy
- fixture count
- rough electrical and plumbing point counts

## Algorithm

### Step 1: brief normalization
Convert user inputs into a bounded room program.

Example for `2 bed / 2 bath / 2 storey`:
- living room
- kitchen
- dining or eat-in space
- primary bedroom
- secondary bedroom
- 2 bathrooms
- stair
- laundry / mech
- closets / circulation

### Step 2: candidate generation
Generate multiple plans using rule-based rectangular logic.

Use:
- grid placement
- rectangular subdivision
- wet-core clustering
- stair placement constraints

Generate at least 3 candidates per request.

### Step 3: candidate scoring
Score each candidate on:
- adjacency quality
- circulation efficiency
- structural regularity
- plumbing compactness
- envelope efficiency
- furniture plausibility

Penalty examples:
- excessive hallway area
- impossible stair geometry
- oversized spans
- disconnected wet rooms
- highly irregular footprint

### Step 4: geometry build
Convert the selected plan into simple 3D-ready geometry:
- walls
- floors
- roof
- doors
- windows
- room solids or zones

The first version may return JSON geometry only.
Optional IFC export is a Phase 1.5 enhancement if dependency size/runtime remains acceptable.

### Step 5: structural screen
Use a simplified residential structural workflow:
- choose structural template
- assign dead/live loads
- apply hazard assumptions by location
- estimate governing spans
- flag complexity or risk

Default first template:
- light wood-frame
- slab-on-grade
- simple roof form

### Step 6: cost estimate
Estimate cost from quantities, then calibrate against national benchmarks.

Formula:

`total_cost = direct_cost + soft_costs + overhead_profit + contingency`

`direct_cost = sum(quantity_i * unit_rate_i * location_factor_i * quality_factor_i)`

### Step 7: AI summary
Translate the technical output into:
- simple design summary
- major structural assumptions
- top 3 cost drivers
- confidence / limitation note
- professional-review-required warning

## Estimating Strategy

### Use a hybrid approach
Do not try to recreate RSMeans.

Instead:
1. derive quantities from generated geometry
2. map them to a lightweight internal cost library
3. calibrate the totals using public U.S. benchmark sources

### Calibration sources
- NAHB `Cost of Constructing a Home-2024`
- Census `Characteristics of New Housing`
- BLS `Occupational Employment and Wage Statistics`
- BLS `Producer Price Index`

### First estimate output
Return:
- low estimate
- expected estimate
- high estimate
- cost per square foot
- top cost drivers
- quality/location multipliers used
- clear note that estimate is non-binding and requires professional review

## Hazard / Location Inputs

For v1, location should affect:
- seismic context
- wind context
- snow context
- flood note
- regional labor / cost multipliers

If ASCE Hazard Tool API is not immediately available, use:
- current SiteSense seismic logic
- simple regional lookup tables for wind/snow defaults
- a clear fallback note in output

## Files to Create or Edit
- `specs/house-concept-estimator.md` - this spec
- `src/backend/concept/__init__.py` - new package
- `src/backend/concept/program.py` - room program normalization
- `src/backend/concept/layout.py` - candidate layout generation
- `src/backend/concept/scoring.py` - plan scoring
- `src/backend/concept/geometry.py` - 3D-ready concept geometry
- `src/backend/concept/quantities.py` - quantity takeoff
- `src/backend/engineering/house_loads.py` - residential loads and location factors
- `src/backend/engineering/house_structural.py` - structural screen
- `src/backend/engineering/house_cost.py` - concept estimating
- `src/backend/ai/concept_translate.py` - AI plain-English translation
- `netlify/functions/house_estimate.py` - concept estimate endpoint
- `src/frontend/src/api.js` - add concept endpoint helper
- `src/frontend/src/components/HouseConceptForm.jsx` - new form
- `src/frontend/src/components/HouseEstimateResults.jsx` - result viewer
- `src/frontend/src/components/ProfessionalReviewNotice.jsx` - persistent review/disclaimer notice

## Implementation Steps
1. [ ] Create `src/backend/concept/` package
2. [ ] Build brief-to-room-program normalization
3. [ ] Build rectangular candidate layout generator
4. [ ] Build plan scoring function and return top 3 candidates
5. [ ] Build simple geometry + quantity extraction
6. [ ] Build structural template selector and structural screen
7. [ ] Build ROM cost engine with public benchmark calibration
8. [ ] Build `house_estimate.py` Netlify function
9. [ ] Add plain-English AI translation layer
10. [ ] Add persistent professional-review-required notice to API/UI/report output
11. [ ] Add basic frontend form and result panel
12. [ ] Test with one fixed residential brief and one location

## Demo Test

### Primary demo
- Brief: `2 bed / 2 bath / 2 storey`
- Area target: `1,400-1,800 sf`
- Location: `Tempe, AZ`
- Quality tier: `standard`

### Expected demo result
- returns 3 candidate layouts
- selects 1 highest-scoring concept
- returns gross floor area and room schedule
- returns structural system assumption and top 3 structural concerns
- returns low / expected / high estimate
- returns plain-English summary understandable to a homeowner
- prominently states that a licensed engineer must review and improve the output before any authority submission

## Out of Scope
- permit-ready framing plans
- full MEP design
- full nonlinear FEA in Lambda runtime
- exact city permit fees for every jurisdiction
- exact subcontractor pricing by ZIP
- photoreal rendering
- diffusion-model plan generation
- custom architectural style generation
- stamped engineering or code certification
- direct submission to authorities without licensed professional review

## Success Criteria
- A user can input a simple home brief in under 60 seconds
- The system returns 3 plausible concept candidates
- The selected concept has internally consistent room program and size totals
- The system produces a believable structural screen
- The system produces a quantity-based ROM estimate instead of only a naive $/sf guess
- The response clearly states assumptions and limitations
- The response always includes a clear statement that the output is not legal/permit-ready and requires licensed professional review
