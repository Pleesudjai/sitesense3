/**
 * Netlify Function: /api/analyze
 * Full site analysis — GIS data + engineering calcs + Claude AI report
 * JavaScript rewrite of analyze.py (Netlify only supports JS/TS/Go functions)
 */

const Anthropic = require('@anthropic-ai/sdk')

// ─── CORS ────────────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

// ─── GEOMETRY HELPERS (replacing Shapely) ────────────────────────────────────

function polygonCentroid(coordinates) {
  const pts = coordinates[0]
  const n = pts.length - 1
  let sumX = 0, sumY = 0
  for (let i = 0; i < n; i++) { sumX += pts[i][0]; sumY += pts[i][1] }
  return [sumX / n, sumY / n]
}

function polygonBounds(coordinates) {
  const pts = coordinates[0]
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of pts) {
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
  }
  return [minX, minY, maxX, maxY]
}

function polygonAreaAcres(coordinates) {
  const pts = coordinates[0]
  let area = 0
  for (let i = 0; i < pts.length - 1; i++) {
    area += pts[i][0] * pts[i + 1][1]
    area -= pts[i + 1][0] * pts[i][1]
  }
  area = Math.abs(area) / 2
  // Convert sq-degrees → sq-meters (approx at 33°N) → acres
  const areaM2 = area * 91000 * 111000
  return Math.max(areaM2 / 4047, 0.01)
}

function linspace(start, end, n) {
  const arr = []
  for (let i = 0; i < n; i++) arr.push(start + (end - start) * i / (n - 1))
  return arr
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// ─── ELEVATION (USGS 3DEP) ───────────────────────────────────────────────────

async function queryElevation(lon, lat) {
  try {
    const url = `https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&units=Feet&includeDate=false`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json()
    const val = parseFloat(data.value)
    return isNaN(val) || val < -900 ? null : val
  } catch {
    return null
  }
}

async function getElevationGrid(polygon, gridSize = 10) {
  const [minX, minY, maxX, maxY] = polygonBounds(polygon.coordinates)
  const buf = 100 / 111000
  const bMinX = minX - buf, bMinY = minY - buf
  const bMaxX = maxX + buf, bMaxY = maxY + buf

  const lons = linspace(bMinX, bMaxX, gridSize)
  const lats = linspace(bMinY, bMaxY, gridSize)

  // Batch parallel USGS calls
  const queries = []
  for (const lat of lats) for (const lon of lons) queries.push(queryElevation(lon, lat))
  const results = await Promise.all(queries)

  const valid = results.filter(v => v !== null)
  const med = valid.length ? median(valid) : 1000
  const filled = results.map(v => v ?? med)

  const grid = []
  for (let i = 0; i < gridSize; i++) grid.push(filled.slice(i * gridSize, (i + 1) * gridSize))

  const min = Math.min(...filled), max = Math.max(...filled)
  const avg = filled.reduce((s, v) => s + v, 0) / filled.length
  const widthM = (bMaxX - bMinX) * 91000
  const cellWidthFt = (widthM / gridSize) * 3.281
  const [cx, cy] = polygonCentroid(polygon.coordinates)
  const areaAcres = polygonAreaAcres(polygon.coordinates)

  return {
    grid,
    bbox: [bMinX, bMinY, bMaxX, bMaxY],
    center_lat: cy, center_lon: cx,
    area_acres: Math.round(areaAcres * 10000) / 10000,
    min_ft: Math.round(min * 10) / 10,
    max_ft: Math.round(max * 10) / 10,
    avg_elevation_ft: Math.round(avg * 10) / 10,
    relief_ft: Math.round((max - min) * 10) / 10,
    cell_width_ft: Math.round(cellWidthFt * 10) / 10,
    grid_size: gridSize,
  }
}

// ─── SLOPE & CUT/FILL ────────────────────────────────────────────────────────

function calculateSlope(grid, cellWidthFt) {
  const rows = grid.length, cols = grid[0].length
  const slopes = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dzdx = (grid[r][Math.min(c + 1, cols - 1)] - grid[r][Math.max(c - 1, 0)]) / (2 * cellWidthFt)
      const dzdy = (grid[Math.min(r + 1, rows - 1)][c] - grid[Math.max(r - 1, 0)][c]) / (2 * cellWidthFt)
      slopes.push(Math.sqrt(dzdx ** 2 + dzdy ** 2) * 100)
    }
  }
  const avg = slopes.reduce((s, v) => s + v, 0) / slopes.length
  const max = Math.max(...slopes)
  const steepFrac = slopes.filter(s => s > 30).length / slopes.length * 100
  const slopeGrid = []
  for (let r = 0; r < rows; r++) slopeGrid.push(slopes.slice(r * cols, (r + 1) * cols))
  return {
    avg_slope_pct: Math.round(avg * 100) / 100,
    max_slope_pct: Math.round(max * 100) / 100,
    min_slope_pct: Math.round(Math.min(...slopes) * 100) / 100,
    steep_fraction_pct: Math.round(steepFrac * 10) / 10,
    slope_grid: slopeGrid,
  }
}

