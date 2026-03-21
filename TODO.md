# SiteSense — Handoff to Alienware
# Updated: 2026-03-21 | Switching computers

---

## Switching Computers

- **GitHub:** https://github.com/Pleesudjai/sitesense
- **Live URL:** https://ornate-marigold-192751.netlify.app
- Clone and setup on Alienware:
  ```bash
  git clone https://github.com/Pleesudjai/sitesense.git
  cd sitesense/src/frontend
  npm install
  ```
- For local dev: `netlify dev` from project root (needs Netlify CLI: `npm i -g netlify-cli`)
- Vite dev server runs on port 5173/5175/5176 — Vite proxies `/api` to Netlify Functions on port 9000
- Or just use the live Netlify URL for testing (no setup needed, no build credits for viewing)

---

## What's Working

- Satellite map (MapLibre + Esri World Imagery, no token needed)
- Address search (Nominatim/OSM geocoding, free, no key)
- Rectangle draw tool with live preview + hint overlays
- Netlify Functions backend (`analyze.js`) — all GIS queries run server-side
- 14 GIS data layers: elevation (USGS 3DEP), flood (FEMA NFHL), soil (USDA SoilWeb), seismic (USGS NSHM), fire (rule-based), wetlands (USFWS NWI)
- Full soil engineering analysis: USCS classification, Atterberg limits (LL, PI), presumptive bearing capacity
- Geotechnical hazard flags: collapsible soil, liquefaction risk, organic soil, corrosion/sulfate attack
- Contour lines, heatmap, 3D surface views (dropdown toggle)
- Cut/fill calculator (grid prismatic method)
- Cost estimation with 10-year projection (4.5% ENR CCI inflation)
- AZ regional cost multipliers (Phoenix 0.95x, Tucson 0.88x, Flagstaff 1.05x)
- Claude AI plain-English 6-section report (claude-sonnet-4-6)
- Deployed on Netlify (frontend + JS functions, single platform)

---

## What's NOT Working / Needs Fix

- **Soil zone polygons not rendering on elevation chart** — SDA spatial query (`SDA_Get_Mupolygonkey`) may be unreliable. Just pushed a fix (`cdfe8a5`), needs testing.
- **ANTHROPIC_API_KEY** — verify it's still set in Netlify dashboard (was set via CLI previously). Without it, AI report generation and PDF won't work.
- **PDF download** — not tested end-to-end on live site
- **Unstaged changes** on current machine (may sync via Dropbox or need committing):
  - `src/frontend/src/App.jsx` — modified
  - `src/frontend/src/api.js` — modified
  - `src/frontend/src/components/ElevationChart.jsx` — modified
  - `netlify/functions/analyze.js` — modified (staged)

---

## Priority Tasks (Hackathon)

1. **Set/verify ANTHROPIC_API_KEY** in Netlify dashboard (Site settings > Environment variables) — enables Claude AI report
2. **Commit or stash unstaged changes** — check `git status` on Alienware after Dropbox syncs
3. **Test end-to-end:** draw polygon > click Analyze > verify all panels populate (risk cards, elevation chart, cost table, AI report)
4. **Test 3 demo addresses:**
   - `1900 E Apache Blvd, Tempe AZ` — expect Flood X, expansive soil, low risk
   - `5000 Main St, Houston TX 77002` — expect Flood AE, pile foundation
   - `2800 N Fort Valley Rd, Flagstaff AZ` — expect steep slope, snow load, high cut/fill
5. **Test PDF download** — click Download PDF after analysis completes
6. **UI polish:** error states (timeout > 26s), loading states, mobile responsive
7. **Pitch deck / demo preparation**

---

## Nice-to-Have

- Soil zones visualization fix (WMS backup already in place at low opacity)
- Reference: https://www.id.land/ for UI inspiration
- Address auto-complete suggestions
- Pre-cache demo results for offline fallback
- Rename Netlify site to `sitesense.netlify.app` (Site settings > Site name)

---

## Latest Commits (for context)

```
cdfe8a5 fix: rewrite soil zones with SDA_Get_Mupolygonkey + fallback
8a85571 feat: comprehensive soil engineering analysis + fix soil zones
560d56c feat: elevation display redesign + 13 GIS layers + full SSURGO soil
```

---

## How to Resume on Alienware

1. Open project folder (cloned repo or Dropbox-synced)
2. `cd src/frontend && npm install` (if fresh clone)
3. Start Claude Code session — it loads `CLAUDE.md` automatically
4. Check this `TODO.md` and start from Priority Tasks
5. Push any changes — Netlify auto-deploys from GitHub `main` branch
