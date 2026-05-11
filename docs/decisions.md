# Decision Log
# Append new entries at the bottom using /commit command

---

## 2026-03-20 — Project Setup
**What was built:** WISC-based context engineering folder structure for the hackathon.
**Why:** Following Cole Medin's WISC framework to prevent context rot and keep AI sessions productive throughout the hackathon.
**Files created:**
- `CLAUDE.md` — global AI rules
- `.claude/commands/` — prime, plan-feature, execute, handoff, commit
- `.claude/rules/` — frontend, backend, ai-layer domain rules
- `docs/` — decisions log and handoff

**Next:** Choose one of the 8 project options, run `/plan-feature` to create a spec, then start building.

---

## 2026-03-20 — Project Selected: SiteSense (AI Land Feasibility Tool)
**Decision:** Build the SiteSense land feasibility tool — NOT one of the 8 original Arizona-only options.
**Why:** The team has a detailed battle plan (Hackathon Plan.pdf) for this. It directly fits Track 3
(Economic Empowerment) by democratizing access to $10K–$50K civil engineering feasibility studies.
The ACI 350-20 + ACI 360R-10 + ASCE 7-22 rule engine is the competitive moat vs. generic LLM tools.
Arizona-specific rules (caliche, expansive soil, ADWR washes, water adequacy) provide local differentiation.

**Track:** Track 3 — Economic Empowerment & Education
**Pitch framing:** Solving affordable housing crisis by removing engineering knowledge barrier

**Key ACI codes:**
- ACI 350-20 / 350R-20 — Environmental engineering concrete structures
- ACI 360R-10 — Slab-on-ground design
- ASCE 7-22 — Wind, seismic, flood, snow loads

**Stack finalized:** React + Vite + Tailwind + Mapbox GL JS (frontend) / Python FastAPI (backend)
**Deploy plan:** Vercel (frontend) + Render (backend)

**Next:** Scaffold frontend and backend in src/, implement USGS elevation API first.

---

## 2026-03-20 — Deployment: Netlify (frontend) + Render (backend)
**Decision:** Frontend on Netlify, FastAPI backend on Render (free tier).
**Why:** FastAPI doesn't run natively as Netlify Functions. Render supports Python webservers.
Netlify proxies `/api/*` → Render backend, so no CORS issues and backend URL stays hidden.

**Files created:**
- `netlify.toml` (root) — Netlify build config, SPA redirect, API proxy to Render
- `src/frontend/netlify.toml` — same for if deploying from frontend subfolder
- `src/backend/render.yaml` — Render service definition
- `src/frontend/src/api.js` — updated to use `VITE_API_URL` env var in production

**Deploy steps:**
1. Push repo to GitHub
2. Render: New Web Service → connect repo → root dir `src/backend` → free tier
3. Render: Set `ANTHROPIC_API_KEY` in environment panel
4. Copy Render URL (e.g. `https://sitesense-api.onrender.com`)
5. Update `netlify.toml` proxy URL with actual Render URL
6. Netlify: New site → connect repo → Netlify auto-reads `netlify.toml`
7. Netlify: Set `VITE_MAPBOX_TOKEN` in environment variables panel

## 2026-03-21 — Local Dev: netlify dev + Vite proxy fix

**What was built:** Full local development stack — `netlify dev` runs Vite frontend + JS Netlify functions simultaneously without Netlify build credits.

**Why this approach:**
- Netlify Dev (port 9000) proxies JS function invocations but has a MIME type bug on Windows for ES module scripts — browser blocks JS with empty Content-Type
- Fix: Open Vite directly (port 5175/5176) and configure Vite's proxy to forward `/api` → `http://localhost:9000` (where functions run)
- `npm install` inside `netlify/functions/` required — `@anthropic-ai/sdk` must be installed locally for dev (plugin only runs at Netlify deploy time)
- `netlify.toml` `[dev]` command changed to `npm --prefix src/frontend run dev` for Windows path compatibility

**Files changed:**
- `netlify.toml` — `[dev]` command uses `npm --prefix`, port changed to 9000
- `src/frontend/vite.config.js` — proxy `/api` → `http://localhost:9000` (was `localhost:8000` + path rewrite)
- `src/frontend/src/components/MapView.jsx` — cleanup sets `map.current = null` to fix React StrictMode double-mount
- `netlify/functions/package-lock.json` — generated after local `npm install`

**Next:** Run `netlify dev` from project root → open `http://localhost:5176` (or whichever port Vite picks) for full local testing including Analyze Parcel.

---

## 2026-03-21 — Elevation Display Redesign (Satellite + Contour + 3D)
**What was built:** Complete rewrite of ElevationChart.jsx with 3 interactive views: satellite imagery with smooth contour lines (MapLibre GeoJSON), canvas heatmap with zoom/pan, and interactive 3D surface with satellite texture mapping and rotate/zoom. All views show the user's drawn polygon boundary (cyan dashed outline).
**Why this approach:** Civil engineering PhD user wanted engineering-grade contours (marching squares + Catmull-Rom spline smoothing + proper intervals) that are also understandable by non-engineer landowners (plain-English terrain summary, satellite imagery base). Aspect ratio preservation was critical — bbox geographic ratio drives all view dimensions. Contours extend 20x beyond bbox on satellite view so they're visible when zoomed out.
**Files changed:**
- `src/frontend/src/components/ElevationChart.jsx` — full rewrite (~850 lines), 3 view modes, contour engine with upsampling + marching squares + chaining + Catmull-Rom smoothing
- `src/frontend/src/App.jsx` — pass `polygon` prop to ElevationChart

---

## 2026-03-21 — GIS Phase 2+3: 13 Data Layers (from todofromX.md)
**What was built:** Expanded from 6 to 13 parallel GIS data fetches in analyze.js. Added: NOAA Atlas 14 precipitation (live API), EPA contamination screening (Envirofacts + FRS fallback), USGS NHD hydrography/streams, USFWS critical habitat/endangered species, NPS National Register historic sites, USGS landslide susceptibility (rule-based), NOAA sea level rise (coastal). All free, no auth.
**Why this approach:** Following Jacob's todofromX.md prioritization — engineering credibility (core 4 layers) + user-perceived value (parcel context) + surprise prevention (contamination, species) + regional differentiation (landslide, wildfire, coastal). All 13 fetches run in single Promise.all — no extra latency.
**Files changed:**
- `netlify/functions/analyze.js` — 7 new GIS fetch functions, wired into parallel Promise.all
- `src/frontend/src/components/RiskCards.jsx` — 13 risk cards in 3-column grid
- `src/frontend/src/api.js` — demo data for all 13 layers

---

## 2026-03-21 — SSURGO Soil Layer Upgrade (Full Engineering Properties)
**What was built:** Two-step soil data: SoilWeb (fast texture) + USDA SDA SQL query for full SSURGO properties — hydrologic soil group (A/B/C/D), flooding/ponding frequency, restrictive layer depth, concrete/steel corrosion risk, septic suitability, and auto-generated building limitations list with ACI/IBC code references.
**Why this approach:** The todofromX.md explicitly called for HSG, drainage class, shrink-swell, flooding frequency, and building site limitations from SSURGO. SoilWeb alone only gives texture class. SDA provides the full component-level data via SQL.
**Files changed:**
- `netlify/functions/analyze.js` — rewrote getSoilData with SDA SQL query
- `src/frontend/src/components/RiskCards.jsx` — soil card shows HSG + limitations count
- `src/frontend/src/api.js` — expanded demo soil data

---

## 2026-03-21 — Demo Mode + New Netlify Deployment
**What was built:** DEMO_MODE flag in api.js returns hardcoded Phoenix-lot data for offline demos. Vite proxy pointed to new Netlify site (fastidious-clafoutis-995943.netlify.app) after original site hit bandwidth limits.
**Why this approach:** Original Netlify account paused for bandwidth. Created new account for fresh limits. Demo mode ensures the app works without any backend for judge demos.
**Files changed:**
- `src/frontend/src/api.js` — DEMO_MODE with full mock data
- `src/frontend/vite.config.js` — proxy target to new Netlify URL

---

## 2026-03-21 — WISC Slash Commands Updated for SiteSense
**What was built:** All 5 slash commands (/prime, /plan-feature, /execute, /handoff, /commit) rewritten with SiteSense-specific context — file paths, layer references, demo addresses, deploy URLs.
**Why this approach:** Generic WISC templates didn't reference the actual architecture. SiteSense-specific commands speed up future sessions.
**Files changed:**
- `.claude/commands/prime.md`, `plan-feature.md`, `execute.md`, `handoff.md`, `commit.md`

---

