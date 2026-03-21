# Feature Spec: PDF Report User-First Refresh
Date: 2026-03-21
Layer: report + ai-prompt + netlify-function

## What We're Building
Refresh the SiteSense PDF report so it feels:

- simple
- professional
- trustworthy
- easy for non-engineers to understand

The primary audience is:

- homeowners
- small land development clients
- architects
- non-technical decision-makers

The report should help them answer:

- Is this parcel generally buildable?
- What are the biggest risks?
- What will likely cost more?
- What should I do next?

It should not read like an engineering memo or a dump of raw technical values.

## Current Report Reality

Current report strengths:

- already includes key metrics
- already includes AI plain-English translation
- already includes a clear planning-only disclaimer
- already fits a short PDF workflow

Current report weaknesses:

- too table-heavy for non-engineers
- too many raw terms without enough plain-English implication
- the most important message is not obvious in the first 10 seconds
- the visual hierarchy feels more like a data export than a client-facing report

## Consultancy Reference Set

This section captures public-facing references from major engineering and design consultancies.

These are not direct templates to copy.
They are style and communication references for:

- structure
- tone
- visual hierarchy
- executive-summary behavior
- client-facing storytelling

### 1. WSP - Environmental Due Diligence

Why it is relevant:

- WSP explicitly frames due diligence in commercial terms
- the language is risk-focused and decision-oriented
- the positioning is close to what SiteSense should do for owners and development clients

What to borrow:

- clear commercial risk framing
- concise explanation of what matters to decision-makers
- fast focus on impact to cost, risk, and action

Reference:

- https://www.wsp.com/en-us/services/environmental-due-diligence

### 2. Jacobs - Digital Environmental Assessment / Smart Report

Why it is relevant:

- Jacobs explicitly argues that static PDF reporting can become too complex
- their digital smart-report concept is useful as a reference for how consultant-grade reporting can become more transparent and structured

What to borrow:

- strong narrative flow
- structured reporting logic
- transparency and traceability mindset
- potential future direction for a digital companion to the PDF

Reference:

- https://www.jacobs.com/newsroom/news/jacobs-launches-digital-environmental-impact-assessment-tool

### 3. Arup - Public Feasibility and Insight Reports

Why it is relevant:

- Arup publishes polished public reports that balance technical credibility with readable storytelling
- their report pages present clear titles, concise framing, and visual seriousness without feeling overly technical

What to borrow:

- calm professional tone
- strong page hierarchy
- concise opening framing
- publication-style polish

References:

- https://www.arup.com/insights/tall-buildings-rising-to-the-net-zero-challenge/
- https://www.arup.com/insights/publication-integrated-demand-responsive-transport-in-cities/

### 4. Stantec - Master Plan and At-a-Glance Project Communication

Why it is relevant:

- Stantec often uses a simple "At a Glance" project communication format
- this is useful for homeowners and architects because it quickly surfaces key facts before details

What to borrow:

- short `At a Glance` summary block
- key metrics surfaced early
- human-readable project story before technical detail

References:

- https://www.stantec.com/en/projects/united-states-projects/d/dorchester-bay-city-master-plan
- https://www.stantec.com/en/projects/united-states-projects/k/kennecott-eagle-project-feasibility-study

### 5. AECOM - Public-Facing Thought Leadership / Interactive Report Style

Why it is relevant:

- AECOM uses clean, future-facing public report structures
- this is useful for layout and storytelling, even though SiteSense should stay simpler and more practical

What to borrow:

- modern report pacing
- clean section progression
- polished client-facing presentation

References:

- https://publications.aecom.com/london-2070/
- https://infrastructure.aecom.com/na

## What SiteSense Should Borrow From Consultancy Reports

Borrow these behaviors:

- start with an executive summary, not a raw appendix
- explain risk in business and owner terms
- present key facts in a short glanceable block
- make the next action obvious
- keep the tone calm, credible, and non-alarmist
- separate summary pages from technical detail

Do not borrow these problems:

- excessive jargon
- corporate thought-leadership language that says little
- long introductions before the actual conclusion
- consultant-style polish without practical action guidance

## Core Goal

The new PDF should feel like a professional feasibility summary that a homeowner or architect can read in 2 to 4 minutes.

It should communicate:

1. overall site story
2. top risks
3. what can likely be built
4. likely cost pressure
5. practical next steps

## Audience Rules

### Homeowner

Needs:

- plain language
- direct risk explanation
- clear budget signal
- simple next steps

Avoid:

- acronyms without explanation
- engineering jargon without translation
- over-detailed technical tables on page 1

### Land development client

Needs:

- fast go / caution / stop signal
- major entitlement or site-prep concerns
- high-level cost and timing pressure
- confidence in what must be checked next

### Architect

Needs:

- buildability guidance
- likely foundation / grading implications
- high-level constraint summary
- enough technical context to know what to verify later

## Report Principles

The PDF must be:

- simple first
- visual before technical
- honest about risk
- clear about limits
- professional but not intimidating

Every technical data point should answer:

- what it is
- why it matters
- what the user should do with it

## Recommended Report Structure

### Page 1: Executive summary

This page should answer the user's main question immediately.

Include:

- report title
- parcel/address
- parcel size
- simple one-sentence site verdict
- overall risk level
- top 3 takeaways
- clear disclaimer that this is planning support only

### Executive summary sentence example

"This site appears generally feasible for residential development, but slope and soil conditions may increase foundation and grading costs."

### Page 1 visual blocks

- `Overall Feasibility`
- `Top Risks`
- `Likely Build Type / Foundation Direction`
- `Cost Snapshot`

