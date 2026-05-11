# Zoning Data — Future Work

**Created:** 2026-05-11
**Context:** After exhaustively probing every Maricopa city for public zoning REST endpoints, only 6 cities + County have continuous polygon coverage. The other 12 Maricopa jurisdictions are hint-only stubs in the agent because their data is not publicly accessible via REST.

This note captures **what we tried**, **what didn't work**, and **the realistic paths forward** so future sessions can pick up from this point without re-probing.

---

## Where we are

### Real-data jurisdictions (7)
| City | Endpoint | Field | Codes encoded |
|---|---|---|---|
| Tempe | `services.arcgis.com/lQySeXwbBg53XWDi/.../zoning_districts/FeatureServer/1` | `ZoningCode` | 16 |
| Phoenix | `services6.arcgis.com/u2Q4oAfciDZpDAD8/.../Zoning_PhoenixAZ/FeatureServer/0` | `ZONING` | 13 |
| Mesa | `services2.arcgis.com/1gVyYKfYgW5Nxb1V/.../Zoning/FeatureServer/2` | `Zoning` | 14 |
| Scottsdale | `maps.scottsdaleaz.gov/arcgis/.../OpenData/MapServer/24` | `comparable_zoning` / `full_zoning` | 11 |
| Gilbert | `maps.gilbertaz.gov/.../Growth_Development_Maps_1/MapServer/8` | `ZCODE` | 13 |
| Glendale | `services1.arcgis.com/9fVTQQSiODPjLUTa/.../Glendale_Zoning/FeatureServer/0` | `BASE_ZONE` | 23 |
| Maricopa County (unincorporated) | `gis.maricopa.gov/arcgis/rest/services/PND/PlanNet/MapServer/11` | `ZONE` | 23 |

### Hint-only stub jurisdictions (12)
Chandler, Goodyear, Avondale, Surprise, Peoria, Buckeye, Apache Junction, El Mirage, Tolleson, Fountain Hills, Litchfield Park, Paradise Valley.

For each, the agent confirms jurisdiction via the city hint and surfaces the planning-department URL + phone. No setback/height/density values returned.

### Not in agent yet (tiny)
Carefree, Cave Creek, Queen Creek, Wickenburg, Youngtown, Guadalupe.

---

## What was tried (and didn't work)

For each of the 12 hint-only cities I probed:

