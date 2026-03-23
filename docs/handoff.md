# Session Handoff
Date: 2026-03-23 ~12:00 AM
Focus: Brain Feedback Loops, Seismic Fix, Q&A Speed, PDF Report, Hackathon Submission

## Completed This Session

### Brain Feedback Loops (4 new)
- Foundation Advisor → upgrades baseline foundation type + recalculates costs
- Cost Forecaster → compound premiums (+8-33%) applied to actual total_now
- Fire Risk → +6-12% cost uplift for High/Very High zones
- Runoff → NOAA Atlas 14 rainfall + HSG-adjusted C-values

### Seismic API
- Fixed dead USGS endpoint → new ASCE 7-22 API
- LA now SDC D (was incorrectly SDC A)
- Regional defaults for CA, Pacific NW, New Madrid, Intermountain West

### Weighted Verdict
- Expert weights: foundation×3, stormwater×2, site×1, cost×1
- 4 levels: Good Candidate / Proceed with Caution / Moderate Risk / High Risk

### Contour Lines
- SSURGO WMS renders below contour GeoJSON (was hiding black lines)
- Density targets 8-15 lines, 6x upsampling for coarse grids
- Labels use line placement for short mountainous loops

### PDF Report (Printable HTML)
- 2 new pages: AI Brain Analysis + Site Design Recommendations
- Shows expert findings, compound premiums, fire uplift, data sources
- Reverted from html2pdf.js to printable HTML (Ctrl+P to save)

### Engineering Q&A
- Switched to Haiku (fast, <10s responses)
- Slim context (15 fields instead of full analysis)
- Fixed JSON parsing (markdown fences, nested JSON)

### Cost Model
- Priced off ~2,500 SF footprint, not full lot
- Cut/fill scaled for large parcels

### Infrastructure
- New repo: github.com/Pleesudjai/sitesense3
- New Netlify: musical-cuchufli-3cd9f8.netlify.app
- Time budget prevents Netlify 26s timeout
- ANTHROPIC_API_KEY set in Netlify dashboard

## Current State

### Working end-to-end
- Site Analysis: draw → 15 GIS → 6 experts → compound risks → feedback loops → weighted verdict
- House Concept: specs → layout + cost + floor plan
- Build Now or Wait: government indicators → line chart + timing table
- Engineering Q&A: Haiku-powered, fast responses, code citations
- PDF Report: printable HTML with AI brain analysis + site design pages

### Known Issues
- PDF is printable HTML (Ctrl+P), not direct download — html2pdf.js had rendering issues
- Engineering Q&A may timeout on very complex questions with large site context
- Contour labels may not appear on very flat terrain (<5 ft relief)
- User persona dropdown exists but doesn't change output

## Deploy Status
- **Netlify:** https://musical-cuchufli-3cd9f8.netlify.app
- **GitHub:** https://github.com/Pleesudjai/sitesense3
- **ANTHROPIC_API_KEY:** set in Netlify dashboard
- **Hackathon:** SUBMITTED to HackASU 2025, Track 3
