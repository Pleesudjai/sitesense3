/**
 * API client for SiteSense backend.
 *
 * DEMO_MODE = true  → all calls return hardcoded Phoenix-lot data, no network required.
 * DEMO_MODE = false → calls the real Netlify Functions backend via /api.
 */

const DEMO_MODE = false

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
//
// Scenario: 0.47-acre infill lot in central Phoenix (33.45°N, 112.07°W)
//   Flood Zone X (minimal flood hazard), SDC C (moderate seismic),
//   expansive clay soil, ~3% avg slope, total site-prep cost ~$45,000.

function buildDemoResult() {
  // 8×8 elevation grid — Phoenix desert, ~1,085 ft AMSL, gentle south-to-north rise
  // Rows = south→north, cols = west→east (matches backend convention)
  const baseElev = 1085   // ft AMSL
  const grid = Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => {
      // Gentle 3% slope rising northward, tiny east-west undulation
      const northRise  = r * 1.4          // +1.4 ft per row northward
      const ewUndulate = Math.sin(c * 0.8) * 0.6
      const noise      = (Math.sin(r * 3.1 + c * 2.7) * 0.4)
      return parseFloat((baseElev + northRise + ewUndulate + noise).toFixed(1))
    })
  )

  const flat       = grid.flat()
  const minElev    = Math.min(...flat)   // ≈ 1084.4 ft
  const maxElev    = Math.max(...flat)   // ≈ 1096.4 ft
  const avgElev    = flat.reduce((a, b) => a + b, 0) / flat.length

  // bbox for central Phoenix parcel (lon_min, lat_min, lon_max, lat_max)
  const bbox = [-112.0730, 33.4490, -112.0710, 33.4505]

  const elevation = {
    grid,
    bbox,
    area_acres:       0.47,
    avg_elevation_ft: parseFloat(avgElev.toFixed(1)),
    min_ft:           parseFloat(minElev.toFixed(1)),
    max_ft:           parseFloat(maxElev.toFixed(1)),
    cell_width_ft:    15,
    center_lat:       33.4498,
    center_lon:       -112.0720,
  }

  const slope = {
    avg_slope_pct:      3.1,
    max_slope_pct:      7.4,
    steep_fraction_pct: 4.2,   // % of cells > 15% slope
  }

  const flood = {
    zone:        'X',
    description: 'Zone X — Minimal flood hazard, outside 500-yr floodplain',
    panel:       '04013C2315L',
  }

  const seismic = {
    sds:      0.516,
    sd1:      0.284,
    sdc:      'C',
    wind_mph: 95,
    tl:       8,
  }

  const fire = {
    risk_class: 'Low',
    wui_zone:   false,
  }

  const soil = {
    series_name:         'Laveen',
    map_unit:            'Laveen loam, 0 to 1 percent slopes',
    texture_class:       'CL',
    texture_description: 'Clay Loam (expansive)',
    taxonomic_class:     'Fine-loamy, mixed, superactive, hyperthermic Typic Calciargids',
    hydrologic_group:    'C',
    hydrologic_group_description: 'Moderately high runoff — slow infiltration',
    drainage_class:      'Somewhat poorly drained',
    shrink_swell:        'High',
    caliche:             true,
    flooding_frequency:  'None',
    ponding_frequency:   'None',
    restrictive_depth_in: 24,
    corrosion_concrete:  'Moderate',
    corrosion_steel:     'High',
    septic_suitable:     false,
    building_limitations: [
      'Expansive soil — post-tension slab required (ACI 360R-10 §5.4)',
      'Caliche hardpan likely — mechanical breaking needed for excavation',
      'Restrictive layer at ~24 in. — may limit foundation depth',
      'High steel corrosion risk — protective coating or cathodic protection needed',
    ],
    bearing_hint:        'Low — expansive/soft conditions; geotechnical boring required before design',
  }

  const wetlands = {
    present:      false,
    coverage_pct: 0,
    nwi_type:     null,
  }

  const precipitation = {
    source: 'NOAA Atlas 14',
    intensity_10yr_1hr_in: 1.02,
    rainfall_data: { '2yr_1hr': 0.61, '5yr_1hr': 0.82, '10yr_1hr': 1.02, '25yr_1hr': 1.31, '100yr_1hr': 1.78 },
    description: '10-yr, 1-hr rainfall: 1.02 in/hr',
  }

  const contamination = {
    total_sites: 2,
    superfund_count: 0,
    rcra_count: 2,
    brownfield_count: 0,
    radius_miles: 1.0,
    risk_level: 'LOW',
    description: '2 EPA-regulated site(s) within 1 mile',
  }

  const hydrography = {
    streams_nearby: false,
    stream_count: 0,
    nearest_stream: null,
    risk_level: 'LOW',
    description: 'No mapped streams or rivers within ~500 ft of parcel',
  }

  const endangered_species = {
    critical_habitat: false,
    species_count: 0,
    species: [],
    risk_level: 'LOW',
    description: 'No critical habitat or endangered species mapped in this area',
  }

  const historic_sites = {
    sites_nearby: false,
    site_count: 0,
    sites: [],
    risk_level: 'LOW',
    description: 'No National Register historic sites within ~0.5 mile',
  }

  const landslide = {
    risk_class: 'Low',
    risk_level: 'LOW',
    description: 'Low landslide susceptibility — flat to gentle terrain',
    source: 'Rule-based estimate',
  }

  const sea_level_rise = {
    coastal: false,
    risk_level: 'LOW',
    description: 'Inland parcel — sea level rise not applicable',
  }

  // Soil zones — 2 map units crossing the parcel (demo)
  const soil_zones = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { mukey: '654321', muname: 'Laveen loam, 0-1% slopes', musym: 'LaA', hydgrp: 'C', drainage: 'Somewhat poorly drained', flood_freq: 'None' },
        geometry: { type: 'Polygon', coordinates: [[[-112.0735, 33.4488], [-112.0720, 33.4488], [-112.0720, 33.4500], [-112.0735, 33.4500], [-112.0735, 33.4488]]] },
      },
      {
        type: 'Feature',
        properties: { mukey: '654322', muname: 'Mohave sandy loam, 0-1% slopes', musym: 'MoA', hydgrp: 'A', drainage: 'Well drained', flood_freq: 'None' },
        geometry: { type: 'Polygon', coordinates: [[[-112.0720, 33.4488], [-112.0705, 33.4488], [-112.0705, 33.4508], [-112.0720, 33.4508], [-112.0720, 33.4488]]] },
      },
    ],
  }

  // Cut/fill: gentle slope means modest earthwork to achieve pad grade
  const cutFill = {
    cut_cy:        310,
    fill_cy:       185,
    net_cy:        125,      // positive → export surplus
    target_grade_ft: parseFloat(avgElev.toFixed(1)),
  }

  const foundation = {
    type:     'post_tension_slab',
    code_ref: 'IBC 2021 §1808 / PTI DC80.3-16 (expansive soil, SDC C)',
  }

  const loads = {
    seismic_zone:    'SDC C',
    wind_mph:         95,
    snow_psf:          0,
    cost_multiplier:   1.08,   // Phoenix urban premium
  }

  const runoff = {
    runoff_cfs:       1.4,
    rational_c:       0.55,
    tc_minutes:       12,
  }

  const buildableSf = Math.round(0.47 * 43560 * 0.96)   // ~19,693 SF after setbacks

  // Cost breakdown targeting ~$45,000 total
  const earthworkCut  =  6_820   // 310 CY × $22/CY
  const earthworkFill =  3_700   // 185 CY × $20/CY
  const foundationCst = 18_200   // PT slab on expansive soil
  const roughGrading  =  7_400
  const siteUtils     =  8_880
  const totalNow      = earthworkCut + earthworkFill + foundationCst + roughGrading + siteUtils  // 45,000

  const r = 0.045   // 4.5%/yr inflation
  const projections = {
    0:  totalNow,
    2:  Math.round(totalNow * Math.pow(1 + r, 2)),
    5:  Math.round(totalNow * Math.pow(1 + r, 5)),
    10: Math.round(totalNow * Math.pow(1 + r, 10)),
  }

  const costs = {
    breakdown: {
      earthwork_cut:  earthworkCut,
      earthwork_fill: earthworkFill,
      foundation:     foundationCst,
      rough_grading:  roughGrading,
      site_utilities: siteUtils,
    },
    total_now:        totalNow,
    low_estimate:     Math.round(totalNow * 0.70),
    high_estimate:    Math.round(totalNow * 1.30),
    projections,
    inflation_message:
      'Delaying 2 years adds ~$4,100 to site-prep costs at 4.5%/yr inflation. Build sooner to lock in today\'s pricing.',
  }

  const summary = {
    address:           '2418 N 16th St, Phoenix, AZ 85006',
    area_acres:         0.47,
    avg_elevation_ft:   parseFloat(avgElev.toFixed(1)),
    min_elevation_ft:   parseFloat(minElev.toFixed(1)),
    max_elevation_ft:   parseFloat(maxElev.toFixed(1)),
    avg_slope_pct:      3.1,
    max_slope_pct:      7.4,
    flood_zone:        'X',
    seismic_sdc:       'C',
    fire_risk:         'Low',
    soil_texture:      'clay loam',
    shrink_swell:      'High',
    caliche:            true,
    wetlands_present:   false,
    foundation_type:   'post_tension_slab',
    foundation_code:    foundation.code_ref,
    cut_cy:             310,
    fill_cy:            185,
    net_cy:             125,
    wind_mph:           95,
    snow_psf:            0,
    buildable_sf:       buildableSf,
    total_now:          totalNow,
    cost_5yr:           projections[5],
    cost_10yr:          projections[10],
  }

  const reportText = `## 1. Site Snapshot
0.47-acre infill lot in central Phoenix, AZ (elev. ~${Math.round(avgElev)} ft AMSL). The parcel is essentially flat with a gentle 3.1% northward slope and ~11 ft of total relief across the site. No wetlands detected. Approximately ${buildableSf.toLocaleString()} SF is buildable after standard setbacks.

## 2. Risk Assessment
🟢 Flood — Zone X (minimal hazard, outside 500-yr floodplain). No FEMA flood insurance required.
🟡 Seismic — SDC C (moderate). Structural design must meet IBC Chapter 16 seismic provisions.
🟢 Wildfire — Low risk. Standard construction applies; no WUI overlay.
🔴 Soil — Expansive clay loam with caliche at ~24 in. High shrink-swell potential; post-tension slab required.
🟢 Wetlands — None detected. No Section 404 permit needed.
🟢 Wind — 95 mph design wind (ASCE 7-22). Standard residential framing adequate.

## 3. What You Can Build
With ~${buildableSf.toLocaleString()} SF of buildable area, a single-family home up to ~2,800 SF footprint is feasible under standard R-1 setbacks. Two-story construction is viable (SDC C allows conventional wood frame with prescriptive seismic details). No flood elevation certificate required.

## 4. Earthwork & Site Prep Summary
Gentle slope demands modest grading: 310 CY of cut and 185 CY of fill for a net 125 CY export surplus. The caliche layer will require pneumatic or mechanical breaking before foundation excavation — budget an extra 3–5 days of equipment time. A post-tension slab-on-grade is strongly recommended to accommodate expansive clay movement.

## 5. Cost Estimate & 10-Year Projection
Site-prep ROM: $${totalNow.toLocaleString()} (midpoint) · Range $${costs.low_estimate.toLocaleString()}–$${costs.high_estimate.toLocaleString()} (±30%). Foundation dominates at $18,200 due to PT slab over expansive soil. At 4.5%/yr inflation, costs rise to ~$${(projections[5]/1000).toFixed(0)}k in 5 years and ~$${(projections[10]/1000).toFixed(0)}k in 10 years.

## 6. Your Next Steps
- Commission a geotechnical investigation (soil borings to 15 ft) to confirm caliche depth and bearing capacity before design.
- Engage a licensed structural PE to prepare post-tension slab design per PTI DC80.3-16 and IBC 2021 §1808.
- Pull a City of Phoenix zoning verification and confirm R-1 setback requirements for the specific APN.
- Request a CLOMR/LOMA letter from FEMA if any portion of the lot is within 50 ft of a mapped floodplain boundary.
- Obtain competitive bids from at least three grading contractors — caliche breaking costs vary significantly.
- Schedule utility locates (811) before any subsurface investigation.

⚠️ DISCLAIMER: Preliminary planning only. Not a substitute for licensed PE review.`

  return {
    status: 'ok',
    data: {
      elevation,
      slope,
      flood,
      soil,
      seismic,
      fire,
      wetlands,
      cut_fill:    cutFill,
      foundation,
      loads,
      runoff,
      precipitation,
      contamination,
      hydrography,
      endangered_species,
      historic_sites,
      landslide,
      sea_level_rise,
      soil_zones,
      buildable_sf: buildableSf,
      costs,
      summary,
      report_text: reportText,
    },
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

const BASE_URL = '/api'

/**
 * Analyze a polygon parcel.
 * @param {Object} polygon - GeoJSON polygon geometry
 * @param {Object} prefs   - { address, buildingType, floors, budget, priority }
 * @returns {Promise<Object>} full analysis result ({ status, data })
 */
export async function analyzeParcel(polygon, prefs = {}) {
  if (DEMO_MODE) {
    // Simulate a realistic network round-trip so the loading spinner shows
    await new Promise(resolve => setTimeout(resolve, 2000))
    return buildDemoResult()
  }

  const response = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      polygon,
      address:       prefs.address       || '',
      building_type: prefs.buildingType  || 'single_family',
      floors:        prefs.floors        || 1,
      budget:        prefs.budget        || 'mid',
      priority:      prefs.priority      || 'cost',
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || `Analysis failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Download the PDF report for a parcel.
 * In demo mode shows a friendly alert instead of hitting the backend.
 * @param {Object} polygon - GeoJSON polygon geometry
 * @param {Object} prefs   - same prefs as analyzeParcel
 */
export async function downloadReport(polygon, prefs = {}) {
  if (DEMO_MODE) {
    alert(
      'PDF reports are not available in Demo Mode.\n\n' +
      'Connect to the live backend (set DEMO_MODE = false in api.js) to generate a full PDF feasibility report.'
    )
    return
  }

  const response = await fetch(`${BASE_URL}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      polygon,
      address:       prefs.address       || '',
      building_type: prefs.buildingType  || 'single_family',
      floors:        prefs.floors        || 1,
      budget:        prefs.budget        || 'mid',
    }),
  })

  if (!response.ok) throw new Error('Report generation failed')

  const blob = await response.blob()
  const url  = window.URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'SiteSense_Feasibility_Report.pdf'
  a.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Generate house concept estimates.
 * @param {Object} params - { bedrooms, bathrooms, stories, location, quality, siteData? }
 */
export async function estimateHouseConcept(params) {
  const response = await fetch(`${BASE_URL}/house_estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `House estimate failed: ${response.status}`)
  }
  return response.json()
}

/**
 * Ask an engineering question with source attribution.
 * @param {string} question
 * @param {Object|null} context - optional site analysis data for grounding
 */
export async function askEngineering(question, context = null) {
  const response = await fetch(`${BASE_URL}/engineering_assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `Engineering assist failed: ${response.status}`)
  }
  return response.json()
}
