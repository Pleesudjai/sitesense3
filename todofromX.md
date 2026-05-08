# GIS Free Data for Land Development and Landowners

Prepared: 2026-03-21
Context: SiteSense planning notes for the next run

## Goal

Identify the highest-value free GIS datasets that help landowners, developers, and civil engineers answer these early questions:

- Can this site be built?
- What are the biggest engineering risks?
- What will probably drive cost?
- What can block entitlement, permitting, or financing?

Important note: free national GIS data is excellent for screening and early feasibility, but it is not a substitute for survey, geotechnical investigation, jurisdictional wetland work, or final engineering design.

## Recommended Decision Matrix

| Priority | Dataset | Agency | Engineering Value | Landowner Value | Implementation Effort | Best Use Cases | Main Caveat | Official Source |
|---|---|---|---|---|---|---|---|---|
| 1 | 3DEP elevation / lidar | USGS | Very High | Very High | Medium | slope, cut/fill, grading, pad fit, drainage direction, hillside risk | screening only; detail varies by coverage/resolution | https://www.usgs.gov/faqs/what-types-elevation-datasets-are-available-what-formats-do-they-come-and-where-can-i-download |
| 2 | NFHL flood hazard | FEMA | Very High | Very High | Low-Medium | flood zone, floodway, flood insurance, lender and permitting risk | does not replace local drainage studies or all recent conditions | https://www.fema.gov/fr/node/501308 |
| 3 | SSURGO soils | USDA NRCS | Very High | High | Medium | hydrologic soil group, shrink-swell, drainage class, septic limitations, pavement/foundation screening | planning dataset, not project-specific geotech | https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo |
| 4 | National Wetlands Inventory | USFWS | High | High | Medium | environmental constraint screening, likely permitting complexity | not a jurisdictional wetland determination | https://www.fws.gov/program/national-wetlands-inventory/wetlands-data |
| 5 | Atlas 14 precipitation frequency | NOAA | High | Medium | Low | stormwater assumptions, detention burden, runoff severity | must still be paired with local criteria/manuals | https://hdsc.nws.noaa.gov/pfds/ |
| 6 | Hydrography / watershed context | USGS | High | Medium | Medium | stream proximity, outfall context, watershed reasoning, drainage paths | national hydrography transitioned to 3DHP; layer selection matters | https://www.usgs.gov/3d-hydrography-program |
| 7 | Seismic design data | USGS | Medium-High | Medium | Low-Medium | structural/foundation screening in active regions | regional importance varies a lot | https://www.usgs.gov/programs/earthquake-hazards/design-ground-motions-portal |
| 8 | NLCD / impervious / land cover | MRLC | Medium | Medium | Low | surrounding development intensity, runoff context, vegetation/land cover context | lower priority than terrain/flood/soils | https://www.mrlc.gov/data/type/fractional-impervious-surface |
| 9 | Roads / geography / context layers | Census TIGER | Medium | Medium | Low | access context, frontage adjacency, regional context mapping | not a substitute for parcel/legal access review | https://www.census.gov/geographies/mapping-files/2025/geo/tiger-line-file.html |
| 10 | Parcel / zoning / utilities | Local county or city GIS | Very High | Very High | High | legal parcel context, setbacks, zoning, utilities, easements, frontage | not a single national source; highly fragmented | local jurisdiction portals |

## What Matters Most to Civil Engineering

### Highest-value screening stack

The best first stack for land development feasibility is:

1. USGS 3DEP
2. FEMA NFHL
3. USDA SSURGO
4. USFWS NWI

This stack answers most early civil questions:

- Is the site topographically buildable?
- Will grading likely be simple, moderate, or expensive?
- Is there flood or floodway risk?
- Are soils likely to create drainage, pavement, or foundation concerns?
- Are there environmental red flags before spending on due diligence?

### Why this order

- Elevation drives grading cost, drainage behavior, access difficulty, and retaining needs.
- Flood drives finance, insurance, site planning, and sometimes project viability.
- Soils drive infiltration assumptions, subgrade quality, shrink-swell risk, and septic/building limitations.
- Wetlands drive environmental review and permitting complexity.

## Parcel Screening Workflow

Use this sequence for a practical civil-engineering review of a parcel:

1. Start with parcel boundary and 3DEP terrain.
2. Map slope bands and identify likely building pads, drainage flow direction, and steep constraint zones.
3. Overlay FEMA flood data and flag any flood zone or floodway impact.
4. Overlay SSURGO and extract:
   - hydrologic soil group
   - drainage class
   - shrink-swell potential
   - flooding frequency
   - building site or septic limitations