function calculateCutFill(grid, targetGrade, cellWidthFt) {
  const cellAreaFt2 = cellWidthFt ** 2
  let cutVol = 0, fillVol = 0
  const cutGrid = [], fillGrid = []
  for (const row of grid) {
    const cutRow = [], fillRow = []
    for (const elev of row) {
      cutRow.push(Math.max(elev - targetGrade, 0))
      fillRow.push(Math.max(targetGrade - elev, 0))
      cutVol += Math.max(elev - targetGrade, 0) * cellAreaFt2 / 27
      fillVol += Math.max(targetGrade - elev, 0) * cellAreaFt2 / 27
    }
    cutGrid.push(cutRow); fillGrid.push(fillRow)
  }
  const net = cutVol - fillVol
  return {
    target_grade_ft: Math.round(targetGrade * 10) / 10,
    cut_cy: Math.round(cutVol), fill_cy: Math.round(fillVol), net_cy: Math.round(net),
    net_direction: net > 0 ? 'export' : 'import',
    cut_grid: cutGrid, fill_grid: fillGrid,
    cut_description: `${Math.round(cutVol).toLocaleString()} CY of earth to be removed`,
    fill_description: `${Math.round(fillVol).toLocaleString()} CY of fill material needed`,
    net_description: `${Math.abs(Math.round(net)).toLocaleString()} CY net ${net > 0 ? 'export (surplus)' : 'import (deficit)'}`,
  }
}

// ─── FLOOD (FEMA NFHL) ───────────────────────────────────────────────────────

const ZONE_DESCRIPTIONS = {
  AE: 'Special Flood Hazard Area (1% annual chance) — base flood elevation established',
  A:  'Special Flood Hazard Area (1% annual chance) — no BFE established',
  AO: 'Special Flood Hazard Area — shallow flooding, sheet flow',
  VE: 'Coastal High Hazard Area — wave action, BFE established',
  X:  'Minimal flood risk (outside 500-year floodplain)',
  B:  'Moderate flood risk (between 100- and 500-year floodplain)',
}
const ZONE_RISK = { AE: 'HIGH', A: 'HIGH', AO: 'HIGH', VE: 'HIGH', X: 'LOW', B: 'MODERATE', C: 'LOW' }

