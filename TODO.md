# SiteSense — TODO List
# Updated: 2026-03-21 | Pick up from any machine via Dropbox sync

---

## CRITICAL (must work before demo)

### 1. End-to-End Test on Live Site
- Open https://ornate-marigold-192751.netlify.app
- Draw a rectangle over a Phoenix lot
- Click **Analyze Parcel**
- Verify: risk cards, elevation chart, cost table, AI report all populate
- Verify: **Download PDF** button produces a real PDF
- Status: ANTHROPIC_API_KEY already set via Netlify CLI ✅

### 2. Test All 3 Demo Addresses
Search each, draw rectangle, run analysis:
- `1900 E Apache Blvd, Tempe AZ` → expect Flood X, expansive soil
- `5000 Main St, Houston TX 77002` → expect Flood AE, pile foundation
- `2800 N Fort Valley Rd, Flagstaff AZ` → expect steep slope, snow load

---

## HIGH PRIORITY (nice to have before demo)

### 3. Error Handling Polish
- If Netlify Function times out (>26s) show friendly message, not blank
- If USGS elevation API fails for a location, show fallback message
- Current: errors silently fail on the right panel

### 4. Loading UX — Step-by-Step Progress
- Currently shows spinner but no progress steps
- Consider: "Fetching elevation… Checking flood zone… Running calculations…"
- File: `src/frontend/src/App.jsx` (loading state section)

### 5. Risk Cards — Show Actual Values
- Currently risk cards show static flags (HIGH/LOW)
- Add the actual value underneath each card (e.g., "Zone AE", "SDC D", "35% slope")
- File: `src/frontend/src/components/RiskCards.jsx`

### 6. Map: Auto-Zoom to Polygon After Analysis
- After results come back, map should zoom to analyzed polygon bbox
- Already partially implemented in MapView.jsx result useEffect — verify it works
- File: `src/frontend/src/components/MapView.jsx`

---

## MEDIUM PRIORITY (polish)

### 7. Pitch Deck — Update Live URL
- `HackASU_SiteSense_Pitch_Deck.pptx` needs the live Netlify URL on slide 7
- URL: https://ornate-marigold-192751.netlify.app

### 8. Pre-Cache Demo Results (Reliability)
- For reliability during demo, save JSON results for the 3 test addresses
- Load from local file if API fails ("offline mode" fallback)

---

## LOW PRIORITY (if time allows)

### 9. Mobile Responsive Check
- Open on phone and verify layout doesn't break
- Map + dashboard stack vertically on mobile

### 10. Custom Netlify Domain
- Current URL is auto-generated (ornate-marigold-192751.netlify.app)
- Can rename to `sitesense.netlify.app` in Netlify → Site settings → Site name

---

## DONE ✅

- [x] React + Vite + Tailwind frontend scaffolded
- [x] MapLibre GL JS map (no token, free Esri satellite tiles)
- [x] Address search via Nominatim OSM (free, no key)
- [x] 2-click rectangle draw tool (replaced MapboxDraw — simpler, no toolbar confusion)
- [x] Map locked top-down (dragRotate/pitchWithRotate/touchPitch all false)
- [x] Rectangle live preview on mousemove
- [x] Hint overlays: "Click first corner" → "Click opposite corner" → "✓ Parcel selected"
- [x] Address search error toast (4s auto-dismiss)
- [x] USGS 3DEP elevation grid (10×10 for Lambda safety)
- [x] FEMA NFHL flood zone API
- [x] USDA SoilWeb soil/caliche/shrink-swell API
- [x] USGS NSHM seismic API
- [x] Wildfire risk (AZ rule-based)
- [x] USFWS NWI wetlands API
- [x] ACI 350-20 / ACI 360R-10 / ASCE 7-22 foundation rule engine
- [x] Cut/fill calculator (grid prismatic method, plain JS)
- [x] ROM cost estimate + 10-year projection (4.5% ENR CCI)
- [x] AZ regional cost multipliers (Phoenix 0.95×, Tucson 0.88×, Flagstaff 1.05×)
- [x] Claude AI plain-English 6-section report (claude-sonnet-4-6)
- [x] Netlify Functions rewritten in JS (analyze.js + report.js) — Python was silently ignored
- [x] @netlify/plugin-functions-install-core — auto-installs function deps at deploy
- [x] Elevation chart: 2D heatmap + 3D surface (dropdown toggle)
- [x] 3D surface: oblique projection, painter's algorithm, shared color scale
- [x] GitHub repo: https://github.com/Pleesudjai/sitesense
- [x] Deployed on Netlify (frontend + JS functions, one platform, no separate server)
- [x] ANTHROPIC_API_KEY set in Netlify environment via CLI
- [x] Local dev: `netlify dev` (port 9000) + Vite proxy (open Vite port directly)
- [x] React StrictMode double-mount fix (map.current = null on cleanup)

---

## Local Dev Workflow

```bash
# From project root:
netlify dev

# Then open in browser: http://localhost:5175 (or whatever port Vite picks)
# Functions run at port 9000 — Vite proxies /api there automatically
```

## How to Resume on Any Machine

1. Open project in VS Code: `C:\Users\chidc\ASU Dropbox\Mobasher_Group\Hackathon ASU 2025`
2. Start Claude Code session — it loads CLAUDE.md automatically
3. Run `/prime` to load full context
4. Check this TODO.md and start from **CRITICAL** items
5. Push any changes — Netlify auto-deploys from GitHub