5. Overlay wetlands and mark any mapped wetlands as due-diligence triggers.
6. Pull NOAA Atlas 14 rainfall values for preliminary stormwater burden.
7. Add hydrography/watershed context to understand offsite drainage and receiving system logic.
8. Finish with local GIS for zoning, utilities, frontage, easements, and jurisdiction-specific constraints.

## How SiteSense Should Use This

### Phase 1 layers to build first

- 3DEP elevation / slope / terrain-derived screening
- FEMA flood screening
- SSURGO soils screening
- NWI wetlands screening

### Why Phase 1 first

- Highest practical value to landowners
- Strongest tie to civil-engineering risk
- Best story for demo and early feasibility
- Mostly free and nationally available

### Phase 2 layers

- NOAA Atlas 14 rainfall
- Hydrography / watershed context
- Seismic data where regionally relevant

### Phase 3 layers

- Local county parcel overlays
- Zoning overlays
- Utilities and easements where available
- Land cover / impervious context

## Additional GIS Information People Consistently Want

This section is a second-pass answer to a practical question:

"What GIS information do people repeatedly recommend in real land development work, beyond the obvious national engineering layers?"

The short answer is yes. There are several layers that are strongly recommended in practice because they quickly expose legal, permitting, infrastructure, and hidden-cost issues.

### The "high-vibe" layers

These are the layers that people tend to care about immediately because they are easy to understand and directly tied to cost, delay, or project viability:

1. Parcel boundaries
2. Zoning and future land use
3. Utilities and utility easements
4. Access and frontage
5. Floodplain and floodway
6. Wetlands and streams
7. Soils and slope
8. Environmental contamination / cleanup sites
9. Endangered species / critical habitat
10. Historic or cultural resource flags

### Why these are repeatedly recommended

In actual site review and municipal review workflows, reviewers and practitioners repeatedly ask for:

- floodplain and floodway information
- topography and contour mapping
- natural features such as streams, wetlands, and unstable soils
- utilities and easements
- drainage systems and stormwater paths
- zoning and adjacent land use
- contamination or environmental constraints

This means the most recommended GIS is not just "pretty map data." It is the data that reveals:

- can I legally build here?
- can I physically serve the site?
- what will delay permits?
- what will create hidden cost?

## Priority Additions Beyond the Core National Stack

### Add immediately after Phase 1

#### 1. Local parcel, zoning, and future land use

This is probably the most important addition after terrain, flood, soils, and wetlands.

Why:

- landowners think in parcels, not raster cells
- zoning often determines viability faster than engineering does
- future land use reveals whether the jurisdiction expects similar development nearby
- setbacks, overlays, and land use restrictions often kill bad sites early

Recommendation:

- treat parcel + zoning as a top-tier practical layer, even though it is fragmented by county/city

#### 2. Utilities and easements

These are consistently requested in site plan and engineering review.

Why:

- water and sewer availability can dominate project cost
- utility extension distance can change deal economics
- easements can remove buildable area
- utility conflicts can reshape pad layout and access

Recommendation:

- prioritize available local GIS for water, sewer, storm, electric corridor, gas, telecom, and recorded easements where possible

#### 3. Environmental contamination / cleanup sites

This is one of the most underrated GIS categories for landowners.

Why:

- old industrial or commercial parcels may carry major environmental liability
- nearby regulated facilities can trigger due diligence questions
- cleanup status matters before acquisition and financing

Recommended source family:

- EPA Envirofacts
- EPA facility registry / geospatial downloads
- EPA cleanup and brownfield tools

#### 4. Endangered species / critical habitat

This becomes very important for projects with a federal nexus, sensitive habitat, or greenfield disturbance.

Why:

- can introduce consultation and mitigation requirements
- can delay schedules even when the site looks physically easy to build

Recommended source family:

- USFWS IPaC

#### 5. Historic / cultural resource flags

Not every site needs this first, but people who do entitlements or public work often recommend checking it early.

Why:

- historic resource issues can affect design and approvals
- state inventories and federal registers can trigger process requirements

Recommended source family:

- National Register of Historic Places spatial data
- SHPO inventories where available

## Region-Specific Layers That Become Very Important

These should be switched on when geography makes them relevant.

### Landslide susceptibility

Recommended for hillside, canyon, or mountain-adjacent parcels.

Why:

- slope alone does not capture all hillside risk
- landslide susceptibility is more meaningful than grade alone in some regions

Recommended source:

- USGS landslide inventory and susceptibility map

### Wildfire hazard

Recommended for western, exurban, and wildland-urban interface development.

Why:

- affects insurability, defensible space, access expectations, and development risk perception

Recommended source:

