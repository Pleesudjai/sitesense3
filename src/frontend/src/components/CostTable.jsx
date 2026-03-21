/**
 * CostTable — ROM cost estimate breakdown + 10-year inflation projection.
 * Shows itemized site prep costs and future cost projections.
 */

const ITEM_LABELS = {
  earthwork_cut:  'Earthwork — Cut / Excavate',
  earthwork_fill: 'Earthwork — Fill / Compact',
  foundation:     'Foundation',
  rough_grading:  'Rough Grading',
  site_utilities: 'Site Utilities Hookup',
}

export default function CostTable({ costs }) {
  if (!costs) return null

  const { breakdown, total_now, low_estimate, high_estimate, projections, inflation_message } = costs

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="font-bold text-sm text-teal">Cost Estimate (Site Prep Only)</h2>

      {/* Breakdown */}
      <table className="w-full text-xs">
        <tbody>
          {Object.entries(breakdown || {}).map(([key, val]) => (
            <tr key={key} className="border-b border-gray-700">
              <td className="py-1.5 text-gray-400">{ITEM_LABELS[key] || key}</td>
              <td className="py-1.5 text-right font-medium">${(val || 0).toLocaleString()}</td>
            </tr>
          ))}
          <tr className="font-bold text-sm">
            <td className="pt-2 text-white">Total (midpoint)</td>
            <td className="pt-2 text-right text-teal">${(total_now || 0).toLocaleString()}</td>
          </tr>
          <tr className="text-xs text-gray-500">
            <td className="pb-1">ROM range (±30%)</td>
            <td className="pb-1 text-right">
              ${(low_estimate || 0).toLocaleString()} – ${(high_estimate || 0).toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 10-year projection */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 mb-2">
          10-Year Cost Projection (4.5%/yr inflation)
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 2, 5, 10].map(yr => (
            <div key={yr} className="bg-gray-900 rounded p-2 text-center">
              <div className="text-gray-500 text-xs">{yr === 0 ? 'Now' : `+${yr}yr`}</div>
              <div className="font-bold text-xs mt-0.5 text-white">
                ${((projections?.[yr] || total_now) / 1000).toFixed(0)}k
              </div>
              {yr > 0 && (
                <div className="text-red-400 text-xs">
                  +{Math.round(((projections?.[yr] / total_now) - 1) * 100)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      {inflation_message && (
        <div className="bg-teal/10 border border-teal/30 rounded p-2.5 text-xs text-teal">
          💡 {inflation_message.split('.')[0] + '.'}
        </div>
      )}

      <p className="text-xs text-gray-600">
        ⚠️ ROM estimates ±30% · Not a construction bid · Site conditions may vary
      </p>
    </div>
  )
}
