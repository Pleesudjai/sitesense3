# /execute — SiteSense Implementation

Use in a FRESH session to implement a spec. Load only: `CLAUDE.md` + the spec file.

## Before Coding
- Confirm which spec file we're executing (`specs/[name].md`)
- Confirm which layer: frontend / netlify-function / backend-module / ai-prompt
- Load the relevant domain rule:
  - Frontend work → read `.claude/rules/frontend.md`
  - Netlify function / backend → read `.claude/rules/backend.md`
  - Claude prompt / AI layer → read `.claude/rules/ai-layer.md`

## SiteSense Layer Guide

### Netlify Function (analyze.py / report.py)
- Entry points: `netlify/functions/analyze.py` and `report.py`
- They add `src/backend/` to `sys.path` — import any backend module from there
- Return format: `{"statusCode": 200, "body": json.dumps({...})}`
- Test locally: `netlify dev` from project root

### Backend Module (src/backend/)
- `data/` — each GIS API has its own file (elevation.py, flood.py, soil.py, etc.)
- `engineering/` — pure calculation functions, no API calls
- `ai/translate.py` — builds Claude prompt and returns 6-section dict
- `report/pdf_report.py` — takes analysis dict → PDF bytes

### Frontend Component (src/frontend/src/components/)
- All map operations go through `MapView.jsx` only
- API calls go through `src/frontend/src/api.js` (`analyzeParcel()`, `downloadReport()`)
- Keep components under 150 lines

## Implementation Rules
- Follow spec steps in order — check off each as done
- Report blockers immediately — don't spend >5 min stuck
- After each file: manually verify it doesn't break existing flow
- Never remove the `vite.config.js` mapbox-gl → maplibre-gl alias

## When Done
Run `/commit` to log decisions and git commit.
Then test against the 3 demo addresses in CLAUDE.md.