- USDA Forest Service Wildfire Hazard Potential

### Sea level rise / coastal flooding

Recommended only for coastal and tidal sites.

Why:

- FEMA alone does not answer long-horizon coastal risk
- useful for resilience-minded owners and investors

Recommended source:

- NOAA Sea Level Rise Viewer

## Practical Recommendation for SiteSense

If the goal is to build a tool that "feels smart" to landowners and civil engineers, the next best additions after the core engineering stack are:

1. Parcel + zoning + future land use
2. Utilities + easements
3. EPA contamination / cleanup context
4. USFWS species / critical habitat context
5. Region-specific hazard overlays such as landslide, wildfire, or coastal flooding

This is my recommendation:

- For engineering credibility, keep 3DEP + FEMA + SSURGO + NWI as the core.
- For user-perceived value, add parcel/zoning/utilities as soon as possible.
- For "surprise prevention," add contamination and species/habitat screening.
- For regional differentiation, add landslide, wildfire, and coastal overlays only where relevant.

## What We Probably Do Not Need Early

These are useful, but not urgent for the first meaningful product:

- broad demographic layers
- generic national basemaps beyond what is already used
- low-resolution land cover if it does not affect an actual recommendation
- highly specialized hazard layers with weak relevance to the target geography

## Strong Updated View

Yes, we do need more GIS information than the first core list if we want the product to match what people actually ask for in due diligence.

But the next additions should not be random.

The best next layers are the ones that answer:

- ownership and legal use
- service and access
- environmental liability
- permitting delay risk
- region-specific natural hazards

## Jacobs Consultant Additions

This section is extra guidance from a Jacobs-style consultant perspective.

Important status note:

- The previous core GIS stack is already executed and should remain the baseline.
- This section does not replace the earlier work.
- These are additional layers and outputs to add on top of the existing baseline so the product feels closer to consultant-grade site screening.

### Baseline already executed

The existing executed baseline is:

1. USGS 3DEP
2. FEMA NFHL
3. USDA SSURGO
4. USFWS NWI

### Extra layers Jacobs would want added

These are the next layers I would expect from a consultant workflow:

1. Parcel boundary and ownership context
2. Zoning, future land use, and overlay districts
3. Access, frontage, right-of-way, and roadway constraints
4. Water, sewer, storm, electric, gas, and telecom utility availability
5. Utility easements and major corridor conflicts
6. Environmental contamination and cleanup site context
7. Endangered species and critical habitat screening
8. Historic or cultural resource screening
9. Region-specific hazard overlays such as landslide, wildfire, or coastal flooding

### Why these are extra consultant layers

These layers are the ones that usually answer the questions a landowner, developer, or due-diligence consultant asks after the initial engineering screen:

- Can I legally use the site the way I want?
- Do I have enough access and frontage?
- Are utilities available without major offsite cost?
- Are there easements cutting into the buildable area?
- Are there environmental or cultural constraints that can delay approvals?
- Is there hidden liability that will scare off lenders, buyers, or partners?

### Recommended priority order for the Jacobs extras

Add these after the baseline in this order:

1. Parcel + zoning + future land use
2. Utilities + easements
3. Access + frontage + ROW constraints
4. EPA contamination / cleanup screening
5. Species / habitat screening
6. Historic / cultural screening
7. Region-specific hazard layers only where geography justifies them

### Consultant-grade outputs to calculate

For each added layer, SiteSense should avoid showing only a map polygon.
It should compute:

- parcel overlap
- distance to nearest relevant feature
- percent of parcel affected
- plain-English implication
- Low / Medium / High risk

### Additional consultant-facing outputs

To feel more like a consultant tool and less like a GIS viewer, add:

- estimated buildable area after mapped constraints
- utility proximity summary
- frontage and access summary
- top 3 deal risks
- top 3 due-diligence follow-ups

## Suggested SiteSense Output Model

Each parcel review should return a short structured summary like:

- Terrain risk: Low / Medium / High
- Flood risk: Low / Medium / High
- Soil/foundation concern: Low / Medium / High
- Wetland/environment concern: Low / Medium / High
- Stormwater burden: Low / Medium / High
- Development complexity score: 1-5
- Key reasons: 3-5 bullets in plain English

## Example High-Value User Insights

- "Most of the parcel is buildable, but the northeast corner exceeds a practical grading threshold."
- "FEMA flood mapping shows a direct planning constraint on part of the site."
- "Soils indicate poor drainage and possible higher stormwater management burden."
- "Mapped wetlands suggest permitting due diligence before concept design advances."
- "This site appears feasible, but likely not low-cost due to combined grading and drainage complexity."

