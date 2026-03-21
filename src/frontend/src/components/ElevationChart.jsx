/**
 * ElevationChart — 2D elevation heatmap grid (X and Y).
 * Each cell is colored by elevation: blue (low) → green → yellow → red (high).
 * Hover a cell to see exact elevation.
 */
export default function ElevationChart({ grid, bbox }) {
  if (!grid || !bbox) return null

  const rows = grid.length
  const cols = grid[0].length

  // Global min/max across entire grid
  const flat = grid.flat()
  const minElev = Math.min(...flat)
  const maxElev = Math.max(...flat)
  const avgElev = flat.reduce((a, b) => a + b, 0) / flat.length
  const range   = maxElev - minElev || 1

  // Color scale: 0→blue, 0.25→cyan, 0.5→green, 0.75→yellow, 1→red
  function elevColor(elev) {
    const t = (elev - minElev) / range  // 0..1
    if (t < 0.25) {
      const s = t / 0.25
      return `rgb(${lerp(30,0,s)},${lerp(100,180,s)},${lerp(200,160,s)})`
    } else if (t < 0.5) {
      const s = (t - 0.25) / 0.25
      return `rgb(${lerp(0,80,s)},${lerp(180,200,s)},${lerp(160,80,s)})`
    } else if (t < 0.75) {
      const s = (t - 0.5) / 0.25
      return `rgb(${lerp(80,220,s)},${lerp(200,200,s)},${lerp(80,30,s)})`
    } else {
      const s = (t - 0.75) / 0.25
      return `rgb(${lerp(220,200,s)},${lerp(200,40,s)},${lerp(30,40,s)})`
    }
  }

  function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

  // Approximate cell size in feet
  const lonSpanFt = (bbox[2] - bbox[0]) * 91000 * 3.281
  const latSpanFt = (bbox[3] - bbox[1]) * 111000 * 3.281
  const cellW = Math.round(lonSpanFt / cols)
  const cellH = Math.round(latSpanFt / rows)

  // Legend stops
  const stops = [
    { label: `${Math.round(minElev)} ft`, color: elevColor(minElev) },
    { label: `${Math.round(minElev + range * 0.25)} ft`, color: elevColor(minElev + range * 0.25) },
    { label: `${Math.round(avgElev)} ft avg`, color: elevColor(avgElev) },
    { label: `${Math.round(minElev + range * 0.75)} ft`, color: elevColor(minElev + range * 0.75) },
    { label: `${Math.round(maxElev)} ft`, color: elevColor(maxElev) },
  ]

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="font-bold text-sm text-teal mb-1">Elevation Grid</h2>
      <p className="text-xs text-gray-500 mb-3">
        {cols}×{rows} grid · {cellW}×{cellH} ft/cell · Range: {Math.round(minElev)}–{Math.round(maxElev)} ft
        · Relief: {Math.round(range)} ft
      </p>

      {/* 2D heatmap */}
      <div
        className="w-full rounded overflow-hidden border border-gray-700"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1px', background: '#374151' }}
      >
        {/* Render rows top-to-bottom (row 0 = south → flip for N-up display) */}
        {[...grid].reverse().map((row, ri) =>
          row.map((elev, ci) => (
            <div
              key={`${ri}-${ci}`}
              title={`${Math.round(elev)} ft`}
              style={{
                background: elevColor(elev),
                aspectRatio: '1',
                minHeight: '6px',
              }}
            />
          ))
        )}
      </div>

      {/* Compass labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-1 px-0.5">
        <span>W</span>
        <span>↑ N</span>
        <span>E</span>
      </div>

      {/* Color legend */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-500 shrink-0">Low</span>
        <div className="flex-1 h-3 rounded" style={{
          background: `linear-gradient(to right,
            rgb(30,100,200), rgb(0,180,160), rgb(80,200,80),
            rgb(220,200,30), rgb(200,40,40))`,
        }} />
        <span className="text-xs text-gray-500 shrink-0">High</span>
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-0.5">
        <span>{Math.round(minElev)} ft</span>
        <span>{Math.round(avgElev)} ft avg</span>
        <span>{Math.round(maxElev)} ft</span>
      </div>
    </div>
  )
}
