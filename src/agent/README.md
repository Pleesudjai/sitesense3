# SiteSense Agent — Maricopa MVP

TypeScript backend that runs the SiteSense feasibility report as an autonomous Claude agent. Wraps `@anthropic-ai/claude-agent-sdk` with one MCP tool (`parcel_lookup`) for Maricopa County.

## Layout

```
src/agent/
├── src/
│   ├── agent.ts              entry — runFeasibilityAgent(apn)
│   ├── prompt.ts             system prompt
│   ├── types.ts              ParcelRecord, FeasibilityReport, Citation
│   └── mcp/
│       ├── server.ts         in-process MCP server registering tools
│       └── parcel_lookup.ts  Tool 1 — Maricopa parcel by APN
└── test/
    ├── parcel_lookup.test.ts standalone tool test (no API key needed)
    └── e2e.test.ts           agent loop end-to-end (needs ANTHROPIC_API_KEY)
```

## Setup

```bash
cd src/agent
npm install
cp .env.example .env   # then paste your ANTHROPIC_API_KEY
```

## Run

Standalone tool test (no Claude API needed):
```bash
npm run test:parcel -- 12345678
```

Full agent loop (needs ANTHROPIC_API_KEY):
```bash
npm run test:e2e -- 12345678
```

CLI:
```bash
npm run dev -- 12345678
npm run dev -- "1435 N Dorsey Ln, Tempe AZ 85288"
```

## HTTP server

Standalone HTTP server exposing the agent as an API:

```bash
npm run serve
```

Listens on `http://localhost:3001` by default (override via `PORT` env var).

Endpoints:
- `GET  /healthz` — liveness check
- `POST /api/feasibility` — body `{ "input": "<APN or address>" }` returns `{ report, raw_text, tool_calls, elapsed_ms }`

CORS allows any origin by default (override via `ALLOWED_ORIGIN` env var).

Test:
```bash
curl http://localhost:3001/healthz
curl -X POST -H 'Content-Type: application/json' \
  -d '{"input":"2092 E 10th St, Tempe AZ 85281"}' \
  http://localhost:3001/api/feasibility
```

## Deployment

The agent is intentionally **not** a Netlify Function — the Agent SDK is heavy and the loop runs longer than the Netlify Pro 26-second sync timeout. Deploy as a standalone Node service:

- **Render**: `Build cmd: cd src/agent && npm install` / `Start cmd: cd src/agent && npm run serve`. Free tier works for low traffic; spin-down on idle.
- **Fly.io / Railway**: same pattern, longer cold-start budgets.
- **AWS Lambda (with extended timeout)**: containerized.

The hackathon React frontend at `src/frontend/src/api.js` already has a `runFeasibilityAgent(input)` client that POSTs to `VITE_AGENT_URL/api/feasibility` (defaults to `http://localhost:3001`).

## Endpoint to verify

`MARICOPA_PARCEL_REST` defaults to:
```
https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query
```
This URL pattern matches Maricopa County Assessor's public ArcGIS REST. If the parcel test returns 404 or empty features, browse [the assessor REST root](https://gis.mcassessor.maricopa.gov/arcgis/rest/services) to find the current parcels layer and override via env:
```bash
MARICOPA_PARCEL_REST=https://...your-real-url.../query npm run test:parcel -- 12345678
```

The output schema (`ParcelRecord`) is stable; only the URL needs to change if the assessor moves the layer.

## Next tools (in priority order)

1. `flood_zone` — FEMA NFHL by centroid
2. `topo_slope` — USGS 3DEP DEM, return slope stats over the parcel
3. `zoning_lookup` — Maricopa zoning + dimensional rules (the moat)
4. `utility_avail` — ADWR / SRP / APS by centroid
5. `title_pull` — DataTree or First American (paid)
6. `comps_cost` — MLS / RSMeans
7. `report_builder` — calls existing `docx` skill, returns 1-page PDF

## Why the SDK

See [docs/agent-sdk-architecture.md](../../docs/agent-sdk-architecture.md). Short version: a script can fetch data; only an agent can cross-reference 8 sources and reason about the interactions (zoning × slope × deed × utility availability) with citation-grounded output.
