# Session Handoff
Date: 2026-03-23 ~1:30 AM
Focus: Brain feedback loops, seismic fix, Q&A speed, PDF report, contour fix, hackathon submission, docs

## Completed This Session

### Brain Feedback Loops (4 new — analyze.js)
- Foundation Advisor → upgrades baseline if-else foundation type via keyword matching + severity ranking
- Cost Forecaster → compound premiums (+8-33%) feed back into actual costs.total_now
- Fire Risk → Very High +12%, High +6% cost uplift applied to site prep estimate
- Runoff → NOAA Atlas 14 rainfall + HSG-adjusted C-values replace fixed defaults

### Seismic API Fix (analyze.js)
- Old USGS endpoint dead (404) → new ASCE 7-22 API (`/ws/designmaps/asce7-22.json`)
- LA now correctly returns SDC D (Ss=2.25) instead of SDC A
- Regional defaults for CA, Pacific NW, New Madrid, Intermountain West, AZ

### Weighted Verdict (analyze.js)
- Strategist uses weighted scoring: foundation×3, stormwater×2, site×1, cost×1 + compound bonus
- 4 verdict levels: Good Candidate / Proceed with Caution / Moderate Risk / High Risk

### Contour Lines (ElevationChart.jsx)
- SSURGO WMS now renders below contour GeoJSON (was on top, hiding black lines)
- Density targets 8-15 lines (was 5), 6x upsampling for coarse grids
- Labels use `symbol-placement: line` for short mountainous loops

### Cost Model (analyze.js)
- Priced off ~2,500 SF building footprint, not full lot buildable area
- Cut/fill scaled down for large parcels — prevents inflated $1.5M+ screening estimates

### PDF Report (ReportGenerator.jsx)
- Added 2 new pages: AI Brain Analysis + Site Design Recommendations
- Shows expert findings table, compound premiums, fire uplift, data sources
- html2pdf.js attempted but too unreliable → reverted to printable HTML (Ctrl+P)

### Engineering Q&A (engineering_assist.js)
- Switched to Haiku (3x faster than Sonnet) — responds in <5 seconds
- Slim context: 15 key fields instead of full analysis result
- Fixed markdown code fence stripping (`\`\`\`json` wrapper)
- Fixed nested JSON parsing (Haiku wraps answer in extra JSON layer)
- Skip GIS fetch when API key is available (Claude doesn't need it)

### Time Budget (analyze.js)
- Global 22s compute + 4s buffer prevents Netlify 504 timeouts
- Each Claude call checks remaining time, skips if <4s left
- Per-call timeout races against budget (max 8s per expert)

### Draw Tool (MapView.jsx)
- Minimum rectangle size (~30m each dimension) prevents line-like parcels

### Error Handling (App.jsx)
- "Failed to fetch" shows user-friendly message with guidance
- Moderate Risk verdict gets orange color styling

### New Repo + Deploy
- Code pushed to github.com/Pleesudjai/sitesense3
- Netlify auto-deploy at musical-cuchufli-3cd9f8.netlify.app
- ANTHROPIC_API_KEY set in Netlify dashboard
- Vite proxy updated to new Netlify URL

### Documentation
- specs/structural-ai-brain-architecture.md — full AS-BUILT section verified against code
- SiteSense_Claude_Role.pptx — 8 slides explaining how Claude works in the brain
- docs/project-brief.md — complete project brief with market opportunity + competitive moat
- docs/concept-notes.md — added neurosymbolic insight, fracture mechanics connection, deep analysis
- docs/video-prompts.md — Sora/Banana Pro/social prompts + 2-min live demo script
- docs/decisions.md — session 3 decision log (10 items)

### Hackathon Submission
- Submitted to HackASU 2025, Track 3 — Economic Empowerment & Education
- Project name: SiteSense
- Tagline: "Draw your lot on a satellite map — get a code-compliant feasibility study in 30 seconds."

## Current State

### Working end-to-end
- Site Analysis: draw parcel → 15 GIS → 6 experts → compound risks → feedback loops → weighted verdict
- House Concept: specs → standard layout + cost + site-responsive floor plan
- Build Now or Wait: government indicators → line chart + timing table
- Engineering Q&A: Haiku-powered, fast responses, code citations, JSON parsed correctly
- PDF Report: printable HTML with AI Brain Analysis + Site Design pages (Ctrl+P to save)

### Built but needs testing
- Claude expert extensions (rules-first-then-Claude) — rules always work, Claude adds [AI INSIGHT] when API key is available and time budget allows
- Foundation feedback loop upgrade — verified via dry-run (LA got DEEP_PILE_SEISMIC correctly)
- Fire cost uplift — verified via dry-run (LA got +12% fire uplift)

### Known Issues
- PDF is printable HTML, not direct download — html2pdf.js had blank page rendering issues
- Engineering Q&A may still timeout on complex questions if Haiku is slow
- Contour labels may not appear on very flat terrain (<5 ft relief)
- User persona dropdown exists but doesn't change output
- Some GIS APIs occasionally return HTML errors instead of JSON (flood, wetlands)

## Next Steps (priority order)
1. Demo rehearsal with 3 test addresses (Tempe AZ, LA CA, NYC NY)
2. Screen record a 2-minute demo for submission
3. Prepare for sponsor discussions — lead with "risk management" framing
4. Future: real PDF download (server-side generation), persona-aware output, live NOAA Atlas 14

## Deploy Status
- **Netlify:** https://musical-cuchufli-3cd9f8.netlify.app
- **GitHub:** https://github.com/Pleesudjai/sitesense3
- **ANTHROPIC_API_KEY:** [x] set in Netlify dashboard
- **Last deploy:** 2026-03-23 ~1:00 AM (commit c04e246)
- **Hackathon:** SUBMITTED

## Open Questions
- [ ] Sponsor discussions — potential funding for real project
- [ ] Future: server-side PDF generation (ReportLab Python or Puppeteer)
- [ ] Future: live NOAA Atlas 14 API integration for rainfall data
- [ ] Future: RSMeans or contractor bid API for real cost data

## Files Modified This Session
- `netlify/functions/analyze.js` — seismic API, feedback loops, weighted verdict, time budget, cost model, runoff
- `netlify/functions/engineering_assist.js` — Haiku, slim prompt, JSON parsing, GIS skip
- `src/frontend/src/components/ElevationChart.jsx` — contour layer order, density, labels, upsampling
- `src/frontend/src/components/ReportGenerator.jsx` — 2 new pages, fire/cost/runoff data, reverted to HTML
- `src/frontend/src/components/ReportButton.jsx` — simplified back to HTML approach
- `src/frontend/src/components/MapView.jsx` — minimum rectangle size
- `src/frontend/src/components/EngineeringAssistant.jsx` — slim context (15 fields)
- `src/frontend/src/App.jsx` — Moderate Risk color, better error message
- `src/frontend/vite.config.js` — proxy URL updated
- `specs/structural-ai-brain-architecture.md` — AS-BUILT section
- `docs/decisions.md` — session 3 log
- `docs/project-brief.md` — complete brief with market + moat + deep analysis
- `docs/concept-notes.md` — neurosymbolic insight, fracture mechanics, pitch lines
- `docs/video-prompts.md` — Sora/Banana prompts + demo script
- `scripts/create-claude-role-pptx.js` — generated Claude Role presentation
