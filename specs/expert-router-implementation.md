# Feature Spec: Expert Router Implementation
Date: 2026-03-22
Layer: backend-ai

## What We're Building
Implement the `synthetic domain expert` layer inside the SiteSense brain architecture.

This is the layer that sits between raw deterministic evidence and final user-facing output.

Target flow:

`retrieval -> computation -> evidence_pack -> expert_router -> specialist_experts -> parcel_strategist -> data_quality_auditor -> owner/professional outputs`

This spec is for Claude to execute.

Claude should use this spec together with:

- [evidence-pack-ai-report-architecture.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/evidence-pack-ai-report-architecture.md)
- [structural-ai-brain-architecture.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/structural-ai-brain-architecture.md)
- [meaningful-ai-report-output.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/meaningful-ai-report-output.md)
- [problem-statement-and-user-needs.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/problem-statement-and-user-needs.md)

Claude must also use these project-local skill definitions as the source of expert behavior:

- [skills/sitesense-expert-router/SKILL.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/skills/sitesense-expert-router/SKILL.md)
- [skills/parcel-strategist/SKILL.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/skills/parcel-strategist/SKILL.md)
- [skills/foundation-advisor/SKILL.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/skills/foundation-advisor/SKILL.md)
- [skills/stormwater-reviewer/SKILL.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/skills/stormwater-reviewer/SKILL.md)
- [skills/site-design-advisor/SKILL.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/skills/site-design-advisor/SKILL.md)
- [skills/cost-forecaster/SKILL.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/skills/cost-forecaster/SKILL.md)
- [skills/structural-screening-advisor/SKILL.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/skills/structural-screening-advisor/SKILL.md)
- [skills/data-quality-auditor/SKILL.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/skills/data-quality-auditor/SKILL.md)
- [skills/owner-decision-coach/SKILL.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/skills/owner-decision-coach/SKILL.md)
- [skills/engineer-handoff-coordinator/SKILL.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/skills/engineer-handoff-coordinator/SKILL.md)

## Why This Matters
Right now the backend is too flat. It tends to produce a small summary and then asks the LLM to write prose.

That misses the main advantage of AI for this product.

The AI should behave like a coordinated team of synthetic experts that:

- reason over structured evidence
- specialize by discipline
- expose uncertainty
- synthesize tradeoffs
- adapt the answer for owners and professionals

Traditional dashboards can show layers and scores.
This expert layer should do the cross-domain judgment that normal web logic does poorly.

## Core Rule
The expert layer must consume structured `evidence_pack` data, not only summary prose.

That means:

- each expert reads typed evidence
- each expert returns typed JSON
- the master strategist synthesizes expert outputs into one site judgment
- the data-quality auditor can downgrade unsupported claims before release

## Architecture Placement

### Brain architecture mapping

- `Language Brain`
  - `sitesense-expert-router`
  - `parcel-strategist`
  - `owner-decision-coach`
  - `engineer-handoff-coordinator`

- `Math/Physics Brain`
  - retrieval modules
  - geometry calculations
  - cost formulas
  - hazard calculations
  - deterministic scoring logic

- `Governance Brain`
  - `data-quality-auditor`

### High-level execution chain

1. Build `evidence_pack`
2. Route to required experts
3. Run specialist experts
4. Synthesize with `parcel-strategist`
5. Audit with `data-quality-auditor`
6. Generate:
   - user-facing explanation with `owner-decision-coach`
   - professional-facing handoff with `engineer-handoff-coordinator`

## Phase 1 Scope
Claude should implement the thinnest working slice first.

### Required Phase 1 experts

- `sitesense-expert-router`
- `foundation-advisor`
- `stormwater-reviewer`
- `site-design-advisor`
- `cost-forecaster`
- `parcel-strategist`
- `data-quality-auditor`

### Optional Phase 1.5 if time allows

- `structural-screening-advisor`
- `owner-decision-coach`
- `engineer-handoff-coordinator`

### Explicitly out of scope for first slice

- fully dynamic expert creation
- complex agent orchestration frameworks
- multi-turn expert debates
- deep memory systems
- prompt-heavy freeform reasoning without schema

## Implementation Strategy

### 1. Create expert contracts

Each expert should expose a deterministic Python function with a stable input/output contract.

Recommended signature pattern:

```python
def run_expert(evidence_pack: dict, context: dict | None = None) -> dict:
    ...
```

Each result should contain:

- `expert`
- `verdict`
- `reasons`
- `risks`
- `opportunities`
- `confidence`
- `unknowns`
- `next_checks`
- `evidence_refs`

### 2. Create an expert router

The router should choose the minimum useful expert set from evidence characteristics and task mode.

Inputs:

- `evidence_pack`
- `user_type`
- `task_mode`

Outputs:

- selected experts list
- routing explanation

Initial routing can be rule-based.

Example logic:

- flood overlap or runoff burden -> add `stormwater-reviewer`
- steep slope or soil limitations -> add `foundation-advisor`
- limited buildable area or pad ambiguity -> add `site-design-advisor`
- active cost task or concept estimate -> add `cost-forecaster`
- always add `parcel-strategist`
- always add `data-quality-auditor`

### 3. Create a parcel strategist synthesizer

