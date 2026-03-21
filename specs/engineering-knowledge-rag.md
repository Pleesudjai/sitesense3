# Feature Spec: Engineering Knowledge RAG Layer
Date: 2026-03-21
Layer: backend-module + netlify-function + ai-prompt + docs

## What We're Building
Build a safe engineering knowledge layer for SiteSense that combines:

- a `public/open training layer` built from FEMA, NIST, USGS, and other legally reusable public-domain or open materials
- a `licensed retrieval layer` for ACI 318 PLUS and ASCE AMPLIFY content
- an `open-source calculation layer` for structural and engineering calculations
- a `RAG-first response pattern` instead of full model training on proprietary code text

This feature is intended to help the product reason about engineering concepts, explain assumptions, cite sources, and support engineer workflows.

It must not:

- copy or fine-tune on proprietary code text unless the license explicitly allows it
- present itself as a substitute for licensed professional judgment
- generate authority-submittal output without professional review

## Core Architecture Decision

### Strong recommendation

For this product, the safest architecture is:

1. `Public/open training layer`: FEMA + NIST + USGS
2. `Licensed retrieval layer`: ACI 318 PLUS + ASCE AMPLIFY
3. `Open-source calculation layer`: XC / OpenSees / focused calculators
4. `RAG, not full model training on proprietary code text`, unless the license explicitly allows it

### Why this is the right architecture

- public/open engineering guidance can safely support training, embeddings, summaries, and reusable knowledge extraction
- proprietary standards should be handled by retrieval and access control, not assumed to be trainable
- calculation tools should remain separate from the text layer so math, provenance, and professional review stay clear
- this reduces legal risk and keeps the system auditable

## Product Positioning

This feature should feel like:

- an engineering knowledge assistant
- a code-aware retrieval layer
- a structured calculation support tool
- a professional-review support system

It should not be marketed as:

- an official replacement for ACI or ASCE publications
- a free copy of proprietary standards
- a permit-ready code compliance engine
- a substitute for licensed engineering review

## Professional Review Required

This feature must always communicate that:

- public/open guidance is educational and support-oriented
- licensed standard retrieval is advisory and reference-oriented
- calculations are only part of the design process
- final design decisions must be reviewed by qualified licensed professionals
- submission requirements are controlled by the applicable jurisdiction and governing code adoption

This message should appear in the spec, UI, API response, generated reports, and any engineering workflow output.

## Knowledge Layers

### Layer 1: public/open training layer

Use legally reusable material for:

- embeddings
- summarization
- knowledge graph extraction
- training or fine-tuning if desired
- benchmark QA sets

Recommended source families:

- FEMA Building Science publications
- FEMA residential and hazard-resistant manuals
- NIST NEHRP technical briefs
- USGS seismic and hazard resources
- other public-domain government engineering references with compatible rights

### Layer 2: licensed retrieval layer

Use licensed access for:

- ACI 318 PLUS
- ASCE AMPLIFY

Handling rules:

- do not bulk-ingest proprietary full text into a training corpus unless the license explicitly permits it
- do not treat subscription access as permission to train
- retrieve only the passages needed for the current answer
- store only the minimum metadata and audit trail needed for traceability
- preserve clear source attribution in responses

### Layer 3: open-source calculation layer

Use open-source tools for:

- structural calculations
- section analysis
- load combinations
- response checks
- traceable engineering computation

Candidate tools:

- `XC`
- `OpenSees`
- focused open-source calculators such as ACI/ASCE-adjacent beam, slab, punching, or section tools

Important note:

- the calculation layer supports engineering reasoning
- it does not replace direct licensed code interpretation or professional review

## RAG Policy

### Required policy

The system must be built as `RAG-first`.

That means:

- retrieve relevant sources at answer time
- ground answers in cited documents
- distinguish public/open sources from licensed sources
- distinguish retrieved text from computed results
- avoid unsupported paraphrasing of proprietary standards

### Forbidden by default

Do not:

- fine-tune on proprietary ACI/ASCE text
- mass-copy proprietary code books into embeddings or training datasets
- present proprietary standard language without access control and license review

Exception:

- only if the applicable license explicitly allows the intended storage and training use

## Runtime Design

### New backend modules

- `src/backend/knowledge/source_registry.py`
  - classify sources as public, licensed, calculated, or internal
- `src/backend/knowledge/public_ingest.py`
  - ingest FEMA/NIST/USGS documents and metadata