## Caveats We Should Keep Repeating

- GIS screening is not final design.
- NWI wetlands data is not a jurisdictional delineation.
- SSURGO is not a geotechnical report.
- FEMA maps do not replace local drainage analysis.
- Local zoning, utilities, access rights, and easements often decide feasibility more than national layers.

## Recommended Next Run

### Immediate objective

Treat the previous core GIS stack as already executed baseline work, and prepare the next feature spec for the Jacobs consultant additions.

### Next-run tasks

1. Read `CLAUDE.md`, `docs/decisions.md`, and `docs/handoff.md`.
2. Confirm the current implementation status of the executed baseline layers:
   - elevation
   - flood
   - soils
   - wetlands
3. Create a new spec such as `specs/gis-jacobs-extra-layers.md`.
4. Define a normalized response contract for the next consultant-grade additions:
   - parcel / zoning
   - future land use
   - utilities
   - easements
   - access / frontage
   - contamination / cleanup context
5. Decide whether each added dataset should be consumed by API, map service query, or jurisdiction-specific local GIS source.
6. Implement the first end-to-end thin slice for one consultant-grade addition, preferably parcel + zoning + future land use.

### Best first implementation target

Start with:

- parcel boundary + zoning
- future land use
- utility availability summary
- easement / frontage constraint summary

This is the best next bundle to add after the already-executed engineering baseline.

## Open Research Questions

- What is the cleanest free access method for each layer in the current SiteSense stack: live API, map service query, or preprocessed local dataset?
- Should SiteSense score risk numerically first and then translate to plain English, or generate rule-based plain English directly?
- Which local Arizona county GIS layers should be added first after the national layers?
- Should a "landowner summary" and an "engineer summary" be separate outputs?

## Soil Layers We Can Actually Build

This section is a practical note for implementation.

Yes, we can build a strong soil layer for SiteSense, but the best approach is not to think of soils as a single flat polygon layer only.

The most useful model is:

- soil map polygons from SSURGO
- linked component data
- linked horizon data where needed
- derived plain-English risk outputs for users

### What the official USDA soil stack gives us

The NRCS soil data ecosystem gives us:

- `SSURGO` for official detailed soil survey polygons and tabular interpretations
- `Web Soil Survey` for parcel/AOI inspection and validation
- `Soil Data Access (SDA)` for programmatic queries
- `Official Soil Series Descriptions (OSD)` for profile context and typical horizon descriptions
- `gNATSGO` for generalized wall-to-wall coverage if we ever need broader but coarser soil coverage

### What we should build in Phase 1

For the first meaningful SiteSense soil implementation, build these outputs:

1. hydrologic soil group
2. drainage class
3. shrink-swell potential
4. flooding frequency
5. ponding frequency
6. depth to water table
7. depth to restrictive layer or bedrock
8. septic tank absorption field limitations
9. dwelling with basement limitations
10. local road or pavement subgrade limitations

Why these first:

- they map directly to civil-engineering screening decisions
- they are easier to explain in plain English
- they support grading, drainage, foundation, and landowner risk narratives
- they give high value without requiring full 3D soil rendering

### What we should build in Phase 2

If we want deeper consultant-grade soil analysis later, add:

1. component percentages within each map unit
2. horizon-level texture by depth
3. depth ranges for sand, silt, and clay changes
4. available water storage context
5. saturated hydraulic conductivity by horizon
6. hydric rating details
7. parent material context
8. erosion hazard or runoff tendency interpretations

### What "soil section layers" really means in implementation

If the user asks for soil sections or soil layers, this usually means horizon/profile data, not just map polygons.

In SSURGO terms, the useful logic is:

- `mapunit` = the mapped polygon unit
- `component` = the soils that make up that map unit
- `chorizon` = the vertical horizon/profile information within each component

So the app should not try to pretend the polygon itself is the full soil story.
The polygon is the geographic container.
The engineering insight comes from the linked component and horizon tables.

### Best product approach

For SiteSense, the right progression is:

1. Show the parcel soil polygon summary.
2. Return the highest-value screening attributes in plain English.
3. Add a "deeper soil profile" panel later that exposes component and horizon detail.

This keeps the first version useful and understandable without overbuilding.

### Suggested Soil Output Contract

Each parcel soil summary should return something like:

- dominant map unit symbol
- dominant soil name
- hydrologic soil group
- drainage class
- shrink-swell risk: Low / Medium / High
- water table concern: Low / Medium / High
- restrictive layer concern: Low / Medium / High
- septic suitability concern: Low / Medium / High
- pavement/foundation concern: Low / Medium / High
- top 3 soil takeaways in plain English