async function getFloodZone(polygon) {
  const [cx, cy] = polygonCentroid(polygon.coordinates)
  const params = new URLSearchParams({
    geometry: `${cx},${cy}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'FLD_ZONE,SFHA_TF,BFE_DFE',
    returnGeometry: 'false',
    f: 'json',
  })
  try {
    const res = await fetch(`https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?${params}`,
      { signal: AbortSignal.timeout(12000) })
    const data = await res.json()
    const features = data.features || []
    if (!features.length) return defaultFlood()
    const a = features[0].attributes || {}
    const zone = (a.FLD_ZONE || 'X').trim()
    const bfe = parseFloat(a.BFE_DFE)
    return {
      zone, description: ZONE_DESCRIPTIONS[zone] || `Flood Zone ${zone}`,
      risk_level: ZONE_RISK[zone] || 'UNKNOWN',
      bfe_ft: !isNaN(bfe) && bfe > 0 ? bfe : null,
      sfha: a.SFHA_TF === 'T',
    }
  } catch (e) {
    return { ...defaultFlood(), error: e.message }
  }
}

function defaultFlood() {
  return { zone: 'X', description: 'Minimal flood risk (data unavailable)', risk_level: 'LOW', bfe_ft: null, sfha: false }
}

// ─── SOIL (USDA SoilWeb) ─────────────────────────────────────────────────────

const SHRINK_SWELL = { C: 'High', CL: 'High', SiC: 'High', SiCL: 'Moderate', SC: 'Moderate', SCL: 'Low', SiL: 'Low', L: 'Low', SL: 'Low', LS: 'Low', S: 'Low' }
const TEXTURE_DESC = { C: 'Clay (high plasticity)', CL: 'Clay Loam (expansive)', SiC: 'Silty Clay', L: 'Loam (well-balanced)', SL: 'Sandy Loam', S: 'Sand', LS: 'Loamy Sand' }

async function getSoilData(polygon) {
  const [cx, cy] = polygonCentroid(polygon.coordinates)
  try {
    const res = await fetch(`https://casoilresource.lawr.ucdavis.edu/api/point/?lon=${cx}&lat=${cy}`,
      { signal: AbortSignal.timeout(12000) })
    const data = await res.json()
    const series = data.series || []
    if (!series.length) return defaultSoil(cy, cx)
    const dominant = series[0]
    const texture = dominant.texture || 'L'
    const drainage = dominant.drainagecl || 'well drained'
    const shrinkSwell = SHRINK_SWELL[texture] || 'Low'
    const caliche = cy < 37 && cx < -104 && ['S', 'LS', 'SL', 'SCL'].includes(texture)
    return {
      series_name: dominant.series || 'Unknown',
      texture_class: texture,
      texture_description: TEXTURE_DESC[texture] || `Soil texture: ${texture}`,
      drainage_class: drainage,
      shrink_swell: shrinkSwell,
      caliche,
    }
  } catch (e) {
    return { ...defaultSoil(cy, cx), error: e.message }
  }
}

function defaultSoil(lat, lon) {
  if (lat > 31 && lat < 36 && lon > -115 && lon < -109)
    return { series_name: 'Mohave-Laveen (AZ typical)', texture_class: 'SL', texture_description: 'Sandy Loam', drainage_class: 'well drained', shrink_swell: 'Low', caliche: true }
  return { series_name: 'Unknown', texture_class: 'L', texture_description: 'Loam', drainage_class: 'well drained', shrink_swell: 'Low', caliche: false }
}

// ─── SEISMIC (USGS NSHM) ─────────────────────────────────────────────────────

async function getSeismicData(polygon) {
  const [cx, cy] = polygonCentroid(polygon.coordinates)
  let seismic = azSeismicDefaults(cy, cx)
  try {
    const params = new URLSearchParams({ latitude: cy, longitude: cx, riskCategory: 'II', siteClass: 'D', title: 'SiteSense' })
    const res = await fetch(`https://earthquake.usgs.gov/hazard/designmaps/us/json?${params}`,
      { signal: AbortSignal.timeout(15000) })
    const data = await res.json()
    const design = data?.response?.data?.design || {}
    const mapped = data?.response?.data?.mapped || {}
    const ss = parseFloat(design.ss || mapped.ss) || seismic.ss
    const s1 = parseFloat(design.s1 || mapped.s1) || seismic.s1
    seismic = { ss: Math.round(ss * 1000) / 1000, s1: Math.round(s1 * 1000) / 1000, sds: Math.round(ss * 2 / 3 * 1000) / 1000, sd1: Math.round(s1 * 2 / 3 * 1000) / 1000 }
  } catch { /* use defaults */ }
  return { ...seismic, wind_mph: lookupWindSpeed(cy, cx), center_lat: cy, center_lon: cx }
}

function azSeismicDefaults(lat, lon) {
  if (lon > -110.5 && lat > 33.5) return { ss: 0.25, s1: 0.09, sds: 0.17, sd1: 0.06 }
  return { ss: 0.06, s1: 0.02, sds: 0.04, sd1: 0.01 }
}

