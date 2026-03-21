# Decision Log
# Append new entries at the bottom using /commit command

---

## 2026-03-20 — Project Setup
**What was built:** WISC-based context engineering folder structure for the hackathon.
**Why:** Following Cole Medin's WISC framework to prevent context rot and keep AI sessions productive throughout the hackathon.
**Files created:**
- `CLAUDE.md` — global AI rules
- `.claude/commands/` — prime, plan-feature, execute, handoff, commit
- `.claude/rules/` — frontend, backend, ai-layer domain rules
- `docs/` — decisions log and handoff

**Next:** Choose one of the 8 project options, run `/plan-feature` to create a spec, then start building.

---

## 2026-03-20 — Project Selected: SiteSense (AI Land Feasibility Tool)
**Decision:** Build the SiteSense land feasibility tool — NOT one of the 8 original Arizona-only options.
**Why:** The team has a detailed battle plan (Hackathon Plan.pdf) for this. It directly fits Track 3
(Economic Empowerment) by democratizing access to $10K–$50K civil engineering feasibility studies.
The ACI 350-20 + ACI 360R-10 + ASCE 7-22 rule engine is the competitive moat vs. generic LLM tools.
Arizona-specific rules (caliche, expansive soil, ADWR washes, water adequacy) provide local differentiation.

**Track:** Track 3 — Economic Empowerment & Education
**Pitch framing:** Solving affordable housing crisis by removing engineering knowledge barrier

**Key ACI codes:**
- ACI 350-20 / 350R-20 — Environmental engineering concrete structures
- ACI 360R-10 — Slab-on-ground design
- ASCE 7-22 — Wind, seismic, flood, snow loads

**Stack finalized:** React + Vite + Tailwind + Mapbox GL JS (frontend) / Python FastAPI (backend)
**Deploy plan:** Vercel (frontend) + Render (backend)

**Next:** Scaffold frontend and backend in src/, implement USGS elevation API first.

---

## 2026-03-20 — Deployment: Netlify (frontend) + Render (backend)
**Decision:** Frontend on Netlify, FastAPI backend on Render (free tier).
**Why:** FastAPI doesn't run natively as Netlify Functions. Render supports Python webservers.
Netlify proxies `/api/*` → Render backend, so no CORS issues and backend URL stays hidden.

**Files created:**
- `netlify.toml` (root) — Netlify build config, SPA redirect, API proxy to Render
- `src/frontend/netlify.toml` — same for if deploying from frontend subfolder
- `src/backend/render.yaml` — Render service definition
- `src/frontend/src/api.js` — updated to use `VITE_API_URL` env var in production

**Deploy steps:**
1. Push repo to GitHub
2. Render: New Web Service → connect repo → root dir `src/backend` → free tier
3. Render: Set `ANTHROPIC_API_KEY` in environment panel
4. Copy Render URL (e.g. `https://sitesense-api.onrender.com`)
5. Update `netlify.toml` proxy URL with actual Render URL
6. Netlify: New site → connect repo → Netlify auto-reads `netlify.toml`
7. Netlify: Set `VITE_MAPBOX_TOKEN` in environment variables panel