1. **Direct GIS server** at `gis.<city>.gov` / `maps.<city>.gov` — all returned 404 / DNS-fail / token-required for the actually-useful folders.
2. **ArcGIS Online search** by city name + "zoning" — either nothing, only historical overlay/ordinance layers, or **wrong-state services** (the "Avondale_SF_Zoning" I almost added had wkid 102723 = Ohio State Plane; it's Avondale, OHIO, not AZ).
3. **City-account AGOL items** by `owner:<city>_gis` — found annexations, police data, parks, planning boundaries, but never zoning.
4. **Web-map operational layers** — only overlay/historical-ordinance references.
5. **Maricopa County PND/PlanNet** — already added; covers unincorporated only.

Specific dead-ends to **not retry** without new information:

- **Chandler**: `Chandler_Ordinances_Public_View/FeatureServer/0` is the only thing labeled "zoning" and has 241 historical ordinance polygons (old code system), not current zoning. `Chandler_CityLimits/FeatureServer/144` has 1 feature with a tiny extent — broken.
- **Goodyear / Buckeye**: have rich GIS servers (`maps.goodyearaz.gov`, `maps.buckeyeaz.gov`) but Planning / LandUsePlanning / DevelopmentServices folders all return 499 (token required). Only public layer is `GeneralPlanLandUse` (planning categories, not zoning).
- **Peoria**: `gis.peoriaaz.gov/.../Peoria_Zoning/MapServer` exists but its 19 layers are all specific-area-plan overlays and Subzones (PAD/PCD/PUD categories) — no base zoning.
- **Fountain Hills**: `ToFH_2005_LandUse___Zoning` exists but layer 0 has only `TEXTSTRING / TEXT_SIZE / TEXT_ANGLE` — it's a label layer, not zoning.
- **Avondale / Apache Junction / El Mirage / Tolleson / Litchfield Park / Paradise Valley**: nothing public at all. Direct hosts either DNS-fail or return 000. No AGOL items from official accounts.

---

## Realistic paths to unlock the 12

### Option A — Commercial data (recommended for YC Beta phase)
Buy a Maricopa-wide consolidated zoning dataset. Two main vendors:
- **Cotality** (formerly CoreLogic) — parcel + zoning + tax data
- **Regrid** — parcel + zoning, more developer-friendly API, ~$5–15K/year for AZ statewide
- **DataTree** (a First American product) — title + zoning bundle, expensive but already on the architecture-doc shortlist for title_pull
- **NAI Horizon** — has a CRE-curated AZ-cities zoning service in AGOL but it's subset, not full data. Probably commercial behind the scenes.

The right move is one commercial integration in the Beta phase: it bypasses the per-city REST hunt entirely AND gives consistent schema across all jurisdictions. The architecture doc's roadmap explicitly puts utility/title MCP in Beta, and zoning-completion belongs in the same bucket.

### Option B — Per-city outreach
Email each city's GIS coordinator and request either:
- A service URL for their internal zoning layer (some cities will share with a request)
- A shapefile export of current zoning (most cities will share this)

This is slow (each city is a separate ~1-week negotiation) and the data goes stale unless they give us a service URL we can re-query.

### Option C — Scrape zoning code PDFs
Each city publishes its zoning ordinance as a PDF (the chapter references in each stub's `ordinance_reference` field point to these). The dimensional standards are tabular and could be extracted into our `Entry` schema. But this only gives us the **dimensional table** — we still need a **spatial REST** to know which district applies at a given point. Useless without Option B's shapefile.

### Option D — Tax assessor zoning fields
The Maricopa County Assessor parcel record has a `CITY_ZONING` field, but it returns `"CONTACT LOCAL JURISDICTION"` for most cities outside Tempe (confirmed during parcel_lookup development). Not viable.

---

## Recommended next session for zoning data

If/when this comes back up:

1. **First**: get pricing from Regrid for Maricopa County AZ zoning. Likely the cleanest path. Their data ships with normalized zoning codes already mapped — no per-city dimensional table maintenance.
2. **If Regrid won't work**: focus on the top 3 stub cities by population (Chandler ~280K, Peoria ~200K, Surprise ~155K). Email each city's GIS office for a shapefile. Goodyear, Buckeye, Avondale next.
3. **Skip the tiny 6** (Carefree, Cave Creek, Queen Creek, Wickenburg, Youngtown, Guadalupe) — combined population under ~70K. Add stubs only.

---

## Dispatcher pattern (already in place)

The `zoning_lookup` dispatcher is set up to absorb new modules cleanly:

```
src/agent/src/mcp/zoning/
├── types.ts                  ZoningResult, CityModule
├── helpers.ts                queryArcGisPoint, asString, buildResult
├── stub.ts                   buildStubRecord, buildStubModule factory
├── tempe.ts / phoenix.ts / mesa.ts / scottsdale.ts / gilbert.ts / glendale.ts
├── chandler.ts               (stub)
├── maricopa_county.ts        (full data, unincorporated only)
└── stubs_west_valley.ts      (11 hint-only stubs)

src/agent/src/mcp/zoning_lookup.ts  (the dispatcher)
```

Adding a new city with real data is ~80 lines: dimensional table (Entry map) + `CityModule` that calls `queryArcGisPoint` and maps result through the table. Wire into `MODULES` and `CITY_INDEX`.

Upgrading a stub to real data: replace the stub export in `stubs_west_valley.ts` with a real module file, remove the stub from `STUB_BY_HINT` in the dispatcher.

---

## Other future-work items (separate post-its when picked up)

- `utility_avail` MCP tool — SRP electric + APS + city water/sewer service-area lookups (architecture-doc tool 5).
- `title_pull` MCP tool — DataTree / First American paid API (architecture-doc tool 6).
- `comps_cost` MCP tool — MLS / RSMeans / Zillow comparable sales + build cost (architecture-doc tool 7).
- Address → APN geocoder — Maricopa Assessor address-search REST exists; make the agent's input human-friendly.
- HTTP layer — wire `runFeasibilityAgent` to a Netlify Function so the existing React frontend can call it.
- Hackathon FEMA URL fix — `netlify/functions/analyze.js` still calls the dead `/gis/nfhl/` path; production flood lookup is silently broken.
- Playwright auto-PDF — current `report_builder` emits HTML; rendering to .pdf is a one-tool-change with `playwright` (already a root dep).
- `types.ts` reconciliation — Claude's actual report schema is richer than the `FeasibilityReport` interface; align or pin the schema in the prompt.
