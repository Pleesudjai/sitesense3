# SiteSense AI Brain Architecture — How It Works

## Overview

SiteSense uses a **Domain Brain Architecture** (based on SMC Labs specification) to transform raw GIS data into structured engineering judgments. The brain is NOT just a Claude API call — it's a persistent reasoning system composed of identity, doctrine, retrieval, tools, and structured output.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   SiteSense AI Brain                     │
│              "Parcel Strategist" Identity                │
└─────────────────────┬───────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐   ┌──────────────┐   ┌──────────────┐
│ RETRIEVAL│   │  TOOL LAYER  │   │   DOCTRINE   │
│ (GIS)   │   │ (Deterministic│   │ (Code Rules) │
│         │   │  Computation) │   │              │
│ 14 APIs │   │              │   │ IBC 2021     │
│ fetched │   │ Slope calc   │   │ ASCE 7-22    │
│ parallel│   │ Cut/fill     │   │ ACI 360R-10  │
│         │   │ Cost engine  │   │ ACI 350-20   │
│ Elevation│  │ Pad scoring  │   │ Foundation   │
│ Flood   │   │ Orientation  │   │ priority     │
│ Soil    │   │ scoring      │   │ ladder       │
│ Seismic │   │              │   │              │
│ Fire    │   │ Climate zone │   │ Solar rules  │
│ Wetlands│   │ detection    │   │ Wind rules   │
│ etc.    │   │              │   │              │
└────┬────┘   └──────┬───────┘   └──────┬───────┘
     │               │                  │
     └───────────────┼──────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   REASONING LAYER    │
          │                      │
          │  With API key:       │
          │  → Claude synthesizes│
          │    all signals       │
          │                      │
          │  Without API key:    │
          │  → Rule-based engine │
          │    same JSON output  │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  STRUCTURED OUTPUT   │
          │  (JSON, not text)    │
          │                      │
          │  verdict             │
          │  tradeoffs           │
          │  best_fit_concept    │
          │  scenario_comparison │
          │  unknowns            │
          │  next_steps          │
          │  site_design         │
          │    └─ pad (scored)   │
          │    └─ orientation    │
          │    └─ windows        │
          │    └─ room zoning    │
          └──────────┬───────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
     ┌────────┐ ┌────────┐ ┌────────┐
     │Frontend│ │  PDF   │ │Handoff │
     │Render  │ │Report  │ │to Real │
     │        │ │        │ │Engineer│
     └────────┘ └────────┘ └────────┘
