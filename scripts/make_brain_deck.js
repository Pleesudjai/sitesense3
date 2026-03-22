const pptxgen = require('pptxgenjs')
const pptx = new pptxgen()

// ── Theme ──
const NAVY = '0a1628'
const DARK = '0f172a'
const TEAL = '02C39A'
const TEAL_DIM = '1C7293'
const GRAY = '94a3b8'
const WHITE = 'FFFFFF'
const RED = 'ef4444'
const AMBER = 'f59e0b'
const GREEN = '22c55e'
const PURPLE = 'a78bfa'
const BLUE = '60a5fa'

pptx.author = 'SiteSense / HackASU 2025'
pptx.subject = 'AI Brain Architecture'
pptx.layout = 'LAYOUT_WIDE'

// ════════════════════════════════════════════════════════
// SLIDE 1: Title
// ════════════════════════════════════════════════════════
const s1 = pptx.addSlide()
s1.background = { color: NAVY }
s1.addText('SiteSense', { x: 0.8, y: 0.5, w: 8, h: 0.6, fontSize: 24, bold: true, color: TEAL, fontFace: 'Calibri' })
s1.addText('AI Brain Architecture', { x: 0.8, y: 1.2, w: 10, h: 1.0, fontSize: 44, bold: true, color: WHITE, fontFace: 'Calibri' })
s1.addText('This is NOT a Chatbot', { x: 0.8, y: 2.3, w: 10, h: 0.8, fontSize: 36, bold: true, color: AMBER, fontFace: 'Calibri' })
s1.addText('How we use AI to solve real engineering problems\n— not just generate text', { x: 0.8, y: 3.4, w: 8, h: 0.8, fontSize: 16, color: GRAY, fontFace: 'Calibri' })
s1.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 4.5, w: 13.33, h: 0.04, fill: { color: TEAL } })
s1.addText('HackASU 2025 · Mobasher Group · Track 3: Economic Empowerment', { x: 0.8, y: 6.8, w: 10, h: 0.4, fontSize: 12, color: GRAY, fontFace: 'Calibri' })

// ════════════════════════════════════════════════════════
// SLIDE 2: The Problem
// ════════════════════════════════════════════════════════
const s2 = pptx.addSlide()
s2.background = { color: DARK }
s2.addText('Why a Chatbot Fails for Engineering', { x: 0.8, y: 0.4, w: 10, h: 0.6, fontSize: 32, bold: true, color: WHITE, fontFace: 'Calibri' })
s2.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 1.05, w: 4, h: 0.04, fill: { color: RED } })

const problems = [
  ['No real data', 'LLM guesses soil type, flood zone, slope — often wrong'],
  ['No math guardrails', 'LLM calculates costs and areas — makes arithmetic errors'],
  ['No boundaries', 'LLM gives structural sizing advice it shouldn\'t — liability risk'],
  ['No provenance', 'Can\'t trace where any claim came from — no source attribution'],
  ['No consistency', 'Different answer every time for the same question'],
  ['Fails without API', 'Entire app breaks if LLM service goes down'],
]
problems.forEach((p, i) => {
  const y = 1.4 + i * 0.88
  s2.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y, w: 11.5, h: 0.72, fill: { color: '1e293b' }, rectRadius: 0.1 })
  s2.addText('✗', { x: 0.95, y: y + 0.1, w: 0.4, h: 0.5, fontSize: 20, color: RED, fontFace: 'Calibri', bold: true })
  s2.addText(p[0], { x: 1.4, y: y + 0.05, w: 3, h: 0.35, fontSize: 16, bold: true, color: WHITE, fontFace: 'Calibri' })
  s2.addText(p[1], { x: 1.4, y: y + 0.35, w: 10, h: 0.3, fontSize: 12, color: GRAY, fontFace: 'Calibri' })
})

// ════════════════════════════════════════════════════════
// SLIDE 3: 14 GIS Layers — Real Names + Sources
// ════════════════════════════════════════════════════════
const s3 = pptx.addSlide()
s3.background = { color: DARK }
s3.addText('14 Government GIS Layers — All Free, No Auth', { x: 0.8, y: 0.3, w: 11, h: 0.6, fontSize: 28, bold: true, color: WHITE, fontFace: 'Calibri' })
s3.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 0.9, w: 4, h: 0.04, fill: { color: TEAL } })

