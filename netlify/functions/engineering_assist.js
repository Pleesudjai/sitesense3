/**
 * Netlify Function: /api/engineering-assist
 * Engineering Knowledge RAG assistant — answers code/design questions
 * with source citations and optional site context integration.
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

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert civil/structural engineering assistant for SiteSense, specializing in US building codes and regional construction practices.

ROLE: Help engineers and landowners understand site conditions, code requirements, and design considerations. You provide educational guidance grounded in public standards.

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

// ─── FALLBACK DISCLAIMER ─────────────────────────────────────────────────────

const FALLBACK_DISCLAIMER =
  'This guidance is educational only. All design decisions must be reviewed ' +
  'and approved by a licensed professional engineer. This is not a substitute ' +
  'for site-specific geotechnical investigation or stamped engineering.'

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

  // ── Check API key ──────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: corsHeaders(),
      body: JSON.stringify({
        status: 'error',
        message:
          'AI assistant is unavailable — ANTHROPIC_API_KEY is not configured. ' +
          'Please set it in Netlify dashboard → Site settings → Environment variables.',
      }),
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
    let gisContext = ''
    const address = context?.address
    if (address && !context?.soil) {
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

    // ── Call Claude ────────────────────────────────────────────────────────
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

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
