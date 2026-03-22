# Thin Slice Checklist: Hackathon Build
Date: 2026-03-22
Layer: execution

## Goal
Build the smallest complete version of SiteSense that proves:

- the product solves a real problem
- the AI does something more useful than a normal dashboard
- the demo is believable, understandable, and polished

## The Thin Slice

The thin slice is:

1. user selects or draws a parcel
2. backend creates an `evidence_pack`
3. `expert_router` selects core experts
4. core experts return structured findings
5. `parcel_strategist` produces one verdict
6. `data_quality_auditor` checks confidence and overclaiming
7. frontend shows plain-English result
8. PDF/report export works

## Must Build Now

### Backend

- parcel request works end-to-end
- `evidence_pack` exists
- `expert_router` exists
- these experts work:
  - `foundation-advisor`
  - `stormwater-reviewer`
  - `site-design-advisor`
  - `cost-forecaster`
  - `parcel-strategist`
  - `data-quality-auditor`
- backend returns structured `ai_report`

### Frontend

- one clear parcel workflow
- one top verdict:
  - `Good Candidate`
  - `Proceed with Caution`
  - `High Risk`
- top 3 risks in plain English
- what can likely fit here
- cost now vs later
- visible professional-review warning

### Report

- user-first PDF or export
- executive summary
- top risks
- likely build direction
- cost snapshot
- next steps
- professional review required

## Nice If Time Allows

- `owner-decision-coach`
- `engineer-handoff-coordinator`
- simple scenario comparison:
  - 1-story vs 2-story
  - compact vs larger footprint
  - build now vs wait
- lightweight observability logs

## Do Not Build Now

- full memory layer
- full source registry system
- large expert library beyond the core set
- deep orchestration framework
- perfect structural analysis
- too many new GIS layers
- startup-scale admin tooling

## What Makes This Meaningfully AI

The demo must clearly show that AI is not just writing text.

The AI value is:

- multiple signals are synthesized into one judgment
- uncertainty is surfaced honestly
- the result is adapted for non-engineers
- the output creates a real engineer handoff path

## Demo Story

1. user chooses a parcel
2. SiteSense explains if it is a good candidate or risky
3. SiteSense explains why in plain English
4. SiteSense shows what kind of house concept likely fits
5. SiteSense shows rough cost now vs later
6. SiteSense exports a professional-looking report
7. SiteSense clearly says when a real engineer must review

## Definition Of Done

The thin slice is done when:

- one parcel flow works reliably in demo conditions
- the result is structured and not just a blob of prose
- the AI explanation feels smarter than a static dashboard
- the user can understand the answer in under 30 seconds
- the team has a stable demo address or parcel ready
- the report/export does not overclaim

## Suggested Team Split

- `Backend/AI`
  - evidence pack
  - router
  - core experts
  - structured ai report
- `Frontend`
  - map flow
  - verdict UI
  - risk cards
  - report/export entry point
- `Product/Prompt`
  - plain-English wording
  - professional-review guardrails
  - demo story
  - pitch alignment

## Claude Command

```text
/execute specs/expert-router-implementation.md

Use specs/thin-slice-checklist.md as the hackathon build boundary.
Do not expand scope beyond the thin slice unless it directly improves the demo.
```
