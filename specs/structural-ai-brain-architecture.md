# Feature Spec: Structural AI Brain Architecture
Date: 2026-03-21 | Updated: 2026-03-22 (verified against code)
Layer: architecture
Status: IMPLEMENTED — verified against `netlify/functions/analyze.js`

## What We're Building
Design a hybrid AI architecture for structural design and other complex mathematical workflows.

The goal is not to create one large freeform chatbot.
The goal is to create a system in which:

- language models organize and explain work
- deterministic tools perform calculations
- verification layers check results
- outputs remain reviewable by real engineers

This spec should guide Claude when building AI-assisted structural and math features for SiteSense or a future startup product.

## Core Principle
For structural design and complex math, the AI should not be the final calculator.

The AI should act as:

- planner
- parser
- orchestrator
- explainer
- reviewer assistant

The actual calculations, simulations, and constraint solving should be delegated to deterministic tools wherever possible.

## Why This Architecture Is Needed

### Structural design is safety-critical

Structural and civil engineering decisions affect safety, liability, and regulatory compliance.
A model that sounds confident is not enough.

### LLM-only reasoning is not reliable enough

LLMs are strong at:

- extracting requirements
- synthesizing information
- planning a workflow
- translating technical findings

LLMs are weak at:

- guaranteed arithmetic reliability
- stable multi-step formal logic
- strict unit discipline
- auditable solver-grade numerical work

### The right pattern is hybrid

The strongest architecture combines:

- `language reasoning`
- `symbolic and numeric computation`
- `simulation tools`
- `verification and critique`

## Architectural Pattern

Claude should think of the system as `three cooperating brains`.

### 1. Language Brain

Responsibilities:

- interpret the user's request
- extract geometry, materials, loads, site constraints, and objectives
- convert unstructured language into structured problem definitions
- retrieve relevant knowledge and code context
- explain results in plain English or engineer-facing language

This brain should not be trusted as the only source of arithmetic truth.

### 2. Math and Physics Brain

Responsibilities:

- perform symbolic math
- execute deterministic calculations
- run optimization
- run structural solvers
- generate or validate equation systems
- process geometry and load models

This brain should be powered by tools such as:

- `SymPy`
- `NumPy`
- `SciPy`
- `Z3`
- `OpenSees`
- `IfcOpenShell`
- `CalculiX`

### 3. Governance Brain

Responsibilities:

- validate assumptions
- verify units and dimensions
- detect missing data
- compare alternative solution paths
- assign confidence levels
- require human review when certainty is not sufficient

This brain is what keeps the system from acting like a hallucinating calculator.

## Recommended Pipeline

### Stage 1: Problem formalization

Convert user input into a typed, structured problem record.

Example fields:

- project type
- geometry
- materials
- support conditions
- load cases
- design code or reference standard
- objective
- required outputs
- known unknowns

The system should prefer structured JSON over freeform text.

### Stage 2: Plan generation

Generate a subtask plan before solving.

Typical plan items:

- collect missing inputs
- generate geometry model
- generate load model
- create load combinations
- run analysis
- run design checks
- compare options
- prepare explanation

This helps reduce skipped-step errors.

### Stage 3: Tool routing

Each subtask should be routed to the right engine.

Examples:

- symbolic derivation -> `SymPy`
- optimization -> `SciPy`
- constraints and logic -> `Z3`
- structural analysis -> `OpenSees` or `CalculiX`
- BIM/IFC processing -> `IfcOpenShell`

The LLM should choose tools and prepare inputs, not fake the output of those tools.

### Stage 4: Execution

Run the selected tool chain and capture:

- inputs
- outputs
- assumptions
- solver version
- warnings
- failure modes

### Stage 5: Verification

Independently verify the result where possible.

Verification patterns:

- recompute with a second method
- check equilibrium
- check units and dimensions
- compare against rough hand-calculation bounds
- check result ranges against engineering sanity thresholds
- confirm all required load cases were used

### Stage 6: Reflection and repair

If verification fails:

- identify the failing step
- repair the plan, inputs, or tool call
- rerun only the necessary parts

The system should not simply paraphrase the failed result more confidently.

### Stage 7: Explanation and handoff

After verification, the AI should produce:

- engineer-facing summary
- user-facing explanation
- known limits
- next review actions

## Best Reasoning Patterns To Use

### Plan first, then solve

For hard tasks, Claude should use planning before execution.
This reduces missing-step errors.

### Program-aided reasoning

