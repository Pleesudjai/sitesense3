# SiteSense — Agent SDK Architecture & YC Roadmap

**Saved:** 2026-05-08
**Source:** Conversation with Claude Code (CEE 790 Fracture Mechanics session, ELG personal-statement work)
**Trigger:** Question — "do I need the Claude Agent SDK for what I'm doing?"
**Answer:** Not for academic/engineering work; YES for SiteSense (the only product-class project where the SDK is the right tool).

---

## 1. Where the Claude Agent SDK fits

| Layer | What it is | SiteSense uses? |
|---|---|---|
| Anthropic API | Raw `claude.messages.create(...)` calls | No — too low-level |
| **Claude Agent SDK** (TypeScript) | Library that embeds Claude Code's agentic loop in your own app | **Yes — the engine of the SiteSense backend** |
| Claude Code (CLI / IDE) | Interactive agent: hooks, skills, agents, MCP, memory | Used during *development*, not in production |

The SDK is the right level because SiteSense is a product where users never see a chat window. They upload a parcel and an autonomous agent produces the report. The agentic loop (read → reason → call tool → reason → write) lives in the backend.

`npm install @anthropic-ai/claude-agent-sdk`

---

## 2. System architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  USER  (developer · homebuyer · planner · realtor · agency)     │
│  Inputs:   APN  ·  street address  ·  map pin                   │
│  Outputs:  PDF feasibility report + interactive web view        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  WEB APP    (Next.js + React + Mapbox/Leaflet)                  │
│  • Parcel picker (click map or paste APN)                       │
│  • Live progress (agent reasoning streamed back)                │
│  • Report viewer (sections, citations, map overlays)            │
│  • Auth, billing, history                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │  POST /analyze {apn}
                             │  WebSocket / SSE for streaming
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND    (Node.js + Express/Fastify)                         │
│  • Job queue (BullMQ / Redis)                                   │
│  • Auth, rate limit, cost cap per user                          │
│  • Logs: audit trail of every agent action + every tool call    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  CLAUDE AGENT  (@anthropic-ai/claude-agent-sdk)                 │
│                                                                 │
│  System prompt: "You are a site feasibility analyst.            │
│   Given a parcel, produce a structured feasibility report.      │
│   Cite every claim. Hedge interpretive claims. Stop when        │
│   max buildable envelope is determined or a red flag is found." │
│                                                                 │
│  Loop (autonomous, multi-step):                                 │
│    THINK  → which data do I need next?                          │
│    CALL   → MCP tool                                            │
│    READ   → tool result                                         │
│    REASON → does this contradict earlier findings?              │
│    WRITE  → append to report                                    │
│    REPEAT until report complete                                 │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────────┘
   │      │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌─────┬──────┬─────┬──────┬──────┬──────┬──────┬───────────┐
│ MCP │ MCP  │ MCP │ MCP  │ MCP  │ MCP  │ MCP  │ MCP       │
│Parcl│Zoning│FEMA │USGS  │Util  │Title │Comps │Report     │
│GIS  │Code  │Flood│Topo  │Avail │/Deed │/Cost │Builder    │
└──┬──┴──┬───┴──┬──┴──┬───┴──┬───┴──┬───┴──┬───┴───┬───────┘
   ▼     ▼      ▼     ▼      ▼      ▼      ▼       ▼
County  Local  FEMA  USGS   ADWR   Title  MLS /   docx skill
GIS     Plan   NFHL  3DEP   SRP    co.    public  PDF + JSON
        Dept   API   DEM    APS    APIs   sales
