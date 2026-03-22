/**
 * ReportGenerator — builds a styled HTML report in a new browser tab.
 * User prints to PDF via Ctrl+P. No server round-trip needed.
 */

function getVerdict(result) {
  let highCount = 0
  if (result.flood?.risk_level === 'HIGH') highCount++
  if (result.soil?.shrink_swell === 'High' || result.soil?.expansive_risk === 'High') highCount++
  if (result.fire?.risk_class === 'HIGH' || result.fire?.risk_class === 'Very High') highCount++
  if (result.slope?.avg_slope_pct > 15) highCount++
  if (result.wetlands?.present) highCount++

  if (highCount === 0) return { level: 'FEASIBLE', color: '#22c55e', text: 'generally feasible for development' }
  if (highCount <= 2) return { level: 'CAUTION', color: '#f59e0b', text: 'feasible with some concerns that may increase costs' }
  return { level: 'CHALLENGING', color: '#ef4444', text: 'challenging — multiple site constraints may significantly impact costs' }
}

function severityChip(level) {
  const colors = { LOW: '#22c55e', MODERATE: '#f59e0b', HIGH: '#ef4444' }
  const c = colors[level] || '#94a3b8'
  return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;color:#fff;background:${c};">${level}</span>`
}

function fmt(v, decimals = 1) {
  if (v == null || isNaN(v)) return '—'
  return Number(v).toFixed(decimals)
}

