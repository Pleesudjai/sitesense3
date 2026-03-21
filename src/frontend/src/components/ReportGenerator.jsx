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

function buildReportHTML(result, address, houseResult, forecastResult) {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const verdict = getVerdict(result)
  const acres = fmt(result.elevation?.area_acres, 2)
  const foundation = result.foundation?.type?.replace(/_/g, ' ') || '—'
  const codeRef = result.foundation?.code_ref || 'ACI 360R-10'
  const totalNow = result.costs?.total_now
  const proj10 = result.costs?.projections?.['10yr'] ?? result.costs?.projections?.['10']

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
    h3 { font-size:13px; font-weight:700; color:#334155; margin-bottom:4px; }
    .meta { font-size:12px; color:#64748b; margin-bottom:16px; }
    .verdict { font-size:14px; margin:16px 0 24px; padding:12px 16px; border-radius:8px; background:#f8fafc; border-left:4px solid ${verdict.color}; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
    .card { border:1px solid #e2e8f0; border-radius:8px; padding:14px 16px; }
    .card-title { font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:6px; }
    .badge { display:inline-block; padding:3px 12px; border-radius:12px; font-weight:700; font-size:13px; color:#fff; }
    table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:16px; }
    th { background:#f1f5f9; text-align:left; padding:6px 10px; font-weight:600; border:1px solid #e2e8f0; }
    td { padding:6px 10px; border:1px solid #e2e8f0; }
    .section { margin-bottom:20px; }
    .section-header { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
    .explain { font-size:12px; color:#475569; line-height:1.6; }
    .next-steps { font-size:11px; color:#0369a1; margin-top:4px; }
    .disclaimer { font-size:10px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:10px; margin-top:24px; }
    .disclaimer-box { border:1px solid #fbbf24; background:#fffbeb; padding:12px 16px; border-radius:8px; font-size:11px; color:#92400e; margin-top:16px; }
    ul { padding-left:18px; font-size:12px; color:#475569; line-height:1.8; }
    @media print {
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .page { padding:36px 40px; }
      .header-bar { position:static; }
    }
  `

  // --- Page 1: Executive Summary ---
  const page1 = `
    <div class="header-bar">
      <div>
        <h1>Site<span class="accent">Sense</span></h1>
        <div class="subtitle">AI-Powered Land Feasibility Tool</div>
      </div>
      <div style="font-size:11px;color:#94a3b8;">Report generated ${now}</div>
    </div>
    <div class="page page-break">
      <h2>Executive Summary</h2>
      <div class="meta">
        ${address ? `<strong>Address:</strong> ${address}<br>` : ''}
        <strong>Parcel Size:</strong> ${acres} acres &nbsp;|&nbsp;
        <strong>Date:</strong> ${now}
      </div>
      <div class="verdict">
        This site appears <strong style="color:${verdict.color}">${verdict.text}</strong>.
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">Overall Feasibility</div>
          <span class="badge" style="background:${verdict.color}">${verdict.level}</span>
        </div>
        <div class="card">
          <div class="card-title">Top Risks</div>
          <ul style="margin:0">${topRisks(result).map(r => `<li>${r}</li>`).join('')}</ul>
        </div>
        <div class="card">
          <div class="card-title">Foundation Direction</div>
          <div style="font-size:14px;font-weight:600;text-transform:capitalize;">${foundation}</div>
          <div style="font-size:11px;color:#64748b;">${codeRef}</div>
        </div>
        <div class="card">
          <div class="card-title">Cost Snapshot</div>
          <div style="font-size:14px;font-weight:600;">${money(totalNow)}</div>
          <div style="font-size:11px;color:#64748b;">10-yr projection: ${money(proj10)}</div>
        </div>
      </div>
      <div class="disclaimer">
        This report is generated by SiteSense for preliminary planning purposes only.
        All findings must be verified by licensed professionals before any design or construction decisions.
      </div>
    </div>
  `

  // --- Page 2: Buildability & Constraints ---
  const slopeLevel = riskLevel(result, 'slope')
  const floodLevel = riskLevel(result, 'flood')
  const soilLevel = riskLevel(result, 'soil')
  const fireLevel = riskLevel(result, 'fire')

  const page2 = `
    <div class="page page-break">
      <h2>Buildability &amp; Constraints</h2>

      <div class="section">
        <div class="section-header"><h3>Terrain &amp; Grading</h3>${severityChip(slopeLevel)}</div>
        <p class="explain">
          Average slope is ${fmt(result.slope?.avg_slope_pct)}% with a maximum of ${fmt(result.slope?.max_slope_pct)}%.
          Elevation ranges from ${fmtInt(result.elevation?.min_ft)} ft to ${fmtInt(result.elevation?.max_ft)} ft
          (average ${fmtInt(result.elevation?.avg_elevation_ft)} ft).
          Estimated earthwork: ${fmtInt(result.cut_fill?.cut_cy)} CY cut, ${fmtInt(result.cut_fill?.fill_cy)} CY fill
          (net ${fmtInt(result.cut_fill?.net_cy)} CY).
        </p>
        <p class="next-steps">Check next: site grading plan, haul-off distance for excess material.</p>
      </div>

      <div class="section">
        <div class="section-header"><h3>Flood &amp; Water</h3>${severityChip(floodLevel)}</div>
        <p class="explain">
          FEMA flood zone: <strong>${result.flood?.zone || '—'}</strong>.
          ${result.flood?.risk_level === 'HIGH' ? 'This parcel falls within a Special Flood Hazard Area. Flood insurance and elevated foundations may be required.' : 'No special flood hazard area designation. Standard drainage design applies.'}
        </p>
        <p class="next-steps">Check next: local floodplain administrator, drainage report requirements.</p>
      </div>

      <div class="section">
        <div class="section-header"><h3>Soil &amp; Foundation</h3>${severityChip(soilLevel)}</div>
        <p class="explain">
          Soil texture: ${result.soil?.texture_class || '—'}.
          Shrink-swell potential: ${result.soil?.shrink_swell || '—'}.
          ${result.soil?.caliche ? 'Caliche hardpan detected — may require grade beams and specialized excavation.' : ''}
          USCS estimate: ${result.soil?.uscs_estimate || '—'}.
          Presumptive bearing: ${result.soil?.presumptive_bearing_psf ? result.soil.presumptive_bearing_psf + ' psf' : '—'}.
          Recommended foundation: <strong style="text-transform:capitalize">${foundation}</strong> (${codeRef}).
        </p>
        <p class="next-steps">Check next: geotechnical investigation, soil borings.</p>
      </div>

      <div class="section">
        <div class="section-header"><h3>Environmental Flags</h3>${severityChip(fireLevel)}</div>
        <p class="explain">
          Wetlands: ${result.wetlands?.present ? 'Present — USACE Section 404 permit likely required.' : 'None identified.'}<br>
          Fire risk: ${result.fire?.risk_class || 'Low'}.<br>
          ${result.loads?.wind_mph ? `Design wind speed: ${result.loads.wind_mph} mph.` : ''}
          ${result.loads?.seismic_sdc ? `Seismic Design Category: ${result.loads.seismic_sdc}.` : ''}
          ${result.loads?.snow_psf ? `Ground snow load: ${result.loads.snow_psf} psf.` : ''}
        </p>
        <p class="next-steps">Check next: Phase I ESA, biological survey if near sensitive habitat.</p>
      </div>
    </div>
  `

  // --- Page 3: Cost & Decision Support ---
  const breakdown = result.costs?.breakdown || {}
  const projections = result.costs?.projections || {}

  const breakdownRows = Object.entries(breakdown).map(([k, v]) =>
    `<tr><td style="text-transform:capitalize">${k.replace(/_/g, ' ')}</td><td style="text-align:right">${money(v)}</td></tr>`
  ).join('')

  const projRows = Object.entries(projections).map(([k, v]) => {
    const pctChange = totalNow ? (((v - totalNow) / totalNow) * 100).toFixed(1) : '—'
    return `<tr><td>${k}</td><td style="text-align:right">${money(v)}</td><td style="text-align:right">${totalNow ? (pctChange > 0 ? '+' : '') + pctChange + '%' : '—'}</td></tr>`
  }).join('')

  const waitCost5yr = projections['5yr'] || projections['5']
  const waitDiff = (waitCost5yr && totalNow) ? money(waitCost5yr - totalNow) : '$X'

  const page3 = `
    <div class="page page-break">
      <h2>Cost &amp; Decision Support</h2>

      <div class="section">
        <h3>Estimated Site Prep Cost</h3>
        <table>
          <thead><tr><th>Item</th><th style="text-align:right">Estimate</th></tr></thead>
          <tbody>
            ${breakdownRows}
            <tr style="font-weight:700;background:#f1f5f9"><td>Total</td><td style="text-align:right">${money(totalNow)}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Future Cost Outlook</h3>
        <table>
          <thead><tr><th>Period</th><th style="text-align:right">Projected Cost</th><th style="text-align:right">Change</th></tr></thead>
          <tbody>${projRows}</tbody>
        </table>
      </div>

      <div class="section">
        <h3>Build Now vs. Wait</h3>
        <p class="explain">
          Construction costs are rising at approximately 4.5% per year (ENR CCI).
          Waiting 5 years adds roughly <strong>${waitDiff}</strong> to site preparation costs.
          Early action locks in today's pricing and avoids compounding escalation.
        </p>
      </div>

      <div class="section">
        <h3>Recommended Next Steps</h3>
        <ul>
          <li>Commission a geotechnical investigation (soil borings + lab testing)</li>
          <li>Obtain a boundary and topographic survey from a licensed surveyor</li>
          <li>Verify zoning entitlements and setback requirements with the local jurisdiction</li>
          <li>Request a Phase I Environmental Site Assessment if commercial use is planned</li>
          <li>Engage a licensed civil engineer for grading and drainage design</li>
        </ul>
      </div>

      <div class="disclaimer-box">
        <strong>Professional Review Required.</strong> This report is an automated preliminary assessment
        based on publicly available GIS data. It does not replace site-specific investigations by licensed
        geotechnical, structural, or civil engineers. All cost estimates are approximate ROM (Rough Order of
        Magnitude) figures subject to change based on site-specific conditions, market fluctuations, and
        jurisdictional requirements.
      </div>
    </div>
  `

  // --- Page 4: Technical Appendix ---
  const page4 = `
    <div class="page">
      <h2>Technical Appendix</h2>

      <div class="section">
        <h3>Raw Site Metrics</h3>
        <table>
          <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>Avg Elevation</td><td>${fmtInt(result.elevation?.avg_elevation_ft)} ft</td></tr>
            <tr><td>Min / Max Elevation</td><td>${fmtInt(result.elevation?.min_ft)} / ${fmtInt(result.elevation?.max_ft)} ft</td></tr>
            <tr><td>Avg Slope</td><td>${fmt(result.slope?.avg_slope_pct)}%</td></tr>
            <tr><td>Max Slope</td><td>${fmt(result.slope?.max_slope_pct)}%</td></tr>
            <tr><td>Parcel Area</td><td>${fmt(result.elevation?.area_acres, 2)} acres</td></tr>
            <tr><td>Flood Zone</td><td>${result.flood?.zone || '—'}</td></tr>
            <tr><td>Soil Texture</td><td>${result.soil?.texture_class || '—'}</td></tr>
            <tr><td>Shrink-Swell</td><td>${result.soil?.shrink_swell || '—'}</td></tr>
            <tr><td>USCS Estimate</td><td>${result.soil?.uscs_estimate || '—'}</td></tr>
            <tr><td>Presumptive Bearing</td><td>${result.soil?.presumptive_bearing_psf ? result.soil.presumptive_bearing_psf + ' psf' : '—'}</td></tr>
            <tr><td>Caliche</td><td>${result.soil?.caliche ? 'Detected' : 'Not detected'}</td></tr>
            <tr><td>Seismic S<sub>DS</sub></td><td>${fmt(result.seismic?.sds, 3)}</td></tr>
            <tr><td>Seismic S<sub>D1</sub></td><td>${fmt(result.seismic?.sd1, 3)}</td></tr>
            <tr><td>Seismic SDC</td><td>${result.loads?.seismic_sdc || '—'}</td></tr>
            <tr><td>Wind Speed</td><td>${result.loads?.wind_mph ? result.loads.wind_mph + ' mph' : '—'}</td></tr>
            <tr><td>Snow Load</td><td>${result.loads?.snow_psf ? result.loads.snow_psf + ' psf' : '—'}</td></tr>
            <tr><td>Fire Risk</td><td>${result.fire?.risk_class || '—'}</td></tr>
            <tr><td>Wetlands</td><td>${result.wetlands?.present ? 'Present' : 'None'}</td></tr>
            <tr><td>Cut Volume</td><td>${fmtInt(result.cut_fill?.cut_cy)} CY</td></tr>
            <tr><td>Fill Volume</td><td>${fmtInt(result.cut_fill?.fill_cy)} CY</td></tr>
            <tr><td>Net Earthwork</td><td>${fmtInt(result.cut_fill?.net_cy)} CY</td></tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Code References</h3>
        <ul>
          <li><strong>ACI 350-20 / 350R-20</strong> — Environmental engineering concrete structures</li>
          <li><strong>ACI 360R-10</strong> — Slab-on-ground design and construction</li>
          <li><strong>ASCE 7-22</strong> — Minimum design loads (wind Ch.26-27, seismic Ch.12, flood Ch.5, snow Ch.7)</li>
          <li><strong>IBC 2021</strong> — Soils &sect;1803, Flood &sect;1612</li>
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

  // ── Page 5: House Concept (if available) ──
  const page5 = !houseResult ? '' : `
    <div class="page">
      <div class="header"><h1>House Concept Estimate</h1><span>${now}</span></div>
      <p style="color:#94a3b8;margin-bottom:16px;">Location: ${houseResult.location?.query || address} · Quality: ${(houseResult.quality || 'mid').charAt(0).toUpperCase() + (houseResult.quality || 'mid').slice(1)} · Foundation: ${(houseResult.foundationType || 'CONVENTIONAL_SLAB').replace(/_/g, ' ')}</p>

      <h2>Layout Options</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
        ${(houseResult.layouts || []).map(l => {
          const isBest = (houseResult.layouts || []).every(o => l.score >= o.score)
          const costLow = l.cost?.range?.low ?? 0
          const costHigh = l.cost?.range?.high ?? 0
          const rooms = Array.isArray(l.rooms) ? l.rooms.map(r => r.name || r).join(', ') : ''
          return `<div class="card" style="${isBest ? 'border-color:#02C39A;' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>${l.name}</strong>
              ${isBest ? '<span style="background:#02C39A22;color:#02C39A;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;">Recommended</span>' : ''}
            </div>
            <p style="font-size:18px;font-weight:700;color:#02C39A;margin:6px 0;">${money(costLow)} – ${money(costHigh)}</p>
            <p style="font-size:12px;color:#94a3b8;">${fmtInt(l.totalSF || 0)} SF · ${l.structuralSystem || 'Wood frame'}</p>
            <p style="font-size:11px;color:#64748b;margin-top:4px;">${rooms}</p>
            <p style="font-size:11px;color:#94a3b8;margin-top:4px;">Score: <strong>${l.score}/100</strong></p>
          </div>`
        }).join('')}
      </div>

      ${(houseResult.structuralNotes || []).length > 0 ? `
        <h2>Structural Notes</h2>
        <ul style="font-size:13px;color:#cbd5e1;padding-left:18px;">
          ${houseResult.structuralNotes.map(n => `<li style="margin-bottom:4px;">${n}</li>`).join('')}
        </ul>
      ` : ''}

      ${houseResult.aiSummary ? `
        <h2>AI Summary</h2>
        <div class="card" style="white-space:pre-wrap;font-size:13px;color:#cbd5e1;line-height:1.6;">${houseResult.aiSummary}</div>
      ` : ''}

      <div class="disclaimer">This is a preliminary concept estimate only. Actual costs require a licensed contractor bid and site-specific engineering.</div>
    </div>
  `

  // ── Page 6: Price Forecast (if available) ──
  const page6 = !forecastResult ? '' : `
    <div class="page">
      <div class="header"><h1>Construction Cost Forecast</h1><span>${now}</span></div>
      <p style="color:#94a3b8;margin-bottom:16px;">Location: ${forecastResult.location?.query || address} · ${forecastResult.location?.state || 'US'}</p>

      <div class="card" style="text-align:center;margin-bottom:20px;">
        <p style="color:#94a3b8;font-size:12px;">Current Construction Cost Estimate</p>
        <p style="font-size:32px;font-weight:800;color:#02C39A;margin:8px 0;">${money(forecastResult.currentEstimate?.expected)}</p>
        <p style="color:#94a3b8;font-size:14px;">${money(forecastResult.currentEstimate?.low)} — ${money(forecastResult.currentEstimate?.high)}</p>
        <p style="color:#64748b;font-size:12px;margin-top:4px;">$${forecastResult.currentEstimate?.perSF || '—'}/SF</p>
      </div>

      <h2>Cost Forecast Timeline</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        <thead><tr style="border-bottom:2px solid #374151;color:#94a3b8;">
          <th style="text-align:left;padding:8px 4px;">Horizon</th>
          <th style="text-align:right;padding:8px 4px;">Low</th>
          <th style="text-align:right;padding:8px 4px;">Expected</th>
          <th style="text-align:right;padding:8px 4px;">High</th>
          <th style="text-align:right;padding:8px 4px;">Change</th>
        </tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #1f2937;">
            <td style="padding:6px 4px;font-weight:600;">Now</td>
            <td style="text-align:right;padding:6px 4px;color:#94a3b8;">${money(forecastResult.currentEstimate?.low)}</td>
            <td style="text-align:right;padding:6px 4px;color:#02C39A;font-weight:600;">${money(forecastResult.currentEstimate?.expected)}</td>
            <td style="text-align:right;padding:6px 4px;color:#94a3b8;">${money(forecastResult.currentEstimate?.high)}</td>
            <td style="text-align:right;padding:6px 4px;color:#64748b;">—</td>
          </tr>
          ${(forecastResult.forecasts || []).map(f => {
            const pctChange = ((f.expected / forecastResult.currentEstimate.expected - 1) * 100).toFixed(1)
            return `<tr style="border-bottom:1px solid #1f2937;">
              <td style="padding:6px 4px;font-weight:600;">Year ${f.year}</td>
              <td style="text-align:right;padding:6px 4px;color:#94a3b8;">${money(f.low)}</td>
              <td style="text-align:right;padding:6px 4px;color:#02C39A;font-weight:600;">${money(f.expected)}</td>
              <td style="text-align:right;padding:6px 4px;color:#94a3b8;">${money(f.high)}</td>
              <td style="text-align:right;padding:6px 4px;color:#f59e0b;">+${pctChange}%</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>

      ${forecastResult.indicators ? `
        <h2>What's Driving This Forecast</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
          ${Object.entries(forecastResult.indicators).map(([k, ind]) => `
            <div class="card" style="padding:10px;">
              <span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;background:#1e3a5f;color:#7dd3fc;">${ind.contribution}</span>
              <p style="font-size:14px;font-weight:600;margin:4px 0;">
                ${ind.rate != null ? (ind.rate * 100).toFixed(1) + '%' : ''}
                ${ind.value != null ? ind.value.toFixed(2) + 'x' : ''}
                ${ind.mortgage_rate != null ? ind.mortgage_rate + '% rate · ' + ind.market_temp : ''}
              </p>
              <p style="font-size:11px;color:#64748b;">${ind.source}</p>
            </div>
          `).join('')}
        </div>
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
