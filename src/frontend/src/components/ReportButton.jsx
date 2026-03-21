import { useState } from 'react'
import { downloadReport } from '../api'

/**
 * ReportButton — Triggers PDF report download from backend.
 */
export default function ReportButton({ polygon, prefs }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleDownload = async () => {
    if (!polygon) return
    setLoading(true)
    setError(null)
    try {
      await downloadReport(polygon, prefs)
    } catch (e) {
      setError('Report generation failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading || !polygon}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all
                   bg-navy border border-teal hover:bg-teal/20 disabled:opacity-40
                   flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="spinner w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60 20" />
            </svg>
            Generating Report…
          </>
        ) : (
          <>
            📄 Download Full PDF Report
          </>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      <p className="mt-1 text-xs text-gray-600 text-center">
        Includes AI-generated plain-English analysis · Code references · Cost breakdown
      </p>
    </div>
  )
}