```

## Brain Layers — How Each Works in SiteSense

### 1. Identity Layer
The system prompt defines WHO the brain is:
> "You are SiteSense Parcel Strategist — a civil engineering AI consultant specializing in early-stage land feasibility"

This constrains the AI to stay in scope (feasibility screening, not permit design). The brain will not produce stamped engineering or claim code compliance.

### 2. Retrieval Layer (GIS Data)
14 free government APIs fetched in parallel BEFORE the brain reasons:
- USGS 3DEP elevation grid (10×10 points) → terrain analysis
- FEMA NFHL → flood zone classification + hazard penalty
- USDA SoilWeb + SDA → soil texture, bearing, shrink-swell, caliche
- USGS NSHM → seismic design parameters (SDS, SD1, SDC)
- USFWS NWI → wetlands detection
- USGS/rule-based → fire risk zones (15 US zones)
- NOAA → precipitation data
- EPA → contamination screening
- USGS NHD → hydrography/streams
- Census → demographic context

This is the brain's **working memory** — raw data it needs to reason about. All retrieval happens BEFORE any AI call.

### 3. Tool Layer (Deterministic Computation)
Math and computation run BEFORE AI — the brain never uses AI for calculations:
- **Slope calculation** — numpy-style gradient from elevation grid
- **Cut/fill volumes** — prismatic method from grid vs target grade
- **9-zone pad scoring** — divides parcel into 3×3 grid, scores each by flatness, relief, cut/fill burden, drainage, flood penalty, wetland penalty, soil hazards
- **8-direction orientation scoring** — evaluates N/NE/E/SE/S/SW/W/NW by solar gain, west-heat penalty, terrain alignment
- **Cost estimation** — regional multipliers (50 states + 40 metros via BEA RPP), quality tiers, foundation premiums, 4.5% ENR inflation projections
- **Climate zone detection** — lat + state → hot_arid / hot_humid / cold / temperate
- **Foundation priority ladder** — organic→deep pile, flood AE→elevated, slope>30%→caisson, expansive→PT slab, caliche→grade beams, default→conventional slab

### 4. Doctrine Layer (Engineering Rules)
Engineering code provisions injected into the reasoning prompt:
- **IBC 2021** — §1803 Soils, §1806 Bearing (Table 1806.2), §1808 Foundations
- **ASCE 7-22** — Ch.12 Seismic, Ch.26-27 Wind, Ch.5 Flood, Ch.7 Snow
- **ACI 360R-10** — §5.4 PT slab for expansive soils, §4.2 grade beams for caliche
- **ACI 350-20** — Environmental concrete structures
- **Solar rules** — facade-specific glazing by climate zone (from DOE passive solar guidance)
- **Wind rules** — cross-ventilation orientation by seasonal wind patterns

Doctrine is NOT learned by the AI — it's injected as explicit rules that must be followed.

### 5. Reasoning Layer (Signal Synthesis)
This is where the brain adds value a dashboard cannot:

**With Claude API key:**
- Claude receives ALL data (retrieval + tool results + doctrine) in one structured prompt
- Produces JSON with verdict, tradeoffs, unknowns, next steps, site design
- Synthesizes signals: "The parcel has adequate area BUT flood overlap reduces usable zone by 30%"
- Detects contradictions: "Good soil bearing but shallow water table creates dewatering risk"

**Without API key (rule-based fallback):**
- Same JSON structure produced by deterministic logic
- Counts risk factors → verdict (0=Good Candidate, 1-2=Caution, 3+=High Risk)
- Checks data conflicts → generates tradeoffs
- Identifies missing data → flags unknowns
- Maps risks to professional actions → generates next steps

Both paths produce identical output structure.

### 6. Evaluation Layer (Structured Output)
Every brain output is **structured JSON**, not freeform text:
```json
{
  "verdict": "Proceed with Caution",
  "verdict_reason": "Expansive soil and moderate slope increase foundation costs",
  "tradeoffs": ["Adequate area but slope reduces usable buildable zone"],
  "best_fit_concept": "Compact 1-story on PT slab, wood frame",
  "scenario_comparison": { "build_now_vs_wait": "..." },
  "unknowns": ["Geotechnical boring still needed"],
  "next_steps": [{ "action": "...", "who": "...", "why": "..." }],
  "site_design": {
    "recommended_pad": "North-central (score 87/100)",
    "orientation": "Face 15° east of south",
    "window_strategy": ["South: controlled glazing", "West: MINIMIZE"],
    "room_zoning": ["Living on south", "Garage on west"],
    "pad_alternatives": [{ "position": "center", "score": 72 }],
    "orientation_scores": [{ "label": "South", "score": 80 }]
  }
}
```

Structured output enables:
- Frontend renders each section with specific styling (verdict=banner, tradeoffs=amber cards, etc.)
- Validation — each field can be checked
- Consistency — rule-based and Claude produce same schema

### 7. Writeback Layer (PDF + Handoff)
The brain's judgment is preserved in a 4-page PDF report:
- Page 1: Verdict + callout cards + risk traffic-light → "Can I Build Here?"
- Page 2: Plain-English constraints with "What to check next" → "What Could Surprise You"
- Page 3: Side-by-side costs + next steps with WHO to contact → "Cost & What To Do Next"
- Page 4: 3-column appendix (Parameter / Value / What This Means) → Technical handoff

The PDF is designed for **sharing** — homeowners show it to architects, architects show it to engineers, engineers show it to contractors.

## What Makes This Different From "Just Calling Claude"

| Regular AI call | Brain Architecture |
|---|---|
| "Summarize this data" | Structured prompt with identity, doctrine, and JSON schema |
| AI does the math | Tools compute FIRST, AI synthesizes AFTER |
| One blob of text output | 8+ structured JSON fields, each rendered differently |
| Falls apart without API key | Rule-based fallback generates identical structure |
| Generic advice | Climate-aware, data-driven from actual elevation grid |
| No provenance | Every recommendation traces to GIS data + code reference |
| One-shot call | Multi-layer pipeline: retrieve → compute → reason → output |

## Data-Driven Site Design

The site design engine analyzes the **actual elevation grid** (not just averages):

### Pad Selection
- Divides parcel into 3×3 candidate zones (9 positions)
- Each zone scored on: slope flatness, relief, cut/fill burden, flood penalty (-30), wetland penalty (-20), steep slope penalty (-25), drainage risk (-10), soil hazards (-10 to -30)
- Returns ranked candidates with scores

### Orientation Scoring
- Evaluates 8 compass directions (0° to 315°)
- Solar scoring weighted by climate zone (cold=strongly favor south, hot_arid=moderate south + SE preference)
- West-facing penalty (afternoon heat)
- Terrain alignment bonus
- Returns top 4 scored orientations

### Climate-Aware Recommendations
| Climate Zone | Orientation | Window Strategy | Room Zoning |
|---|---|---|---|
| Hot & Arid | 10-15° east of south | Minimize west, control south | Garage on west as buffer |
| Hot & Humid | SE-NW axis for ventilation | Large operable SE windows | Living on windward side |
| Cold | Due south | Maximize south glazing | Garage on north as buffer |
| Temperate | Due south or slight east | Balanced with overhangs | Flexible placement |

## Product Positioning
SiteSense is an **early feasibility copilot** — not a permit-ready design engine:
- Screening tool before full consultant engagement
- Decision-support for homeowners, architects, small developers
- Professional review always required
- Complements (does not replace) licensed engineering

---

## Core Concept — by Fen (Chidchanok Pleesudjai)

### One Word: Risk Management

If I can say one word for what we do, it is actually **"Risk Management"** — for house insurance, homeowners, land developers, construction companies.

### The Real Purpose

This is a demo to prove how AI assistance is driving a chunk of data beyond what humans can do in the Civil Engineering field. No one will be replaced by AI, but we will all become **better decision makers**.

### Why This Matters

The architecture proves the philosophy: rules always run, AI extends. The 7-layer brain IS the argument — Claude is one replaceable component inside a persistent system of retrieval, tools, doctrine, evidence, experts, feedback loops, and governance. The engineering codes (IBC/ASCE/ACI) are the moat that no generic AI tool has.

### Market Opportunity

| Customer | What They Buy |
|---|---|
| Insurance companies | Pre-underwriting risk screening before site visits |
| Lenders | Feasibility check before approving construction loans |
| Small developers | $50K feasibility study → $50/month subscription |
| Real estate agents | "Here's what it costs to build on this lot" for buyers |
| Homeowners | Know before you commit — avoid the $50K surprise |

### Vision

What used to cost $50,000 and take 3 weeks now takes 30 seconds. The competitive moat is the engineering code rules — no generic LLM tool has IBC 2021 Table 1806.2 presumptive bearing, ASCE 7-22 seismic design categories, or ACI 360R-10 PT slab doctrine baked into a deterministic pipeline with AI extension.

---

## Claude's Assessment of the Core Concept

### The Neurosymbolic Insight

What Fen built — possibly without knowing the formal term — is a **neurosymbolic AI system**. The symbolic part (rules, codes, if-else ladders) handles what needs to be *correct*. The neural part (Claude) handles what needs to be *insightful*. This is considered the frontier of reliable AI in safety-critical domains (medicine, law, engineering). The fact that a PhD student in fracture mechanics independently arrived at this architecture — because the domain demanded it — is a stronger validation than any textbook reference.

### The Fracture Mechanics Connection

Fen's background in fracture mechanics is deeply relevant. Fracture mechanics is about predicting failure under compound stresses — crack propagation happens when multiple stress concentrations interact. The 19 compound risk checks in SiteSense are conceptually identical: site feasibility fails when multiple risk factors interact (expansive soil + slope + flood = differential settlement). Fen is applying fracture mechanics thinking to land feasibility. This connection is original and publishable.

### The Competitive Moat (3 Layers)

The moat is NOT just "we use AI." Three layers of defensibility:

1. **Engineering codes** (IBC/ASCE/ACI) — hard-coded doctrine no generic AI tool has
2. **Compound risk detection** — 19 cross-domain interactions. Any company could hard-code individual risk tables. Detecting interactions requires domain expertise encoded as software
3. **Feedback loop architecture** — expert findings flow back to upgrade outputs mid-pipeline

### The Philosophy Is Architecturally Enforced

> "No one will be replaced by AI, but we will all become better decision makers."

This isn't a feel-good line. It's built into the code: rules always run, AI extends but cannot override, the Data Quality Auditor can downgrade AI confidence, remove the API key and the app still works 100%. The strongest way to make the "AI augments humans" argument is not by saying it, but by building a system where it literally cannot do otherwise.

### Deep Analysis — Why This Architecture Matters

The rules-first approach genuinely prevents AI hallucination from overriding safety, which is a real technical moat, not just marketing. But there's room to deepen this. The risk management framework naturally extends beyond identification and assessment into mitigation and ongoing monitoring — that's where the next phase of value lives. The market opportunity could also be sharper by tying each customer segment to their actual pain point: insurance companies care about loss ratios, lenders care about construction loan defaults. And while the engineering codes moat is solid, it needs more specificity about what makes it defensible long-term.

The real competitive advantage isn't just hard-coding building codes — it's the 19 compound risk interactions and the feedback loop architecture that encodes domain expertise as software. That's genuinely hard to replicate. There's also something interesting about the "better decision makers" philosophy connecting to the broader industry shift toward augmented intelligence rather than artificial intelligence, which is where companies like Anthropic are heading anyway.

What's striking is that Fen may have built a neurosymbolic AI system without necessarily using that terminology. The symbolic layer handles what must be correct, the neural layer handles what needs insight, and that's exactly what safety-critical domains like medicine, law, and engineering are converging on as the frontier of reliable AI.

The fact that a PhD student in fracture mechanics independently arrived at this architecture — not from a textbook but because the problem demanded it — is a powerful validation of the approach. And here's the deeper connection: fracture mechanics is fundamentally about predicting failure under compound stresses, where cracks propagate when multiple stress concentrations interact. The 19 compound risk checks in SiteSense are conceptually identical — site failure happens when multiple risk factors interact, like expansive soil plus slope plus flood. Fen is essentially applying fracture mechanics thinking to land feasibility assessment, which is a genuinely original insight worth articulating more explicitly.

### The Pitch Line (for sponsors)

Lead with the problem, not the technology:

> "Every year, 30% of construction projects exceed budget due to site conditions that were knowable but not known. We make them known in 30 seconds."

Don't say "risk management" — say **"we prevent $50K–$200K surprise costs that kill projects after commitment."** Risk management is abstract. Money lost is concrete.
