# Project Brief — HackASU 2025
**Selected Project:** SiteSense — AI-Powered Land Feasibility Tool
**Track:** Track 3 — Economic Empowerment & Education
**Team:** Mobasher Group
**Live URL:** https://musical-cuchufli-3cd9f8.netlify.app
**GitHub:** https://github.com/Pleesudjai/sitesense3

---

## Core Concept — by Fen (Chidchanok Pleesudjai)

### One Word: Risk Management

If I can say one word for what we do, it is actually **"Risk Management"** — for house insurance, homeowners, land developers, construction companies.

> "This is a demo to prove how AI assistance is driving a chunk of data beyond what humans can do in the Civil Engineering field. No one will be replaced by AI, but we will all become better decision makers."

---

## Why "Risk Management" Is the Right Framing

Most teams would pitch "AI land analysis tool" or "smart feasibility platform." Risk Management goes deeper. Everything SiteSense does maps to the risk management lifecycle:

| Risk Stage | SiteSense Does This |
|---|---|
| **Identification** | 15 GIS layers surface hazards nobody checks manually |
| **Assessment** | 19 compound checks quantify how risks interact |
| **Prioritization** | Weighted verdict scores severity (foundation×3, stormwater×2) |
| **Mitigation** | Next steps with WHO to contact and WHY |
| **Documentation** | Printable report for sharing with professionals |

The product isn't a report generator — it's a **risk quantification engine**.

---

## The Deeper Insight: Neurosymbolic AI

SiteSense is a **neurosymbolic AI system** — probably the strongest architecture for safety-critical domains:

- **Symbolic part** (rules, codes, if-else ladders) → handles what needs to be *correct*
- **Neural part** (Claude) → handles what needs to be *insightful*

This is considered the frontier of reliable AI in medicine, law, and engineering. Fen arrived at this architecture independently — because the civil engineering domain demanded it. That's a stronger validation than any textbook reference.

### The Fracture Mechanics Connection

Fen's PhD research in fracture mechanics is showing in the architecture. Fracture mechanics is about predicting failure under compound stresses — crack propagation happens when multiple stress concentrations interact. The 19 compound risk checks in SiteSense are conceptually identical:

- **Fracture mechanics:** stress concentration A + stress concentration B → crack propagates
- **SiteSense:** expansive soil + slope + flood → differential settlement risk

Fen is applying fracture mechanics thinking to land feasibility. That connection is original and publishable.

### The Philosophy Is Architecturally Enforced

> "No one will be replaced by AI, but we will all become better decision makers."

This isn't a feel-good line — it's **built into the code**:
- Rules always run. AI extends but cannot override.
- The Data Quality Auditor can downgrade AI confidence.
- Remove the API key → app still works 100%.
- Claude is one replaceable component inside a persistent system.

The strongest way to make the "AI augments humans" argument is not by saying it, but by building a system where it literally cannot do otherwise.

---

## The Pitch (for sponsors/funding discussions)

### Lead with the problem, not the technology:

> "Every year, 30% of construction projects exceed budget due to site conditions that were knowable but not known. We make them known in 30 seconds."

### The dollar framing:

Don't say "risk management" — say **"we prevent $50K–$200K surprise costs that kill projects after commitment."** Risk management is abstract. Money lost is concrete.

### What it replaces:

What used to cost $50,000 and take 3 weeks → 30 seconds, free government data, no proprietary databases needed.

---

## Market Opportunity

| Customer | Their Pain | SiteSense Value |
|---|---|---|
| **Insurance companies** | High loss ratios from underwriting without site data | Pre-screen → reduce claims by flagging flood/fire/soil before policy |
| **Lenders** | Construction loan defaults from unforeseen site conditions | Feasibility gate → reduce default rate on land-secured loans |
| **Small developers** | $50K feasibility study kills ROI on small projects | $50/parcel → makes small projects financially viable |
| **Real estate agents** | Can't advise buyers on buildability | "Here's what it costs to build on this lot" as a selling tool |
| **Homeowners** | Commit to land purchase → discover $100K surprise | Know before you close — 30 seconds vs 3 weeks |

---

## Competitive Moat

The moat is NOT just "we use AI." Three layers of defensibility:

1. **Engineering codes** (IBC 2021, ASCE 7-22, ACI 360R-10) — hard-coded doctrine no generic AI tool has
2. **Compound risk detection** — 19 cross-domain interactions (expansive soil + slope, flood + poor drainage, seismic + expansive). Any company could hard-code individual risk tables. Detecting interactions requires domain expertise encoded as software.
3. **Feedback loop architecture** — expert findings flow back to upgrade foundation type, adjust costs, apply fire uplift. The brain improves its own outputs mid-pipeline.

---

## Technical Architecture (7 Layers)