const layers = [
  ['1', 'Elevation Grid', 'USGS 3DEP', 'epqs.nationalmap.gov', '10×10 point grid, slope, aspect'],
  ['2', 'Flood Zone', 'FEMA NFHL', 'msc.fema.gov/arcgis', 'Zone AE/X/VE, base flood elevation'],
  ['3', 'Soil Properties', 'USDA SoilWeb + SDA', 'casoilresource.lawr.ucdavis.edu', 'Texture, shrink-swell, bearing, HSG, caliche'],
  ['4', 'Seismic Hazard', 'USGS NSHM', 'earthquake.usgs.gov', 'Ss, S1, SDS, SD1, SDC, wind speed'],
  ['5', 'Wildfire Risk', 'Rule-based (15 US zones)', '—', 'AZ, CA, CO, OR, WA, TX, FL, ID, NM'],
  ['6', 'Wetlands', 'USFWS NWI', 'fws.gov/wetlands', 'Wetland types, coverage percentage'],
  ['7', 'Precipitation', 'NOAA Atlas 14', 'hdsc.nws.noaa.gov', 'Rainfall intensity, annual precip'],
  ['8', 'Contamination', 'EPA Envirofacts + FRS', 'epa.gov/enviro', 'Nearby sites, distance'],
  ['9', 'Hydrography', 'USGS NHD', 'usgs.gov/nhd', 'Streams, water features nearby'],
  ['10', 'Endangered Species', 'USFWS Critical Habitat', 'fws.gov/endangered', 'Species count in area'],
  ['11', 'Historic Sites', 'NPS National Register', 'nps.gov/maps', 'Historic sites nearby'],
  ['12', 'Landslide Risk', 'Rule-based estimate', '—', 'From slope + soil + precipitation'],
  ['13', 'Sea Level Rise', 'NOAA SLR', 'coast.noaa.gov', 'Coastal risk assessment'],
  ['14', 'Soil Map Polygons', 'USDA SDA Spatial', 'sdmdataaccess.sc.egov.usda.gov', 'SSURGO map unit boundaries'],
]

// Header
s3.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.15, w: 12.3, h: 0.35, fill: { color: '1e3a5f' } })
s3.addText('#', { x: 0.5, y: 1.15, w: 0.4, h: 0.35, fontSize: 9, bold: true, color: TEAL, fontFace: 'Calibri', align: 'center', valign: 'middle' })
s3.addText('Layer', { x: 0.9, y: 1.15, w: 1.8, h: 0.35, fontSize: 9, bold: true, color: TEAL, fontFace: 'Calibri', valign: 'middle' })
s3.addText('Source Agency', { x: 2.7, y: 1.15, w: 2.3, h: 0.35, fontSize: 9, bold: true, color: TEAL, fontFace: 'Calibri', valign: 'middle' })
s3.addText('API Endpoint', { x: 5.0, y: 1.15, w: 3.2, h: 0.35, fontSize: 9, bold: true, color: TEAL, fontFace: 'Calibri', valign: 'middle' })
s3.addText('Data Returned', { x: 8.2, y: 1.15, w: 4.5, h: 0.35, fontSize: 9, bold: true, color: TEAL, fontFace: 'Calibri', valign: 'middle' })

layers.forEach((l, i) => {
  const y = 1.55 + i * 0.37
  const bg = i % 2 === 0 ? '1e293b' : '162032'
  s3.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y, w: 12.3, h: 0.35, fill: { color: bg } })
  s3.addText(l[0], { x: 0.5, y, w: 0.4, h: 0.35, fontSize: 8, color: TEAL, fontFace: 'Calibri', align: 'center', valign: 'middle', bold: true })
  s3.addText(l[1], { x: 0.9, y, w: 1.8, h: 0.35, fontSize: 8, color: WHITE, fontFace: 'Calibri', valign: 'middle', bold: true })
  s3.addText(l[2], { x: 2.7, y, w: 2.3, h: 0.35, fontSize: 8, color: GRAY, fontFace: 'Calibri', valign: 'middle' })
  s3.addText(l[3], { x: 5.0, y, w: 3.2, h: 0.35, fontSize: 7, color: '64748b', fontFace: 'Calibri', valign: 'middle' })
  s3.addText(l[4], { x: 8.2, y, w: 4.5, h: 0.35, fontSize: 8, color: GRAY, fontFace: 'Calibri', valign: 'middle' })
})

