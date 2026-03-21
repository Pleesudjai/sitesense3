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

const REGION_MULT = { phoenix: 0.95, tucson: 0.88, flagstaff: 1.05, prescott: 0.98, default: 0.95 }

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

function identifyRegion(lat, lon) {
  if (lat > 33.2 && lat < 34.0 && lon > -113.0 && lon < -111.5) return 'phoenix'
  if (lat > 31.7 && lat < 32.5 && lon > -111.3 && lon < -110.5) return 'tucson'
  if (lat > 35.0 && lat < 35.5 && lon > -111.8 && lon < -111.3) return 'flagstaff'
  if (lat > 34.3 && lat < 34.8 && lon > -112.8 && lon < -112.2) return 'prescott'
  return 'default'
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

function estimateLayoutCost(layout, quality, region, foundationType) {
  const rate = QUALITY_RATES[quality] || QUALITY_RATES.mid
  const mult = REGION_MULT[region] || REGION_MULT.default
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
      if (soil.shrinkSwell === 'high' || soil.shrinkSwell === 'critical') {
        notes.push('High shrink-swell soil detected — post-tensioned slab recommended (ACI 360R-10 §5.4)')
        if (foundationType === 'CONVENTIONAL_SLAB') foundationType = 'POST_TENSIONED_SLAB'
      }
      if (soil.caliche) {
        notes.push('Caliche hardpan detected — grade beams may be required (+$3-8/SF)')
      }
      if (soil.type) {
        notes.push(`Soil classification: ${soil.type}`)
      }
    }
    if (siteData.loads) {
      const loads = siteData.loads
      if (loads.seismicSdc && loads.seismicSdc >= 'D') {
        notes.push(`Seismic Design Category ${loads.seismicSdc} — special detailing required (ASCE 7-22 Ch.12)`)
      }
      if (loads.windMph && loads.windMph > 115) {
        notes.push(`High wind zone: ${loads.windMph} mph — enhanced connections required (ASCE 7-22 Ch.26)`)
      }
      if (loads.snowPsf && loads.snowPsf > 20) {
        notes.push(`Snow load: ${loads.snowPsf} psf — roof design must account for drift (ASCE 7-22 Ch.7)`)
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
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

// ─── CLAUDE AI SUMMARY ──────────────────────────────────────────────────────

async function generateAiSummary(layouts, costs, structuralNotes, quality, location) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return 'AI summary unavailable — ANTHROPIC_API_KEY not configured. ' +
      `The Standard layout is typically the best balance of space and cost. ` +
      `Review structural notes above before proceeding.`
  }

  try {
    const client = new Anthropic({ apiKey })
    const layoutSummary = layouts.map((l, i) => (
      `${l.name}: ${l.totalSF.toLocaleString()} SF, ` +
      `$${costs[i].range.low.toLocaleString()}-$${costs[i].range.high.toLocaleString()}, ` +
      `${l.rooms.length} rooms, ${l.structuralSystem}`
    )).join('\n')

    const prompt = `You are an expert residential construction estimator in Arizona.

## Task
Summarize these 3 house concept options for a client looking to build in ${location}.
Recommend one option and explain why. Mention any structural concerns.

## Options
${layoutSummary}

## Quality Level: ${quality}

## Structural Notes
${structuralNotes.length > 0 ? structuralNotes.join('\n') : 'No special concerns.'}

## Instructions
- Write 3-4 short paragraphs in plain English
- Recommend the best value option
- Flag any structural concerns that could affect cost
- End with: "This is a preliminary concept estimate only. Actual costs require a licensed contractor bid and site-specific engineering."
- Keep it under 250 words`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    return message.content[0].text
  } catch (err) {
    console.error('Claude API error:', err.message)
    return 'AI summary generation failed. The Standard layout typically offers the best balance ' +
      'of livable space and construction cost. Review structural notes for site-specific concerns.'
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
    const {
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

    // Geocode location
    const geo = await geocodeLocation(location)
    const lat = geo ? geo.lat : 33.4484
    const lon = geo ? geo.lon : -112.074
    const region = identifyRegion(lat, lon)

    // Generate 3 layout options
    const layouts = generateLayouts(beds, baths, st, qual)

    // Structural screening
    const { foundationType, notes: structuralNotes } = structuralScreen(layouts, siteData)

    // Cost estimates for each layout
    const costs = layouts.map(layout => estimateLayoutCost(layout, qual, region, foundationType))

    // Attach costs to layout objects
    const layoutsWithCosts = layouts.map((layout, i) => ({
      ...layout,
      cost: costs[i],
    }))

    // AI summary
    const aiSummary = await generateAiSummary(layouts, costs, structuralNotes, qual, location)

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        status: 'ok',
        data: {
          layouts: layoutsWithCosts,
          location: { region, lat, lon, query: location },
          quality: qual,
          foundationType,
          structuralNotes,
          aiSummary,
          disclaimer: 'This is a preliminary concept estimate only. Actual costs require a licensed contractor bid, site-specific geotechnical report, and architectural plans. Costs are in 2024 USD and projected using 4.5% annual ENR CCI inflation.',
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