This is the master synthesizer.

It should:

- merge specialist outputs
- assign one parcel-level verdict
- identify top tradeoffs
- identify the best-fit site concept direction
- produce one concise rationale

### 4. Create a data-quality auditor

This should:

- inspect evidence quality
- inspect expert claims against evidence
- downgrade unsupported certainty
- surface missing-data warnings

It must be allowed to modify confidence and soften claims before final output.

### 5. Create output adapters

Adapters should transform the audited strategist output into:

- user-facing language
- professional handoff language

Keep the structured data intact so UI/PDF can render directly from it.

## Recommended File Plan

Claude should preserve the current project structure as much as possible.

Suggested additions:

- `src/backend/ai/expert_router.py`
- `src/backend/ai/expert_contracts.py`
- `src/backend/ai/experts/__init__.py`
- `src/backend/ai/experts/foundation.py`
- `src/backend/ai/experts/stormwater.py`
- `src/backend/ai/experts/site_design.py`
- `src/backend/ai/experts/cost.py`
- `src/backend/ai/experts/parcel_strategist.py`
- `src/backend/ai/experts/data_quality.py`
- `src/backend/ai/experts/owner_decision.py`
- `src/backend/ai/experts/engineer_handoff.py`

Potential integration points:

- existing backend response assembly in `main.py`
- existing translation/report logic in `src/backend/ai/translate.py`

## Suggested JSON Shape

### Expert result

```json
{
  "expert": "foundation-advisor",
  "verdict": "moderate_risk",
  "reasons": [
    "Expansive-soil indicators are present in the dominant mapped soil component.",
    "Average site slope increases pad and foundation complexity."
  ],
  "risks": [
    "Foundation and grading cost may be higher than a flat-site baseline."
  ],
  "opportunities": [
    "A more compact footprint may reduce earthwork burden."
  ],
  "confidence": "estimated",
  "unknowns": [
    "No geotechnical borings available."
  ],
  "next_checks": [
    "Obtain geotechnical investigation before structural design."
  ],
  "evidence_refs": [
    "computed.avg_slope_pct",
    "retrieval.soil"
  ]
}
```

### Expert router result

```json
{
  "selected_experts": [
    "foundation-advisor",
    "stormwater-reviewer",
    "site-design-advisor",
    "cost-forecaster",
    "parcel-strategist",
    "data-quality-auditor"
  ],
  "routing_reason": [
    "Flood overlap and runoff metrics require stormwater review.",
    "Slope and soil limitations require foundation review."
  ]
}
```

### Audited ai_report shape

```json
{
  "verdict": "proceed_with_caution",
  "verdict_reason": "The parcel appears buildable, but drainage and foundation complexity are likely above average.",
  "top_risks": [
    "Flood and drainage burden",
    "Foundation uncertainty",
    "Higher-than-baseline site prep cost"
  ],
  "top_opportunities": [
    "Buildable area remains usable for a compact residential concept",
    "A better pad placement can reduce grading burden"
  ],
  "tradeoffs": [
    {
      "title": "Bigger footprint vs lower grading cost",
      "detail": "A more compact plan likely reduces earthwork and retaining needs."
    }
  ],
  "expert_findings": [],
  "confidence": "estimated",
  "unknowns": [],
  "next_steps_owner": [],
  "next_steps_professional": []
}
```

## LLM Usage Rules

Claude should not use the LLM as the calculator.

The LLM may be used for:

- synthesis
- explanation
- reformatting into user-specific language
- report narrative

The LLM should not be used for:

- geometry calculations
- overlap percentages
- runoff equations
- cost arithmetic
- hazard lookup that code can fetch

## Prompting Rules

If Claude uses an LLM call inside this architecture:

- pass structured JSON
- give the expert identity explicitly
- require structured JSON response
- include professional-review boundaries
- include confidence and unknowns

Do not ask the LLM for one giant essay.

## Fallback Rules

If no LLM key is available:

- expert functions still run
- strategist still synthesizes deterministically
- user and professional output adapters still produce usable results

The schema must stay stable whether the LLM is available or not.

## Testing Expectations

Claude should add lightweight tests where practical.

Priority tests:

- router selects experts from evidence conditions
- expert outputs match schema
- strategist merges expert outputs predictably
- auditor downgrades unsupported certainty
- final `ai_report` remains stable with and without LLM

## Success Criteria

This work is successful when:

- the backend no longer depends on a single prose block as the main AI output
- a parcel request produces selected experts plus expert JSON outputs
- one parcel-level strategist verdict is produced
- uncertainty is explicit
- user-facing and professional-facing outputs are both available
- the design is thin, modular, and extensible for startup growth

## Start Here

Claude should execute in this order:

1. Define expert result schemas and router interfaces.
2. Build rule-based router plus Phase 1 expert modules.
3. Integrate strategist and auditor into backend response flow.
4. Emit structured `ai_report`.
5. Only after that, improve prompt polish and UI consumption.

## Recommended Claude Command

Use:

```text
/execute specs/expert-router-implementation.md

Implement the synthetic domain expert layer using the local skills/ directory as the behavior source.
Build the thinnest working slice first and preserve the current app where possible.
Prefer structured evidence and JSON outputs over prose.
```
