/**
 * Netlify Function: /api/price-predict
 * Construction price prediction using hardcoded government economic indicators.
 * Multi-factor model: Census CHARS base x BEA RPP localization x BLS inflation x FHFA trend.
 */

// ─── CORS ────────────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

// ─── HARDCODED GOVERNMENT INDICATOR DATA ─────────────────────────────────────

// Census Characteristics of New Housing 2023 — national median contract price/SF
const CHARS_BASE_PSF = {
  economy: 130, mid: 175, premium: 240, luxury: 350,
}

// BEA Regional Price Parities 2023 (housing component) — state level
const RPP = {
  AZ: 0.97, TX: 0.92, CA: 1.35, FL: 1.02, NY: 1.18,
  CO: 1.08, WA: 1.12, NV: 1.01, NM: 0.89, UT: 1.04,
  OR: 1.06, ID: 0.95, MT: 0.98, default: 1.00,
}

// BEA RPP metro-level overrides
const RPP_METRO = {
  phoenix: 1.02, tucson: 0.88, flagstaff: 1.08, prescott: 0.96,
  houston: 0.89, dallas: 0.95, austin: 1.01, 'san antonio': 0.85,
  'los angeles': 1.45, 'san francisco': 1.55, denver: 1.12, seattle: 1.20,
  'las vegas': 1.03, portland: 1.08, 'salt lake city': 1.06,
}

// BLS Producer Price Index — residential construction inputs (YoY)
const CONSTRUCTION_INPUT_INFLATION = {
  current_yoy: 0.032,
  trend_3yr_avg: 0.048,
  trend_5yr_avg: 0.055,
}

// BLS Employment Cost Index — construction sector (YoY)
const ECI_CONSTRUCTION = {
  current_yoy: 0.041,
  trend_3yr_avg: 0.045,
}

// FHFA House Price Index — YoY by state (2024 Q3)
const FHFA_HPI = {
  AZ: 0.042, TX: 0.028, CA: 0.058, FL: 0.035, NY: 0.052,
  CO: 0.031, WA: 0.048, NV: 0.062, NM: 0.038, UT: 0.044,
  default: 0.040,
}

// Supply indicators (Census + Freddie Mac)
const SUPPLY_INDICATORS = {
  permits_trend: 'stable',
  starts_trend: 'slowing',
  mortgage_rate_30yr: 6.85,
  months_supply: 8.2,
  market_temp: 'balanced',
}

// Philadelphia Fed Survey of Professional Forecasters — median PCE inflation
const SPF_INFLATION_FORECAST = {
  yr1: 0.025,
  yr2: 0.022,
  yr5: 0.020,
}

// Foundation cost adders ($/SF of footprint)
const FOUNDATION_COST_PSF = {
  CONVENTIONAL_SLAB: 12,
  POST_TENSIONED_SLAB: 18,
  GRADE_BEAM_ON_PIERS: 24,
  DEEP_PILE: 60,
}

// ─── STATE ABBREVIATION LOOKUP ───────────────────────────────────────────────

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

function stateFromDisplayName(displayName) {
  if (!displayName) return null
  const parts = displayName.split(',').map(s => s.trim())
  // Nominatim: "City, County, State, United States"
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
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name || '',
    }
  } catch {
    return null
  }
}

// ─── PRICE PREDICTION MODEL ─────────────────────────────────────────────────