| Layer | What It Does | Uses Claude? |
|---|---|---|
| 1. Retrieval | 15 government GIS APIs fetched in parallel | No |
| 2. Tool Layer | Slope, cut/fill, pad scoring, cost engine | No |
| 3. Doctrine | IBC/ASCE/ACI code rules injected | No |
| 4. Evidence Pack | Structured working memory (150+ fields) | No |
| 5. Expert Panel | 6 specialists: rules-first, Claude extends | Yes (Sonnet) |
| 6. Brain Report | Claude synthesizes OR rule-based fallback | Yes (Sonnet) |
| 7. Output | Frontend dashboard + printable PDF report | Q&A uses Haiku |

**Key numbers:** 15 GIS layers, 19 compound risks, 6 domain experts, 4 feedback loops, 100% functional without API key.

---

## What Was Built (HackASU 2025)

### 4 Tabs
1. **Site Analysis** — draw parcel → 15 GIS → 6 experts → compound risks → verdict
2. **House Concept** — specs → layout + cost + site-responsive floor plan
3. **Build Now or Wait** — government indicators → line chart + timing table
4. **Engineering Q&A** — Claude-powered (Haiku) with code citations

### Brain Features
- Evidence pack with per-layer confidence tracking
- Foundation Advisor with 6 compound risk checks
- Cost Forecaster with compound premium feedback loop
- Fire risk cost uplift (+6-12%)
- NOAA rainfall + HSG-adjusted stormwater runoff
- Weighted verdict (4 levels, 17 risk factors)
- Data Quality Auditor can downgrade verdict
- Printable PDF report with AI Brain Analysis + Site Design pages

---

## Deep Analysis — Why This Architecture Matters

The rules-first approach genuinely prevents AI hallucination from overriding safety, which is a real technical moat, not just marketing. But there's room to deepen this. The risk management framework naturally extends beyond identification and assessment into mitigation and ongoing monitoring — that's where the next phase of value lives. The market opportunity could also be sharper by tying each customer segment to their actual pain point: insurance companies care about loss ratios, lenders care about construction loan defaults. And while the engineering codes moat is solid, it needs more specificity about what makes it defensible long-term.

The real competitive advantage isn't just hard-coding building codes — it's the 19 compound risk interactions and the feedback loop architecture that encodes domain expertise as software. That's genuinely hard to replicate. There's also something interesting about the "better decision makers" philosophy connecting to the broader industry shift toward augmented intelligence rather than artificial intelligence, which is where companies like Anthropic are heading anyway.

What's striking is that Fen may have built a neurosymbolic AI system without necessarily using that terminology. The symbolic layer handles what must be correct, the neural layer handles what needs insight, and that's exactly what safety-critical domains like medicine, law, and engineering are converging on as the frontier of reliable AI.

The fact that a PhD student in fracture mechanics independently arrived at this architecture — not from a textbook but because the problem demanded it — is a powerful validation of the approach. And here's the deeper connection: fracture mechanics is fundamentally about predicting failure under compound stresses, where cracks propagate when multiple stress concentrations interact. The 19 compound risk checks in SiteSense are conceptually identical — site failure happens when multiple risk factors interact, like expansive soil plus slope plus flood. Fen is essentially applying fracture mechanics thinking to land feasibility assessment, which is a genuinely original insight worth articulating more explicitly.

---

## Original Project Options Considered

*(The following 8 options were brainstormed before selecting SiteSense)*

### Option 1: Heat-Resilient Pavement Selector
Build a tool that takes: site location, traffic level, orientation, material options, maintenance constraints → recommends pavement/surface-treatment choices with a heat/maintenance tradeoff report.

### Option 2: Foundation-Risk Scanner for Arizona Homes
Takes: soil/geology layer, irrigation-leak inputs, crack photos, structural observations → flags expansive-soil or moisture-related movement risk.

### Option 3: Earth-Fissure and Subsidence Risk Map
Overlays known fissure zones with roads, canals, utilities, parcels → generates screening memo and inspection priority ranking.

### Option 4: Monsoon Flood + Roadway-Failure Hotspot Predictor
Ingests rainfall/drainage data → flags likely street-flooding or culvert/roadway distress hotspots for public works.

### Option 5: Water-Leak to Structural-Risk Triage
Takes: leak report, location, soil type, structure type, duration → ranks risk of slab movement, subgrade softening, erosion.

### Option 6: Bridge and Pavement Rehab Copilot for Local Agencies
Converts inspection notes, photos, condition data → rehab options, urgency ranking, draft maintenance memos.

### Option 7: Heat-Safe Construction Scheduling and Curing Assistant
Tells contractors when to pour, cure, inspect, or stage work under heat constraints, with worker exposure alerts.

### Option 8: Structural Materials Test Interpreter (SMC Labs Concept)
Upload beam test, stress-strain file, or spec sheet → extracts key points, classifies behavior, suggests constitutive model, drafts engineering interpretation.