s3.addText('All fetched in parallel via Promise.all() — total time < 10 seconds', { x: 0.8, y: 6.9, w: 10, h: 0.3, fontSize: 11, color: TEAL, fontFace: 'Calibri', italic: true })

// ════════════════════════════════════════════════════════
// SLIDE 4: Brain Architecture — 7 Layers
// ════════════════════════════════════════════════════════
const s4 = pptx.addSlide()
s4.background = { color: DARK }
s4.addText('Brain Architecture — 7 Layers', { x: 0.8, y: 0.4, w: 10, h: 0.6, fontSize: 32, bold: true, color: WHITE, fontFace: 'Calibri' })
s4.addText('Claude is ONE replaceable component — the brain is the persistent system', { x: 0.8, y: 1.0, w: 10, h: 0.4, fontSize: 14, color: GRAY, fontFace: 'Calibri' })
s4.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 1.4, w: 4, h: 0.04, fill: { color: TEAL } })

const archLayers = [
  ['1. Retrieval', '14 GIS APIs fetched in parallel (USGS, FEMA, USDA, EPA, USFWS, NOAA...)', TEAL_DIM],
  ['2. Tool Layer', 'Slope calc, 9-zone pad scoring, 8-direction orientation, cost engine', TEAL],
  ['3. Doctrine', 'IBC 2021, ASCE 7-22, ACI 360R-10, ACI 350-20 — code rules injected', PURPLE],
  ['4. Evidence Pack', 'Structured working memory: retrieval + computed + assumptions + provenance + confidence', BLUE],
  ['5. Expert Panel', '6 specialists run rules first: foundation, stormwater, site-design, cost, strategist, auditor', AMBER],
  ['6. AI Extension', 'Claude reads rule findings + raw evidence → discovers NEW compound risks [AI INSIGHT]', GREEN],
  ['7. Output', 'Structured JSON → frontend cards + PDF report + engineer handoff brief', GRAY],
]
archLayers.forEach((l, i) => {
  const y = 1.7 + i * 0.72
  s4.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y, w: 11.5, h: 0.6, fill: { color: '1e293b' }, rectRadius: 0.08 })
  s4.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y, w: 0.08, h: 0.6, fill: { color: l[2] } })
  s4.addText(l[0], { x: 1.1, y, w: 2.5, h: 0.6, fontSize: 14, bold: true, color: l[2], fontFace: 'Calibri', valign: 'middle' })
  s4.addText(l[1], { x: 3.6, y, w: 8.5, h: 0.6, fontSize: 12, color: GRAY, fontFace: 'Calibri', valign: 'middle' })
})

// ════════════════════════════════════════════════════════
// SLIDE 5: Rules-First-Then-Claude Pattern
// ════════════════════════════════════════════════════════
const s5 = pptx.addSlide()
s5.background = { color: DARK }
s5.addText('Rules First, Then Claude Extends', { x: 0.8, y: 0.4, w: 10, h: 0.6, fontSize: 32, bold: true, color: WHITE, fontFace: 'Calibri' })
s5.addText('Deterministic rules ALWAYS run — AI adds insights on top, never replaces', { x: 0.8, y: 1.0, w: 10, h: 0.4, fontSize: 14, color: GRAY, fontFace: 'Calibri' })
s5.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 1.4, w: 4, h: 0.04, fill: { color: TEAL } })

// Step 1 box
s5.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.7, w: 5.8, h: 2.8, fill: { color: '1e293b' }, line: { color: AMBER, width: 1.5 }, rectRadius: 0.12 })
s5.addText('STEP 1: Rules Run (ALWAYS)', { x: 0.7, y: 1.8, w: 5.4, h: 0.45, fontSize: 16, bold: true, color: AMBER, fontFace: 'Calibri' })
s5.addText('✓  14 compound risk checks\n✓  Soil + slope + flood combinations\n✓  Foundation priority ladder (IBC/ACI)\n✓  Cost with compound premiums\n✓  Cross-expert tradeoff detection\n✓  Data quality audit\n\nProduces: ruleResult (JSON)', { x: 0.9, y: 2.3, w: 5, h: 2.0, fontSize: 12, color: GRAY, fontFace: 'Calibri' })

// Arrow
s5.addText('→', { x: 6.2, y: 2.7, w: 0.7, h: 0.6, fontSize: 30, color: '475569', fontFace: 'Calibri', align: 'center' })

