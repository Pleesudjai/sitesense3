import { useState, useRef, useEffect, useCallback } from 'react'

// ── shared color scale ────────────────────────────────────────────────────────
function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

function elevColor(elev, minElev, range) {
  const t = Math.max(0, Math.min(1, (elev - minElev) / (range || 1)))
  if (t < 0.25) { const s = t / 0.25;        return `rgb(${lerp(30,0,s)},${lerp(100,180,s)},${lerp(200,160,s)})` }
  if (t < 0.50) { const s = (t-0.25)/0.25;   return `rgb(${lerp(0,80,s)},${lerp(180,200,s)},${lerp(160,80,s)})` }
  if (t < 0.75) { const s = (t-0.50)/0.25;   return `rgb(${lerp(80,220,s)},${lerp(200,200,s)},${lerp(80,30,s)})` }
  const s = (t-0.75)/0.25; return `rgb(${lerp(220,200,s)},${lerp(200,40,s)},${lerp(30,40,s)})`
}

function elevColorRaw(elev, minElev, range) {
  const t = Math.max(0, Math.min(1, (elev - minElev) / (range || 1)))
  if (t < 0.25) { const s = t / 0.25;        return [lerp(30,0,s), lerp(100,180,s), lerp(200,160,s)] }
  if (t < 0.50) { const s = (t-0.25)/0.25;   return [lerp(0,80,s), lerp(180,200,s), lerp(160,80,s)] }
  if (t < 0.75) { const s = (t-0.50)/0.25;   return [lerp(80,220,s), lerp(200,200,s), lerp(80,30,s)] }
  const s = (t-0.75)/0.25; return [lerp(220,200,s), lerp(200,40,s), lerp(30,40,s)]
}

// ── 2D heatmap ────────────────────────────────────────────────────────────────
function Heatmap({ grid, bbox, minElev, maxElev, avgElev, range }) {
  const rows = grid.length, cols = grid[0].length
  const lonSpanFt = (bbox[2] - bbox[0]) * 91000 * 3.281
  const latSpanFt = (bbox[3] - bbox[1]) * 111000 * 3.281
  const cellW = Math.round(lonSpanFt / cols)
  const cellH = Math.round(latSpanFt / rows)

  return (
    <>
      <p className="text-xs text-gray-500 mb-3">
        {cols}×{rows} grid · {cellW}×{cellH} ft/cell · Range: {Math.round(minElev)}–{Math.round(maxElev)} ft · Relief: {Math.round(range)} ft
      </p>
      <div
        className="w-full rounded overflow-hidden border border-gray-700"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1px', background: '#374151' }}
      >
        {[...grid].reverse().map((row, ri) =>
          row.map((elev, ci) => (
            <div key={`${ri}-${ci}`} title={`${Math.round(elev)} ft`}
              style={{ background: elevColor(elev, minElev, range), aspectRatio: '1', minHeight: '6px' }} />
          ))
        )}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1 px-0.5">
        <span>W</span><span>↑ N</span><span>E</span>
      </div>
      <LegendBar minElev={minElev} maxElev={maxElev} avgElev={avgElev} />
    </>
  )
}

