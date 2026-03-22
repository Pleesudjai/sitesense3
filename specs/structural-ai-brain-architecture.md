# Feature Spec: Structural AI Brain Architecture
Date: 2026-03-21
Layer: architecture

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

## Best MVP Implementation For SiteSense

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
