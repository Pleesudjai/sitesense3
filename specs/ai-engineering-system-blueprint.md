# Feature Spec: AI Engineering System Blueprint
Date: 2026-03-22
Layer: architecture + backend-ai + product

## What We're Building
Define the complete AI system blueprint for SiteSense.

This blueprint explains what is needed beyond:

- brain architecture
- synthetic domain expert skills

The goal is to make SiteSense a real AI product, not just a web app with a chatbot attached.

## Core Principle
The strongest AI system is:

`brain architecture + expert skills + evidence + memory + tools + governance + evaluation + handoff`

If any of those layers are missing, the product becomes weaker:

- too generic
- too brittle
- too hard to trust
- too easy to overclaim

## Hackathon Scope Split

This blueprint is the full startup-oriented target, not the minimum build list for HackASU.

### Hackathon now

Build only the thinnest slice that proves SiteSense is meaningfully AI:

- `evidence_pack`
- `expert_router`
- core experts:
  - `foundation-advisor`
  - `stormwater-reviewer`
  - `site-design-advisor`
  - `cost-forecaster`
  - `parcel-strategist`
- `data_quality_auditor`
- structured `ai_report`
- `owner_decision_coach`
- visible professional-review warning

Optional if time allows:

- `engineer_handoff_coordinator`
- simple scenario comparison
- lightweight observability logs

### Post-hackathon

These should remain in the blueprint, but do not need to be fully built now:

- long-term memory layer
- full source registry/freshness system
- deeper observability
- broader specialist expert library
- richer scenario engine
- more advanced orchestration and evaluation infrastructure

## The Full Stack

### 1. Brain architecture

This is the system shape.

It defines:

- what stages exist
- how data moves
- where the LLM is used
- where deterministic code is used
- where verification happens

For SiteSense, the target flow is:

`retrieval -> computation -> evidence_pack -> expert_router -> specialists -> strategist -> auditor -> outputs`

Use:

- [structural-ai-brain-architecture.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/structural-ai-brain-architecture.md)
- [evidence-pack-ai-report-architecture.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/evidence-pack-ai-report-architecture.md)
- [expert-router-implementation.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/expert-router-implementation.md)

### 2. Synthetic domain expert skills

These define expert behavior.

They tell the AI:

- what to care about
- what evidence matters
- what tradeoffs to explain
- when to defer to professional review

Skills define expert priorities and reasoning boundaries.
Production behavior should still be enforced by code, schemas, deterministic calculations, and governance.

SiteSense now has a project-local expert library under:

- [skills](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/skills)

### 3. Evidence layer

This is the system's working truth.

The AI should not reason from a tiny prose summary.
It should reason from structured evidence such as:

- GIS overlap metrics
- terrain/slope outputs
- soil and flood attributes
- cost drivers
- buildable area metrics
- candidate pad/orientation scores
- assumptions
- unknowns
- provenance
- confidence

This is the difference between:

- `AI as fancy narrator`
- `AI as decision engine`

### 4. Memory layer

This is what lets the system stay coherent across repeated parcel work instead of acting like a stateless chat session.

Recommended memory types:

- parcel history
- previous expert findings
- prior report versions
- unresolved questions
- user preferences
- prior owner/professional decisions

Memory should store structured facts and state, not long unbounded transcripts.

### 5. Source registry and freshness layer

The system should explicitly track where evidence came from and whether it is still trustworthy.

For each important source, store:

- source name
- official vs heuristic status
- update cadence
- freshness timestamp
- cache policy
- license/use constraints
- stale-data behavior

This protects the product from making strong claims with stale or weak evidence.

### 6. Tool layer

The AI should call deterministic tools for the work that code does better.

Examples:

- geometry and overlap calculations
- slope and terrain logic
- runoff and drainage heuristics
- cost formulas
- hazard lookups
- structural screening
- report assembly

The LLM should not be the first calculator.

### 7. Expert orchestration layer

The system needs a way to coordinate specialists.

Minimum orchestration components:

- `expert_router`
- specialist experts
- `parcel_strategist`
- `data_quality_auditor`
- output adapters

This is what turns separate skills into a working AI team.

### 8. Governance layer

This is how the product stays honest.

Governance must do all of the following:

- downgrade unsupported certainty
- separate `verified` from `estimated`
- expose missing data
- preserve professional-review boundaries
- block polished nonsense

This is especially important because SiteSense touches:

- land purchase decisions
- engineering risk
- cost expectations
- potential regulatory interpretation

### 9. Observability layer

The system should make its own behavior inspectable.

Recommended traces:

