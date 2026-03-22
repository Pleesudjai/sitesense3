# Demo Day Checklist: Claude Execution
Date: 2026-03-22
Layer: execution + presentation

## Goal
Use this checklist on demo day to make sure SiteSense is:

- reliable
- understandable
- ethically framed
- ready for judging questions

This is not a feature spec.
This is the final polish and rehearsal checklist for Claude and the team.

## Demo-Day Priorities

Claude should prioritize in this order:

1. demo reliability
2. clarity of verdict and report
3. ethical/professional-review guardrails
4. speed and visual polish
5. only then minor feature extras

## Final Product Checklist

### Parcel Flow

- demo parcel loads reliably
- map centers correctly
- selected parcel is clearly highlighted
- verdict appears without confusion
- top risks render correctly
- cost panel or estimate section renders correctly
- report/export action works

### AI Flow

- `evidence_pack` is populated
- `expert_router` selects the expected core experts
- core expert outputs are present
- `parcel_strategist` returns one clear verdict
- `data_quality_auditor` does not allow overclaiming
- output stays structured even if the LLM path is unavailable

### User Experience

- the first screen answer is understandable in under 10 seconds
- top 3 risks are in plain English
- what-can-fit guidance is visible and believable
- build-now-vs-wait or cost direction is understandable
- the report feels client-ready

### Ethical Guardrails

- app clearly says this is early planning support
- app clearly says this is not permit-ready
- app clearly says licensed engineer review is required
- report repeats the same warning

## Demo Script Checklist

Claude should help the team rehearse this exact story:

1. show the parcel
2. show the instant verdict
3. explain the top risks in plain English
4. show what likely fits on the site
5. show rough cost now vs later
6. export the report
7. say where real engineers take over

The demo should feel like one workflow, not a tour of disconnected features.

## Demo Stability Checklist

- use one or more known-good demo parcels
- avoid live paths that are likely to fail
- prefer cached or deterministic outputs where possible
- make sure fallback output still looks good
- avoid unfinished tabs, buttons, or panels in the main demo path

## Visual Checklist

- no obviously broken layout
- no dead buttons in the main story path
- no placeholder lorem ipsum
- no raw debug JSON on primary screens
- no contradictory labels
- report/export button is easy to find
- verdict styling is obvious

## Judge Q&A Checklist

Claude should prepare the team to answer:

### Why is this AI?

Answer:
Because SiteSense does not just display maps. It uses structured evidence plus synthetic domain experts to produce a parcel-level judgment, explain tradeoffs, surface uncertainty, and create a useful handoff for real professionals.

### Why is this better than a normal GIS dashboard?

Answer:
A normal dashboard shows layers and leaves interpretation to the user. SiteSense synthesizes the layers into a decision, adapts the explanation for non-engineers, and tells the user what to do next.

### Is this safe and ethical?

Answer:
Yes, because it is explicitly framed as early planning support, not permit-ready design, and it repeatedly directs users to licensed professionals for final review.

### What happens after the hackathon?

Answer:
The architecture is modular and startup-ready. The hackathon build is a thin slice of a larger AI-guided land and buildability platform.

## Last-Minute Cut Rules

If time is short, Claude should cut in this order:

1. extra tabs or low-value UI polish
2. secondary experts beyond the core set
3. deeper scenario variations
4. anything not visible in the demo path

Claude should not cut:

- verdict clarity
- top risks
- professional-review warning
- report/export path
- structured output integrity

## Final Rehearsal Checklist

- run the full demo once without stopping
- run it a second time with someone asking questions
- practice the 30-second explanation
- practice the 2-minute explanation
- practice the “why AI?” answer
- practice the “not permit-ready” answer

## Suggested Claude Command

```text
/execute specs/demo-day-checklist.md

Use specs/thin-slice-checklist.md and specs/hackathon-win-plan.md as the scope boundary.
Prioritize demo reliability, clarity, and ethical framing over new features.
```