## 2026-03-21 — Comprehensive Soil Engineering + UI Enhancements
**What was built:** Full geotechnical analysis with IBC 2021 Table 1806.2 presumptive bearing, USCS classification, Atterberg limits (LL/PI) from SSURGO, ASTM D4829 expansive risk, AASHTO frost susceptibility, collapsible/liquefiable/organic soil detection. Foundation recommendation ladder updated with DEEP_PILE (IBC §1803.5.5) for organic, liquefaction (IBC §1803.5.11), and collapsible (IBC §1803.5.9) soils. Soil zones rewritten with SDA_Get_Mupolygonkey documented function + multi-point fallback. RiskCards soil card enhanced with USCS, bearing, PI, hazard flags, and building limitations list. SSURGO WMS opacity raised. Soil zone outlines changed to light brown (#c8a86e) 3px solid for visibility.
**Why this approach:** Civil engineering credibility requires proper geotechnical hazard screening per IBC/ACI codes, not just texture class. SDA spatial queries were unreliable — switched to documented SDA_Get_Mupolygonkey function. Added guaranteed fallback (point query + rectangular zones) so soil zones always render.
**Files changed:**
- `netlify/functions/analyze.js` — soil engineering tables, enhanced SDA query, foundation logic, soil zones rewrite
- `src/frontend/src/components/ElevationChart.jsx` — SSURGO WMS opacity 0.35, soil outlines light brown 3px
- `src/frontend/src/components/RiskCards.jsx` — soil card with USCS, bearing, PI, hazard warnings, limitations
- `CLAUDE.md` — added IBC 1806.2, ASTM D4829, AASHTO frost, collapsible soils, sulfate attack
- `TODO.md` — handoff document for switching computers
**Next:** Set ANTHROPIC_API_KEY in Netlify, end-to-end test with 3 demo addresses, verify soil zones render

---

## 2026-03-21 — House Concept Estimator + Engineering Q&A (Two New Features)
**What was built:** Two new SiteSense workflows as tab-based UI. (1) House Concept Estimator: user inputs brief (beds/baths/stories/quality/location) → generates 3 candidate layouts (Compact/Standard/Spacious) with room programs, structural screen, ROM cost range ($low–$high), 10-year projection at 4.5% ENR inflation, and Claude AI summary. (2) Engineering Q&A: Claude-powered engineering assistant with curated system prompt containing IBC 2021/ASCE 7-22/ACI 350/360R reference tables, source attribution badges (PUBLIC/LICENSED/CALCULATED), and mandatory professional disclaimers. Both features auto-fetch GIS data (soil via SoilWeb, seismic via USGS, flood via FEMA) when given a location — fully standalone, no need to run Site Analysis first. Address shared across all 3 tabs.
**Why this approach:** Separate Netlify Functions (JS) per feature keeps existing site analysis stable. No vector DB needed — Claude's system prompt with curated code tables achieves RAG-like behavior at zero infrastructure cost. Auto-GIS fetch makes each tab independently demo-able for judges. Rule-based layout generation (not AI) keeps concept estimator fast and deterministic; Claude only used for plain-English summary.
**Files changed:**
- `netlify/functions/house_estimate.js` — new: layout presets, room programs, cost engine, structural screen, GIS auto-fetch, Claude summary
- `netlify/functions/engineering_assist.js` — new: curated system prompt, source attribution, GIS auto-fetch, geocoding
- `src/frontend/src/components/HouseConceptPanel.jsx` — new: form + 3 layout cards + cost bars + AI summary
- `src/frontend/src/components/EngineeringAssistant.jsx` — new: chat Q&A + source badges + suggested questions
- `src/frontend/src/components/ProfessionalDisclaimer.jsx` — new: shared disclaimer
- `src/frontend/src/App.jsx` — tab bar (Site Analysis | House Concept | Engineering Q&A), shared address state
- `src/frontend/src/api.js` — estimateHouseConcept() + askEngineering()
- `netlify.toml` — 2 new redirects + timeouts
**Next:** Set ANTHROPIC_API_KEY for AI summaries, test all 3 tabs end-to-end, UI polish, pitch deck prep

---

## 2026-03-21 — Price Forecast: Government-Data-Driven Cost Prediction
**What was built:** Multi-factor construction cost prediction model using 6 government data sources: Census CHARS benchmark base ($/SF by house type), BEA Regional Price Parities (metro/state localization), BLS PPI residential construction inputs (materials inflation), BLS ECI (labor cost escalation), FHFA House Price Index (market trend with mean-reversion damping), and Philadelphia Fed SPF (forward inflation prior). Returns current estimate + 1/2/5/10-year forecast ranges with widening uncertainty bands. Frontend shows visual timeline bars, detailed projection table, indicator breakdown with contribution labels, and full source attribution. 4th tab added: Site Analysis | House Concept | Price Forecast | Engineering Q&A.
**Why this approach:** The spec called for layered forecasting (not a single inflation number). Hardcoded recent indicator values for hackathon speed — the MODEL LOGIC is what matters, not live API fetching. Blended rate (60% materials PPI + 40% labor ECI) is more accurate than flat ENR CCI. Mean-reversion damping on FHFA HPI prevents unrealistic long-term extrapolation. Bands widen with sqrt(year) to reflect growing uncertainty. All sources are official government data (BEA, BLS, Census, FHFA, Fed) — no proprietary data needed.
**Files changed:**
- `netlify/functions/price_predict.js` — new: prediction model with hardcoded indicator stack
- `src/frontend/src/components/PriceForecastPanel.jsx` — new: form + timeline + table + indicators + sources
- `src/frontend/src/App.jsx` — 4th tab (Price Forecast), shared address
- `src/frontend/src/api.js` — predictPrice()
- `netlify.toml` — redirect + timeout for price_predict
**Next:** End-to-end test all 4 tabs, set ANTHROPIC_API_KEY, pitch deck

---

## 2026-03-21 — Session 2: National Coverage + Floor Plan Engine + PDF Redesign

**What was built (batched session):**

1. **US-wide coverage:** Replaced Arizona-only code in analyze.js with national data — 15 fire zones (was 4 AZ), 11 wind speed zones (was 3), 35 metro cost multipliers (was 4 AZ cities), expanded caliche detection to full arid Southwest, regional soil defaults for FL/CA/generic. Engineering Q&A prompt expanded to 7 US regions. Map defaults to continental US view.

2. **House Concept improvements:** Removed 3-card layout grid → single Standard layout only. Removed duplicate location inputs → shared from header. Always uses site analysis data when available. Pricing clearly labeled "Total Construction Cost (building + foundation)" vs Site Analysis "Site Preparation Costs".

3. **Floor plan engine rewrite:** Squarified treemap algorithm replacing strip-packing. Zone-based layout (Social front → Corridor → Private back). Architectural details: wall thickness, door gaps with swing arcs, front door with porch, north arrow compass, 10ft scale bar, color-coded by zone. 3D view with compass, scroll-to-zoom, drag-to-rotate.

4. **Price Forecast improvements:** US-wide cost factors (50 states + 40 metros via BEA RPP). Line chart replacing bar chart. Plain-English indicator explanations. Uses House Concept parameters (no duplicate inputs).

5. **PDF report complete redesign:** 4-page user-pain-first approach. Page 1: verdict banner + 4 callout cards + risk traffic-light. Page 2: plain-English constraints with "What to check next" callouts. Page 3: side-by-side cost comparison + build-now-vs-wait + numbered next-steps with WHO to contact. Page 4: 3-column appendix (Parameter/Value/What This Means) with 18 dynamic explanation functions.

6. **Infrastructure fixes:** Tab persistence (hidden CSS instead of unmount). Polygon redraw clears stale results. PDF Report button moved to header. Reverted unnecessary timeout changes (503 was Netlify credit exhaustion, not code).

**Why this approach:** Problem-statement spec defines SiteSense as solving a "late-surprise problem" — users commit before understanding risks. Every feature was evaluated against 4 user pains: buildability, hidden costs, what fits, and what to do next. PDF redesign follows consultancy report patterns (WSP, Arup, Stantec) per the pdf-report-user-first spec.

**Files changed:** analyze.js, house_estimate.js, engineering_assist.js, price_predict.js, App.jsx, MapView.jsx, FloorPlanView.jsx, HouseConceptPanel.jsx, PriceForecastPanel.jsx, CostTable.jsx, ReportGenerator.jsx, ReportButton.jsx, netlify.toml

**Next:** Set ANTHROPIC_API_KEY in new Netlify account, end-to-end test all 4 tabs + PDF, demo prep

---

## 2026-03-21 — AI Brain Architecture + Site-Responsive Design + PDF Redesign

**What was built:**

1. **AI Brain Architecture (Domain Brain pattern):** Replaced one-shot "write a summary" Claude call with structured reasoning pipeline. Identity layer (Parcel Strategist role), doctrine layer (IBC/ASCE/ACI code rules injected), signal synthesis (cross-reference 14 GIS layers for conflicts), scenario reasoning (build now vs wait), unknown detection (flags missing geotech, utilities, survey), user-adaptive output, professional handoff brief with WHO to contact. Returns structured JSON: verdict, tradeoffs, best_fit_concept, scenario_comparison, unknowns, next_steps, site_design. Rule-based fallback generates identical JSON structure without API key.

2. **Site-Responsive Design:** Climate-aware building recommendations from terrain + latitude + state. Pad selection (flattest zone from elevation grid), orientation (solar angle by climate zone: hot_arid/hot_humid/cold/temperate), window strategy per facade (minimize west in hot climates, maximize south in cold), room zoning (living on best daylight, services as thermal buffer), driveway access from slope analysis.

3. **PDF Report Complete Redesign:** 4-page user-pain-first report. Page 1: verdict banner + callout cards + risk traffic-light. Page 2: plain-English constraints with "What to check next" callouts. Page 3: side-by-side costs + build-now-vs-wait + next steps with WHO to contact. Page 4: 3-column appendix with dynamic "What This Means" explanations (18 helper functions). House Concept page: Standard-only with cost scope clarity. Price Forecast page: "Should You Build Now or Wait?" with plain-English indicator explanations.

4. **Frontend-PDF Alignment:** Price Forecast tab renamed "Build Now or Wait?" matching PDF. Table shows "When / Expected Cost / Extra You'd Pay". Amber conclusion box. Same language across app and PDF.

**Why this approach:** The meaningful-ai-report-output spec demands AI that synthesizes, reasons, compares, and detects unknowns — not just narrates metrics. Domain Brain Architecture provides the framework: identity + doctrine + memory + retrieval + tools + reasoning. For hackathon, implemented as structured prompt architecture within existing Netlify Functions. Site-responsive design uses rule-based heuristics (no simulation tools needed) following the site-responsive-house-design spec.

**Files changed:** analyze.js (brain prompt + site design + rule-based fallback), house_estimate.js (structured brain output), App.jsx (structured AI renderer + site design section), HouseConceptPanel.jsx (structured AI output), ReportGenerator.jsx (4-page redesign + forecast explanations), PriceForecastPanel.jsx (Build Now or Wait framing), FloorPlanView.jsx (font scaling + 3D compass)

**Next:** Test with new Netlify account, set ANTHROPIC_API_KEY to compare rule-based vs Claude output, demo prep

---

## 2026-03-22 — Evidence Pack Architecture + Data-Driven Site Design + Confidence Tracking

**What was built:**

1. **Evidence Pack Architecture (evidence-pack-ai-report-architecture spec):** Refactored the brain pipeline from flat `summary` → structured `evidence_pack`. The evidence pack is the brain's working memory, containing: `parcel` (address, area, centroid), `retrieval` (14 GIS layers each with source, query_mode, confidence level, notes), `computed` (slope stats, cut/fill, foundation reasoning, loads, runoff, costs, buildable area %), `doctrine` (codes applied, triggered rules, foundation ladder), `assumptions` (explicit fallback notes), `unknowns` (verification gaps), `provenance` (timestamp, engine, layer count), `confidence` (per-section: verified/partially_verified/heuristic/fallback). Claude receives the full evidence pack instead of a flattened summary. Rule-based fallback uses the same evidence pack. Response includes evidence_pack for frontend consumption.

2. **Data-Driven Site Design (site-responsive-house-design spec):** Replaced climate-only heuristics with actual terrain analysis from the elevation grid. Pad selection: divides parcel into 3×3 candidate zones, scores each on flatness, relief, cut/fill burden, flood penalty (-30), wetland penalty (-20), steep slope penalty (-25), drainage risk, soil hazards. Returns ranked candidates. Orientation scoring: evaluates 8 compass directions weighted by solar gain (climate-specific), west-heat penalty, terrain alignment. Returns top 4. Driveway: analyzes slope at each parcel edge, recommends flattest approach.

3. **Confidence Badges + Provenance:** Frontend shows per-layer confidence (green=verified, yellow=partially verified, blue=heuristic, red=fallback), provenance line (14 GIS layers, AI engine, timestamp), assumptions list, and overall confidence summary with color-coded banner.

4. **User Persona Selector:** Dropdown in header (Homeowner / Architect / Developer) for future persona-aware AI output.

5. **AI Report Enhancements:** Added `top_reasons` (top 2-3 driving factors), `confidence_summary` (overall + reason), `assumptions` in ai_report JSON. Both Claude and rule-based fallback produce these fields.

**Why this approach:** The evidence-pack spec identifies the core problem: "raw GIS and engineering outputs are reduced to a small analysis_summary — Claude mostly rewrites summary numbers into prose." The evidence pack gives Claude (or the fallback) full spatial detail, provenance, uncertainty, and tradeoff structure. Data-driven site design follows the site-responsive-house-design spec's Stage 1-4 (terrain preparation → constraint envelope → candidate placement → scoring).

**Files changed:** analyze.js (assembleEvidencePack, data-driven generateSiteDesign with 9-zone pad scoring + 8-direction orientation scoring, updated brain pipeline), App.jsx (confidence badges, provenance, assumptions, user persona selector, top_reasons in verdict)

**Next:** Test end-to-end, verify evidence_pack renders correctly, add persona-aware Claude prompt, PDF integration of evidence_pack data

---

## 2026-03-22 — Session 3: Brain Feedback Loops, Seismic Fix, Contour Fix, Q&A Speed, PDF Report

**What was built (batched session):**

1. **Seismic API Fix:** Old USGS endpoint (`/hazard/designmaps/us/json`) was dead (404). Updated to new ASCE 7-22 API (`/ws/designmaps/asce7-22.json`). LA now correctly returns SDC D (Ss=2.25, S1=0.72) instead of SDC A. Added regional seismic defaults for CA, Pacific NW, New Madrid, Intermountain West.

2. **Brain Feedback Loops (4 new):**
   - Foundation Advisor → upgrades baseline if-else foundation type via keyword matching + severity ranking. Max slope >25% triggers upgrade even when average slope is mild.
   - Cost Forecaster → compound premiums (+8-33%) feed back into actual `costs.total_now`, not just noted in reasons.
   - Fire Risk → Very High +12%, High +6% cost uplift applied to site prep estimate with construction impact details (materials, defensible space, insurance, code ref).
   - Runoff → NOAA Atlas 14 rainfall + HSG-adjusted C-values replace fixed defaults. HSG D adds +0.15, HSG A reduces -0.08.

3. **Weighted Verdict:** Strategist verdict now uses weighted scoring (foundation×3, stormwater×2, site×1, cost×1) + compound risk bonus, producing 4 levels: Good Candidate / Proceed with Caution / Moderate Risk / High Risk.

4. **Contour Fix:** SSURGO WMS raster now renders below contour GeoJSON lines (was on top, hiding them). Contour density targets 8-15 lines (was 5). 6x upsampling for coarse grids. Labels use `symbol-placement: line` with `text-allow-overlap: true` for short mountainous contour loops.

5. **PDF Report:** Added 2 new pages — AI Brain Analysis (verdict, expert findings table, tradeoffs, confidence) and Site Design (pad placement with scored alternatives, orientation with scores, window strategy, room zoning, driveway). Reverted from html2pdf.js to printable HTML (Ctrl+P) after blank PDF issues.

6. **Engineering Q&A:** Switched to Haiku (3x faster than Sonnet) to stay within Netlify 26s timeout. Slim context (15 fields instead of full analysis result). Fixed markdown code fence stripping and nested JSON parsing.

7. **Time Budget:** Global time budget (22s compute + 4s buffer) prevents Netlify 504 timeouts. Each Claude call checks remaining time, skips if <4s left. Per-call timeout races against budget.

8. **Cost Model:** Foundation/grading now priced off ~2,500 SF building footprint (was full lot buildable area). Cut/fill scaled down for large parcels. Prevents inflated $1.5M+ estimates for screening.

9. **Draw Tool:** Minimum rectangle size (~30m) prevents line-like parcels from zero-height clicks.

10. **New Repo:** Code pushed to https://github.com/Pleesudjai/sitesense3 with Netlify auto-deploy at https://musical-cuchufli-3cd9f8.netlify.app.

**Why this approach:** QA sweep of 20 US cities revealed: uniform verdicts (all "Proceed with Caution"), inflated costs, fake PDF, dead seismic API, Q&A timeouts. Each fix closes a feedback loop between the expert panel and user-facing outputs — the architecture was designed for this but the wiring was incomplete.

**Files changed:** analyze.js (seismic API, foundation feedback loop, cost feedback loop, fire uplift, runoff with NOAA+HSG, weighted verdict, time budget), engineering_assist.js (Haiku, slim prompt, JSON parsing), ElevationChart.jsx (contour layer order, density, labels, upsampling), ReportGenerator.jsx (2 new pages, fire/cost/runoff data in existing pages, reverted to printable HTML), ReportButton.jsx (simplified), App.jsx (Moderate Risk color, better error message), MapView.jsx (minimum rectangle size), EngineeringAssistant.jsx (slim context), vite.config.js (updated proxy URL), structural-ai-brain-architecture.md (AS-BUILT section)

**Next:** Project submitted to HackASU 2025. Future work: real PDF generation, persona-aware output, live NOAA Atlas 14 integration, RSMeans cost data.

---

## 2026-05-08 — Sync: Post-hackathon work + YC pivot prep

**What was committed:** Accumulated post-submission edits and pitch-prep artifacts that piled up across several local sessions and were never pushed.

- **Backend (`analyze.js` +337 lines, `engineering_assist.js` +78):** rules-first-then-Claude pattern, deeper expert reasoning, compound risk detection, brain architecture for Engineering Q&A with rule-based fallback when `ANTHROPIC_API_KEY` is missing.
- **Frontend (`App.jsx`, `ElevationChart.jsx`, `EngineeringAssistant.jsx`, `MapView.jsx`, `ReportButton.jsx`, `ReportGenerator.jsx` +200 lines):** UI tweaks paired with the backend brain pipeline changes; `ReportGenerator.jsx` gained substantial content; `vite.config.js` proxy URL updated.
- **Frontend deps (`package.json`, `package-lock.json`):** 1 new dep (kept in lockfile).
- **Specs (`specs/structural-ai-brain-architecture.md` +250 lines):** AS-BUILT details for the rules-first brain.
- **Skills (`skills/` — 16 new SKILL.md files):** SiteSense expert roster — parcel-strategist, foundation-advisor, stormwater-reviewer, zoning-entitlement-advisor, utility-feasibility-advisor, structural-screening-advisor, climate-responsive-design-advisor, environmental-constraints-reviewer, constructability-reviewer, cost-forecaster, data-quality-auditor, engineer-handoff-coordinator, house-fit-advisor, owner-decision-coach, site-design-advisor, sitesense-expert-router. Sub-agents the brain orchestrates.
- **Scripts (`scripts/`):** `create-claude-role-pptx.js` and `generate-pdfs.mjs` for pitch-deck generation; root-level `package.json` adds `playwright` + `pptxgenjs` for these.
- **Docs:** `docs/agent-sdk-architecture.md` (YC pivot architecture + roadmap), `docs/hack-pitch-ai-note.md`, `docs/linkedin-posts.md`, `docs/video-prompts.md`, `docs/video-script.md`, `docs/winning-checklist.md`, `todofromX.md` (Jacob's prioritization).
- **Updated docs:** `docs/handoff.md`, `docs/concept-notes.md`, `docs/project-brief.md`.
- **`.gitignore`:** added `*.mp4`, `*.pptx`, `Screenshot*.png`, `dry-run-*.json`, and scratch-note filenames so the 282 MB demo videos and PPTX decks stay in Dropbox.

**Why this approach:** Single sync commit because the work spans many small post-hackathon polish passes that interlock (brain pipeline, sub-agent skills, pitch artifacts) and shipping it as one labeled "sync" commit is more honest than fabricating fine-grained history. Binaries excluded — the repo is for code+docs; videos/decks live in Dropbox.

**Files changed:** see commit diff. Net: +1,454 / -267 in 16 modified files, plus 16 new skills, 6 new docs, 2 new scripts, root `package.json`/`package-lock.json`.

**Next:** Begin Agent SDK rewrite per `docs/agent-sdk-architecture.md`: pick MVP county (recommend Maricopa), pick report template (recommend 1-page), `npm install @anthropic-ai/claude-agent-sdk`, build `parcel_lookup` MCP tool first.

---

## 2026-05-08 — Agent SDK MVP — parcel_lookup tool + agent loop verified

**What was built:** TypeScript scaffold under `src/agent/` running `@anthropic-ai/claude-agent-sdk` with one in-process MCP tool (`parcel_lookup`) targeting Maricopa County. Verified end-to-end against real APN `13209099` (Tempe, 1681 sf) — agent called the tool, reasoned over the parcel record, and produced a structured feasibility report with citations.

**MVP decisions locked:**
- County: Maricopa only.
- Report: 1-page PDF schema (parcel summary, zoning envelope, constraints, buildable area, red flags, recommendation, citations).
- Code location: new top-level `src/agent/` (TypeScript). Hackathon Netlify Functions left in place as reference.

**Why this approach:** The Agent SDK gives us the tool-use audit trail and reasoning loop for free. In-process MCP server (`createSdkMcpServer` + `tool`) is simpler than spawning subprocess MCP servers and matches the in-band lifecycle the SiteSense backend wants.

**Maricopa endpoint verified:**
- `https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query`
- Real schema: `APN`, `APN_DASH`, `OWNER_NAME`, `LAND_SIZE` (sf), `CITY_ZONING` (often "CONTACT LOCAL JURISDICTION"), `PHYSICAL_ADDRESS`, `LATITUDE`/`LONGITUDE`, `PUC` (Property Use Code).
- Tool queries on both `APN=` and `APN_DASH=` so dashed and flat input both work.
- The frequent `CITY_ZONING='CONTACT LOCAL JURISDICTION'` confirms a separate `zoning_lookup` tool against the city's GIS is needed — consistent with the architecture-doc moat.

**Agent reasoning quality on first run:**
- Caught that PUC `8530` may indicate a non-buildable parcel type (common-element / remnant / ROW fragment).
- Hedged buildable-area estimate as "Insufficient data for reliable estimate" rather than fabricating.
- Returned NOT-RECOMMENDED with multi-factor reasoning + 5 next-steps including the actual City of Tempe Planning phone number.
- Citations included the literal REST URL with timestamp.

**Files created:**
- `src/agent/package.json`, `tsconfig.json`, `.env.example`, `.gitignore`-respected `.env`
- `src/agent/src/agent.ts` — `runFeasibilityAgent(apn)` entry
- `src/agent/src/prompt.ts` — system prompt
- `src/agent/src/types.ts` — `ParcelRecord`, `FeasibilityReport`, `Citation`
- `src/agent/src/mcp/server.ts` — in-process MCP server registration
- `src/agent/src/mcp/parcel_lookup.ts` — Maricopa parcel tool
- `src/agent/test/parcel_lookup.test.ts` — standalone tool test (no API key)
- `src/agent/test/e2e.test.ts` — full agent loop test
- `src/agent/README.md` — setup + run instructions

**Open follow-ups:**
- Reconcile `types.ts` with the richer schema Claude actually produced (it added `report_meta`, structured citations with `id`/`fields_used`/`fetched_at`). Either tighten the prompt to enforce the leaner schema, or update the type to match. Probably update the type.
- `verdict` value mismatch — Claude returned `"NOT-RECOMMENDED"` (hyphen), type expects `not_recommended` (underscore). Pick one and pin in prompt.

**Next:** Build tool 2 — `flood_zone` (FEMA NFHL by centroid). Then `topo_slope` (USGS 3DEP). Three tools is the threshold where cross-source reasoning becomes meaningful.

---

## 2026-05-08 — Agent SDK Tool 2 — flood_zone (FEMA NFHL) + cross-tool reasoning verified

**What was built:** Second MCP tool in `src/agent/`. Wraps FEMA's National Flood Hazard Layer (NFHL) layer 28 ("Flood Hazard Zones"). Input is lat/lon (the centroid returned by `parcel_lookup`). Output is FEMA flood zone designation, SFHA flag, BFE, depth (for AO zones), and a plain-English risk level.

**Endpoint correction (FEMA migrated):** The hackathon `netlify/functions/analyze.js` calls `https://hazards.fema.gov/gis/nfhl/...` — that path now returns 404. As of 2026-05, FEMA serves NFHL only under `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query`. The agent tool uses the new path. **The production hackathon site's flood lookup is silently broken right now** — `analyze.js` `getFloodZone()` always returns `defaultFlood()` (Zone X, fallback). Worth a follow-up fix in the hackathon code to keep the live demo honest.

**Field correction:** Layer 28's BFE field is `STATIC_BFE`, not `BFE`. Hackathon code requested `BFE_DFE` which also doesn't exist on the new layer (only on a different layer). Agent uses `STATIC_BFE` and treats `-9999` (FEMA's "no BFE" sentinel) as null.

**Cross-tool reasoning verified (run on APN 13209099, Tempe):**
- Tool calls in order: `parcel_lookup({"apn":"13209099"})` → `flood_zone({"lat":33.44574, "lon":-111.91728})`
- Surprising finding: Tempe parcel sits in **Zone X (shaded)** (between 100-yr and 500-yr floodplains, MODERATE risk) — not minimal as the agent had guessed in the single-tool run.
- Agent reasoning across both tools:
  - "Voluntary flood insurance is advisable" — derived from MODERATE risk + not-SFHA
  - "Local Tempe floodplain rules may impose additional grading or elevation requirements" — inferred local-vs-federal split from X (shaded)
  - "Flood zone X (shaded) does not impose a mandatory finished-floor elevation, but local freeboard ordinances may apply" — engineering-grade nuance
- Verdict tightened from NOT-RECOMMENDED (implicit confidence) to NOT-RECOMMENDED with confidence=HIGH.
- Citations now list both source URLs with timestamps.

**Files added/changed:**
- `src/agent/src/mcp/flood_zone.ts` — new tool
- `src/agent/src/mcp/server.ts` — registers flood_zone, updated parcel_lookup description to point at flood_zone
- `src/agent/src/prompt.ts` — added tool sequence guidance + 3 cross-tool reasoning examples
- `src/agent/test/flood_zone.test.ts` — standalone tool test
- `src/agent/package.json` — `test:flood` script

**Next tool:** `topo_slope` (USGS 3DEP DEM). Will use the parcel boundary GeoJSON (not just centroid) so we can compute slope distribution across the lot, not just at the centerpoint.

**Open follow-up:** Patch `netlify/functions/analyze.js` to use the new FEMA URL + STATIC_BFE field so the live hackathon site stops silently falling back to Zone X.

---

## 2026-05-08 — Agent SDK Tool 3 — topo_slope (USGS 3DEP) + 3-tool synthesis verified

**What was built:** Third MCP tool. Wraps USGS 3DEP DEM via the Elevation Point Query Service (EPQS). Input is a bbox (min/max lat and lon) plus optional grid resolution. Samples elevation at grid_size² points in parallel, computes slope by central difference at each cell, returns mean/max/min/relief elevation in feet, mean and max slope %, and the fraction of cells exceeding 15% (Hillside Overlay threshold) and 25%.

**Tool design choice:** bbox input (not polygon coordinates) keeps the JSON tool input small and the agent uses the parcel boundary ring's min/max to derive it. Default grid_size=5 (25 EPQS calls) is fine for sub-1-acre parcels; agent is instructed to use grid_size=10 for larger lots. Hillside-overlay heuristic: max slope > 15% OR mean > 10% triggers the flag (per architecture-doc threshold; common in AZ municipal codes).

**EPQS behavior:** returns sentinel values like -1000000 for "no data" (over water, outside CONUS coverage). Tool gates on `value > -900`. Median-fill for missing samples; throws if more than half the samples are missing.

**Spot-check validation:**
- Tempe APN 13209099 (1681 sf, ~14 ft cells): 1.0% mean slope, 1.7% max, 0.8 ft relief, hillside flag=false. Matches the flat Salt River Valley.
- Camelback Mountain south face (2.5 acres, 83 ft cells): 59% mean slope, 87% max, 100% of cells > 15%, 330 ft relief, hillside flag=true. Real mountain.
- Flagstaff 100-acre bbox at grid 5 (533 ft cells): mean slope only 3.3% — cell width too coarse, slope averaged out. Fix: agent should use grid_size=10 for larger lots; documented in the prompt.

**3-tool agent loop verified (APN 13209099):**
- Tool sequence chosen by the agent: parcel_lookup → flood_zone → topo_slope.
- Agent extracted the topo_slope bbox from the boundary ring unprompted (the system prompt described how, and Claude executed it).
- Three citations, all with auditable URLs.
- Cross-source synthesis: agent now explicitly distinguishes physical vs legal risk — "physical constraints (slope, flood zone) are manageable, the legal and regulatory uncertainty is too high to recommend proceeding." That synthesis is the moat — a script cannot weigh PUC 8530 + zoning unknown + lot < 2,000 sf against flat-site-no-flood and produce that verdict.

**Files added/changed:**
- `src/agent/src/mcp/topo_slope.ts` — new tool (170 lines, parallel EPQS, slope by central difference, hillside heuristic)
- `src/agent/src/mcp/server.ts` — registers topo_slope, updated parcel_lookup description
- `src/agent/src/prompt.ts` — adds topo_slope sequencing instructions
- `src/agent/test/topo_slope.test.ts` — standalone tool test (defaults to Tempe APN bbox, accepts overrides)
- `src/agent/package.json` — `test:slope` script

**Next tool:** `zoning_lookup` (Tempe city zoning REST). The Maricopa Assessor returns "CONTACT LOCAL JURISDICTION" for zoning, so we need a city-side tool. This is the moat tool per the architecture doc — every city is different. Start with Tempe, then templatize. Could also do `utility_avail` (SRP/APS/Tempe water) if zoning blocks on schema discovery.

---

## 2026-05-08 — Agent SDK Tool 4 — zoning_lookup (Tempe) + real buildable envelope

**What was built:** Fourth MCP tool. Combines a spatial query against Tempe's public zoning_districts FeatureServer (hosted on AGOL, not the access-restricted gis.tempe.gov) with an in-code Tempe ZDC dimensional-standards table for residential and mixed-use districts. Returns the GIS-confirmed zoning code, district name, category, min lot size, front/side/rear setbacks, max height, max density, and a confidence rating + verification note for every value.

**Endpoint:** `https://services.arcgis.com/lQySeXwbBg53XWDi/arcgis/rest/services/zoning_districts/FeatureServer/1/query`
- Owner: TempeData (official City of Tempe ArcGIS account on AGOL).
- Field: `ZoningCode` (coded-value domain with all Tempe zones: R1-4 through R1-15, R-2 through R-5, MU-2/3/4, CC, CSS, RCC, etc.).
- Note: gis.tempe.gov returns 403 from non-browser clients (likely WAF or auth). The AGOL mirror is the reliable public path.

**Tempe ZDC dimensional table:** Hard-coded in the tool for the most common residential zones (R1-4 through R1-15, R1-PAD, R-2 through R-5) plus MU-2/3/4. Each entry carries a `confidence` rating and a `note` field telling the agent to flag values as approximate. PAD and form-based-code MU districts return null for setbacks (because standards are set per-PAD or by the form-based code, which the table cannot encode generically) — the agent is instructed to direct the user to Tempe Planning in those cases.

**4-tool agent loop verified (APN 13209099, Tempe condo lot):**
- Tool sequence: parcel_lookup → flood_zone + topo_slope + zoning_lookup (last 3 in parallel).
- Agent output a real buildable envelope calc:
  - Lot extracted from boundary ring: ~65 ft × ~38 ft (irregular L-shape).
  - R1-4 setbacks: front 15 ft, side 5 ft, rear 20 ft.
  - Footprint = (65 − 2×5) × (38 − 15 − 20) = 55 × 3 = ~165 sf "effectively unbuildable; ~3 ft of unencumbered depth between front and rear setbacks."
- Hard code violation surfaced: 1,681 sf actual vs 4,000 sf R1-4 minimum, 2,319 sf deficit (58% below). Verdict went from hedged "probably can't build" to definitive "below minimum, requires variance — outcome uncertain."
- Compound red flags: lot-size-deficit (CRITICAL) + setbacks-consume-all-depth (CRITICAL) + PUC-8530-may-be-common-element (HIGH) + Zone X shaded (MODERATE) + slope unavailable (LOW) + no easement data (LOW). Stratified severity, not the flat "everything is HIGH" of single-tool runs.
- Four citations, all with auditable URLs.

**Cleanup also in this commit:**
1. Robust JSON extractor in `agent.ts` — Claude's responses now include reasoning/explanation BEFORE the JSON code block (which is fine, even desirable), but the previous parser only handled the case where the entire response was a JSON code block. New extractor: try fenced ```json ... ``` block first, fall back to first balanced `{...}` object using a depth/string-aware scanner.
2. Graceful degradation in `topo_slope.ts` — previously threw if more than half the EPQS samples were missing. Problem: for very small parcels (< ~100 ft on a side) the grid is sub-DEM-resolution and EPQS legitimately returns null for most points. New behavior: only error if zero samples are valid; otherwise fill with median and let `missing_samples` count surface the data quality. Added `degradedRecord()` helper for the no-data case.

**Files added/changed:**
- `src/agent/src/mcp/zoning_lookup.ts` — new tool
- `src/agent/src/mcp/server.ts` — registers zoning_lookup
- `src/agent/src/prompt.ts` — adds zoning_lookup to the parallel call set + buildable-envelope formula
- `src/agent/src/agent.ts` — robust JSON extraction
- `src/agent/src/mcp/topo_slope.ts` — graceful degradation
- `src/agent/test/zoning_lookup.test.ts` — standalone test
- `src/agent/package.json` — `test:zoning` script

**Open follow-ups:**
- Tempe ZDC dimensional table is hand-encoded and confidence-rated medium. Next polish: scrape current ZDC tables programmatically and bump confidence to high.
- `types.ts` `FeasibilityReport` still doesn't match the schema Claude is producing. Defer until tools 5-7 are in.
- Patch hackathon `analyze.js` FEMA URL (still pending).

**Next tool:** `utility_avail` (SRP electric, Tempe water/sewer service area lookups). Or pivot to `report_builder` (use the existing `docx` skill to actually generate the 1-page PDF) so the MVP can produce a real deliverable. Recommend report_builder first — it lets us demo a real artifact.

---

## 2026-05-08 — Agent SDK Tool 8 (out of order) — report_builder + MVP DELIVERABLE COMPLETE

**What was built:** The deliverable. Tool 8 from the architecture-doc list, built before utility/title/comps because it's what the user actually receives. Renders structured input → styled 1-page printable HTML on disk. Uses `marked` for Markdown body sections and writes to `src/agent/output/sitesense-{apn}-{ts}.html`.

**Design choice — HTML, not docx:**
- The architecture doc said "use the docx skill" but the OS-level Claude `docx` skill is invoked via the Skill tool, not directly callable from inside a TypeScript Agent SDK tool.
- HTML is the simplest reliable path: Letter-size print CSS, 0.6" margins, color-coded verdict banner, monospace inline code, citations in numbered footer, locked disclaimer. Cmd-P → PDF.
- Playwright is already in root deps; auto-PDF can be added in v0.2 with `chromium.launch(); page.setContent(html); page.pdf()`. Deferred to keep the MVP friction-free (no browser binaries needed).

**Tool input schema:**
- `apn`, `address`, `verdict` (enum: buildable / proceed_with_caution / not_recommended), `verdict_one_liner`
- `sections`: array of `{heading, body_md}` — agent writes the Markdown directly
- `citations`: array of `{claim, source, url}`
- All required, schema-enforced via zod. Tool prints to disk in print-ready CSS and returns `{html_path, size_bytes, apn, generated_at}`.

**5-tool e2e verified (APN 13209099):**
- Agent called all five tools in correct order: parcel_lookup → flood_zone → topo_slope → zoning_lookup → report_builder.
- 7.7 KB HTML written to `output/sitesense-13209099-{ts}.html`.
- Six sections produced: Parcel Summary, Zoning Envelope, Constraints, Buildable Area Estimate, Red Flags, Recommendation.
- Four numbered citations with auditable URLs.
- New cross-tool insight surfaced this run: agent computed setback depth math = (29 ft lot depth) − (15 ft front) − (20 ft rear) = **−6 ft**. A negative buildable depth is a geometric impossibility distinct from the lot-size violation. That's another instance of the agent finding a failure mode the input data doesn't directly state.

**Files added/changed:**
- `src/agent/src/mcp/report_builder.ts` — new tool (~200 lines: schema, zod validation, marked-rendered Markdown, embedded print CSS, color-coded verdict banner, citation footer)
- `src/agent/src/mcp/server.ts` — registers report_builder
- `src/agent/src/prompt.ts` — instructs agent to call report_builder as final step
- `src/agent/test/report_builder.test.ts` — standalone test fed with synthetic input modeled on real 4-tool agent output
- `src/agent/package.json` — `test:report` script + `marked` dep
- `.gitignore` — excludes `src/agent/output/` so generated reports don't pollute the repo

**MVP status — what's now end-to-end:**
- Input: APN string
- Agent: 5-tool autonomous loop with cross-source synthesis
- Output: structured JSON FeasibilityReport + styled 1-page HTML report ready to print to PDF
- Citations: every claim backed by a tool URL, timestamped
- Hedging: setbacks marked medium-confidence, slope marked degraded when sub-resolution, common-element flags surfaced

This is the YC-pitch artifact. From "draw a pin, get a report" to "type an APN, get a printable feasibility analysis with citations."

**Next:** The remaining architecture-doc tools (utility_avail, title_pull, comps_cost) sharpen the report but the MVP shape is set. Could pivot to: (a) packaging the agent behind an HTTP endpoint for the existing React frontend; (b) testing on a real R1-6 / R1-8 Tempe SFR to see a 'buildable' verdict instead of NOT-RECOMMENDED; (c) adding playwright PDF auto-render so the deliverable is .pdf instead of .html.

---

## 2026-05-08 — zoning_lookup expansion: 5-city Maricopa coverage

**What was built:** Refactored `zoning_lookup` from a Tempe-only tool into a city dispatcher covering five Maricopa jurisdictions: **Tempe, Phoenix, Mesa, Scottsdale, Gilbert**. Each city is a separate module with its own ArcGIS REST endpoint, field mapping, and dimensional-standards table. The dispatcher accepts an optional `city` hint (passed by the agent from parcel_lookup's PHYSICAL_CITY); if the hint is absent or wrong, all 5 endpoints are queried in parallel via Promise.allSettled and the first match wins.

**Endpoints (all public, no auth):**
- Tempe: `services.arcgis.com/lQySeXwbBg53XWDi/.../zoning_districts/FeatureServer/1` (TempeData, AGOL)
- Phoenix: `services6.arcgis.com/u2Q4oAfciDZpDAD8/.../Zoning_PhoenixAZ/FeatureServer/0` (community-curated mirror; official maps.phoenix.gov returns 404 from non-browser)
- Mesa: `services2.arcgis.com/1gVyYKfYgW5Nxb1V/.../Zoning/FeatureServer/2` (ITDGIS = Mesa IT Department)
- Scottsdale: `maps.scottsdaleaz.gov/arcgis/rest/services/OpenData/MapServer/24` (official)
- Gilbert: `maps.gilbertaz.gov/arcgis/rest/services/OD/Growth_Development_Maps_1/MapServer/8` (Town of Gilbert)

**Dimensional tables encoded (best-effort, medium-low confidence with explicit "verify with planning department" notes):**
- Tempe: R1-4/5/6/7/8/10/15, R1-PAD, R-2/3/3R/4/5, MU-2/3/4 (16 codes)
- Phoenix: R1-6/8/10/14/18/35, R-2/3/4/5, C-1/2/3 (13 codes)
- Mesa: AG, RS-43/35/15/9/7/6, RM-2/3/4, OC, LC, GC, DR-1/2 (14 codes)
- Scottsdale: R1-7/10/18/35/43/130, R-2/3/4, C-2/3 (11 codes)
- Gilbert: AG, SF-43/15/10/8.5/7/6/5, MF-2/3, GO, NS, RC (13 codes)
- Codes outside the table (overlay districts, downtown form-based codes, etc.) return jurisdiction + code + a "consult ordinance" note with low confidence — the agent hedges appropriately.

**Coverage gap acknowledged in code:** Chandler, Goodyear, Avondale, Surprise, Peoria, and Maricopa County unincorporated are NOT yet covered. When the dispatcher exhausts all 5 cities without a match it returns `jurisdiction="Outside covered jurisdictions"` with `cities_tried` so the agent can tell the user explicitly. Chandler in particular has its zoning data in a different shape (per-parcel ordinance overlay rather than continuous polygon coverage) that needs a different module pattern; deferred.

**Verified spatial dispatch on 5 real points:**
- (33.44574, -111.91728) Tempe Dorsey Ln → R1-4 (medium confidence, Single-Family 4,000 sf)
- (33.4720, -112.0935) Phoenix Encanto → R1-6 (medium, Single-Family 6,000 sf)
- (33.3964, -111.7182) East Mesa → RS-6 (medium, Single-Residence 6,000 sf)
- (33.4942, -111.9261) Scottsdale Old Town → D/RS-1 DO (low — downtown overlay code, not in table; agent told to consult ordinance)
- (33.3528, -111.7890) Gilbert Heritage Village → HVC (low — Heritage Village Center, special district)

The graceful "low confidence + consult ordinance" path is itself a feature: the tool refuses to fabricate setback values for codes it doesn't know.

**File structure:**
```
src/agent/src/mcp/
  zoning_lookup.ts          ← dispatcher (small)
  zoning/
    types.ts                ← ZoningResult, CityModule
    helpers.ts              ← queryArcGisPoint, asString, buildResult
    tempe.ts
    phoenix.ts
    mesa.ts
    scottsdale.ts
    gilbert.ts
```

The pattern is set: adding Chandler / Goodyear / Avondale / etc. is now ~80 lines of dimensional table per city. The unglamorous half of the moat is the slog of these tables; the dispatcher pattern makes the slog mechanical.

**Next next:** Chandler module (different schema), Maricopa County unincorporated, then utility_avail / title_pull / comps_cost, then the HTTP/frontend layer.

---

## 2026-05-11 — zoning_lookup: Chandler + Maricopa County unincorporated → 7 jurisdictions

**What was built:** Closed the Maricopa-wide zoning coverage gap. Two new modules in `src/agent/src/mcp/zoning/`:

1. **`maricopa_county.ts`** — Maricopa County unincorporated, via PND/PlanNet layer 11 (`gis.maricopa.gov/arcgis/rest/services/PND/PlanNet/MapServer/11`). Field `ZONE`; `JURIS='COUNTY'` everywhere (the layer is unincorporated-only — 10,147 features). Dimensional table covers the actual code system seen in the data (probed via outStatistics groupBy on `ZONE`): RU-43, RU-70, RU-190 (rural use, increasing lot size), R1-6 through R1-35, R-2 through R-5, C-1/2/3, C-O, C-S, IND-1/2/3, AD-1/2/3 (airport districts). 23 codes encoded with medium-low confidence.

2. **`chandler.ts`** — Chandler is a special case. The city exposes only a sparse historical-amendment layer (`Chandler_Ordinances_Public_View` — 241 features, old code system) plus a `Chandler_CityLimits` layer that has only 1 feature with a tiny extent (effectively broken). There is no public continuous current-zoning REST. The module is now hint-only: when the agent passes `city='CHANDLER'` (from parcel_lookup PHYSICAL_CITY), the dispatcher returns a stub record with `jurisdiction='Chandler'`, `confidence='unknown'`, and an explicit note pointing the user to chandleraz.gov/zoning + (480) 782-3000. In the parallel scan (no city hint) the Chandler module returns null so it doesn't false-match other jurisdictions.

**Dispatcher upgrade:**
- `CITY_INDEX` extended with `CHANDLER`.
- Hint path now special-cases `CHANDLER` to return the stub directly with a fresh timestamp (no boundary check, no false-negatives from the broken city-limits layer).
- Parallel scan order: city modules first (more authoritative for their territory), then Chandler (no-op now), then Maricopa County unincorporated last as the rural fallback.
- The "Outside covered jurisdictions" final fallback now lists 7 jurisdictions tried and points the user to the remaining Maricopa cities not yet covered (Goodyear, Avondale, Surprise, Peoria, Glendale, Buckeye, Apache Junction).

**Verified dispatch (7 jurisdictions in the system, 6 with real data):**
- Tempe APN 13209099 → R1-4 (medium)
- Phoenix Encanto → R1-6 (medium)
- East Mesa → RS-6 (medium)
- Scottsdale Old Town → D/RS-1 DO (low — overlay code, graceful degradation)
- Gilbert Heritage Village → HVC (low — heritage district)
- Chandler (with hint) → stub with "consult chandleraz.gov/zoning" note (unknown confidence)
- New River unincorporated (33.85, -112.13) → R1-7 (medium)

**Where Maricopa-MVP zoning stands now:**
- ✓ Tempe, Phoenix, Mesa, Scottsdale, Gilbert — full dimensional tables
- ⚠ Chandler — boundary-detect only (data source gap, not code gap)
- ✓ Maricopa County unincorporated — full dimensional table
- ✗ Goodyear, Avondale, Surprise, Peoria, Glendale, Buckeye, Apache Junction — not in agent, returns "Outside covered" with cities_tried

That's 7 of ~14 Maricopa jurisdictions; covers the bulk of the population and the dispatcher pattern makes each remaining city ~80 lines of dimensional table.

**Open follow-ups for next session:**
- Chandler data source — would need to email Chandler IT or scrape the Chandler zoning code PDF. Defer.
- Add remaining cities (Goodyear, Avondale, Surprise, Peoria, Glendale) — mechanical.
- Push 8+ commits to GitHub.
- Patch hackathon FEMA URL.
- Wire agent to HTTP endpoint.

---

## 2026-05-11 — zoning_lookup: Glendale (real data) + 4 west-valley hint-only stubs → 12 jurisdictions

**What was built:** Closed most of the remaining Maricopa-wide coverage gap. One new module with real data + 4 hint-only stubs sharing a reusable factory.

**Glendale (real data):** Official GisAdmin_COG service on AGOL. Endpoint: `services1.arcgis.com/9fVTQQSiODPjLUTa/.../Glendale_Zoning/FeatureServer/0`. Field: `BASE_ZONE` (the canonical code), with `ZONING` (descriptive) and `OVERLAY` (district-specific overlay) as secondary fields. 23 dimensional entries encoded covering A-1 / RR-45 / SR-12/17/30 / R1-4/6/7/8/10 / R-2/3/4/5 / R-O / C-1/2/3 / C-O / BP / M-1/2 / PAD / PR. Overlay value surfaced in the note when present.

**Hint-only stubs (Chandler pattern, factored out):**
- New `zoning/stub.ts` — `buildStubRecord(cityName, planningUrl, planningPhone, zoningChapter)` + `buildStubModule(cityName)` factory. Eliminates per-city boilerplate.
- New `zoning/stubs_west_valley.ts` — Goodyear, Avondale, Surprise, Peoria stubs (~5 lines each calling the factory) with their actual planning department URLs and phone numbers.
- `zoning/chandler.ts` — refactored to use the same factory (15 lines, was 35).

Why stubs for these four:
- **Goodyear**: `maps.goodyearaz.gov` returns 404; no AGOL zoning service found.
- **Avondale**: `gis.avondaleaz.gov` returns 522 (origin unreachable); no AGOL service.
- **Surprise**: DNS resolution failure; no AGOL service.
- **Peoria**: has `gis.peoriaaz.gov/.../Peoria_Zoning/MapServer`, but its 19 layers cover specific area plans and Subzones (PAD/PCD/PUD overlay categories only) — no base-zoning REST.

Each stub returns the same `ZoningResult` shape with confidence='unknown' and a note pointing the user to that city's planning portal + phone. Honest disclosure, not fabrication.

**Dispatcher upgrade:**
- `CITY_INDEX` now lists 11 city keys.
- `STUB_BY_HINT` map dispatches 5 cities (Chandler + 4 west valley) directly when their hint comes in — no GIS call, no parallel scan, just the stub record with a fresh timestamp.
- `MODULES` parallel-scan list still has the stubs as no-op modules (they return null in the scan, so they neither match falsely nor block real cities).
- "Outside covered jurisdictions" fallback message now enumerates all 12 covered jurisdictions + the seven most likely Maricopa cities still missing.

**Coverage as of this commit:**
| Jurisdiction | Status |
|---|---|
| Tempe, Phoenix, Mesa, Scottsdale, Gilbert, Glendale, Maricopa Co. unincorporated | Full dimensional data (7) |
| Chandler, Goodyear, Avondale, Surprise, Peoria | Hint-only stubs (5) |
| Buckeye, Apache Junction, El Mirage, Tolleson, Fountain Hills, Litchfield Park, Paradise Valley | Not in agent |

**Verified dispatch:**
- Glendale downtown (33.5387, -112.1859) → C-2 Intermediate Commercial (real data, low confidence)
- Goodyear via hint (33.4355, -112.3576) → stub with chandleraz.gov-style "consult planning" note
- Peoria via hint (33.5806, -112.2374) → stub with peoriaaz.gov pointer

**Files added/changed:**
- `src/agent/src/mcp/zoning/stub.ts` — factory for hint-only modules
- `src/agent/src/mcp/zoning/stubs_west_valley.ts` — Goodyear/Avondale/Surprise/Peoria stubs
- `src/agent/src/mcp/zoning/glendale.ts` — full Glendale module
- `src/agent/src/mcp/zoning/chandler.ts` — refactored to use the factory
- `src/agent/src/mcp/zoning_lookup.ts` — STUB_BY_HINT map, expanded MODULES
- `src/agent/src/mcp/server.ts`, `src/agent/src/prompt.ts` — tool/prompt descriptions

**Open follow-ups:**
- Remaining seven Maricopa cities (Buckeye, Apache Junction, El Mirage, Tolleson, Fountain Hills, Litchfield Park, Paradise Valley) — each is ~1 day to find/encode.
- Chandler/Peoria base-zoning data — would require scraping PDFs or contacting city GIS.
- Push 10 commits to GitHub.
- Address → APN geocoder.
- HTTP layer for the React frontend.

---

## 2026-05-11 — zoning_lookup: deep probe for full-data on remaining 12 cities → honest reality

**What was attempted:** User asked "can we get full data for this?" referring to the 5 hint-only cities (Chandler, Goodyear, Avondale, Surprise, Peoria) and the 7 cities not yet in the agent (Buckeye, Apache Junction, El Mirage, Tolleson, Fountain Hills, Litchfield Park, Paradise Valley). Spent a session deep-probing every public source.

**Findings (per city, after exhaustive search):**

| City | Available? | Probe result |
|---|---|---|
| Chandler | No | Has only a historical 241-feature ordinance overlay layer; CityLimits service has 1 feature with a tiny extent (broken). Web-map "Zoning Viewer" references only the ordinance overlay. |
| Goodyear | No | maps.goodyearaz.gov has services but Planning/LandUsePlanning/DevelopmentServices all require auth tokens. NAI Horizon CRE firm has a "Goodyear Allowable Zoning" service but it's curated CRE subset with no setback/density fields. |
| Avondale | No | Avondale_SF_Zoning + Avondale_MF_Zoning found in AGOL search — but spatial reference is wkid 102723 (Ohio State Plane). They're for Avondale, OHIO, not Avondale, AZ. avondale_gis AGOL account has annexations, planning boundaries, police data, but no zoning. |
| Surprise | No | No public REST anywhere; gis.surpriseaz.gov DNS fails; no AGOL items from official accounts. |
| Peoria | No | gis.peoriaaz.gov has Peoria_Zoning MapServer but its 19 layers are all specific-area-plan overlays and Subzones (PAD/PCD/PUD categories) — no base-zoning REST. |
| Buckeye | No | maps.buckeyeaz.gov has rich Planning/LandUsePlanning/DevelopmentServices folders but they all return token-required. The one public layer (GeneralPlanLandUse) is General Plan land-use categories, not zoning. |
| Apache Junction | No | No public REST. Direct host 000 (DNS fail). No AGOL items. |
| El Mirage | No | No public REST. Direct host 000. No AGOL items. |
| Tolleson | No | No public REST. Only finds an unrelated infra app. |
| Fountain Hills | No | ToFH_2005_LandUse___Zoning service exists but layer 0 "ZONING_POLYGON_VER1" has only TEXTSTRING/TEXT_SIZE/TEXT_ANGLE fields — it's a label layer, not zoning. |
| Litchfield Park | No | No public REST. No AGOL items. |
| Paradise Valley | No | No public REST. Direct host 000. No AGOL items. |

**Honest answer: no, we can't get full data for any of the 12.** The pattern is consistent — small Arizona cities don't publish current zoning as continuous polygon REST; only the bigger ones (Tempe, Phoenix, Mesa, Scottsdale, Gilbert, Glendale) and Maricopa County do. To get full data for any of these 12 would require:
- Emailing each city's GIS contact to request a service URL or shapefile export, OR
- Scraping the zoning code text (PDF) and a static zoning map PDF and georeferencing manually, OR
- Paying for a commercial Maricopa-wide consolidated zoning dataset (Cotality / NAI / etc).

None of those are an "MCP-tool-fetches-via-public-REST" path.

**What was changed in this commit:**
- Avondale: was being moved to a real module, then discovered the data was Ohio-Avondale (wkid 102723 = Ohio State Plane). Reverted to a stub. Saved 30 min of fabricated dimensional values that would have been wrong for a different state.
- Added 7 new stubs to `stubs_west_valley.ts`: Buckeye, Apache Junction, El Mirage, Tolleson, Fountain Hills, Litchfield Park, Paradise Valley. Each carries the city's planning portal URL and phone (best-effort from city websites — phones may be old, user verifies).
- Dispatcher's `CITY_INDEX` now lists 18 city keys (was 11). `STUB_BY_HINT` lists 12 hint-only cities (was 5).
- `MODULES` parallel-scan list still has all stubs as null-returning no-ops.
- "Outside covered jurisdictions" fallback message rewritten to enumerate all 19 covered (7 real + 12 stub + County).

**Coverage now:**
- ✓ Real dimensional data (7): Tempe, Phoenix, Mesa, Scottsdale, Gilbert, Glendale, Maricopa County unincorporated
- ⚠ Hint-only stubs (12): Chandler, Goodyear, Avondale, Surprise, Peoria, Buckeye, Apache Junction, El Mirage, Tolleson, Fountain Hills, Litchfield Park, Paradise Valley
- ✗ Outside coverage: anything beyond Maricopa County

19 of ~21 Maricopa jurisdictions now in the agent (the remaining ~2 are tiny: Carefree, Cave Creek, Queen Creek, Wickenburg, Youngtown, Guadalupe).

**Recommendation for unlocking the remaining cities:** invest in commercial zoning data (Cotality, Regrid). That bypasses the per-city-REST hunt entirely.

---

## 2026-05-11 — Address → APN geocoder (architecture-doc tool: input UX)

**What was built:** Second input path for the agent — users can type a street address instead of an APN. New MCP tool `address_to_apn` returns the same `ParcelRecord` shape as `parcel_lookup`, so downstream tools (flood_zone, topo_slope, zoning_lookup, report_builder) don't change.

**Tool internals (two-step):**
1. **Geocode** the address via Nominatim (`nominatim.openstreetmap.org/search`) — free, no auth, requires User-Agent header (we identify as `SiteSenseAgent/0.1`).
2. **Resolve to parcel** by querying Maricopa Parcels REST at the resulting lat/lon with `geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects`. Returns the full `ParcelRecord` plus a `matched_address` field showing what Nominatim actually matched.

**Failure modes handled:**
- Nominatim can't geocode → "Nominatim could not geocode address: …" with the raw input.
- No parcel at the geocoded point → "address may be outside Maricopa County, or on a right-of-way / open space" so the user knows the problem isn't agent failure.

**Agent input routing:**
- `runFeasibilityAgent(input)` classifies via `looksLikeApn(s)` regex (`\d{3}-?\d{2}-?\d{3}[A-Za-z]?` or 8+ digits with optional letter suffix).
- Prompts the agent with the right opening: APN → "use parcel_lookup", address → "use address_to_apn".
- System prompt updated to describe both paths and tell the agent address_to_apn returns a complete ParcelRecord (no need to also call parcel_lookup afterward).

**Verified:**
- Standalone tool (no Claude needed): `"1435 N Dorsey Ln, Tempe AZ 85288"` → APN 13209099 (the condo we used earlier); `"2092 E 10th St, Tempe AZ 85281"` → APN 13268011 (the SFR).
- Full e2e: address input → agent called `address_to_apn` first, then `flood_zone` + `topo_slope` + `zoning_lookup(city=TEMPE)` in parallel. No `parcel_lookup` call — agent correctly recognized the ParcelRecord was already complete.

**Files:**
- `src/agent/src/mcp/address_to_apn.ts` — new tool
- `src/agent/src/mcp/server.ts` — registers address_to_apn, updated parcel_lookup description to point at it
- `src/agent/src/agent.ts` — input classification + dispatching prompt
- `src/agent/src/prompt.ts` — describes both input paths in the tool sequence
- `src/agent/test/address_to_apn.test.ts` — standalone test
- `src/agent/test/e2e.test.ts` — accepts address as well as APN
- `src/agent/package.json` — `test:address` script

**MVP UX shift:** the demo is now "type your address, get a 1-page feasibility report" instead of "type your APN". Same agent, same 5 downstream tools, no extra latency (parcel data still fetched in 1 call, just from a different source).

**Architecture-doc tools now covered:** parcel_lookup, flood_zone, topo_slope, zoning_lookup, report_builder, **+ address_to_apn (input UX tool, not in original 8-tool list but obvious need).** Remaining: utility_avail, title_pull, comps_cost.

---

## 2026-05-11 — utility_avail MCP tool (architecture-doc tool 5)

**What was built:** Tool 5 from the architecture-doc list. Queries 5 utility data sources in parallel at a point and returns structured electric/water/sewer service records with inferred providers and verification notes.

**Endpoints:**
- **SRP electric**: `services2.arcgis.com/ICaY8VX3lsUsMBRl/.../SRP_PSA/FeatureServer/3` (owner=Matthew.Russo_SRP_GIS, official). The service description carries a strict ToS: "no display of this boundary is permitted without SRP written consent." We use it ONLY for binary in/out classification, never redistribute the polygon. The report says "SRP service area" (a public fact), not the boundary data.
- **APS electric**: `services6.arcgis.com/wF9gckwE55J0Ayag/.../CCN_ServiceTerritory/FeatureServer/0` (owner=rami.alygad_apsc, official). The layer covers all of AZ; features inside APS territory have non-null `NAME`. We treat NAME=null as "not APS."
- **Maricopa County Water Provider**: PND/PlanNet layer 48. Sparse — only covers unincorporated parcels. Returns LABEL field (e.g., "EPCOR Water Arizona, Inc. (Anthem)").
- **Maricopa County Sewer Provider**: PND/PlanNet layer 50. Same shape as water — only unincorporated.
- **ADWR Municipal Service Area**: PND/PlanNet layer 49. Authoritative across the county. Returns WATERCO field (e.g., "CITY OF TEMPE", "ANTHEM").

**Provider inference logic:**
- Electric: SRP query result → APS query result → city default. SRP_CITIES={Tempe, Mesa, Chandler, Gilbert, Scottsdale}, APS_DOMINANT_CITIES={Phoenix, Goodyear, Avondale, Surprise, Peoria, Buckeye, Glendale}. Returns "SRP or APS (both overlap)" when both match.
- Water: ADWR WATERCO → County provider → city default → "likely well water" for unincorporated parcels with no provider hits.
- Sewer: County provider → city default → "likely on-site septic" for rural.

The "likely well water" / "likely septic" classification is itself an engineering signal — it means a major site-cost driver. The prompt now tells the agent to flag this in red flags with "$20–40K typical for well + septic."

**Verified on 3 site types:**
- Tempe APN 13209099 (in-city, SRP territory): electric=SRP, water=City of Tempe (ADWR), sewer=City of Tempe Wastewater (city default fallback).
- Phoenix Encanto (in-city, APS territory): electric=Likely APS (APS query returned NAME=null so fell to city default), water=City of Phoenix (ADWR), sewer=City of Phoenix Water Services Department (city default).
- New River (rural unincorporated): electric=unknown (no SRP, no APS, no city hint), water=ANTHEM via ADWR and County (EPCOR Water Arizona at the Anthem master-planned community), sewer=EPCOR (county). Matches reality.

**Files:**
- `src/agent/src/mcp/utility_avail.ts` — new tool (Promise.allSettled across 5 endpoints, inference logic, ToS-respectful SRP usage)
- `src/agent/src/mcp/server.ts` — registers utility_avail
- `src/agent/src/prompt.ts` — adds utility_avail to the parallel call set + "flag well+septic in red flags with $20-40K cost"
- `src/agent/test/utility_avail.test.ts` — standalone test
- `src/agent/package.json` — test:utility script

**Architecture-doc status:** 6 of 8 tools done. Remaining: title_pull (paid API, decision deferred), comps_cost (MLS/RSMeans).
