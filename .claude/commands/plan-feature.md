# /plan-feature — SiteSense Feature Planning

Use BEFORE implementing any new feature. Creates a spec in `specs/` to guide a clean implementation session.

## SiteSense Feature Areas (for context)
- **Map / Draw** — MapLibre + Esri satellite + Nominatim search + polygon draw tool
- **GIS Data** — USGS elevation, FEMA flood, USDA soil, USGS seismic, USFWS wetlands (all free, no auth)
- **Engineering Engine** — cut/fill, slope, foundation type, structural loads, stormwater (in `src/backend/engineering/`)
- **Cost Engine** — ROM estimate + 10yr projection at 4.5% ENR CCI (`src/backend/engineering/cost.py`)
- **AI Report** — Claude sonnet-4-6 translates results → 6-section plain-English report (`src/backend/ai/translate.py`)
- **PDF** — ReportLab generates PDF bytes → base64 → download (`src/backend/report/pdf_report.py`)
- **Netlify Functions** — `analyze.py` and `report.py` are the Lambda entry points

## Steps

1. **Clarify the feature:**
   - What exactly needs to change or be added?
   - Which layer: frontend component / Netlify function / backend module / AI prompt?
   - What does success look like at demo time?

2. **Research (sub-agents only — never dump raw content into main context):**
   - For GIS APIs: check free endpoint availability, rate limits, response shape
   - For engineering rules: check ACI/ASCE code references in CLAUDE.md
   - For UI: check existing components in `src/frontend/src/components/`

3. **Write spec to `specs/[feature-name].md`:**

   ```markdown
   # Feature Spec: [Name]
   Date: [today]
   Layer: frontend | netlify-function | backend-module | ai-prompt | pdf

   ## What We're Building
   [1-2 sentences]

   ## Inputs / Outputs
   - Input: [what comes in]
   - Output: [what goes out]

   ## Files to Create or Edit
   - `[path]` — [why]

   ## Implementation Steps
   1. [ ] Step 1
   2. [ ] Step 2

   ## Demo Test
   [Which of the 3 demo addresses will verify this works?]

   ## Out of Scope
   - [What we are NOT doing]
   ```

4. **Review with user** before coding starts.

5. **Hand off:** "Open a fresh session, run /prime, then /execute with this spec."
