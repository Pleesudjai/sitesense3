/**
 * Netlify Function: /api/engineering-assist
 * Engineering Knowledge RAG assistant — answers code/design questions
 * with source citations and optional site context integration.
 *
 * Brain architecture: rule-based fallback when no API key is available,
 * Claude-powered deep analysis when key is present.
 */

const Anthropic = require('@anthropic-ai/sdk')

// ─── GEOCODE ────────────────────────────────────────────────────────────────

async function geocodeLocation(location) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=us`
    const res = await fetch(url, { headers: { 'User-Agent': 'SiteSense-HackASU/1.0' }, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    return data.length ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null
  } catch { return null }
}

// ─── GIS QUICK FETCHERS ────────────────────────────────────────────────────

const SHRINK_SWELL_MAP = {
  C: 'High', CL: 'High', SiC: 'High', SiCL: 'Moderate', SC: 'Moderate',
  SCL: 'Low', SiL: 'Low', Si: 'Low', L: 'Low', SL: 'Low', LS: 'Low',
  S: 'Low', GR: 'Low', CB: 'Low', ST: 'Low', BY: 'Low', MK: 'Low', PT: 'Low',
}

async function fetchSoilQuick(lat, lon) {
  try {
    const res = await fetch(
      `https://casoilresource.lawr.ucdavis.edu/api/point/?lon=${lon}&lat=${lat}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const data = await res.json()
    const series = data?.series || []
    const dominant = series.length ? series[0] : null
    const texture = dominant?.texture || 'L'
    const shrinkSwell = SHRINK_SWELL_MAP[texture] || 'Low'
    const caliche = lat < 37 && lon < -104 && ['S', 'LS', 'SL', 'SCL'].includes(texture)
    return { texture, shrinkSwell, caliche: caliche ? 'likely' : 'none' }
  } catch {
    return { texture: 'Unknown', shrinkSwell: 'Unknown', caliche: 'unknown' }
  }
}

