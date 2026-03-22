# Feature Spec: Site-Responsive House Design
Date: 2026-03-21
Layer: design-engine

## What We're Building
Build a site-responsive concept design workflow that uses elevation point cloud data, GIS constraints, and climate data to recommend a house pad, orientation, basic massing direction, room zoning logic, and window strategy.

This feature is for `conceptual pre-design`.
It is not permit-ready design and not a substitute for licensed architectural or engineering review.

Claude should use this spec together with:

- [house-concept-estimator.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/house-concept-estimator.md)
- [problem-statement-and-user-needs.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/problem-statement-and-user-needs.md)
- [price-prediction-data-stack.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/price-prediction-data-stack.md)

## Product Purpose
Users do not only want to know if land is risky.
They also want to know:

- where the house should likely sit
- which direction it should face
- where views, daylight, and wind should influence the layout
- how site constraints should shape the concept

The goal is to translate raw site intelligence into a believable house-direction recommendation.

## Professional Review Required
This workflow must clearly state:

- outputs are conceptual recommendations only
- a licensed architect and/or engineer must review and improve the design
- local code, zoning, geotechnical investigation, and jurisdiction review still control final design

This requirement must appear in:

- the spec
- UI language
- API output
- generated reports

## Core Inputs

### Terrain data

- lidar point cloud or equivalent elevation point cloud
- derived DEM or bare-earth model
- optional DSM including trees and structures

### GIS constraints

- parcel boundary
- setbacks
- easements
- floodplain and floodway
- wetlands and buffers
- hydrography and drainage features
- access/frontage
- utilities when available
- zoning overlays when available

### Climate and weather

- wind direction and seasonal wind behavior
- solar path / solar exposure
- temperature context
- optional humidity context

### Program inputs

- target house size
- bedrooms / bathrooms
- number of stories
- style preference if available
- view preference if available
- energy priority if available

## What The Engine Should Produce

### Primary outputs

- recommended house pad area
- recommended building orientation
- recommended driveway/access direction
- conceptual buildable envelope
- rough room-zoning logic
- rough window placement strategy
- explanation of why the recommendation was made

### Example window output

Instead of saying only:

- "put windows on the west side"

The engine should say something like:

- "Place primary operable windows on the southeast and northwest facades to support summer cross-ventilation based on local wind patterns."
- "Reduce unshaded west glazing because afternoon heat gain is high."
- "Use smaller service-space openings on the least favorable facade."

## Main Design Logic

The system should score candidate design options, not invent one random answer.

### Stage 1: Terrain preparation

Convert point cloud data into terrain products:

- bare-earth DEM
- slope raster
- aspect raster
- contour lines
- drainage direction / flow accumulation
- candidate flat or low-earthwork pad zones

Optional:

- DSM for tree/building obstruction
- viewshed layers
- shadow/horizon analysis

### Stage 2: Constraint envelope

Build the usable design envelope by subtracting or penalizing:

- setbacks
- easements
- wetlands and buffers
- floodway / floodplain overlap
- stream buffers
- steep slopes
- access limitations

Output:

- net buildable zone
- preferred buildable zone
- excluded zone

### Stage 3: Candidate house placement

Generate multiple candidate house locations and orientations.

Each candidate should vary:

- pad location
- building rotation
- driveway approach
- footprint type
- story count effect on pad demand

### Stage 4: Candidate scoring

Each candidate should receive weighted scores for:

- `buildability_score`
  - inside usable envelope
  - compatible with setbacks and easements
- `cut_fill_score`
  - low grading burden
  - low retaining-wall burden
- `drainage_score`
  - avoids obvious runoff concentration
  - keeps structure away from drainage conflict areas
- `solar_score`
  - supports good daylight and useful solar orientation
- `ventilation_score`
  - supports operable cross-ventilation from preferred seasonal winds
- `view_privacy_score`
  - balances views and neighbor/privacy conditions
- `hazard_penalty`
  - penalizes flood, wetlands, unstable area, contamination proximity, or extreme slope
- `cost_penalty`
  - penalizes difficult pad, access, utility extension, or high mitigation burden

The engine should rank the top options rather than returning only one.

## Orientation and Window Logic

### Solar logic

Use local climate and solar path to guide glazing and orientation.

Default rules:

- prefer orientations that reduce harsh unshaded west exposure in hot climates
- favor better-controlled north/south daylight where feasible
- use solar logic to place major living spaces on favorable facades
- place service or buffer spaces on less favorable facades when helpful

