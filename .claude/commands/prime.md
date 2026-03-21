# /prime — SiteSense Session Initialization

Run this at the START of every new Claude Code session.

## Steps

1. **Read global rules:**
   Read `CLAUDE.md` — has the full as-built architecture, stack, free APIs, Netlify function setup, and coding standards.

2. **Check decisions:**
   Read `docs/decisions.md` — running log of what was built and why.

3. **Check last handoff:**
   Read `docs/handoff.md` — last session's completed work, broken items, and next steps.

4. **Check TODO list:**
   Read `TODO.md` if it exists — outstanding tasks and priorities.

5. **Scan current source:**
   List files in:
   - `netlify/functions/` — Python Lambda handlers
   - `src/frontend/src/` — React components
   - `src/backend/` — engineering modules (data, engineering, ai, report)

6. **Check git log:**
   ```bash
   git log --oneline -10
   ```

7. **Report back — 5 bullets:**
   - Project: SiteSense — what stage are we at?
   - What is fully working (end-to-end tested)?
   - What is built but untested or broken?
   - What still needs to be built?
   - Any open blockers (API key, CORS, deploy issue)?

## SiteSense Quick Reference
- **Live:** https://ornate-marigold-192751.netlify.app
- **GitHub:** https://github.com/Pleesudjai/sitesense
- **Backend:** Netlify Functions at `netlify/functions/analyze.py` and `report.py`
- **Key env var:** `ANTHROPIC_API_KEY` — must be set in Netlify dashboard
- **CRITICAL:** `vite.config.js` aliases `mapbox-gl` → `maplibre-gl` — do not remove
- **Demo addresses:** Tempe AZ, Houston TX flood zone, Flagstaff AZ hillside
