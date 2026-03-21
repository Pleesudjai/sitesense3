# Feature Spec: Hackathon Win Plan
Date: 2026-03-21
Layer: product + frontend + backend + ai-prompt + report

## What We're Building
This is not a product feature spec in the normal sense.
This is the final execution plan for maximizing the chance that SiteSense wins HackASU.

It is based on the judging rubric extracted from `HackASU Intro Slides.pptx`.

## Start Here

Claude should treat this as the execution order unless a blocking issue is discovered:

1. execute `pdf-report-user-first`
2. execute `price-prediction-data-stack`
3. execute `house-concept-estimator`
4. add only the frontend polish needed to make the demo flow clear and convincing

This order is intentional:

- the PDF creates a strong client-facing artifact
- the pricing layer strengthens the economic empowerment story
- the house concept layer creates the strongest "what can I build here?" moment
- frontend polish should support the story, not distract from it

## Startup Direction

Although this plan is optimized for the hackathon, SiteSense should be built with a startup future in mind.

That means the ideas and components developed today should be:

- reusable
- generalizable
- portable beyond Arizona
- understandable to non-expert users
- extensible into a broader property and land decision platform

### Universal product rule

Do not build hackathon-only logic unless it is strictly necessary for demo reliability.

Whenever possible, choose:

- universal data models
- modular backend services
- reusable UI patterns
- geography-agnostic product language
- generalized cost and feasibility frameworks with local rule overlays

### What should remain universal

The long-term product should work as a general framework for:

- homeowners
- small developers
- architects
- land buyers
- consultants
- future B2B or B2G use cases

So the core product ideas should stay universal:

- parcel feasibility screening
- plain-English risk explanation
- buildability guidance
- cost now vs later
- client-ready reporting
- professional-review handoff

### What can stay region-specific

Regional rules can still be a differentiator, but they should be layered on top of a universal base.

Example:

- universal base: slope, flood, soil, wetlands, cost, house fit, report
- regional overlay: Arizona caliche, expansive soil emphasis, local water adequacy, wildfire specifics

This lets the product win the hackathon now while still being extensible into a real startup product later.

## Judging Rubric

### Official judging weights

- `Technical Execution` - 30 pts
- `Impact Potential` - 25 pts
- `Ethical Alignment` - 25 pts
- `Presentation` - 20 pts

### What this means strategically

Winning is not about adding the largest number of technical layers.

Winning is about:

- showing a real and important problem
- demonstrating a working, believable solution
- communicating ethical boundaries clearly
- presenting a complete and memorable story

## SiteSense Winning Story

The strongest version of the story is:

"SiteSense helps homeowners, land buyers, small developers, and architects understand whether land is realistically buildable before they spend thousands of dollars on early engineering work."

That story is strong because it directly fits:

- `Economic Empowerment`
- `Education`
- `access to expertise`
- `high-cost decision support`

## Core Product Demo We Should Optimize For

The demo should feel like one coherent workflow:

1. User draws a parcel
2. SiteSense returns an instant feasibility verdict
3. SiteSense explains the top risks in plain English
4. SiteSense shows what can likely be built
5. SiteSense shows cost now vs later
6. SiteSense generates a professional client-ready PDF
7. SiteSense clearly says when a real engineer must take over

This flow hits all 4 judging categories.

## Highest-Priority Features

### Priority 1: Instant Feasibility Verdict

Add a top-level result that clearly says:

- `Good Candidate`
- `Proceed with Caution`
- `High Risk`

And always include 3 plain-English reasons.

Why this matters:

- instantly improves impact
- instantly improves presentation
- makes the app understandable to judges in seconds

### Priority 2: What Can I Build Here?

Use the house concept estimator direction to show:

- 1-story home option
- 2-story home option
- optional duplex / ADU / compact higher-yield option

This does not need to be full permit-ready design.
It only needs to feel believable and useful.

Why this matters:

- connects land data to user action
- turns GIS into a decision product
- makes the demo much more memorable

### Priority 3: Build Now vs Wait

Use the price prediction stack to show:

- current estimate
- 2-year estimate
- 5-year estimate
- top drivers of cost increase

Why this matters:

- directly supports economic empowerment
- makes the product feel financially useful
- gives judges a strong "why this matters now" narrative

### Priority 4: User-First PDF

Use the PDF refresh plan to generate:

- executive summary
- top risks
- buildability direction
- cost snapshot
- next steps
- professional review requirement

Why this matters:

- gives the demo a tangible artifact
- makes the product feel real and client-ready
- strongly helps presentation

### Priority 5: Ethical Guardrail Layer