These should be visual cards, not a dense metric table.

### Page 2: Buildability and constraints

This page should explain the major constraints in plain English.

Recommended sections:

1. Terrain and grading
2. Flood and water
3. Soil and foundation
4. Environmental or permitting flags

For each section, use:

- plain-English summary
- severity chip
- why it matters
- what to check next

### Page 3: Cost and decision support

This page should focus on budget and decision-making.

Recommended sections:

1. `Estimated Site Prep Cost Now`
2. `Future Cost Outlook`
3. `What is driving cost`
4. `Build now vs wait`
5. `Recommended next steps`

If the PDF must stay shorter, this page can be merged into page 2.

### Optional final page: Technical appendix

Only if needed.

This page can contain:

- raw metrics
- code basis references
- model assumptions
- technical notes for architect/engineer handoff

Important:

- keep technical appendix separate from the main user-facing pages
- do not let appendix dominate the report

## Content Rules

### Use this style

- short sentences
- clear headings
- plain-English implications
- direct risk language
- practical next steps

### Avoid this style

- large unbroken paragraphs
- unexplained acronyms
- dense engineering tables at the top
- too many numbers with no interpretation
- legal-sounding disclaimer text dominating the report

## Required Section Types

Every report should contain these blocks somewhere:

1. `Site Snapshot`
2. `What This Means`
3. `Top Risks`
4. `What You Can Likely Build`
5. `Cost Snapshot`
6. `Next Steps`
7. `Professional Review Required`

## Risk Language Rules

Replace abstract engineering wording with user language.

Examples:

- not just `Slope: 14.8%`
- instead `The lot is moderately sloped, so grading and retaining work may be needed.`

- not just `Shrink-swell: High`
- instead `Soils on this parcel may expand and contract, which can increase foundation complexity and cost.`

- not just `Flood Zone AE`
- instead `Part of the parcel appears to be in a mapped flood hazard area, which may affect placement, permitting, and insurance.`

## Cost Presentation Rules

Costs should be shown as:

- `Now`
- `In 2 Years`
- `In 5 Years`
- `In 10 Years`

Use:

- one short cost table or comparison card
- one sentence explaining the main cost driver
- one sentence explaining whether waiting likely helps or hurts

Do not bury the cost conclusion under too much text.

## Visual Design Direction

The PDF should look more like:

- a client-facing feasibility brief
- a polished consultant summary

Not like:

- an engineering worksheet
- a government form
- a raw analytics export

### Visual hierarchy

Use:

- strong page title
- one dominant summary card near the top
- colored severity chips
- small callout boxes
- limited accent color use
- plenty of white space

### Recommended style choices

- keep current SiteSense navy/teal identity
- use larger headings and clearer section spacing
- replace dense first-page metric table with summary cards
- keep footer disclaimer small but always present

## AI Prompt Refresh

The AI report prompt should be rewritten for this audience.

Claude should write for:

- homeowner
- land development client
- architect

Claude should not write for:

- structural engineer
- plan reviewer
- code official

### Prompt rules

- explain the implication of each risk
- keep tone calm and professional
- avoid over-alarming the user
- be honest when a risk is serious
- always include a clear `next step`
- always include `professional review required`

### Better section structure for AI text

Recommended AI section titles:

1. `Site Snapshot`
2. `Biggest Risks`
3. `What You Can Likely Build`
4. `Cost Snapshot`
5. `What To Do Next`

This is simpler than a technical 6-section engineering memo.

## Runtime / Code Direction

### Keep

- `netlify/functions/report.py`
- ReportLab-based PDF generation
- AI translation layer

### Improve

- split PDF rendering into reusable section functions
- separate executive summary from appendix content
- move away from one big metrics table as the primary storytelling device
- add user-facing summary cards
- improve report text parsing and section rendering

## Files to Create or Edit

- `specs/pdf-report-user-first.md` - this spec
- `src/backend/report/pdf_report.py` - redesign page structure and section rendering
- `src/backend/ai/translate.py` - rewrite prompt and output section rules
- `netlify/functions/report.py` - keep endpoint, update output naming only if needed
- `docs/decisions.md` - log report structure decision after implementation

## Implementation Steps

1. [ ] Define final audience-first section order
2. [ ] Rewrite Claude prompt for non-engineer report language
3. [ ] Replace the current first-page metric table with summary cards
4. [ ] Create reusable PDF section render helpers
5. [ ] Add risk callouts with plain-English implications
6. [ ] Add clearer cost presentation with now / 2yr / 5yr / 10yr
7. [ ] Add a separate appendix area for technical details if needed
8. [ ] Ensure disclaimer is present but not visually overwhelming
9. [ ] Test readability with a homeowner-style example and an architect-style example

## Demo Test

### Homeowner read test

Question:

"Can a homeowner understand the main site story in under 2 minutes?"

Expected:

- yes
- top risks are obvious
- likely cost pressure is obvious
- next steps are practical and clear

### Architect read test

Question:

"Can an architect quickly understand likely buildability and what needs professional verification?"

Expected:

- yes
- foundation/grading implications are clear
- technical appendix is available but does not dominate

## Out of Scope

- permit-ready engineering report
- highly technical appendix for engineer-only audiences
- photoreal renderings inside the PDF
- complex multi-property portfolio reporting

## Success Criteria

- The first page communicates the parcel story in under 10 seconds
- A non-engineer can explain the top 3 risks after reading the report
- The report feels professional without sounding overly technical
- Costs are understandable and decision-oriented
- The PDF clearly supports handoff to a real engineer, architect, or development team
