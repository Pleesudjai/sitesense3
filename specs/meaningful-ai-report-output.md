# Feature Spec: Meaningful AI Report Output
Date: 2026-03-21
Layer: product-ai

## What This Spec Is For
This spec defines how SiteSense should use AI in a way that is meaningfully better than a traditional web app or static rules engine.

Claude should use this spec to:

- avoid adding AI as decoration
- design AI output that judges can immediately recognize as valuable
- make the report feel like a decision-support copilot, not just a generated paragraph
- keep the AI contribution clearly distinct from normal GIS dashboards

This spec should be used together with:

- [problem-statement-and-user-needs.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/problem-statement-and-user-needs.md)
- [pdf-report-user-first.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/pdf-report-user-first.md)
- [hackathon-win-plan.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/hackathon-win-plan.md)
- [site-responsive-house-design.md](c:/Users/chidc/ASU%20Dropbox/Mobasher_Group/Hackathon%20ASU%202025/specs/site-responsive-house-design.md)

## Core Rule
Traditional software can already do:

- map display
- layer toggles
- charts and tables
- fixed risk formulas
- PDF export

So the AI layer should not just repeat those things in paragraph form.

The AI layer must do work that normal web code does poorly:

- synthesize many signals into one coherent judgment
- explain tradeoffs in plain English
- personalize the answer to the user type
- compare scenarios and reason across them
- identify contradictions, hidden risks, and missing information
- produce an action-oriented next-step brief

## What Research On Winning Student Hackathon Projects Suggests

The winning and high-performing student projects I checked do not use AI only as a chatbot sticker.
They use AI to transform large, messy, or hard-to-interpret inputs into a decision-ready output.

### Pattern 1: AI compresses complex source material into an actionable artifact

Examples:

- `InCite` at ICHack 2025 used AI to visually map how papers cite and build on each other, helping users identify gaps and conflicts.
- `InsightAI` uses AI to crawl long documentation or study materials and turn them into answers, summaries, quizzes, and explanations.
- `Tutor.ai` turns live lectures and whiteboard content into dyslexia-friendly study guides and interactive learning materials.

Meaning for SiteSense:

- the AI should transform many land signals into a decision artifact, not just narrate metrics

### Pattern 2: AI becomes a reasoning layer between raw data and user action

Examples:

- `HawkWatch` used AI to detect and classify incidents from live camera feeds and trigger action
- `Healthcare` at HackDKU matched patients to doctors based on symptoms
- `Sahabi` recommended cloud migration paths and explained risks to government users

Meaning for SiteSense:

- the AI should reason from parcel data to recommended action, not just summarize

### Pattern 3: AI output is tailored to a user task

Examples:

- `Tutor.ai` adapts output for dyslexic learners
- `InsightAI` has separate developer and learning modes
- UH's Vibe Coding winner used AI to draft descriptions, suggest venues, and assist event applications

Meaning for SiteSense:

- the same parcel should produce different phrasing and emphasis for a homeowner, architect, or small developer

## Sources Behind These Patterns

- UCL on `InCite` winning ICHack 2025: https://www.ucl.ac.uk/engineering/news/2025/feb/team-cs-undergrads-win-europes-largest-student-run-hackathon
- `Tutor.ai` Devpost page: https://devpost.com/software/tutor-ai-molhyd
- `InsightAI` Devpost page: https://devpost.com/software/insight-ahi
- TreeHacks 2025 prize criteria: https://treehacks-2025.devpost.com/
- `HawkWatch` TreeHacks 2025 grand prize recap: https://www.nilsfleig.com/projects/hawkwatch
- UH Vibe Coding first-place recap: https://www.ics.hawaii.edu/2025/09/ai-driven-innovation-helps-uh-team-win-hackathon-top-prize/
- `Sahabi` university winner article: https://admission.kau.edu.sa/en/news-details/king-abdulaziz-university-student-team-wins-first-place-at-saudi-opensource-hackathon-2025-with-ai-powered-innovation-sahabi

## What AI In SiteSense Should Actually Do

### 1. Build a decision narrative

The AI should answer:

- Is this parcel a good candidate, caution case, or high-risk case?
- Why?
- What 2 or 3 factors matter most?
- What would likely change the recommendation?