- `src/backend/knowledge/public_index.py`
  - embeddings and searchable chunks for public/open corpus
- `src/backend/knowledge/licensed_retrieval.py`
  - adapter interface for ACI 318 PLUS and ASCE AMPLIFY retrieval
- `src/backend/knowledge/citation_policy.py`
  - enforce source labeling and answer restrictions
- `src/backend/knowledge/query_router.py`
  - route prompts to public retrieval, licensed retrieval, calculation layer, or mixed response
- `src/backend/engineering/calc_router.py`
  - send calculation requests to XC / OpenSees / focused calculators
- `src/backend/ai/engineering_rag.py`
  - orchestrate retrieved context, calculations, and answer generation
- `src/backend/ai/engineering_guardrails.py`
  - enforce no-training/no-copying/no-submittal framing

### New endpoint

- `netlify/functions/engineering_assist.py`
  - POST endpoint for engineering knowledge queries with citations and disclaimers

### Optional admin/config files

- `docs/licensing-notes.md`
  - what sources are public/open vs licensed
- `.env.example`
  - keys or credentials needed for any licensed integrations

## Input / Output Contract

### Input

- user question
- problem type: concrete / seismic / loads / residential / foundation / drainage / general
- optional location
- optional structural system
- optional geometry or design parameters for calculators
- optional preference: public-only / licensed-if-available

### Output

- answer summary
- cited sources grouped by:
  - public/open
  - licensed
  - calculated
- calculation trace if used
- assumptions
- limitations
- professional-review-required warning

## Answer Policy

Every answer should clearly separate:

1. `Public guidance`
2. `Licensed standard references`
3. `Calculated result`
4. `Engineer review needed`

This separation is required so users understand what came from public material, what came from licensed references, and what was computed by the system.

## Files to Create or Edit

- `specs/engineering-knowledge-rag.md` - this spec
- `src/backend/knowledge/__init__.py` - new package
- `src/backend/knowledge/source_registry.py` - source classification
- `src/backend/knowledge/public_ingest.py` - public corpus ingestion
- `src/backend/knowledge/public_index.py` - embeddings/search
- `src/backend/knowledge/licensed_retrieval.py` - licensed source adapters
- `src/backend/knowledge/citation_policy.py` - answer restrictions and citations
- `src/backend/knowledge/query_router.py` - retrieval/calculation orchestration
- `src/backend/engineering/calc_router.py` - connect to open-source calculators
- `src/backend/ai/engineering_rag.py` - final response assembly
- `src/backend/ai/engineering_guardrails.py` - legal/safety guardrails
- `netlify/functions/engineering_assist.py` - API entry point
- `docs/licensing-notes.md` - licensing boundaries and usage notes

## Implementation Steps

1. [ ] Define source classes: public/open, licensed, calculated, internal
2. [ ] Build a public-source registry for FEMA, NIST, and USGS documents
3. [ ] Build public corpus chunking and indexing
4. [ ] Build a licensed retrieval adapter interface without assuming bulk ingestion rights
5. [ ] Build citation and answer-separation policy
6. [ ] Build calculator routing for XC / OpenSees / focused calculators
7. [ ] Build response orchestration that combines retrieval and calculations
8. [ ] Build API endpoint for engineering queries
9. [ ] Add persistent professional-review-required disclaimer
10. [ ] Add licensing notes and operational rules for future sessions

## Demo Test

### Query 1
- "What are the main seismic design considerations for a small reinforced concrete retaining wall in Phoenix?"

Expected behavior:

- cites public sources first if sufficient
- adds licensed references only if available through approved access
- clearly labels any code-specific reference as licensed retrieval
- includes professional review warning

### Query 2
- "Estimate the demand/capacity logic for a concrete slab section and explain what additional checks an engineer still needs."

Expected behavior:

- uses calculator layer if implemented
- separates computed output from retrieved guidance
- avoids presenting itself as final code compliance

## Out of Scope

- training on proprietary ACI/ASCE text without explicit permission
- redistributing proprietary standards text
- building a pirate mirror of code books
- claiming automatic code compliance without professional review
- replacing engineer judgment or seal
- authority-submittal documentation

## Success Criteria

- The system can answer engineering questions with clear source provenance
- Public/open sources are reusable without legal ambiguity
- Licensed sources are retrieved in a controlled, auditable way
- Calculation tools are separate from text retrieval and clearly labeled
- The system never implies that subscription access equals permission to train
- The system always includes professional-review-required language
