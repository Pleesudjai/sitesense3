# SiteSense — AI-Powered Land Feasibility Tool

> **SMC Labs · Mobasher Group · Arizona State University**  
> 🏆 HackASU 2026 — Track 3: Economic Empowerment & Education  
> Live: https://ornate-marigold-192751.netlify.app

**"Drop a pin, draw your lot — get a code-compliant feasibility study in 30 seconds."**  
What used to cost $10,000–$50,000 and take 3 weeks now takes half a minute.

SiteSense democratizes access to civil engineering analysis for homeowners, affordable housing developers, and anyone making high-stakes land decisions without expensive consultants.

---

## What It Does

Draw a polygon on the satellite map → SiteSense queries **14 free government APIs in parallel** → runs deterministic civil engineering calculations → Claude API translates output into a plain-English 6-section feasibility report.

### Outputs Generated

| Output | Method |
|--------|--------|
| Elevation grid + slope analysis | USGS 3DEP (8×8 DEM) |
| Flood zone + risk classification | FEMA NFHL (AE/VE/X/etc) |
| Soil properties + geotechnical hazards | USDA SSURGO + SDA SQL |
| Seismic Design Category (A–F) | USGS NSHM + ASCE 7-22 |
| Foundation recommendation | Deterministic rule engine |
| Cut/fill earthwork volumes | Grid-based calculation |
| Structural loads (wind, seismic, snow) | ASCE 7-22 |
| Stormwater runoff | Rational method (Q = CiA) |
| ROM cost estimate ± 30% | EPA/RSMeans regional data |
| 10-year cost projection | ENR CCI 4.5% inflation |
| Plain-English 6-section report | Claude Sonnet 4.6 |
| Downloadable PDF report | ReportLab (in-memory) |

---

## Features

- **Satellite Map + Draw Tool** — Freehand polygon drawing on Esri World Imagery; click vertices, double-click to finish
- **Address Search** — Nominatim geocoder with animated fly-to (no API key required)
- **Risk Cards** — Traffic-light indicators for flood, seismic, soil, wildfire, wetlands, contamination, liquefaction, and more
- **Elevation Chart** — Three views: satellite + contours, heatmap, 3D surface
- **Cut/Fill Visual** — Bar chart of earthwork volumes (cut vs. fill, net direction)
- **Cost Table** — Itemized breakdown with 2yr / 5yr / 10yr inflation projections
- **House Concept Panel** — Layout estimator (Compact / Standard / Spacious) with structural screen and ROM cost
- **Build Now or Wait?** — 10-year cost forecasting panel
- **Engineering Q&A** — Claude-powered assistant with engineering code reference tables in system prompt
- **PDF Download** — Professional report with tables, risk summary, and disclaimers

---

## Data Sources

All APIs are **free government sources — no authentication tokens required**.

| Layer | Source | API |
|-------|--------|-----|
| Elevation (DEM) | USGS 3DEP | elevatationpoints.usgs.gov |
| Flood Zone | FEMA NFHL | msc.fema.gov/arcgis |
| Soil (HSG, texture, hazards) | USDA SoilWeb + SDA SQL | casoilresource.lawr.ucdavis.edu |
| Seismic (Ss, S1, SDC) | USGS NSHM | earthquake.usgs.gov |
| Wind Speed | ASCE 7-22 Table 26.5-1 | Lookup table |
| Wetland Status | USFWS NWI | fws.gov/wetlands/arcgis |
| Wildfire Risk | WUI heuristic | Rule-based |
| Contamination | EPA Envirofacts + FRS | epa.gov/enviro/facts |
| Precipitation | NOAA Atlas 14 | NOAA API |
| Hydrography | USGS NHD | USGS |
| Endangered Species | USFWS Critical Habitat | Spatial query |
| Historic Sites | NPS National Register | Spatial query |
| Landslide Risk | Slope + geology heuristic | Rule-based |
| Sea Level Rise | NOAA CSC | Coastal areas only |

---

## Engineering Code Basis

Every calculation is referenced to a published standard — not LLM guesses.

| Code | Used For |
|------|----------|
| ASCE 7-22 Ch. 26–27 | Wind loads |
| ASCE 7-22 Ch. 12 | Seismic loads + SDC |
| ASCE 7-22 Ch. 5 | Flood loads |
| ASCE 7-22 Ch. 7 | Snow loads |
| IBC 2021 §1803 | Soils investigation |
| IBC 2021 §1612 | Flood design |
| IBC 2021 Table 1806.2 | Presumptive bearing capacity |
| ACI 318-19 | Exposure class (sulfate S1–S3) |
| ACI 360R-10 §5.4 | Post-tensioned slab (expansive clay) |
| PTI DC80.3-16 | PT slab design criteria |
| ASTM D4829 | Expansive soil index |
| IBC §1803.5.11 | Liquefaction screening |
| IBC §1803.5.9 | Collapsible soil screening |

---

## Architecture

```
User draws polygon
        ↓
   /api/analyze
        ↓
  14 GIS fetches (parallel, async httpx)
        ↓
  Engineering rule engine
  (foundation, loads, cut/fill, cost, stormwater)
        ↓
  Claude API (translator only — plain-English output)
        ↓
  JSON response → React UI
        ↓
  /api/report → ReportLab PDF → base64 → browser download
```

