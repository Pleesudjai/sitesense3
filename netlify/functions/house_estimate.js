/**
 * Netlify Function: /api/house-estimate
 * House Concept Estimator — 3 layout options with cost projections
 * Returns compact/standard/spacious layouts, structural notes, AI summary
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

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const QUALITY_RATES = { economy: 125, mid: 175, premium: 250, luxury: 350 }

// BEA Regional Price Parities — state-level (2023, housing component)
const RPP_STATE = {
  AL: 0.87, AK: 1.08, AZ: 0.97, AR: 0.84, CA: 1.35, CO: 1.08, CT: 1.12, DE: 1.02,
  FL: 1.02, GA: 0.93, HI: 1.42, ID: 0.95, IL: 1.01, IN: 0.88, IA: 0.86, KS: 0.87,
  KY: 0.86, LA: 0.88, ME: 0.98, MD: 1.10, MA: 1.18, MI: 0.90, MN: 0.98, MS: 0.82,
  MO: 0.88, MT: 0.98, NE: 0.88, NV: 1.01, NH: 1.05, NJ: 1.15, NM: 0.89, NY: 1.18,
  NC: 0.92, ND: 0.90, OH: 0.89, OK: 0.85, OR: 1.06, PA: 0.98, RI: 1.05, SC: 0.90,
  SD: 0.88, TN: 0.91, TX: 0.92, UT: 1.04, VT: 1.02, VA: 1.04, WA: 1.12, WV: 0.82,
  WI: 0.92, WY: 0.95, default: 1.00,
}

// Metro-level overrides (more precise than state)
const RPP_METRO = {
  phoenix: 1.02, tucson: 0.88, flagstaff: 1.08, prescott: 0.96, mesa: 1.00, tempe: 1.02,
  houston: 0.89, dallas: 0.95, austin: 1.01, 'san antonio': 0.85, 'fort worth': 0.93,
  'los angeles': 1.45, 'san francisco': 1.55, 'san diego': 1.35, 'san jose': 1.50, sacramento: 1.15,
  denver: 1.12, 'colorado springs': 1.02, seattle: 1.20, portland: 1.08, 'las vegas': 1.03,
  'salt lake city': 1.06, boise: 0.98, reno: 1.05, nashville: 0.96, atlanta: 0.95,
  charlotte: 0.93, raleigh: 0.96, miami: 1.15, tampa: 0.97, orlando: 0.98, jacksonville: 0.92,
  chicago: 1.05, minneapolis: 1.02, detroit: 0.88, columbus: 0.90, cleveland: 0.86,
  pittsburgh: 0.90, philadelphia: 1.05, 'new york': 1.35, boston: 1.22, washington: 1.15,
  baltimore: 1.05, 'kansas city': 0.90, 'st louis': 0.88, indianapolis: 0.88,
  'oklahoma city': 0.84, albuquerque: 0.90, 'el paso': 0.82,
}

const STATE_ABBR = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
  Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY',
}

const FND_COSTS = {
  CONVENTIONAL_SLAB:   { low: 8,  high: 15 },
  POST_TENSIONED_SLAB: { low: 14, high: 22 },
  GRADE_BEAM_ON_PIERS: { low: 18, high: 30 },
  DEEP_PILE:           { low: 45, high: 80 },
}

// LAYOUT_PRESETS[bedrooms][stories] → { compact, standard, spacious } in SF
const LAYOUT_PRESETS = {
  1: { 1: { compact: 550,  standard: 750,  spacious: 950  },
       2: { compact: 650,  standard: 850,  spacious: 1050 } },
  2: { 1: { compact: 950,  standard: 1250, spacious: 1550 },
       2: { compact: 800,  standard: 1050, spacious: 1300 } },
  3: { 1: { compact: 1300, standard: 1650, spacious: 2000 },
       2: { compact: 1000, standard: 1300, spacious: 1600 } },
  4: { 1: { compact: 1700, standard: 2200, spacious: 2700 },
       2: { compact: 1300, standard: 1700, spacious: 2100 } },
  5: { 1: { compact: 2100, standard: 2700, spacious: 3300 },
       2: { compact: 1600, standard: 2100, spacious: 2600 } },
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function stateFromDisplayName(displayName) {
  if (!displayName) return null
  const parts = displayName.split(',').map(s => s.trim())
  for (const part of parts) {
    if (STATE_ABBR[part]) return STATE_ABBR[part]
  }
  return null
}

function metroFromDisplayName(displayName) {
  if (!displayName) return null
  const lower = displayName.toLowerCase()
  for (const metro of Object.keys(RPP_METRO)) {
    if (lower.includes(metro)) return metro
  }
  return null
}

function getLocalCostFactor(state, metro) {
  // Metro override first, then state, then national default
  if (metro && RPP_METRO[metro]) return RPP_METRO[metro]
  if (state && RPP_STATE[state]) return RPP_STATE[state]
  return RPP_STATE.default
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

// ─── ROOM PROGRAM ────────────────────────────────────────────────────────────

function generateRoomProgram(bedrooms, bathrooms, stories, totalSF) {
  const rooms = []
  const perFloor = stories > 1 ? Math.ceil(totalSF / stories) : totalSF

  // Common rooms — always floor 1
  rooms.push({ name: 'Living Room',  targetSF: Math.round(totalSF * 0.15), floor: 1 })
  rooms.push({ name: 'Kitchen',      targetSF: Math.round(totalSF * 0.10), floor: 1 })
  rooms.push({ name: 'Dining',       targetSF: Math.round(totalSF * 0.08), floor: 1 })

  // Bedrooms
  for (let i = 1; i <= bedrooms; i++) {
    const isMaster = i === 1
    const sf = isMaster ? Math.round(totalSF * 0.12) : Math.round(totalSF * 0.08)
    const floor = (stories > 1 && i > 1) ? 2 : 1
    rooms.push({ name: isMaster ? 'Primary Bedroom' : `Bedroom ${i}`, targetSF: sf, floor })
  }

  // Bathrooms
  for (let i = 1; i <= bathrooms; i++) {
    const isMaster = i === 1
    const sf = isMaster ? Math.round(totalSF * 0.05) : Math.round(totalSF * 0.03)
    const floor = (stories > 1 && i > 1) ? 2 : 1
    rooms.push({ name: isMaster ? 'Primary Bath' : `Bath ${i}`, targetSF: sf, floor })
  }

  // Stairway (if multi-story)
  if (stories > 1) {
    rooms.push({ name: 'Stairway', targetSF: Math.round(totalSF * 0.04), floor: 1 })
  }

  // Utility
  rooms.push({ name: 'Laundry',              targetSF: Math.round(totalSF * 0.03), floor: 1 })
  rooms.push({ name: 'Hallway / Circulation', targetSF: Math.round(totalSF * 0.06), floor: 1 })

  return rooms
}

// ─── LAYOUT GENERATOR ────────────────────────────────────────────────────────

function generateLayouts(bedrooms, bathrooms, stories, quality) {
  const beds = clamp(bedrooms, 1, 5)
  const st = stories >= 2 ? 2 : 1
  const preset = LAYOUT_PRESETS[beds][st]

  const variants = [
    { name: 'Compact',  sfKey: 'compact',  score: 75 },
    { name: 'Standard', sfKey: 'standard', score: 85 },
    { name: 'Spacious', sfKey: 'spacious', score: 70 },
  ]

  return variants.map(v => {
    const baseSF = preset[v.sfKey]
    const totalSF = st === 2 ? baseSF * 2 : baseSF
    const footprintSF = st === 2 ? baseSF : totalSF
    const rooms = generateRoomProgram(bedrooms, bathrooms, stories, totalSF)
    const structuralSystem = stories <= 2
      ? 'Wood frame (IRC prescriptive)'
      : 'Engineered wood/steel'

    return {
      name: v.name,
      totalSF,
      footprintSF,
      stories: st,
      rooms,
      structuralSystem,
      score: v.score,
    }
  })
}

// ─── COST ESTIMATOR ──────────────────────────────────────────────────────────

function estimateLayoutCost(layout, quality, localCostFactor, foundationType) {
  const rate = QUALITY_RATES[quality] || QUALITY_RATES.mid
  const mult = localCostFactor || 1.0
  const fnd = FND_COSTS[foundationType] || FND_COSTS.CONVENTIONAL_SLAB
  const fndRate = (fnd.low + fnd.high) / 2

  const baseCost = layout.totalSF * rate * mult
  const foundationCost = layout.footprintSF * fndRate
  const total = baseCost + foundationCost

  // 10-year projection at 4.5% ENR CCI inflation
  const projection = [0, 2, 5, 10].map(yr => ({
    year: yr,
    low:      Math.round(total * 0.85 * Math.pow(1.045, yr)),
    expected: Math.round(total * Math.pow(1.045, yr)),
    high:     Math.round(total * 1.20 * Math.pow(1.045, yr)),
  }))

  return {
    baseCost:       Math.round(baseCost),
    foundationCost: Math.round(foundationCost),
    total:          Math.round(total),
    costPerSF:      Math.round(rate * mult + fndRate),
    range: {
      low:      Math.round(total * 0.85),
      expected: Math.round(total),
      high:     Math.round(total * 1.20),
    },
    projection,
  }
}

// ─── STRUCTURAL SCREEN ──────────────────────────────────────────────────────

function structuralScreen(layouts, siteData) {
  const notes = []
  let foundationType = 'CONVENTIONAL_SLAB'

  if (siteData) {
    if (siteData.foundation && siteData.foundation.type) {
      foundationType = siteData.foundation.type
    }
    if (siteData.soil) {
      const soil = siteData.soil
      // Support both camelCase (auto-fetched) and snake_case (full analysis) field names
      const sw = (soil.shrinkSwell || soil.shrink_swell || '').toLowerCase()
      if (sw === 'high' || sw === 'critical') {
        notes.push('High shrink-swell soil detected — post-tensioned slab recommended (ACI 360R-10 §5.4)')
        if (foundationType === 'CONVENTIONAL_SLAB') foundationType = 'POST_TENSIONED_SLAB'
      }
      if (soil.caliche) {
        notes.push('Caliche hardpan detected — grade beams may be required (+$3-8/SF)')
      }
      const soilType = soil.type || soil.texture_class
      if (soilType) {
        notes.push(`Soil classification: ${soilType}`)
      }
    }
    if (siteData.loads) {
      const loads = siteData.loads
      const sdc = loads.seismicSdc || loads.seismic_sdc
      if (sdc && sdc >= 'D') {
        notes.push(`Seismic Design Category ${sdc} — special detailing required (ASCE 7-22 Ch.12)`)
      }
      const wind = loads.windMph || loads.wind_mph
      if (wind && wind > 115) {
        notes.push(`High wind zone: ${wind} mph — enhanced connections required (ASCE 7-22 Ch.26)`)
      }
      const snow = loads.snowPsf || loads.snow_psf
      if (snow && snow > 20) {
        notes.push(`Snow load: ${snow} psf — roof design must account for drift (ASCE 7-22 Ch.7)`)
      }
      if (loads.sds) {
        notes.push(`Seismic parameters: SDS=${loads.sds}, SD1=${loads.sd1 || 'N/A'}`)
      }
    }
    if (siteData.floodZone && siteData.floodZone !== 'X' && siteData.floodZone !== 'ZONE X') {
      notes.push(`Flood zone ${siteData.floodZone} — elevated foundation or flood-proofing required (IBC 2021 §1612)`)
    }
  } else {
    notes.push('No site analysis data provided — using default assumptions (conventional slab, wood frame)')
    notes.push('Run a full site analysis first for site-specific structural recommendations')
  }

  const maxSF = Math.max(...layouts.map(l => l.footprintSF))
  if (maxSF > 2500) {
    notes.push('Large footprint (>2,500 SF) — consider expansion joints per ACI 360R-10')
  }

  return { foundationType, notes }
}

// ─── GIS QUICK FETCHERS ─────────────────────────────────────────────────────
// Simplified versions of the full analyze.js fetchers — enough for structural screen

const SHRINK_SWELL = {
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
    const shrinkSwell = SHRINK_SWELL[texture] || 'Low'
    const caliche = lat < 37 && lon < -104 && ['S', 'LS', 'SL', 'SCL'].includes(texture)
    const bearingHint = ['C', 'CL', 'SiC'].includes(texture) ? 'low' :
                        ['S', 'LS'].includes(texture) ? 'moderate' : 'good'
    return { texture, shrinkSwell, caliche, bearingHint }
  } catch {
    return { texture: 'L', shrinkSwell: 'Low', caliche: false, bearingHint: 'good' }
  }
}

async function fetchSeismicQuick(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: lat, longitude: lon,
      riskCategory: 'II', siteClass: 'D', title: 'SiteSense',
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
    // SDC calculation (same logic as analyze.js)
    const bySds = sds < 0.167 ? 'A' : sds < 0.33 ? 'B' : sds < 0.50 ? 'C' : 'D'
    const bySd1 = sd1 < 0.067 ? 'A' : sd1 < 0.133 ? 'B' : sd1 < 0.20 ? 'C' : 'D'
    const order = { A: 0, B: 1, C: 2, D: 3 }
    const sdc = order[bySd1] > order[bySds] ? bySd1 : bySds
    // Wind speed lookup (same as analyze.js)
    let windMph = 95
    if (lat > 28 && lat < 31 && lon > -96 && lon < -93) windMph = 130
    else if (lat > 34.5 && lat < 36 && lon > -113 && lon < -110) windMph = 100
    else if (lat > 31 && lat < 37 && lon > -115 && lon < -109) windMph = 90
    return { sds, sd1, sdc, windMph }
  } catch {
    return { sds: 0.04, sd1: 0.01, sdc: 'A', windMph: 95 }
  }
}

const ZONE_RISK = { AE: 'HIGH', A: 'HIGH', AO: 'HIGH', VE: 'HIGH', X: 'LOW', B: 'MODERATE', C: 'LOW' }

async function fetchFloodQuick(lat, lon) {
  try {
    const params = new URLSearchParams({
      geometry: `${lon},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'FLD_ZONE,ZONE_SUBTY',
      returnGeometry: 'false',
      f: 'json',
    })
    const res = await fetch(
      `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?${params}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const data = await res.json()
    const features = data.features || []
    if (!features.length) return { zone: 'X', riskLevel: 'LOW' }
    const zone = (features[0].attributes?.FLD_ZONE || 'X').trim()
    return { zone, riskLevel: ZONE_RISK[zone] || 'UNKNOWN' }
  } catch {
    return { zone: 'X', riskLevel: 'LOW' }
  }
}

// ─── GEOCODE ─────────────────────────────────────────────────────────────────

async function geocodeLocation(location) {
  try {
    const q = encodeURIComponent(location)
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=us`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SiteSense-HackASU/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data || data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName: data[0].display_name || '' }
  } catch {
    return null
  }
}

// ─── RULE-BASED HOUSE REPORT (fallback when no API key) ─────────────────────

function generateRuleBasedHouseReport(layouts, costs, structuralNotes, quality, location, siteData) {
  // recommendation — always Standard
  const std = layouts.find(l => l.name === 'Standard') || layouts[1]
  const stdIdx = layouts.indexOf(std)
  const stdCost = costs[stdIdx]
  const recommendation = `The Standard layout (${std.totalSF.toLocaleString()} SF) offers the best balance of livable space and construction cost at $${stdCost.total.toLocaleString()} estimated.`

  // reasoning — check site conditions
  const reasonParts = []
  if (siteData && siteData.soil) {
    const sw = (siteData.soil.shrinkSwell || siteData.soil.shrink_swell || '').toLowerCase()
    if (sw === 'high' || sw === 'critical') {
      reasonParts.push('High shrink-swell soil requires a post-tensioned slab, increasing foundation cost but ensuring long-term stability.')
    } else {
      reasonParts.push(`Soil conditions (${siteData.soil.type || 'loam'}) support a conventional foundation.`)
    }
  }
  if (siteData && siteData.loads) {
    const sdc = siteData.loads.seismicSdc || siteData.loads.seismic_sdc
    if (sdc && sdc >= 'C') {
      reasonParts.push(`Seismic Design Category ${sdc} requires enhanced lateral bracing.`)
    }
    const wind = siteData.loads.windMph || siteData.loads.wind_mph
    if (wind && wind > 115) {
      reasonParts.push(`High wind zone (${wind} mph) requires upgraded connections.`)
    }
  }
  if (siteData && siteData.floodZone && siteData.floodZone !== 'X' && siteData.floodZone !== 'ZONE X') {
    reasonParts.push(`Flood zone ${siteData.floodZone} may require an elevated or flood-proofed foundation.`)
  }
  if (reasonParts.length === 0) {
    reasonParts.push('Site conditions are favorable with no major geotechnical or hazard concerns affecting foundation choice.')
  }
  const reasoning = reasonParts.join(' ')

  // site_adaptation
  const fndLabel = (siteData && siteData.foundation && siteData.foundation.type) || 'CONVENTIONAL_SLAB'
  const structSys = std.structuralSystem || 'Wood frame (IRC prescriptive)'
  const siteAdaptation = `Foundation: ${fndLabel.replace(/_/g, ' ').toLowerCase()}. Structural system: ${structSys}.`

  // cost_drivers
  const costDrivers = []
  const qualLabel = quality.charAt(0).toUpperCase() + quality.slice(1)
  costDrivers.push(`${qualLabel} quality tier finish level`)
  const lcf = costs[stdIdx].costPerSF ? `$${costs[stdIdx].costPerSF}/SF blended rate` : 'Regional cost multiplier'
  costDrivers.push(lcf)
  const fndCost = costs[stdIdx].foundationCost
  if (fndCost > 0) {
    costDrivers.push(`Foundation premium: $${fndCost.toLocaleString()}`)
  }

  // build_vs_wait — compare now vs 5yr
  const nowCost = costs[stdIdx].projection.find(p => p.year === 0)?.expected || costs[stdIdx].total
  const yr5Cost = costs[stdIdx].projection.find(p => p.year === 5)?.expected || nowCost
  const diff5 = yr5Cost - nowCost
  const buildVsWait = diff5 > 0
    ? `Building now saves approximately $${diff5.toLocaleString()} compared to waiting 5 years (4.5% annual inflation).`
    : `Construction costs are stable — timing is flexible.`

  // warnings — pull from structuralNotes
  const warnings = structuralNotes.length > 0
    ? structuralNotes.slice()
    : ['No special structural concerns identified.']

  return {
    recommendation,
    reasoning,
    site_adaptation: siteAdaptation,
    cost_drivers: costDrivers,
    build_vs_wait: buildVsWait,
    warnings,
  }
}

// ─── CLAUDE AI HOUSE BRAIN REPORT ───────────────────────────────────────────

async function generateHouseBrainReport(layouts, costs, structuralNotes, quality, location, siteData) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return generateRuleBasedHouseReport(layouts, costs, structuralNotes, quality, location, siteData)
  }

  try {
    const client = new Anthropic({ apiKey })
    const layoutSummary = layouts.map((l, i) => (
      `${l.name}: ${l.totalSF.toLocaleString()} SF, ` +
      `$${costs[i].range.low.toLocaleString()}-$${costs[i].range.high.toLocaleString()} ` +
      `(expected $${costs[i].total.toLocaleString()}), ` +
      `${l.rooms.length} rooms, ${l.structuralSystem}`
    )).join('\n')

    const siteConditions = siteData ? JSON.stringify({
      soil: siteData.soil,
      seismic: siteData.loads,
      floodZone: siteData.floodZone,
    }, null, 2) : 'No site data available.'

    const prompt = `You are SiteSense House Concept Advisor. Analyze house layout options and site conditions to recommend the best building approach.

LAYOUT DATA:
${layoutSummary}

SITE CONDITIONS:
${siteConditions}

STRUCTURAL NOTES:
${structuralNotes.length > 0 ? structuralNotes.join('\n') : 'No special concerns.'}

QUALITY LEVEL: ${quality}
LOCATION: ${location}

Respond with ONLY valid JSON:
{
  "recommendation": "Which layout and why (1 sentence)",
  "reasoning": "How site conditions affected the recommendation (2-3 sentences)",
  "site_adaptation": "What structural/foundation choices the site requires",
  "cost_drivers": ["Top 3 factors driving the cost"],
  "build_vs_wait": "One sentence on timing recommendation",
  "warnings": ["Any concerns the user should know"]
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].text
    return JSON.parse(raw)
  } catch (err) {
    console.error('Claude API error:', err.message)
    // Fall back to rule-based report on any failure
    return generateRuleBasedHouseReport(layouts, costs, structuralNotes, quality, location, siteData)
  }
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    let {
      bedrooms = 3,
      bathrooms = 2,
      stories = 1,
      location = 'Phoenix, AZ',
      quality = 'mid',
      siteData = null,
    } = body

    // Validate inputs
    const beds = clamp(Math.round(bedrooms), 1, 5)
    const baths = clamp(Math.round(bathrooms), 1, 4)
    const st = clamp(Math.round(stories), 1, 3)
    const qual = QUALITY_RATES[quality] ? quality : 'mid'

    // Geocode location → resolve state + metro for cost factor
    const geo = await geocodeLocation(location)
    const lat = geo ? geo.lat : 33.4484
    const lon = geo ? geo.lon : -112.074
    const displayName = geo?.displayName || ''
    const state = stateFromDisplayName(displayName)
    const metro = metroFromDisplayName(displayName)
    const localCostFactor = getLocalCostFactor(state, metro)

    // Auto-fetch GIS data if no siteData provided
    if (!siteData) {
      const [soilQuick, seismicQuick, floodQuick] = await Promise.all([
        fetchSoilQuick(lat, lon),
        fetchSeismicQuick(lat, lon),
        fetchFloodQuick(lat, lon),
      ])
      siteData = {
        soil: {
          shrinkSwell: soilQuick.shrinkSwell,
          caliche: soilQuick.caliche,
          type: soilQuick.texture,
        },
        loads: {
          seismicSdc: seismicQuick.sdc,
          sds: seismicQuick.sds,
          sd1: seismicQuick.sd1,
          windMph: seismicQuick.windMph,
          snowPsf: lat > 34.5 ? 20 : 0,
        },
        floodZone: floodQuick.zone,
        _autoFetched: true,
      }
    }

    // Generate 3 layout options
    const layouts = generateLayouts(beds, baths, st, qual)

    // Structural screening
    const { foundationType, notes: structuralNotes } = structuralScreen(layouts, siteData)

    // Cost estimates for each layout
    const costs = layouts.map(layout => estimateLayoutCost(layout, qual, localCostFactor, foundationType))

    // Attach costs to layout objects
    const layoutsWithCosts = layouts.map((layout, i) => ({
      ...layout,
      cost: costs[i],
    }))

    // AI brain report (structured JSON)
    const aiReport = await generateHouseBrainReport(layouts, costs, structuralNotes, qual, location, siteData)

    // Backward-compatible string summary
    const aiSummary = typeof aiReport === 'string'
      ? aiReport
      : aiReport.recommendation + '\n\n' + aiReport.reasoning

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        status: 'ok',
        data: {
          layouts: layoutsWithCosts,
          location: { state, metro, localCostFactor, lat, lon, query: location },
          quality: qual,
          foundationType,
          structuralNotes,
          aiSummary,
          ai_report: aiReport,
          gisData: siteData ? {
            soil: siteData.soil,
            seismic: siteData.loads,
            flood: siteData.floodZone,
            autoFetched: !!siteData._autoFetched,
          } : null,
          disclaimer: 'This is a preliminary concept estimate only. Actual costs require a licensed contractor bid, site-specific geotechnical report, and architectural plans. Costs are in 2024 USD and projected using 4.5% annual ENR CCI inflation. Site preparation costs (earthwork, grading, utilities) are estimated separately in the Site Analysis.',
        },
      }),
    }
  } catch (err) {
    console.error('house_estimate error:', err)
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ status: 'error', message: err.message || 'Internal server error' }),
    }
  }
}