async function fetchSeismicQuick(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: lat, longitude: lon, riskCategory: 'II', siteClass: 'D', title: 'SiteSense',
    })
    const res = await fetch(
      `https://earthquake.usgs.gov/hazard/designmaps/us/json?${params}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const data = await res.json()
    const design = data?.response?.data?.design || {}
    const mapped = data?.response?.data?.mapped || {}
    const ss = parseFloat(design.ss || mapped.ss) || 0.06
    const s1 = parseFloat(design.s1 || mapped.s1) || 0.02
    const sds = Math.round(ss * 2 / 3 * 1000) / 1000
    const sd1 = Math.round(s1 * 2 / 3 * 1000) / 1000
    // SDC from ASCE 7-22 Tables 11.6-1 / 11.6-2
    let sdc = 'A'
    if (sds >= 0.50 || sd1 >= 0.20) sdc = 'D'
    else if (sds >= 0.33 || sd1 >= 0.133) sdc = 'C'
    else if (sds >= 0.167 || sd1 >= 0.067) sdc = 'B'
    // Wind speed lookup
    let windMph = 95
    if (lat > 28 && lat < 31 && lon > -96 && lon < -93) windMph = 130
    else if (lat > 34.5 && lat < 36 && lon > -113 && lon < -110) windMph = 100
    else if (lat > 31 && lat < 37 && lon > -115 && lon < -109) windMph = 90
    return { sds, sd1, sdc, windMph }
  } catch {
    return { sds: 0.04, sd1: 0.01, sdc: 'A', windMph: 95 }
  }
}

async function fetchFloodQuick(lat, lon) {
  try {
    const params = new URLSearchParams({
      geometry: `${lon},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'FLD_ZONE',
      returnGeometry: 'false',
      f: 'json',
    })
    const res = await fetch(
      `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?${params}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const data = await res.json()
    const features = data.features || []
    const zone = features.length ? (features[0].attributes?.FLD_ZONE || 'X').trim() : 'X'
    return { zone }
  } catch {
    return { zone: 'Unknown' }
  }
}

// ─── CORS ────────────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

// ─── FALLBACK DISCLAIMER ─────────────────────────────────────────────────────

const FALLBACK_DISCLAIMER =
  'This guidance is educational only. All design decisions must be reviewed ' +
  'and approved by a licensed professional engineer. This is not a substitute ' +
  'for site-specific geotechnical investigation or stamped engineering.'

// ─── FORMAT SITE CONTEXT ─────────────────────────────────────────────────────

function formatSiteContext(ctx) {
  if (!ctx) return 'No site data available.'
  const lines = []
  if (ctx.address) lines.push(`Location: ${ctx.address}`)
  if (ctx.soil) lines.push(`Soil: ${ctx.soil.texture_description || ctx.soil.texture_class || ctx.soil.texture || 'Unknown'}, shrink-swell: ${ctx.soil.shrink_swell || ctx.soil.shrinkSwell || 'Unknown'}, bearing: ${ctx.soil.presumptive_bearing_psf || 'Unknown'} psf`)
  if (ctx.flood) lines.push(`Flood: Zone ${ctx.flood.zone}`)
  if (ctx.seismic) lines.push(`Seismic: SDC ${ctx.seismic.sdc || ctx.seismic.seismic_sdc || 'Unknown'}, SDS=${ctx.seismic.sds || 'Unknown'}`)
  if (ctx.slope) lines.push(`Slope: ${ctx.slope.avg_slope_pct || 'Unknown'}% avg`)
  if (ctx.foundation) lines.push(`Foundation: ${(ctx.foundation.type || '').replace(/_/g, ' ')}`)
  return lines.join('\n') || 'No site data available.'
}

// ─── RULE-BASED ANSWER BUILDERS ──────────────────────────────────────────────

function buildFoundationAnswer(ctx) {
  let answer = '[LICENSED] Foundation selection depends on soil conditions, flood zone, slope, and seismic design category.\n\n'
  answer += 'IBC 2021 Table 1806.2 Presumptive Bearing Capacity:\n'
  answer += '\u2022 GP/GW (Gravel): 4,000 psf \u2192 Conventional slab\n'
  answer += '\u2022 SP/SW (Sand): 3,000 psf \u2192 Conventional slab\n'
  answer += '\u2022 SM (Sandy loam): 2,000 psf \u2192 Conventional slab\n'
  answer += '\u2022 CL (Clay): 1,500 psf \u2192 PT slab if expansive (ACI 360R-10 \u00A75.4)\n'
  answer += '\u2022 CH (Fat clay): 1,000 psf \u2192 PT slab or deep foundation\n'
  answer += '\u2022 PT/OH (Organic): Not suitable \u2192 Deep piles required (IBC \u00A71803.5.5)\n\n'

  if (ctx?.soil) {
    const tex = ctx.soil.texture_description || ctx.soil.texture_class || ctx.soil.texture || 'Unknown'
    const sw = ctx.soil.shrink_swell || ctx.soil.shrinkSwell || 'Unknown'
    const bearing = ctx.soil.presumptive_bearing_psf || 'Unknown'
    const caliche = ctx.soil.caliche
    answer += `Your site: ${tex}\n`
    answer += `Shrink-swell: ${sw}\n`
    answer += `Bearing: ${bearing} psf\n`
    answer += `Caliche: ${caliche ? 'Detected \u2014 grade beams recommended (ACI 360R-10 \u00A74.2)' : 'Not detected'}\n\n`
  }

  answer += 'Foundation priority ladder:\n'
  answer += '1. Organic soil \u2192 Deep pile (IBC \u00A71803.5.5)\n'
  answer += '2. Flood zone AE/VE \u2192 Elevated/pile (ASCE 7-22 Ch.5)\n'
  answer += '3. Slope > 30% \u2192 Drilled caisson\n'
  answer += '4. Expansive soil (PI > 25) \u2192 PT slab (ACI 360R-10 \u00A75.4)\n'
  answer += '5. Caliche \u2192 Grade beams on piers (ACI 360R-10 \u00A74.2)\n'
  answer += '6. Standard \u2192 Conventional slab-on-ground\n\n'
  answer += '[LICENSED] All foundation decisions require a geotechnical investigation (soil boring + lab testing) before design. Screening-level soil data is not sufficient for structural design.'

  return answer
}

function buildSeismicAnswer(ctx) {
  let answer = '[LICENSED] Seismic design is governed by ASCE 7-22 Chapter 12 and IBC 2021 Chapter 16.\n\n'
  answer += 'Seismic Design Category (SDC) determination per ASCE 7-22 Tables 11.6-1 / 11.6-2:\n'
  answer += '\u2022 SDC A: SDS < 0.167 and SD1 < 0.067 \u2014 Minimal seismic risk\n'
  answer += '\u2022 SDC B: 0.167 \u2264 SDS < 0.33 or 0.067 \u2264 SD1 < 0.133 \u2014 Low seismic risk\n'
  answer += '\u2022 SDC C: 0.33 \u2264 SDS < 0.50 or 0.133 \u2264 SD1 < 0.20 \u2014 Moderate seismic risk\n'
  answer += '\u2022 SDC D: SDS \u2265 0.50 or SD1 \u2265 0.20 \u2014 High seismic risk\n'
  answer += '\u2022 SDC E/F: Near major fault + Risk Cat IV \u2014 Very high seismic risk\n\n'

  if (ctx?.seismic) {
    const sdc = ctx.seismic.sdc || ctx.seismic.seismic_sdc || 'Unknown'
    const sds = ctx.seismic.sds || 'Unknown'
    const sd1 = ctx.seismic.sd1 || 'Unknown'
    answer += `[CALCULATED] Your site seismic parameters:\n`
    answer += `SDS = ${sds}, SD1 = ${sd1}\n`
    answer += `Seismic Design Category: ${sdc}\n\n`

    if (sdc === 'D' || sdc === 'E' || sdc === 'F') {
      answer += 'HIGH SEISMIC ZONE \u2014 Key requirements:\n'
      answer += '\u2022 Special moment frames or shear walls required (ASCE 7-22 Table 12.2-1)\n'
      answer += '\u2022 Continuous load path from roof to foundation\n'
      answer += '\u2022 Ductile detailing per ACI 318-19 Ch.18\n'
      answer += '\u2022 Foundation ties required (ASCE 7-22 \u00A712.13.8.2)\n\n'
    } else if (sdc === 'C') {
      answer += 'MODERATE SEISMIC ZONE \u2014 Key requirements:\n'
      answer += '\u2022 Intermediate moment frames or ordinary shear walls acceptable\n'
      answer += '\u2022 Seismic detailing required for connections\n\n'
    } else {
      answer += 'LOW SEISMIC ZONE \u2014 Standard construction methods generally acceptable.\n\n'
    }
  }

  answer += 'Regional notes:\n'
  answer += '\u2022 California/Pacific NW: SDC D common (Cascadia subduction zone)\n'
  answer += '\u2022 Arizona (Phoenix): SDC B typical, SDS ~ 0.18-0.25\n'
  answer += '\u2022 Arizona (Flagstaff): SDC B-C, slightly higher due to northern AZ faults\n'
  answer += '\u2022 Central US (New Madrid zone): SDC C-D possible\n\n'
  answer += '[LICENSED] Site-specific seismic hazard analysis may be required for SDC D+ or near-fault sites. Consult a licensed structural engineer.'

  return answer
}

function buildFloodAnswer(ctx) {
  let answer = '[PUBLIC] Flood risk is mapped by FEMA National Flood Hazard Layer (NFHL) and regulated under ASCE 7-22 Chapter 5 and IBC 2021 \u00A71612.\n\n'
  answer += 'FEMA Flood Zone Classifications:\n'
  answer += '\u2022 Zone X (Unshaded): Minimal flood risk \u2014 No special requirements\n'
  answer += '\u2022 Zone X (Shaded / 500-yr): Moderate risk \u2014 Flood insurance recommended\n'
  answer += '\u2022 Zone AE: 1% annual chance (100-yr) floodplain \u2014 BFE established\n'
  answer += '\u2022 Zone A: 100-yr floodplain, no BFE \u2014 Requires flood study\n'
  answer += '\u2022 Zone VE: Coastal high-hazard \u2014 Wave action + surge\n'
  answer += '\u2022 Zone AO: Sheet flow areas \u2014 Depth specified on map\n\n'

  if (ctx?.flood) {
    const zone = ctx.flood.zone || 'Unknown'
    answer += `[CALCULATED] Your site flood zone: ${zone}\n\n`

    if (zone === 'AE' || zone === 'A' || zone === 'AH' || zone === 'AO') {
      answer += 'SPECIAL FLOOD HAZARD AREA \u2014 Requirements:\n'
      answer += '\u2022 Lowest floor must be at or above Base Flood Elevation (BFE) (IBC \u00A71612.4)\n'
      answer += '\u2022 Flood-resistant materials below BFE (FEMA TB-2)\n'
      answer += '\u2022 Flood openings required in enclosures below BFE (IBC \u00A71612.5)\n'
      answer += '\u2022 NFIP flood insurance required for federally-backed mortgages\n'
      answer += '\u2022 Foundation: elevated/pile recommended (ASCE 7-22 Ch.5)\n\n'
    } else if (zone === 'VE' || zone === 'V') {
      answer += 'COASTAL HIGH-HAZARD ZONE \u2014 Requirements:\n'
      answer += '\u2022 Structure must be on piles or columns (FEMA P-55)\n'
      answer += '\u2022 Bottom of lowest structural member above BFE (ASCE 7-22 \u00A75.4)\n'
      answer += '\u2022 Breakaway walls below BFE only\n'
      answer += '\u2022 No fill permitted for structural support\n\n'
    } else {
      answer += 'Outside mapped special flood hazard area. Standard construction permitted.\n\n'
    }
  }

  answer += 'Arizona-specific notes:\n'
  answer += '\u2022 Ephemeral washes may NOT be mapped by FEMA \u2014 check local floodplain authority (ADWR)\n'
  answer += '\u2022 Flash flood risk is significant even in Zone X areas\n'
  answer += '\u2022 Water adequacy certificate may be required (ARS \u00A79-463.06)\n\n'
  answer += '[PUBLIC] Always verify flood zone with the local floodplain administrator. FEMA maps are updated periodically and may not reflect current conditions.'

  return answer
}

function buildSoilAnswer(ctx) {
  let answer = '[PUBLIC] Soil data is sourced from USDA SSURGO (Soil Survey Geographic Database) and governs foundation design per IBC 2021 \u00A71803.\n\n'
  answer += 'Key soil properties for construction:\n'
  answer += '\u2022 Texture class: Determines bearing capacity (IBC Table 1806.2)\n'
  answer += '\u2022 Shrink-swell potential: Drives foundation type (ACI 360R-10 \u00A75.4)\n'
  answer += '\u2022 Plasticity Index (PI): PI > 25 = expansive \u2192 PT slab required\n'
  answer += '\u2022 Organic content: Organic soils cannot support shallow foundations\n'
  answer += '\u2022 Depth to bedrock: Affects excavation cost and foundation depth\n'
  answer += '\u2022 Water table depth: Shallow = dewatering needed during construction\n\n'

  if (ctx?.soil) {
    const tex = ctx.soil.texture_description || ctx.soil.texture_class || ctx.soil.texture || 'Unknown'
    const sw = ctx.soil.shrink_swell || ctx.soil.shrinkSwell || 'Unknown'
    const bearing = ctx.soil.presumptive_bearing_psf || 'Unknown'
    const caliche = ctx.soil.caliche
    answer += `[CALCULATED] Your site soil data:\n`
    answer += `Texture: ${tex}\n`
    answer += `Shrink-swell potential: ${sw}\n`
    answer += `Presumptive bearing: ${bearing} psf\n`

    if (caliche && caliche !== 'none' && caliche !== 'unknown') {
      answer += `Caliche: Detected \u2014 [LICENSED] Grade beams on piers recommended (ACI 360R-10 \u00A74.2). Additional cost: $3-8/SF for caliche removal or drilling through.\n`
    } else {
      answer += `Caliche: Not detected\n`
    }

    if (sw === 'High') {
      answer += `\n[LICENSED] HIGH SHRINK-SWELL: Post-tensioned slab recommended (ACI 360R-10 \u00A75.4). Conventional slab-on-ground is NOT recommended for expansive soils.\n`
    }
    answer += '\n'
  }

  answer += 'IBC 2021 \u00A71803 Requirements:\n'
  answer += '\u2022 Geotechnical investigation required for SDC C+ (IBC \u00A71803.5.11)\n'
  answer += '\u2022 Soil classification per ASTM D2487 (Unified Soil Classification)\n'
  answer += '\u2022 Minimum 2 borings for residential, 4+ for commercial\n'
  answer += '\u2022 Boring depth: minimum 1.5x footing width below bearing elevation\n\n'
  answer += '[LICENSED] SSURGO data is screening-level only. A site-specific geotechnical investigation (soil boring + lab testing) is required before design.'

  return answer
}

function buildWindAnswer(ctx) {
  let answer = '[LICENSED] Wind loads are determined per ASCE 7-22 Chapters 26-27 based on basic wind speed, exposure category, and building geometry.\n\n'
  answer += 'ASCE 7-22 Basic Wind Speed (V_ult, Risk Category II):\n'
  answer += '\u2022 Most inland US: 95-115 mph\n'
  answer += '\u2022 Arizona (Phoenix/Tucson): 90-95 mph\n'
  answer += '\u2022 Arizona (Flagstaff): 100 mph\n'
  answer += '\u2022 Gulf Coast (TX/LA): 130-150 mph\n'
  answer += '\u2022 Florida (South): 150-170 mph\n'
  answer += '\u2022 Atlantic Coast: 110-150 mph\n'
  answer += '\u2022 Tornado-prone (OK/KS): 100-115 mph (standard), ICC 500 for safe rooms\n\n'

  if (ctx?.seismic?.windMph) {
    answer += `[CALCULATED] Your site design wind speed: ${ctx.seismic.windMph} mph\n\n`

    if (ctx.seismic.windMph >= 130) {
      answer += 'HIGH WIND ZONE \u2014 Key requirements:\n'
      answer += '\u2022 Impact-resistant glazing or shutters (ASCE 7-22 \u00A726.12.3)\n'
      answer += '\u2022 Enhanced roof-to-wall connections (hurricane clips/straps)\n'
      answer += '\u2022 Pressure-rated garage doors\n'
      answer += '\u2022 Continuous load path from roof to foundation\n\n'
    } else if (ctx.seismic.windMph >= 110) {
      answer += 'MODERATE-HIGH WIND ZONE \u2014 Enhanced connections recommended.\n\n'
    } else {
      answer += 'STANDARD WIND ZONE \u2014 Conventional construction methods generally acceptable.\n\n'
    }
  }

  answer += 'Exposure categories (ASCE 7-22 \u00A726.7):\n'
  answer += '\u2022 B: Urban/suburban areas with obstructions\n'
  answer += '\u2022 C: Open terrain with scattered obstructions (most common)\n'
  answer += '\u2022 D: Flat, unobstructed coastal areas\n\n'
  answer += 'Arizona-specific:\n'
  answer += '\u2022 Dust storm / haboob loading is not covered by ASCE 7 \u2014 local practice\n'
  answer += '\u2022 WUI fire zones may require ignition-resistant construction (ASCE 7 Ch.27 + local)\n\n'
  answer += '[LICENSED] Wind load calculations require building-specific geometry. Consult a licensed structural engineer for final design.'

  return answer
}

function buildCostAnswer(ctx) {
  let answer = '[PUBLIC] Construction cost estimates are based on Census CHARS 2023 benchmarks and regional price parities (BEA RPP).\n\n'
  answer += 'National average construction cost (2024, new single-family residential):\n'
  answer += '\u2022 Standard finish: $150-200/SF\n'
  answer += '\u2022 Mid-range finish: $200-300/SF\n'
  answer += '\u2022 High-end finish: $300-500/SF\n\n'
  answer += 'Regional cost multipliers (vs. national average):\n'
  answer += '\u2022 Phoenix, AZ: 0.95x \u2014 Below average\n'
  answer += '\u2022 Tucson, AZ: 0.88x \u2014 Below average\n'
  answer += '\u2022 Flagstaff, AZ: 1.05x \u2014 Slightly above (altitude, logistics)\n'
  answer += '\u2022 Houston, TX: 0.92x \u2014 Below average\n'
  answer += '\u2022 Los Angeles, CA: 1.25x \u2014 Above average\n'
  answer += '\u2022 New York, NY: 1.45x \u2014 Well above average\n'
  answer += '\u2022 Denver, CO: 1.05x \u2014 Slightly above\n\n'

  answer += 'Common cost adders:\n'
  answer += '\u2022 PT slab (expansive soil): +$3-6/SF over conventional\n'
  answer += '\u2022 Caliche removal/drilling: +$3-8/SF\n'
  answer += '\u2022 Deep pile foundation: +$8-15/SF\n'
  answer += '\u2022 Flood zone elevation: +$10-25/SF\n'
  answer += '\u2022 Steep slope (>15%): +$5-15/SF for grading\n'
  answer += '\u2022 Seismic SDC D+: +$2-5/SF for ductile detailing\n'
  answer += '\u2022 Hurricane zone (130+ mph): +$3-8/SF for enhanced envelope\n\n'

  answer += 'Cost projection (ENR CCI inflation rate ~4.5%/yr):\n'

  if (ctx?.cost) {
    const base = ctx.cost.total || ctx.cost.base_cost || 0
    if (base > 0) {
      const yr2 = Math.round(base * Math.pow(1.045, 2))
      const yr5 = Math.round(base * Math.pow(1.045, 5))
      const yr10 = Math.round(base * Math.pow(1.045, 10))
      answer += `[CALCULATED] Based on your site estimate ($${base.toLocaleString()}):\n`
      answer += `\u2022 Now: $${base.toLocaleString()}\n`
      answer += `\u2022 2-year: $${yr2.toLocaleString()}\n`
      answer += `\u2022 5-year: $${yr5.toLocaleString()}\n`
      answer += `\u2022 10-year: $${yr10.toLocaleString()}\n\n`
    }
  }

  answer += 'Arizona heat season note: Construction during May-September adds 20-30% labor cost due to heat restrictions, mandatory breaks, and reduced productivity. Optimal build window is October-April.\n\n'
  answer += '[PUBLIC] These are screening-level estimates only. Obtain competitive bids from licensed general contractors for accurate project costing.'

  return answer
}

// ─── RULE-BASED FALLBACK ─────────────────────────────────────────────────────

function answerWithRules(question, siteContext) {
  const q = question.toLowerCase()
  const answer = { answer: '', sources: [], confidence: 'MEDIUM', disclaimer: FALLBACK_DISCLAIMER }

  // Foundation questions
  if (q.includes('foundation') || q.includes('slab') || q.includes('footing')) {
    answer.answer = buildFoundationAnswer(siteContext)
    answer.sources = [
      { type: 'LICENSED', reference: 'IBC 2021 \u00A71806.2', description: 'Presumptive bearing capacity' },
      { type: 'LICENSED', reference: 'ACI 360R-10 \u00A75.4', description: 'PT slab for expansive soils' },
    ]
  }
  // Seismic questions
  else if (q.includes('seismic') || q.includes('earthquake') || q.includes('sdc')) {
    answer.answer = buildSeismicAnswer(siteContext)
    answer.sources = [
      { type: 'LICENSED', reference: 'ASCE 7-22 Ch.12', description: 'Seismic design requirements' },
      { type: 'LICENSED', reference: 'ASCE 7-22 Tables 11.6-1/11.6-2', description: 'SDC determination' },
    ]
  }
  // Flood questions
  else if (q.includes('flood') || q.includes('fema') || q.includes('floodplain')) {
    answer.answer = buildFloodAnswer(siteContext)
    answer.sources = [
      { type: 'PUBLIC', reference: 'FEMA NFHL', description: 'National Flood Hazard Layer' },
      { type: 'LICENSED', reference: 'ASCE 7-22 Ch.5', description: 'Flood load requirements' },
    ]
  }
  // Soil questions
  else if (q.includes('soil') || q.includes('clay') || q.includes('expansive') || q.includes('bearing') || q.includes('caliche')) {
    answer.answer = buildSoilAnswer(siteContext)
    answer.sources = [
      { type: 'PUBLIC', reference: 'USDA SSURGO', description: 'Soil survey data' },
      { type: 'LICENSED', reference: 'IBC 2021 \u00A71803', description: 'Soil investigation requirements' },
    ]
  }
  // Wind questions
  else if (q.includes('wind') || q.includes('hurricane') || q.includes('tornado')) {
    answer.answer = buildWindAnswer(siteContext)
    answer.sources = [
      { type: 'LICENSED', reference: 'ASCE 7-22 Ch.26-27', description: 'Wind load provisions' },
    ]
  }
  // Cost questions
  else if (q.includes('cost') || q.includes('price') || q.includes('budget') || q.includes('estimate')) {
    answer.answer = buildCostAnswer(siteContext)
    answer.sources = [
      { type: 'PUBLIC', reference: 'Census CHARS 2023', description: 'New housing cost benchmarks' },
      { type: 'PUBLIC', reference: 'BEA RPP', description: 'Regional price parities' },
    ]
  }
  // General / unknown
  else {
    answer.answer = `This question requires AI-powered analysis which is not available without an API key. However, here is what the site data tells us:\n\n${formatSiteContext(siteContext)}\n\nFor detailed engineering guidance, consult a licensed professional engineer (PE) in your area.`
    answer.confidence = 'LOW'
  }

  return answer
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert civil/structural engineering assistant for SiteSense, specializing in US building codes and regional construction practices.

ROLE: Help engineers and landowners understand site conditions, code requirements, and design considerations. You provide educational guidance grounded in public standards.

BOUNDARIES — you MUST follow these:
1. You are a screening-level advisor, NOT a licensed engineer
2. Never provide final structural sizing, member dimensions, or stamped calculations
3. Never claim code compliance — only explain code requirements
4. Always recommend professional verification for design decisions
5. If the question is outside civil/structural engineering, say so clearly
6. Never provide legal advice about permits, zoning appeals, or liability
7. If site data is provided, ground your answer in that specific data
8. If no site data, give general guidance and note the limitation

REFERENCE CODES (cite by section number):
- IBC 2021: Ch.16 Structural Design, §1803 Soils & Foundations, §1806 Presumptive Bearing (Table 1806.2), §1808 Foundations, §1612 Flood
- ASCE 7-22: Ch.26-27 Wind Loads, Ch.12 Seismic (Tables 11.6-1/11.6-2 for SDC), Ch.5 Flood, Ch.7 Snow
- ACI 350-20/350R-20: Environmental concrete structures — durability, crack control
- ACI 360R-10: Slab-on-ground — §4.2 grade beams, §5.4 PT slab for expansive soils
- FEMA P-55: Coastal Construction Manual (public domain)
- FEMA 480: NFIP Floodplain Management (public domain)

FOUNDATION SELECTION (IBC 2021 Table 1806.2):
GP/GW (Gravel): 4000 psf → Conventional slab
SP/SW (Sand): 3000 psf → Conventional slab
SM (Sandy loam): 2000 psf → Conventional slab
CL (Clay): 1500 psf → PT slab if expansive
CH (Fat clay): 1000 psf → PT slab or deep foundation
PT/OH (Organic): 0 psf → Deep foundations required

REGIONAL CONSIDERATIONS:

SOUTHWEST (AZ, NM, West TX, South NV, South UT, South CA):
- Caliche hardpan: grade beams on piers (ACI 360R-10 §4.2), $3-8/SF extra
- Expansive clay: PT slab required (ACI 360R-10 §5.4)
- Collapsible alluvial soils: pre-wetting or compaction grouting
- Ephemeral washes: check local floodplain authority, FEMA may not map these
- Heat season: Oct-Apr optimal for construction, summer adds 20-30% labor cost

GULF COAST & SOUTHEAST (FL, LA, TX coast, MS, AL, GA, SC):
- Hurricane wind zones: 130-170 mph design speeds (ASCE 7-22 Fig 26.5-1)
- Shallow water table: dewatering may be needed during construction
- Organic soils (peat/muck): deep piles required (IBC §1803.5.5)
- Flood zones common: elevated construction per ASCE 7-22 Ch.5
- Termite and moisture control critical

CALIFORNIA:
- High seismic zones: SDC D-F common (ASCE 7-22 Ch.12)
- Wildfire (WUI): ignition-resistant construction required in mapped zones
- Steep hillside lots: drilled caissons or grade beams common
- Coastal erosion setbacks apply

MOUNTAIN WEST (CO, UT, MT, ID, WY):
- Snow loads: 40-100+ psf ground snow (ASCE 7-22 Ch.7)
- Frost depth: footings must extend below frost line (42-60 inches typical)
- Expansive soils (bentonite clay) common in CO Front Range

MIDWEST & GREAT PLAINS (OK, KS, NE, IA, MO, IL, IN, OH):
- Tornado/high-wind design: 100-115 mph (ASCE 7-22)
- Frost depth: 36-48 inches
- Generally favorable soil conditions (glacial till)

NORTHEAST (NY, NJ, PA, MA, CT, ME):
- Frost depth: 42-60 inches
- High construction costs (labor + material)
- Older urban lots: environmental contamination screening recommended
- Coastal zones: FEMA flood mapping + storm surge

PACIFIC NORTHWEST (WA, OR):
- Seismic: SDC D common (Cascadia subduction zone)
- Rain-induced landslides on slopes
- Moderate wind but heavy rain loading on structures

SOURCE CLASSIFICATION — you MUST label every claim:
- [PUBLIC] — FEMA, USGS, NOAA, government publications (freely reusable)
- [LICENSED] — IBC, ASCE, ACI provisions (paraphrased, not copied verbatim)
- [CALCULATED] — values derived from user-provided site data using code formulas

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "answer": "Your detailed answer here with [PUBLIC], [LICENSED], [CALCULATED] tags inline",
  "sources": [
    {"type": "PUBLIC", "reference": "FEMA P-55 §3.2", "description": "Coastal foundation guidance"},
    {"type": "LICENSED", "reference": "IBC 2021 §1806.2", "description": "Presumptive bearing capacity"}
  ],
  "confidence": "HIGH|MEDIUM|LOW",
  "disclaimer": "This guidance is educational only. All design decisions must be reviewed and approved by a licensed professional engineer. This is not a substitute for site-specific geotechnical investigation or stamped engineering."
}`

// ─── HANDLER ─────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' }),
    }
  }

  try {
    // ── Parse request body ─────────────────────────────────────────────────
    const body = JSON.parse(event.body || '{}')
    const { question, context } = body

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({
          status: 'error',
          message: 'Missing required field: question',
        }),
      }
    }

    // ── Auto-fetch GIS if address provided but no full site data ────────
    // Only do GIS fetch if no API key (rule-based needs it). With Claude, skip to save time.
    let gisContext = ''
    let enrichedContext = context || {}
    const address = context?.address
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY
    if (address && !context?.soil && !hasApiKey) {
      // Only fetch GIS for rule-based fallback — Claude can reason without it
      try {
        const geo = await geocodeLocation(address)
        if (geo) {
          const [soil, seismic, flood] = await Promise.all([
            fetchSoilQuick(geo.lat, geo.lon),
            fetchSeismicQuick(geo.lat, geo.lon),
            fetchFloodQuick(geo.lat, geo.lon),
          ])
          gisContext = `\nLOCATION: ${address} (${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)})` +
            `\nSoil: ${soil.texture}, shrink-swell: ${soil.shrinkSwell}, caliche: ${soil.caliche}` +
            `\nSeismic: SDS=${seismic.sds}, SD1=${seismic.sd1}, SDC=${seismic.sdc}, Wind=${seismic.windMph} mph` +
            `\nFlood: Zone ${flood.zone}`

          enrichedContext = {
            ...enrichedContext,
            address,
            soil: { texture: soil.texture, shrinkSwell: soil.shrinkSwell, caliche: soil.caliche },
            seismic: { sds: seismic.sds, sd1: seismic.sd1, sdc: seismic.sdc, windMph: seismic.windMph },
            flood: { zone: flood.zone },
          }
        }
      } catch { /* skip GIS on timeout */ }
    } else if (address && hasApiKey) {
      // With Claude available, just pass the address as text context
      gisContext = `\nLOCATION: ${address}`
    }

    // ── Check API key ──────────────────────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Rule-based answer without LLM
      const ruleAnswer = answerWithRules(question, enrichedContext)
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({ status: 'ok', data: ruleAnswer }),
      }
    }

    // ── Build user message ─────────────────────────────────────────────────
    let userContent = question.trim()
    if (context && typeof context === 'object' && Object.keys(context).length > 0 && !gisContext) {
      userContent =
        'SITE DATA:\n' +
        JSON.stringify(context, null, 2) +
        '\n\nQUESTION: ' +
        question.trim()
    } else if (gisContext) {
      userContent = `SITE DATA:${gisContext}\n\nQUESTION: ${question.trim()}`
    }

    // ── Call Claude (with timeout to stay within Netlify's 26s limit) ────
    const client = new Anthropic({ apiKey })

    const claudePromise = client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000))
    const message = await Promise.race([claudePromise, timeoutPromise])

    const rawText = message.content[0].text

    // ── Parse Claude response ──────────────────────────────────────────────
    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch {
      // Claude didn't return valid JSON — wrap raw text in expected structure
      parsed = {
        answer: rawText,
        sources: [],
        confidence: 'MEDIUM',
        disclaimer: FALLBACK_DISCLAIMER,
      }
    }

    // Ensure disclaimer is always present
    if (!parsed.disclaimer) {
      parsed.disclaimer = FALLBACK_DISCLAIMER
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        status: 'ok',
        data: {
          answer: parsed.answer || '',
          sources: parsed.sources || [],
          confidence: parsed.confidence || 'MEDIUM',
          disclaimer: parsed.disclaimer,
        },
      }),
    }
  } catch (err) {
    console.error('engineering_assist error:', err)

    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        status: 'error',
        message: `Engineering assistant failed: ${err.message || 'Unknown error'}`,
      }),
    }
  }
}
