# SiteSense LinkedIn Post Series
Author: Chidchanok Pleesudjai (Fen)
Planning window: March 23 — May 2026
Audience: Civil engineers, architects, construction professionals, professors

Story arc: "A structural engineer who studies how materials crack applied that same thinking to how land development projects fail."

---

## POST 1 — The Announcement (March 24-25, 2026)

**Attach:** Video link https://youtu.be/b0yoLrr9vak?si=TSyBLbRec0RdzaFE
**Include:** 1-2 slides from the presentation (brain architecture overview, compound risk diagram)

---

Our team won 1st place at the ASU Claude Hackathon (hosted by @Claude Builder Club ASU — https://www.linkedin.com/company/claude-builder-club-asu/) this weekend in the Economic Empowerment & Education track. Here's our 5-minute presentation.

We built SiteSense — a tool that turns a $10K–$50K civil engineering feasibility study into a 30-second automated assessment.

Here's the problem we were solving:

A family finds a beautiful lot. They fall in love with it. They commit. Then the geotechnical report comes back: expansive clay, moderate slope, and it's near a flood zone. Now their foundation costs just tripled, and no one told them before they signed.

This happens constantly. Over half of construction projects exceed budget — and unforeseen site conditions are one of the top causes. The feasibility study that would have caught it costs $10K–$50K and takes weeks. So most people skip it.

SiteSense draws a rectangle on a satellite map and pulls real data from 15 free government APIs — USGS elevation, FEMA flood zones, USDA soil properties, seismic hazard, wetlands, and more. Then a 7-layer engineering brain processes all of it through deterministic code rules first — IBC 2021, ASCE 7-22, ACI 360R-10 — before AI adds cross-domain insights on top.

The AI doesn't do the math. The AI doesn't pick the foundation. The AI doesn't claim code compliance. Deterministic rules handle all of that. The AI reads the rules' findings and asks: "What compound risks are hiding between these signals that the individual checks missed?"

If I had to describe what we built in one word: Risk Management.

No one gets replaced by AI. But we all become better decision makers.

Thanks to Amanjesh (https://www.linkedin.com/in/amanjesh/) and everyone at Claude Builder Club ASU for putting this together. Great event.

This was a fun, intense 24-hour build with an incredible team. I'm going to post a deeper technical breakdown of how each layer works in the coming days — how it's different from a standard GIS viewer or a chatbot, and why the architecture matters for safety-critical engineering applications.

Stay tuned.

#CivilEngineering #AI #RiskManagement #HackASU #Construction #Geotechnical #FeasibilityStudy #Hackathon #SiteSense #Anthropic #ClaudeAI

---

## POST 2 — The Technical Deep Dive (March 28-30, 2026)

**Include:** 3-4 slides explaining the 7 layers, the expert panel, and compound risk examples

---

Last week I shared that our team won 1st place at the ASU Claude Hackathon with SiteSense. Several people asked: how is this different from a GIS web viewer or just asking ChatGPT about a site?

Here's the honest answer — and why the architecture matters more than the AI.

A GIS viewer shows you layers independently. You see a flood map. You see soil data. You see slope. But it doesn't tell you that expansive clay ON a slope creates differential settlement — the uphill side heaves differently than the downhill side. That's a compound risk. It only appears when you cross-reference signals.

A chatbot makes it worse. It guesses the soil type. It hallucinates the flood zone. It does arithmetic and gets it wrong. It gives you confident advice with no source attribution.

SiteSense does neither. It uses a 7-layer brain architecture where the AI is one replaceable component — not the foundation.

Here's how each layer works:

Layer 1 — Retrieval: 15 government APIs (USGS, FEMA, USDA, EPA, NOAA) fetch real, verified data in parallel. No guessing.

Layer 2 — Tool Layer: Deterministic code computes slope, cut/fill volumes, stormwater runoff, cost estimates. The AI never touches this math.

Layer 3 — Doctrine: Engineering code rules are injected — IBC 2021 foundation tables, ASCE 7-22 seismic design categories, ACI 360R-10 post-tensioned slab criteria. These aren't learned by the AI. They're hard-coded.

Layer 4 — Evidence Pack: A structured working memory (~150 fields) with confidence tracking. Every data point is tagged: verified, partially verified, heuristic, or fallback.

Layer 5 — Expert Panel: Six synthetic domain experts — Foundation Advisor, Stormwater Reviewer, Site Design Advisor, Cost Forecaster, Parcel Strategist, and Data Quality Auditor. Each runs deterministic rules FIRST, then the AI extends with cross-domain insights marked [AI INSIGHT].

Layer 6 — AI Extension: Claude reads the rule-based findings and the raw evidence pack. Its job is to find compound risks the rules missed — like "north-facing slope + expansive soil = asymmetric moisture = worse differential heave on the south wall." Things that require cross-domain reasoning.

Layer 7 — Output: Structured JSON, not a text blob. Verdict, tradeoffs, risks, site design recommendations, cost projections, and professional next steps with WHO to contact.

The key: remove the API key and the entire system still works. The rule-based fallback produces the same JSON structure. The AI adds value but never replaces verified calculations.

Why does this matter?

Because structural and civil engineering decisions affect safety. A model that sounds confident is not enough. The architecture separates what needs to be CORRECT (rules, math, code references) from what needs to be INSIGHTFUL (cross-domain synthesis, compound risk detection, plain-English explanation).

This is sometimes called a neurosymbolic approach — symbolic computation for correctness, neural reasoning for insight. It's where safety-critical AI is heading in medicine, law, and engineering.

Here's the part I didn't plan: as a PhD student studying fracture mechanics, I realized the 19 compound risk checks in SiteSense work exactly like stress concentrations in a material. A crack doesn't propagate from one stress alone — it propagates when multiple stress concentrations interact. Expansive soil + slope + flood zone is the land equivalent of a multi-axial stress state at a crack tip. The failure mode only emerges from the interaction.

I accidentally applied fracture mechanics thinking to land feasibility. And it worked.

More to come — next post will be about the personal experience of building this in 24 hours.

#CivilEngineering #AI #NeurosymbolicAI #Geotechnical #StructuralEngineering #FractureMechanics #RiskManagement #SiteSense #GIS #FeasibilityStudy

---

## POST 3 — The Personal Story (April 1-3, 2026)

**Include:** Group photos, event photos, team photos, candid shots from the hackathon

---

Behind the technical posts — here's the human side of building SiteSense in 24 hours at HackASU.

I'm a PhD student studying fracture mechanics. My day job is bridge design for Thailand's Department of Rural Roads (currently on study leave at ASU). My research involves fiber-reinforced concrete, crack propagation, and constitutive modeling. Not exactly a typical hackathon profile.

But that's what made it fun.

The Claude Hackathon brought together students from different backgrounds — CS, business, engineering — all building with the same AI tools. Our team (Mobasher Group) chose to build something from our actual domain: a land feasibility tool grounded in real engineering codes.

Some things I learned from the experience:

The best ideas come from domain frustration, not technology excitement. We didn't start by asking "what can AI do?" We started by asking "what costs $50K and takes 3 weeks that shouldn't?" The AI was the means, not the motivation.

Engineering credibility is a competitive moat. Other teams built impressive demos. But when judges — many of whom were engineers and entrepreneurs — saw IBC 2021 table references, ASCE 7-22 seismic design categories, and ACI 360R-10 foundation doctrine hard-coded into the system, they understood this wasn't a wrapper around a chatbot.

24 hours forces ruthless prioritization. We had to decide: do we polish the UI or build another expert? We chose depth over polish every time. The Data Quality Auditor — which can downgrade the AI's own verdict when it detects low-confidence data — was added at 2 AM. It was the right call.

Sleep is negotiable. Good architecture is not.

I want to thank everyone who organized the event, the judges who took the time to understand the engineering depth, and especially my teammates and my advisor Dr. Barzin Mobasher for the foundation (pun intended) that made this possible.

If you're a civil engineer curious about how AI can genuinely augment — not replace — your professional judgment, I'd love to connect. This is going to be a bigger conversation in our field.

#HackASU #CivilEngineering #AI #PhD #StructuralEngineering #ASU #Hackathon #WomenInEngineering #Construction

---

## POST 4 — The Collaboration Invitation (April 7-10, 2026)

**Include:** A clean graphic or slide showing the brain architecture + "Summer 2026 Collaboration" header

---

After the hackathon posts, several people reached out asking: "Could this work for [bridges / pavements / tunnels / precast / inspection data]?"

Short answer: yes, and I want to try it this summer.

The brain architecture behind SiteSense — rules-first computation, structured evidence packs, domain expert panels, AI extension — is not specific to land feasibility. It's a pattern for any engineering domain where:

- You have real data (test results, field measurements, sensor readings)
- You have code requirements (ACI, ASCE, ASTM, EN, AASHTO)
- You need cross-domain synthesis that a spreadsheet can't do
- You need the output to be traceable, not a black box

I'm looking for summer collaboration partners. Here's the trade:

What I bring:
- The working brain architecture (7 layers, feedback loops, evidence pack pattern)
- Experience building neurosymbolic AI systems for engineering applications
- Background in FRC, hybrid reinforcement, tunnel segments, pavements, bridge design
- 8 peer-reviewed journal articles including a Best Paper of the Year (Engineering Structures, 2023)
- Willingness to spend my spare time building something real

What I'm looking for:
- Collaborators who have quality test data or field data — ASTM C1609 beam tests, structural monitoring, inspection records, material characterization, pavement performance
- People in advanced concrete, structural assessment, infrastructure management, or construction QA/QC
- Academic collaboration — co-authored conference papers, joint research exploration
- No money involved. This is about learning, building, and exploring what's possible

Why now? AI tools are powerful but generic. Engineering applications need domain brains — systems that understand code doctrine, material behavior, and failure modes. Building these takes both AI skill and engineering judgment. Most AI teams don't have the engineering. Most engineering teams don't have the AI architecture.

I'm trying to bridge that gap.

If you have data, domain expertise, and curiosity — reach out. Let's build something together this summer.

DM me or email: cpleesud@asu.edu

#CivilEngineering #AI #Research #Collaboration #FRC #StructuralEngineering #Concrete #FractureMechanics #OpenScience #Summer2026 #AcademicTwitter #NeurosymbolicAI

---

## Posting Schedule

| Post | Target Date | Content | Attachments |
|---|---|---|---|
| 1 — Announcement | March 24-25 | Video + pain point + promise of more | YouTube link, 1-2 slides |
| 2 — Technical Deep Dive | March 28-30 | 7 layers explained simply | 3-4 architecture slides |
| 3 — Personal Story | April 1-3 | Photos, lessons, gratitude | Group/event photos |
| 4 — Collaboration Call | April 7-10 | Summer project invitation | Architecture graphic |

## Narrative Thread

All 4 posts share one connecting story:

> A structural engineer who studies how materials crack applied that same thinking to how land development projects fail — and now wants to apply it to your engineering domain too.

Post 1 plants the seed (risk management).
Post 2 explains why the architecture matters (neurosymbolic, fracture mechanics analogy).
Post 3 makes it personal (the human behind the code).
Post 4 opens the door (come build with me).

By post 4, the reader has seen the technical credibility, the personal authenticity, and the clear offer — making the collaboration invitation feel earned, not cold.
