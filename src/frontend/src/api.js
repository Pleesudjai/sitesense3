/**
 * API client for SiteSense backend.
 * Proxied through Vite dev server to http://localhost:8000
 */

// In dev: Vite proxies /api → localhost:8000
// In production (Netlify): VITE_API_URL points to Render backend URL
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Analyze a polygon parcel.
 * @param {Object} polygon - GeoJSON polygon geometry
 * @param {Object} prefs - user preferences { address, building_type, floors, budget }
 * @returns {Promise<Object>} full analysis result
 */
export async function analyzeParcel(polygon, prefs = {}) {
  const response = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      polygon,
      address: prefs.address || '',
      building_type: prefs.buildingType || 'single_family',
      floors: prefs.floors || 1,
      budget: prefs.budget || 'mid',
      priority: prefs.priority || 'cost',
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || `Analysis failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Download the PDF report for a parcel.
 * @param {Object} polygon - GeoJSON polygon geometry
 * @param {Object} prefs - same prefs as analyzeParcel
 */
export async function downloadReport(polygon, prefs = {}) {
  const response = await fetch(`${BASE_URL}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      polygon,
      address: prefs.address || '',
      building_type: prefs.buildingType || 'single_family',
      floors: prefs.floors || 1,
      budget: prefs.budget || 'mid',
    }),
  })

  if (!response.ok) throw new Error('Report generation failed')

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'SiteSense_Feasibility_Report.pdf'
  a.click()
  window.URL.revokeObjectURL(url)
}