**Architecture principle:** Claude API is a **translator, not a calculator**. All engineering decisions (flood risk, foundation type, seismic category, cost) are made by the deterministic Python engine. Claude renders plain English — it holds no calculation authority.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5, Tailwind CSS |
| Maps | MapLibre GL JS 4.5 + Esri satellite |
| Drawing | @mapbox/mapbox-gl-draw (aliased to MapLibre) |
| Charts | Recharts 2 |
| Geometry | @turf/area, @turf/centroid |
| Backend | Python 3.11 (Netlify Functions / FastAPI local) |
| HTTP | httpx 0.27 (async GIS API calls) |
| AI | Claude Sonnet 4.6 (Anthropic) |
| PDF | ReportLab 4.2 (in-memory, base64 output) |
| Geometry | Shapely 2.0 |
| Deploy | Netlify (frontend + serverless functions) |

---

## Project Structure

```
SiteSense/
├── src/
│   ├── frontend/                   # React + Vite app
│   │   └── src/
│   │       ├── App.jsx             # Layout, tabs, dashboard
│   │       ├── api.js              # Backend client + DEMO_MODE
│   │       └── components/
│   │           ├── MapView.jsx             # MapLibre + draw tool
│   │           ├── RiskCards.jsx           # Traffic-light risk indicators
│   │           ├── ElevationChart.jsx      # 3-view elevation analysis
│   │           ├── CutFillVisual.jsx       # Earthwork bar chart
│   │           ├── CostTable.jsx           # Cost breakdown + projections
│   │           ├── HouseConceptPanel.jsx   # Layout + structural estimator
│   │           ├── EngineeringAssistant.jsx # Claude Q&A chatbot
│   │           └── PriceForecastPanel.jsx  # Build now or wait?
│   │
│   └── backend/
│       ├── data/                   # Async GIS fetchers
│       │   ├── elevation.py        # USGS 3DEP
│       │   ├── flood.py            # FEMA NFHL
│       │   ├── soil.py             # USDA SoilWeb + SDA SQL
│       │   ├── seismic.py          # USGS NSHM
│       │   ├── fire.py             # WUI rule-based
│       │   └── wetlands.py         # USFWS NWI
│       ├── engineering/            # Deterministic calculations
│       │   ├── rules.py            # Foundation decision logic
│       │   ├── cut_fill.py         # Earthwork volumes
│       │   ├── loads.py            # ASCE 7-22 structural loads
│       │   ├── cost.py             # ROM estimate + inflation
│       │   └── stormwater.py       # Rational method runoff
│       ├── ai/
│       │   └── translate.py        # Claude API — report generation only
│       └── report/
│           └── pdf_report.py       # ReportLab PDF builder
│
├── netlify/
│   └── functions/                  # Serverless deploy wrappers
│       ├── analyze.py              # POST /api/analyze
│       ├── report.py               # POST /api/report
│       ├── house_estimate.js       # POST /api/house_estimate
│       ├── engineering_assist.js   # POST /api/engineering_assist
│       └── price_predict.js        # POST /api/price_predict
│
├── netlify.toml                    # Build + redirect config
└── local_server.py                 # FastAPI dev server
```

---

## Running Locally

### Prerequisites
- Node.js 20+
- Python 3.11+
- Netlify CLI: `npm i -g netlify-cli`
- Anthropic API key → [console.anthropic.com](https://console.anthropic.com)

### Setup

```bash
# Clone
git clone https://github.com/Pleesudjai/sitesense3.git
cd sitesense3

# Frontend
cd src/frontend && npm install && cd ../..

# Root-level deps
npm install

# Python backend
pip install -r netlify/functions/requirements.txt

# Environment
echo "ANTHROPIC_API_KEY=your_key_here" > .env
```

### Run (Full Stack)

```bash
netlify dev
# Opens http://localhost:5173
```

### Run (Separate Terminals)

```bash
# Terminal 1 — Backend
python local_server.py

# Terminal 2 — Frontend
cd src/frontend && npm run dev
```

### Demo Addresses (Pre-tested)

| Address | What It Tests |
|---------|--------------|
| `2323 W Dunlap Ave, Phoenix AZ` | Flat, expansive soil, low flood risk |
| `5000 Main St, Houston TX 77002` | Flood Zone AE, pile foundation |
| `2800 N Fort Valley Rd, Flagstaff AZ` | Steep slope, snow load, high cut/fill |

---

## Deploy to Netlify

1. Push to GitHub
2. Connect repo at [netlify.com](https://netlify.com)
3. Build settings are pre-configured in `netlify.toml`
4. Set environment variable: **`ANTHROPIC_API_KEY`** in Site settings → Environment variables
5. Deploy — live in ~2 minutes

---

## Arizona-Specific Rules

SiteSense includes engineering rules specific to Arizona soil and climate conditions:

- **Expansive clay** → Post-tension slab recommended (ACI 360R-10 §5.4)
- **Caliche hardpan** → Grade beams + $3–8/SF cost uplift
- **Ephemeral washes** — FEMA misses these; ADWR data used
- **Collapsible alluvial soils** in desert basins
- **Construction window** flag — "Optimal Oct–Apr; summer adds 25% labor"
- **Water adequacy certificate** flag (ARS §9-463.06)
- **WUI fire zones** → ASCE 7 Ch. 27 + ignition-resistant construction
- **Regional cost multipliers** — Phoenix 0.95×, Tucson 0.88×, Flagstaff 1.05×

---

## Credits

Built by **SMC Labs — Structures, Materials & Composites**  
Mobasher Group · Arizona State University

- Stormwater: USDA TR-55 Rational Method
- Costs: RSMeans + EPA cost databases with ENR CCI inflation
- Codes: ACI, ASCE 7-22, IBC 2021, PTI, ASTM
- AI: Claude Sonnet 4.6 (Anthropic) — translator only
