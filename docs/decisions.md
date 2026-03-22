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
