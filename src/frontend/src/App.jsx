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
  const [userType, setUserType] = useState('homeowner')

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
          <select
            value={userType}
            onChange={e => setUserType(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm"
          >
            <option value="homeowner">Homeowner</option>
            <option value="architect">Architect</option>
            <option value="developer">Developer</option>
          </select>
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
                        {result.ai_report.top_reasons?.length > 0 && (
                          <div className="mt-1">
                            {result.ai_report.top_reasons.map((r, i) => (
                              <p key={i} className="text-xs text-gray-400 flex gap-1.5 items-start">
                                <span className="text-amber-500 shrink-0">•</span> {r}
                              </p>
                            ))}
                          </div>
                        )}
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
                      {result.ai_report.site_design && (() => {
                        // Parse rotation angle from orientation text
                        // Use backend orientation_degrees directly (data-driven)
                        const rotDeg = (result.ai_report.site_design.orientation_degrees || 180) - 180  // SVG: 0=south-facing
                        const climate = result.ai_report.site_design.climate_zone || 'temperate'
                        const climateLabel = { hot_arid: 'Hot & Arid', hot_humid: 'Hot & Humid', cold: 'Cold', temperate: 'Temperate' }[climate] || climate
                        const sd = result.ai_report.site_design
                        const padAlts = sd.pad_alternatives || []
                        const orientScores = sd.orientation_scores || []

                        return (
                        <div className="bg-gray-700/30 rounded-lg p-3">
                          <h3 className="text-xs font-semibold text-teal mb-2">Where to Build on This Parcel</h3>

                          {/* Orientation diagram */}
                          <div className="flex gap-4 mb-3">
                            <svg viewBox="0 0 160 160" className="w-36 h-36 shrink-0">
                              {/* Compass circle */}
                              <circle cx="80" cy="80" r="72" fill="none" stroke="#374151" strokeWidth="1" />
                              {/* Compass labels */}
                              <text x="80" y="14" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="700">N</text>
                              <text x="80" y="154" textAnchor="middle" fill="#6b7280" fontSize="10">S</text>
                              <text x="10" y="83" textAnchor="middle" fill="#6b7280" fontSize="10">W</text>
                              <text x="150" y="83" textAnchor="middle" fill="#6b7280" fontSize="10">E</text>
                              {/* Sun arc (east to west through south) */}
                              <path d="M 135,80 A 55,55 0 0,1 25,80" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
                              <text x="135" y="70" fill="#fbbf24" fontSize="7" opacity="0.6">sunrise</text>
                              <text x="25" y="70" fill="#fbbf24" fontSize="7" opacity="0.6" textAnchor="end">sunset</text>
                              {/* Building rectangle — rotated */}
                              <g transform={`rotate(${rotDeg}, 80, 80)`}>
                                <rect x="55" y="58" width="50" height="44" fill="#1a3d4d" stroke="#02C39A" strokeWidth="1.5" rx="2" />
                                {/* Facade labels */}
                                <text x="80" y="56" textAnchor="middle" fill="#60a5fa" fontSize="6">N</text>
                                <text x="80" y="108" textAnchor="middle" fill="#f59e0b" fontSize="6">S</text>
                                <text x="52" y="82" textAnchor="end" fill="#6b7280" fontSize="6">W</text>
                                <text x="108" y="82" textAnchor="start" fill="#6b7280" fontSize="6">E</text>
                                {/* Front door indicator (south facade) */}
                                <rect x="73" y="100" width="14" height="4" fill="#02C39A" rx="1" opacity="0.6" />
                                <text x="80" y="115" textAnchor="middle" fill="#02C39A" fontSize="5">entry</text>
                              </g>
                              {/* North arrow */}
                              <polygon points="80,20 77,28 83,28" fill="#ef4444" />
                            </svg>
                            <div className="flex-1 space-y-1.5 text-xs">
                              <div className="bg-gray-800/50 rounded px-2 py-1.5">
                                <span className="text-gray-500">Orientation:</span>
                                <span className="text-white font-medium ml-1">{result.ai_report.site_design.orientation}</span>
                              </div>
                              <div className="text-gray-500 text-[10px] italic leading-relaxed">{result.ai_report.site_design.orientation_reason}</div>
                              <div className="bg-gray-800/50 rounded px-2 py-1.5">
                                <span className="text-gray-500">Climate zone:</span>
                                <span className="text-white font-medium ml-1">{climateLabel}</span>
                              </div>
                              <div className="bg-gray-800/50 rounded px-2 py-1.5">
                                <span className="text-gray-500">Pad:</span>
                                <span className="text-gray-300 ml-1">{result.ai_report.site_design.recommended_pad}</span>
                              </div>
                            </div>
                          </div>
                          {/* Data-driven scoring results */}
                          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                            {/* Pad alternatives */}
                            {padAlts.length > 0 && (
                              <div className="bg-gray-800/40 rounded p-2">
                                <span className="text-gray-500 text-[10px] font-semibold">Pad Candidates Scored</span>
                                {padAlts.map((p, i) => (
                                  <div key={i} className={`flex justify-between mt-1 ${i === 0 ? 'text-teal' : 'text-gray-500'}`}>
                                    <span>{p.position}</span>
                                    <span className="font-mono">{p.score}/100 · {p.avgSlope}%</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Orientation scores */}
                            {orientScores.length > 0 && (
                              <div className="bg-gray-800/40 rounded p-2">
                                <span className="text-gray-500 text-[10px] font-semibold">Orientation Options Scored</span>
                                {orientScores.map((o, i) => (
                                  <div key={i} className={`flex justify-between mt-1 ${i === 0 ? 'text-teal' : 'text-gray-500'}`}>
                                    <span>{o.label}</span>
                                    <span className="font-mono">{o.score}/100</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Pad reasoning */}
                          {sd.pad_reasoning?.length > 0 && (
                            <div className="bg-gray-800/40 rounded p-2 mb-3 text-[10px] text-gray-500">
                              <span className="font-semibold text-gray-400">Analysis method: </span>
                              {sd.pad_reasoning.join(' · ')}
                            </div>
                          )}

                          <div className="space-y-2 text-xs">
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
                        )})()}

                      {/* Confidence & Provenance */}
                      {result.evidence_pack && (
                        <div className="bg-gray-700/20 rounded p-2 mt-2">
                          <h3 className="text-[10px] font-semibold text-gray-500 mb-1">Data Confidence</h3>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(result.evidence_pack.confidence || {}).filter(([k]) => k !== 'overall').map(([key, level]) => (
                              <span key={key} className={`text-[9px] px-1.5 py-0.5 rounded ${
                                level === 'verified' ? 'bg-green-900/40 text-green-400' :
                                level === 'partially_verified' ? 'bg-yellow-900/40 text-yellow-400' :
                                level === 'heuristic' ? 'bg-blue-900/40 text-blue-400' :
                                'bg-red-900/40 text-red-400'
                              }`}>
                                {key}: {level.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                          {result.evidence_pack.provenance && (
                            <p className="text-[9px] text-gray-600 mt-1">
                              {result.evidence_pack.provenance.gis_layers_queried} GIS layers ·
                              {result.evidence_pack.provenance.ai_engine} ·
                              {new Date(result.evidence_pack.provenance.generated_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Assumptions */}
                      {result.evidence_pack?.assumptions?.length > 0 && (
                        <div className="bg-gray-700/20 rounded p-2 mt-1">
                          <h3 className="text-[10px] font-semibold text-gray-500 mb-1">Assumptions Made</h3>
                          <ul className="text-[9px] text-gray-500 list-disc list-inside space-y-0.5">
                            {result.evidence_pack.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Overall Confidence Summary */}
                      {result.ai_report?.confidence_summary && (
                        <div className={`rounded p-2 text-xs mt-1 ${
                          result.ai_report.confidence_summary.overall === 'verified' ? 'bg-green-950/20 text-green-400' :
                          result.ai_report.confidence_summary.overall === 'partially_verified' ? 'bg-amber-950/20 text-amber-400' :
                          'bg-red-950/20 text-red-400'
                        }`}>
                          <span className="font-semibold">Overall confidence: {result.ai_report.confidence_summary.overall?.replace('_',' ')}</span>
                          <p className="text-[10px] opacity-70 mt-0.5">{result.ai_report.confidence_summary.reason}</p>
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
