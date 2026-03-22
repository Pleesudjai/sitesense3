import { generateReport } from './ReportGenerator'

/**
 * ReportButton — Opens a printable HTML report in a new tab.
 */
export default function ReportButton({ polygon, prefs, result, houseResult, forecastResult }) {
  const handleDownload = () => {
    if (!result) return
    generateReport(result, prefs?.address || '', polygon, houseResult, forecastResult)
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={!result}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all
                   bg-navy border border-teal hover:bg-teal/20 disabled:opacity-40
                   flex items-center justify-center gap-2"
      >
        📄 PDF Report
      </button>
    </div>
  )
}