For math-heavy tasks, Claude should write structured computational steps and let tools execute them.
This is more reliable than pure text reasoning.

### Tool-augmented reasoning

The model should call external tools whenever the work becomes:

- arithmetic-heavy
- symbolic
- constrained
- solver-based
- numerically sensitive

### Critic loop

Use a separate verification or critique pass before presenting results.

### Memory as assumptions, not chat logs

The most important persistent memory is:

- assumptions
- inputs
- missing data
- solver provenance
- known issues

Do not treat long conversation logs as the main technical memory source.

## Recommended System Components

### Structured input schema

Every task should be converted into a typed schema.

Example:

```json
{
  "problem_type": "beam_design",
  "units": "US",
  "material": "steel",
  "span_ft": 24,
  "support_type": "simply_supported",
  "loads": {
    "dead_kip_per_ft": 0.45,
    "live_kip_per_ft": 0.75
  },
  "design_standard": "ASCE/ACI/AISC-context",
  "required_output": ["moment", "shear", "deflection", "governing_combo"]
}
```

### Assumption ledger

The system should explicitly store:

- assumed material strengths
- assumed support conditions
- assumed load sources
- assumed occupancy use
- assumed local code context

This ledger should appear in reports and internal logs.

### Provenance ledger

The system should also store:

- which model generated the plan
- which tools were called
- which solver versions were used
- what data source informed each result
- whether the result was verified

### Confidence state

Each output should be labeled as one of:

- `verified`
- `partially_verified`
- `heuristic`
- `needs_engineer_review`

This keeps trust boundaries explicit.

## Recommended Tool Classes

### Symbolic and numeric

- `SymPy`
- `NumPy`
- `SciPy`

### Logic and constraints

- `Z3`

### Structural analysis

- `OpenSees`
- `CalculiX`
- optional future `XC`

### Geometry and BIM

- `IfcOpenShell`
- optional `FreeCAD`

### Data validation

- schema validation and unit-check helpers

## Special Rule For Structural Design
Claude should separate:

- `analysis`
- `code interpretation`
- `design recommendation`
- `final professional approval`

These are not the same thing.

The system may:

- analyze a concept
- recommend likely structural directions
- identify governing conditions
- produce a handoff note

The system may not:

- imply stamp-ready design
- imply legal or regulatory sufficiency without professional review
- invent missing code constraints

## Special Rule For Complex Math
For complex math problems, Claude should use:

- plan generation
- program-aided execution
- symbolic verification
- numeric back-checking

The final answer should identify:

- derivation path
- computational path
- verification path

## SiteSense Implementation (AS-BUILT March 2026)

This section documents what was actually built and verified against the codebase.
All references point to `netlify/functions/analyze.js` unless otherwise noted.

### Implementation File Map

| Component | File | Lines |
|---|---|---|
| GIS Retrieval (15 layers) | `netlify/functions/analyze.js` | 67–2565 |
| Evidence Pack Assembly | `netlify/functions/analyze.js` | `assembleEvidencePack()` |
| Expert Panel (6 experts) | `netlify/functions/analyze.js` | 1448–1962 |
| Rules-first-then-Claude | `netlify/functions/analyze.js` | `callExpertLLM()` |
| Rule-based Fallback | `netlify/functions/analyze.js` | `generateRuleBasedReport()` |
| Claude Brain Report | `netlify/functions/analyze.js` | `generateAiBrainReport()` |
| Site-Responsive Design | `netlify/functions/analyze.js` | `generateSiteDesign()` |
| Cost Engine | `netlify/functions/analyze.js` | `estimateCost()` |
| PDF Report | `src/frontend/src/components/ReportGenerator.jsx` | `generateReport()` |
| House Concept | `netlify/functions/house_estimate.js` | full file |
| Price Forecast | `netlify/functions/price_predict.js` | full file |
| Engineering Q&A | `netlify/functions/engineering_assist.js` | full file |

### AS-BUILT: 7-Layer Brain Architecture

