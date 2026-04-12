# SiteSense — AI-Powered Land Feasibility Tool

> **SMC Labs · Mobasher Group · Arizona State University**  
> 🏆 1st Place · HackASU 2026 — Track 3: Economic Empowerment & Education  
> Live demo: [musical-cuchufli-3cd9f8.netlify.app](https://musical-cuchufli-3cd9f8.netlify.app)

## Demo Video

[![SiteSense Demo](https://img.youtube.com/vi/b0yoLrr9vak/maxresdefault.jpg)](https://www.youtube.com/watch?v=b0yoLrr9vak&t=5s)

**"Drop a pin, draw your lot — get a code-compliant feasibility study in 30 seconds."**

What used to cost $10,000–$50,000 and take 3 weeks now takes half a minute. SiteSense democratizes access to civil engineering analysis for homeowners, small developers, and real estate agents making high-stakes land decisions without expensive consultants.

> *"No one will be replaced by AI, but we will all become better decision makers."*  
> This isn't marketing — it's architecturally enforced.

---

## The Problem

Over **50% of construction projects exceed budget** due to unforeseen site conditions discovered *after* commitment. A standard civil engineering feasibility study costs $10K–$50K and takes 3 weeks. This gatekeeps critical information from:

- Homeowners who commit before discovering a $100K surprise
- Small developers whose entire ROI is killed by a $50K feasibility study
- Real estate agents who can't advise buyers on buildability
- Lenders screening construction loans for hidden site risks

---

## How It Works

```
User draws parcel boundary on satellite map
              ↓
    15 free government APIs queried in parallel
    (USGS · FEMA · USDA · USFWS · EPA · NOAA)
              ↓
         7-Layer Neurosymbolic Brain
    [Rules handle correctness · Claude handles insight]
              ↓
   Weighted risk verdict + site design + cost forecast
              ↓
    Plain-English report + downloadable PDF
```

**The system is rules-first, not AI-first.** Remove the API key and every calculation, code check, and PDF report still runs — it falls back to deterministic rule-based reasoning. Claude extends with contextual insight; it cannot override the engineering rules.

---

## Architecture: 7-Layer Neurosymbolic Brain

| Layer | What It Does |
|-------|-------------|
| **1. Retrieval** | 15 free government GIS APIs queried in parallel |
| **2. Tool Layer** | Deterministic computations — slope, cut/fill, cost, runoff, pad scoring |
| **3. Doctrine** | IBC 2021, ASCE 7-22, ACI 360R-10 hard-coded rules injected |
| **4. Evidence Pack** | 150+ field working memory with per-layer confidence tracking |
| **5. Expert Panel** | 6 domain specialists — rules run first, Claude extends |
| **6. Brain Report** | Claude synthesizes OR rule-based fallback (no API key required) |
| **7. Output** | Dashboard + 4-page PDF with data quality badges |

**Why neurosymbolic?** The symbolic part (codes and rules) handles what *must be correct*. The neural part (Claude) handles what *needs insight* — compound risks that no single rule catches. This is the same logic that governs fracture mechanics: a crack propagates when multiple stresses interact, not from any one alone.

---

## Output: What You Get in 30 Seconds

### Risk Verdict (4 levels)
- **Good Candidate** — Build-ready, standard foundation, low compound risk  
- **Proceed with Caution** — One elevated risk factor, manageable  
- **Moderate Risk** — Multiple interacting hazards, specialist review recommended  
- **High Risk** — Cost-prohibitive conditions or code barriers

### Compound Risk Detection (19 cross-domain interactions)
Examples of what single-layer checks miss:
- Expansive soil + slope → asymmetric differential settlement
- Flood zone + caliche → drainage trap under impermeable layer
- High seismic + organic soil → liquefaction cascade
- Fire WUI zone + slope + wind → structure orientation constraint

### Site Design Intelligence
- **9-zone optimal layout** — pad placement scored on flatness, relief, cut/fill, flood penalty, wetland penalty, soil hazards
- **8-direction orientation scoring** — weighted by climate zone (solar gain, west-heat penalty, terrain alignment)
- Climate-aware window strategy and room zoning

### Cost Forecasting
- ROM estimate ±30% with itemized breakdown
- 10-year projection at 4.5% ENR CCI historical inflation
- Compound cost premiums: foundation type + fire risk uplift + cut/fill + labor/materials
- Regional multipliers (Phoenix 0.95×, Tucson 0.88×, Flagstaff 1.05×)
- "Build Now or Wait?" analysis with delay cost impact

### Downloadable PDF Report
- 4-page professional report (ReportLab, in-memory, no file I/O on Lambda)
- Risk summary, site conditions, foundation recommendation, cost table, next steps
- Data quality confidence badges per GIS layer
- Professional disclaimers included

---

## Data Sources

All 15 APIs are **free government sources — no authentication tokens required**.

| Layer | Source | API |
|-------|--------|-----|
| Elevation (DEM) | USGS 3DEP | elevatationpoints.usgs.gov |
| Flood Zone | FEMA NFHL | msc.fema.gov/arcgis |
| Soil (HSG, texture, hazards) | USDA SoilWeb + SDA SQL | casoilresource.lawr.ucdavis.edu |
| Seismic (Ss, S1, SDC) | USGS NSHM | earthquake.usgs.gov |
| Wind Speed | ASCE 7-22 Table 26.5-1 | Lookup table |
| Wetland Status | USFWS NWI | fws.gov/wetlands/arcgis |
| Precipitation | NOAA Atlas 14 | NOAA Precip Frequency API |
| Contamination | EPA Envirofacts + FRS | epa.gov/enviro/facts |
| Hydrography | USGS NHD | USGS NHD REST |
| Endangered Species | USFWS Critical Habitat | Spatial query |
| Historic Sites | NPS National Register | Spatial query |
| Wildfire Risk | WUI heuristic | Rule-based |
| Landslide Risk | Slope + geology heuristic | Rule-based |
| Sea Level Rise | NOAA CSC | Coastal areas only |
| Land Cover | NLCD (USGS) | MRLC GeoServer |

---

## Engineering Code Basis

Every calculation references a published standard — not LLM guesses.

| Code | Application |
|------|-------------|
| **ASCE 7-22 Ch. 26–27** | Wind loads, basic wind speed |
| **ASCE 7-22 Ch. 12** | Seismic loads, Seismic Design Category A–F |
| **ASCE 7-22 Ch. 5** | Flood loads |
| **ASCE 7-22 Ch. 7** | Snow loads |
| **IBC 2021 §1803** | Soils investigation requirements |
| **IBC 2021 §1612** | Flood design |
| **IBC 2021 Table 1806.2** | Presumptive bearing capacity by soil class |
| **IBC §1803.5.11** | Liquefaction screening |
| **IBC §1803.5.9** | Collapsible soil screening |
| **ACI 318-19** | Sulfate exposure class S1–S3 |
| **ACI 360R-10 §5.4** | Post-tensioned slab for expansive clay |
| **PTI DC80.3-16** | PT slab design criteria |
| **ASTM D4829** | Expansive soil expansion index |

**Foundation decision ladder** (priority order):  
Flood → Slope → Seismic → Expansive soil → Caliche hardpan → Organic soil → Default

---

## Arizona-Specific Engineering Rules

SiteSense includes rules engineered specifically for Arizona soil, climate, and regulatory conditions — conditions that generic tools miss:

- **Expansive clay** → Post-tension slab (ACI 360R-10 §5.4)
- **Caliche hardpan** → Grade beams required + $3–8/SF cost uplift
- **Ephemeral washes** → FEMA FIRMs miss these; Maricopa County ADWR data used
- **Collapsible alluvial soils** → Deep foundations or compaction grouting
- **Sulfate attack** → ACI 318 exposure class determination from soil chemistry
- **Corrosion risk** → Steel + concrete protection requirements
- **Water adequacy certificate** → Flag per ARS §9-463.06
- **WUI fire zones** → ASCE 7 Ch. 27 + ignition-resistant construction (IRC Ch. R327)
- **Construction window** → "Optimal Oct–Apr; summer adds 20–25% labor cost"
- **Heat flag** → Supplemental irrigation for plant establishment in summer pours

---

## UI: Four Tabs

| Tab | What It Shows |
|-----|--------------|
| **Site Analysis** | Risk cards, elevation chart (satellite/heatmap/3D surface), cut/fill volumes, cost breakdown, PDF download |
| **House Concept** | Layout estimator (Compact/Standard/Spacious), structural screen, ROM cost by quality tier |
| **Build Now or Wait?** | 10-year cost projection, inflation impact, delay cost analysis |
| **Engineering Q&A** | Claude-powered chatbot with full engineering code reference tables in system prompt |

**Risk Cards** — Traffic-light indicators for: flood, seismic, soil expansion, liquefaction, wildfire, wetlands, contamination, slope, organic soil, sulfate, corrosion, collapsible soil

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5, Tailwind CSS |
| Maps | MapLibre GL JS 4.5 + Esri World Imagery (no token) |
| Drawing | @mapbox/mapbox-gl-draw (aliased to MapLibre) |
| Charts | Recharts 2 |
| Geometry | @turf/area, @turf/centroid, Shapely 2 |
| Backend | Python 3.11 — Netlify Functions (serverless) |
| HTTP | httpx 0.27 (async parallel GIS calls) |
| AI | Claude Sonnet 4.6 (Anthropic) — translator + insight only |
| PDF | ReportLab 4.2 (in-memory, base64 output) |
| Deploy | Netlify (frontend + serverless functions, single platform) |

**Key design decision:** Netlify Functions for Python backend — no separate server to manage, scales to zero, free tier sufficient for demo and early traction.

---

## Project Structure

```
SiteSense/
├── src/
│   ├── frontend/                        # React + Vite app
│   │   └── src/
│   │       ├── App.jsx                  # Layout, 4-tab navigation, dashboard
│   │       ├── api.js                   # Backend client (DEMO_MODE for offline)
│   │       └── components/
│   │           ├── MapView.jsx          # MapLibre + draw tool + Nominatim search
│   │           ├── RiskCards.jsx        # Traffic-light risk indicators
│   │           ├── ElevationChart.jsx   # Satellite / heatmap / 3D surface views
│   │           ├── CutFillVisual.jsx    # Earthwork bar chart
│   │           ├── CostTable.jsx        # Cost breakdown + 10-year projections
│   │           ├── HouseConceptPanel.jsx       # Layout + structural estimator
│   │           ├── EngineeringAssistant.jsx    # Claude Q&A with code references
│   │           └── PriceForecastPanel.jsx      # Build now or wait?
│   │
│   └── backend/
│       ├── data/                        # Async GIS API fetchers
│       │   ├── elevation.py             # USGS 3DEP
│       │   ├── flood.py                 # FEMA NFHL
│       │   ├── soil.py                  # USDA SoilWeb + SDA SQL (full SSURGO)
│       │   ├── seismic.py               # USGS NSHM + ASCE 7-22 wind lookup
│       │   ├── fire.py                  # WUI rule-based assessment
│       │   └── wetlands.py              # USFWS NWI
│       ├── engineering/                 # Deterministic rule engine
│       │   ├── rules.py                 # Foundation decision ladder
│       │   ├── cut_fill.py              # Grid-based earthwork volumes
│       │   ├── loads.py                 # ASCE 7-22 structural loads
│       │   ├── cost.py                  # ROM estimate + inflation projection
│       │   └── stormwater.py            # Rational method runoff (Q = CiA)
│       ├── ai/
│       │   └── translate.py             # Claude API — report generation only
│       └── report/
│           └── pdf_report.py            # ReportLab PDF builder
│
├── netlify/
│   └── functions/                       # Serverless deploy wrappers
│       ├── analyze.py                   # POST /api/analyze — main pipeline
│       ├── report.py                    # POST /api/report — PDF generation
│       ├── house_estimate.js            # POST /api/house_estimate
│       ├── engineering_assist.js        # POST /api/engineering_assist
│       └── price_predict.js             # POST /api/price_predict
│
├── netlify.toml                         # Build config, redirects, timeouts
└── local_server.py                      # FastAPI local dev server
```

---

## Running Locally

### Prerequisites
- Node.js 20+
- Python 3.11+
- Netlify CLI: `npm i -g netlify-cli`
- Anthropic API key → [console.anthropic.com](https://console.anthropic.com) *(optional — system works without it)*

### Setup

```bash
# Clone
git clone https://github.com/Pleesudjai/sitesense3.git
cd sitesense3

# Frontend dependencies
cd src/frontend && npm install && cd ../..

# Root-level dependencies
npm install

# Python dependencies
pip install -r netlify/functions/requirements.txt

# Environment (optional — system works without Claude API)
echo "ANTHROPIC_API_KEY=your_key_here" > .env
```

### Run

```bash
# Full stack (recommended)
netlify dev
# → http://localhost:5173

# Or separately:
# Terminal 1 — backend
python local_server.py

# Terminal 2 — frontend
cd src/frontend && npm run dev
```

### Demo Addresses (Pre-tested)

| Address | What It Demonstrates |
|---------|---------------------|
| `1900 E Apache Blvd, Tempe AZ` | Flat lot, expansive soil, low flood risk |
| `5000 Main St, Houston TX 77002` | Flood Zone AE, pile foundation required |
| `2800 N Fort Valley Rd, Flagstaff AZ` | Steep slope, snow load, high cut/fill |

---

## Deploy to Netlify

1. Push to GitHub
2. Connect repo at [netlify.com](https://netlify.com) — build config is in `netlify.toml`
3. Set environment variable in Site Settings → Environment Variables:
   ```
   ANTHROPIC_API_KEY = sk-ant-xxx
   ```
4. Deploy — live in ~2 minutes

*Note: The site works without the API key — all engineering calculations run; the AI-extended insights degrade gracefully to rule-based output.*

---

## Competitive Moat

Three layers that generic GIS viewers and AI chatbots cannot replicate:

**1. Engineering codes hard-coded**  
IBC 2021 Table 1806.2 presumptive bearing + ASCE 7-22 seismic design categories + ACI 360R-10 PT slab thresholds are in the rule engine — not in a prompt.

**2. Compound risk detection**  
19 cross-domain interactions checked (e.g., expansive soil + slope, flood zone + caliche, high seismic + organic soil). Single-layer GIS tools miss these completely.

**3. Feedback loop architecture**  
Foundation advisor upgrades foundation type mid-pipeline → cost forecaster compounds premiums → fire risk uplifts construction cost → final verdict reflects full compound exposure. Each brain module updates the shared evidence pack.

---

## Market Opportunity

| Customer | Pain | Value |
|----------|------|-------|
| Homeowners | Commit before discovering $100K surprise | Know before you close — 30 sec vs. 3 weeks |
| Small developers | $50K feasibility study kills ROI | $50/parcel |
| Real estate agents | Can't advise buyers on buildability | "Here's what it costs to build here" |
| Lenders | Construction loan defaults from hidden site risk | Pre-screening feasibility gate |
| Insurance companies | High loss ratios from poor underwriting | Site data before policy issuance |

---

## Credits

Built by **SMC Labs — Structures, Materials & Composites**  
Mobasher Group · Arizona State University

| Name | Email |
|------|-------|
| Chidchanok Pleesudjai | [cpleesud@asu.edu](mailto:cpleesud@asu.edu) |
| Devansh Patel | [dpatel52@asu.edu](mailto:dpatel52@asu.edu) |
| Prof. Barzin Mobasher | [barzin@asu.edu](mailto:barzin@asu.edu) |

- Stormwater: USDA Rational Method
- Costs: RSMeans + EPA cost databases with ENR CCI inflation
- Codes: ACI 318-19, ACI 360R-10, ASCE 7-22, IBC 2021, PTI DC80.3-16, ASTM D4829
- AI: Claude Sonnet 4.6 (Anthropic) — translator and insight layer only