### Suggested Phase 2 Soil Profile Contract

When we add profile detail, return:

- component name
- component percent
- horizon top depth
- horizon bottom depth
- texture class
- clay percent
- sand percent
- saturated hydraulic conductivity
- pH if available/relevant
- restrictive feature flag

### Important caveat

SSURGO and SDA are excellent for parcel screening and early feasibility.
They are not a substitute for geotechnical borings, laboratory testing, or final foundation and pavement design.

### Recommended implementation direction

Start with SSURGO + SDA-derived summary attributes only.

Do not start by building full soil cross-sections or 3D profiles in the UI.

First make the system answer:

- Will infiltration likely be difficult?
- Are soils likely to hold water?
- Is shrink-swell a red flag?
- Is there a shallow restrictive layer?
- Is this likely to complicate foundations, septic, or pavement?

That is the highest-value soil screen.

## Chloride / Salinity / Corrosion Layer Feasibility

This section answers a more specialized question:

Can we build a chloride profile layer for SiteSense?

### Short answer

Not as a standard national off-the-shelf GIS layer.

What we can realistically build from the USDA soil stack is a salinity / corrosivity proxy layer, not a true chloride-by-depth map.

### What we can get

From SSURGO and Soil Data Access horizon tables, we can retrieve or derive soil chemistry-related attributes such as:

- `ec` for electrical conductivity
- `sar` for sodium adsorption ratio
- `gypsum`
- `caco3`
- `ph1to1h2o`

These live in horizon-level data and can help us infer salinity-related or aggressive-soil concerns.

### What we likely cannot get nationally

We do not currently have a standard national NRCS field that acts as a ready-made mapped chloride concentration profile for civil engineering use.

So if the product requirement is:

- chloride concentration by depth
- chloride contour polygons
- chloride profile map for corrosion design

the answer is probably no, not from SSURGO alone.

### Best practical product strategy

If the engineering need is really about buried utilities, concrete durability, or general aggressive soils, then the right feature is:

- `corrosion / aggressive soil proxy`

not:

- `literal chloride profile layer`

### Recommended proxy outputs

If we decide to build this capability, the output should look like:

- salinity concern: Low / Medium / High
- corrosive soil proxy: Low / Medium / High
- chemistry indicators available: EC, SAR, CaCO3, gypsum, pH
- plain-English note on whether site-specific geotechnical or laboratory testing is recommended

### Strong recommendation

Do not promise chloride mapping unless we have site-specific boring/lab data or a trusted external chloride dataset.

Instead:

1. expose the available SSURGO chemistry proxies
2. translate them into a conservative corrosion-risk screen
3. recommend geotech/lab follow-up when the proxy indicates concern

### Best use in SiteSense

This should be treated as:

- a specialist add-on layer
- lower priority than the main soil screening attributes
- useful for consultant-grade screening, but not needed for the first product milestone

## Open-Source House Concept to Estimate Pipeline

This section is a separate deep-dive on a new question:

Can SiteSense take a simple housing idea such as:

- 2 bed
- 2 bath
- 2 storey

and turn that into:

- a rough 3D concept
- a preliminary structural screen
- a rough U.S. construction cost estimate

### Strong answer

Yes, but only as a concept-to-ROM workflow.

We can realistically build:

- constrained concept generation
- procedural 3D massing / BIM
- preliminary structural analysis or structural complexity screening
- quantity takeoff
- rough U.S. cost estimation

We should not promise:

- permit-ready structural design
- exact bid pricing
- fully automatic code-compliant house engineering from a random sketch

### Core product view

The right product is not:

- "pure random 3D sketch"

The right product is:

- constrained generative layout
- converted into a BIM model
- checked with a simplified structural workflow
- priced with quantity-driven concept estimating

That is much more realistic and much more valuable.

## Open-Source-First Stack

### Best core stack