```
Layer 1: RETRIEVAL
  15 government GIS APIs fetched in parallel via Promise.all()
  Sources: USGS 3DEP, FEMA NFHL, USDA SoilWeb/SDA, USGS NSHM (ASCE 7-22),
           USFWS NWI, NOAA Atlas 14, EPA Envirofacts, USGS NHD,
           USFWS Critical Habitat, NPS National Register, NOAA SLR
  Rule-based: Fire risk (15 US zones), Landslide (terrain + soil + precip)

Layer 2: TOOL LAYER (Deterministic Computation)
  - calculateSlope() — gradient from elevation grid
  - calculateCutFill() — grid prismatic method
  - getSeismicDesignCategory() — ASCE 7-22 Table 11.6-1/11.6-2
  - recommendFoundation() — IBC/ACI priority ladder
  - estimateStructuralLoads() — wind, snow, seismic, cost multiplier
  - calculateRunoff() — Rational Method Q=CiA
  - estimateCost() — ROM with regional multipliers (35 metros)
  - generateSiteDesign() — 9-zone pad scoring, 8-direction orientation

Layer 3: DOCTRINE (Engineering Code Rules)
  - IBC 2021 §1803 (Soils), §1806 (Bearing), §1808 (Foundations)
  - ASCE 7-22 Ch.12 (Seismic), Ch.26-27 (Wind), Ch.5 (Flood), Ch.7 (Snow)
  - ACI 360R-10 §5.4 (PT slab), §4.2 (Grade beams)
  - ACI 350-20 (Environmental concrete)
  - ASTM D4829 (Expansive soil from PI)
  - IBC 2021 Table 1806.2 (Presumptive bearing capacity)

Layer 4: EVIDENCE PACK (Structured Working Memory)
  assembleEvidencePack() builds:
  - parcel: address, area, centroid, buildable SF/pct
  - retrieval: 14 layers, each with source + query_mode + confidence + notes
  - computed: slope, cut/fill, foundation, loads, runoff, costs, buildable area
  - doctrine: codes applied, foundation ladder, triggered rules
  - assumptions: explicit caveats (setbacks, soil defaults, inflation rate)
  - unknowns: verification gaps (geotech boring, utilities, survey, zoning)
  - provenance: timestamp, engine version, layer count, AI engine used
  - confidence: per-section (verified / partially_verified / heuristic / fallback)

Layer 5: EXPERT PANEL (6 Synthetic Domain Experts)
  Each runs rules FIRST, then Claude extends with [AI INSIGHT] tags.

  1. Foundation Advisor     — runFoundationAdvisor(ep)
     Reads: soil, slope, flood, bearing, caliche, seismic
     Produces: foundation type from IBC/ACI ladder + cost impact
     Compounds: 6 (expansive+slope, flood+HSG-D, caliche+slope,
                    low-bearing+flood, collapsible+water, seismic+expansive)

  2. Stormwater Reviewer    — runStormwaterReviewer(ep)
     Reads: flood zone, soil HSG, runoff CFS, slope
     Produces: drainage difficulty, detention burden, flood risk
     Compounds: 3 (steep+clay, flood+slope, runoff+flat)

  3. Site Design Advisor    — runSiteDesignAdvisor(ep)
     Reads: buildable %, steep fraction, constraint list
     Produces: design flexibility assessment, constraint severity
     Compounds: 2 (small-area+steep, flood+wetlands)

  4. Cost Forecaster        — runCostForecaster(ep)
     Reads: ROM cost, regional multiplier, foundation type, inflation
     Produces: compound premium %, build-now-vs-wait, cost drivers
     Compounds: 3 cost premiums (fnd+flood +15%, fnd+slope +10%, flood+slope +8%)

  5. Parcel Strategist      — runParcelStrategist(ep, expertFindings)
     Reads: ALL expert findings + evidence pack
     Produces: one verdict, top risks, opportunities, cross-expert tradeoffs
     Compounds: 4 cross-expert tradeoff patterns

  6. Data Quality Auditor   — runDataQualityAuditor(ep, strategistResult)
     Reads: evidence confidence per GIS layer
     Produces: downgrades verdict if critical data is fallback
     Can change: "Good Candidate" → "Proceed with Caution"

  TOTAL: 19 compound risk signals (14 site + 3 cost + 4 cross-expert)
         Presentation says 14 (conservative count of site risks only)

Layer 6: AI EXTENSION (Claude, when API key available)
  callExpertLLM() sends rule findings + raw evidence to Claude
  Claude instructions:
    1. Accept all rule-based findings as given
    2. Find ADDITIONAL compound risks rules missed
    3. Add richer cross-domain explanations
    4. Mark additions with [AI INSIGHT] prefix
    5. Return COMBINED result (rules + AI merged)
  Model: claude-sonnet-4-6 (800 tokens per expert, 2000 for strategist)

Layer 7: OUTPUT (Structured JSON → Frontend + PDF)
  Verdict: Good Candidate / Proceed with Caution / Moderate Risk / High Risk
  Weighted risk scoring: 0-3 points per factor, thresholds at 0/2/5
  Output includes: verdict, top_reasons, tradeoffs, best_fit_concept,
    scenario_comparison, unknowns, assumptions, next_steps (with who/why),
    site_design, expert_findings, routing, evidence_pack, confidence_summary
```

