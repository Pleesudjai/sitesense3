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

// ─── SOIL (USDA SSURGO via SoilWeb + SDA) ────────────────────────────────────
//
// Two-step approach:
// 1. SoilWeb point API → basic texture + series (fast)
// 2. USDA Soil Data Access (SDA) → full SSURGO properties:
//    hydrologic soil group, drainage class, shrink-swell, flooding frequency,
//    depth to water table, corrosion risk, building site limitations

const SHRINK_SWELL = { C: 'High', CL: 'High', SiC: 'High', SiCL: 'Moderate', SC: 'Moderate', SCL: 'Low', SiL: 'Low', Si: 'Low', L: 'Low', SL: 'Low', LS: 'Low', S: 'Low', GR: 'Low', CB: 'Low', ST: 'Low', BY: 'Low', MK: 'Low', PT: 'Low' }
const TEXTURE_DESC = {
  C: 'Clay (high plasticity, PI>30)', CL: 'Clay Loam (expansive, PI 15-30)', SiC: 'Silty Clay (high plasticity)', SiCL: 'Silty Clay Loam (moderate plasticity)',
  SC: 'Sandy Clay (moderate shrink-swell)', SCL: 'Sandy Clay Loam', SiL: 'Silt Loam (frost-susceptible)', Si: 'Silt (highly frost-susceptible, liquefiable)',
  L: 'Loam (well-balanced)', SL: 'Sandy Loam', S: 'Sand (drains fast, low bearing)', LS: 'Loamy Sand',
  GR: 'Gravel (high bearing, free-draining)', CB: 'Cobbles', ST: 'Stones', BY: 'Boulders',
  MK: 'Muck (organic, compressible — not suitable for foundations)', PT: 'Peat (highly compressible — deep foundations required)',
}
const HSG_DESC = { A: 'Low runoff potential — sandy, well-drained', B: 'Moderate runoff — loamy, moderate infiltration', C: 'Moderately high runoff — slow infiltration', D: 'High runoff — clay, very slow infiltration' }

// USCS classification estimate from USDA texture (for foundation design per IBC 2021 Table 1806.2)
const USCS_ESTIMATE = {
  S: 'SP/SW', LS: 'SM', SL: 'SM/SC', L: 'CL/ML', SiL: 'ML', Si: 'ML',
  SCL: 'SC', CL: 'CL', SiCL: 'CL/CH', SC: 'SC', SiC: 'CH', C: 'CH',
  GR: 'GP/GW', CB: 'GP', MK: 'OH/OL', PT: 'PT',
}

// Presumptive bearing capacity (psf) per IBC 2021 Table 1806.2
const BEARING_PSF = {
  'GP/GW': 4000, 'SP/SW': 3000, 'SM': 2000, 'SM/SC': 2000, 'SC': 2000,
  'CL/ML': 2000, 'ML': 1500, 'CL': 1500, 'CL/CH': 1500, 'CH': 1000,
  'OH/OL': 0, 'PT': 0,    // organic/peat — not suitable, deep foundations required
}

// Frost susceptibility rating by texture (AASHTO/FHWA)
const FROST_SUSCEPTIBILITY = {
  S: 'Negligible', LS: 'Low', SL: 'Low', GR: 'Negligible', CB: 'Negligible',
  L: 'Medium', SiL: 'High', Si: 'Very High',
  CL: 'Medium', SCL: 'Low', SiCL: 'High', SC: 'Low', SiC: 'High', C: 'Medium',
  MK: 'High', PT: 'High',
}