function lookupWindSpeed(lat, lon) {
  if (lat > 28 && lat < 31 && lon > -96 && lon < -93) return 130
  if (lat > 34.5 && lat < 36 && lon > -113 && lon < -110) return 100
  if (lat > 31 && lat < 37 && lon > -115 && lon < -109) return 90
  return 95
}

// ─── FIRE RISK (rule-based) ───────────────────────────────────────────────────

const HIGH_RISK_ZONES = [
  { bbox: [34.3, -113.0, 35.0, -111.5], risk: 'High' },
  { bbox: [34.0, -112.0, 35.0, -110.0], risk: 'Very High' },
  { bbox: [33.5, -110.5, 34.5, -109.0], risk: 'High' },
  { bbox: [34.8, -112.5, 35.5, -111.0], risk: 'High' },
]
const FIRE_DESC = { Low: 'Low wildfire risk', Moderate: 'Moderate wildfire risk — Class A roofing recommended', High: 'High wildfire risk — WUI requirements apply (ASCE 7-22 Ch.27)', 'Very High': 'Very High wildfire risk — ignition-resistant construction required' }

async function getFireRisk(polygon) {
  const [cx, cy] = polygonCentroid(polygon.coordinates)
  let risk = 'Low'
  for (const z of HIGH_RISK_ZONES) {
    if (cy >= z.bbox[0] && cy <= z.bbox[2] && cx >= z.bbox[1] && cx <= z.bbox[3]) { risk = z.risk; break }
  }
  return { risk_class: risk, description: FIRE_DESC[risk] || 'Unknown', wui_zone: ['High', 'Very High'].includes(risk) }
}

// ─── WETLANDS (USFWS NWI) ────────────────────────────────────────────────────

async function getWetlands(polygon) {
  const [minX, minY, maxX, maxY] = polygonBounds(polygon.coordinates)
  const envelope = JSON.stringify({ xmin: minX, ymin: minY, xmax: maxX, ymax: maxY, spatialReference: { wkid: 4326 } })
  const params = new URLSearchParams({ geometry: envelope, geometryType: 'esriGeometryEnvelope', inSR: '4326', spatialRel: 'esriSpatialRelIntersects', outFields: 'WETLAND_TYPE,ACRES', returnGeometry: 'false', f: 'json' })
  try {
    const res = await fetch(`https://www.fws.gov/wetlands/arcgis/rest/services/Wetlands/MapServer/0/query?${params}`,
      { signal: AbortSignal.timeout(12000) })
    const data = await res.json()
    const features = data.features || []
    if (!features.length) return { present: false, wetland_types: [], coverage_pct: 0, description: 'No wetlands detected.' }
    const types = [...new Set(features.map(f => f.attributes?.WETLAND_TYPE || 'Unknown'))]
    const totalAcres = features.reduce((s, f) => s + (parseFloat(f.attributes?.ACRES) || 0), 0)
    return { present: true, wetland_types: types, coverage_pct: Math.round(Math.min(totalAcres * 10, 100) * 10) / 10, total_wetland_acres: Math.round(totalAcres * 100) / 100, description: `Wetlands detected: ${types.join(', ')}. Section 404 CWA permit may be required.`, permit_required: true }
  } catch (e) {
    return { present: false, wetland_types: [], coverage_pct: 0, description: 'Wetlands data unavailable — verify with USFWS NWI mapper.', error: e.message }
  }
}

// ─── ENGINEERING RULES ───────────────────────────────────────────────────────

function getSeismicDesignCategory(sds, sd1) {
  const bySds = sds < 0.167 ? 'A' : sds < 0.33 ? 'B' : sds < 0.50 ? 'C' : 'D'
  const bySd1 = sd1 < 0.067 ? 'A' : sd1 < 0.133 ? 'B' : sd1 < 0.20 ? 'C' : 'D'
  const order = { A: 0, B: 1, C: 2, D: 3 }
  return order[bySd1] > order[bySds] ? bySd1 : bySds
}