### AS-BUILT: Rules-First-Then-Claude Pattern

```
┌─────────────────────────────────────────────────────┐
│  STEP 1: Rules Run (ALWAYS — no API key needed)     │
│                                                      │
│  14 compound risk checks across 4 specialists        │
│  Foundation ladder (IBC/ACI priority)                │
│  Cost with compound premiums                         │
│  9-zone pad scoring + 8-direction orientation        │
│                                                      │
│  Output: ruleResult (structured JSON)                │
├─────────────────────────────────────────────────────┤
│  STEP 2: Claude Extends (IF ANTHROPIC_API_KEY set)  │
│                                                      │
│  Receives: ruleResult + raw evidence pack            │
│  Finds: NEW compound risks rules missed              │
│  Tags: [AI INSIGHT] on all additions                 │
│  Returns: merged result (same JSON schema)           │
├─────────────────────────────────────────────────────┤
│  STEP 3: Output (identical schema either way)        │
│                                                      │
│  Without API: rule findings only                     │
│  With API: rule findings + AI insights merged        │
│  Frontend renders both identically                   │
└─────────────────────────────────────────────────────┘
```

### AS-BUILT: 15 GIS Data Sources

| # | Layer | Function | Source | Auth |
|---|---|---|---|---|
| 1 | Elevation Grid | `getElevationGrid()` | USGS 3DEP | Free |
| 2 | Flood Zone | `getFloodZone()` | FEMA NFHL | Free |
| 3 | Soil Properties | `getSoilData()` | USDA SoilWeb + SDA | Free |
| 4 | Seismic Hazard | `getSeismicData()` | USGS ASCE 7-22 API | Free |
| 5 | Wildfire Risk | `getFireRisk()` | Rule-based (15 zones) | N/A |
| 6 | Wetlands | `getWetlands()` | USFWS NWI | Free |
| 7 | Precipitation | `getPrecipitation()` | NOAA Atlas 14 | Free |
| 8 | Contamination | `getContamination()` | EPA Envirofacts + FRS | Free |
| 9 | Hydrography | `getHydrography()` | USGS NHD | Free |
| 10 | Endangered Species | `getEndangeredSpecies()` | USFWS Critical Habitat | Free |
| 11 | Historic Sites | `getHistoricSites()` | NPS National Register | Free |
| 12 | Landslide Risk | `getLandslideRisk()` | Rule-based (terrain) | N/A |
| 13 | Sea Level Rise | `getSeaLevelRise()` | NOAA SLR | Free |
| 14 | Soil Map Polygons | `getSoilZones()` | USDA SDA Spatial | Free |
| 15 | Satellite Imagery | MapLibre tile layer | Esri World Imagery | Free |

All fetched in parallel via `Promise.all()`. Total time < 10 seconds typical.

### AS-BUILT: Verdict Logic (Weighted Risk Scoring)

```
Risk Factor                    Weight
───────────────────────────────────────
Coastal flood VE                  3
Liquefaction risk                 3
Organic soil                      3
Very steep slope (>25%)           3
Flood zone AE/A/AO/AH            2
Steep slope (15-25%)              2
Collapsible soil                  2
High shrink-swell                 2
Wetlands present                  2
Very high wildfire                2
Moderate shrink-swell             1
High wildfire                     1
Caliche hardpan                   1
High seismic (SDC D/E/F)         1
High sulfate attack               1
Moderate slope (8-15%)            1
High corrosion (steel)            1

Score    Verdict
───────────────────────────
0        Good Candidate
1-2      Proceed with Caution
3-5      Moderate Risk
6+       High Risk
```

### AS-BUILT: Confidence Levels

Each GIS layer gets a confidence tag in the evidence pack:

| Level | Meaning | Example |
|---|---|---|
| `verified` | Direct API response, data present | Elevation from USGS 3DEP |
| `partially_verified` | API responded but data may be incomplete | Flood zone from FEMA (centroid query) |
| `heuristic` | Rule-based estimate, not direct measurement | Fire risk, landslide risk |
| `fallback` | API failed, using regional defaults | Soil data unavailable |

