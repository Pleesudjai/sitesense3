# Feature Spec: Evidence Pack AI Report Architecture
Date: 2026-03-21
Layer: backend-ai

## What We're Building
Refactor the SiteSense backend so the LLM reasons over a rich, structured `evidence_pack` built from raw GIS layers, deterministic engineering computations, doctrine rules, and explicit unknowns.

The current direction is too flattened:

- raw GIS and engineering outputs are reduced to a small `analysis_summary`
- Claude mostly rewrites summary numbers into prose
- the report loses spatial detail, provenance, uncertainty, and tradeoff structure

The target direction is:

`retrieve raw signals -> compute deterministic metrics -> assemble evidence_pack -> synthesize structured ai_report -> render UI/PDF`

This spec is for Claude to execute.

Claude should use this spec together with:

- [meaningful-ai-report-output.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/meaningful-ai-report-output.md)
- [structural-ai-brain-architecture.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/structural-ai-brain-architecture.md)
- [site-responsive-house-design.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/site-responsive-house-design.md)
- [pdf-report-user-first.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/pdf-report-user-first.md)
- [problem-statement-and-user-needs.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/problem-statement-and-user-needs.md)

## Why This Matters
The value of SiteSense should come from combining:

- raw GIS layers
- code-based calculations
- deterministic engineering heuristics
- scenario scoring
- explicit doctrine and constraints

The LLM should then do the part normal software does poorly:

- synthesize many signals into a judgment
- explain tradeoffs
- identify contradictions
- personalize the explanation
- create an engineer handoff brief

If the LLM only sees a small summary, it cannot do that well.

## Current Problem

### Current backend flow

Today the effective flow is:

1. fetch a few data sources
2. run a few deterministic calculations
3. collapse them into `analysis_summary`
4. send that summary to Claude
5. get back one block of text

This is not enough for the intended brain architecture.

### Main limitations

- `analysis_summary` hides raw detail that could improve AI reasoning
- geometry-heavy facts are collapsed into point-based or rough estimates
- missing data and fallback defaults are not clearly surfaced
- provenance is not explicit
- the frontend already expects richer structured AI output than the backend returns

## Core Rule
Claude must maximize the value of deterministic and raw evidence before invoking the LLM.

That means:

- the LLM should not be the first place where tradeoffs are inferred
- the LLM should not do arithmetic or geometry that code can do
- the LLM should receive scored evidence, not only plain-language summaries
- the UI and PDF should consume structured `ai_report` JSON first

## Target Architecture

### Stage 1: Retrieval

Fetch and normalize raw parcel evidence from data modules.

Examples:

- elevation grid
- flood zone data
- soil properties
- wetlands
- seismic
- fire
- precipitation
- contamination
- hydrography
- endangered species
- historic sites
- landslide
- sea-level rise

### Stage 2: Deterministic computation

Run code-based computations before the LLM.

Examples:

- slope statistics
- steep-area fraction
- cut/fill
- buildable envelope
- buildable area percent
- flood overlap percent
- wetland overlap percent
- soil hazard flags
- foundation recommendation
- structural load multipliers
- runoff estimate
- cost breakdown
- pad scoring
- orientation scoring
- scenario scoring

### Stage 3: Doctrine overlay

Attach explicit rules and code-aware rationale.

Examples:

- why this foundation type was selected
- why west glazing is penalized in hot climates
- why wetlands trigger a likely permit path
- why slope or flood reduces usable area

### Stage 4: Evidence pack assembly

Assemble all evidence into a structured `evidence_pack`.

### Stage 5: AI synthesis

Call Claude with:

- `identity`
- `evidence_pack`
- `output schema`
- `user type`
- `task mode`

Return structured `ai_report`, not just a paragraph block.

### Stage 6: Fallback synthesis

If no API key is available:

- run a deterministic fallback
- produce the same `ai_report` schema

### Stage 7: Rendering

Use `ai_report` and `evidence_pack` to power:

- frontend cards
- comparison views
- PDF report
- engineer handoff appendix