// Step 2 box
s5.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 7.0, y: 1.7, w: 5.8, h: 2.8, fill: { color: '1e293b' }, line: { color: GREEN, width: 1.5 }, rectRadius: 0.12 })
s5.addText('STEP 2: Claude Extends (IF API KEY)', { x: 7.2, y: 1.8, w: 5.4, h: 0.45, fontSize: 16, bold: true, color: GREEN, fontFace: 'Calibri' })
s5.addText('★  Reads ruleResult + raw evidence\n★  Finds NEW compounds rules missed\n★  "Slope + soil + north-facing = asymmetric\n    moisture → worse differential heave"\n★  Marks additions: [AI INSIGHT]\n★  Merges with rule findings\n\nProduces: ruleResult + AI insights', { x: 7.4, y: 2.3, w: 5, h: 2.0, fontSize: 12, color: GRAY, fontFace: 'Calibri' })

// Bottom: merged output
s5.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 2.5, y: 4.9, w: 8.3, h: 1.5, fill: { color: '1e293b' }, line: { color: TEAL, width: 1.5 }, rectRadius: 0.12 })
s5.addText('MERGED OUTPUT (same JSON schema either way)', { x: 2.7, y: 5.0, w: 7.9, h: 0.4, fontSize: 14, bold: true, color: TEAL, fontFace: 'Calibri' })
s5.addText('Rule findings:  "Expansive soil on 6% slope → differential settlement"\nAI addition:    [AI INSIGHT] "North-facing slope = asymmetric drying → worse heave on south wall"\n\nWithout API: rule findings only.  With API: rule findings + AI insights merged.', { x: 2.9, y: 5.4, w: 7.5, h: 0.9, fontSize: 10, color: GRAY, fontFace: 'Calibri' })

// ════════════════════════════════════════════════════════
// SLIDE 6: Compound Risk Detection — Real Examples
// ════════════════════════════════════════════════════════
const s6 = pptx.addSlide()
s6.background = { color: DARK }
s6.addText('14 Compound Risk Checks', { x: 0.8, y: 0.3, w: 10, h: 0.5, fontSize: 28, bold: true, color: WHITE, fontFace: 'Calibri' })
s6.addText('Risks that only appear when MULTIPLE signals combine — a GIS viewer can\'t find these', { x: 0.8, y: 0.8, w: 10, h: 0.35, fontSize: 13, color: GRAY, fontFace: 'Calibri' })
s6.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 1.15, w: 4, h: 0.04, fill: { color: RED } })

const compounds = [
  ['Expansive soil + slope', 'Differential settlement — uphill heaves differently than downhill', '+$8-15K'],
  ['Flood zone + HSG D soil', 'Double water burden — flood elevation + detention basin both needed', 'Major'],
  ['Caliche + steep slope', 'Excavation 2-3× harder on slopes — stepped grade beams needed', '+$3-8/SF'],
  ['Low bearing + flood', 'Pile foundation through weak soil to bearing stratum — excessive lengths', 'Major'],
  ['Collapsible soil + water', 'Wetting triggers sudden settlement — ground improvement critical', 'Critical'],
  ['High seismic + expansive', 'Competing demands: lateral resistance vs heave — complex engineering', '+20-30%'],
  ['Steep slope + clay', 'Triple drainage: erosion + volume + low infiltration', 'Significant'],
  ['Flood + upstream slope', 'Concentrated flow convergence at building pad', 'Moderate'],
  ['High runoff + flat terrain', 'No gravity-fed detention possible — pumped system needed', '+$15-25K'],
  ['Small buildable + steep', 'Very limited usable flat area for building pad', 'Design limit'],
  ['Flood + wetlands', 'Double environmental constraint reduces buildable envelope', 'Permit risk'],
  ['Expensive fnd + flood', 'Both systems add cost + integration premium', '+15%'],
  ['Expensive fnd + slope', 'Grading + foundation interact — compound complexity', '+10%'],
  ['Flood zone + slope', 'Drainage, elevation, grading all interact', '+8%'],
]