Data Quality Auditor can downgrade the overall verdict when critical layers (soil, seismic) are at fallback level.

### Verified Against Presentation (March 22, 2026)

Cross-referenced `SiteSense_AI_Brain_v2.pptx` (11 slides) against codebase:

| Claim | Presentation | Code | Status |
|---|---|---|---|
| GIS Layers | 14 | 15 (includes soil zones) | CONFIRMED |
| Domain Experts | 6 | 6 (4 specialist + 2 support) | CONFIRMED |
| Compound Risk Checks | 14 | 19 (14 site + 3 cost + 4 cross-expert) | UNDERSTATED |
| LLM Boundary Rules | 8 | Enforced via rules-first pattern + doctrinal prompts | PARTIALLY CODIFIED |
| Evidence Pack | described | ~150 fields across 7 sections | CONFIRMED |
| Rules-first-then-Claude | described | All 4 specialists follow pattern | CONFIRMED |
| Rule-based Fallback | described | `generateRuleBasedReport()` — full JSON without API | CONFIRMED |

### Known Issues (as of March 22, 2026)

1. **Seismic API** — old USGS endpoint was dead (404). Fixed to use `earthquake.usgs.gov/ws/designmaps/asce7-22.json`
2. **Cost model** — was pricing off full lot area, creating inflated numbers. Fixed to use ~2,500 SF building footprint.
3. **Verdict uniformity** — all sites returned "Proceed with Caution". Fixed with weighted risk scoring (4 verdict levels).
4. **PDF export** — was HTML-in-new-tab, not real PDF. Fixed with html2pdf.js client-side generation.

### Future Enhancements

For a startup product beyond hackathon:

- Add solver-backed structural checks (OpenSees, CalculiX) for Stage 3/4
- Add SymPy verification pass for load calculations (Stage 5)
- Add Z3 constraint checking for code compliance logic
- Add IFC/BIM geometry integration via IfcOpenShell
- Implement full assumption ledger with user-editable overrides
- Add multi-model verification (Haiku scout + Sonnet verifier)
- Implement user persona-aware output (Homeowner vs Architect vs Developer)

## Theoretical Foundation

### Best MVP Implementation For SiteSense

For the first product versions, Claude should not attempt a full autonomous structural designer.

Instead, the MVP should implement:

- structured problem extraction
- deterministic math execution
- solver-backed checks where feasible
- assumption logging
- verification pass
- AI explanation layer

This is already much more credible than a freeform assistant.

## Integration With SiteSense

This architecture is especially useful for:

- house concept structural screening
- soil/foundation risk reasoning
- rough load-path inference
- code-aware explanation layers
- engineer handoff briefs

It should complement:

- [house-concept-estimator.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/house-concept-estimator.md)
- [site-responsive-house-design.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/site-responsive-house-design.md)
- [engineering-knowledge-rag.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/engineering-knowledge-rag.md)

## Startup Direction

For a startup, this architecture is stronger than "AI chat for engineering."

Why:

- it is more auditable
- it is more modular
- it is safer
- it is easier to improve subsystem by subsystem
- it better supports professional review workflows

The long-term product should look like:

- `LLM orchestration`
- `solver execution`
- `verification`
- `human review`

not:

- `LLM says the answer`

## Success Criteria

- AI outputs are tied to structured inputs and tool calls
- arithmetic and solver work are delegated to deterministic engines
- verification is explicit, not implied
- assumptions and provenance are visible
- outputs clearly distinguish between concept advice and engineer-approved results

## Sources

- ReAct: https://arxiv.org/abs/2210.03629
- Plan-and-Solve Prompting: https://arxiv.org/abs/2305.04091
- Program of Thoughts Prompting: https://arxiv.org/abs/2211.12588
- PAL: https://arxiv.org/abs/2211.10435
- Reflexion: https://arxiv.org/abs/2303.11366
- Pattern-based engineering of Neurosymbolic AI Systems: https://www.sciencedirect.com/science/article/pii/S1570826824000416
- SYNAPSE structural engineering paper: https://www.mdpi.com/2075-5309/16/3/534
- SymPy docs: https://www.sympy.org/en/
- Z3: https://github.com/Z3Prover/z3
- OpenSees documentation: https://opensees.github.io/OpenSeesDocumentation/
- OpenSeesPy repo and licensing note: https://github.com/zhuminjie/OpenSeesPy
- IfcOpenShell: https://ifcopenshell.org/