| Layer | Recommended Tool | Why it matters | Notes |
|---|---|---|---|
| Quick sketching | Sweet Home 3D | fast manual concepting and walkthroughs | open source, good for quick tests, weaker as a full BIM backbone |
| Procedural layout generation | Procedural-Building-Generator (Blender) | already implements grid placement and squarified treemaps for house plans | useful seed generator rather than final production BIM engine |
| Open BIM backbone | IfcOpenShell + Bonsai | strongest open-source IFC authoring and data workflow | best candidate for geometry, IFC, export, quantity data, and cost objects |
| Parametric CAD / backup BIM path | FreeCAD BIM | good open-source parametric modeling fallback | FreeCAD 1.0 integrated BIM support |
| Structural analysis default | FreeCAD FEM + CalculiX | easiest fully open path for strength-style FEM in a desktop workflow | better open-source default than building around a proprietary-cost solver |
| Structural analysis bridge | Ifc2CA | converts IFC models to FEM models for Code_Aster | useful when IFC-first workflow is chosen |
| Quantity takeoff and cost structure | IfcOpenShell cost API / Ifc5D | lets us store cost schedules and parametric quantity links | ideal for model-driven estimating |
| Extra QTO support | QuantityTakeoff-Python | helpful reference tool for grouped quantity extraction | optional helper rather than core engine |
| Hazard loads | ASCE Hazard Tool API | gets location-based wind, snow, seismic, flood, etc. | requires API key |
| Market calibration | NAHB + Census + BLS + PPI | lets us calibrate concept estimate to U.S. reality | best as calibration sources, not full line-item database |

### Important licensing note

OpenSees itself is a powerful structural analysis ecosystem and is very useful for research and internal workflows.

However, the OpenSeesPy package page indicates a commercial redistribution caveat.

That means:

- OpenSeesPy is still valuable for experiments and internal prototypes
- for a product-default open-source-first stack, CalculiX or Code_Aster is a safer primary recommendation

### What we should not build from scratch

Avoid building these from zero:

- IFC authoring engine
- FEM solver
- quantity-takeoff kernel
- cost schedule object model
- 3D mesh / GLB conversion pipeline

Instead, assemble them from existing open tools.

## Recommended System Architecture

### Service blocks

1. `Input normalizer`
   - captures bedrooms, bathrooms, storeys, target size, garage, lot assumptions, quality tier, location, and preferred structure template

2. `Layout generator`
   - creates multiple candidate floor plans using rule-based or procedural generation

3. `BIM / geometry builder`
   - converts the chosen candidate into IFC with walls, slabs, roof, openings, rooms, storeys, materials, and metadata

4. `Structural screen`
   - applies load assumptions, chooses a structural template, and runs a simplified structural workflow

5. `Quantity takeoff engine`
   - extracts wall area, roof area, slab volume, framing length, openings, finishes, rough-ins, and fixture counts

6. `Cost engine`
   - converts quantities into a rough estimate using cost libraries, location adjustments, and calibration factors

7. `Visualization / export`
   - exports IFC, GLB, preview images, and a plain-English concept report

## Recommended Algorithm

### Step 1: normalize the user brief

Input:

- bedrooms
- bathrooms
- number of storeys
- target gross floor area or budget
- location
- garage yes/no
- quality tier: economy / standard / premium
- structural system preference if known

Derived defaults:

- room program
- approximate room sizes
- minimum circulation rules
- default wall and floor assemblies
- default roof type

### Step 2: generate a room program

Create a room graph from the brief.

Example for `2 bed / 2 bath / 2 storey`:

- living
- kitchen
- dining or eat-in kitchen
- 2 bedrooms
- 2 bathrooms
- stair
- laundry / mech closet
- circulation / storage

Each room gets:

- minimum area
- preferred area
- adjacency rules
- daylight/exterior preference
- plumbing grouping flag

### Step 3: generate candidate plans

Do not make a single random plan.
Generate multiple constrained candidates from a fixed seed space.

Best first methods:

- grid placement
- squarified treemaps
- rectangular slicing / splitting

This recommendation is based on the open-source procedural Blender generator that already uses:

- grid placement
- squarified treemaps

### Step 4: score the candidate plans

Each plan should receive a weighted score.

Suggested objective:

`score = adjacency + circulation + structural regularity + wet-core compactness + envelope efficiency + code sanity - penalties`

Suggested penalty terms:

- too much hallway area
- impossible stair geometry
- bathroom or kitchen with no logical plumbing routing
- highly irregular spans
- too many exterior corners
- poor room proportions
- no useful furniture layout

### Step 5: convert the best plan to 3D / BIM

Extrude the chosen plan into a simple model with:

- wall thickness
- floor and roof assemblies
- openings
- storey heights
- stair volume
- basic materials

Store it as IFC first.

Why IFC first:

- geometry is reusable
- quantities are easier to derive consistently
- cost and structural metadata can live with the model

### Step 6: run a structural screen

For MVP, do not start with full structural code automation.

Start with:

- structure template selection
- load takedown
- regularity checks
- span checks
- hazard loads by location
- simplified member sizing recommendations

Recommended default structure templates:

- light wood frame
- slab on grade or crawlspace
- simple gable or hip roof

Recommended hazard inputs:

- wind
- snow
- seismic
- flood
- rain

The ASCE Hazard Tool API can provide location-based hazard data, but it requires an API key.

