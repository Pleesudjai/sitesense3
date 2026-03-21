/**
 * Netlify Function: /api/engineering-assist
 * Engineering Knowledge RAG assistant — answers code/design questions
 * with source citations and optional site context integration.
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

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert civil/structural engineering assistant for SiteSense, specializing in US building codes and Arizona construction.

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

ARIZONA-SPECIFIC:
- Caliche hardpan: grade beams on piers (ACI 360R-10 §4.2), $3-8/SF extra
- Expansive clay: PT slab required (ACI 360R-10 §5.4)
- Collapsible alluvial soils: pre-wetting or compaction grouting
- Ephemeral washes: check ADWR, FEMA may not map these
- Water adequacy: ARS §9-463.06 requires 100-year certificate
- WUI fire zones: ignition-resistant construction per ASCE 7 Ch.27
- Heat season: Oct-Apr optimal, summer adds 25% labor cost

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

    // ── Build user message ─────────────────────────────────────────────────
    let userContent = ''
    if (context && typeof context === 'object' && Object.keys(context).length > 0) {
      userContent =
        'SITE DATA:\n' +
        JSON.stringify(context, null, 2) +
        '\n\nQUESTION: ' +
        question.trim()
    } else {
      userContent = question.trim()
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