function recommendFoundation(floodZone, slopePct, soilClass, shrinkSwell, sdc, caliche) {
  if (['AE', 'VE', 'AO', 'AH'].includes(floodZone))
    return ['ELEVATED_PILE', `ASCE 7-22 Ch.5 — Elevated/pile foundation required in Zone ${floodZone}`]
  if (slopePct > 30)
    return ['DRILLED_CAISSON', 'ACI 350-20 §4.3 + IBC 2021 §1807 — Drilled caisson required for slope > 30%']
  if (['D', 'E', 'F'].includes(sdc))
    return ['DEEP_PILE_SEISMIC', `ASCE 7-22 Ch.12 — Deep pile with seismic detailing required for SDC ${sdc}`]
  if (shrinkSwell === 'High' || ['C', 'CL', 'SiC'].includes(soilClass))
    return ['POST_TENSIONED_SLAB', 'ACI 360R-10 §5.4 — Post-tensioned slab for expansive/high-shrink-swell soils']
  if (caliche)
    return ['GRADE_BEAM_ON_PIERS', 'ACI 360R-10 §4.2 + IBC 2021 §1803 — Grade beams on piers to bypass caliche hardpan']
  return ['CONVENTIONAL_SLAB', 'ACI 360R-10 — Conventional slab-on-ground. Subgrade per ACI 360R-10, 95% Proctor.']
}

function estimateStructuralLoads(windMph, sds, sd1, sdc, elevationFt) {
  const windPressure = 0.00256 * 0.85 * windMph ** 2
  const snow = elevationFt < 4000 ? 0 : elevationFt < 5000 ? 10 : elevationFt < 6000 ? 20 : elevationFt < 7000 ? 40 : elevationFt < 8000 ? 60 : 80
  const windMult = 1.0 + Math.max(0, windMph - 90) * 0.002
  const seismicMult = { A: 1.00, B: 1.02, C: 1.05, D: 1.12 }[sdc] || 1.0
  const snowMult = 1.0 + (snow / 100) * 0.05
  return { wind_pressure_psf: Math.round(windPressure * 10) / 10, wind_mph: windMph, snow_psf: snow, seismic_sdc: sdc, cost_multiplier: Math.round(windMult * seismicMult * snowMult * 1000) / 1000 }
}

// ─── COST ────────────────────────────────────────────────────────────────────

const REGION_MULT = { phoenix: 0.95, tucson: 0.88, flagstaff: 1.05, prescott: 0.98, default: 0.95 }
const FND_COSTS = { ELEVATED_PILE: { low: 35, high: 65 }, DRILLED_CAISSON: { low: 25, high: 45 }, DEEP_PILE_SEISMIC: { low: 40, high: 70 }, POST_TENSIONED_SLAB: { low: 14, high: 22 }, GRADE_BEAM_ON_PIERS: { low: 18, high: 30 }, MAT_FOUNDATION: { low: 20, high: 35 }, CONVENTIONAL_SLAB: { low: 8, high: 15 } }

function identifyRegion(lat, lon) {
  if (lat > 33.2 && lat < 34.0 && lon > -113.0 && lon < -111.5) return 'phoenix'
  if (lat > 31.7 && lat < 32.5 && lon > -111.3 && lon < -110.5) return 'tucson'
  if (lat > 35.0 && lat < 35.5 && lon > -111.8 && lon < -111.3) return 'flagstaff'
  if (lat > 34.4 && lat < 34.7 && lon > -113.0 && lon < -112.2) return 'prescott'
  return 'default'
}