compounds.forEach((c, i) => {
  const y = 1.35 + i * 0.39
  const bg = i % 2 === 0 ? '1e293b' : '162032'
  s6.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y, w: 12.3, h: 0.36, fill: { color: bg } })
  s6.addText(c[0], { x: 0.6, y, w: 2.8, h: 0.36, fontSize: 9, bold: true, color: RED, fontFace: 'Calibri', valign: 'middle' })
  s6.addText(c[1], { x: 3.5, y, w: 7.2, h: 0.36, fontSize: 9, color: GRAY, fontFace: 'Calibri', valign: 'middle' })
  s6.addText(c[2], { x: 10.8, y, w: 1.9, h: 0.36, fontSize: 9, bold: true, color: AMBER, fontFace: 'Calibri', valign: 'middle', align: 'right' })
})

s6.addText('These are found by CODE (deterministic) — Claude adds MORE that rules can\'t anticipate', { x: 0.8, y: 6.9, w: 11, h: 0.3, fontSize: 11, color: TEAL, fontFace: 'Calibri', italic: true })

// ════════════════════════════════════════════════════════
// SLIDE 7: Expert Panel
// ════════════════════════════════════════════════════════
const s7 = pptx.addSlide()
s7.background = { color: DARK }
s7.addText('Synthetic Domain Expert Panel', { x: 0.8, y: 0.4, w: 10, h: 0.5, fontSize: 28, bold: true, color: WHITE, fontFace: 'Calibri' })
s7.addText('Each expert runs rules FIRST, then Claude extends. Same JSON with or without API key.', { x: 0.8, y: 0.9, w: 10, h: 0.35, fontSize: 13, color: GRAY, fontFace: 'Calibri' })
s7.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 1.25, w: 4, h: 0.04, fill: { color: PURPLE } })

const experts = [
  ['Foundation\nAdvisor', 'Soil + slope + flood\n→ foundation risk\n+ 6 compound checks', TEAL, 'IBC 1806.2\nACI 360R-10'],
  ['Stormwater\nReviewer', 'Flood + HSG + runoff\n→ drainage difficulty\n+ 3 compound checks', BLUE, 'FEMA NFHL\nASCE 7-22 Ch.5'],
  ['Site Design\nAdvisor', 'Buildable % + slope\n→ design flexibility\n+ 2 compound checks', GREEN, 'Setbacks\nSlope analysis'],
  ['Cost\nForecaster', 'ROM cost + inflation\n→ timing guidance\n+ compound premiums', AMBER, 'ENR CCI 4.5%\nBEA RPP'],
  ['Parcel\nStrategist', 'ALL expert findings\n→ one verdict\n+ cross-expert tradeoffs', WHITE, 'Merges + ranks\nfindings'],
  ['Data Quality\nAuditor', 'Evidence confidence\n→ blocks weak claims\n→ downgrades verdict', RED, 'Governance\nlayer'],
]
experts.forEach((e, i) => {
  const col = i % 3
  const row = Math.floor(i / 3)
  const x = 0.8 + col * 4.1
  const y = 1.6 + row * 2.5
  s7.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.8, h: 2.2, fill: { color: '1e293b' }, line: { color: e[2], width: 1 }, rectRadius: 0.1 })
  s7.addText(e[0], { x: x + 0.15, y: y + 0.1, w: 3.5, h: 0.6, fontSize: 14, bold: true, color: e[2], fontFace: 'Calibri' })
  s7.addText(e[1], { x: x + 0.15, y: y + 0.7, w: 3.5, h: 0.8, fontSize: 10, color: GRAY, fontFace: 'Calibri' })
  s7.addText(e[3], { x: x + 0.15, y: y + 1.6, w: 3.5, h: 0.5, fontSize: 9, color: '64748b', fontFace: 'Calibri', italic: true })
})

// ════════════════════════════════════════════════════════
// SLIDE 8: Chatbot vs Brain — Comparison
// ════════════════════════════════════════════════════════
const s8 = pptx.addSlide()
s8.background = { color: DARK }
s8.addText('Chatbot vs Brain Architecture', { x: 0.8, y: 0.4, w: 10, h: 0.5, fontSize: 28, bold: true, color: WHITE, fontFace: 'Calibri' })
s8.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 0.9, w: 4, h: 0.04, fill: { color: TEAL } })

