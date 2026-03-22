import { useState } from 'react'
import MapView from './components/MapView'
import RiskCards from './components/RiskCards'
import ElevationChart from './components/ElevationChart'
import CutFillVisual from './components/CutFillVisual'
import CostTable from './components/CostTable'
import HouseConceptPanel from './components/HouseConceptPanel'
import EngineeringAssistant from './components/EngineeringAssistant'
import PriceForecastPanel from './components/PriceForecastPanel'
import { generateReport } from './components/ReportGenerator'
import { analyzeParcel } from './api'

const TAB_LABELS = { site: 'Site Analysis', house: 'House Concept', forecast: 'Build Now or Wait?', engineering: 'Engineering Q&A' }

export default function App() {
  const [activeTab, setActiveTab] = useState('site')
  const [polygon, setPolygon] = useState(null)
  const [address, setAddress] = useState('')
  const [searchTrigger, setSearchTrigger] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [prefs, setPrefs] = useState({
    buildingType: 'single_family',
    floors: 1,
    budget: 'mid',
  })
  const [searchError, setSearchError] = useState(null)
  const [houseResult, setHouseResult] = useState(null)
  const [forecastResult, setForecastResult] = useState(null)

  // Use the search address text as location for all tabs
  // Falls back to polygon centroid coordinates if no address typed
  const parcelLocation = address.trim()
    || (polygon?.coordinates?.[0]
      ? (() => {
          const pts = polygon.coordinates[0]
          const lat = pts.reduce((s, p) => s + p[1], 0) / pts.length
          const lon = pts.reduce((s, p) => s + p[0], 0) / pts.length
          return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
        })()
      : '')
  const parcelReady = !!polygon

  const handleSearch = () => {
    if (address.trim()) {
      setSearchError(null)
      setSearchTrigger(t => t + 1)
    }
  }

  const handleSearchError = (msg) => {
    setSearchError(msg)
    setTimeout(() => setSearchError(null), 4000)
  }

  const handlePolygonChange = (newPolygon) => {
    setPolygon(newPolygon)
    // Clear stale results when user redraws
    setResult(null)
    setHouseResult(null)
    setForecastResult(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!polygon) return
    setLoading(true)
    setError(null)
    try {
      const res = await analyzeParcel(polygon, { ...prefs, address })
      setResult(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-3 bg-navy border-b border-teal/30 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">SiteSense</h1>
          <p className="text-xs text-teal">AI Land Feasibility Tool · HackASU 2025</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <input
              className="bg-gray-800 border border-gray-600 rounded-l px-3 py-1.5 text-sm w-64
                         focus:outline-none focus:border-teal placeholder-gray-500"
              placeholder="Search address…"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-gray-700 hover:bg-gray-600 border border-gray-600 border-l-0 rounded-r
                         px-3 py-1.5 text-sm transition-colors"
              title="Search address"
            >
              🔍
            </button>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!polygon || loading}
            className="px-5 py-1.5 rounded font-semibold text-sm transition-all
                       bg-teal hover:bg-teal/80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="spinner w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60 20" />
                </svg>
                Analyzing…
              </span>
            ) : 'Analyze Parcel'}
          </button>
          <button
            onClick={() => generateReport(result, address, polygon, houseResult, forecastResult)}
            disabled={!result}
            className="px-4 py-1.5 rounded font-semibold text-sm transition-all
                       bg-navy border border-teal hover:bg-teal/20 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Generate PDF report from all completed analyses"
          >
            PDF Report
          </button>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div className="flex gap-0 bg-gray-900 border-b border-gray-700 px-6 shrink-0">
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'text-teal border-b-2 border-teal'
                : 'text-gray-400 hover:text-white'
            }`}
          >{label}</button>
        ))}
      </div>

      {/* ── Site Analysis tab ── */}
      <div className={`flex flex-1 overflow-hidden ${activeTab !== 'site' ? 'hidden' : ''}`}>
        {/* Map — left 60% */}
        <div className="w-3/5 relative">
          <MapView
            onPolygonChange={handlePolygonChange}
            onSearchError={handleSearchError}
            result={result}
            searchAddress={address}
            searchTrigger={searchTrigger}
          />



          {/* Address not found toast */}
          {searchError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-50">
              <div className="bg-red-900/90 border border-red-500 text-white text-sm px-5 py-2.5 rounded-lg shadow-xl">
                ⚠️ {searchError}
              </div>
            </div>
          )}
        </div>

        {/* Dashboard — right 40% */}
        <div className="w-2/5 flex flex-col overflow-y-auto bg-gray-900 border-l border-gray-700">
          {error && (
            <div className="m-4 p-3 bg-red-900/50 border border-red-700 rounded text-sm text-red-300">
              ⚠️ {error}
            </div>
          )}

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm gap-3 p-8">
              <div className="text-5xl">🗺️</div>
              <p className="text-center">
                Draw your parcel on the map and click <b className="text-white">Analyze Parcel</b> to get
                a full civil engineering feasibility study.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <svg className="spinner w-10 h-10 text-teal" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60 20" />
              </svg>
              <p className="text-gray-400 text-sm">Pulling elevation, flood, soil & seismic data…</p>
            </div>
          )}

          {result && !loading && (
            <div className="p-4 space-y-4">
              {/* Site summary */}
              <div className="bg-navy/40 border border-navy/60 rounded-lg p-4">
                <h2 className="font-bold text-sm text-teal mb-2">Site Summary</h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Area" value={`${result.elevation?.area_acres?.toFixed(2)} ac`} />
                  <Stat label="Elevation" value={`${result.elevation?.avg_elevation_ft?.toFixed(0)} ft`} />
                  <Stat label="Avg Slope" value={`${result.slope?.avg_slope_pct?.toFixed(1)}%`} />
                  <Stat label="Max Slope" value={`${result.slope?.max_slope_pct?.toFixed(1)}%`} />
                  <Stat label="Foundation" value={result.foundation?.type?.replace(/_/g, ' ')} />
                  <Stat label="Buildable" value={`${(result.buildable_sf || 0).toLocaleString()} SF`} />
                </div>
              </div>

              <RiskCards data={result} />
              <ElevationChart grid={result.elevation?.grid} bbox={result.elevation?.bbox} polygon={polygon} soilZones={result.soil_zones} />
              <CutFillVisual cutFill={result.cut_fill} />
              <CostTable costs={result.costs} />

              {/* AI Brain Report */}
              {(result.ai_report || result.report_text) && (
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <h2 className="font-bold text-sm text-teal mb-2">AI Feasibility Analysis</h2>

                  {result.ai_report ? (
                    <>
                      {/* Verdict */}
                      <div className={`rounded-lg p-3 border-l-4 ${
                        result.ai_report.verdict === 'Good Candidate' ? 'bg-green-950/30 border-green-500' :
                        result.ai_report.verdict === 'High Risk' ? 'bg-red-950/30 border-red-500' :
                        'bg-amber-950/30 border-amber-500'
                      }`}>
                        <p className="text-sm font-bold text-white">{result.ai_report.verdict}</p>
                        <p className="text-xs text-gray-300 mt-1">{result.ai_report.verdict_reason}</p>
                      </div>

                      {/* Tradeoffs */}
                      {result.ai_report.tradeoffs?.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-amber-400 mb-1">Key Tradeoffs</h3>
                          <ul className="text-xs text-gray-400 space-y-1">
                            {result.ai_report.tradeoffs.map((t, i) => (
                              <li key={i} className="bg-amber-950/20 rounded px-2 py-1 border-l-2 border-amber-700">{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Best Fit */}
                      {result.ai_report.best_fit_concept && (
                        <div className="bg-teal-950/20 border border-teal-800/30 rounded p-2">
                          <h3 className="text-xs font-semibold text-teal mb-1">Best Fit Concept</h3>
                          <p className="text-xs text-gray-300">{result.ai_report.best_fit_concept}</p>
                        </div>
                      )}

                      {/* Scenarios */}
                      {result.ai_report.scenario_comparison && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-400 mb-1">Scenario Comparison</h3>
                          <p className="text-xs text-gray-400">{result.ai_report.scenario_comparison.build_now_vs_wait}</p>
                          {result.ai_report.scenario_comparison.concept_options && (
                            <p className="text-xs text-gray-500 mt-1">{result.ai_report.scenario_comparison.concept_options}</p>
                          )}
                        </div>
                      )}

                      {/* Unknowns */}
                      {result.ai_report.unknowns?.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-red-400 mb-1">Still Needs Verification</h3>
                          <ul className="text-xs text-gray-400 list-disc list-inside space-y-0.5">
                            {result.ai_report.unknowns.map((u, i) => <li key={i}>{u}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Next Steps */}
                      {result.ai_report.next_steps?.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-blue-400 mb-1">Recommended Next Steps</h3>
                          <div className="space-y-1">
                            {result.ai_report.next_steps.map((s, i) => (
                              <div key={i} className="bg-blue-950/20 rounded px-2 py-1.5 text-xs">
                                <span className="text-white font-medium">{i+1}. {s.action}</span>
                                <span className="text-gray-500"> — {s.who}</span>
                                {s.why && <p className="text-gray-500 mt-0.5 text-[10px]">{s.why}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Site Design */}
                      {result.ai_report.site_design && (
                        <div className="bg-gray-700/30 rounded-lg p-3">
                          <h3 className="text-xs font-semibold text-teal mb-2">Where to Build on This Parcel</h3>
                          <div className="space-y-2 text-xs">
                            <div><span className="text-gray-500">Best pad location:</span> <span className="text-gray-300">{result.ai_report.site_design.recommended_pad}</span></div>
                            <div><span className="text-gray-500">Building orientation:</span> <span className="text-gray-300">{result.ai_report.site_design.orientation}</span></div>
                            <div className="text-gray-500 text-[10px] italic">{result.ai_report.site_design.orientation_reason}</div>
                            {result.ai_report.site_design.window_strategy?.length > 0 && (
                              <div>
                                <span className="text-gray-500">Window strategy:</span>
                                <ul className="text-gray-400 list-disc list-inside mt-0.5">
                                  {result.ai_report.site_design.window_strategy.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                              </div>
                            )}
                            {result.ai_report.site_design.room_zoning?.length > 0 && (
                              <div>
                                <span className="text-gray-500">Room placement:</span>
                                <ul className="text-gray-400 list-disc list-inside mt-0.5">
                                  {result.ai_report.site_design.room_zoning.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                              </div>
                            )}
                            <div><span className="text-gray-500">Driveway:</span> <span className="text-gray-400">{result.ai_report.site_design.driveway_access}</span></div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Fallback: render as raw text (backward compatibility)
                    <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {result.report_text}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── House Concept tab ── */}
      <div className={`flex-1 overflow-y-auto ${activeTab !== 'house' ? 'hidden' : ''}`}>
        <HouseConceptPanel address={parcelLocation || address} parcelReady={parcelReady} siteData={result} onResult={setHouseResult} />
      </div>

      {/* ── Price Forecast tab ── */}
      <div className={`flex-1 overflow-y-auto ${activeTab !== 'forecast' ? 'hidden' : ''}`}>
        <PriceForecastPanel address={parcelLocation || address} parcelReady={parcelReady} siteData={result} houseResult={houseResult} onResult={setForecastResult} />
      </div>

      {/* ── Engineering Q&A tab ── */}
      <div className={`flex-1 overflow-y-auto ${activeTab !== 'engineering' ? 'hidden' : ''}`}>
        <EngineeringAssistant siteData={result} address={address} />
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <span className="text-gray-500">{label}: </span>
      <span className="font-medium">{value ?? '—'}</span>
    </div>
  )
}
