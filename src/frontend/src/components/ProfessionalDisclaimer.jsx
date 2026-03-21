/**
 * ProfessionalDisclaimer — Reusable PE disclaimer for all analysis outputs.
 */

const DISCLAIMER_TEXT =
  'This is a preliminary concept estimate only. All outputs require review by a licensed professional engineer before any design, construction, or authority submission.'

export default function ProfessionalDisclaimer({ compact }) {
  if (compact) {
    return (
      <p className="text-xs text-amber-200/70 mt-1">
        {DISCLAIMER_TEXT}
      </p>
    )
  }

  return (
    <div className="bg-amber-950/50 border border-amber-700/50 rounded-lg p-3 flex items-start gap-2">
      <span className="text-amber-400 shrink-0">&#9888;</span>
      <p className="text-xs text-amber-200 leading-relaxed">{DISCLAIMER_TEXT}</p>
    </div>
  )
}