function estimateCost(cutCy, fillCy, foundationType, buildableSf, lat, lon, loadMult) {
  const region = identifyRegion(lat, lon)
  const mult = REGION_MULT[region] || 0.95
  const effMult = mult * loadMult
  const fnd = FND_COSTS[foundationType] || FND_COSTS.CONVENTIONAL_SLAB
  const fndRate = (fnd.low + fnd.high) / 2
  const breakdown = {
    earthwork_cut:  Math.round(cutCy * 22 * mult),
    earthwork_fill: Math.round(fillCy * 26 * mult),
    foundation:     Math.round(buildableSf * fndRate * effMult),
    rough_grading:  Math.round(buildableSf * 3.5 * mult),
    site_utilities: Math.round(27000 * mult),
  }
  const total = Object.values(breakdown).reduce((s, v) => s + v, 0)
  const projections = {}
  for (const yr of [0, 2, 5, 10]) projections[yr] = Math.round(total * (1.045 ** yr))
  return { region, regional_multiplier: mult, breakdown, total_now: total, low_estimate: Math.round(total * 0.80), high_estimate: Math.round(total * 1.30), projections, foundation_rate_psf: Math.round(fndRate * effMult * 100) / 100, note: 'ROM estimate ±30%. For preliminary planning only.' }
}

function calculateRunoff(areaAcres, slopePct, soilClass) {
  const slopeClass = slopePct < 5 ? 'flat' : slopePct < 15 ? 'moderate' : 'steep'
  const key = `${soilClass}-${slopeClass}`
  const C_VALS = { 'S-flat': 0.20, 'S-moderate': 0.25, 'S-steep': 0.30, 'SL-flat': 0.25, 'SL-moderate': 0.30, 'SL-steep': 0.35, 'L-flat': 0.30, 'L-moderate': 0.35, 'L-steep': 0.40, 'CL-flat': 0.40, 'CL-moderate': 0.45, 'CL-steep': 0.50, 'C-flat': 0.50, 'C-moderate': 0.55, 'C-steep': 0.60 }
  const C = C_VALS[key] || 0.35
  const Q = C * 1.0 * areaAcres
  return { runoff_coeff: C, rainfall_intensity_in_hr: 1.0, area_acres: areaAcres, peak_cfs: Math.round(Q * 100) / 100, detention_needed: Q > 2.0, detention_volume_cf: Q > 2.0 ? Math.round(Q * 3600 * 0.5) : 0 }
}

// ─── CLAUDE AI REPORT ────────────────────────────────────────────────────────

