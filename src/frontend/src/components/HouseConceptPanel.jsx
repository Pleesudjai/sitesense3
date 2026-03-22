/**
 * HouseConceptPanel — AI-powered house concept estimator.
 * Generates 3 layout options (Compact/Standard/Spacious) with cost ranges.
 */

import { useState } from 'react'
import { estimateHouseConcept } from '../api'
import FloorPlanView from './FloorPlanView'
import ProfessionalDisclaimer from './ProfessionalDisclaimer'

const QUALITY_OPTIONS = [
  { value: 'economy',  label: 'Economy',   rate: 125 },
  { value: 'mid',      label: 'Mid-Range', rate: 175 },
  { value: 'premium',  label: 'Premium',   rate: 250 },
  { value: 'luxury',   label: 'Luxury',    rate: 350 },
]

export default function HouseConceptPanel({ address, parcelReady, siteData, onResult }) {
  const [bedrooms, setBedrooms]     = useState(2)
  const [bathrooms, setBathrooms]   = useState(2)
  const [stories, setStories]       = useState(1)
  const [quality, setQuality]       = useState('mid')
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const params = { bedrooms, bathrooms, stories, location: address || 'Phoenix, AZ', quality }
      if (siteData) {
        params.siteData = {
          soil: siteData.soil,
          foundation: siteData.foundation,
          loads: siteData.loads,
        }
      }
      const res = await estimateHouseConcept(params)
      setResult(res.data)
      onResult?.(res.data)
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

          {/* Location from drawn parcel */}
          <div className="text-xs text-gray-400 col-span-2 sm:col-span-2 flex items-end pb-1">
            {parcelReady
              ? <span>Parcel location: <span className="text-white font-medium">{address}</span></span>
              : <span className="text-amber-400">Draw a rectangle on the Site Analysis map to set location</span>
            }
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !parcelReady}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
        >
          {loading ? 'Generating Concepts...' : !parcelReady ? 'Draw a parcel on the Site Analysis map first' : 'Generate Concepts'}
        </button>
      </form>

      {/* ─── Error ─── */}
      {error && (
        <div className="bg-red-950/50 border border-red-700/50 rounded-lg p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* ─── Results ─── */}
      {result && (() => {
        const stdLayout = result.layouts?.find(l => l.score === 85) || result.layouts?.[1] || result.layouts?.[0]
        const costLow = stdLayout?.cost?.range?.low ?? 0
        const costHigh = stdLayout?.cost?.range?.high ?? 0
        const totalSF = stdLayout?.totalSF || stdLayout?.total_sf || 0
        const structSys = stdLayout?.structuralSystem || 'Wood frame'
        return (
        <div className="space-y-4">
          {/* Layout summary line */}
          {stdLayout && (
            <div className="bg-gray-800 rounded-lg px-4 py-3">
              <p className="text-sm text-white font-semibold">
                Standard Layout · {totalSF.toLocaleString()} SF · Total Construction Cost (building + foundation): ${costLow.toLocaleString()} &ndash; ${costHigh.toLocaleString()} · {structSys}
              </p>
            </div>
          )}

          {/* Floor plan — always show Standard layout */}
          {stdLayout && (
            <FloorPlanView layout={stdLayout} />
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

          {/* AI Summary */}
          {result.aiSummary && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-2">AI Summary</h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {result.aiSummary}
              </p>
            </div>
          )}

          {/* Cost scope note */}
          <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-3">
            <p className="text-xs text-blue-300">
              This estimate includes building construction, materials, labor, and foundation. Site preparation costs (earthwork, grading, utilities) are shown separately in the Site Analysis tab.
            </p>
          </div>

          <ProfessionalDisclaimer />
        </div>
        )
      })()}
    </div>
  )
}