### Step 7: quantity takeoff

Derive these first:

- gross floor area
- exterior wall area
- interior partition length
- roof area
- slab or foundation volume
- window area and count
- door count
- drywall area
- insulation area
- flooring area
- cabinet length
- plumbing fixture count
- electrical rough-in count
- HVAC tonnage proxy

### Step 8: cost estimate

The rough estimating formula should be:

`Total Cost = Direct Construction + Site/Soft Costs + Overhead + Profit + Contingency`

For direct construction:

`Direct Construction = sum(quantity_i * unit_rate_i * location_factor_i * quality_factor_i)`

For calibration:

- use NAHB construction stage shares
- use Census housing characteristics for national / regional reality checks
- use BLS wage data for metro labor adjustment
- use PPI for escalation and trend adjustment

### Step 9: produce the final output

Output should include:

- 3D preview
- plan image
- approximate gross area
- structural system assumption
- hazard summary
- top 3 structural concerns
- top 3 cost drivers
- rough estimate range
- confidence note

## Best Estimating Strategy

### Use a hybrid estimator

The hardest missing piece in open source is a current, national, residential line-item cost database comparable to RSMeans.

So the correct strategy is hybrid:

1. derive quantities from geometry
2. map quantities to a lightweight cost library
3. calibrate totals against NAHB / Census / BLS / PPI benchmarks

### Practical cost model

Use two layers:

#### Layer A: geometry-driven quantities

- framing
- concrete
- roofing
- drywall
- finishes
- rough-ins

#### Layer B: benchmark calibration

- NAHB construction stage shares
- NAHB average cost per square foot for a typical home
- Census price-per-square-foot and housing characteristic data
- BLS local wage context
- PPI escalation

### Current benchmark notes

As of the source check used for this note:

- NAHB published `Cost of Constructing a Home-2024` on `January 20, 2025`
- that report shows average construction cost of `$428,215` for a typical single-family home with `2,647 sf` finished area, or about `$162/sf`
- Census says annual characteristics data for `2025` will be published on `July 1, 2026`
- BLS OEWS provides wage estimates for approximately `530` metro and nonmetro areas
- BLS PPI remains useful for escalation because it measures average change over time in producer selling prices

Important limitation:

- these sources are strong for calibration
- they are not a full open residential estimating catalog

## Recommended MVP

### MVP objective

Build a system that can turn a short residential brief into:

- 3 candidate plans
- 1 chosen 3D concept
- 1 preliminary structural screen
- 1 rough order-of-magnitude estimate

### Best MVP stack choice

1. procedural layout from the Blender procedural generator or a custom lightweight rule engine
2. IFC authoring with IfcOpenShell / Bonsai
3. structural screen with FreeCAD FEM + CalculiX or IFC -> Code_Aster through Ifc2CA
4. quantity takeoff with IfcOpenShell and optional QTO helper tools
5. cost engine calibrated with NAHB / Census / BLS / PPI

### What to defer to later

- diffusion-based floorplan generation
- detailed architectural styling
- automated permit-ready calculations
- exact local subcontractor pricing
- highly detailed MEP design

## Recommended Next Run for This Topic

1. Create a spec such as `specs/house-concept-estimator.md`
2. Decide the default structural template for v1
3. Decide whether the first generator is:
   - rule-based in Python
   - Blender procedural generator integration
4. Define the IFC schema subset we actually need
5. Define the minimum quantity set for estimating
6. Define a first-pass cost library and calibration workflow
7. Build one thin-slice example for a `2 bed / 2 bath / 2 storey` house

## Strong recommendation

Do not start from full FEM-first automation.

Start from:

- constrained layout generation
- IFC model creation
- quantity extraction
- benchmark-calibrated estimate
- structural complexity screen

That path gives the highest value fastest and uses the open-source ecosystem well.

## Useful Official Notes

- USGS 3DEP is free through The National Map.
- FEMA says NFHL is continuously updated and covers over 90 percent of the U.S. population.
- USDA NRCS refreshed the public soil survey database on 2024-10-01.
- USFWS says NWI updates are reflected twice each year and are not regulatory determinations.
- USGS retired NHD on 2023-10-01 and moved toward the 3D Hydrography Program.

## Source Links