async function generateReportText(summary) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return '⚠️ AI report unavailable — ANTHROPIC_API_KEY not set in Netlify environment variables.'

  const client = new Anthropic({ apiKey })
  const floodRisk = ['AE', 'VE', 'A', 'AO'].includes(summary.flood_zone) ? 'HIGH' : 'LOW'
  const netDir = summary.net_cy > 0 ? 'export (surplus)' : 'import (deficit)'

  const prompt = `You are a friendly civil engineer explaining a land feasibility study to a homeowner or small developer. Use plain English. Be direct about risks. Use bullet points.

SITE DATA:
- Address: ${summary.address || 'User-selected parcel'}
- Area: ${summary.area_acres?.toFixed(2)} acres (${(summary.buildable_sf || 0).toLocaleString()} SF buildable)
- Elevation: ${summary.avg_elevation_ft?.toFixed(0)} ft avg, range ${summary.min_elevation_ft?.toFixed(0)}–${summary.max_elevation_ft?.toFixed(0)} ft
- Slope: ${summary.avg_slope_pct?.toFixed(1)}% avg, ${summary.max_slope_pct?.toFixed(1)}% max
- Flood zone: ${summary.flood_zone} — Risk: ${floodRisk}
- Seismic Design Category: ${summary.seismic_sdc}
- Wildfire risk: ${summary.fire_risk}
- Soil: ${summary.soil_texture}, shrink-swell: ${summary.shrink_swell}, caliche: ${summary.caliche ? 'Yes' : 'No'}
- Wetlands: ${summary.wetlands_present ? 'Present — Section 404 permit likely required' : 'None detected'}
- Wind: ${summary.wind_mph} mph, Snow: ${summary.snow_psf} psf

ENGINEERING RESULTS:
- Cut: ${(summary.cut_cy || 0).toLocaleString()} CY | Fill: ${(summary.fill_cy || 0).toLocaleString()} CY | Net: ${Math.abs(summary.net_cy || 0).toLocaleString()} CY ${netDir}
- Foundation: ${summary.foundation_type}

COST ESTIMATE:
- Now: $${(summary.total_now || 0).toLocaleString()} | 5yr: $${(summary.cost_5yr || 0).toLocaleString()} | 10yr: $${(summary.cost_10yr || 0).toLocaleString()}

Write exactly 6 sections with ## headers:
## 1. Site Snapshot
## 2. Risk Assessment (use 🟢 🟡 🔴 for each risk)
## 3. What You Can Build
## 4. Earthwork & Site Prep Summary
## 5. Cost Estimate & 10-Year Projection
## 6. Your Next Steps (4–6 bullet actions)

End with: ⚠️ DISCLAIMER: Preliminary planning only. Not a substitute for licensed PE review.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }],
    })
    return response.content[0].text
  } catch (e) {
    return `AI report generation failed: ${e.message}`
  }
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' }

  try {
    const body = JSON.parse(event.body || '{}')
    const polygon = body.polygon
    if (!polygon) throw new Error('polygon is required')

    const address = body.address || ''
    const buildingType = body.building_type || 'single_family'

    // Parallel GIS data fetch
    const [elevData, floodData, soilData, seismicData, fireData, wetlandsData] = await Promise.all([
      getElevationGrid(polygon),
      getFloodZone(polygon),
      getSoilData(polygon),
      getSeismicData(polygon),
      getFireRisk(polygon),
      getWetlands(polygon),
    ])

    // Engineering calcs
    const slopeData = calculateSlope(elevData.grid, elevData.cell_width_ft)
    const cutFill = calculateCutFill(elevData.grid, elevData.avg_elevation_ft, elevData.cell_width_ft)
    const sdc = getSeismicDesignCategory(seismicData.sds, seismicData.sd1)
    const [foundationType, foundationCode] = recommendFoundation(floodData.zone, slopeData.avg_slope_pct, soilData.texture_class, soilData.shrink_swell, sdc, soilData.caliche)
    const loads = estimateStructuralLoads(seismicData.wind_mph, seismicData.sds, seismicData.sd1, sdc, elevData.avg_elevation_ft)
    const runoff = calculateRunoff(elevData.area_acres, slopeData.avg_slope_pct, soilData.texture_class)

    const steepFrac = slopeData.steep_fraction_pct / 100
    const wetFrac = wetlandsData.coverage_pct / 100
    const totalSf = elevData.area_acres * 43560
    const buildableSf = Math.max(totalSf * (1 - steepFrac) * (1 - wetFrac) - 5000, 0)

    const costs = estimateCost(cutFill.cut_cy, cutFill.fill_cy, foundationType, buildableSf, elevData.center_lat, elevData.center_lon, loads.cost_multiplier)

    const summary = {
      address, area_acres: elevData.area_acres,
      avg_elevation_ft: elevData.avg_elevation_ft, min_elevation_ft: elevData.min_ft, max_elevation_ft: elevData.max_ft,
      avg_slope_pct: slopeData.avg_slope_pct, max_slope_pct: slopeData.max_slope_pct,
      flood_zone: floodData.zone, seismic_sdc: sdc,
      fire_risk: fireData.risk_class,
      soil_texture: soilData.texture_class, shrink_swell: soilData.shrink_swell, caliche: soilData.caliche,
      wetlands_present: wetlandsData.present,
      foundation_type: foundationType, foundation_code: foundationCode,
      cut_cy: cutFill.cut_cy, fill_cy: cutFill.fill_cy, net_cy: cutFill.net_cy,
      wind_mph: seismicData.wind_mph, snow_psf: loads.snow_psf,
      buildable_sf: Math.round(buildableSf),
      total_now: costs.total_now, cost_5yr: costs.projections[5], cost_10yr: costs.projections[10],
    }

    const reportText = await generateReportText(summary)

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        status: 'ok',
        data: {
          elevation: elevData, slope: slopeData, flood: floodData, soil: soilData,
          seismic: { ...seismicData, sdc }, fire: fireData, wetlands: wetlandsData,
          cut_fill: cutFill,
          foundation: { type: foundationType, code_ref: foundationCode },
          loads, runoff,
          buildable_sf: Math.round(buildableSf),
          costs, summary, report_text: reportText,
        },
      }),
    }
  } catch (e) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ status: 'error', message: e.message }) }
  }
}
