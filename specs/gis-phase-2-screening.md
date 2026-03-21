# Feature Spec: GIS Phase 2 Screening — Missing Layers
Date: 2026-03-21
Layer: backend-module + netlify-function + frontend

## What We're Building
Replace 2 hardcoded stubs (fire, precipitation) with live APIs, and add 2 new layers (EPA contamination, hydrography). All free, no auth.

## Phase 1 (already done)
- USGS 3DEP elevation — LIVE
- FEMA NFHL flood — LIVE
- USDA SSURGO soils — LIVE
- USFWS NWI wetlands — LIVE
- USGS seismic — LIVE

## Phase 2 (this spec)

### 1. NOAA Atlas 14 Precipitation (replace stub)
- **API:** https://hdsc.nws.noaa.gov/cgi-bin/hdsc/new/cgi_readH5.py
- **Params:** lat, lon, type=pf, data=depth, series=pds
- **Returns:** Precipitation frequency estimates (2yr/5yr/10yr/25yr/50yr/100yr storms)
- **File:** `src/backend/data/precipitation.py`
- **Engineering value:** Real rainfall intensity for stormwater calc (replaces hardcoded 1.0 in/hr)

### 2. USGS Wildfire Hazard Potential (replace stub)
- **API:** USFS WHP raster service or rule-based from NLCD + slope + climate
- **Fallback:** Keep current rule-based but expand zones beyond AZ
- **File:** `src/backend/data/fire.py` (update)
- **Engineering value:** WUI flag, defensible space, insurance risk

### 3. EPA Contamination Screening (new)
- **API:** https://enviro.epa.gov/enviro/efservice/ (Envirofacts REST)
- **Query:** Search within 1-mile radius of centroid for Superfund, brownfield, RCRA sites
- **Returns:** count of nearby sites, nearest site name/distance, cleanup status
- **File:** `src/backend/data/contamination.py` (new)
- **Engineering value:** Environmental liability flag, due diligence trigger

### 4. USGS Hydrography / Stream Proximity (new)
- **API:** https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer
- **Query:** Envelope query around bbox for streams/rivers within 500ft
- **Returns:** nearest stream name, distance, stream order
- **File:** `src/backend/data/hydrography.py` (new)
- **Engineering value:** Drainage outfall context, riparian setbacks, stormwater routing

## Files to Create or Edit
- `src/backend/data/precipitation.py` — new module (NOAA Atlas 14)
- `src/backend/data/contamination.py` — new module (EPA Envirofacts)
- `src/backend/data/hydrography.py` — new module (USGS NHD)
- `src/backend/data/fire.py` — expand rule-based zones
- `src/backend/engineering/stormwater.py` — use real Atlas 14 intensity
- `netlify/functions/analyze.js` — add new data fetches
- `src/frontend/src/components/RiskCards.jsx` — add contamination + hydro cards
- `src/frontend/src/api.js` — update demo data with new fields

## Implementation Steps
1. [x] Confirm current backend modules (done — see above)
2. [ ] Build precipitation.py with NOAA Atlas 14 API
3. [ ] Build contamination.py with EPA Envirofacts API
4. [ ] Build hydrography.py with USGS NHD API
5. [ ] Update fire.py with expanded coverage
6. [ ] Wire new modules into analyze.js
7. [ ] Update RiskCards.jsx for new layers
8. [ ] Update demo data in api.js
9. [ ] Test end-to-end with 3 demo addresses

## Demo Test
- Phoenix: should show low contamination, no streams nearby
- Houston: should show higher precipitation, possible stream proximity
- Flagstaff: should show wildfire risk, higher precipitation

## Out of Scope
- Local parcel/zoning (too fragmented for hackathon)
- Utilities/easements (requires local GIS)
- Endangered species (low priority for demo)
- Sea level rise (not relevant for AZ demo)
