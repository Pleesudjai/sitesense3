# Session Handoff
Date: 2026-03-22 ~2:00 AM
Focus: AI Brain Architecture, Expert Layer, Compound Risk Detection, National Coverage, PDF Redesign, Floor Plan Engine

## Completed This Session

### Brain Architecture (Domain Brain pattern)
- `netlify/functions/analyze.js` — Full brain pipeline: evidence_pack assembly → expert router → 6 specialists → strategist → auditor → structured JSON output
- Rules-first-then-Claude pattern: deterministic rules ALWAYS run, Claude extends with [AI INSIGHT] additions when API key is available
- 14 compound risk checks across 4 experts (soil+slope, flood+drainage, caliche+slope, seismic+expansive, etc.)
- Cross-expert tradeoff detection in Parcel Strategist
- Data Quality Auditor can downgrade verdict when critical data is fallback-level

### Evidence Pack
- `assembleEvidencePack()` builds structured working memory: parcel, retrieval (14 layers with source/confidence/notes), computed, doctrine, assumptions, unknowns, provenance, confidence
- Every GIS layer has source attribution, query mode, and confidence level

### Data-Driven Site Design
- 9-zone pad scoring from actual elevation grid (flatness, relief, cut/fill, flood, wetland, soil penalties)
- 8-direction orientation scoring (terrain aspect 35%, solar 25%, west penalty, parcel shape, access)
- Climate zone detection → window strategy + room zoning with actual compass directions
- Driveway access from edge slope analysis

### National Coverage
- 15 fire zones, 11 wind speed zones, 35 metro cost multipliers, 50 states + 40 metros via BEA RPP
- Map defaults to continental US, expanded caliche detection, 7 regional Q&A blocks

### Floor Plan Engine
- Squarified treemap, zone-based, site-responsive facade assignment
- 2D SVG + 3D canvas with zoom/rotate/compass

### PDF Report Redesign
- 4-page user-first: verdict + constraints + cost/next-steps + appendix
- House Concept + Price Forecast pages included when data available

### Presentations
- `SiteSense_AI_Brain_v2.pptx` — 11 slides

## Current State

### Working end-to-end
- Site Analysis: draw parcel → 14 GIS → 6 experts → compound risks → structured report
- House Concept: specs → standard layout + cost + site-responsive floor plan
- Build Now or Wait: government indicators → line chart + timing table
- Engineering Q&A: rule-based answers (6 topics, works without API key)
- PDF Report: 4-6 page report from all workflows

### Built but untested with Claude API
- All 6 experts have Claude extension prompts (rules-first-then-Claude)
- Evidence pack sent to Claude for richer synthesis
- [AI INSIGHT] tag system ready

### Known Issues
- User persona dropdown exists but doesn't change output
- Elevation results may vary slightly between runs
- Netlify credits may need new account

## Next Steps (priority order)
1. Set ANTHROPIC_API_KEY in Netlify → experts upgrade instantly
2. Test 3 demo addresses end-to-end
3. Test PDF download for each scenario
4. Demo rehearsal

## Deploy Status
- Netlify: https://ornate-marigold-192751.netlify.app
- GitHub: https://github.com/Pleesudjai/sitesense
- ANTHROPIC_API_KEY: [ ] not set — rule-based fallback active
- Last deploy: 2026-03-22 ~1:40 AM (commit a99bd40)

## Open Questions
- [ ] Netlify credits — may need new account
- [ ] TinyFish API key — needs code change for their base URL
- [ ] User persona personalization not wired
