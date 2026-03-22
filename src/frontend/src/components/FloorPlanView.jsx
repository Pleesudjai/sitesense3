/**
 * FloorPlanView — zone-based squarified treemap + corridor layout engine
 * Renders architectural 2D SVG floor plan + interactive 3D box model.
 */

import { useState, useRef, useCallback, useEffect } from 'react'

/* ── Zone classification ─────────────────────────────────────────────────── */
const ZONE_MAP = {
  'Living Room': 'social', 'Kitchen': 'social', 'Dining': 'social', 'Entry': 'social',
  'Laundry': 'service', 'Primary Bath': 'service', 'Hallway': 'service',
  'Hallway / Circulation': 'service', 'Stairway': 'service',
  'Primary Bedroom': 'private',
}
function getZone(name) {
  if (ZONE_MAP[name]) return ZONE_MAP[name]
  if (name.startsWith('Bath')) return 'service'
  if (name.startsWith('Bedroom')) return 'private'
  return 'service'
}

const ZONE_COLORS = {
  social:   { fill: '#1a3d4d', stroke: '#2dd4bf', text: '#5eead4' },
  service:  { fill: '#2a2a3d', stroke: '#a78bfa', text: '#c4b5fd' },
  private:  { fill: '#1a2e4d', stroke: '#60a5fa', text: '#93c5fd' },
  corridor: { fill: '#1a1a2e', stroke: '#6b7280', text: '#9ca3af' },
}

const ROOM_ASPECT = {
  'Living Room': { min: 1.2, max: 1.6 }, 'Kitchen': { min: 0.8, max: 1.2 },
  'Dining': { min: 0.9, max: 1.3 }, 'Primary Bedroom': { min: 1.0, max: 1.4 },
  'Bedroom': { min: 0.9, max: 1.2 }, 'Primary Bath': { min: 0.7, max: 1.0 },
  'Bath': { min: 0.6, max: 0.9 }, 'Laundry': { min: 0.7, max: 1.0 },
}
function getAspect(name) {
  if (ROOM_ASPECT[name]) return ROOM_ASPECT[name]
  if (name.startsWith('Bedroom')) return ROOM_ASPECT['Bedroom']
  if (name.startsWith('Bath')) return ROOM_ASPECT['Bath']
  return { min: 0.8, max: 1.3 }
}

/* ── Squarified Treemap ──────────────────────────────────────────────────── */
function worstRatio(row, sideLen) {
  if (row.length === 0) return Infinity
  const totalArea = row.reduce((s, r) => s + r.area, 0)
  let worst = 0
  for (const r of row) {
    const rowThickness = totalArea / sideLen
    const itemLen = r.area / rowThickness
    const ar = Math.max(itemLen / rowThickness, rowThickness / itemLen)
    worst = Math.max(worst, ar)
  }
  return worst
}

function layoutRow(row, rect, isHoriz) {
  const totalArea = row.reduce((s, r) => s + r.area, 0)
  const results = []
  if (isHoriz) {
    const rowW = totalArea / rect.h
    let cy = rect.y
    for (const r of row) {
      const rh = r.area / rowW
      results.push({ ...r, x: rect.x, y: cy, w: rowW, h: rh })
      cy += rh
    }
    return { rects: results, remaining: { x: rect.x + rowW, y: rect.y, w: rect.w - rowW, h: rect.h } }
  }
  const rowH = totalArea / rect.w
  let cx = rect.x
  for (const r of row) {
    const rw = r.area / rowH
    results.push({ ...r, x: cx, y: rect.y, w: rw, h: rowH })
    cx += rw
  }
  return { rects: results, remaining: { x: rect.x, y: rect.y + rowH, w: rect.w, h: rect.h - rowH } }
}

function squarify(items, rect) {
  if (items.length === 0) return []
  if (items.length === 1) {
    return [{ ...items[0], x: rect.x, y: rect.y, w: rect.w, h: rect.h }]
  }
  const sorted = [...items].sort((a, b) => b.area - a.area)
  const isHoriz = rect.w >= rect.h
  const side = isHoriz ? rect.h : rect.w
  let row = [sorted[0]]
  const allRects = []

  for (let i = 1; i < sorted.length; i++) {
    const candidate = [...row, sorted[i]]
    if (worstRatio(candidate, side) <= worstRatio(row, side)) {
      row = candidate
    } else {
      const { rects, remaining } = layoutRow(row, rect, isHoriz)
      allRects.push(...rects)
      rect = remaining
      row = [sorted[i]]
    }
  }
  if (row.length > 0) {
    const { rects } = layoutRow(row, rect, isHoriz)
    allRects.push(...rects)
  }
  return allRects
}

