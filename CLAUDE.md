# Hackathon ASU 2025 — Global AI Rules
# Context Engineering: WISC Framework
# Keep this file under 500 lines. Load heavy docs via sub-agents only.

## Project Overview
**Event:** HackASU 2025
**Team:** Mobasher Group
**Track:** Track 3 — Economic Empowerment & Education
**Date:** March 20–21, 2025
**Live URL:** https://ornate-marigold-192751.netlify.app
**GitHub:** https://github.com/Pleesudjai/sitesense

## Selected Project — SiteSense: AI-Powered Land Feasibility Tool
**One-Line Pitch:** "Drop a pin, draw your lot — get a code-compliant feasibility study in 30 seconds.
What used to cost $50,000 and 3 weeks now takes half a minute."

### What It Does
User draws a polygon on a satellite map → app auto-pulls:
- DEM elevation grid (USGS 3DEP) for the polygon + 100m buffer
- GIS risk layers: flood zone (FEMA), seismic (USGS), soil (USDA), wetlands (USFWS), fire (rule-based)
- Civil engineering calculations: slope, cut/fill volumes, foundation type, structural loads, stormwater
- ROM cost estimate + 10-year projection (4.5% ENR CCI inflation)
- Claude API translates output into plain English → PDF report

### Engineering Code Basis
- **ACI 350-20 / 350R-20** — Structural design of environmental engineering concrete structures
- **ACI 360R-10** — Slab-on-ground design and construction
- **ASCE 7-22** — Wind (Ch.26-27), seismic (Ch.12), flood (Ch.5), snow (Ch.7) loads
- **IBC 2021** — Soils §1803, flood §1612

### Arizona-Specific Rules (Our Differentiator)
- Expansive clay / shrink-swell soil → PT slab (ACI 360R-10 §5.4)
- Caliche hardpan detected → grade beams + $3–8/SF uplift
- Ephemeral washes (ADWR) — FEMA misses these
- Water adequacy certificate flag (ARS §9-463.06)
- WUI fire zones → ASCE 7 Ch.27 + ignition-resistant construction
- Heat flag: "Optimal build window Oct–Apr, summer adds 25% labor"
- Regional cost multipliers: Phoenix 0.95×, Tucson 0.88×, Flagstaff 1.05×

## Current Architecture (AS-BUILT)

### Stack — FINAL
- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3
- **Map:** MapLibre GL JS 4 (NO TOKEN NEEDED) + Esri World Imagery satellite (free)
- **Address Search:** Nominatim/OpenStreetMap geocoder (free, no key)
- **Draw Tool:** @mapbox/mapbox-gl-draw (aliased to maplibre-gl via vite.config.js)
- **Charts:** Recharts — elevation profiles, cut/fill bar chart
- **Backend:** Netlify Functions (Python Lambda) — NO separate server needed
- **AI Layer:** Claude API (claude-sonnet-4-6) — plain-English report generation
- **PDF:** ReportLab — in-memory PDF as base64 bytes
- **Deploy:** Netlify only — frontend + backend functions in one repo

### API Keys Required (set in Netlify environment variables)
```
ANTHROPIC_API_KEY=   # Claude Sonnet 4.6 — set in Netlify dashboard
```
**No Mapbox token needed.** All GIS APIs are FREE with no auth.

### Free APIs Used (no keys required)
| API | Endpoint | Data |
|---|---|---|
| USGS 3DEP | epqs.nationalmap.gov/v1/json | Elevation grid |
| FEMA NFHL | msc.fema.gov/arcgis/rest | Flood zone (AE/X/VE) |
| USDA SoilWeb | casoilresource.lawr.ucdavis.edu/api | Soil, caliche, shrink-swell |
| USGS NSHM | earthquake.usgs.gov/hazard/designmaps | Seismic SDC, Ss, S1 |
| USFWS NWI | fws.gov/wetlands/arcgis/rest | Wetlands |
| Esri World Imagery | arcgisonline.com | Satellite tiles |
| Nominatim OSM | nominatim.openstreetmap.org | Address geocoding |

### File Organization (AS-BUILT)
```
Hackathon ASU 2025/
├── CLAUDE.md                        ← You are here
├── TODO.md                          ← Outstanding tasks
├── netlify.toml                     ← Build + functions config
├── netlify/functions/
│   ├── analyze.py                   ← POST /api/analyze (Lambda)
│   ├── report.py                    ← POST /api/report → PDF bytes (Lambda)
│   └── requirements.txt             ← Python deps for Lambda
├── src/
│   ├── frontend/
│   │   ├── vite.config.js           ← alias mapbox-gl → maplibre-gl
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.jsx             ← CSS imports: maplibre-gl + draw
│   │       ├── App.jsx              ← Header, map, dashboard layout
│   │       ├── api.js               ← analyzeParcel() + downloadReport()
│   │       └── components/
│   │           ├── MapView.jsx      ← MapLibre + Esri sat + Nominatim search
│   │           ├── RiskCards.jsx    ← 6 traffic-light risk indicators
│   │           ├── ElevationChart.jsx
│   │           ├── CutFillVisual.jsx
│   │           ├── CostTable.jsx    ← Now/2yr/5yr/10yr projection
│   │           └── ReportButton.jsx
│   └── backend/
│       ├── main.py                  ← FastAPI app (local dev only)
│       ├── data/                    ← elevation, flood, soil, seismic, fire, wetlands
│       ├── engineering/             ← cut_fill, rules, cost, loads, stormwater
│       ├── ai/translate.py          ← Claude prompt → 6-section report
│       └── report/pdf_report.py     ← generate_pdf() + generate_pdf_bytes()
└── docs/decisions.md
```

## How Netlify Functions Work (important for new sessions)
- `netlify/functions/analyze.py` and `report.py` are Python Lambdas
- They add `src/backend/` to `sys.path` and import all modules from there
- `netlify.toml` has `included_files = ["src/backend/**"]` to bundle backend
- Redirects: `/api/analyze` → `/.netlify/functions/analyze`
- Timeout: 26 seconds (set in netlify.toml)
- The `vite.config.js` alias (`mapbox-gl` → `maplibre-gl`) is CRITICAL — don't remove it

## Coding Standards
### General
- Readable demo-ready code — clarity beats cleverness at a hackathon
- `snake_case` Python, `camelCase` JS
- No dead code, no TODO comments in production files

### Python Backend (Netlify Functions)
- All async functions — use `asyncio.run()` in the Lambda handler
- `httpx` for external API calls (async-friendly)
- Never hardcode API keys — read from `os.environ`
- Return: `{"status": "ok", "data": {...}}`

### Frontend
- Tailwind for styling, no inline style dumps
- Keep components under 150 lines
- All map operations go through `MapView.jsx` only

## 3 Demo Test Cases (Pre-cache for hackathon)
1. **Phoenix flat lot** — `1900 E Apache Blvd, Tempe AZ` → Flood X, expansive soil, low risk
2. **Houston flood zone** — `5000 Main St, Houston TX 77002` → Flood AE, pile foundation
3. **Flagstaff hillside** — `2800 N Fort Valley Rd, Flagstaff AZ` → Steep slope, snow load, high cut/fill

## Demo Checklist
- [x] Satellite map loads (MapLibre + Esri, no token)
- [x] Address search works (Nominatim)
- [x] Polygon draw tool works
- [x] Netlify Functions deployed (analyze + report)
- [ ] ANTHROPIC_API_KEY set in Netlify environment variables
- [ ] End-to-end test: draw polygon → click Analyze → results appear
- [ ] PDF download works
- [ ] Test all 3 demo addresses
- [ ] Error states handled gracefully (no crashes)
