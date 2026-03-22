const fs = require('fs')
const vm = require('vm')

const base = 'https://fastidious-clafoutis-995943.netlify.app'
const d = 0.00045

const cases = [
  ['Seattle, WA', 47.6062, -122.3321],
  ['Portland, OR', 45.5152, -122.6784],
  ['San Francisco, CA', 37.7749, -122.4194],
  ['Los Angeles, CA', 34.0522, -118.2437],
  ['San Diego, CA', 32.7157, -117.1611],
  ['Phoenix, AZ', 33.4484, -112.0740],
  ['Salt Lake City, UT', 40.7608, -111.8910],
  ['Denver, CO', 39.7392, -104.9903],
  ['Dallas, TX', 32.7767, -96.7970],
  ['Austin, TX', 30.2672, -97.7431],
  ['Houston, TX', 29.7604, -95.3698],
  ['Kansas City, MO', 39.0997, -94.5786],
  ['Minneapolis, MN', 44.9778, -93.2650],
  ['Chicago, IL', 41.8781, -87.6298],
  ['Nashville, TN', 36.1627, -86.7816],
  ['Atlanta, GA', 33.7490, -84.3880],
  ['Miami, FL', 25.7617, -80.1918],
  ['Washington, DC', 38.9072, -77.0369],
  ['New York, NY', 40.7128, -74.0060],
  ['Boston, MA', 42.3601, -71.0589],
]

function loadReportBuilder() {
  let code = fs.readFileSync('src/frontend/src/components/ReportGenerator.jsx', 'utf8')
  code = code.replace('export function generateReport', 'function generateReport')
  code += '\nthis.__EXPORTS = { buildReportHTML, generateReport };'
  const context = { console, Date }
  vm.createContext(context)
  vm.runInContext(code, context)
  return context.__EXPORTS.buildReportHTML
}

async function postJson(path, body) {
  return fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function run() {
  const buildReportHTML = loadReportBuilder()
  const results = []

  for (const [name, lat, lon] of cases) {
    const polygon = {
      type: 'Polygon',
      coordinates: [[
        [lon - d, lat - d],
        [lon + d, lat - d],
        [lon + d, lat + d],
        [lon - d, lat + d],
        [lon - d, lat - d],
      ]],
    }

    const body = {
      polygon,
      address: name,
      building_type: 'single_family',
      floors: 1,
      budget: 'mid',
      priority: 'cost',
    }

    const rec = { name }

    try {
      const t0 = Date.now()
      const res = await postJson('/api/analyze', body)
      rec.analyze_status = res.status
      rec.analyze_ms = Date.now() - t0

      const payload = await res.json()
      rec.ok = payload.status === 'ok'
      rec.has_ai_report = !!payload?.data?.ai_report
      rec.has_report_text = !!payload?.data?.report_text
      rec.verdict = payload?.data?.ai_report?.verdict || null
      rec.confidence = payload?.data?.ai_report?.confidence_summary?.overall || null
      rec.buildable_sf = payload?.data?.buildable_sf ?? payload?.data?.summary?.buildable_sf ?? null
      rec.flood_zone = payload?.data?.flood?.zone ?? payload?.data?.summary?.flood_zone ?? null
      rec.avg_slope = payload?.data?.slope?.avg_slope_pct ?? payload?.data?.summary?.avg_slope_pct ?? null
      rec.top_risks = Array.isArray(payload?.data?.ai_report?.top_risks) ? payload.data.ai_report.top_risks.length : 0

      const html = buildReportHTML(payload.data, name, null, null)
      rec.html_length = html.length
      rec.html_has_undefined = html.includes('undefined')
      rec.html_has_NaN = html.includes('NaN')
      rec.html_has_blank_title = html.includes('<title>SiteSense Report</title>')

      const rep0 = Date.now()
      const rep = await postJson('/api/report', body)
      rec.report_status = rep.status
      rec.report_ms = Date.now() - rep0
      rec.report_content_type = rep.headers.get('content-type')
      rec.report_disposition = rep.headers.get('content-disposition')

      const buf = Buffer.from(await rep.arrayBuffer())
      rec.report_bytes = buf.length
      rec.report_pdf_signature = buf.slice(0, 4).toString('utf8')
    } catch (err) {
      rec.error = String(err && err.message ? err.message : err)
    }

    results.push(rec)
    console.log(JSON.stringify(rec))
  }

  const summary = {
    total: results.length,
    analyze_ok: results.filter(r => r.ok).length,
    analyze_fail: results.filter(r => !r.ok || r.error).length,
    missing_ai_report: results.filter(r => !r.has_ai_report).length,
    html_undefined: results.filter(r => r.html_has_undefined).length,
    html_nan: results.filter(r => r.html_has_NaN).length,
    non_pdf_reports: results.filter(r => (r.report_content_type || '').indexOf('application/pdf') === -1).length,
    report_txt_downloads: results.filter(r => (r.report_disposition || '').includes('SiteSense_Report.txt')).length,
    slow_analyze_over_20s: results.filter(r => (r.analyze_ms || 0) > 20000).length,
  }

  console.log('SUMMARY ' + JSON.stringify(summary))
}

run().catch(err => {
  console.error('FATAL', err)
  process.exit(1)
})