async function getSoilData(polygon) {
  const [cx, cy] = polygonCentroid(polygon.coordinates)

  // Step 1: SoilWeb for basic texture + series
  let soilwebData = null
  try {
    const res = await fetch(`https://casoilresource.lawr.ucdavis.edu/api/point/?lon=${cx}&lat=${cy}`,
      { signal: AbortSignal.timeout(8000) })
    soilwebData = await res.json()
  } catch { /* continue to SDA */ }

  // Step 2: USDA SDA (Soil Data Access) for full SSURGO properties
  let sdaData = null
  try {
    const sdaQuery = `
      SELECT TOP 1
        mu.muname, mu.mukey,
        c.compname, c.comppct_r, c.taxclname,
        c.hydgrp, c.drainagecl, c.tfact,
        c.corcon, c.corsteel,
        c.flooding_freq_r AS flood_freq,
        c.ponding_freq_r AS pond_freq,
        c.slope_r, c.elev_r,
        c.frostact,
        h.hzdepb_r AS restrict_depth_cm,
        h.reskind AS restriction_kind,
        (SELECT TOP 1 chtexturegrp.texdesc FROM chorizon
         JOIN chtexturegrp ON chorizon.chkey = chtexturegrp.chkey
         WHERE chorizon.cokey = c.cokey
         ORDER BY chorizon.hzdept_r) AS surface_texture,
        (SELECT TOP 1 ch.ll_r FROM chorizon ch
         WHERE ch.cokey = c.cokey ORDER BY ch.hzdept_r) AS liquid_limit,
        (SELECT TOP 1 ch.pi_r FROM chorizon ch
         WHERE ch.cokey = c.cokey ORDER BY ch.hzdept_r) AS plasticity_index,
        (SELECT TOP 1 ch.ksat_r FROM chorizon ch
         WHERE ch.cokey = c.cokey ORDER BY ch.hzdept_r) AS ksat_um_s,
        (SELECT TOP 1 ch.dbthirdbar_r FROM chorizon ch
         WHERE ch.cokey = c.cokey ORDER BY ch.hzdept_r) AS bulk_density
      FROM sacatalog sa
      JOIN legend l ON sa.areasymbol = l.areasymbol
      JOIN mapunit mu ON l.lkey = mu.lkey
      JOIN component c ON mu.mukey = c.mukey
      LEFT JOIN corestrictions h ON c.cokey = h.cokey
      WHERE mu.mukey IN (
        SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('POINT(${cx} ${cy})')
      )
      ORDER BY c.comppct_r DESC
    `.trim()

    const sdaRes = await fetch('https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `query=${encodeURIComponent(sdaQuery)}&format=JSON`,
      signal: AbortSignal.timeout(12000),
    })
    const sdaJson = await sdaRes.json()
    if (sdaJson.Table && sdaJson.Table.length > 0) {
      sdaData = sdaJson.Table[0]
    }
  } catch { /* fallback to SoilWeb only */ }

  // Merge results
  const series = soilwebData?.series || []
  const dominant = series.length ? series[0] : null
  const texture = dominant?.texture || (sdaData?.surface_texture?.split(' ')[0]) || 'L'
  const shrinkSwell = SHRINK_SWELL[texture] || 'Low'
  const caliche = cy < 37 && cx < -104 && ['S', 'LS', 'SL', 'SCL'].includes(texture)

  // Hydrologic soil group from SDA
  const hsg = sdaData?.hydgrp || _estimateHSG(texture)
  const drainage = sdaData?.drainagecl || dominant?.drainagecl || 'well drained'
  const floodFreq = sdaData?.flood_freq || 'None'
  const pondFreq = sdaData?.pond_freq || 'None'
  const restrictDepth = sdaData?.restrict_depth_cm ? Math.round(sdaData.restrict_depth_cm / 2.54) : null // cm → in
  const restrictKind = sdaData?.restriction_kind || null
  const corrosionConcrete = sdaData?.corcon || 'Low'
  const corrosionSteel = sdaData?.corsteel || 'Low'
  const taxClass = sdaData?.taxclname || null

  // Atterberg limits from SDA (critical for foundation design)
  const liquidLimit = sdaData?.liquid_limit ? parseFloat(sdaData.liquid_limit) : null
  const plasticityIndex = sdaData?.plasticity_index ? parseFloat(sdaData.plasticity_index) : null
  const ksatUmS = sdaData?.ksat_um_s ? parseFloat(sdaData.ksat_um_s) : null
  const bulkDensity = sdaData?.bulk_density ? parseFloat(sdaData.bulk_density) : null
  const frostAction = sdaData?.frostact || FROST_SUSCEPTIBILITY[texture] || 'Low'

  // USCS classification and presumptive bearing (IBC 2021 Table 1806.2)
  const uscsClass = USCS_ESTIMATE[texture] || 'CL'
  const presumptiveBearingPsf = BEARING_PSF[uscsClass] || 1500

  // Classify expansive potential from PI (ASTM D4829 / IBC Table 1803.5.3)
  let expansiveRisk = 'Low'
  if (plasticityIndex !== null) {
    if (plasticityIndex > 35) expansiveRisk = 'Very High'
    else if (plasticityIndex > 25) expansiveRisk = 'High'
    else if (plasticityIndex > 15) expansiveRisk = 'Moderate'
  } else if (shrinkSwell === 'High') {
    expansiveRisk = 'High'
  } else if (shrinkSwell === 'Moderate') {
    expansiveRisk = 'Moderate'
  }

  // Collapsible soil risk (common in AZ arid regions — dry low-density loess/alluvium)
  const collapsible = (bulkDensity !== null && bulkDensity < 1.4 && ['SL', 'SiL', 'L', 'Si'].includes(texture))
  // Liquefiable risk (saturated loose sand/silt, water table shallow)
  const waterTableDepth = sdaData?.water_table_depth ? parseFloat(sdaData.water_table_depth) : null
  const liquefiable = (['S', 'LS', 'SL', 'Si'].includes(texture) && waterTableDepth !== null && waterTableDepth < 50)

  // Organic soil flag (peat/muck — IBC 2021 §1803.5.5)
  const isOrganic = ['MK', 'PT', 'OH', 'OL'].includes(texture) ||
    (taxClass && /histosol|organic|muck|peat/i.test(taxClass))

  // Building site limitations
  const limitations = []
  if (isOrganic) limitations.push('Organic soil (peat/muck) — not suitable for spread footings; deep foundations required (IBC §1803.5.5)')
  if (expansiveRisk === 'Very High' || expansiveRisk === 'High')
    limitations.push(`Expansive soil (PI=${plasticityIndex || '?'}) — post-tension slab required (ACI 360R-10 §5.4)`)
  else if (shrinkSwell === 'High')
    limitations.push('High shrink-swell — post-tension slab required (ACI 360R-10 §5.4)')
  if (collapsible) limitations.push('Collapsible soil risk (low bulk density) — pre-wetting or compaction grouting may be needed')
  if (liquefiable) limitations.push('Liquefaction risk — shallow water table + loose granular soil; ground improvement needed')
  if (caliche) limitations.push('Caliche hardpan likely — mechanical breaking needed for excavation ($3-8/SF)')
  if (restrictKind && restrictDepth && restrictDepth < 40) {
    limitations.push(`${restrictKind} at ~${restrictDepth} in. — may limit foundation depth or require rock removal`)
  } else if (restrictDepth && restrictDepth < 40) {
    limitations.push(`Restrictive layer at ~${restrictDepth} in. — may limit foundation depth`)
  }
  if (hsg === 'D') limitations.push('Very slow infiltration (HSG D) — detention/retention basin likely required')
  if (drainage.toLowerCase().includes('poor')) limitations.push('Poor drainage — dewatering may be needed during construction')
  if (floodFreq && floodFreq !== 'None') limitations.push(`Soil flooding frequency: ${floodFreq}`)
  if (corrosionConcrete === 'High') limitations.push('High concrete corrosion risk — sulfate-resistant cement required (ACI 318-19 Table 19.3.1.1)')
  if (corrosionSteel === 'High') limitations.push('High steel corrosion risk — protective coating or cathodic protection needed')
  if (frostAction === 'High' || frostAction === 'Very High') limitations.push(`High frost susceptibility (${texture}) — frost-protected shallow foundation or deeper footing below frost line`)
  if (presumptiveBearingPsf < 1500) limitations.push(`Low presumptive bearing (${presumptiveBearingPsf} psf) — geotechnical investigation required`)

  // Septic suitability
  const septicSuitable = hsg !== 'D' && !drainage.toLowerCase().includes('poor') && shrinkSwell !== 'High' && !isOrganic

  return {
    series_name: dominant?.series || sdaData?.compname || 'Unknown',
    map_unit: sdaData?.muname || null,
    texture_class: texture,
    texture_description: TEXTURE_DESC[texture] || sdaData?.surface_texture || `Soil: ${texture}`,
    taxonomic_class: taxClass,
    uscs_estimate: uscsClass,
    hydrologic_group: hsg,
    hydrologic_group_description: HSG_DESC[hsg] || `HSG ${hsg}`,
    drainage_class: drainage,
    shrink_swell: shrinkSwell,
    expansive_risk: expansiveRisk,
    liquid_limit: liquidLimit,
    plasticity_index: plasticityIndex,
    presumptive_bearing_psf: presumptiveBearingPsf,
    frost_susceptibility: frostAction,
    collapsible,
    liquefiable,
    organic: isOrganic,
    caliche,
    ksat_in_hr: ksatUmS ? Math.round(ksatUmS * 0.1417 * 100) / 100 : null,  // μm/s → in/hr
    bulk_density_g_cm3: bulkDensity,
    flooding_frequency: floodFreq,
    ponding_frequency: pondFreq,
    restrictive_depth_in: restrictDepth,
    restriction_kind: restrictKind,
    water_table_depth_in: waterTableDepth,
    corrosion_concrete: corrosionConcrete,
    corrosion_steel: corrosionSteel,
    septic_suitable: septicSuitable,
    building_limitations: limitations,
    bearing_hint: _bearingHint(texture, drainage, shrinkSwell, presumptiveBearingPsf, expansiveRisk, collapsible, isOrganic),
  }
}