```

---

## 3. Agent decision flow (the moat)

This is the loop a junior planner runs in their head. The agent does it in 30 seconds, every time, with citations.

```
START  ─►  resolve APN
              │
              ▼
       ┌──────────────────────┐
       │  Pull parcel record  │  ← MCP: Parcel GIS
       │  • lot size          │
       │  • boundaries        │
       │  • current use       │
       └──────────┬───────────┘
                  ▼
       ┌──────────────────────┐
       │  Look up zoning      │  ← MCP: Zoning
       │  • allowed uses      │
       │  • setbacks          │
       │  • max FAR / height  │
       │  • parking ratios    │
       └──────────┬───────────┘
                  ▼
       ┌──────────────────────┐
       │  Pull constraints    │  ← MCP: FEMA flood
       │  • flood zone        │  ← MCP: USGS slope
       │  • slope > 15%?      │  ← MCP: Title/Deed
       │  • easements?        │
       │  • deed restrictions?│
       └──────────┬───────────┘
                  ▼
       ┌──────────────────────┐
       │  Cross-reference     │  ◄── AGENT REASONING
       │  Example: zoning     │      (the moat;
       │  allows 4 du/ac BUT  │      a script cannot do
       │  ESLO triggers at    │      this — too many
       │  15% slope → max 2   │      conditional branches)
       └──────────┬───────────┘
                  ▼
       ┌──────────────────────┐
       │  Compute envelope    │
       │  • buildable area    │
       │  • max footprint     │
       │  • max units / sf    │
       └──────────┬───────────┘
                  ▼
       ┌──────────────────────┐
       │  Pull utility avail. │  ← MCP: ADWR/SRP/APS
       │  Pull comps/cost     │  ← MCP: MLS/RSMeans
       └──────────┬───────────┘
                  ▼
       ┌──────────────────────┐
       │  Compose report      │  ← MCP: Report builder
       │  with citations      │      (existing
       │  + map overlays      │       docx skill)
       └──────────┬───────────┘
                  ▼
                 END
```

---

## 4. MCP tools to build (the unglamorous half)

| Tool name | Purpose | Data source | Build effort |
|---|---|---|---|
| `parcel_lookup` | APN/address → boundary, lot size, owner | County GIS REST API (Maricopa, Pima, Pinal) | Low — APIs public |
| `zoning_lookup` | Parcel → zoning code + dimensional rules | Local planning dept GIS + scraped code | **High** — every city different (this is the moat) |
| `flood_zone` | Parcel → FEMA flood zone | FEMA NFHL ArcGIS REST | Low |
| `topo_slope` | Parcel → slope analysis | USGS 3DEP DEM | Medium |
| `utility_avail` | Parcel → water/sewer/power available | ADWR, SRP, APS, city utilities | High — fragmented |
| `title_pull` | Parcel → encumbrances, deed restrictions | Title insurance API (DataTree, etc.) | Medium — paid API |
| `comps_cost` | Property type + area → recent sales + build cost | MLS, RSMeans, Zillow API | Medium |
| `report_builder` | Report sections → docx + PDF | **Existing `docx` skill** | Already built |

---

## 5. Why the SDK (not just an API call)

A naive script cannot do this because:

1. **Conditional branching** — order of queries depends on what each previous query returned (only check ESLO if slope > 15%; only check airport overlay if within 3 miles).
2. **Cross-source reasoning** — "zoning allows X" + "title shows easement" + "slope > 15%" must collapse into "actually max 2 units" — that synthesis is the LLM's job.
3. **Hedging** — the report must say "estimated buildable area of 8,400 sf assuming standard 5-ft setbacks; verify with city planner before purchase" — judgment a script cannot generate.
4. **Citations** — each claim links back to the tool call that produced it. The SDK's tool-use audit trail gives that for free.

The moat is not the data (anyone can scrape FEMA). The moat is the agent loop + cross-reference reasoning + structured citation-grounded output. That is exactly what the Agent SDK ships and exactly what is hard to replicate.

---

## 6. YC Roadmap

| Phase | Time | Output |
|---|---|---|
| **MVP — Maricopa County only** | 6 wk | Address → 1-page PDF, 4 data sources, 1 report template |
| **Beta — 5 AZ counties + Phoenix metro** | 12 wk | Add utility/title MCP, paid tier ($29/report) |
| **YC application** | + 4 wk | 50 reports/week, 2–3 paying customers, demo video |
| **Post-YC** | 6 mo | Multi-state via state GIS API harvester; agent-as-a-service for title companies |

---

## 7. Next decisions to make (when work resumes here)

- [ ] Pick MVP county. Maricopa is the obvious default (largest market, public GIS).
- [ ] Pick MVP report template. Recommendation: 1-page PDF with these sections — Parcel summary, Zoning envelope, Constraints, Buildable area estimate, Red flags, Recommendation, Citations.
- [ ] Decide on title API vendor (DataTree vs. First American vs. defer to v2).
- [ ] Sketch TypeScript skeleton for the agent + first MCP tool (`parcel_lookup` is lowest-risk first build).
- [ ] Decide pricing: per-report ($29) vs. subscription ($99/mo for 10 reports) vs. enterprise.
- [ ] YC narrative draft mapping this technical architecture to founder/problem/market/traction.