This is more than a summary.
It is a judgment layer.

### 2. Explain tradeoffs

The AI should connect signals together.

Example:

- "This site has acceptable acreage, but the usable buildable zone is reduced by floodplain overlap and slope, so the apparent parcel size overstates true development flexibility."

Traditional code can show acreage and flood overlap separately.
The AI should explain the conflict between them.

### 3. Personalize the report by user type

For homeowners, emphasize:

- buildability
- likely hidden cost
- what they can build
- what to ask a real engineer next

For architects, emphasize:

- buildable envelope
- orientation
- room-zoning implications
- specialist coordination needs

For small developers, emphasize:

- usable area
- entitlement and access risk
- utility and mitigation burden
- cost timing

### 4. Produce scenario reasoning

The AI should compare options such as:

- build now vs wait
- 1-story vs 2-story concept
- lower-risk pad vs better-view pad
- conservative concept vs aggressive concept

This is important because the real decision is often comparative.

### 5. Detect missing due diligence

The AI should call out what is still unknown.

Examples:

- no utility data found
- parcel boundary available but no survey confirmation
- wetlands mapped but no jurisdictional delineation
- soils screening available but geotechnical borings still needed

This creates trust.

### 6. Generate a professional handoff brief

The AI should not end with a narrative only.
It should generate a short action brief such as:

- top site issues to verify
- questions for surveyor
- questions for civil engineer
- questions for architect
- likely permitting conversations to start

This is where AI becomes operationally useful.

## What AI Should Not Do

Do not use AI only for:

- generic marketing language
- rewriting the same metrics already visible on the page
- hallucinated legal or engineering certainty
- fake precision
- broad inspirational text that does not change the user's next decision

If the AI output could be replaced by a static paragraph template, it is not meaningful enough.

## Recommended AI Output Structure

The report should contain an AI layer with sections like:

### 1. Verdict

- Good Candidate / Proceed with Caution / High Risk

### 2. Why This Matters

- short plain-English explanation of the parcel's biggest tradeoffs

### 3. Best-Fit Concept Direction

- what kind of house or site strategy seems most realistic

### 4. Decision Comparison

- now vs later
- concept A vs concept B

### 5. Unknowns and Limits

- what still needs professional verification

### 6. Next Professional Steps

- survey
- geotech
- civil review
- zoning/planning call
- utility confirmation

## Strong Recommendation For The Report
The best AI contribution for SiteSense is:

`AI parcel strategist + AI handoff brief`

That means the AI should behave like an early consultant who:

- reads all parcel evidence
- forms a justified recommendation
- identifies contradictions and unknowns
- translates the result for the specific user
- prepares the next conversation with real professionals

This is much stronger than:

- "Here is a summary of your flood and slope metrics."

## Best Hackathon Demo Move
During the demo, show that the AI can do something the dashboard alone cannot:

1. Analyze the parcel data
2. Produce a different recommendation for a homeowner versus a small developer
3. Compare two concept directions
4. Generate a short "take this to your engineer" handoff brief

That will make the AI feel essential.

## Implementation Direction

Claude should implement AI output as a structured layer, not one giant freeform paragraph.

Recommended backend output shape:

```json
{
  "ai_report": {
    "verdict": "Proceed with Caution",
    "top_reasons": [
      "Buildable area is reduced by slope and mapped flood exposure.",
      "The parcel is still potentially viable for a compact, well-sited concept."
    ],
    "best_fit_concept": "Compact 2-story home on the north-central pad with minimized west glazing.",
    "scenario_comparison": [
      "A 2-story concept preserves more open area and reduces pad demand.",
      "Waiting may increase total cost if regional construction inflation continues."
    ],
    "unknowns": [
      "Utility extension costs are not yet confirmed.",
      "Geotechnical borings are still required."
    ],
    "next_steps": [
      "Confirm utility service feasibility.",
      "Request civil drainage review.",
      "Have an architect test the concept against setbacks and orientation."
    ]
  }
}
```

## Success Criteria

- the AI output changes a user's next action
- the AI output synthesizes multiple data sources instead of restating one
- the report feels adaptive to the user type
- the report clearly exposes unknowns and limits
- the product demonstrates something a normal GIS dashboard would not do well