- USGS elevation / 3DEP: https://www.usgs.gov/faqs/what-types-elevation-datasets-are-available-what-formats-do-they-come-and-where-can-i-download
- FEMA NFHL: https://www.fema.gov/fr/node/501308
- USDA SSURGO: https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo
- USDA 2024 soil refresh: https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/soil/2024-annual-soils-refresh
- USDA annual soils refresh: https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/soil/annual-soils-refresh
- USDA Web Soil Survey getting started: https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/soil/getting-started-with-web-soil-survey
- USDA Soil Data Access: https://sdmdataaccess.sc.egov.usda.gov/
- USDA Soil Data Access web services help: https://sdmdataaccess.nrcs.usda.gov/WebServiceHelp.aspx
- USDA Official Soil Series Descriptions: https://www.nrcs.usda.gov/resources/data-and-reports/official-soil-series-descriptions-osds
- USDA gNATSGO: https://www.nrcs.usda.gov/resources/data-and-reports/gridded-national-soil-survey-geographic-database-gnatsgo
- USFWS wetlands data: https://www.fws.gov/program/national-wetlands-inventory/wetlands-data
- USFWS wetlands contact and update notes: https://www.fws.gov/program/national-wetlands-inventory/contact-us
- NOAA PFDS / Atlas 14: https://hdsc.nws.noaa.gov/pfds/
- USGS 3D Hydrography Program: https://www.usgs.gov/3d-hydrography-program
- USGS seismic design portal: https://www.usgs.gov/programs/earthquake-hazards/design-ground-motions-portal
- USGS landslide inventory and susceptibility map: https://www.usgs.gov/tools/us-landslide-inventory-and-susceptibility-map
- MRLC impervious data: https://www.mrlc.gov/data/type/fractional-impervious-surface
- Census TIGER: https://www.census.gov/geographies/mapping-files/2025/geo/tiger-line-file.html
- USFWS IPaC overview: https://www.fws.gov/service/information-planning-and-consultation
- USFWS IPaC tool: https://ipacb.ecosphere.fws.gov/
- EPA Cleanups in My Community: https://www.epa.gov/cleanups/cleanups-my-community
- EPA contaminated site locations and program links: https://www.epa.gov/risks-contaminated-sites/contaminated-site-locations-and-contact-information
- EPA Envirofacts: https://www.epa.gov/enviro
- NOAA Sea Level Rise Viewer: https://coast.noaa.gov/digitalcoast/tools/slr.html
- USDA Forest Service Wildfire Hazard Potential: https://research.fs.usda.gov/firelab/products/dataandtools/wildfire-hazard-potential
- NPS National Register spatial data: https://www.nps.gov/orgs/1094/nrhp_spatialdata.htm
- NPS SHPO inventories: https://www.nps.gov/subjects/nationalregister/shpo-inventories.htm
- Austin Land Use Review: https://www.austintexas.gov/department/land-use-review
- Austin pre-submittal site plan guide: https://www.austintexas.gov/sites/default/files/files/Development_Services/SP_ApplicantGuidePresubmittalConsultations.pdf
- Elk Grove tentative map checklist: https://elkgrove.gov/filing-planning-application/tentative-map-checklist
- IfcOpenShell home: https://ifcopenshell.org/
- IfcOpenShell docs: https://docs.ifcopenshell.org/
- IfcOpenShell cost API: https://docs.ifcopenshell.org/autoapi/ifcopenshell/api/cost/index.html
- Ifc2CA: https://docs.ifcopenshell.org/ifc2ca.html
- Ifc5D: https://docs.ifcopenshell.org/ifc5d.html
- Bonsai docs: https://docs.bonsaibim.org/
- Bonsai installation: https://docs.bonsaibim.org/quickstart/installation.html
- FreeCAD 1.0 release: https://blog.freecad.org/2024/11/19/freecad-version-1-0-released/
- FreeCAD FEM getting started: https://blog.freecad.org/2025/09/16/getting-started-with-fem/
- CalculiX: https://www.calculix.de/
- OpenSees official: https://peer.berkeley.edu/opensees
- OpenSeesPy package: https://pypi.org/project/openseespy/
- Sweet Home 3D: https://www.sweethome3d.com/
- Procedural Building Generator: https://github.com/wojtryb/Procedural-Building-Generator
- QuantityTakeoff-Python: https://github.com/datadrivenconstruction/QuantityTakeoff-Python
- ASCE Hazard Tool about: https://www.asce.org/publications-and-news/asce-hazard-tool/about
- ASCE Hazard Tool API: https://www.asce.org/publications-and-news/asce-hazard-tool/api
- NAHB Cost of Constructing a Home-2024: https://www.nahb.org/news-and-economics/housing-economics-plus/special-studies/special-studies-pages/cost-of-constructing-a-home-in-2024
- Census Characteristics of New Housing: https://www.census.gov/construction/chars/index.html
- BLS OEWS overview: https://www.bls.gov/oes/oes_emp.htm
- BLS PPI home: https://www.bls.gov/ppi/
