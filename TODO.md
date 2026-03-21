# SiteSense — TODO List
# Updated: 2026-03-20 | Pick up from any machine via Dropbox sync

---

## CRITICAL (must work before demo)

### 1. Set ANTHROPIC_API_KEY on Netlify
- Go to: Netlify dashboard → Site → Environment variables
- Add: `ANTHROPIC_API_KEY` = your Anthropic key
- Then: Trigger redeploy (or it auto-deploys on next push)
- **Without this, the AI report and PDF will fail**

### 2. End-to-End Test
- Open https://ornate-marigold-192751.netlify.app
- Draw a polygon over a Phoenix lot
- Click **Analyze Parcel**
- Verify: risk cards, elevation chart, cost table, AI report all populate
- Verify: **Download PDF** button produces a real PDF

### 3. Test All 3 Demo Addresses
Search each, draw polygon, run analysis:
- `1900 E Apache Blvd, Tempe AZ` → expect Flood X, expansive soil
- `5000 Main St, Houston TX 77002` → expect Flood AE, pile foundation
- `2800 N Fort Valley Rd, Flagstaff AZ` → expect steep slope, snow load

---

## HIGH PRIORITY (nice to have before demo)

### 4. Error Handling Polish
- If Netlify Function times out (>26s) show friendly message, not blank
- If USGS elevation API fails for a location, show fallback message
- Current: errors silently fail on the right panel

### 5. Loading UX
- Currently shows spinner but no progress steps
- Consider: "Fetching elevation… Checking flood zone… Running calculations…"
- File: `src/frontend/src/App.jsx` (loading state section)

### 6. Map: Fly to Polygon After Analysis
- After results come back, map should zoom to the analyzed polygon
- Currently: marker added but map doesn't auto-zoom
- Fix in: `src/frontend/src/components/MapView.jsx` — add `map.fitBounds(bbox)` in result useEffect

### 7. Risk Cards — Show Actual Values
- Currently risk cards show static flags (HIGH/LOW)
- Add the actual value underneath each card (e.g., "Zone AE", "SDC D", "35% slope")
- File: `src/frontend/src/components/RiskCards.jsx`

---

## MEDIUM PRIORITY (polish)

### 8. Address Search — Show "Not Found" Toast
- Currently if address not found, map just stays put with no feedback
- Add a small error toast: "Address not found — try a more specific address"
- Fix in: `src/frontend/src/components/MapView.jsx` (geocodeAddress returns null)

### 9. Pitch Deck — Update Live URL
- `HackASU_SiteSense_Pitch_Deck.pptx` needs the live Netlify URL on slide 7
- Run `make_deck.py` again or edit the PPTX directly
- URL: https://ornate-marigold-192751.netlify.app

### 10. Pre-Cache Demo Results (Optional)
- For reliability during demo, save JSON results for the 3 test addresses
- Load from local file if API fails ("offline mode" fallback)

---

## LOW PRIORITY (if time allows)

### 11. Mobile Responsive Check
- Open on phone and verify layout doesn't break
- Map + dashboard stack vertically on mobile

### 12. Arizona Water Adequacy Flag
- Backend `az_specific.py` mentioned in plan but not fully built
- Add ADWR Active Management Area lookup
- Flag: "Does this parcel have a 100-year water adequacy certificate?"

### 13. Custom Netlify Domain
- Current URL is auto-generated (ornate-marigold-192751.netlify.app)
- Can rename to `sitesense.netlify.app` in Netlify → Site settings → Site name
- Free, just a cosmetic change

---

## DONE ✅

- [x] React + Vite + Tailwind frontend scaffolded
- [x] MapLibre GL JS map (no token, free Esri satellite)
- [x] Address search via Nominatim OSM (free, no key)
- [x] Polygon draw tool (@mapbox/mapbox-gl-draw aliased to maplibre-gl)
- [x] USGS 3DEP elevation grid (async 20×20 grid)
- [x] FEMA NFHL flood zone API
- [x] USDA SoilWeb soil/caliche/shrink-swell API
- [x] USGS NSHM seismic API
- [x] Wildfire risk (AZ rule-based)
- [x] USFWS NWI wetlands API
- [x] ACI 350-20 / ACI 360R-10 / ASCE 7-22 foundation rule engine
- [x] Cut/fill calculator (grid prismatic method, numpy)
- [x] ROM cost estimate + 10-year projection (4.5% ENR CCI)
- [x] AZ regional cost multipliers (Phoenix 0.95×, Tucson 0.88×, Flagstaff 1.05×)
- [x] Claude AI plain-English 6-section report
- [x] ReportLab PDF (in-memory bytes for Lambda)
- [x] Netlify Functions (analyze.py + report.py)
- [x] GitHub repo: https://github.com/Pleesudjai/sitesense
- [x] Deployed on Netlify (frontend + backend functions, one platform)
- [x] 7-slide pitch deck generated (HackASU_SiteSense_Pitch_Deck.pptx)

---

## How to Resume on Alienware

1. Open project in VS Code: `C:\Users\chidc\ASU Dropbox\Mobasher_Group\Hackathon ASU 2025`
2. Start Claude Code session — it will load CLAUDE.md automatically
3. Run `/prime` to load full context
4. Check this TODO.md and start from **CRITICAL** items
5. Push any changes — Netlify auto-deploys from GitHub
