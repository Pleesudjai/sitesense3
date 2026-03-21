/**
 * PriceForecastPanel — Government-data-driven price prediction for decision support.
 * Shows current estimate + 1/2/5/10-year forecasts with indicator breakdown.
 */

import { useState } from 'react'
import { predictPrice } from '../api'
import ProfessionalDisclaimer from './ProfessionalDisclaimer'

const QUALITY_OPTIONS = [
  { value: 'economy',  label: 'Economy',   rate: 130 },
  { value: 'mid',      label: 'Mid-Range', rate: 175 },
  { value: 'premium',  label: 'Premium',   rate: 240 },
  { value: 'luxury',   label: 'Luxury',    rate: 350 },
]

const CONTRIBUTION_COLORS = {
  primary:   'bg-teal-800 text-teal-200',
  moderate:  'bg-blue-800 text-blue-200',
  secondary: 'bg-purple-800 text-purple-200',
  baseline:  'bg-gray-700 text-gray-300',
  context:   'bg-gray-700 text-gray-400',
}

export default function PriceForecastPanel({ address, onAddressChange, siteData }) {
  const [bedrooms, setBedrooms]   = useState(2)
  const [bathrooms, setBathrooms] = useState(2)
  const [stories, setStories]     = useState(1)
  const [totalSF, setTotalSF]     = useState(1250)
  const [quality, setQuality]     = useState('mid')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const params = {
        bedrooms, bathrooms, stories, totalSF,
        quality, location: address || 'Phoenix, AZ',
        foundationType: siteData?.foundation?.type || 'CONVENTIONAL_SLAB',
      }
      const res = await predictPrice(params)
      setResult(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n) => `$${Math.round(n).toLocaleString()}`

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-teal">Price Forecast</h2>
        <p className="text-xs text-gray-400">Government-data-driven construction cost prediction for decision support</p>
      </div>

      {/* ─── Form ─── */}
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="text-xs text-gray-400">
            Bedrooms
            <select value={bedrooms} onChange={e => setBedrooms(+e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400">
            Bathrooms
            <select value={bathrooms} onChange={e => setBathrooms(+e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400">
            Stories
            <select value={stories} onChange={e => setStories(+e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white">
              {[1,2].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400">
            Total SF
            <input type="number" value={totalSF} onChange={e => setTotalSF(+e.target.value)}
              min={400} max={10000} step={50}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-teal" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-400">
            Quality
            <select value={quality} onChange={e => setQuality(e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white">
              {QUALITY_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label} — ${q.rate}/SF</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400">
            Location
            <input type="text" value={address || ''} onChange={e => onAddressChange?.(e.target.value)}
              placeholder="City, State or address"
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-teal" />
          </label>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors">
          {loading ? 'Forecasting...' : 'Run Price Forecast'}
        </button>
      </form>

      {error && (
        <div className="bg-red-950/50 border border-red-700/50 rounded-lg p-3 text-xs text-red-300">{error}</div>
      )}

      {/* ─── Results ─── */}
      {result && (
        <div className="space-y-5">
          {/* Current estimate hero */}
          <div className="bg-gray-900 rounded-lg p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">Current Construction Cost Estimate</p>
            <p className="text-3xl font-bold text-teal">{fmt(result.currentEstimate.expected)}</p>
            <p className="text-sm text-gray-400">
              {fmt(result.currentEstimate.low)} — {fmt(result.currentEstimate.high)}
            </p>
            <p className="text-xs text-gray-500 mt-1">${result.currentEstimate.perSF}/SF · {result.location?.state || 'US'}</p>
          </div>

          {/* Forecast timeline */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Cost Forecast Timeline</h3>
            <div className="space-y-2">
              {[{ year: 0, label: 'Now', ...result.currentEstimate }, ...result.forecasts.map(f => ({ ...f, label: `${f.year}yr` }))].map((f, i) => {
                const maxHigh = Math.max(result.currentEstimate.high, ...result.forecasts.map(x => x.high))
                const pctLow = (f.low / maxHigh) * 100
                const pctHigh = (f.high / maxHigh) * 100
                const pctExp = (f.expected / maxHigh) * 100
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-10 shrink-0 text-right font-mono">{f.label}</span>
                    <div className="flex-1 relative h-6 bg-gray-800 rounded overflow-hidden">
                      {/* Range bar */}
                      <div className="absolute h-full bg-teal-900/60 rounded"
                        style={{ left: `${pctLow}%`, width: `${pctHigh - pctLow}%` }} />
                      {/* Expected marker */}
                      <div className="absolute h-full w-0.5 bg-teal-400"
                        style={{ left: `${pctExp}%` }} />
                    </div>
                    <span className="text-xs text-gray-300 w-24 shrink-0 text-right font-mono">
                      {fmt(f.expected)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1 px-14">
              <span>Low</span>
              <span>Expected</span>
              <span>High</span>
            </div>
          </div>

          {/* Forecast table */}
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Detailed Projections</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  <th className="text-left py-1">Horizon</th>
                  <th className="text-right py-1">Low</th>
                  <th className="text-right py-1">Expected</th>
                  <th className="text-right py-1">High</th>
                  <th className="text-right py-1">Change</th>
                </tr>
              </thead>
              <tbody>
                {[{ year: 0, label: 'Now', ...result.currentEstimate }, ...result.forecasts.map(f => ({ ...f, label: `Year ${f.year}` }))].map((f, i) => {
                  const change = f.year === 0 ? 0 : ((f.expected / result.currentEstimate.expected - 1) * 100)
                  return (
                    <tr key={i} className="border-b border-gray-800">
                      <td className="py-1.5 font-medium text-white">{f.label}</td>
                      <td className="py-1.5 text-right text-gray-400">{fmt(f.low)}</td>
                      <td className="py-1.5 text-right text-teal font-semibold">{fmt(f.expected)}</td>
                      <td className="py-1.5 text-right text-gray-400">{fmt(f.high)}</td>
                      <td className="py-1.5 text-right">
                        {f.year === 0
                          ? <span className="text-gray-500">—</span>
                          : <span className="text-amber-400">+{change.toFixed(1)}%</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Indicator breakdown */}
          {result.indicators && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">What's Driving This Forecast</h3>
              <div className="space-y-2">
                {Object.entries(result.indicators).map(([key, ind]) => (
                  <div key={key} className="flex items-start gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${CONTRIBUTION_COLORS[ind.contribution] || CONTRIBUTION_COLORS.context}`}>
                      {ind.contribution}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        {ind.rate != null ? `${(ind.rate * 100).toFixed(1)}%` : ''}
                        {ind.value != null ? `${ind.value.toFixed(2)}x` : ''}
                        {ind.mortgage_rate != null ? `${ind.mortgage_rate}% rate · ${ind.market_temp}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">{ind.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {result.sources && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-2">Government Data Sources</h3>
              <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
                {result.sources.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
              <p className="text-xs text-gray-600 mt-2 italic">{result.methodology}</p>
            </div>
          )}

          <ProfessionalDisclaimer />
        </div>
      )}
    </div>
  )
}