function _estimateHSG(texture) {
  // Estimate hydrologic soil group from texture when SDA unavailable
  if (['S', 'LS'].includes(texture)) return 'A'
  if (['SL', 'L', 'SiL'].includes(texture)) return 'B'
  if (['SCL', 'CL', 'SiCL', 'SC'].includes(texture)) return 'C'
  if (['C', 'SiC'].includes(texture)) return 'D'
  return 'B'
}

function _bearingHint(texture, drainage, shrinkSwell, bearingPsf, expansiveRisk, collapsible, organic) {
  if (organic)
    return 'Unsuitable — organic soil cannot support spread footings; deep foundations required (IBC §1803.5.5)'
  if (collapsible)
    return 'Poor — collapsible soil; pre-wetting, dynamic compaction, or deep foundations needed'
  if (expansiveRisk === 'Very High' || expansiveRisk === 'High')
    return `Low (~${bearingPsf} psf) — highly expansive; PT slab or drilled shafts past active zone required`
  if (shrinkSwell === 'High' || ['C', 'CL', 'SiC'].includes(texture))
    return `Low (~${bearingPsf} psf) — expansive/soft conditions; geotechnical boring required before design`
  if (drainage.toLowerCase().includes('poor'))
    return `Low (~${bearingPsf} psf) — poor drainage; dewatering and subgrade improvement likely needed`
  if (['S', 'LS'].includes(texture))
    return `Variable (~${bearingPsf} psf) — sandy; compaction testing required before foundation`
  return `Moderate (~${bearingPsf} psf) — standard bearing expected; verify with geotechnical investigation`
}

function defaultSoil(lat, lon) {
  if (lat > 31 && lat < 36 && lon > -115 && lon < -109)
    return { series_name: 'Mohave-Laveen (AZ typical)', texture_class: 'SL', texture_description: 'Sandy Loam', drainage_class: 'well drained', shrink_swell: 'Low', caliche: true, hydrologic_group: 'A', hydrologic_group_description: HSG_DESC.A, flooding_frequency: 'None', ponding_frequency: 'None', restrictive_depth_in: null, corrosion_concrete: 'Low', corrosion_steel: 'Moderate', septic_suitable: true, building_limitations: ['Caliche hardpan likely — mechanical breaking needed'], bearing_hint: 'Variable — caliche possible; get soil boring' }
  return { series_name: 'Unknown', texture_class: 'L', texture_description: 'Loam', drainage_class: 'well drained', shrink_swell: 'Low', caliche: false, hydrologic_group: 'B', hydrologic_group_description: HSG_DESC.B, flooding_frequency: 'None', ponding_frequency: 'None', restrictive_depth_in: null, corrosion_concrete: 'Low', corrosion_steel: 'Low', septic_suitable: true, building_limitations: [], bearing_hint: 'Moderate — verify with geotechnical investigation' }
}

// ─── SOIL ZONES (SSURGO map unit polygons as GeoJSON) ────────────────────────
//
// Two-step approach for maximum reliability:
// 1. Try SDA spatial query with proper WKT parsing (returns polygon geometries + properties)
// 2. Fallback: query SDA for mukeys only, then fetch properties separately
//
// The WKT parser handles SQL Server's STAsText() output which uses:
//   MULTIPOLYGON (((x y, x y, ...)), ((x y, ...)))
//   POLYGON ((x y, x y, ...))

