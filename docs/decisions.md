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