- which experts were selected
- which evidence fields were referenced
- which sources were stale or missing
- confidence downgrade reasons
- fallback usage
- latency and token cost
- final output mode used

Without observability, debugging AI behavior becomes guesswork.

### 10. Evaluation layer

This is the most commonly missed layer in AI products.

You need repeatable checks for:

- schema stability
- routing correctness
- claim support
- uncertainty handling
- fallback behavior
- user-facing clarity
- professional-review compliance

Without evaluation, the system may look smart while drifting.

### 11. Scenario engine layer

SiteSense should not stop at one parcel verdict.
It should compare realistic alternatives.

Recommended scenario dimensions:

- 1-story vs 2-story
- compact footprint vs spread footprint
- pad A vs pad B
- build now vs wait
- conservative concept vs ambitious concept

This is where the product becomes a decision engine instead of a static report generator.

### 12. Output layer

The product needs multiple output modes, not one blob of text.

Recommended outputs:

- `ai_report` JSON for app rendering
- user-facing explanation
- architect/developer explanation
- professional handoff summary
- PDF-ready structured content
- scenario comparison output

The output layer should adapt tone and detail level for:

- homeowner
- architect
- small developer
- engineer handoff

### 13. Human review layer

The product must be designed for collaboration with real professionals.

This means:

- clear handoff
- clear unknowns
- explicit next steps
- no claim that the output is permit-ready

This is both a product-quality and ethical requirement.

## Escalation Matrix

The system should explicitly know when AI support must give way to professional confirmation.

Minimum escalation triggers:

- flood overlap or floodway involvement
- mapped wetlands or water features affecting the concept area
- low-confidence or conflicting soil/foundation signals
- missing survey-grade boundary or easement certainty
- unresolved utility availability or septic viability
- major grading, retaining, or access difficulty
- structural irregularity or elevated hazard exposure
- contamination or habitat triggers

For each escalation, the output should say:

- what triggered escalation
- which professional should review it
- what evidence is still missing
- whether the current advice is `verified`, `estimated`, or `heuristic`

## Recommended SiteSense System

### Best practical composition

For SiteSense, the best working system is:

1. `Raw data`
   GIS layers, economic indicators, deterministic computations, local constraints
2. `Evidence pack`
   Structured working memory
3. `Expert router`
   Selects the useful specialists
4. `Specialists`
   Foundation, stormwater, site design, cost, structural, zoning, environmental, utilities
5. `Parcel strategist`
   Synthesizes one parcel-level answer
6. `Data quality auditor`
   Protects trust
7. `Owner decision coach`
   Makes the result understandable
8. `Engineer handoff coordinator`
   Makes the output professionally useful
9. `Scenario engine`
   Compares plausible paths instead of presenting one fixed answer
10. `Observability and source registry`
   Keeps the system auditable and startup-safe

## Implementation Priority

If Claude is executing this incrementally, the recommended order is:

1. Build `evidence_pack`
2. Build `expert_router`
3. Build Phase 1 experts
4. Add `parcel_strategist`
5. Add `data_quality_auditor`
6. Emit structured `ai_report`
7. Add `owner_decision_coach`
8. Add `engineer_handoff_coordinator`
9. Add scenario comparison outputs
10. Add source registry and observability
11. Improve PDF and frontend rendering

## Universal Product Rule

Build the AI system so it remains useful beyond the hackathon.

That means:

- universal schemas
- modular experts
- geography-agnostic architecture
- local overlays as extensions
- structured outputs that can support future startup workflows

## Failure Modes And Safe Behavior

The blueprint should define what happens when the system is uncertain or partially broken.

Important failure modes:

- GIS source unavailable
- stale or incomplete source data
- conflicting signals between layers
- low-confidence evidence
- LLM unavailable
- deterministic fallback required

Safe behavior rules:

- degrade gracefully to structured fallback output
- lower confidence rather than invent detail
- expose missing data clearly
- keep the schema stable
- preserve the professional-review warning

## What This Means For The Hackathon

For HackASU, this blueprint gives the team a strong answer to:

`Why is this really AI and not just a dashboard?`

Answer:

Because SiteSense uses AI as a coordinated expert system that reasons over structured GIS, engineering, and cost evidence, synthesizes tradeoffs, adapts the explanation for different users, and produces a professional handoff that a traditional web app would struggle to generate.

## Recommended Claude Command

```text
/execute specs/expert-router-implementation.md

Use specs/ai-engineering-system-blueprint.md as the system-level north star.
Treat skills/ as the synthetic domain expert library.
Keep all outputs structured, evidence-backed, and reviewable.
```