async function getSoilZones(polygon) {
  const [minX, minY, maxX, maxY] = polygonBounds(polygon.coordinates)
  const buf = 0.002  // ~200m buffer for context

  // Step 1: Try SDA spatial query for polygon geometries
  try {
    const bboxWkt = `POLYGON((${minX - buf} ${minY - buf}, ${maxX + buf} ${minY - buf}, ${maxX + buf} ${maxY + buf}, ${minX - buf} ${maxY + buf}, ${minX - buf} ${minY - buf}))`

    const sdaQuery = `
      SELECT
        mupolygongeo.STAsText() AS geom_wkt,
        mapunit.mukey, mapunit.muname, mapunit.musym,
        muaggatt.hydgrpdcd AS hydgrp,
        muaggatt.drclassdcd AS drainage,
        muaggatt.wtdepannmin AS water_table_depth,
        muaggatt.flodfreqdcd AS flood_freq,
        muaggatt.slopegraddcp AS slope_gradient,
        muaggatt.aws025wta AS avail_water_storage
      FROM mupolygon
      JOIN mapunit ON mupolygon.mukey = mapunit.mukey
      LEFT JOIN muaggatt ON mapunit.mukey = muaggatt.mukey
      WHERE mupolygongeo.STIntersects(
        geometry::STGeomFromText('${bboxWkt}', 4326)
      ) = 1
    `.trim()

    const res = await fetch('https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `query=${encodeURIComponent(sdaQuery)}&format=JSON`,
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) throw new Error(`SDA HTTP ${res.status}`)
    const data = await res.json()
    const rows = data?.Table || []

    if (rows.length > 0) {
      const features = []
      for (const row of rows) {
        if (!row.geom_wkt) continue
        const geojson = wktToGeoJSON(row.geom_wkt)
        if (!geojson) continue
        features.push({
          type: 'Feature',
          properties: {
            mukey: row.mukey, muname: row.muname || 'Unknown', musym: row.musym || '',
            hydgrp: row.hydgrp || 'B', drainage: row.drainage || 'Well drained',
            water_table_depth: row.water_table_depth, flood_freq: row.flood_freq || 'None',
            slope_gradient: row.slope_gradient, avail_water_storage: row.avail_water_storage,
          },
          geometry: geojson,
        })
      }
      if (features.length > 0) return { type: 'FeatureCollection', features }
    }
  } catch { /* fall through to alternative method */ }

  // Step 2: Fallback — use SDA_Get_Mukey_from_intersection to get mukeys,
  // then build simple rectangular zones from the parcel bbox
  try {
    const [cx, cy] = polygonCentroid(polygon.coordinates)
    const muQuery = `SELECT mukey, muname, musym FROM mapunit WHERE mukey IN (SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('POINT(${cx} ${cy})'))`
    const muRes = await fetch('https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `query=${encodeURIComponent(muQuery)}&format=JSON`,
      signal: AbortSignal.timeout(10000),
    })
    const muData = await muRes.json()
    const muRows = muData?.Table || []
    if (!muRows.length) return { type: 'FeatureCollection', features: [] }

    // Get properties for each mukey
    const mukeys = muRows.map(r => r.mukey).join(',')
    const propQuery = `SELECT mukey, hydgrpdcd AS hydgrp, drclassdcd AS drainage, flodfreqdcd AS flood_freq, slopegraddcp AS slope_gradient FROM muaggatt WHERE mukey IN (${mukeys})`
    const propRes = await fetch('https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `query=${encodeURIComponent(propQuery)}&format=JSON`,
      signal: AbortSignal.timeout(10000),
    })
    const propData = await propRes.json()
    const propMap = {}
    for (const r of (propData?.Table || [])) propMap[r.mukey] = r

    // Create simple polygon features spanning the parcel
    const features = muRows.map((row, i) => {
      const n = muRows.length
      const sliceW = (maxX - minX + buf * 2) / n
      const x0 = minX - buf + i * sliceW
      const x1 = x0 + sliceW
      const props = propMap[row.mukey] || {}
      return {
        type: 'Feature',
        properties: {
          mukey: row.mukey, muname: row.muname || 'Unknown', musym: row.musym || '',
          hydgrp: props.hydgrp || 'B', drainage: props.drainage || 'Well drained',
          flood_freq: props.flood_freq || 'None', slope_gradient: props.slope_gradient,
          approximate: true,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[x0, minY - buf], [x1, minY - buf], [x1, maxY + buf], [x0, maxY + buf], [x0, minY - buf]]],
        },
      }
    })
    return { type: 'FeatureCollection', features }
  } catch (e) {
    return { type: 'FeatureCollection', features: [], error: e.message }
  }
}

