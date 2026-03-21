# Hackathon ASU 2025 — Global AI Rules
# Context Engineering: WISC Framework
# Keep this file under 500 lines. Load heavy docs via sub-agents only.

## Project Overview
**Event:** HackASU 2025
**Team:** Mobasher Group
**Domain:** Civil/Structural Engineering AI tools for Arizona infrastructure
**Date:** March 20–21, 2025

## Selected Project — SiteSense: AI-Powered Land Feasibility Tool
**Track 3: Economic Empowerment & Education (HackASU 2025)**
**Framing: Democratizing access to civil engineering feasibility studies for affordable housing**

**One-Line Pitch:** "Drop a pin, draw your lot — get a code-compliant feasibility study in 30 seconds.
What used to cost $50,000 and 3 weeks now takes half a minute."

### What It Does
User draws a polygon on a satellite map → app auto-pulls:
- DEM elevation grid (USGS 3DEP) for the polygon + 100m buffer
- GIS risk layers: flood zone (FEMA), seismic (USGS), soil (USDA), wetlands (USFWS), fire (USGS)
- Runs civil engineering calculations: slope, cut/fill volumes, foundation type, structural loads, stormwater
- Generates ROM cost estimate + 10-year projection (4.5% ENR CCI inflation)
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

### API Keys Needed
```
MAPBOX_TOKEN=        # Mapbox GL JS + Geocoding (free tier)
ANTHROPIC_API_KEY=   # Claude Sonnet 4.6
```
All GIS APIs (USGS, FEMA, USDA, USFWS, seismic) are FREE — no auth required.

### 3 Pre-Cached Demo Addresses
1. Phoenix AZ flat lot (Flood Zone X) — expansive soil, low risk baseline
2. Houston TX (Flood Zone AE) — pile foundation required
3. Flagstaff AZ hillside — steep slope, 40psf snow, high cut/fill

## Architecture Conventions

### Stack
- **Frontend:** React + Vite + Tailwind CSS — fast scaffold, great for maps
- **Map:** Mapbox GL JS + `@mapbox/mapbox-gl-draw` — satellite view + polygon drawing
- **Charts:** Recharts — elevation profiles and cross-sections
- **Backend:** Python FastAPI — async, lightweight, you know Python well
- **AI Layer:** Claude API (claude-sonnet-4-6) — translation layer only, not the engineer
- **PDF:** ReportLab — server-side PDF generation
- **Geometry:** Shapely + NumPy — polygon buffering, grid calculations
- **Deploy:** Vercel (frontend) + Render (backend) — free tier, fast

### File Organization
```
Hackathon ASU 2025/
├── CLAUDE.md                    ← You are here (global rules, always loaded)
├── .claude/
│   ├── rules/                   ← Domain rules (load only when working in that area)
│   ├── docs/                    ← Heavy reference (sub-agent scouts only)
│   └── commands/                ← Slash commands
├── specs/                       ← Feature specs
├── docs/                        ← Decisions, handoffs, project brief
└── src/
    ├── frontend/                ← React + Vite + Tailwind + Mapbox
    │   └── src/components/
    │       ├── MapView.jsx      # Satellite map + polygon draw
    │       ├── RiskCards.jsx    # Traffic-light risk indicators
    │       ├── ElevationChart.jsx
    │       ├── CutFillVisual.jsx
    │       ├── CostTable.jsx    # Now / 5yr / 10yr projection
    │       └── ReportButton.jsx
    └── backend/                 ← Python FastAPI
        ├── main.py              # /analyze + /report endpoints
        ├── data/                # GIS API connectors
        ├── engineering/         # ACI/ASCE rule engine
        ├── ai/                  # Claude API layer
        └── report/              # ReportLab PDF
```

## Coding Standards

### General
- Write readable, demo-ready code — clarity beats cleverness at a hackathon
- Every function must have a one-line comment explaining its purpose
- Use consistent naming: `snake_case` for Python, `camelCase` for JS
- No dead code. No TODO comments in final demo code.
- Keep files under 300 lines — split if larger

### Python Backend
- Use FastAPI for any REST endpoints
- Use `httpx` for external API calls (async-friendly)
- Store config (API keys, etc.) in `.env` — never hardcode
- Return structured JSON responses: `{"status": "ok", "data": {...}, "message": "..."}`

### Frontend
- Mobile-responsive layouts using CSS Grid or Flexbox
- Use clean, professional design — judges will see this
- Map components: use Leaflet.js for any GIS/map features
- Minimal dependencies — avoid heavy frameworks unless necessary

### AI Layer (Claude API)
- Always use structured prompts with clear role + task + output format
- Return machine-parseable JSON from Claude when feeding other systems
- Log all Claude API calls to `docs/decisions.md` with timestamp + token count
- Never put raw user input directly into prompts — sanitize first

## Testing Strategy
- Manual test each feature before demo — no automated tests needed for hackathon MVP
- Test with real Arizona data: use AZGS, ADOT, Maricopa County public datasets
- Test edge cases: missing data, extreme values, error states

## Context Management (WISC Rules)

### Write
- After every major feature: run `/commit` to log decisions
- When context gets long (>50 messages): run `/handoff` to create summary
- All architectural decisions go in `docs/decisions.md`

### Isolate
- Use sub-agents for research (web search, reading long docs)
- Sub-agents return concise summaries — never dump raw content into main context
- Never use sub-agents for implementation — only research and planning

### Select
- Load `.claude/rules/frontend.md` only when building UI
- Load `.claude/rules/backend.md` only when building API
- Load `.claude/rules/ai-layer.md` only when working on Claude integration
- Load `.claude/docs/` files only via sub-agent scouts

### Compress
- Use `/compact` or `/handoff` when conversation exceeds ~100 messages
- Fresh sessions get only: CLAUDE.md + relevant spec file

## Demo Checklist
- [ ] Working web interface (no broken UI)
- [ ] At least one real Arizona dataset integrated
- [ ] Claude AI generating a meaningful output (report, recommendation, etc.)
- [ ] Clear value proposition explained in 30 seconds
- [ ] Error states handled gracefully (no crashes during demo)