s8.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 1.2, w: 3.8, h: 0.45, fill: { color: '7f1d1d' }, rectRadius: 0.08 })
s8.addText('Common Chatbot', { x: 0.8, y: 1.2, w: 3.8, h: 0.45, fontSize: 14, bold: true, color: RED, fontFace: 'Calibri', align: 'center', valign: 'middle' })
s8.addShape(pptx.shapes.RECTANGLE, { x: 4.9, y: 1.2, w: 3.8, h: 0.45, fill: { color: '064e3b' }, rectRadius: 0.08 })
s8.addText('SiteSense Brain', { x: 4.9, y: 1.2, w: 3.8, h: 0.45, fontSize: 14, bold: true, color: GREEN, fontFace: 'Calibri', align: 'center', valign: 'middle' })
s8.addShape(pptx.shapes.RECTANGLE, { x: 9.0, y: 1.2, w: 3.6, h: 0.45, fill: { color: '1e293b' }, rectRadius: 0.08 })
s8.addText('Why It Matters', { x: 9.0, y: 1.2, w: 3.6, h: 0.45, fontSize: 14, bold: true, color: AMBER, fontFace: 'Calibri', align: 'center', valign: 'middle' })

const comparisons = [
  ['LLM guesses soil type', '14 real GIS APIs fetch verified data', 'Answers grounded in fact'],
  ['LLM does the math', 'Code computes, LLM synthesizes', 'No arithmetic errors'],
  ['One text blob', '8+ structured JSON fields', 'Each section styled differently'],
  ['No source tracking', '[PUBLIC] [LICENSED] [CALCULATED]', 'Every claim traceable'],
  ['Breaks without API', 'Rule-based fallback = same JSON', 'Works 24/7'],
  ['No boundaries', '8 boundary rules prevent overreach', 'Never claims compliance'],
  ['Checks signals alone', '14 compound risk detections', 'Finds hidden interactions'],
  ['AI replaces rules', 'Rules first, AI extends', 'Guaranteed baseline + AI bonus'],
  ['No quality check', 'Auditor downgrades weak claims', 'Prevents overconfidence'],
]
comparisons.forEach((c, i) => {
  const y = 1.78 + i * 0.53
  const bg = i % 2 === 0 ? '1e293b' : '162032'
  s8.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y, w: 11.8, h: 0.46, fill: { color: bg } })
  s8.addText(c[0], { x: 0.9, y, w: 3.7, h: 0.46, fontSize: 10, color: 'fca5a5', fontFace: 'Calibri', valign: 'middle' })
  s8.addText(c[1], { x: 5.0, y, w: 3.7, h: 0.46, fontSize: 10, color: '6ee7b7', fontFace: 'Calibri', valign: 'middle' })
  s8.addText(c[2], { x: 9.1, y, w: 3.4, h: 0.46, fontSize: 10, color: GRAY, fontFace: 'Calibri', valign: 'middle' })
})

// ════════════════════════════════════════════════════════
// SLIDE 9: What Each Expert Actually Does
// ════════════════════════════════════════════════════════
const s9x = pptx.addSlide()
s9x.background = { color: DARK }
s9x.addText('What Each Expert Actually Does', { x: 0.8, y: 0.25, w: 10, h: 0.5, fontSize: 28, bold: true, color: WHITE, fontFace: 'Calibri' })
s9x.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 0.75, w: 4, h: 0.04, fill: { color: PURPLE } })

// Header row
s9x.addShape(pptx.shapes.RECTANGLE, { x: 0.4, y: 1.0, w: 12.5, h: 0.4, fill: { color: '1e3a5f' } })
s9x.addText('Expert', { x: 0.5, y: 1.0, w: 1.8, h: 0.4, fontSize: 9, bold: true, color: TEAL, fontFace: 'Calibri', valign: 'middle' })
s9x.addText('Trigger', { x: 2.3, y: 1.0, w: 2.2, h: 0.4, fontSize: 9, bold: true, color: TEAL, fontFace: 'Calibri', valign: 'middle' })
s9x.addText('What It Reads', { x: 4.5, y: 1.0, w: 2.5, h: 0.4, fontSize: 9, bold: true, color: TEAL, fontFace: 'Calibri', valign: 'middle' })
s9x.addText('What It Produces', { x: 7.0, y: 1.0, w: 2.8, h: 0.4, fontSize: 9, bold: true, color: TEAL, fontFace: 'Calibri', valign: 'middle' })
s9x.addText('Compounds', { x: 9.8, y: 1.0, w: 3, h: 0.4, fontSize: 9, bold: true, color: TEAL, fontFace: 'Calibri', valign: 'middle' })

