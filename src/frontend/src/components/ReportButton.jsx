import { generateReport } from './ReportGenerator'

/**
 * ReportButton — Opens a styled HTML report in a new browser tab.
 * User prints to PDF via Ctrl+P. No server round-trip needed.
 */
export default function ReportButton({ polygon, prefs, result }) {
  const handleDownload = () => {
    if (!result) return
    generateReport(result, prefs?.address || '', polygon)
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
        📄 Generate PDF Report
      </button>
      <p className="mt-1 text-xs text-gray-600 text-center">
        Opens in a new tab · Use Ctrl+P to save as PDF
      </p>
    </div>
  )
}