function predictPrice({ totalSF, quality, state, metro, foundationType }) {
  // 1. Base cost from Census CHARS
  const basePSF = CHARS_BASE_PSF[quality] || CHARS_BASE_PSF.mid
  const baseCost = totalSF * basePSF

  // 2. Local cost factor from BEA RPP
  const localFactor = (metro && RPP_METRO[metro] != null)
    ? RPP_METRO[metro]
    : (state && RPP[state] != null ? RPP[state] : RPP.default)

  // 3. Foundation premium
  const fndPSF = FOUNDATION_COST_PSF[foundationType] || FOUNDATION_COST_PSF.CONVENTIONAL_SLAB
  const foundationPremium = totalSF * fndPSF

  // 4. Current estimate
  const currentCost = baseCost * localFactor + foundationPremium
  const currentPerSF = Math.round(currentCost / totalSF)

  // Current estimate band (+/-10%)
  const currentEstimate = {
    low: Math.round(currentCost * 0.90),
    expected: Math.round(currentCost),
    high: Math.round(currentCost * 1.15),
    perSF: currentPerSF,
  }

  // 5. Blended construction inflation rate (60% materials, 40% labor)
  const blendedRate = 0.6 * CONSTRUCTION_INPUT_INFLATION.current_yoy
    + 0.4 * ECI_CONSTRUCTION.current_yoy

  // FHFA housing market appreciation for this state
  const hpiRate = (state && FHFA_HPI[state] != null) ? FHFA_HPI[state] : FHFA_HPI.default

  // 6. Forecast for each horizon
  const horizons = [1, 2, 5, 10]
  const forecasts = horizons.map(year => {
    const constructionInflation = Math.pow(1 + blendedRate, year)

    // Damping factor for market appreciation (mean reversion)
    const dampingFactor = year <= 2 ? 0.5 : year <= 5 ? 0.3 : 0.2
    const marketAdjustment = Math.pow(1 + hpiRate * dampingFactor, year)

    const forecastCost = currentCost * constructionInflation * marketAdjustment
    const lowBand = forecastCost * (1 - 0.05 * Math.sqrt(year))
    const highBand = forecastCost * (1 + 0.08 * Math.sqrt(year))

    return {
      year,
      low: Math.round(lowBand),
      expected: Math.round(forecastCost),
      high: Math.round(highBand),
    }
  })

  // 7. Indicator breakdown
  const indicators = {
    constructionInflation: {
      rate: Math.round(blendedRate * 1000) / 1000,
      source: 'BLS PPI + ECI blend',
      contribution: 'primary',
    },
    localCostFactor: {
      value: localFactor,
      source: metro
        ? `BEA RPP (${metro} metro)`
        : `BEA RPP (${state || 'national'})`,
      contribution: 'moderate',
    },
    housingMarketTrend: {
      rate: hpiRate,
      source: `FHFA HPI (${state || 'national'})`,
      contribution: 'secondary',
    },
    macroInflation: {
      rate: SPF_INFLATION_FORECAST.yr1,
      source: 'SPF PCE forecast',
      contribution: 'baseline',
    },
    supplyConditions: {
      mortgage_rate: SUPPLY_INDICATORS.mortgage_rate_30yr,
      market_temp: SUPPLY_INDICATORS.market_temp,
      contribution: 'context',
    },
  }

  return { currentEstimate, forecasts, indicators }
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
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
      totalSF = 1250,
      quality = 'mid',
      location = 'Phoenix, AZ',
      foundationType = 'CONVENTIONAL_SLAB',
    } = body

    // Validate quality
    const qual = CHARS_BASE_PSF[quality] ? quality : 'mid'
    const sf = Math.max(200, Math.min(10000, Math.round(totalSF)))
    const fndType = FOUNDATION_COST_PSF[foundationType] ? foundationType : 'CONVENTIONAL_SLAB'

    // Geocode to determine state and metro
    const geo = await geocodeLocation(location)
    const displayName = geo ? geo.displayName : ''
    const state = stateFromDisplayName(displayName)
    const metro = metroFromDisplayName(displayName)
    const lat = geo ? geo.lat : 33.4484
    const lon = geo ? geo.lon : -112.074

    // Run prediction model
    const { currentEstimate, forecasts, indicators } = predictPrice({
      totalSF: sf,
      quality: qual,
      state,
      metro,
      foundationType: fndType,
    })

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        status: 'ok',
        data: {
          currentEstimate,
          forecasts,
          indicators,
          input: { bedrooms, bathrooms, stories, totalSF: sf, quality: qual, foundationType: fndType },
          location: { query: location, lat, lon, state, metro, displayName },
          methodology: 'Multi-factor model: Census CHARS base x BEA RPP localization x BLS construction inflation x FHFA market trend. Forecast bands widen with horizon to reflect uncertainty.',
          sources: [
            'Census Characteristics of New Housing (2023)',
            'BEA Regional Price Parities (2023)',
            'BLS Producer Price Index — Residential Construction Inputs',
            'BLS Employment Cost Index — Construction',
            'FHFA House Price Index (2024 Q3)',
            'Philadelphia Fed Survey of Professional Forecasters',
          ],
          disclaimer: 'This forecast uses government economic indicators for concept-level decision support only. It is not a contractor bid, appraisal, or lender-grade estimate.',
        },
      }),
    }
  } catch (err) {
    console.error('price_predict error:', err)
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ status: 'error', message: err.message || 'Internal server error' }),
    }
  }
}