// ── 3D surface canvas ─────────────────────────────────────────────────────────
function Surface3D({ grid, minElev, maxElev, range }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const rows = grid.length, cols = grid[0].length
    const margin = 16

    // Oblique projection: col goes right, row goes up-right, elevation goes up
    // cw * (cols + rows * 0.5) = usable width
    const cw = (W - margin * 2) / (cols + rows * 0.55)
    const ox = cw * 0.55   // x offset per row step (depth)
    const oy = cw * 0.28   // y offset per row step (depth)
    const zScale = Math.min(H * 0.38, cw * rows * 0.7)  // max visual height for elevation

    // Project grid (col, row, elev) → canvas (px, py)
    function proj(col, row, elev) {
      const norm = (elev - minElev) / (range || 1)
      const px = margin + col * cw + row * ox
      const py = H - margin - row * oy - norm * zScale
      return [px, py]
    }

    // Draw cells back-to-front (painter's algorithm: high row first, then low col)
    for (let r = rows - 1; r >= 0; r--) {
      for (let c = 0; c < cols; c++) {
        const e00 = grid[r][c]
        const e10 = grid[r][Math.min(c + 1, cols - 1)]
        const e11 = grid[Math.min(r + 1, rows - 1)][Math.min(c + 1, cols - 1)]
        const e01 = grid[Math.min(r + 1, rows - 1)][c]

        const [x0, y0] = proj(c,     r,     e00)
        const [x1, y1] = proj(c + 1, r,     e10)
        const [x2, y2] = proj(c + 1, r + 1, e11)
        const [x3, y3] = proj(c,     r + 1, e01)

        const avgE = (e00 + e10 + e11 + e01) / 4
        const [red, green, blue] = elevColorRaw(avgE, minElev, range)

        ctx.beginPath()
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1)
        ctx.lineTo(x2, y2); ctx.lineTo(x3, y3)
        ctx.closePath()

        // Slight shading: left face darker, right face lighter
        const shade = (c % 2 === 0) ? 0.92 : 1.0
        ctx.fillStyle = `rgba(${Math.round(red*shade)},${Math.round(green*shade)},${Math.round(blue*shade)},1)`
        ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }

    // Axis labels
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'

    const [ox0] = proj(Math.floor(cols/2), 0, minElev)
    ctx.fillText('S', ox0, H - 2)

    const [nx0, ny0] = proj(Math.floor(cols/2), rows, minElev)
    ctx.fillText('N', nx0, ny0 + 12)

    ctx.fillText(`${Math.round(minElev)} ft`, margin, H - 4)
    ctx.fillText(`${Math.round(maxElev)} ft`, margin, H - 4 - zScale)
    ctx.fillStyle = '#02C39A'
    ctx.fillText('▲ elev', margin - 2, H - 4 - zScale / 2)

  }, [grid, minElev, maxElev, range])

  useEffect(() => { draw() }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={520}
      height={200}
      className="w-full rounded border border-gray-700"
      style={{ background: '#111827' }}
    />
  )
}

// ── shared legend ─────────────────────────────────────────────────────────────
function LegendBar({ minElev, maxElev, avgElev }) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 shrink-0">Low</span>
        <div className="flex-1 h-3 rounded" style={{ background: 'linear-gradient(to right, rgb(30,100,200), rgb(0,180,160), rgb(80,200,80), rgb(220,200,30), rgb(200,40,40))' }} />
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

// ── main export ───────────────────────────────────────────────────────────────
export default function ElevationChart({ grid, bbox }) {
  const [view, setView] = useState('2d')
  if (!grid || !bbox) return null

  const flat     = grid.flat()
  const minElev  = Math.min(...flat)
  const maxElev  = Math.max(...flat)
  const avgElev  = flat.reduce((a, b) => a + b, 0) / flat.length
  const range    = maxElev - minElev || 1

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {/* Header + dropdown */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-sm text-teal">Elevation Grid</h2>
        <select
          value={view}
          onChange={e => setView(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-teal"
        >
          <option value="2d">2D Heatmap</option>
          <option value="3d">3D Surface</option>
        </select>
      </div>

      {view === '2d'
        ? <Heatmap grid={grid} bbox={bbox} minElev={minElev} maxElev={maxElev} avgElev={avgElev} range={range} />
        : <>
            <p className="text-xs text-gray-500 mb-3">
              Oblique surface · {grid[0].length}×{grid.length} grid · Relief: {Math.round(range)} ft
            </p>
            <Surface3D grid={grid} minElev={minElev} maxElev={maxElev} range={range} />
            <LegendBar minElev={minElev} maxElev={maxElev} avgElev={avgElev} />
          </>
      }
    </div>
  )
}