### Wind logic

Do not use annual average prevailing wind alone.

The engine should consider:

- comfort wind
  - when airflow is desirable for natural ventilation
- hazard wind
  - when wind-driven rain, dust, fire exposure, or high-wind pressure matter more than comfort

Default rules:

- place operable intake windows on the preferred seasonal windward side
- place operable exhaust windows on the opposite or leeward side
- support cross-ventilation across occupied rooms where possible
- use higher exhaust openings or clerestory logic where stack effect is beneficial
- reduce or harden vulnerable glazing on hazardous wind exposures where needed

### Terrain interaction logic

The engine should also consider:

- slope-facing facades
- uphill vs downhill entries
- daylight blocked by terrain or vegetation
- view opportunities
- cold-air drainage or exposure differences where relevant

## What Open-Source Tools Can Help

### Terrain and GIS processing

- `PDAL`
  - point cloud processing and rasterization
- `GRASS GIS`
  - slope, aspect, viewshed, solar, hydrology
- `QGIS`
  - inspection and manual validation
- `WhiteboxTools`
  - optional terrain/hydrology processing

### Climate and building simulation

- `EnergyPlus`
  - building energy and ventilation simulation
- `OpenStudio`
  - workflow automation around EnergyPlus
- `Radiance`
  - daylight analysis
- `Ladybug Tools`
  - solar, sun-path, and wind-rose workflows

### Advanced optional wind analysis

- `OpenFOAM`
  - detailed CFD around terrain/building forms

OpenFOAM is later-phase, not MVP-required.

## GitHub Reference Stack

There is not one strong open-source GitHub project that already delivers the full end-to-end workflow:

- point cloud
- GIS constraints
- house siting
- solar and wind reasoning
- room layout
- BIM output
- client-facing explanation

Claude should not assume this entire feature already exists in one reusable repo.

Instead, Claude should treat GitHub as a source of reusable subsystems and reference logic.

### Closest GitHub references

- `stgeorges/gismo`
  - best GIS and environmental site-analysis reference inside Grasshopper
  - useful for terrain, solar, shading, water-flow, and contextual GIS patterns
- `ladybug-tools/ladybug`
  - best weather and EPW analysis base
- `ladybug-tools/honeybee-energy`
  - best open-source energy and orientation simulation layer
- `ladybug-tools/honeybee-radiance`
  - best daylight and radiation analysis layer
- `ladybug-tools/butterfly`
  - useful for OpenFOAM-based airflow studies
- `RWTH-E3D/carbonfly`
  - useful reference for ventilation and window-driven airflow analysis
- `wojtryb/Procedural-Building-Generator`
  - best house-layout generation reference found so far
- `amitukind/architect3d`
  - best browser-side 2D planner plus 3D viewer reference
- `IfcOpenShell/IfcOpenShell`
  - best BIM and IFC backbone
- `cvillagrasa/IfcOpenHouse`
  - strong small example for generating a house IFC model programmatically
- `ni1o1/pybdshadow`
  - useful fast shadow-analysis helper
- `open-wind/openwindenergy`
  - useful as a pattern for automatic GIS-constraint aggregation, even though it is for wind siting rather than houses

### Best reusable architecture from GitHub

If Claude wants the strongest reference architecture, it should think in this order:

1. `Gismo`
   - site and terrain intelligence reference
2. `Ladybug + Honeybee`
   - weather, solar, daylight, and energy reasoning
3. `Butterfly` or `Carbonfly`
   - optional airflow and ventilation reference
4. `Procedural-Building-Generator`
   - room and massing generation reference
5. `IfcOpenShell` or `IfcOpenHouse`
   - BIM export and structured model reference
6. `architect3d`
   - browser planning interaction reference

### Startup licensing caution

Many of the strongest environmental-analysis repos are under:

- `GPL`
- `AGPL`
- other copyleft licenses

Claude must treat that as an implementation constraint.

For startup-friendly execution:

- use copyleft tools as research/reference or optional offline workflows when appropriate
- prefer permissive components for core proprietary service layers when possible
- avoid blindly embedding GPL or AGPL dependencies into the main product backend without review

### Practical rule for Claude

Claude should not try to directly glue all of these repositories into one hackathon feature.

Claude should:

- borrow concepts and workflow patterns
- reuse permissive libraries where practical
- keep the first SiteSense implementation lightweight and rule-based
- reserve heavier simulation integrations for later phases

## Recommended MVP Approach