const expertDetails = [
  {
    name: 'Foundation\nAdvisor', trigger: 'Always runs', color: TEAL,
    reads: 'Soil texture, bearing,\nshrink-swell, caliche,\nflood zone, slope',
    produces: 'Foundation type from\nIBC/ACI code ladder\n+ cost impact',
    compounds: '6: expansive+slope,\nflood+HSG-D, caliche+slope,\nlow-bearing+flood,\ncollapsible+water, seismic+expansive'
  },
  {
    name: 'Stormwater\nReviewer', trigger: 'Flood AE/VE/A\nOR HSG D soil\nOR detention needed', color: BLUE,
    reads: 'Flood zone, soil HSG,\nrunoff CFS, slope %',
    produces: 'Drainage difficulty,\ndetention burden,\nflood risk level',
    compounds: '3: steep+clay,\nflood+slope,\nrunoff+flat terrain'
  },
  {
    name: 'Site Design\nAdvisor', trigger: 'Buildable < 80%\nOR steep > 10%', color: GREEN,
    reads: 'Buildable %, steep\nfraction, constraint list',
    produces: 'Design flexibility\nassessment, constraint\nseverity',
    compounds: '2: small-area+steep,\nflood+wetlands'
  },
  {
    name: 'Cost\nForecaster', trigger: 'Always runs', color: AMBER,
    reads: 'ROM cost, regional\nmultiplier, foundation\ntype, inflation rate',
    produces: 'Compound premium %,\nbuild-now-vs-wait,\ncost drivers',
    compounds: '3: fnd+flood (+15%),\nfnd+slope (+10%),\nflood+slope (+8%)'
  },
  {
    name: 'Parcel\nStrategist', trigger: 'Always runs\n(after all others)', color: WHITE,
    reads: 'ALL expert findings,\nevidence pack',
    produces: 'One verdict, top risks,\nopportunities, cross-\nexpert tradeoffs',
    compounds: 'Counts compound risks\nacross all experts,\ndetects cross-expert conflicts'
  },
  {
    name: 'Data Quality\nAuditor', trigger: 'Always runs\n(last)', color: RED,
    reads: 'Evidence confidence\nper GIS layer',
    produces: 'Downgrades verdict if\ncritical data is fallback,\nblocks overconfident claims',
    compounds: 'Can change verdict:\n"Good Candidate" →\n"Proceed with Caution"'
  },
]

expertDetails.forEach((e, i) => {
  const y = 1.5 + i * 0.9
  const bg = i % 2 === 0 ? '1e293b' : '162032'
  s9x.addShape(pptx.shapes.RECTANGLE, { x: 0.4, y, w: 12.5, h: 0.85, fill: { color: bg } })
  s9x.addShape(pptx.shapes.RECTANGLE, { x: 0.4, y, w: 0.06, h: 0.85, fill: { color: e.color } })
  s9x.addText(e.name, { x: 0.55, y, w: 1.7, h: 0.85, fontSize: 9, bold: true, color: e.color, fontFace: 'Calibri', valign: 'middle' })
  s9x.addText(e.trigger, { x: 2.3, y, w: 2.2, h: 0.85, fontSize: 8, color: GRAY, fontFace: 'Calibri', valign: 'middle' })
  s9x.addText(e.reads, { x: 4.5, y, w: 2.5, h: 0.85, fontSize: 8, color: GRAY, fontFace: 'Calibri', valign: 'middle' })
  s9x.addText(e.produces, { x: 7.0, y, w: 2.8, h: 0.85, fontSize: 8, color: GRAY, fontFace: 'Calibri', valign: 'middle' })
  s9x.addText(e.compounds, { x: 9.8, y, w: 3, h: 0.85, fontSize: 8, color: AMBER, fontFace: 'Calibri', valign: 'middle' })
})

s9x.addText('Total: 14 compound risk checks + 6 cross-expert tradeoff patterns · Rules first, Claude extends', { x: 0.8, y: 6.95, w: 11, h: 0.3, fontSize: 11, color: TEAL, fontFace: 'Calibri', italic: true })

// ════════════════════════════════════════════════════════
// SLIDE 10: LLM Boundaries
// ════════════════════════════════════════════════════════
const s9 = pptx.addSlide()
s9.background = { color: DARK }
s9.addText('8 LLM Boundary Rules', { x: 0.8, y: 0.4, w: 10, h: 0.5, fontSize: 28, bold: true, color: WHITE, fontFace: 'Calibri' })
s9.addText('Even when Claude is available, it operates within strict guardrails', { x: 0.8, y: 0.9, w: 10, h: 0.35, fontSize: 13, color: GRAY, fontFace: 'Calibri' })
s9.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 1.25, w: 4, h: 0.04, fill: { color: RED } })