## Evidence Pack Design

The `evidence_pack` should be the main working memory of the parcel strategist.

### Recommended sections

- `parcel`
  - address
  - polygon metadata
  - area
  - centroid
- `retrieval`
  - raw normalized GIS outputs
- `computed`
  - deterministic calculations and scores
- `doctrine`
  - rule references and triggered heuristics
- `assumptions`
  - explicit fallback assumptions used by the system
- `unknowns`
  - what still needs verification
- `provenance`
  - data source and method trace
- `confidence`
  - confidence or verification state by section

### Example shape

```json
{
  "parcel": {
    "address": "User-selected parcel",
    "area_acres": 1.24
  },
  "retrieval": {
    "flood": {
      "zone": "AE",
      "source": "FEMA NFHL",
      "query_mode": "polygon_intersection"
    },
    "soil": {
      "texture_class": "CL",
      "source": "SSURGO/SDA",
      "query_mode": "dominant_component"
    }
  },
  "computed": {
    "buildable_sf": 17850,
    "buildable_pct": 33.2,
    "flood_overlap_pct": 21.8,
    "wetland_overlap_pct": 0.0,
    "pad_scores": [
      { "position": "north_central", "score": 87 },
      { "position": "center", "score": 72 }
    ],
    "orientation_scores": [
      { "label": "SSE", "score": 82 },
      { "label": "S", "score": 80 }
    ]
  },
  "assumptions": [
    "Setback buffer estimated because parcel zoning setbacks are not yet integrated."
  ],
  "unknowns": [
    "Utility extension cost not yet confirmed.",
    "Geotechnical boring still required."
  ],
  "confidence": {
    "flood": "verified",
    "soil": "partially_verified",
    "buildable_envelope": "heuristic"
  }
}
```

## What The LLM Should Receive
Claude should receive:

- evidence pack
- explicit task
- allowed output schema
- user persona
- reporting style

Claude should not receive only:

- a short list of summary numbers

## What The LLM Should Do

The LLM should:

- form a verdict
- explain tradeoffs between signals
- identify contradictions
- compare scenarios
- tailor explanation to user type
- generate next steps and handoff actions

## What The LLM Should Not Do

The LLM should not:

- calculate geometric overlap
- estimate slope directly from prose
- infer unsupported certainty
- hide missing data
- replace deterministic cost, hazard, or foundation logic

## Geometry And Raw-Data Upgrade Rules

The system should prefer parcel-aware calculations over centroid-only logic.

### Flood

Move from:

- centroid-only zone lookup

Toward:

- parcel overlap percentage
- area inside flood zone by class
- whether buildable pads intersect the hazard area

### Wetlands

Move from:

- envelope hit + rough coverage estimate

Toward:

- parcel intersection area
- overlap percentage
- wetland type counts

### Soil

Move from:

- centroid-only dominant component

Toward:

- parcel-dominant map unit
- optional multi-zone soil breakdown
- better engineering limitations from SSURGO/SDA

### Elevation and terrain

Move from:

- average slope only

Toward:

- slope distribution
- steep-area fraction
- relief concentration
- candidate pads
- slope-aligned orientation scoring

## Required Structured AI Output

Claude should produce an `ai_report` object with fields such as:

- `verdict`
- `verdict_reason`
- `top_reasons`
- `tradeoffs`
- `best_fit_concept`
- `scenario_comparison`
- `unknowns`
- `next_steps`
- `site_design`
- `confidence_summary`

### Example output shape