For the first version, Claude should not build a full simulation-heavy design platform.

MVP should use:

- terrain-derived buildable zone
- rule-based pad selection
- rule-based orientation scoring
- simplified wind and solar heuristics
- room zoning recommendations
- plain-English window strategy

This is enough to create a credible concept recommendation.

## Recommended Output Shape

Example API-style output:

```json
{
  "site_design": {
    "recommended_pad": {
      "center": [-111.95, 33.42],
      "area_sqft": 4200,
      "reason": "Lowest grading burden within the preferred buildable zone."
    },
    "orientation": {
      "preferred_rotation_deg": 18,
      "reason": "Balances daylight, summer ventilation, and reduced west heat gain."
    },
    "window_strategy": [
      "Place main operable windows on southeast and northwest facades for cross-ventilation.",
      "Limit unshaded west-facing glazing due to afternoon heat gain.",
      "Use smaller service-space openings on the least favorable facade."
    ],
    "room_zoning": [
      "Place living/dining on the best daylight facade.",
      "Use garage/service core as buffer on the hottest or least favorable side."
    ],
    "warnings": [
      "Concept only. Licensed professional review required.",
      "Local geotechnical and drainage review still needed."
    ]
  }
}
```

## Demo Experience

For the UI and PDF, users should see:

- "Best location for the house"
- "Best direction to face the house"
- "Why this direction works"
- "How wind, sun, and slope influenced the recommendation"
- "What a real architect/engineer still needs to confirm"

This should feel like a smart early design advisor, not a black box.

## Implementation Strategy

### Phase 1

- accept DEM/slope/aspect/buildable envelope inputs
- generate candidate pads and orientations
- score options with terrain + GIS + simple solar/wind heuristics
- return ranked recommendations and explanations

### Phase 2

- add viewshed
- add tree/obstruction logic from DSM
- add better room adjacency and massing logic
- add weather-file-driven solar and ventilation scoring

### Phase 3

- integrate EnergyPlus / OpenStudio
- integrate Ladybug or Radiance workflows
- optionally integrate CFD or more detailed airflow analysis

## Files to Create or Edit

- `specs/site-responsive-house-design.md` - this spec
- `src/backend/concept/` - candidate placement and scoring logic
- `src/backend/gis/` - terrain and envelope helpers
- `netlify/functions/house_estimate.py` - integrate design recommendations into concept estimate flow
- `src/frontend/src/components/` - show orientation, pad, and window-strategy outputs
- `src/backend/report/` - include design rationale in PDF

## Success Criteria

- the system can recommend a plausible house pad and orientation from terrain + GIS inputs
- the system can explain window and room-zoning logic in plain English
- the system uses climate and terrain as meaningful inputs, not decoration
- the system stays clearly within conceptual pre-design boundaries
- the output is useful to homeowners, architects, and engineers as an early handoff artifact

## Sources

- USGS 3DEP products and services: https://www.usgs.gov/3d-elevation-program/about-3dep-products-services
- PDAL docs: https://pdal.io/en/stable/
- PDAL GDAL writer: https://pdal.io/en/2.9.0/stages/writers.gdal.html
- GRASS r.slope.aspect: https://grass.osgeo.org/grass70/manuals/r.slope.aspect.html
- GRASS r.viewshed: https://grass.osgeo.org/grass84/manuals/r.viewshed.html
- GRASS r.sunmask: https://grass.osgeo.org/grass-stable/manuals/r.sunmask.html
- DOE daylighting: https://www.energy.gov/energysaver/daylighting
- DOE passive solar homes: https://www.energy.gov/energysaver/passive-solar-homes
- DOE natural ventilation: https://www.energy.gov/energysaver/natural-ventilation
- NOAA Local Climatological Data: https://www.ncei.noaa.gov/products/land-based-station/local-climatological-data
- NREL NSRDB API: https://developer.nrel.gov/docs/solar/nsrdb/
- EnergyPlus: https://www.nrel.gov/research/software/energyplus
- OpenStudio: https://www.nrel.gov/research/software/openstudio
- Radiance open-source announcement: https://www.radiance-online.org/download-install/license/open-source-announcement.html
- Ladybug Tools wind rose docs: https://www.ladybug.tools/ladybug/docs/ladybug.windrose.html
- OpenFOAM docs: https://www.openfoam.com/documentation/
- FEMA wind retrofit guide: https://www.fema.gov/sites/default/files/documents/fema_rsl_fema-p-804-wind-retrofit-guide_042025.pdf