const boundaries = [
  ['Never provides structural sizing', 'No member dimensions, reinforcing, or stamped calculations'],
  ['Never claims code compliance', 'Only explains requirements — compliance is for licensed PEs'],
  ['Never does the math', 'All computation by code BEFORE LLM sees data'],
  ['Never overrides the auditor', 'Data quality auditor can downgrade any claim'],
  ['Never gives legal advice', 'No permit strategy, zoning appeals, or liability'],
  ['Always recommends verification', 'Every answer includes "consult a licensed professional"'],
  ['Stays in civil/structural scope', 'Declines other engineering disciplines'],
  ['Sources every claim', '[PUBLIC], [LICENSED], or [CALCULATED] with references'],
]
boundaries.forEach((b, i) => {
  const y = 1.5 + i * 0.65
  s9.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y, w: 11.5, h: 0.55, fill: { color: '1e293b' }, rectRadius: 0.08 })
  s9.addText(`${i + 1}`, { x: 0.9, y, w: 0.5, h: 0.55, fontSize: 14, bold: true, color: RED, fontFace: 'Calibri', valign: 'middle', align: 'center' })
  s9.addText(b[0], { x: 1.5, y, w: 4, h: 0.55, fontSize: 13, bold: true, color: WHITE, fontFace: 'Calibri', valign: 'middle' })
  s9.addText(b[1], { x: 5.5, y, w: 6.5, h: 0.55, fontSize: 11, color: GRAY, fontFace: 'Calibri', valign: 'middle' })
})

// ════════════════════════════════════════════════════════
// SLIDE 10: Key Insight + Stats
// ════════════════════════════════════════════════════════
const s10 = pptx.addSlide()
s10.background = { color: NAVY }
s10.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 2.5, w: 13.33, h: 0.04, fill: { color: TEAL } })

s10.addText('The Key Insight', { x: 0.8, y: 0.8, w: 10, h: 0.5, fontSize: 18, color: TEAL, fontFace: 'Calibri', bold: true })
s10.addText('Claude is one replaceable component\ninside a larger persistent architecture.', {
  x: 0.8, y: 1.4, w: 11, h: 1.0, fontSize: 32, bold: true, color: WHITE, fontFace: 'Calibri'
})
s10.addText('The brain is the persistent system:\nidentity, doctrine, retrieval, tools, evidence pack,\nexpert panel, evaluation, and governance.', {
  x: 0.8, y: 2.8, w: 11, h: 1.0, fontSize: 18, color: GRAY, fontFace: 'Calibri'
})
s10.addText('— Based on SMC Labs Domain Brain Architecture', {
  x: 0.8, y: 4.0, w: 10, h: 0.4, fontSize: 13, italic: true, color: '64748b', fontFace: 'Calibri'
})

const stats = [
  ['14', 'GIS Data Layers'],
  ['14', 'Compound Risks'],
  ['6', 'Domain Experts'],
  ['8', 'LLM Boundaries'],
]
stats.forEach((st, i) => {
  const x = 0.8 + i * 3.1
  s10.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 5.0, w: 2.8, h: 1.4, fill: { color: '1e293b' }, rectRadius: 0.1 })
  s10.addText(st[0], { x, y: 5.05, w: 2.8, h: 0.8, fontSize: 40, bold: true, color: TEAL, fontFace: 'Calibri', align: 'center', valign: 'middle' })
  s10.addText(st[1], { x, y: 5.9, w: 2.8, h: 0.4, fontSize: 12, color: GRAY, fontFace: 'Calibri', align: 'center' })
})

s10.addText('100% functional without API key · AI extends, never replaces', { x: 0.8, y: 6.7, w: 11, h: 0.4, fontSize: 14, color: TEAL, fontFace: 'Calibri', align: 'center', bold: true })

// ════════════════════════════════════════════════════════
// Save
// ════════════════════════════════════════════════════════
const outPath = process.argv[2] || 'SiteSense_AI_Brain_Architecture.pptx'
pptx.writeFile({ fileName: outPath })
  .then(() => console.log('OK: ' + outPath))
  .catch(err => console.error('Error:', err))