/* ── House layout engine ─────────────────────────────────────────────────── */
const CORRIDOR_FT = 4

function layoutHouse(rooms, footprintSF, stories) {
  if (!rooms || rooms.length === 0) return { floors: [], footW: 0, footH: 0 }
  const footW = Math.sqrt(footprintSF * 1.3)
  const footH = footprintSF / footW

  // Classify rooms into zones
  const zoned = rooms.map(r => ({ ...r, zone: getZone(r.name), area: r.targetSF || 100 }))

  // Separate by floor
  const byFloor = {}
  zoned.forEach(r => { const f = r.floor || 1; (byFloor[f] = byFloor[f] || []).push(r) })

  const floors = []

  for (const [floorNum, floorRooms] of Object.entries(byFloor)) {
    const fn = parseInt(floorNum)
    const social = floorRooms.filter(r => r.zone === 'social')
    const service = floorRooms.filter(r => r.zone === 'service')
    const priv = floorRooms.filter(r => r.zone === 'private')

    // For 2-story: floor 1 = social+service, floor 2 = private
    // For 1-story: all zones on same floor
    const topZone = social.length > 0 ? social : priv
    const botZone = priv.length > 0 && social.length > 0 ? [...priv, ...service] : service

    const totalArea = floorRooms.reduce((s, r) => s + r.area, 0)
    const topArea = topZone.reduce((s, r) => s + r.area, 0)
    const botArea = botZone.reduce((s, r) => s + r.area, 0)
    const topFrac = topArea / (totalArea || 1)
    const botFrac = botArea / (totalArea || 1)

    const corridorH = CORRIDOR_FT
    const usableH = footH - corridorH
    const topH = usableH * (topFrac / (topFrac + botFrac || 1))
    const botH = usableH - topH

    const rects = []
    // Top zone (social, front of house)
    if (topZone.length > 0) {
      const treemapItems = topZone.map(r => ({ name: r.name, area: r.area, zone: r.zone }))
      const placed = squarify(treemapItems, { x: 0, y: 0, w: footW, h: topH })
      rects.push(...placed)
    }

    // Corridor
    const corridorY = topH
    rects.push({ name: 'Corridor', area: footW * corridorH, zone: 'corridor', x: 0, y: corridorY, w: footW, h: corridorH })

    // Bottom zone (private, back of house)
    if (botZone.length > 0) {
      const treemapItems = botZone.map(r => ({ name: r.name, area: r.area, zone: r.zone }))
      const placed = squarify(treemapItems, { x: 0, y: corridorY + corridorH, w: footW, h: botH })
      rects.push(...placed)
    }

    floors.push({ floor: fn, rects, width: footW, height: footH })
  }

  return { floors, footW, footH }
}

