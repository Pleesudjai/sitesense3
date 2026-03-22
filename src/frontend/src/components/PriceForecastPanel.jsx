/**
 * PriceForecastPanel — Government-data-driven price prediction for decision support.
 * Shows current estimate + 1/2/5/10-year forecasts with indicator breakdown.
 */

import { useState } from 'react'
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts'
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

// Plain-English explanations for each indicator
const INDICATOR_EXPLAIN = {
  constructionInflation: {
    title: 'Construction Material & Labor Costs',
    explain: rate => rate > 0.04
      ? `Building materials and labor are rising ${(rate*100).toFixed(1)}% per year — faster than general inflation. Lumber, concrete, and steel prices are the main drivers. Waiting to build will likely cost more.`
      : `Construction costs are rising at ${(rate*100).toFixed(1)}% per year — roughly in line with historical averages. Materials and labor costs are relatively stable right now.`,
  },
  localCostFactor: {
    title: 'Your Local Cost Level',
    explain: val => val > 1.05
      ? `Building in your area costs about ${Math.round((val-1)*100)}% more than the national average. Local labor demand and cost of living push prices up.`
      : val < 0.95
        ? `Building in your area costs about ${Math.round((1-val)*100)}% less than the national average — a relative cost advantage.`
        : `Building costs in your area are close to the national average.`,
  },
  housingMarketTrend: {
    title: 'Local Housing Market Trend',
    explain: rate => rate > 0.05
      ? `Home values in your state are appreciating ${(rate*100).toFixed(1)}% per year — a strong seller's market. Building now locks in today's construction cost while property values rise.`
      : rate > 0.03
        ? `Home values are growing ${(rate*100).toFixed(1)}% per year — moderate appreciation. The market is healthy but not overheated.`
        : `Home values are growing slowly at ${(rate*100).toFixed(1)}% per year. Less urgency to build immediately from a market timing perspective.`,
  },
  macroInflation: {
    title: 'Overall Economy (Inflation)',
    explain: rate => `The Federal Reserve's preferred inflation measure is at ${(rate*100).toFixed(1)}%. This sets the floor for how fast all prices — including construction — are rising across the economy.`,
  },
  supplyConditions: {
    title: 'Housing Supply & Mortgage Rates',
    explain: (_, ind) => {
      const rate = ind.mortgage_rate || 6.85
      const temp = ind.market_temp || 'balanced'
      if (rate > 7) return `Mortgage rates are high (${rate}%) which is cooling demand. The market is ${temp}. Higher rates mean fewer buyers competing, but also higher financing costs if you need a construction loan.`
      if (rate > 6) return `Mortgage rates are at ${rate}% — elevated but stabilizing. The market is ${temp}. Construction loan rates will be similar, affecting your total project cost.`
      return `Mortgage rates are at ${rate}% — relatively favorable. The market is ${temp}. Good conditions for financing a new build.`
    },
  },
}