The app must visibly and repeatedly say:

- this is preliminary planning support
- not permit-ready
- licensed engineer review required

Why this matters:

- directly scores under Ethical Alignment
- builds trust
- protects the story from judges asking hard questions

## What Not To Prioritize

These are lower value relative to the rubric:

- adding even more GIS layers
- deeper code ingestion or standards ingestion
- perfect structural analysis
- broad frontend redesign that does not improve the main workflow
- highly technical appendix work that judges will not see

## Recommended Work Order

### Track A: Must-have for winning

1. `Feasibility verdict`
2. `Plain-English top risks`
3. `Build now vs wait`
4. `User-first PDF`
5. `Professional review warning`

### Track B: Strong differentiator

6. `What can I build here?`
7. `Simple concept house scenarios`
8. `Better top-level product UX for the demo flow`

### Track C: Nice-to-have only if time remains

9. `More refined price forecasting`
10. `Improved frontend shell`
11. `Additional map layer polish`

## Mapping to Existing Specs

Use these specs as the execution source:

- [house-concept-estimator.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/house-concept-estimator.md)
- [price-prediction-data-stack.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/price-prediction-data-stack.md)
- [pdf-report-user-first.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/pdf-report-user-first.md)
- [frontend-reference-refresh.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/frontend-reference-refresh.md)
- [engineering-knowledge-rag.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/engineering-knowledge-rag.md)

### Strong recommendation

For hackathon purposes:

- execute `house-concept-estimator`
- execute `price-prediction-data-stack`
- execute `pdf-report-user-first`

Do not prioritize `engineering-knowledge-rag` unless it directly improves the demo story in a visible way.

## Score-Driven Feature Mapping

### Technical Execution - 30 pts

Best visible proof:

- working parcel analysis
- working risk summary
- working cost now vs future
- working PDF export
- working concept build suggestion

### Impact Potential - 25 pts

Best visible proof:

- homeowner / small developer can avoid bad land decisions
- access to early engineering insight is democratized
- product reduces the cost barrier to feasibility screening

### Ethical Alignment - 25 pts

Best visible proof:

- clear disclaimers
- never pretending to replace licensed engineering
- transparent limitations
- empowering informed choices instead of making risky decisions for users

### Presentation - 20 pts

Best visible proof:

- clear verdict on the first screen
- one coherent story
- polished PDF
- strong before/after cost narrative
- confident live demo with preset addresses

## Demo Script Recommendation

### 90-second version

1. "This is SiteSense. It helps ordinary people understand whether land is realistically buildable before spending thousands on early engineering."
2. Draw or load a parcel.
3. Show the instant verdict and the top 3 risks.
4. Show what can likely be built there.
5. Show cost now vs waiting.
6. Export the user-first PDF.
7. End with the ethical point: this empowers better early decisions, but a real engineer still reviews the project before submission.

### Key phrases to use

- "engineering insight for people who normally cannot afford early feasibility work"
- "plain-English buildability guidance"
- "cost now versus waiting"
- "not replacing engineers, but helping users know when to involve one"

## Demo Reliability Plan

The demo must be reliable.

Required:

- use stable demo addresses
- have fallback demo mode
- have at least one PDF ready in case live generation fails
- have one saved example showing strong risk contrast

Recommended demo set:

- Tempe parcel: low-to-moderate risk
- Houston parcel: flood-heavy risk
- Flagstaff parcel: slope/snow/cut-fill heavy risk

## Implementation Plan for Remaining Time

### If time is very short

Do only:

1. top-level feasibility verdict
2. build now vs wait card
3. PDF refresh
4. disclaimer and ethical framing

### If moderate time remains

Add:

5. simple "what can I build here?" scenarios
6. cleaner right-panel UX for demo flow

### If more time remains

Add:

7. polished concept layout visuals
8. improved price forecast explanation

## Files to Create or Edit

- `specs/hackathon-win-plan.md` - this plan
- `src/frontend/src/App.jsx` - top-level verdict and demo flow
- `src/frontend/src/components/RiskCards.jsx` - sharper top risk framing
- `src/frontend/src/components/CostTable.jsx` - now vs wait framing
- `src/frontend/src/components/ReportButton.jsx` - stronger PDF call-to-action
- `src/backend/ai/translate.py` - tighter user-facing narrative
- `src/backend/report/pdf_report.py` - better first-page summary

## Success Criteria

- Judges understand the product value in under 15 seconds
- The demo clearly addresses economic empowerment
- The product appears technically credible and actually working
- The product is visibly ethical and realistic about professional review
- The final presentation feels like a complete solution, not a collection of interesting parts
