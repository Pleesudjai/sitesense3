import { useState } from 'react'
import MapView from './components/MapView'
import RiskCards from './components/RiskCards'
import ElevationChart from './components/ElevationChart'
import CutFillVisual from './components/CutFillVisual'
import CostTable from './components/CostTable'
import ReportButton from './components/ReportButton'
import { analyzeParcel } from './api'

export default function App() {
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
          {/* Preferences */}
          <select
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm"
            value={prefs.buildingType}
            onChange={e => setPrefs(p => ({ ...p, buildingType: e.target.value }))}
          >
            <option value="single_family">Single Family</option>
            <option value="multifamily">Multi-Family</option>
            <option value="commercial">Commercial</option>
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
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map — left 60% */}
        <div className="w-3/5 relative">
          <MapView
            onPolygonChange={setPolygon}
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
              <ReportButton polygon={polygon} prefs={{ ...prefs, address }} />

              {/* AI Report text */}
              {result.report_text && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h2 className="font-bold text-sm text-teal mb-3">AI Feasibility Report</h2>
                  <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {result.report_text}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