export default function PriceForecastPanel({ address, parcelReady, siteData, houseResult, onResult }) {
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState(null)

  // Get parameters from House Concept result (recommended layout)
  const bestLayout = houseResult?.layouts?.reduce((a, b) => (b.score >= a.score ? b : a), houseResult.layouts[0])
  const hasHouseData = !!bestLayout

  async function handleSubmit() {
    if (!hasHouseData) return
    setLoading(true)
    setError(null)
    try {
      const params = {
        bedrooms: houseResult.layouts[0]?.rooms?.filter(r => r.name?.includes('Bedroom')).length || 2,
        bathrooms: houseResult.layouts[0]?.rooms?.filter(r => r.name?.includes('Bath')).length || 2,
        stories: bestLayout.stories || 1,
        totalSF: bestLayout.totalSF || 1250,
        quality: houseResult.quality || 'mid',
        location: address || 'Phoenix, AZ',
        foundationType: houseResult.foundationType || siteData?.foundation?.type || 'CONVENTIONAL_SLAB',
      }
      const res = await predictPrice(params)
      setResult(res.data)
      onResult?.(res.data)
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

      {/* ─── Input summary from House Concept ─── */}
      <div className="bg-gray-900 rounded-lg p-4 space-y-3">
        {hasHouseData ? (
          <>
            <p className="text-xs text-gray-400">Using parameters from <span className="text-teal font-semibold">House Concept</span> — {bestLayout.name} layout</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-800 rounded p-2"><span className="text-gray-500">Layout</span><p className="text-white font-medium">{bestLayout.name} · {bestLayout.totalSF?.toLocaleString()} SF</p></div>
              <div className="bg-gray-800 rounded p-2"><span className="text-gray-500">Quality</span><p className="text-white font-medium capitalize">{houseResult.quality || 'mid'}</p></div>
              <div className="bg-gray-800 rounded p-2"><span className="text-gray-500">Foundation</span><p className="text-white font-medium">{(houseResult.foundationType || 'CONVENTIONAL_SLAB').replace(/_/g, ' ')}</p></div>
              <div className="bg-gray-800 rounded p-2"><span className="text-gray-500">Location</span><p className="text-white font-medium">{address || '—'}</p></div>
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors">
              {loading ? 'Forecasting...' : 'Run Price Forecast'}
            </button>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Generate a House Concept first</p>
            <p className="text-gray-500 text-xs mt-1">Go to the <span className="text-teal">House Concept</span> tab to set bedrooms, bathrooms, stories, and quality. Price Forecast uses those parameters.</p>
          </div>
        )}
      </div>

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

          {/* Forecast line chart */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Cost Forecast Timeline</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={[
                { year: 0, label: 'Now', ...result.currentEstimate },
                ...result.forecasts.map(f => ({ ...f, label: `Yr ${f.year}` })),
              ]} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 12 }} label={{ value: 'Year', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={65} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(v, name) => [fmt(v), name === 'expected' ? 'Expected' : name === 'low' ? 'Low' : 'High']}
                  labelFormatter={v => v === 0 ? 'Now' : `Year ${v}`}
                />
                {/* Confidence band: low to high */}
                <Area type="monotone" dataKey="low" stackId="band" stroke="none" fill="transparent" />
                <Area type="monotone" dataKey="high" stackId="band" stroke="none" fill="#02C39A" fillOpacity={0.1} />
                {/* Low/High dashed lines */}
                <Line type="monotone" dataKey="low" stroke="#475569" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="high" stroke="#475569" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                {/* Expected solid line */}
                <Line type="monotone" dataKey="expected" stroke="#02C39A" strokeWidth={2.5} dot={{ fill: '#02C39A', r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 text-xs text-gray-500 mt-1">
              <span><span style={{ color: '#02C39A' }}>——</span> Expected</span>
              <span><span style={{ color: '#475569' }}>- - -</span> Low / High range</span>
              <span style={{ color: '#02C39A', opacity: 0.3 }}>■</span> <span>Confidence band</span>
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
              <div className="space-y-4">
                {Object.entries(result.indicators).map(([key, ind]) => {
                  const info = INDICATOR_EXPLAIN[key]
                  const explainText = info?.explain?.(ind.rate ?? ind.value, ind) || ''
                  return (
                    <div key={key} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${CONTRIBUTION_COLORS[ind.contribution] || CONTRIBUTION_COLORS.context}`}>
                          {ind.contribution}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {info?.title || key}
                        </span>
                        <span className="text-sm text-teal ml-auto font-mono">
                          {ind.rate != null ? `${(ind.rate * 100).toFixed(1)}%` : ''}
                          {ind.value != null ? `${ind.value.toFixed(2)}x` : ''}
                          {ind.mortgage_rate != null ? `${ind.mortgage_rate}%` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{explainText}</p>
                      <p className="text-xs text-gray-600 mt-1 italic">Source: {ind.source}</p>
                    </div>
                  )
                })}
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
