# Feature Spec: Problem Statement and User Needs
Date: 2026-03-21
Layer: product

## What This Spec Is For
This spec explains the real problem SiteSense is solving.

Claude should use this file to:

- keep feature decisions tied to real user pain
- explain why the current roadmap matters
- write better product copy, PDF summaries, and demo language
- avoid turning the app into a generic GIS viewer

This spec should be used together with:

- [hackathon-win-plan.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/hackathon-win-plan.md)
- [pdf-report-user-first.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/pdf-report-user-first.md)
- [house-concept-estimator.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/house-concept-estimator.md)
- [price-prediction-data-stack.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/price-prediction-data-stack.md)

## Core Product Truth
SiteSense is not mainly solving a "map problem."

SiteSense is solving a `late-surprise problem`.

Homeowners, small developers, architects, and early-stage land buyers often commit emotionally or financially before they fully understand:

- whether the land is truly buildable
- what hidden constraints may delay approval
- how expensive drainage, grading, utilities, soils, or mitigation may become
- what kind of home or concept can realistically fit
- whether they should move now or wait

Public data exists, but it is fragmented, technical, and hard to turn into a simple decision.

## Product Problem Statement
People making early land and home-building decisions usually do not have a clear, affordable, and understandable way to combine zoning, utilities, easements, soils, flood risk, environmental constraints, terrain, and cost timing into one answer.

As a result, they often discover major risks too late, after they have already spent money on the property, concept plans, consultants, or permits.

SiteSense exists to compress early due diligence into a simple, plain-English, professional screening workflow that helps users understand:

- can I likely build here
- what are the biggest risks
- what might it cost
- what should the real engineer, architect, or jurisdiction review next

## Who Feels This Pain

### 1. Homeowners

Typical mindset:

- "I found land I like. Can I build my house here without a disaster?"

Main concerns:

- hidden flood risk
- septic or utility problems
- slope and grading cost
- soil/foundation issues
- permit delays
- total cost now versus later
- fear of being misled by simplistic online estimates

### 2. Small land developers

Typical mindset:

- "Can this parcel support a profitable, realistic concept without major entitlement or engineering surprises?"

Main concerns:

- zoning and future land use
- frontage and access
- drainage and floodplain
- wetlands and environmental review
- utility availability and extensions
- easements shrinking usable area
- contamination or cleanup risk
- time-to-approval uncertainty

### 3. Architects and design teams

Typical mindset:

- "Before I sketch too far, what site constraints could invalidate the concept?"

Main concerns:

- buildable envelope
- setbacks, buffers, and environmental constraints
- feasible program fit
- rough cost realism
- what specialists need to be involved next

## What The Official Sources Show

### Fragmented pre-development review is normal

Official city and county guidance shows that early land development review requires many separate inputs.

Austin's site plan pre-submittal guide says applicants need:

- legal property description
- boundaries and limits of construction
- existing utilities
- easements and setbacks
- floodplain and creeks
- environmental constraints
- preliminary site design layout

This means the real question is never just "show the parcel."
The real question is "what could stop or reshape the project?"

### Supportability is not obvious at the start

Maricopa County pre-application guidance shows that planning, drainage, flood control, transportation, zoning, and environmental review all matter early, and that informal support is not the same thing as final approval.

This means many users need a screening workflow before they hire the full consultant team.

### Regulation and review create real cost

NAHB says government regulation accounts for roughly a quarter of the price of a typical new single-family home.
NAHB also notes that some federal permitting and consultation paths can add months or more than a year.

This means users are not only buying design and materials.
They are buying time, coordination, mitigation, and compliance.

### Hazard and environmental datasets are useful but incomplete on their own

FEMA, NRCS, EPA, and USFWS all provide important data, but each comes with interpretation limits.

Examples:

- FEMA flood maps are critical, but local review still matters
- SSURGO is excellent for screening, but it does not replace geotechnical borings
- NWI is useful, but USFWS says it is not a legal jurisdictional wetland boundary
- contamination data may be spread across multiple EPA or state programs

This means users need interpretation, not just access.

## What Reddit Adds

Reddit is not authoritative engineering guidance.
Claude should treat it as qualitative user-pain evidence, not regulatory truth.

What Reddit consistently shows:

- people worry about utilities before they worry about design
- people get surprised by easements and setbacks
- people underestimate drainage and runoff problems
- people fear bad soils and foundation cracking
- people do not trust generic online construction estimates
- people want a checklist, not a wall of GIS layers

This is important because it shows how users describe the problem in their own words.

The product should sound like it understands those anxieties.

## Main User Pains To Solve

### Pain 1: "I do not know if this land is actually buildable"

Why it happens:

- parcel area is mistaken for usable area
- people miss floodplain, easements, buffers, wetlands, slope, or access issues

What SiteSense should answer:

- likely buildability
- usable versus constrained area
- biggest red flags

### Pain 2: "I do not know what hidden cost drivers are waiting"

Why it happens:

- grading, drainage, utilities, and mitigation are not obvious from listing pages
- online cost calculators ignore site conditions

What SiteSense should answer:

- likely grading and drainage burden
- likely foundation/soil risk
- cost now versus later
- what is driving the estimate

### Pain 3: "I do not know what I can realistically fit here"

Why it happens:

- people think in bedrooms, bathrooms, stories, and lifestyle
- site constraints are technical and abstract

