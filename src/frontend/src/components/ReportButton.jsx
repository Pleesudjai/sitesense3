import { useState } from 'react'
import { generateReport } from './ReportGenerator'

/**
 * ReportButton — Generates and downloads a real PDF report.
 */
export default function ReportButton({ polygon, prefs, result, houseResult, forecastResult }) {
  const [generating, setGenerating] = useState(false)

  const handleDownload = async () => {
    if (!result || generating) return
    setGenerating(true)
    try {
      await generateReport(result, prefs?.address || '', polygon, houseResult, forecastResult)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={!result || generating}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all
                   bg-navy border border-teal hover:bg-teal/20 disabled:opacity-40
                   flex items-center justify-center gap-2"
      >
        {generating ? '⏳ Generating PDF...' : '📄 Download PDF Report'}
      </button>
    </div>
  )
}
