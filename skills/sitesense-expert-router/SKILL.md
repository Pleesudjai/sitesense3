---
name: sitesense-expert-router
description: Use when you need to choose which SiteSense domain expert skills should handle a parcel, house concept, report, or engineer-handoff task and how to combine them without duplicating work.
---

# SiteSense Expert Router

Use this skill first when the task spans multiple disciplines.

## Routing rules

- Start with `parcel-strategist` for any whole-site feasibility question.
- Add `data-quality-auditor` whenever evidence quality is uncertain or the output may sound too confident.
- Add `owner-decision-coach` for homeowner or small-developer explanations.
- Add `engineer-handoff-coordinator` when the output will be handed to a real professional.

## Specialist selection

- `foundation-advisor`: soils, slope, flood, water-table, corrosivity, geotech risk.
- `stormwater-reviewer`: runoff, detention, drainage path, outfall, flood context.
- `site-design-advisor`: pad placement, buildable envelope, grading, access.
- `climate-responsive-design-advisor`: orientation, daylight, wind, glazing, passive design.
- `utility-feasibility-advisor`: water, sewer, septic, power, frontage, utility extensions.
- `zoning-entitlement-advisor`: zoning, setbacks, frontage, overlays, review friction.
- `environmental-constraints-reviewer`: wetlands, habitat, contamination, buffers, permit triggers.
- `cost-forecaster`: build-now-vs-wait, ROM cost, cost drivers, escalation.
- `structural-screening-advisor`: hazard-driven complexity, load-path concerns, retaining-heavy concepts.
- `house-fit-advisor`: what kind of house or small residential concept fits the site.
- `constructability-reviewer`: staging, equipment access, retaining burden, field difficulty.

## Coordination rules

1. Prefer raw `evidence_pack` data over prose summaries.
2. Avoid duplicate findings across skills.
3. Keep one final verdict owner-facing and one handoff list professional-facing.
4. Explicitly mark what is `verified`, `estimated`, or `unknown`.

## Project anchors

- `/specs/evidence-pack-ai-report-architecture.md`
- `/specs/meaningful-ai-report-output.md`
- `/specs/problem-statement-and-user-needs.md`

## Boundaries

- Do not activate specialists that add no new evidence.
- Do not let cross-skill synthesis erase uncertainty or professional-review requirements.