```json
{
  "ai_report": {
    "verdict": "Proceed with Caution",
    "verdict_reason": "The parcel is potentially buildable, but flood overlap and expansive soil reduce flexibility and increase foundation cost.",
    "top_reasons": [
      "Buildable area is materially smaller than the gross parcel area.",
      "Foundation choice is being driven by soil conditions rather than user preference."
    ],
    "tradeoffs": [
      "The north-central pad minimizes grading, but the south edge has better access.",
      "A 2-story concept preserves open area but increases structural complexity."
    ],
    "best_fit_concept": "Compact 2-story home on a post-tensioned slab with controlled west glazing.",
    "scenario_comparison": {
      "build_now_vs_wait": "Waiting likely increases site-prep cost if inflation continues.",
      "concept_options": "A compact footprint performs better than a wide single-story pad."
    },
    "unknowns": [
      "Utility extension cost not confirmed.",
      "Geotechnical boring still required."
    ],
    "next_steps": [
      { "action": "Order geotechnical borings", "who": "Geotechnical engineer", "why": "Foundation design is soil-driven." }
    ],
    "site_design": {
      "recommended_pad": "north_central",
      "orientation": "15 degrees east of south",
      "window_strategy": [
        "Control west glazing",
        "Favor operable southeast and northwest openings for ventilation"
      ]
    },
    "confidence_summary": {
      "overall": "partially_verified",
      "reason": "Key parcel logic is data-driven, but utility and subsurface confirmation are still pending."
    }
  }
}
```

## Fallback Rule
The deterministic fallback should produce the same `ai_report` schema.

That keeps:

- frontend rendering stable
- PDF generation stable
- demo mode stable
- API contract stable

The fallback can be less expressive, but not differently shaped.

## Recommended Backend Refactor

### New or revised modules

- `src/backend/brain/schemas.py`
  - Pydantic models for `evidence_pack` and `ai_report`
- `src/backend/brain/evidence.py`
  - assemble raw and computed parcel evidence
- `src/backend/brain/fallback.py`
  - deterministic `ai_report` generator
- `src/backend/brain/provenance.py`
  - assumption, source, and confidence helpers
- `src/backend/ai/translate.py`
  - replace text-only generation with structured synthesis

### Existing modules to update

- `src/backend/main.py`
  - build evidence pack and return `ai_report`
- `src/backend/data/*.py`
  - expose confidence, source, query mode, and better geometry metrics
- `src/backend/engineering/*.py`
  - return score breakdowns and cost drivers, not just totals
- `src/backend/report/pdf_report.py`
  - render from structured `ai_report`

## Frontend And PDF Rules

The frontend and report should consume:

- `ai_report` for judgments and action items
- `evidence_pack` for technical appendix and traceability

The frontend should not depend on:

- freeform `report_text` alone

The PDF should separate:

- plain-English verdict and next steps
- technical evidence appendix
- assumptions and unknowns

## Recommended Implementation Order

### Phase 1

- add `evidence_pack` assembly
- add schema models
- update `translate.py` to produce structured `ai_report`
- keep `report_text` only as optional backward-compatible output

### Phase 2

- upgrade flood, wetlands, soil, and buildable-area calculations to be more parcel-aware
- add provenance and confidence tracking
- add deterministic fallback producing the same structure

### Phase 3

- update PDF generation to render structured report sections
- update frontend to prefer `ai_report` and confidence badges
- add persona-aware output for homeowner vs architect vs developer

## Files to Create or Edit

- `specs/evidence-pack-ai-report-architecture.md` - this spec
- `src/backend/main.py`
- `src/backend/ai/translate.py`
- `src/backend/report/pdf_report.py`
- `src/backend/data/elevation.py`
- `src/backend/data/flood.py`
- `src/backend/data/soil.py`
- `src/backend/data/wetlands.py`
- `src/backend/engineering/cost.py`
- `src/backend/engineering/stormwater.py`
- `src/backend/brain/` - new package for schemas, evidence assembly, fallback, provenance
- `src/frontend/src/App.jsx`
- `src/frontend/src/components/RiskCards.jsx`

## Success Criteria

- Claude reasons over structured raw evidence, not just a flattened summary
- deterministic GIS and engineering outputs do most of the heavy lifting
- the LLM adds synthesis, not fake computation
- `ai_report` is structured, stable, and renderable
- unknowns, assumptions, provenance, and confidence are visible
- the system moves closer to the architecture promised in the concept notes
