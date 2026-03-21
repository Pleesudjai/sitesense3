/**
 * HouseConceptPanel — AI-powered house concept estimator.
 * Generates 3 layout options (Compact/Standard/Spacious) with cost ranges.
 */

import { useState } from 'react'
import { estimateHouseConcept } from '../api'
import ProfessionalDisclaimer from './ProfessionalDisclaimer'

const QUALITY_OPTIONS = [
  { value: 'economy',  label: 'Economy',   rate: 125 },
  { value: 'mid',      label: 'Mid-Range', rate: 175 },
  { value: 'premium',  label: 'Premium',   rate: 250 },
  { value: 'luxury',   label: 'Luxury',    rate: 350 },
]

export default function HouseConceptPanel({ address, onAddressChange, siteData }) {
  const [bedrooms, setBedrooms]     = useState(2)
  const [bathrooms, setBathrooms]   = useState(2)
  const [stories, setStories]       = useState(1)
  const [quality, setQuality]       = useState('mid')
  const [useSiteData, setUseSiteData] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const params = { bedrooms, bathrooms, stories, location: address || 'Phoenix, AZ', quality }
      if (useSiteData && siteData) {
        params.siteData = {
          soil: siteData.soil,
          foundation: siteData.foundation,
          loads: siteData.loads,
        }
      }
      const res = await estimateHouseConcept(params)
      setResult(res.data)
    } catch (err) {
      setError(err.message || 'House concept generation failed')
    } finally {
      setLoading(false)
    }
  }

  const rateLabel = QUALITY_OPTIONS.find(q => q.value === quality)?.rate || 175

  return (
    <div className="bg-gray-900 rounded-xl p-5 space-y-5">
      <h2 className="font-bold text-sm text-teal">House Concept Estimator</h2>

      {/* ─── Form ─── */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Bedrooms */}
          <label className="text-xs text-gray-400">
            Bedrooms
            <select
              value={bedrooms}
              onChange={e => setBedrooms(Number(e.target.value))}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
            >
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          {/* Bathrooms */}
          <label className="text-xs text-gray-400">
            Bathrooms
            <select
              value={bathrooms}
              onChange={e => setBathrooms(Number(e.target.value))}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
            >
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          {/* Stories */}
          <label className="text-xs text-gray-400">
            Stories
            <select
              value={stories}
              onChange={e => setStories(Number(e.target.value))}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
            >
              {[1, 2].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          {/* Quality */}
          <label className="text-xs text-gray-400">
            Quality (${rateLabel}/SF)
            <select
              value={quality}
              onChange={e => setQuality(e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
            >
              {QUALITY_OPTIONS.map(q => (
                <option key={q.value} value={q.value}>{q.label} — ${q.rate}/SF</option>
              ))}
            </select>
          </label>

          {/* Location */}
          <label className="text-xs text-gray-400 col-span-2 sm:col-span-2">
            Location
            <input
              type="text"
              value={address || ''}
              onChange={e => onAddressChange?.(e.target.value)}
              placeholder="City, State or address"
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-teal"
            />
          </label>
        </div>

        {/* Site data toggle */}
        {siteData && (
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={useSiteData}
              onChange={e => setUseSiteData(e.target.checked)}
              className="accent-teal-500"
            />
            Use site analysis data (soil, foundation, loads)
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
        >
          {loading ? 'Generating Concepts...' : 'Generate Concepts'}
        </button>
      </form>

      {/* ─── Error ─── */}
      {error && (
        <div className="bg-red-950/50 border border-red-700/50 rounded-lg p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* ─── Results ─── */}
      {result && (
        <div className="space-y-4">
          {/* Layout cards */}
          {result.layouts && (
            <>
              <h3 className="text-xs font-semibold text-gray-400">Layout Options</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {result.layouts.map((layout, i) => {
                  const isBest = result.layouts.every(l => layout.score >= l.score)
                  const costLow = layout.cost?.range?.low ?? 0
                  const costHigh = layout.cost?.range?.high ?? 0
                  const roomList = Array.isArray(layout.rooms)
                    ? layout.rooms.map(r => r.name || r).join(', ')
                    : layout.rooms || ''
                  return (
                    <div
                      key={i}
                      className={`bg-gray-800 rounded-lg p-3 space-y-2 border ${
                        isBest ? 'border-teal-500' : 'border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{layout.name}</span>
                        {isBest && (
                          <span className="text-xs bg-teal-900/60 text-teal-300 border border-teal-700 rounded px-1.5 py-0.5">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {(layout.totalSF || layout.total_sf || 0).toLocaleString()} SF
                        {layout.cost?.costPerSF ? ` · $${layout.cost.costPerSF}/SF` : ''}
                      </div>
                      <div className="text-sm font-semibold text-teal">
                        ${costLow.toLocaleString()} &ndash; ${costHigh.toLocaleString()}
                      </div>
                      {roomList && (
                        <p className="text-xs text-gray-500 leading-tight">{roomList}</p>
                      )}
                      {layout.structuralSystem && (
                        <p className="text-xs text-gray-500 italic">{layout.structuralSystem}</p>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Score</span>
                        <span className="text-xs font-bold text-white">{layout.score}/100</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Structural notes */}
          {result.structuralNotes?.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-400 mb-1">Structural Notes</h3>
              <ul className="text-xs text-gray-400 list-disc list-inside space-y-0.5">
                {result.structuralNotes.map((note, i) => <li key={i}>{note}</li>)}
              </ul>
            </div>
          )}

          {/* Cost comparison bar */}
          {result.layouts && (
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-400">Cost Comparison</h3>
              {result.layouts.map((layout, i) => {
                const costHigh = layout.cost?.range?.high ?? 0
                const maxCost = Math.max(...result.layouts.map(l => l.cost?.range?.high ?? 0))
                const pct = maxCost > 0 ? (costHigh / maxCost) * 100 : 0
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-20 shrink-0">{layout.name}</span>
                    <div className="flex-1 bg-gray-800 rounded h-4 overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-20 text-right">
                      ${(costHigh / 1000).toFixed(0)}k
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* AI Summary */}
          {result.aiSummary && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-2">AI Summary</h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {result.aiSummary}
              </p>
            </div>
          )}

          <ProfessionalDisclaimer />
        </div>
      )}
    </div>
  )
}
