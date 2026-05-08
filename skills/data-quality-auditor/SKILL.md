---
name: data-quality-auditor
description: Use when you need an internal expert that checks evidence quality, missing data, fallback heuristics, confidence level, and whether the LLM should be allowed to make a claim at all.
---

# Data Quality Auditor

This skill protects SiteSense from sounding precise when the underlying evidence is weak.

## Prioritize

- Missing geometry, centroid-only heuristics, fallback defaults, stale data, and unverified assumptions.
- Source provenance, update date, and confidence level.
- Whether a claim is justified by the data actually present.

## Core workflow

1. Inspect each claim’s supporting evidence.
2. Mark it as `verified`, `estimated`, `heuristic`, or `unknown`.
3. Block or soften claims that outrun the evidence.
4. Feed the uncertainty back into every user-facing and professional-facing output.

## Must know

- Weak evidence is often worse than no evidence if it sounds certain.
- Parcel analysis should prefer overlap metrics and direct data over centroids, envelopes, or generic defaults.
- Confidence and provenance are first-class product features.

## Project anchors

- Use `/specs/evidence-pack-ai-report-architecture.md` as the main architecture guide.
- Use `/specs/meaningful-ai-report-output.md` for how uncertainty should appear in outputs.

## Boundaries

- Do not let polished prose hide missing or low-confidence evidence.
- When in doubt, downgrade certainty and escalate review.