What SiteSense should answer:

- plausible house or site concepts
- rough fit within buildable area
- conceptual massing or sketch direction

### Pain 4: "I do not know what professional help I need next"

Why it happens:

- users do not know when to call an engineer, geotech, surveyor, architect, or planner

What SiteSense should answer:

- clear next-step guidance
- professional review required messaging
- what data or field work is still needed

## Why The Current Features Are Needed

### GIS stack

Needed because flood, terrain, soils, wetlands, hydrography, and hazards are the first screening layer.

Without this:

- users buy land or start concepts with blind spots

### Jacobs-style consultant additions

Needed because parcel, zoning, utilities, easements, access, and contamination are often bigger deal-killers than pure terrain.

Without this:

- the app looks smart but misses the practical reasons projects fail

### Soil layers

Needed because soil drainage, hydrologic group, depth to water table, restrictive layers, and corrosivity proxies affect stormwater, foundations, and long-term performance.

Without this:

- terrain analysis feels incomplete

### House concept estimator

Needed because users ask "what can I build here?" very early.

Without this:

- the app identifies problems but does not help users imagine a realistic next move

### Price prediction

Needed because users care about timing and affordability, not just geometry.

Without this:

- the app feels static even though costs are dynamic

### User-first PDF

Needed because decisions are collaborative.
The output must be understandable by owners, architects, engineers, lenders, and family members.

Without this:

- the app is harder to share, defend, and act on

### Frontend refresh

Needed because non-engineers decide in seconds whether a tool feels trustworthy.

Without this:

- the app risks feeling like a technical demo instead of a product

### Professional review required guardrail

Needed because early screening is not permit design.

Without this:

- the product becomes ethically weak and legally confusing

## Product Positioning Rule
Claude should describe SiteSense as:

- an early feasibility copilot
- a land and home planning screening tool
- a decision-support layer before full consultant engagement

Claude should not describe SiteSense as:

- a permit-ready design engine
- a replacement for licensed engineering
- a final authority on jurisdictional approval

## UX Writing Rule
Claude should write like the user is anxious, smart, busy, and not deeply technical.

The product voice should:

- reduce uncertainty
- name the main risks clearly
- avoid jargon when possible
- say what to do next
- keep expert caveats visible but not overwhelming

## Demo Rule
For hackathon and startup demos, the clearest story is:

1. Select or draw a parcel
2. Get an instant buildability and risk summary
3. See what concept may fit
4. See cost now versus later
5. Export a professional summary
6. Hand the result to a real engineer or architect for next-stage review

## Startup Rule
The startup opportunity is larger than the hackathon demo.

This product direction should stay universal:

- geography-agnostic where possible
- modular in data sources
- useful before purchase and before design
- understandable to non-experts
- compatible with real consultant handoff

## Success Criteria

- Claude can explain why each major feature exists
- product copy stays grounded in real user pain
- the team does not drift into building a generic GIS explorer
- the app remains understandable to homeowners and small developers
- the engineering-review boundary stays explicit

## Sources

Official and industry sources:

- Austin site plan pre-submittal guide: https://www.austintexas.gov/sites/default/files/files/Development_Services/SP_ApplicantGuidePresubmittalConsultations.pdf
- Maricopa County pre-application meeting: https://mcdot.maricopa.gov/2206/Pre-Application-Meeting
- Austin site plan review: https://www.austintexas.gov/siteplans
- FEMA Know Your Risk for homeowners: https://www.fema.gov/flood-maps/know-your-risk/homeowners
- FEMA flood maps: https://www.fema.gov/flood-maps
- NRCS SSURGO: https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo
- EPA contaminated site locations: https://www.epa.gov/risks-contaminated-sites/contaminated-site-locations-and-contact-information
- USFWS NWI contact and limitations: https://www.fws.gov/program/national-wetlands-inventory/contact-us
- NAHB federal regulatory reform: https://www.nahb.org/Advocacy/Industry-Issues/Federal-Regulatory-Reform
- NAHB permitting roadblocks statement: https://www.nahb.org/news-and-economics/press-releases/2025/02/home-builders-tell-congress-how-permitting-roadblocks-raise-housing-costs
- NAHB 2024 cost of constructing a home study: https://www.nahb.org/-/media/NAHB/news-and-economics/docs/housing-economics-plus/special-studies/2025/special-study-cost-of-constructing-a-home-2024-january-2025.pdf
- BEA Regional Price Parities: https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area

Reddit user-pain references:

- Homebuilding raw land checklist: https://www.reddit.com/r/Homebuilding/comments/1cpiudj/whats_the_checklist_before_buying_raw_land_to/
- Homebuilding after land purchase checklist: https://www.reddit.com/r/Homebuilding/comments/1lb9znu/to_do_list_after_purchasing_land/
- Homebuilding private drainage easement question: https://www.reddit.com/r/Homebuilding/comments/1i36hpk/private_drainage_easement_question/
- Homebuilding utility timing question: https://www.reddit.com/r/Homebuilding/comments/1j54hmy/do_i_get_utilities_to_the_property_before_or/
- Homebuilding build cost estimate thread: https://www.reddit.com/r/Homebuilding/comments/1jm3zjf/build_cost_estimate/
- RealEstate build disaster experience: https://www.reddit.com/r/RealEstate/comments/1n6l5tf/building_our_home_tx_is_the_biggest_mistake_we/