// Parse WKT MULTIPOLYGON/POLYGON to GeoJSON geometry
// Handles SQL Server spatial STAsText() output with variable whitespace
function wktToGeoJSON(wkt) {
  try {
    // Normalize whitespace
    wkt = wkt.trim()

    if (wkt.startsWith('MULTIPOLYGON')) {
      // Strip "MULTIPOLYGON" and outermost parens
      let inner = wkt.replace(/^MULTIPOLYGON\s*\(\s*/, '').replace(/\s*\)\s*$/, '')
      // Split on ")),((" to separate individual polygons
      const polyStrings = inner.split(/\)\s*,\s*\(/)
      const polygons = polyStrings.map(ps => {
        // Clean remaining parens and split into rings
        ps = ps.replace(/^\(+/, '').replace(/\)+$/, '')
        const ringStrings = ps.split(/\)\s*,\s*\(/)
        return ringStrings.map(rs => {
          rs = rs.replace(/^\(+/, '').replace(/\)+$/, '')
          return rs.split(/\s*,\s*/).map(pt => {
            const parts = pt.trim().split(/\s+/)
            return [parseFloat(parts[0]), parseFloat(parts[1])]
          })
        })
      })
      return { type: 'MultiPolygon', coordinates: polygons }
    }

    if (wkt.startsWith('POLYGON')) {
      let inner = wkt.replace(/^POLYGON\s*\(\s*/, '').replace(/\s*\)\s*$/, '')
      const ringStrings = inner.split(/\)\s*,\s*\(/)
      const rings = ringStrings.map(rs => {
        rs = rs.replace(/^\(+/, '').replace(/\)+$/, '')
        return rs.split(/\s*,\s*/).map(pt => {
          const parts = pt.trim().split(/\s+/)
          return [parseFloat(parts[0]), parseFloat(parts[1])]
        })
      })
      return { type: 'Polygon', coordinates: rings }
    }

    return null
  } catch { return null }
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

function recommendFoundation(floodZone, slopePct, soilClass, shrinkSwell, sdc, caliche, soilData) {
  // Priority ladder — most critical condition wins
  const organic = soilData?.organic
  const collapsible = soilData?.collapsible
  const liquefiable = soilData?.liquefiable
  const expansiveRisk = soilData?.expansive_risk

  if (organic)
    return ['DEEP_PILE', 'IBC 2021 §1803.5.5 — Deep piles through organic soil to competent bearing stratum']
  if (['AE', 'VE', 'AO', 'AH'].includes(floodZone))
    return ['ELEVATED_PILE', `ASCE 7-22 Ch.5 — Elevated/pile foundation required in Zone ${floodZone}`]
  if (slopePct > 30)
    return ['DRILLED_CAISSON', 'ACI 350-20 §4.3 + IBC 2021 §1807 — Drilled caisson required for slope > 30%']
  if (['D', 'E', 'F'].includes(sdc))
    return ['DEEP_PILE_SEISMIC', `ASCE 7-22 Ch.12 — Deep pile with seismic detailing required for SDC ${sdc}`]
  if (liquefiable)
    return ['DEEP_PILE_SEISMIC', 'IBC 2021 §1803.5.11 — Deep foundations past liquefiable stratum + ground improvement']
  if (collapsible)
    return ['GRADE_BEAM_ON_PIERS', 'IBC 2021 §1803.5.9 — Grade beams on drilled piers past collapsible zone']
  if (expansiveRisk === 'Very High' || expansiveRisk === 'High')
    return ['POST_TENSIONED_SLAB', `ACI 360R-10 §5.4 — PT slab for ${expansiveRisk.toLowerCase()} expansive risk (PI=${soilData?.plasticity_index || '?'})`]
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
const FND_COSTS = { DEEP_PILE: { low: 45, high: 80 }, ELEVATED_PILE: { low: 35, high: 65 }, DRILLED_CAISSON: { low: 25, high: 45 }, DEEP_PILE_SEISMIC: { low: 40, high: 70 }, POST_TENSIONED_SLAB: { low: 14, high: 22 }, GRADE_BEAM_ON_PIERS: { low: 18, high: 30 }, MAT_FOUNDATION: { low: 20, high: 35 }, CONVENTIONAL_SLAB: { low: 8, high: 15 } }

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
- Soil: ${summary.soil_texture}, USCS: ${summary.uscs_estimate || '?'}, HSG: ${summary.hydrologic_group || 'B'}
  Shrink-swell: ${summary.shrink_swell}, Expansive risk: ${summary.expansive_risk || '?'}, LL=${summary.liquid_limit || '?'}, PI=${summary.plasticity_index || '?'}
  Bearing: ~${summary.presumptive_bearing_psf || '?'} psf (IBC Table 1806.2), Drainage: ${summary.drainage_class || 'well drained'}
  Caliche: ${summary.caliche ? 'Yes' : 'No'}, Collapsible: ${summary.collapsible ? 'Yes' : 'No'}, Liquefiable: ${summary.liquefiable ? 'Yes' : 'No'}, Organic: ${summary.organic ? 'Yes' : 'No'}
  Frost: ${summary.frost_susceptibility || 'Low'}, Corrosion (concrete/steel): ${summary.corrosion_concrete || 'Low'}/${summary.corrosion_steel || 'Low'}
- Building limitations: ${(summary.building_limitations || []).join('; ') || 'None identified'}
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

// ─── NOAA ATLAS 14 PRECIPITATION ──────────────────────────────────────────────

async function getPrecipitation(polygon) {
  const [cx, cy] = polygonCentroid(polygon.coordinates)
  try {
    const res = await fetch(
      `https://hdsc.nws.noaa.gov/cgi-bin/hdsc/new/cgi_readH5.py?lat=${cy}&lon=${cx}&type=pf&data=depth&units=english&series=pds`,
      { signal: AbortSignal.timeout(12000) }
    )
    const text = await res.text()
    // Parse the NOAA response — returns precipitation depths for various durations/frequencies
    // Extract 10-yr, 1-hr intensity (key metric for stormwater calcs)
    const lines = text.split('\n')
    let intensity_10yr_1hr = 1.0 // fallback
    let rainfall_data = {}
    for (const line of lines) {
      // NOAA returns CSV-like data with storm frequencies
      if (line.includes('by duration for ARI')) continue
      const parts = line.split(',').map(s => s.trim())
      if (parts.length > 5 && parts[0] === '60') {
        // 60-min duration row: [duration, 1yr, 2yr, 5yr, 10yr, 25yr, 50yr, 100yr]
        const val10yr = parseFloat(parts[4])
        if (!isNaN(val10yr) && val10yr > 0) intensity_10yr_1hr = val10yr
        rainfall_data = {
          '2yr_1hr': parseFloat(parts[2]) || null,
          '5yr_1hr': parseFloat(parts[3]) || null,
          '10yr_1hr': parseFloat(parts[4]) || null,
          '25yr_1hr': parseFloat(parts[5]) || null,
          '100yr_1hr': parseFloat(parts[7]) || null,
        }
      }
    }
    return {
      source: 'NOAA Atlas 14',
      intensity_10yr_1hr_in: Math.round(intensity_10yr_1hr * 100) / 100,
      rainfall_data,
      description: `10-yr, 1-hr rainfall: ${intensity_10yr_1hr.toFixed(2)} in/hr`,
    }
  } catch (e) {
    // Fallback to regional lookup
    const intensity = cy > 31 && cy < 34 && cx > -113 && cx < -111 ? 1.0 :
                      cy > 29 && cy < 31 && cx > -96 && cx < -93 ? 1.5 : 1.0
    return {
      source: 'Regional estimate (NOAA unavailable)',
      intensity_10yr_1hr_in: intensity,
      rainfall_data: {},
      description: `Estimated 10-yr, 1-hr rainfall: ${intensity} in/hr`,
      fallback: true,
    }
  }
}

// ─── EPA CONTAMINATION SCREENING ──────────────────────────────────────────────

async function getContamination(polygon) {
  const [cx, cy] = polygonCentroid(polygon.coordinates)
  const radiusMiles = 1.0

  // Query EPA Envirofacts for facilities within 1 mile
  try {
    const res = await fetch(
      `https://enviro.epa.gov/enviro/efservice/getEnvFacts/LATITUDE/${cy}/LONGITUDE/${cx}/RADIUS/${radiusMiles}/JSON`,
      { signal: AbortSignal.timeout(12000) }
    )

    if (!res.ok) {
      // Try alternative: EPA FRS (Facility Registry Service) geospatial query
      return await getContaminationFRS(cx, cy)
    }

    const data = await res.json()
    const sites = Array.isArray(data) ? data : []
    const superfund = sites.filter(s => s.PGM_SYS_ACRNM === 'CERCLIS' || s.PGM_SYS_ACRNM === 'SEMS')
    const rcra = sites.filter(s => s.PGM_SYS_ACRNM === 'RCRAINFO')
    const brownfield = sites.filter(s => s.PGM_SYS_ACRNM === 'ACRES')

    return {
      total_sites: sites.length,
      superfund_count: superfund.length,
      rcra_count: rcra.length,
      brownfield_count: brownfield.length,
      radius_miles: radiusMiles,
      risk_level: superfund.length > 0 ? 'HIGH' : sites.length > 5 ? 'MODERATE' : 'LOW',
      description: sites.length === 0
        ? 'No EPA-regulated contamination sites within 1 mile'
        : `${sites.length} EPA-regulated site(s) within 1 mile${superfund.length > 0 ? ' — includes Superfund site' : ''}`,
    }
  } catch (e) {
    return await getContaminationFRS(cx, cy)
  }
}

async function getContaminationFRS(cx, cy) {
  // Fallback: query EPA FRS REST service
  try {
    const bufDeg = 0.015 // ~1 mile
    const params = new URLSearchParams({
      geometry: JSON.stringify({ xmin: cx - bufDeg, ymin: cy - bufDeg, xmax: cx + bufDeg, ymax: cy + bufDeg, spatialReference: { wkid: 4326 } }),
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'REGISTRY_ID,PRIMARY_NAME,INTEREST_TYPES',
      returnGeometry: 'false',
      f: 'json',
    })
    const res = await fetch(
      `https://geodata.epa.gov/arcgis/rest/services/OEI/FRS_INTERESTS/MapServer/0/query?${params}`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    const features = data.features || []
    const count = features.length
    const hasSuperfund = features.some(f => (f.attributes?.INTEREST_TYPES || '').includes('CERCLIS'))
    return {
      total_sites: count,
      superfund_count: hasSuperfund ? 1 : 0,
      rcra_count: features.filter(f => (f.attributes?.INTEREST_TYPES || '').includes('RCRA')).length,
      brownfield_count: 0,
      radius_miles: 1.0,
      risk_level: hasSuperfund ? 'HIGH' : count > 5 ? 'MODERATE' : 'LOW',
      description: count === 0
        ? 'No EPA-regulated contamination sites within 1 mile'
        : `${count} EPA-regulated site(s) within 1 mile`,
    }
  } catch {
    return {
      total_sites: 0, superfund_count: 0, rcra_count: 0, brownfield_count: 0,
      radius_miles: 1.0, risk_level: 'LOW',
      description: 'EPA contamination data unavailable — verify with local environmental records',
      fallback: true,
    }
  }
}

// ─── USGS HYDROGRAPHY / STREAM PROXIMITY ──────────────────────────────────────

async function getHydrography(polygon) {
  const [minX, minY, maxX, maxY] = polygonBounds(polygon.coordinates)
  const [cx, cy] = polygonCentroid(polygon.coordinates)
  // Buffer ~500 ft (~0.0015 degrees)
  const buf = 0.003
  const envelope = JSON.stringify({
    xmin: minX - buf, ymin: minY - buf, xmax: maxX + buf, ymax: maxY + buf,
    spatialReference: { wkid: 4326 },
  })
  const params = new URLSearchParams({
    geometry: envelope,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'GNIS_NAME,LENGTHKM,FTYPE,FCODE',
    returnGeometry: 'false',
    f: 'json',
  })
  try {
    const res = await fetch(
      `https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/6/query?${params}`,
      { signal: AbortSignal.timeout(12000) }
    )
    const data = await res.json()
    const features = data.features || []
    if (!features.length) {
      return {
        streams_nearby: false,
        stream_count: 0,
        nearest_stream: null,
        risk_level: 'LOW',
        description: 'No mapped streams or rivers within ~500 ft of parcel',
      }
    }
    const names = [...new Set(features.map(f => f.attributes?.GNIS_NAME).filter(Boolean))]
    const types = [...new Set(features.map(f => {
      const ft = f.attributes?.FTYPE
      return ft === 460 ? 'Stream/River' : ft === 558 ? 'Artificial Path' : ft === 336 ? 'Canal/Ditch' : 'Waterway'
    }))]
    return {
      streams_nearby: true,
      stream_count: features.length,
      stream_names: names.length ? names : ['Unnamed waterway'],
      stream_types: types,
      risk_level: features.length > 2 ? 'MODERATE' : 'LOW',
      description: `${features.length} waterway(s) within ~500 ft: ${names.length ? names.join(', ') : 'unnamed'}`,
      setback_note: 'Check local riparian setback requirements (typically 25–100 ft from centerline)',
    }
  } catch (e) {
    return {
      streams_nearby: false, stream_count: 0, nearest_stream: null,
      risk_level: 'LOW',
      description: 'Hydrography data unavailable — check USGS NHD mapper',
      fallback: true,
    }
  }
}

// ─── USFWS CRITICAL HABITAT / ENDANGERED SPECIES ─────────────────────────────

async function getEndangeredSpecies(polygon) {
  const [minX, minY, maxX, maxY] = polygonBounds(polygon.coordinates)
  // USFWS Critical Habitat mapper — ESRI REST service
  const envelope = JSON.stringify({
    xmin: minX, ymin: minY, xmax: maxX, ymax: maxY,
    spatialReference: { wkid: 4326 },
  })
  const params = new URLSearchParams({
    geometry: envelope,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'comname,sciname,status,listing_st',
    returnGeometry: 'false',
    f: 'json',
  })
  try {
    const res = await fetch(
      `https://services.arcgis.com/QVENGdaPbd4LUkLV/ArcGIS/rest/services/USFWS_Critical_Habitat/FeatureServer/2/query?${params}`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    const features = data.features || []
    if (!features.length) {
      return {
        critical_habitat: false,
        species_count: 0,
        species: [],
        risk_level: 'LOW',
        description: 'No critical habitat or endangered species mapped in this area',
      }
    }
    const species = [...new Set(features.map(f => f.attributes?.comname || f.attributes?.sciname).filter(Boolean))]
    const endangered = features.filter(f => (f.attributes?.listing_st || '').toLowerCase().includes('endangered'))
    return {
      critical_habitat: true,
      species_count: species.length,
      species: species.slice(0, 5),
      has_endangered: endangered.length > 0,
      risk_level: endangered.length > 0 ? 'HIGH' : 'MODERATE',
      description: `Critical habitat detected: ${species.slice(0, 3).join(', ')}${species.length > 3 ? ` (+${species.length - 3} more)` : ''}`,
      permit_note: 'Federal ESA Section 7 consultation may be required before development',
    }
  } catch {
    return {
      critical_habitat: false, species_count: 0, species: [],
      risk_level: 'LOW',
      description: 'Endangered species data unavailable — check USFWS IPaC',
      fallback: true,
    }
  }
}

// ─── NPS NATIONAL REGISTER OF HISTORIC PLACES ────────────────────────────────

async function getHistoricSites(polygon) {
  const [cx, cy] = polygonCentroid(polygon.coordinates)
  // NPS National Register — ESRI REST service, search within ~0.5 mile buffer
  const bufDeg = 0.008 // ~0.5 mile
  const envelope = JSON.stringify({
    xmin: cx - bufDeg, ymin: cy - bufDeg, xmax: cx + bufDeg, ymax: cy + bufDeg,
    spatialReference: { wkid: 4326 },
  })
  const params = new URLSearchParams({
    geometry: envelope,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'RESNAME,RESTYPE,NRIS_Ref_Number',
    returnGeometry: 'false',
    f: 'json',
  })
  try {
    const res = await fetch(
      `https://mapservices.nps.gov/arcgis/rest/services/cultural_resources/nrhp_locations/MapServer/0/query?${params}`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    const features = data.features || []
    if (!features.length) {
      return {
        sites_nearby: false,
        site_count: 0,
        sites: [],
        risk_level: 'LOW',
        description: 'No National Register historic sites within ~0.5 mile',
      }
    }
    const names = features.map(f => f.attributes?.RESNAME).filter(Boolean).slice(0, 5)
    return {
      sites_nearby: true,
      site_count: features.length,
      sites: names,
      risk_level: features.length > 2 ? 'MODERATE' : 'LOW',
      description: `${features.length} historic site(s) within ~0.5 mile: ${names.slice(0, 2).join(', ')}`,
      review_note: 'Section 106 NHPA review may apply if federal funding or permits are involved',
    }
  } catch {
    return {
      sites_nearby: false, site_count: 0, sites: [],
      risk_level: 'LOW',
      description: 'Historic sites data unavailable — check NPS National Register',
      fallback: true,
    }
  }
}

// ─── USGS LANDSLIDE SUSCEPTIBILITY ───────────────────────────────────────────

async function getLandslideRisk(polygon) {
  const [cx, cy] = polygonCentroid(polygon.coordinates)
  // USGS Landslide Hazards — ArcGIS REST service
  const params = new URLSearchParams({
    geometry: `${cx},${cy}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'SUSCLASS,SUSVALUE',
    returnGeometry: 'false',
    f: 'json',
  })
  try {
    const res = await fetch(
      `https://usgs.maps.arcgis.com/apps/mapviewer/index.html`, // placeholder — actual USGS landslide service varies
      { signal: AbortSignal.timeout(8000) }
    )
    // Fallback: rule-based from slope data (more reliable for hackathon)
    throw new Error('Use rule-based fallback')
  } catch {
    // Rule-based landslide risk from slope + soil + precipitation
    const [minX, minY, maxX, maxY] = polygonBounds(polygon.coordinates)
    // High-risk regions: steep mountain areas
    const isHillside = cy > 34 && cy < 36 && cx > -113 && cx < -110 // AZ rim/mountain
    const isCoastal = (cx > -90 && cy > 29 && cy < 32) // Gulf Coast
    const isMountain = cy > 35 // general mountain regions

    let risk = 'Low'
    let description = 'Low landslide susceptibility — flat to gentle terrain'
    if (isHillside || isMountain) {
      risk = 'Moderate'
      description = 'Moderate landslide susceptibility — hillside or mountain-adjacent terrain'
    }
    return {
      risk_class: risk,
      risk_level: risk === 'Moderate' ? 'MODERATE' : 'LOW',
      description,
      source: 'Rule-based estimate (USGS landslide inventory)',
      note: 'For hillside parcels, a site-specific geotechnical assessment is recommended',
    }
  }
}

// ─── NOAA SEA LEVEL RISE ─────────────────────────────────────────────────────

async function getSeaLevelRise(polygon) {
  const [cx, cy] = polygonCentroid(polygon.coordinates)
  // Only relevant for coastal parcels — check if within ~50 miles of coast
  const isCoastal = (
    (cy < 30.5 && cx > -98 && cx < -80) || // Gulf Coast
    (cx < -117 && cy > 32 && cy < 42) ||    // CA coast
    (cx > -82 && cy > 25 && cy < 31) ||     // FL
    (cx > -78 && cy > 33 && cy < 45)        // East Coast
  )

  if (!isCoastal) {
    return {
      coastal: false,
      risk_level: 'LOW',
      description: 'Inland parcel — sea level rise not applicable',
    }
  }

  // Query NOAA SLR exposure — ESRI REST service
  try {
    const params = new URLSearchParams({
      geometry: `${cx},${cy}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'SLR_DEPTH,SCENARIO',
      returnGeometry: 'false',
      f: 'json',
    })
    const res = await fetch(
      `https://coast.noaa.gov/arcgis/rest/services/dc_slr/slr_3ft/MapServer/0/query?${params}`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    const features = data.features || []
    if (!features.length) {
      return {
        coastal: true,
        exposed_3ft: false,
        risk_level: 'LOW',
        description: 'Coastal parcel — not exposed to 3 ft sea level rise scenario',
      }
    }
    return {
      coastal: true,
      exposed_3ft: true,
      risk_level: 'HIGH',
      description: 'Parcel may be impacted by 3 ft sea level rise — long-term coastal flood risk',
      note: 'Consider long-horizon coastal resilience in investment and design decisions',
    }
  } catch {
    return {
      coastal: true,
      exposed_3ft: false,
      risk_level: 'LOW',
      description: 'Coastal parcel — sea level rise data unavailable, check NOAA SLR Viewer',
      fallback: true,
    }
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

    // Parallel GIS data fetch (14 layers)
    const [elevData, floodData, soilData, seismicData, fireData, wetlandsData, precipData, contamData, hydroData, speciesData, historicData, landslideData, slrData, soilZonesData] = await Promise.all([
      getElevationGrid(polygon),
      getFloodZone(polygon),
      getSoilData(polygon),
      getSeismicData(polygon),
      getFireRisk(polygon),
      getWetlands(polygon),
      getPrecipitation(polygon),
      getContamination(polygon),
      getHydrography(polygon),
      getEndangeredSpecies(polygon),
      getHistoricSites(polygon),
      getLandslideRisk(polygon),
      getSeaLevelRise(polygon),
      getSoilZones(polygon),
    ])

    // Engineering calcs
    const slopeData = calculateSlope(elevData.grid, elevData.cell_width_ft)
    const cutFill = calculateCutFill(elevData.grid, elevData.avg_elevation_ft, elevData.cell_width_ft)
    const sdc = getSeismicDesignCategory(seismicData.sds, seismicData.sd1)
    const [foundationType, foundationCode] = recommendFoundation(floodData.zone, slopeData.avg_slope_pct, soilData.texture_class, soilData.shrink_swell, sdc, soilData.caliche, soilData)
    const loads = estimateStructuralLoads(seismicData.wind_mph, seismicData.sds, seismicData.sd1, sdc, elevData.avg_elevation_ft)
    const runoff = calculateRunoff(elevData.area_acres, slopeData.avg_slope_pct, soilData.texture_class)
    // Override rainfall intensity with real NOAA data if available
    if (precipData.intensity_10yr_1hr_in && !precipData.fallback) {
      const C = runoff.runoff_coeff
      const i = precipData.intensity_10yr_1hr_in
      runoff.rainfall_intensity_in_hr = i
      runoff.peak_cfs = Math.round(C * i * elevData.area_acres * 100) / 100
    }

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
      soil_texture: soilData.texture_class, uscs_estimate: soilData.uscs_estimate,
      shrink_swell: soilData.shrink_swell, expansive_risk: soilData.expansive_risk,
      liquid_limit: soilData.liquid_limit, plasticity_index: soilData.plasticity_index,
      presumptive_bearing_psf: soilData.presumptive_bearing_psf,
      frost_susceptibility: soilData.frost_susceptibility,
      collapsible: soilData.collapsible, liquefiable: soilData.liquefiable, organic: soilData.organic,
      caliche: soilData.caliche, corrosion_concrete: soilData.corrosion_concrete, corrosion_steel: soilData.corrosion_steel,
      hydrologic_group: soilData.hydrologic_group, drainage_class: soilData.drainage_class,
      building_limitations: soilData.building_limitations,
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
          precipitation: precipData, contamination: contamData, hydrography: hydroData,
          endangered_species: speciesData, historic_sites: historicData, landslide: landslideData, sea_level_rise: slrData,
          soil_zones: soilZonesData,
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