/* ── 2D SVG Floor Plan ───────────────────────────────────────────────────── */
function FloorPlan2D({ layout }) {
  const rooms = layout?.rooms || []
  const footprintSF = layout?.footprintSF || layout?.totalSF || 1200
  const stories = layout?.stories || 1
  const { floors, footW, footH } = layoutHouse(rooms, footprintSF, stories)
  if (floors.length === 0) return null

  const WALL_EXT = 3, WALL_INT = 1.5, DOOR_GAP = 2.5
  const PORCH_W = 6, PORCH_H = 4, PAD = 12, SCALE_BAR = 10

  return (
    <div className={`grid gap-3 ${floors.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {floors.map(({ floor, rects, width: fw, height: fh }) => {
        const svgW = fw + PAD * 2
        const svgH = fh + PAD * 2 + PORCH_H + 4
        const ox = PAD, oy = PAD // origin offset

        // Find living room or first social room for front door
        const socialRects = rects.filter(r => r.zone === 'social')
        const livingRoom = socialRects.find(r => r.name === 'Living Room') || socialRects[0]
        const corridorRect = rects.find(r => r.name === 'Corridor')
        const corridorY = corridorRect ? corridorRect.y : fh * 0.45

        return (
          <div key={floor} className="bg-gray-900/60 rounded-lg p-2">
            <p className="text-xs text-gray-400 mb-1 text-center font-semibold tracking-wide">
              Floor {floor}{floor === 1 && floors.length === 1 ? '' : floor === 1 ? ' — Social' : ' — Private'}
            </p>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 340 }}>
              {/* Floor background */}
              <rect x={ox} y={oy} width={fw} height={fh} fill="#0c1220" rx="1" />

              {/* Room fills */}
              {rects.map((r, i) => {
                const zc = ZONE_COLORS[r.zone] || ZONE_COLORS.service
                return (
                  <rect key={`fill-${i}`} x={ox + r.x} y={oy + r.y}
                    width={r.w} height={r.h} fill={zc.fill} />
                )
              })}

              {/* Interior walls */}
              {rects.filter(r => r.name !== 'Corridor').map((r, i) => (
                <rect key={`iwall-${i}`} x={ox + r.x} y={oy + r.y}
                  width={r.w} height={r.h} fill="none"
                  stroke="#374151" strokeWidth={WALL_INT} />
              ))}

              {/* Exterior walls */}
              <rect x={ox} y={oy} width={fw} height={fh}
                fill="none" stroke="#1e293b" strokeWidth={WALL_EXT} />

              {/* Door gaps on corridor walls */}
              {corridorRect && rects.filter(r => r.name !== 'Corridor').map((r, i) => {
                const zc = ZONE_COLORS[r.zone] || ZONE_COLORS.service
                const doorX = ox + r.x + r.w / 2 - DOOR_GAP / 2
                const isAbove = r.y + r.h <= corridorRect.y + 0.5
                const isBelow = r.y >= corridorRect.y + corridorRect.h - 0.5
                if (!isAbove && !isBelow) return null
                const doorY = isAbove ? oy + corridorRect.y : oy + corridorRect.y + corridorRect.h
                return (
                  <g key={`door-${i}`}>
                    {/* door gap */}
                    <line x1={doorX} y1={doorY} x2={doorX + DOOR_GAP} y2={doorY}
                      stroke={ZONE_COLORS.corridor.fill} strokeWidth={WALL_INT + 0.5} />
                    {/* door arc */}
                    <path d={`M ${doorX} ${doorY} A ${DOOR_GAP} ${DOOR_GAP} 0 0 ${isAbove ? 1 : 0} ${doorX + DOOR_GAP} ${doorY}`}
                      fill="none" stroke={zc.stroke} strokeWidth={0.4}
                      strokeDasharray="1.5,1" opacity={0.5} />
                  </g>
                )
              })}

              {/* Front door + porch */}
              {livingRoom && floor === 1 && (
                <g>
                  {/* Porch rectangle */}
                  <rect x={ox + livingRoom.x + livingRoom.w / 2 - PORCH_W / 2}
                    y={oy + fh} width={PORCH_W} height={PORCH_H}
                    fill="#1a1a2e" stroke="#6b7280" strokeWidth={0.8} strokeDasharray="2,1" />
                  {/* Door gap in exterior wall */}
                  <line x1={ox + livingRoom.x + livingRoom.w / 2 - DOOR_GAP / 2} y1={oy + fh}
                    x2={ox + livingRoom.x + livingRoom.w / 2 + DOOR_GAP / 2} y2={oy + fh}
                    stroke="#0c1220" strokeWidth={WALL_EXT + 1} />
                  {/* Door swing */}
                  <path d={`M ${ox + livingRoom.x + livingRoom.w / 2 - DOOR_GAP / 2} ${oy + fh}
                    A ${DOOR_GAP} ${DOOR_GAP} 0 0 1
                    ${ox + livingRoom.x + livingRoom.w / 2 + DOOR_GAP / 2} ${oy + fh}`}
                    fill="none" stroke="#2dd4bf" strokeWidth={0.5} strokeDasharray="1.2,0.8" />
                  {/* Entry label */}
                  <text x={ox + livingRoom.x + livingRoom.w / 2} y={oy + fh + PORCH_H - 0.8}
                    textAnchor="middle" fill="#9ca3af" fontSize={2} fontWeight="500">ENTRY</text>
                </g>
              )}

              {/* Room labels */}
              {rects.filter(r => r.name !== 'Corridor').map((r, i) => {
                const zc = ZONE_COLORS[r.zone] || ZONE_COLORS.service
                const cx = ox + r.x + r.w / 2
                const cy = oy + r.y + r.h / 2
                const fontSize = Math.max(1.8, Math.min(r.w / 5.5, r.h / 4, 3.8))
                const dimW = Math.round(r.w * 10) / 10
                const dimH = Math.round(r.h * 10) / 10
                const shortName = r.name.replace('Primary ', 'Prim. ').replace('Hallway / Circulation', 'Hall')
                return (
                  <g key={`label-${i}`}>
                    <text x={cx} y={cy - fontSize * 0.6} textAnchor="middle" dominantBaseline="middle"
                      fill={zc.text} fontSize={fontSize} fontWeight="700">{shortName}</text>
                    <text x={cx} y={cy + fontSize * 0.6} textAnchor="middle" dominantBaseline="middle"
                      fill={zc.text} fontSize={fontSize * 0.72} opacity={0.7}>
                      {Math.round(r.area)} SF</text>
                    <text x={cx} y={oy + r.y + r.h - fontSize * 0.35} textAnchor="middle"
                      dominantBaseline="middle" fill={zc.text} fontSize={fontSize * 0.55} opacity={0.4}>
                      {dimW.toFixed(0)}&times;{dimH.toFixed(0)} ft</text>
                  </g>
                )
              })}

              {/* Corridor label */}
              {corridorRect && (
                <text x={ox + corridorRect.x + corridorRect.w / 2}
                  y={oy + corridorRect.y + corridorRect.h / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={ZONE_COLORS.corridor.text} fontSize={2} fontWeight="500" letterSpacing="2">
                  CORRIDOR</text>
              )}

              {/* North arrow */}
              <g transform={`translate(${svgW - PAD + 4}, ${oy + 6})`}>
                <line x1={0} y1={4} x2={0} y2={-4} stroke="#9ca3af" strokeWidth={0.6} />
                <polygon points="0,-4 -1.2,-1.5 1.2,-1.5" fill="#9ca3af" />
                <text x={0} y={-5.5} textAnchor="middle" fill="#9ca3af" fontSize={2.2} fontWeight="700">N</text>
              </g>

              {/* Scale bar */}
              <g transform={`translate(${ox + 2}, ${svgH - 5})`}>
                <line x1={0} y1={0} x2={SCALE_BAR} y2={0} stroke="#9ca3af" strokeWidth={0.6} />
                <line x1={0} y1={-1} x2={0} y2={1} stroke="#9ca3af" strokeWidth={0.5} />
                <line x1={SCALE_BAR} y1={-1} x2={SCALE_BAR} y2={1} stroke="#9ca3af" strokeWidth={0.5} />
                <text x={SCALE_BAR / 2} y={-1.5} textAnchor="middle" fill="#9ca3af" fontSize={1.8}>
                  {SCALE_BAR} ft</text>
              </g>
            </svg>
          </div>
        )
      })}
    </div>
  )
}

/* ── 3D Box Model (Canvas) ───────────────────────────────────────────────── */
function FloorPlan3D({ layout }) {
  const canvasRef = useRef(null)
  const [rotation, setRotation] = useState({ x: 30, y: -35 })
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 })

  const rooms = layout?.rooms || []
  const footprintSF = layout?.footprintSF || layout?.totalSF || 1200
  const { floors, footW, footH } = layoutHouse(rooms, footprintSF, layout?.stories || 1)

  // Flatten all rects with floor info
  const allRects = []
  for (const f of floors) {
    for (const r of f.rects) {
      allRects.push({ ...r, floor: f.floor })
    }
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || allRects.length === 0) return
    const parent = canvas.parentElement
    const W = parent.clientWidth
    const H = Math.round(W * 0.55)
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr; canvas.height = H * dpr
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2
    const scale = Math.min(W, H) * 0.25 / Math.max(footW, footH, 1)
    const floorHt = 12

    const radX = rotation.x * Math.PI / 180
    const radY = rotation.y * Math.PI / 180
    const cosX = Math.cos(radX), sinX = Math.sin(radX)
    const cosY = Math.cos(radY), sinY = Math.sin(radY)

    function proj(x, y, z) {
      const rx = (x - footW / 2) * cosY - (y - footH / 2) * sinY
      const ry = ((x - footW / 2) * sinY + (y - footH / 2) * cosY) * cosX - z * sinX
      const rz = ((x - footW / 2) * sinY + (y - footH / 2) * cosY) * sinX + z * cosX
      return { x: cx + rx * scale, y: cy - ry * scale, z: rz }
    }

    const quads = []
    for (const r of allRects) {
      const zc = ZONE_COLORS[r.zone] || ZONE_COLORS.service
      const z0 = (r.floor - 1) * floorHt
      const z1 = r.floor * floorHt
      const x0 = r.x, x1 = r.x + r.w, y0 = r.y, y1 = r.y + r.h

      const tl = proj(x0, y0, z1), tr = proj(x1, y0, z1)
      const br = proj(x1, y1, z1), bl = proj(x0, y1, z1)
      quads.push({ pts: [tl, tr, br, bl], z: (tl.z + br.z) / 2, color: zc.fill, stroke: zc.stroke, name: r.name, type: 'top' })

      const ftl = proj(x0, y1, z1), ftr = proj(x1, y1, z1)
      const fbr = proj(x1, y1, z0), fbl = proj(x0, y1, z0)
      quads.push({ pts: [ftl, ftr, fbr, fbl], z: (ftl.z + fbr.z) / 2, color: zc.fill, stroke: zc.stroke, type: 'front' })

      const rtl = proj(x1, y0, z1), rtr = proj(x1, y1, z1)
      const rbr = proj(x1, y1, z0), rbl = proj(x1, y0, z0)
      quads.push({ pts: [rtl, rtr, rbr, rbl], z: (rtl.z + rbr.z) / 2, color: zc.fill, stroke: zc.stroke, type: 'side' })
    }

    quads.sort((a, b) => a.z - b.z)

    for (const q of quads) {
      ctx.beginPath()
      ctx.moveTo(q.pts[0].x, q.pts[0].y)
      for (let i = 1; i < q.pts.length; i++) ctx.lineTo(q.pts[i].x, q.pts[i].y)
      ctx.closePath()
      const brightness = q.type === 'top' ? 1.0 : q.type === 'front' ? 0.7 : 0.5
      ctx.fillStyle = q.color
      ctx.globalAlpha = brightness
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.strokeStyle = q.stroke
      ctx.lineWidth = 0.5
      ctx.stroke()

      if (q.type === 'top' && q.name && q.name !== 'Corridor') {
        const midX = q.pts.reduce((s, p) => s + p.x, 0) / 4
        const midY = q.pts.reduce((s, p) => s + p.y, 0) / 4
        ctx.fillStyle = '#fff'
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(q.name.replace('Primary ', 'P.').replace('Hallway / Circulation', 'Hall'), midX, midY)
      }
    }

    ctx.fillStyle = 'rgba(156,163,175,0.4)'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('Drag to rotate', W - 8, H - 6)
  }, [allRects, footW, footH, rotation])

  useEffect(() => { draw() }, [draw])

  const onMouseDown = e => { dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY } }
  const onMouseMove = e => {
    if (!dragRef.current.active) return
    setRotation(prev => ({
      x: Math.max(5, Math.min(85, prev.x + (e.clientY - dragRef.current.lastY) * 0.5)),
      y: prev.y + (e.clientX - dragRef.current.lastX) * 0.5,
    }))
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
  }
  const onMouseUp = () => { dragRef.current.active = false }

  if (allRects.length === 0) return null

  return (
    <canvas ref={canvasRef}
      className="w-full rounded border border-gray-700 cursor-grab active:cursor-grabbing"
      style={{ background: '#0f172a' }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
    />
  )
}

/* ── Main Export ──────────────────────────────────────────────────────────── */
export default function FloorPlanView({ layout, onSelectLayout }) {
  const [view, setView] = useState('2d')

  if (!layout?.rooms || !Array.isArray(layout.rooms) || layout.rooms.length === 0) return null

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-400">Floor Plan — {layout.name}</h3>
        <div className="flex gap-1">
          <button onClick={() => setView('2d')}
            className={`text-xs px-2 py-0.5 rounded ${view === '2d' ? 'bg-teal-800 text-teal-200' : 'bg-gray-700 text-gray-400'}`}>
            2D Plan
          </button>
          <button onClick={() => setView('3d')}
            className={`text-xs px-2 py-0.5 rounded ${view === '3d' ? 'bg-teal-800 text-teal-200' : 'bg-gray-700 text-gray-400'}`}>
            3D Model
          </button>
        </div>
      </div>
      {view === '2d' && <FloorPlan2D layout={layout} />}
      {view === '3d' && <FloorPlan3D layout={layout} />}
    </div>
  )
}