function fmtInt(v) {
  if (v == null || isNaN(v)) return '—'
  return Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function money(v) {
  if (v == null || isNaN(v)) return '—'
  return '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function riskLevel(result, key) {
  if (key === 'flood') return result.flood?.risk_level || 'LOW'
  if (key === 'soil') return (result.soil?.expansive_risk === 'High' || result.soil?.shrink_swell === 'High') ? 'HIGH' : (result.soil?.shrink_swell === 'Moderate' ? 'MODERATE' : 'LOW')
  if (key === 'slope') return (result.slope?.avg_slope_pct > 15) ? 'HIGH' : (result.slope?.avg_slope_pct > 8 ? 'MODERATE' : 'LOW')
  if (key === 'fire') return result.fire?.risk_class === 'Very High' ? 'HIGH' : (result.fire?.risk_class || 'LOW').toUpperCase()
  return 'LOW'
}

function topRisks(result) {
  const items = []
  if (result.flood?.risk_level === 'HIGH') items.push('Flood zone ' + (result.flood?.zone || ''))
  if (result.soil?.shrink_swell === 'High' || result.soil?.expansive_risk === 'High') items.push('Expansive / high shrink-swell soil')
  if (result.fire?.risk_class === 'HIGH' || result.fire?.risk_class === 'Very High') items.push('Wildfire risk zone')
  if (result.slope?.avg_slope_pct > 15) items.push('Steep slope (' + fmt(result.slope.avg_slope_pct) + '%)')
  if (result.wetlands?.present) items.push('Wetlands present on parcel')
  if (items.length === 0) items.push('No high-severity risks identified')
  return items.slice(0, 3)
}

// ── Technical Appendix — dynamic "What This Means" helpers ──

function explainElevation(avg) {
  if (avg == null || isNaN(avg)) return 'Elevation data unavailable'
  if (avg > 7000) return 'High-altitude site — consider frost depth, snow loads, and shorter construction season'
  if (avg > 5000) return 'Moderate-to-high elevation — verify frost depth and potential snow load requirements'
  if (avg > 3000) return 'Moderate elevation — no special mountain construction requirements'
  return 'Low elevation — standard construction practices apply'
}

function explainElevationRange(min, max) {
  if (min == null || max == null) return 'Range data unavailable'
  const relief = max - min
  if (relief > 50) return `${fmtInt(relief)} ft of relief — significant grading and possible retaining walls`
  if (relief > 20) return `${fmtInt(relief)} ft of relief — moderate grading required`
  if (relief > 5) return `Only ${fmtInt(relief)} ft of relief across the parcel — relatively flat`
  return 'Less than 5 ft of relief — essentially flat site'
}

function explainAvgSlope(slope) {
  if (slope == null || isNaN(slope)) return 'Slope data unavailable'
  if (slope > 25) return 'Very steep — likely unbuildable without major earthwork and engineering'
  if (slope > 15) return 'Steep — retaining walls, special foundations, and extensive grading needed'
  if (slope > 10) return 'Moderate slope — terracing or stepped foundations likely required'
  if (slope > 5) return 'Gentle slope — minor grading needed, standard foundation with adjustment'
  if (slope > 3) return 'Mild slope — light grading, standard foundation appropriate'
  return 'Nearly flat — minimal grading needed, standard foundation appropriate'
}

function explainMaxSlope(slope) {
  if (slope == null || isNaN(slope)) return 'Max slope data unavailable'
  if (slope > 25) return 'Steep areas present — retaining walls and erosion control required in those zones'
  if (slope > 15) return 'Some steep areas — localized retaining or regrading needed'
  if (slope > 8) return 'Moderate slope pockets — may need local grading adjustments'
  return 'No steep areas — no retaining walls or special drainage required'
}

function explainArea(acres) {
  if (acres == null || isNaN(acres)) return 'Area data unavailable'
  if (acres > 5) return 'Large lot — ample space for phased development or multiple structures'
  if (acres > 1) return 'Generous lot — sufficient for most residential or small commercial concepts'
  if (acres > 0.25) return 'Moderate lot — sufficient for most residential concepts'
  return 'Compact lot — efficient site planning needed to maximize usable space'
}

function explainCut(cy) {
  if (cy == null || isNaN(cy)) return 'Cut data unavailable'
  if (cy > 50000) return 'Very high cut — significant hauling costs expected'
  if (cy > 10000) return 'Substantial cut — plan for haul-off logistics and disposal costs'
  if (cy > 1000) return 'Moderate cut — amount of earth to be removed for grading'
  return 'Minimal cut — light grading only'
}

function explainFill(cy) {
  if (cy == null || isNaN(cy)) return 'Fill data unavailable'
  if (cy > 50000) return 'Very high fill — significant import costs expected'
  if (cy > 10000) return 'Substantial fill — plan for material import and compaction'
  if (cy > 1000) return 'Moderate fill — amount of earth to be added for grading'
  return 'Minimal fill — light grading only'
}

function explainNetEarthwork(net) {
  if (net == null || isNaN(net)) return 'Earthwork data unavailable'
  const abs = Math.abs(net)
  if (abs < 500) return 'Near-balanced earthwork — not a significant cost driver'
  if (net > 0) return `Excess of ~${fmtInt(abs)} CY to export — plan for haul-off costs`
  return `Deficit of ~${fmtInt(abs)} CY to import — plan for material import costs`
}

function explainSoilTexture(tex) {
  if (!tex) return 'Soil texture data unavailable'
  const t = tex.toUpperCase()
  if (t.includes('CL') || t === 'C') return 'Clay soil — may have expansion potential, verify with geotech'
  if (t.includes('S') && !t.includes('SI')) return 'Sandy soil — good drainage but may need compaction for bearing'
  if (t.includes('SI') || t === 'SIL') return 'Silty soil — moderate bearing, watch for moisture sensitivity'
  if (t.includes('L')) return 'Well-balanced soil — generally favorable for construction'
  if (t.includes('GR') || t.includes('GP') || t.includes('GW')) return 'Gravelly soil — good bearing and drainage characteristics'
  return 'Verify soil properties with site-specific geotechnical investigation'
}

function explainShrinkSwell(level) {
  if (!level) return 'Shrink-swell data unavailable'
  const l = level.toLowerCase()
  if (l === 'high') return 'High expansion risk — post-tensioned slab required (ACI 360R-10 \u00A75.4)'
  if (l === 'moderate') return 'Moderate expansion risk — consider post-tensioned slab or moisture-controlled fill'
  return 'Low expansion risk — standard foundation should work'
}

function explainUSCS(uscs) {
  if (!uscs) return 'USCS classification unavailable'
  const u = uscs.toUpperCase()
  if (u.includes('CH')) return 'Fat clay — high plasticity, likely expansive, requires engineered foundation'
  if (u.includes('CL/ML') || u.includes('ML/CL')) return 'Fine-grained soil, moderate bearing — typical for residential'
  if (u.includes('CL')) return 'Lean clay — moderate bearing, verify expansion potential'
  if (u.includes('ML')) return 'Low-plasticity silt — moderate bearing, moisture-sensitive'
  if (u.includes('MH')) return 'High-plasticity silt — compressible, may need ground improvement'
  if (u.includes('SM') || u.includes('SC')) return 'Silty/clayey sand — generally good bearing with moderate drainage'
  if (u.includes('SP') || u.includes('SW')) return 'Well-graded or poorly-graded sand — good bearing and drainage'
  if (u.includes('GP') || u.includes('GW')) return 'Gravel — excellent bearing capacity and drainage'
  return 'Verify classification with site-specific soil borings'
}

function explainBearing(psf) {
  if (psf == null || isNaN(psf)) return 'Bearing data unavailable'
  if (psf >= 4000) return 'High bearing capacity — suitable for heavy structures per IBC Table 1806.2'
  if (psf >= 2000) return 'Adequate for conventional foundation per IBC Table 1806.2'
  if (psf >= 1500) return 'Marginal bearing — may need wider footings or ground improvement'
  return 'Low bearing capacity — engineered foundation or ground improvement likely required'
}

function explainCaliche(detected) {
  if (detected) return 'Hardpan layer present — specialized excavation (ripping/jackhammering) adds $3\u20138/SF'
  return 'No hardpan layer — standard excavation expected'
}

function explainFloodZone(zone) {
  if (!zone) return 'Flood zone data unavailable'
  const z = zone.toUpperCase()
  if (z.includes('VE') || z.includes('V')) return 'Coastal high-hazard flood zone — elevated construction, flood insurance, and ASCE 7 Ch.5 compliance required'
  if (z.includes('AE') || z.includes('AO') || z.includes('AH') || z === 'A') return 'Special Flood Hazard Area — flood insurance required, elevated construction may be needed'
  if (z.includes('X500') || z.includes('B') || z === 'X SHADED') return 'Moderate flood risk — flood insurance recommended but not federally required'
  if (z === 'X' || z === 'C') return 'Minimal flood risk — no flood insurance required, no elevated construction needed'
  return 'Verify flood designation with local floodplain administrator'
}

function explainSDS(sds) {
  if (sds == null || isNaN(sds)) return 'Seismic data unavailable'
  if (sds >= 1.0) return 'Very high seismic demand — rigorous seismic detailing and special structural systems required'
  if (sds >= 0.5) return 'Moderate seismic demand — seismic detailing required per ASCE 7-22'
  if (sds >= 0.33) return 'Low-to-moderate seismic demand — standard seismic provisions apply'
  return 'Low seismic demand — standard construction, no special seismic detailing'
}

function explainSD1(sd1) {
  if (sd1 == null || isNaN(sd1)) return 'Seismic data unavailable'
  if (sd1 >= 0.4) return 'High long-period ground motion — critical for tall/flexible structures'
  if (sd1 >= 0.2) return 'Moderate long-period ground motion — seismic provisions apply'
  if (sd1 >= 0.1) return 'Low-to-moderate long-period ground motion — basic seismic provisions'
  return 'Low long-period ground motion — low seismic risk'
}

function explainSDC(sdc) {
  if (!sdc) return 'Seismic design category unavailable'
  const s = sdc.toUpperCase()
  if (s === 'E' || s === 'F') return 'Highest seismic design category — stringent detailing, special moment frames likely'
  if (s === 'D' || s === 'D0' || s === 'D1' || s === 'D2') return 'High seismic design category — special seismic-force-resisting systems required'
  if (s === 'C') return 'Moderate seismic design category — intermediate detailing required'
  if (s === 'B') return 'Low seismic design category — basic structural provisions apply'
  return 'Minimal seismic design category — no seismic detailing required beyond gravity loads'
}

function explainWind(mph) {
  if (mph == null || isNaN(mph)) return 'Wind data unavailable'
  if (mph >= 150) return 'Extreme wind zone — hurricane-resistant construction required (ASCE 7-22 Ch.26-27)'
  if (mph >= 130) return 'High wind zone — enhanced connections and impact-resistant glazing likely required'
  if (mph >= 115) return 'Elevated wind zone — verify component and cladding pressures'
  return 'Standard design wind — no hurricane or high-wind provisions needed'
}

function explainSnow(psf) {
  if (psf == null || isNaN(psf) || psf === 0) return 'No snow load — site is below snow-prone elevation'
  if (psf > 50) return 'Heavy snow load — robust roof framing required per ASCE 7-22 Ch.7'
  if (psf > 25) return 'Moderate snow load — verify roof framing capacity per ASCE 7-22 Ch.7'
  return 'Light snow load — standard roof framing with snow considerations'
}

function explainFire(riskClass) {
  if (!riskClass) return 'Fire risk data unavailable'
  const r = riskClass.toLowerCase()
  if (r === 'very high' || r === 'extreme') return 'High-risk WUI zone — ignition-resistant construction, defensible space, and fire-rated materials required'
  if (r === 'high') return 'Elevated fire risk — wildland-urban interface provisions recommended'
  if (r === 'moderate') return 'Moderate fire risk — standard construction with fire-wise landscaping recommended'
  return 'Not in a wildland-urban interface zone'
}

function explainWetlands(present) {
  if (present) return 'Wetland constraints present — USACE Section 404 permit required, potential buildable area reduction'
  return 'No wetland constraints — no Section 404 permit needed'
}

function appendixRow(param, value, explanation) {
  return `<tr><td>${param}</td><td>${value}</td><td style="color:#475569;font-style:italic;">${explanation}</td></tr>`
}

function buildAppendixHTML(result, codeRef) {
  const avgElev = result.elevation?.avg_elevation_ft
  const minElev = result.elevation?.min_ft
  const maxElev = result.elevation?.max_ft
  const avgSlope = result.slope?.avg_slope_pct
  const maxSlope = result.slope?.max_slope_pct
  const area = result.elevation?.area_acres
  const cutCy = result.cut_fill?.cut_cy
  const fillCy = result.cut_fill?.fill_cy
  const netCy = result.cut_fill?.net_cy
  const soilTex = result.soil?.texture_class
  const shrinkSwell = result.soil?.shrink_swell
  const uscs = result.soil?.uscs_estimate
  const bearing = result.soil?.presumptive_bearing_psf
  const caliche = result.soil?.caliche
  const floodZone = result.flood?.zone
  const sds = result.seismic?.sds
  const sd1 = result.seismic?.sd1
  const sdc = result.loads?.seismic_sdc
  const wind = result.loads?.wind_mph
  const snow = result.loads?.snow_psf
  const fire = result.fire?.risk_class
  const wetlands = result.wetlands?.present

  const sectionHeader = (title) =>
    `<tr><td colspan="3" style="background:#0a1628;color:#fff;font-weight:700;font-size:12px;padding:8px 10px;letter-spacing:0.5px;">${title}</td></tr>`

  const thRow = `<thead><tr><th style="width:22%;">Parameter</th><th style="width:18%;">Value</th><th style="width:60%;">What This Means</th></tr></thead>`

  return `
    <div class="page">
      <h2>Technical Appendix</h2>

      <div class="section">
        <h3>Detailed Site Metrics</h3>
        <table>
          ${thRow}
          <tbody>
            ${sectionHeader('Terrain')}
            ${appendixRow('Avg Elevation', `${fmtInt(avgElev)} ft`, explainElevation(avgElev))}
            ${appendixRow('Min / Max Elevation', `${fmtInt(minElev)} / ${fmtInt(maxElev)} ft`, explainElevationRange(minElev, maxElev))}
            ${appendixRow('Avg Slope', `${fmt(avgSlope)}%`, explainAvgSlope(avgSlope))}
            ${appendixRow('Max Slope', `${fmt(maxSlope)}%`, explainMaxSlope(maxSlope))}
            ${appendixRow('Parcel Area', `${fmt(area, 2)} acres`, explainArea(area))}
            ${appendixRow('Cut Volume', `${fmtInt(cutCy)} CY`, explainCut(cutCy))}
            ${appendixRow('Fill Volume', `${fmtInt(fillCy)} CY`, explainFill(fillCy))}
            ${appendixRow('Net Earthwork', `${fmtInt(netCy)} CY`, explainNetEarthwork(netCy))}

            ${sectionHeader('Soil &amp; Foundation')}
            ${appendixRow('Soil Texture', soilTex || '\u2014', explainSoilTexture(soilTex))}
            ${appendixRow('Shrink-Swell', shrinkSwell || '\u2014', explainShrinkSwell(shrinkSwell))}
            ${appendixRow('USCS Estimate', uscs || '\u2014', explainUSCS(uscs))}
            ${appendixRow('Presumptive Bearing', bearing ? bearing + ' psf' : '\u2014', explainBearing(bearing))}
            ${appendixRow('Caliche', caliche ? 'Detected' : 'Not detected', explainCaliche(caliche))}

            ${sectionHeader('Hazards')}
            ${appendixRow('Flood Zone', floodZone || '\u2014', explainFloodZone(floodZone))}
            ${appendixRow('Seismic S<sub>DS</sub>', fmt(sds, 3), explainSDS(sds))}
            ${appendixRow('Seismic S<sub>D1</sub>', fmt(sd1, 3), explainSD1(sd1))}
            ${appendixRow('Seismic SDC', sdc || '\u2014', explainSDC(sdc))}
            ${appendixRow('Wind Speed', wind ? wind + ' mph' : '\u2014', explainWind(wind))}
            ${appendixRow('Snow Load', snow ? snow + ' psf' : '\u2014', explainSnow(snow))}
            ${appendixRow('Fire Risk', fire || '\u2014', explainFire(fire))}
            ${appendixRow('Wetlands', wetlands ? 'Present' : 'None', explainWetlands(wetlands))}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Code References</h3>
        <ul>
          <li><strong>Foundation:</strong> ${codeRef || 'ACI 360R-10'}</li>
          <li><strong>Seismic:</strong> ASCE 7-22 Ch. 12</li>
          <li><strong>Wind:</strong> ASCE 7-22 Ch. 26-27</li>
          <li><strong>Soil:</strong> IBC 2021 &sect;1803, Table 1806.2</li>
          <li><strong>Flood:</strong> ASCE 7-22 Ch. 5</li>
          <li><strong>Snow:</strong> ASCE 7-22 Ch. 7</li>
        </ul>
      </div>

      <div class="section">
        <h3>GIS Data Sources</h3>
        <ul>
          <li>USGS 3DEP — Elevation (epqs.nationalmap.gov)</li>
          <li>FEMA NFHL — Flood zones (msc.fema.gov)</li>
          <li>USDA SoilWeb — Soil properties (casoilresource.lawr.ucdavis.edu)</li>
          <li>USGS NSHM — Seismic hazard (earthquake.usgs.gov)</li>
          <li>USFWS NWI — Wetlands (fws.gov/wetlands)</li>
        </ul>
      </div>

      <div class="disclaimer" style="margin-top:40px;">
        &copy; ${new Date().getFullYear()} SiteSense &mdash; AI-Powered Land Feasibility Tool.
        Generated for preliminary planning use only. Not a substitute for professional engineering services.
      </div>
    </div>
  `
}

function buildReportHTML(result, address, houseResult, forecastResult) {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const verdict = getVerdict(result)
  const acres = fmt(result.elevation?.area_acres, 2)
  const foundation = result.foundation?.type?.replace(/_/g, ' ') || '\u2014'
  const codeRef = result.foundation?.code_ref || 'ACI 360R-10'
  const totalNow = result.costs?.total_now
  const proj5 = result.costs?.projections?.['5yr'] ?? result.costs?.projections?.['5']
  const proj10 = result.costs?.projections?.['10yr'] ?? result.costs?.projections?.['10']

  // ── Buildable area calculations ──
  const totalAreaSf = (result.elevation?.area_acres || 0) * 43560
  const buildableSf = result.buildable_sf || totalAreaSf
  const constrainedPct = totalAreaSf > 0 ? Math.round((1 - buildableSf / totalAreaSf) * 100) : 0
  const buildableAcres = (buildableSf / 43560).toFixed(2)

  // ── Biggest single risk for the callout card ──
  const biggestRisk = (() => {
    if (result.flood?.risk_level === 'HIGH')
      return { name: 'Flood Zone', detail: `This parcel is in FEMA flood zone ${result.flood?.zone || 'AE'}, which requires flood insurance ($2,000\u20135,000/year) and may need elevated construction.` }
    if (result.soil?.shrink_swell === 'High' || result.soil?.expansive_risk === 'High')
      return { name: 'Expansive Soil', detail: 'Expansive clay soil means your foundation will cost more than a standard slab. A post-tensioned or pier foundation is likely needed.' }
    if (result.soil?.caliche)
      return { name: 'Caliche Hardpan', detail: 'Hard caliche layer below grade will increase excavation costs and may require grade beams instead of a standard slab.' }
    if (result.slope?.avg_slope_pct > 15)
      return { name: 'Steep Slope', detail: `Average slope of ${fmt(result.slope.avg_slope_pct)}% will require significant grading, retaining walls, or stepped foundation design.` }
    if (result.wetlands?.present)
      return { name: 'Wetlands Present', detail: 'Wetlands on the parcel will reduce buildable area and require a USACE Section 404 permit before any fill or grading.' }
    if (result.fire?.risk_class === 'HIGH' || result.fire?.risk_class === 'Very High')
      return { name: 'Wildfire Risk', detail: 'High fire risk zone. Ignition-resistant construction materials and defensible space will be required.' }
    if (result.slope?.avg_slope_pct > 8)
      return { name: 'Moderate Slope', detail: `Average slope of ${fmt(result.slope.avg_slope_pct)}% will require some grading work, but is manageable with standard earthwork.` }
    return { name: 'No Major Concerns', detail: 'No high-severity risks were identified. Standard construction practices should apply.' }
  })()

  // ── Foundation plain-English explanation ──
  const foundationExplain = (() => {
    const t = (result.foundation?.type || '').toLowerCase()
    if (t.includes('post_tension') || t.includes('pt_slab') || t.includes('post-tension'))
      return 'Post-tensioned slab recommended due to expansive soil. This prevents cracking from soil movement.'
    if (t.includes('pier') || t.includes('drilled'))
      return 'Deep pier foundation recommended to reach stable bearing soil below the surface.'
    if (t.includes('grade_beam') || t.includes('grade beam'))
      return 'Grade beams recommended due to caliche or variable soil conditions.'
    return 'Standard slab-on-grade foundation should work for this site.'
  })()

  // ── Verdict sentence (plain English why) ──
  const verdictSentence = (() => {
    const v = verdict.level
    if (v === 'FEASIBLE')
      return 'No major deal-breakers were found. Standard site preparation and foundation should work for most building types.'
    if (v === 'CAUTION') {
      const concerns = []
      if (result.slope?.avg_slope_pct > 8) concerns.push('moderate slope')
      if (result.soil?.shrink_swell === 'High' || result.soil?.expansive_risk === 'High') concerns.push('expansive soil')
      if (result.flood?.risk_level === 'HIGH') concerns.push('flood zone location')
      if (result.fire?.risk_class === 'HIGH' || result.fire?.risk_class === 'Very High') concerns.push('fire risk')
      if (result.wetlands?.present) concerns.push('wetlands')
      const joined = concerns.length > 0 ? concerns.join(' and ') : 'some site conditions'
      return `${joined.charAt(0).toUpperCase() + joined.slice(1)} may increase foundation and site prep costs, but no major deal-breakers were found.`
    }
    return 'Multiple site constraints will significantly increase costs and complexity. Professional investigation is strongly recommended before committing.'
  })()

  // ── Verdict banner visual config ──
  const verdictBg = { FEASIBLE: '#f0fdf4', CAUTION: '#fffbeb', CHALLENGING: '#fef2f2' }
  const verdictBorder = { FEASIBLE: '#22c55e', CAUTION: '#f59e0b', CHALLENGING: '#ef4444' }
  const verdictLabel = { FEASIBLE: 'This site appears feasible', CAUTION: 'Feasible with concerns', CHALLENGING: 'Significant challenges identified' }

  // ── Risk table rows with plain-English implications ──
  const riskRows = (() => {
    const rows = []
    const slopeL = riskLevel(result, 'slope')
    const floodL = riskLevel(result, 'flood')
    const soilL = riskLevel(result, 'soil')
    const fireL = riskLevel(result, 'fire')

    const fz = result.flood?.zone || 'X'
    let floodImpl = 'No significant flood risk \u2014 standard insurance rates apply.'
    if (floodL === 'HIGH') floodImpl = `Located in FEMA zone ${fz}. Flood insurance required ($2,000\u20135,000/year). Elevated construction may be needed.`
    else if (floodL === 'MODERATE') floodImpl = `Near a flood-prone area (zone ${fz}). Flood insurance is recommended but may not be mandatory.`
    rows.push({ name: 'Flood', level: floodL, impl: floodImpl })

    let soilImpl = 'Soil conditions are suitable for standard foundation construction.'
    if (soilL === 'HIGH') soilImpl = 'Expansive clay soil will require a specialized foundation (post-tensioned slab or piers), adding $5\u201315/SF to foundation costs.'
    else if (soilL === 'MODERATE') soilImpl = 'Moderate shrink-swell potential. Enhanced foundation design may be needed \u2014 get a geotechnical report to confirm.'
    rows.push({ name: 'Soil', level: soilL, impl: soilImpl })

    let slopeImpl = 'Relatively flat \u2014 minimal grading costs expected.'
    if (slopeL === 'HIGH') slopeImpl = `Steep terrain (${fmt(result.slope?.avg_slope_pct)}% avg). Significant earthwork, retaining walls, or stepped foundations will be needed.`
    else if (slopeL === 'MODERATE') slopeImpl = `Moderate slope (${fmt(result.slope?.avg_slope_pct)}% avg). Some grading required, but manageable with standard earthwork.`
    rows.push({ name: 'Slope', level: slopeL, impl: slopeImpl })

    let fireImpl = 'Low fire risk \u2014 no special fire-resistant construction required.'
    if (fireL === 'HIGH') fireImpl = 'High wildfire risk zone. Ignition-resistant materials, defensible space, and enhanced insurance costs apply.'
    else if (fireL === 'MODERATE') fireImpl = 'Moderate fire risk. Fire-resistant roofing and ember-resistant vents are recommended.'
    rows.push({ name: 'Fire', level: fireL, impl: fireImpl })

    const wetlandL = result.wetlands?.present ? 'HIGH' : 'LOW'
    let wetlandImpl = 'No wetlands identified \u2014 no environmental permits needed for this factor.'
    if (result.wetlands?.present) wetlandImpl = 'Wetlands present on parcel. USACE Section 404 permit required before any grading or fill. This can add 3\u20136 months to your timeline.'
    rows.push({ name: 'Wetlands', level: wetlandL, impl: wetlandImpl })

    const sdc = result.loads?.seismic_sdc || result.seismic?.sdc || ''
    let seismicL = 'LOW'
    let seismicImpl = 'Low seismic risk \u2014 standard construction details apply.'
    if (sdc >= 'D') { seismicL = 'HIGH'; seismicImpl = `Seismic Design Category ${sdc}. Special seismic detailing required, adding to engineering and construction costs.` }
    else if (sdc === 'C') { seismicL = 'MODERATE'; seismicImpl = `Seismic Design Category ${sdc}. Some additional seismic detailing needed, but standard wood-frame construction is permitted.` }
    else if (sdc) { seismicImpl = `Seismic Design Category ${sdc}. Standard construction details are sufficient.` }
    rows.push({ name: 'Seismic', level: seismicL, impl: seismicImpl })

    return rows
  })()

  const riskTableHTML = riskRows.map(r => {
    const chipColors = { LOW: '#22c55e', MODERATE: '#f59e0b', HIGH: '#ef4444' }
    const chipBg = chipColors[r.level] || '#94a3b8'
    return `<tr>
      <td style="font-weight:600;width:80px;vertical-align:top;">${r.name}</td>
      <td style="width:95px;vertical-align:top;text-align:center;">
        <span style="display:inline-block;padding:3px 14px;border-radius:12px;font-size:11px;font-weight:700;color:#fff;background:${chipBg};">${r.level}</span>
      </td>
      <td style="font-size:13px;color:#334155;line-height:1.5;">${r.impl}</td>
    </tr>`
  }).join('')

  // ── CSS — updated for user-first layout ──
  const css = `
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b; background:#fff; }
    .page { padding:48px 56px; min-height:100vh; position:relative; }
    .page-break { page-break-after:always; }

    .header-bar { background:#0a1628; color:#fff; padding:20px 56px; display:flex; align-items:center; justify-content:space-between; }
    .header-bar h1 { font-size:22px; font-weight:800; letter-spacing:-0.5px; }
    .header-bar .accent { color:#02C39A; }
    .subtitle { font-size:11px; color:#94a3b8; }

    h2 { font-size:16px; font-weight:700; color:#0a1628; margin-bottom:8px; border-bottom:2px solid #02C39A; padding-bottom:4px; }
    h3 { font-size:14px; font-weight:700; color:#334155; margin-bottom:4px; }
    .meta { font-size:12px; color:#64748b; margin-bottom:12px; }

    /* Verdict box — the dominant visual element on page 1 */
    .verdict-box {
      margin:0 0 24px; padding:20px 24px; border-radius:10px;
      border-left:6px solid ${verdictBorder[verdict.level]};
      background:${verdictBg[verdict.level]};
    }
    .verdict-label { font-size:20px; font-weight:800; color:${verdict.color}; margin-bottom:6px; }
    .verdict-why { font-size:14px; color:#334155; line-height:1.6; }

    /* 2x2 callout card grid */
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:24px; }
    .callout-card { border:1px solid #e2e8f0; border-radius:8px; padding:16px 18px; background:#fff; }
    .callout-card .card-label { font-size:10px; text-transform:uppercase; letter-spacing:0.8px; color:#64748b; font-weight:700; margin-bottom:6px; }
    .callout-card .card-value { font-size:18px; font-weight:700; color:#0a1628; margin-bottom:4px; }
    .callout-card .card-detail { font-size:12px; color:#475569; line-height:1.5; }

    /* Risk traffic-light table — implication text is LARGER than technical value */
    table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:16px; }
    th { background:#f1f5f9; text-align:left; padding:8px 10px; font-weight:600; border:1px solid #e2e8f0; }
    td { padding:8px 10px; border:1px solid #e2e8f0; }

    .card { border:1px solid #e2e8f0; border-radius:8px; padding:14px 16px; }
    .card-title { font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:6px; }
    .badge { display:inline-block; padding:3px 12px; border-radius:12px; font-weight:700; font-size:13px; color:#fff; }

    .section { margin-bottom:22px; }
    .section-header { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .explain { font-size:13px; color:#475569; line-height:1.7; }
    .explain .tech-value { font-size:11px; color:#94a3b8; }
    .explain .means { font-size:13px; color:#1e293b; font-weight:500; }

    /* "What to check next" — light blue to stand out */
    .check-next {
      background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px;
      padding:10px 14px; margin-top:8px; font-size:12px; color:#1e40af; line-height:1.5;
    }
    .check-next strong { font-weight:700; }

    .disclaimer { font-size:10px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:10px; margin-top:24px; }
    .disclaimer-box { border:1px solid #fbbf24; background:#fffbeb; padding:12px 16px; border-radius:8px; font-size:11px; color:#92400e; margin-top:16px; }
    ul { padding-left:18px; font-size:12px; color:#475569; line-height:1.8; }

    @media print {
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .page { padding:36px 40px; }
      .header-bar { position:static; }
    }
  `

  // =========================================================================
  // PAGE 1: "Can I Build Here?" — answers Pain 1 (buildability) + Pain 2 (costs)
  // =========================================================================
  const page1 = `
    <div class="header-bar">
      <div>
        <h1>Site<span class="accent">Sense</span> Feasibility Report</h1>
        <div class="subtitle">AI-Powered Land Feasibility Tool</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#94a3b8;">${now}</div>
        <div style="font-size:11px;color:#94a3b8;">Parcel: ${acres} acres</div>
      </div>
    </div>
    <div class="page page-break">
      ${address ? `<div class="meta"><strong>${address}</strong></div>` : ''}

      <!-- VERDICT BOX — the most important element on the page -->
      <div class="verdict-box">
        <div class="verdict-label">${verdictLabel[verdict.level]}</div>
        <div class="verdict-why">${verdictSentence}</div>
      </div>

      <!-- "What You Should Know First" — 4 callout cards in 2x2 grid -->
      <h2>What You Should Know First</h2>
      <div class="grid2">
        <div class="callout-card">
          <div class="card-label">Buildable Area</div>
          <div class="card-value">${buildableAcres} ac usable <span style="font-size:13px;font-weight:400;color:#64748b;">of ${acres} total</span></div>
          <div class="card-detail">${constrainedPct > 0
            ? `Wetlands, steep slopes, and setbacks reduce your usable area by ${constrainedPct}%.`
            : 'Nearly all of the parcel area is usable after accounting for standard setbacks.'}</div>
        </div>
        <div class="callout-card">
          <div class="card-label">Biggest Risk</div>
          <div class="card-value">${biggestRisk.name}</div>
          <div class="card-detail">${biggestRisk.detail}</div>
        </div>
        <div class="callout-card">
          <div class="card-label">Estimated Site Prep</div>
          <div class="card-value">${money(totalNow)} <span style="font-size:13px;font-weight:400;color:#64748b;">today</span></div>
          <div class="card-detail">${proj5 ? `${money(proj5)} in 5 years. ` : ''}Construction costs are rising ~4.5%/year (ENR CCI).</div>
        </div>
        <div class="callout-card">
          <div class="card-label">Foundation Direction</div>
          <div class="card-value" style="text-transform:capitalize;">${foundation}</div>
          <div class="card-detail">${foundationExplain} <span style="font-size:11px;color:#94a3b8;">(${codeRef})</span></div>
        </div>
      </div>

      <!-- "Top Risks at a Glance" — traffic light table -->
      <h2>Top Risks at a Glance</h2>
      <table>
        <thead>
          <tr>
            <th>Risk</th>
            <th style="text-align:center;">Level</th>
            <th>What It Means</th>
          </tr>
        </thead>
        <tbody>
          ${riskTableHTML}
        </tbody>
      </table>

      <div class="disclaimer">
        This report is generated by SiteSense for preliminary planning purposes only.
        All findings must be verified by licensed professionals before any design or construction decisions.
      </div>
    </div>
  `

  // =========================================================================
  // PAGE 2: "What Could Surprise You" — answers Pain 2 deeper
  // 4 sections, each with: heading, severity chip, plain English, "What to check next"
  // =========================================================================
  const slopeLevel = riskLevel(result, 'slope')
  const floodLevel = riskLevel(result, 'flood')
  const soilLevel = riskLevel(result, 'soil')
  const fireLevel = riskLevel(result, 'fire')

  // Grading cost estimate (rough: $8-15/CY for earthwork)
  const totalEarthworkCY = (result.cut_fill?.cut_cy || 0) + (result.cut_fill?.fill_cy || 0)
  const gradingCostLow = totalEarthworkCY * 8
  const gradingCostHigh = totalEarthworkCY * 15

  // Slope direction
  const slopeDir = result.slope?.direction || result.slope?.aspect || ''
  const slopeDirText = slopeDir ? ` The lot slopes toward the ${slopeDir.toLowerCase()}.` : ''

  // Flood plain English
  const floodZone = result.flood?.zone || 'X'
  const floodBFE = result.flood?.bfe_ft
  const floodExplain = (() => {
    if (floodLevel === 'HIGH') {
      let txt = `This parcel is in FEMA flood zone ${floodZone}, a Special Flood Hazard Area.`
      txt += ' This affects insurance costs ($2,000\u20135,000/year) and may require elevated construction.'
      if (floodBFE) txt += ` The Base Flood Elevation is ${fmtInt(floodBFE)} ft.`
      return txt
    }
    if (floodLevel === 'MODERATE')
      return `This parcel is in FEMA zone ${floodZone}, near a flood-prone area. Flood insurance is recommended but may not be mandatory.`
    return `This parcel is in FEMA zone ${floodZone} \u2014 no significant flood risk. Standard drainage design and insurance rates apply.`
  })()

  // Soil plain English
  const soilExplain = (() => {
    const texture = result.soil?.texture_class || 'Unknown'
    const ss = result.soil?.shrink_swell || 'Low'
    const bearing = result.soil?.presumptive_bearing_psf
    const caliche = result.soil?.caliche
    let txt = `The soil is classified as ${texture}`
    if (bearing) txt += ` with a presumptive bearing capacity of ${fmtInt(bearing)} psf`
    txt += '.'
    if (ss === 'High' || result.soil?.expansive_risk === 'High')
      txt += ' High shrink-swell potential means the soil expands when wet and contracts when dry. This causes cracking in standard slabs \u2014 a post-tensioned or pier foundation is needed.'
    else if (ss === 'Moderate')
      txt += ' Moderate shrink-swell potential. Enhanced foundation design may be prudent \u2014 a geotechnical report will confirm whether a standard slab is adequate.'
    else
      txt += ' The soil has low expansion risk. A standard foundation should work, but a geotechnical boring ($2,000\u20134,000) is still recommended before design.'
    if (caliche)
      txt += ' Caliche hardpan was detected, which will increase excavation difficulty and cost ($3\u20138/SF uplift for specialized equipment).'
    return txt
  })()

  // Environmental flags plain English
  const envFlags = (() => {
    const items = []
    if (result.wetlands?.present) {
      const coverage = result.wetlands?.coverage_pct
      let txt = 'Wetlands are present on this parcel'
      if (coverage) txt += ` (approximately ${fmt(coverage, 0)}% coverage)`
      txt += '. A USACE Section 404 permit is required before any fill, grading, or construction in wetland areas. This typically adds 3\u20136 months and $5,000\u201315,000 in permitting costs.'
      items.push({ flag: 'Wetlands', text: txt })
    } else {
      items.push({ flag: 'Wetlands', text: 'No wetlands identified on this parcel. No wetland-related permits are needed.' })
    }
    const fireClass = result.fire?.risk_class || 'Low'
    if (fireLevel === 'HIGH')
      items.push({ flag: 'Wildfire', text: `Fire risk is rated ${fireClass}. Ignition-resistant construction materials, ember-resistant vents, and defensible space (30\u2013100 ft vegetation clearance) will be required. This adds to both construction and ongoing maintenance costs.` })
    else if (fireLevel === 'MODERATE')
      items.push({ flag: 'Wildfire', text: `Fire risk is rated ${fireClass}. Fire-resistant roofing and ember-resistant vents are recommended.` })
    else
      items.push({ flag: 'Wildfire', text: 'Low fire risk. No special fire-resistant construction is required.' })
    const loadNotes = []
    if (result.loads?.wind_mph) loadNotes.push(`Design wind speed: ${result.loads.wind_mph} mph`)
    if (result.loads?.seismic_sdc) loadNotes.push(`Seismic Design Category: ${result.loads.seismic_sdc}`)
    if (result.loads?.snow_psf && result.loads.snow_psf > 0) loadNotes.push(`Ground snow load: ${result.loads.snow_psf} psf`)
    if (loadNotes.length > 0)
      items.push({ flag: 'Design Loads', text: loadNotes.join('. ') + '. These are factored into the structural design requirements and cost estimates.' })
    return items
  })()

  const page2 = `
    <div class="page page-break">
      <h2>What Could Surprise You</h2>
      <p style="font-size:13px;color:#64748b;margin-bottom:20px;">Each section below highlights a potential cost driver and tells you exactly what to investigate next.</p>

      <!-- 1. Terrain & Grading -->
      <div class="section">
        <div class="section-header">
          <h3>1. Terrain &amp; Grading</h3>
          ${severityChip(slopeLevel)}
        </div>
        <p class="explain">
          <span class="means">
            ${slopeLevel === 'LOW'
              ? `The lot is relatively flat with an average slope of ${fmt(result.slope?.avg_slope_pct)}%. Minimal grading is needed.${slopeDirText}`
              : slopeLevel === 'MODERATE'
                ? `The lot has a moderate average slope of ${fmt(result.slope?.avg_slope_pct)}% (max ${fmt(result.slope?.max_slope_pct)}%).${slopeDirText} Grading will cost approximately ${money(gradingCostLow)}\u2013${money(gradingCostHigh)} for earthwork.`
                : `The lot has a steep average slope of ${fmt(result.slope?.avg_slope_pct)}% (max ${fmt(result.slope?.max_slope_pct)}%).${slopeDirText} Significant grading, retaining walls, or stepped foundations will be needed. Estimated earthwork cost: ${money(gradingCostLow)}\u2013${money(gradingCostHigh)}.`
            }
          </span>
          <br><span class="tech-value">Elevation: ${fmtInt(result.elevation?.min_ft)}\u2013${fmtInt(result.elevation?.max_ft)} ft (avg ${fmtInt(result.elevation?.avg_elevation_ft)} ft) &nbsp;|&nbsp; Earthwork: ${fmtInt(result.cut_fill?.cut_cy)} CY cut, ${fmtInt(result.cut_fill?.fill_cy)} CY fill (net ${fmtInt(result.cut_fill?.net_cy)} CY)</span>
        </p>
        <div class="check-next">
          <strong>What to check next:</strong> Get a topographic survey before final grading design. Confirm haul-off distance and disposal costs for excess material.
        </div>
      </div>

      <!-- 2. Flood & Water -->
      <div class="section">
        <div class="section-header">
          <h3>2. Flood &amp; Water</h3>
          ${severityChip(floodLevel)}
        </div>
        <p class="explain">
          <span class="means">${floodExplain}</span>
          <br><span class="tech-value">FEMA Zone: ${floodZone}${floodBFE ? ` &nbsp;|&nbsp; BFE: ${fmtInt(floodBFE)} ft` : ''}</span>
        </p>
        <div class="check-next">
          <strong>What to check next:</strong> ${floodLevel === 'HIGH'
            ? 'Request a flood determination letter from a certified surveyor. Contact FEMA to confirm zone boundaries. Get flood insurance quotes before closing.'
            : 'Verify drainage requirements with the local floodplain administrator. Confirm if a drainage report is required for your building permit.'
          }
        </div>
      </div>

      <!-- 3. Soil & Foundation -->
      <div class="section">
        <div class="section-header">
          <h3>3. Soil &amp; Foundation</h3>
          ${severityChip(soilLevel)}
        </div>
        <p class="explain">
          <span class="means">${soilExplain}</span>
          <br><span class="tech-value">Texture: ${result.soil?.texture_class || '\u2014'} &nbsp;|&nbsp; Shrink-swell: ${result.soil?.shrink_swell || '\u2014'} &nbsp;|&nbsp; USCS: ${result.soil?.uscs_estimate || '\u2014'} &nbsp;|&nbsp; Bearing: ${result.soil?.presumptive_bearing_psf ? result.soil.presumptive_bearing_psf + ' psf' : '\u2014'} &nbsp;|&nbsp; Foundation: <span style="text-transform:capitalize">${foundation}</span> (${codeRef})</span>
        </p>
        <div class="check-next">
          <strong>What to check next:</strong> Order a geotechnical investigation (soil boring + lab testing, typically $2,000\u20134,000 for residential). This is the single most important investigation before finalizing your foundation design.
        </div>
      </div>

      <!-- 4. Environmental Flags -->
      <div class="section">
        <div class="section-header">
          <h3>4. Environmental Flags</h3>
          ${severityChip(result.wetlands?.present || fireLevel === 'HIGH' ? 'HIGH' : (fireLevel === 'MODERATE' ? 'MODERATE' : 'LOW'))}
        </div>
        <p class="explain">
          ${envFlags.map(f => `<span class="means"><strong>${f.flag}:</strong> ${f.text}</span>`).join('<br><br>')}
        </p>
        <div class="check-next">
          <strong>What to check next:</strong> ${result.wetlands?.present
            ? 'Contact USACE for a jurisdictional determination. Hire a wetland delineation specialist before site planning.'
            : fireLevel === 'HIGH'
              ? 'Consult your local fire marshal for WUI (Wildland-Urban Interface) requirements. Get quotes for fire-resistant siding and roofing.'
              : 'Consider ordering a Phase I Environmental Site Assessment if commercial use is planned, or if the site has prior industrial history.'
          }
        </div>
      </div>
    </div>
  `

  // --- Page 3: Cost & What To Do Next ---
  const breakdown = result.costs?.breakdown || {}
  const projections = result.costs?.projections || {}

  // Site prep breakdown rows
  const siteBreakdownRows = Object.entries(breakdown).map(([k, v]) =>
    `<tr><td style="text-transform:capitalize">${k.replace(/_/g, ' ')}</td><td style="text-align:right">${money(v)}</td></tr>`
  ).join('')

  // House concept data (if available)
  const hasHouse = !!houseResult
  const bestLayout = hasHouse && Array.isArray(houseResult.layouts) && houseResult.layouts.length > 0
    ? houseResult.layouts.reduce((best, l) => (l.score >= (best.score || 0) ? l : best), houseResult.layouts[0])
    : null
  const houseCostLow = bestLayout?.cost?.range?.low ?? houseResult?.currentEstimate?.low
  const houseCostHigh = bestLayout?.cost?.range?.high ?? houseResult?.currentEstimate?.high
  const houseTotalSF = bestLayout?.totalSF ?? 0
  const housePerSF = houseTotalSF > 0 && houseCostLow ? Math.round(((houseCostLow + (houseCostHigh || houseCostLow)) / 2) / houseTotalSF) : null
  const houseQuality = (houseResult?.quality || 'mid').charAt(0).toUpperCase() + (houseResult?.quality || 'mid').slice(1)
  const houseFoundCost = bestLayout?.cost?.foundation ?? null
  const houseBuildCost = (houseCostLow && houseFoundCost) ? houseCostLow - houseFoundCost : houseCostLow

  // Build Now or Wait — projection with site prep + construction columns
  const inflationRate = 0.045
  const sitePrepNow = totalNow || 0
  const constructionNow = hasHouse && houseCostLow ? Math.round((houseCostLow + (houseCostHigh || houseCostLow)) / 2) : 0

  function inflated(base, years) { return Math.round(base * Math.pow(1 + inflationRate, years)) }
  function pctLabel(base, future) { return base ? `(+${(((future - base) / base) * 100).toFixed(1)}%)` : '' }

  const timingRows = [
    { label: 'Now', years: 0 },
    { label: 'In 2 years', years: 2 },
    { label: 'In 5 years', years: 5 },
  ].map(t => {
    const sp = inflated(sitePrepNow, t.years)
    const con = constructionNow ? inflated(constructionNow, t.years) : null
    const total = con ? sp + con : sp
    return `<tr>
      <td style="font-weight:600">${t.label}</td>
      <td style="text-align:right">${money(sp)} ${t.years > 0 ? `<span style="color:#94a3b8;font-size:10px;">${pctLabel(sitePrepNow, sp)}</span>` : ''}</td>
      ${constructionNow ? `<td style="text-align:right">${money(con)} ${t.years > 0 ? `<span style="color:#94a3b8;font-size:10px;">${pctLabel(constructionNow, con)}</span>` : ''}</td>` : ''}
      <td style="text-align:right;font-weight:600">${money(total)} ${t.years > 0 ? `<span style="color:#94a3b8;font-size:10px;">${pctLabel(sitePrepNow + constructionNow, total)}</span>` : ''}</td>
    </tr>`
  }).join('')

  const waitDiff5 = inflated(sitePrepNow + constructionNow, 5) - (sitePrepNow + constructionNow)
  const waitConclusion = waitDiff5 > 0
    ? `Construction costs are rising approximately 4.5% per year. Waiting 5 years adds roughly <strong>${money(waitDiff5)}</strong> to your total project cost. Building sooner is likely more cost-effective.`
    : 'Market conditions are relatively stable. You have some flexibility in timing.'

  // Context-aware next steps — only show what the analysis found relevant
  const nextSteps = []
  nextSteps.push({ step: 'Order a geotechnical investigation (soil boring)', who: 'Contact: local geotechnical engineering firm' })
  nextSteps.push({ step: 'Get a topographic survey', who: 'Contact: licensed land surveyor' })
  if (result.flood?.risk_level === 'HIGH') {
    nextSteps.push({ step: 'Verify flood zone designation with a certified surveyor', who: 'Contact: licensed surveyor + local floodplain administrator' })
  }
  nextSteps.push({ step: 'Check utility availability with local provider', who: 'Contact: city/county utilities department' })
  nextSteps.push({ step: 'Consult a licensed architect for concept development', who: 'Contact: AIA local chapter' })
  if (result.soil?.shrink_swell === 'High' || result.soil?.expansive_risk === 'High' || result.slope?.avg_slope_pct > 8) {
    nextSteps.push({ step: 'Engage a structural engineer for foundation design', who: 'Contact: local PE firm' })
  }

  const nextStepsHTML = nextSteps.map((s, i) =>
    `<tr><td style="text-align:center;font-weight:700;color:#0369a1;width:28px;">${i + 1}</td><td><strong>${s.step}</strong><br><span style="font-size:10px;color:#64748b;">${s.who}</span></td></tr>`
  ).join('')

  const page3 = `
    <div class="page page-break">
      <h2>Cost &amp; What To Do Next</h2>

      <div class="section">
        <h3>What Will This Cost?</h3>
        <div class="grid2">
          <div class="card">
            <div class="card-title">Site Preparation</div>
            <table style="margin-bottom:0;">
              <tbody>
                ${siteBreakdownRows}
                <tr style="font-weight:700;background:#f1f5f9"><td>Total Site Prep</td><td style="text-align:right">${money(totalNow)}</td></tr>
              </tbody>
            </table>
            <p style="font-size:10px;color:#94a3b8;margin-top:6px;">This covers preparing the land only, not building the house.</p>
          </div>
          ${hasHouse ? `
          <div class="card">
            <div class="card-title">Total Construction</div>
            <table style="margin-bottom:0;">
              <tbody>
                ${houseBuildCost ? `<tr><td>Building cost</td><td style="text-align:right">${money(houseBuildCost)}</td></tr>` : ''}
                ${houseFoundCost ? `<tr><td>Foundation cost</td><td style="text-align:right">${money(houseFoundCost)}</td></tr>` : ''}
                <tr style="font-weight:700;background:#f1f5f9"><td>Total Construction</td><td style="text-align:right">${money(houseCostLow)}${houseCostHigh && houseCostHigh !== houseCostLow ? ' &ndash; ' + money(houseCostHigh) : ''}</td></tr>
                ${housePerSF ? `<tr><td>Rate</td><td style="text-align:right">$${housePerSF}/SF</td></tr>` : ''}
              </tbody>
            </table>
            <p style="font-size:10px;color:#94a3b8;margin-top:6px;">Based on ${houseQuality} tier at ${houseResult?.location?.query || address || 'this location'} regional rates.</p>
          </div>
          ` : `
          <div class="card" style="display:flex;align-items:center;justify-content:center;text-align:center;">
            <div>
              <div style="font-size:28px;margin-bottom:8px;">&#127968;</div>
              <p style="font-size:12px;color:#64748b;">Run the <strong>House Concept</strong> tab<br>for building cost estimates.</p>
            </div>
          </div>
          `}
        </div>
      </div>

      <div class="section">
        <h3>Build Now or Wait?</h3>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th style="text-align:right">Site Prep</th>
              ${constructionNow ? '<th style="text-align:right">Construction</th>' : ''}
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${timingRows}</tbody>
        </table>
        <p class="explain" style="margin-top:8px;">${waitConclusion}</p>
      </div>

      <div class="section">
        <h3>Your Next Steps</h3>
        <table style="border:none;">
          <tbody>${nextStepsHTML}</tbody>
        </table>
      </div>

      <div class="disclaimer-box" style="font-size:10px;padding:10px 14px;">
        <strong>Important Limitations.</strong> This report is for early planning only. It is not a permit application,
        engineering design, or legal determination. All cost estimates are approximate ROM figures subject to
        site-specific conditions, market fluctuations, and jurisdictional requirements. Verify all findings with
        licensed professionals before making decisions.
      </div>
    </div>
  `

  // --- Page 4: Technical Appendix ---
  const page4 = buildAppendixHTML(result, codeRef)

  // ── Page 5: House Concept (if available) ──
  // Show only Standard layout (matching the UI)
  const stdLayout = houseResult?.layouts?.find(l => l.score === 85) || houseResult?.layouts?.[1] || houseResult?.layouts?.[0]
  const page5 = !houseResult || !stdLayout ? '' : (() => {
    const costLow = stdLayout.cost?.range?.low ?? 0
    const costHigh = stdLayout.cost?.range?.high ?? 0
    const costPerSF = stdLayout.cost?.costPerSF ?? 0
    const totalSF = stdLayout.totalSF || 0
    const rooms = Array.isArray(stdLayout.rooms) ? stdLayout.rooms.map(r => r.name || r).join(', ') : ''
    const qualLabel = (houseResult.quality || 'mid').charAt(0).toUpperCase() + (houseResult.quality || 'mid').slice(1)
    const fndLabel = (houseResult.foundationType || 'CONVENTIONAL_SLAB').replace(/_/g, ' ')

    return `
    <div class="page">
      <div class="header"><h1>House Concept Estimate</h1><span>${now}</span></div>

      <div class="card" style="margin-bottom:20px;border-color:#02C39A;">
        <h2 style="margin:0 0 8px 0;font-size:18px;">Standard Layout — ${fmtInt(totalSF)} SF</h2>
        <p style="font-size:28px;font-weight:800;color:#02C39A;margin:4px 0;">${money(costLow)} – ${money(costHigh)}</p>
        <p style="font-size:13px;color:#94a3b8;">Total Construction Cost (building + foundation) · $${costPerSF}/SF</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
          <div>
            <p style="font-size:11px;color:#64748b;margin-bottom:2px;">Quality Tier</p>
            <p style="font-size:14px;font-weight:600;color:#e2e8f0;">${qualLabel}</p>
          </div>
          <div>
            <p style="font-size:11px;color:#64748b;margin-bottom:2px;">Structural System</p>
            <p style="font-size:14px;font-weight:600;color:#e2e8f0;">${stdLayout.structuralSystem || 'Wood frame'}</p>
          </div>
          <div>
            <p style="font-size:11px;color:#64748b;margin-bottom:2px;">Foundation</p>
            <p style="font-size:14px;font-weight:600;color:#e2e8f0;">${fndLabel}</p>
          </div>
          <div>
            <p style="font-size:11px;color:#64748b;margin-bottom:2px;">Location</p>
            <p style="font-size:14px;font-weight:600;color:#e2e8f0;">${houseResult.location?.query || address}</p>
          </div>
        </div>
      </div>

      <h2>Room Program</h2>
      <p style="font-size:13px;color:#cbd5e1;margin-bottom:16px;">${rooms}</p>

      ${(houseResult.structuralNotes || []).length > 0 ? `
        <h2>Structural Notes</h2>
        <ul style="font-size:13px;color:#cbd5e1;padding-left:18px;margin-bottom:16px;">
          ${houseResult.structuralNotes.map(n => `<li style="margin-bottom:4px;">${n}</li>`).join('')}
        </ul>
      ` : ''}

      ${houseResult.aiSummary ? `
        <h2>AI Summary</h2>
        <div class="card" style="white-space:pre-wrap;font-size:13px;color:#cbd5e1;line-height:1.6;">${houseResult.aiSummary}</div>
      ` : ''}

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 14px;margin-top:16px;">
        <p style="font-size:12px;color:#1e40af;margin:0;">This estimate includes building construction, materials, labor, and foundation. Site preparation costs (earthwork, grading, utilities) are shown on the Cost page.</p>
      </div>

      <div class="disclaimer">This is a preliminary concept estimate only. Actual costs require a licensed contractor bid and site-specific engineering.</div>
    </div>
  `})()


  // ── Page 6: Price Forecast (if available) ──
  // Plain-English indicator explanations for the PDF
  function explainIndicator(key, ind) {
    const rate = ind.rate, val = ind.value
    if (key === 'constructionInflation') {
      return rate > 0.04
        ? `Building materials and labor are rising ${(rate*100).toFixed(1)}% per year — faster than general inflation. Lumber, concrete, and steel prices are the main drivers. Waiting to build will likely cost more.`
        : `Construction costs are rising at ${(rate*100).toFixed(1)}% per year — roughly in line with historical averages.`
    }
    if (key === 'localCostFactor') {
      return val > 1.05
        ? `Building in your area costs about ${Math.round((val-1)*100)}% more than the national average due to local labor demand and cost of living.`
        : val < 0.95
          ? `Building in your area costs about ${Math.round((1-val)*100)}% less than the national average — a relative cost advantage.`
          : `Building costs in your area are close to the national average.`
    }
    if (key === 'housingMarketTrend') {
      return rate > 0.05
        ? `Home values in your state are appreciating ${(rate*100).toFixed(1)}% per year — a strong market. Building now locks in today's construction cost while property values rise.`
        : rate > 0.03
          ? `Home values are growing ${(rate*100).toFixed(1)}% per year — moderate, healthy appreciation.`
          : `Home values are growing slowly at ${(rate*100).toFixed(1)}% per year.`
    }
    if (key === 'macroInflation') {
      return `The Federal Reserve's preferred inflation measure is at ${(rate*100).toFixed(1)}%. This sets the baseline for how fast all prices — including construction — are rising across the economy.`
    }
    if (key === 'supplyConditions') {
      const mr = ind.mortgage_rate || 6.85, temp = ind.market_temp || 'balanced'
      return mr > 7
        ? `Mortgage rates are high (${mr}%) which is cooling demand. The market is ${temp}. Higher rates also affect construction loan costs.`
        : `Mortgage rates are at ${mr}% — ${mr > 6 ? 'elevated but stabilizing' : 'relatively favorable'}. The market is ${temp}.`
    }
    return ''
  }
  const INDICATOR_TITLES = {
    constructionInflation: 'Construction Material & Labor Costs',
    localCostFactor: 'Your Local Cost Level',
    housingMarketTrend: 'Local Housing Market Trend',
    macroInflation: 'Overall Economy (Inflation)',
    supplyConditions: 'Housing Supply & Mortgage Rates',
  }

  const fc = forecastResult
  const yr5 = fc?.forecasts?.find(f => f.year === 5)
  const waitDiff = yr5 ? yr5.expected - (fc.currentEstimate?.expected || 0) : 0

  const page6 = !forecastResult ? '' : `
    <div class="page">
      <div class="header"><h1>Should You Build Now or Wait?</h1><span>${now}</span></div>
      <p style="color:#64748b;margin-bottom:16px;">This forecast uses official government economic data to help you understand how construction costs may change over time.</p>

      <div class="card" style="text-align:center;margin-bottom:20px;border-color:#02C39A;">
        <p style="color:#94a3b8;font-size:13px;">If you build today, your estimated construction cost is</p>
        <p style="font-size:36px;font-weight:800;color:#02C39A;margin:8px 0;">${money(fc.currentEstimate?.expected)}</p>
        <p style="color:#94a3b8;font-size:14px;">Range: ${money(fc.currentEstimate?.low)} — ${money(fc.currentEstimate?.high)} · $${fc.currentEstimate?.perSF || '—'}/SF</p>
      </div>

      <h2>What Happens If You Wait</h2>
      <p style="font-size:13px;color:#334155;margin-bottom:12px;">Construction costs don't stay the same. Materials, labor, and market conditions change every year. Here's what your project could cost if you delay:</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px;">
        <thead><tr style="border-bottom:2px solid #e2e8f0;color:#64748b;">
          <th style="text-align:left;padding:10px 8px;">When</th>
          <th style="text-align:right;padding:10px 8px;">Expected Cost</th>
          <th style="text-align:right;padding:10px 8px;">Extra You'd Pay</th>
        </tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #f1f5f9;background:#f0fdf4;">
            <td style="padding:10px 8px;font-weight:700;color:#166534;">Build Now</td>
            <td style="text-align:right;padding:10px 8px;font-weight:700;color:#166534;">${money(fc.currentEstimate?.expected)}</td>
            <td style="text-align:right;padding:10px 8px;color:#166534;">—</td>
          </tr>
          ${(fc.forecasts || []).map(f => {
            const extra = f.expected - (fc.currentEstimate?.expected || 0)
            return `<tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 8px;font-weight:600;">Wait ${f.year} year${f.year > 1 ? 's' : ''}</td>
              <td style="text-align:right;padding:10px 8px;">${money(f.expected)}</td>
              <td style="text-align:right;padding:10px 8px;color:#dc2626;font-weight:600;">+${money(extra)}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
      <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:12px 16px;margin-bottom:20px;">
        <p style="font-size:13px;color:#92400e;margin:0;font-weight:600;">${waitDiff > 0
          ? `Waiting 5 years could add approximately ${money(waitDiff)} to your construction cost. Building sooner is likely more cost-effective.`
          : `Market conditions are relatively stable. You have some flexibility in timing.`
        }</p>
      </div>

      <h2>Why Costs Change — Plain-English Breakdown</h2>
      <p style="font-size:12px;color:#64748b;margin-bottom:12px;">These are the economic factors affecting your project cost. Each comes from official U.S. government data.</p>
      ${forecastResult.indicators ? Object.entries(forecastResult.indicators).map(([k, ind]) => `
        <div class="card" style="padding:12px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <strong style="font-size:14px;color:#1e293b;">${INDICATOR_TITLES[k] || k}</strong>
            <span style="font-size:14px;font-weight:700;color:#02C39A;">
              ${ind.rate != null ? (ind.rate * 100).toFixed(1) + '%' : ''}
              ${ind.value != null ? ind.value.toFixed(2) + 'x' : ''}
              ${ind.mortgage_rate != null ? ind.mortgage_rate + '%' : ''}
            </span>
          </div>
          <p style="font-size:12px;color:#475569;line-height:1.5;margin:0 0 4px 0;">${explainIndicator(k, ind)}</p>
          <p style="font-size:10px;color:#94a3b8;margin:0;">Source: ${ind.source}</p>
        </div>
      `).join('') : ''}
      ` : ''}

      ${forecastResult.sources ? `
        <h2 style="font-size:13px;">Government Data Sources</h2>
        <ul style="font-size:11px;color:#64748b;padding-left:18px;">
          ${forecastResult.sources.map(s => `<li>${s}</li>`).join('')}
        </ul>
        <p style="font-size:11px;color:#475569;font-style:italic;margin-top:8px;">${forecastResult.methodology || ''}</p>
      ` : ''}

      <div class="disclaimer">This forecast uses government economic indicators for concept-level decision support only. It is not a contractor bid, appraisal, or lender-grade estimate.</div>
    </div>
  `

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SiteSense Report${address ? ' — ' + address : ''}</title>
  <style>${css}</style>
</head>
<body>
  ${page1}
  ${page2}
  ${page3}
  ${page5}
  ${page6}
  ${page4}
</body>
</html>`
}

export function generateReport(result, address, polygon, houseResult, forecastResult) {
  const html = buildReportHTML(result, address, houseResult, forecastResult)
  const win = window.open('', '_blank')
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site and try again.')
    return
  }
  win.document.write(html)
  win.document.close()
}
