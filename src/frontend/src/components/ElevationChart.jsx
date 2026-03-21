import { useState, useRef, useEffect, useCallback } from 'react'
import maplibregl from 'maplibre-gl'

// ── helpers ───────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

function elevColorRaw(elev, minElev, range) {
  const t = Math.max(0, Math.min(1, (elev - minElev) / (range || 1)))
  if (t < 0.25) { const s = t / 0.25;      return [lerp(30,0,s), lerp(100,180,s), lerp(200,160,s)] }
  if (t < 0.50) { const s = (t-0.25)/0.25; return [lerp(0,80,s), lerp(180,200,s), lerp(160,80,s)] }
  if (t < 0.75) { const s = (t-0.50)/0.25; return [lerp(80,220,s), lerp(200,200,s), lerp(80,30,s)] }
  const s = (t-0.75)/0.25; return [lerp(220,200,s), lerp(200,40,s), lerp(30,40,s)]
}

function bilinearSample(grid, gx, gy) {
  const rows = grid.length, cols = grid[0].length
  const x0 = Math.min(Math.floor(gx), cols - 1), y0 = Math.min(Math.floor(gy), rows - 1)
  const x1 = Math.min(x0 + 1, cols - 1), y1 = Math.min(y0 + 1, rows - 1)
  const fx = gx - x0, fy = gy - y0
  return grid[y0][x0] * (1-fx) * (1-fy) + grid[y0][x1] * fx * (1-fy) +
         grid[y1][x0] * (1-fx) * fy      + grid[y1][x1] * fx * fy
}

function geoSpans(bbox) {
  const lonFt = (bbox[2] - bbox[0]) * 91000 * 3.281
  const latFt = (bbox[3] - bbox[1]) * 111000 * 3.281
  return { lonFt, latFt, aspect: lonFt / latFt }
}

// ── terrain summary ───────────────────────────────────────────────────────────
function TerrainSummary({ grid, bbox, minElev, maxElev, range }) {
  const rows = grid.length, cols = grid[0].length
  const north = grid[rows - 1].reduce((a, b) => a + b, 0) / cols
  const south = grid[0].reduce((a, b) => a + b, 0) / cols
  const west = grid.reduce((a, row) => a + row[0], 0) / rows
  const east = grid.reduce((a, row) => a + row[cols - 1], 0) / rows

  const edges = { north, south, east, west }
  const sorted = Object.entries(edges).sort((a, b) => b[1] - a[1])
  const highest = sorted[0][0]
  const lowest = sorted[sorted.length - 1][0]

  const { lonFt, latFt } = geoSpans(bbox)
  const diagFt = Math.sqrt(lonFt ** 2 + latFt ** 2)
  const gradePct = ((range / diagFt) * 100).toFixed(1)

  let slopeWord = 'nearly flat'
  if (gradePct >= 10) slopeWord = 'slopes steeply'
  else if (gradePct >= 5) slopeWord = 'slopes moderately'
  else if (gradePct >= 2) slopeWord = 'slopes gently'

  const dirMap = { north: 'northward', south: 'southward', east: 'eastward', west: 'westward' }

  return (
    <div className="bg-gray-700/40 rounded p-2.5 mb-3 text-xs text-gray-300 leading-relaxed">
      <p>This lot {slopeWord} {dirMap[lowest]} — {Math.round(range)} ft of rise over {Math.round(diagFt)} ft ({gradePct}% grade)</p>
      <p className="text-gray-400 mt-0.5">
        Highest: {highest.toUpperCase()} edge ({Math.round(edges[highest])} ft) · Lowest: {lowest.toUpperCase()} edge ({Math.round(edges[lowest])} ft)
      </p>
    </div>
  )
}

// ── contour engine ────────────────────────────────────────────────────────────
//
// 1. Upsample grid with bilinear interpolation → smoother contours on coarse grids
// 2. Marching squares → extract raw segments
// 3. Chain segments into polylines → connect adjacent segments sharing endpoints
// 4. Catmull-Rom spline smoothing → eliminate jaggedness
// 5. Contour intervals: standard civil engineering (1, 2, 5, 10, 20, 50 ft)

function lerpVal(a, b, threshold) {
  const d = b - a
  return Math.abs(d) < 1e-10 ? 0.5 : Math.max(0, Math.min(1, (threshold - a) / d))
}

// Upsample a grid by factor (e.g., 4x → 8×8 becomes 32×32)
function upsampleGrid(grid, factor) {
  const rows = grid.length, cols = grid[0].length
  const newRows = (rows - 1) * factor + 1
  const newCols = (cols - 1) * factor + 1
  const out = []
  for (let r = 0; r < newRows; r++) {
    const row = []
    for (let c = 0; c < newCols; c++) {
      const gr = r / factor, gc = c / factor
      row.push(bilinearSample(grid, gc, gr))
    }
    out.push(row)
  }
  return out
}

// Pick contour interval — guarantee at least 5 lines from the local data
function computeContourLevels(minElev, maxElev) {
  const range = maxElev - minElev
  if (range < 0.05) return []

  // Standard civil engineering intervals, smallest first
  const niceIntervals = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]

  // Pick the largest interval that still gives >= 5 lines
  let ci = range / 6 // fallback: divide range into 6
  for (let i = niceIntervals.length - 1; i >= 0; i--) {
    const candidate = niceIntervals[i]
    const nLines = Math.floor(range / candidate) - 1
    if (nLines >= 5) { ci = candidate; break }
  }

  // Generate levels snapped to the interval
  const levels = []
  const first = Math.ceil(minElev / ci) * ci
  for (let lv = first; lv <= maxElev; lv += ci) {
    // Include levels within the data range (allow edge proximity)
    if (lv >= minElev && lv <= maxElev) levels.push(Math.round(lv * 100) / 100)
  }

  // Safety: if still < 5, subdivide evenly
  if (levels.length < 5) {
    levels.length = 0
    const step = range / 6
    for (let i = 1; i <= 5; i++) {
      levels.push(Math.round((minElev + step * i) * 10) / 10)
    }
  }

  return levels
}

// Extract raw contour segments from a grid using marching squares
// Returns array of [{ x, y }, { x, y }] segments in grid coordinates
function marchingSquares(grid, threshold) {
  const rows = grid.length, cols = grid[0].length
  const segments = []
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const v0 = grid[r][c], v1 = grid[r][c + 1]
      const v2 = grid[r + 1][c + 1], v3 = grid[r + 1][c]
      const b0 = v0 >= threshold ? 1 : 0, b1 = v1 >= threshold ? 1 : 0
      const b2 = v2 >= threshold ? 1 : 0, b3 = v3 >= threshold ? 1 : 0
      const idx = b0 | (b1 << 1) | (b2 << 2) | (b3 << 3)
      if (idx === 0 || idx === 15) continue

      const tB = lerpVal(v0, v1, threshold)
      const tR = lerpVal(v1, v2, threshold)
      const tT = lerpVal(v3, v2, threshold)
      const tL = lerpVal(v0, v3, threshold)

      const bottom = { x: c + tB, y: r }
      const right  = { x: c + 1,  y: r + tR }
      const top    = { x: c + tT, y: r + 1 }
      const left   = { x: c,      y: r + tL }

      switch (idx) {
        case 1: case 14: segments.push([bottom, left]);   break
        case 2: case 13: segments.push([right,  bottom]); break
        case 3: case 12: segments.push([right,  left]);   break
        case 4: case 11: segments.push([top,    right]);  break
        case 6: case 9:  segments.push([top,    bottom]); break
        case 7: case 8:  segments.push([top,    left]);   break
        case 5: {
          const ctr = (v0 + v1 + v2 + v3) / 4
          if (ctr >= threshold) { segments.push([bottom, right], [top, left]) }
          else                  { segments.push([bottom, left],  [top, right]) }
          break
        }
        case 10: {
          const ctr = (v0 + v1 + v2 + v3) / 4
          if (ctr >= threshold) { segments.push([bottom, left],  [top, right]) }
          else                  { segments.push([bottom, right], [top, left]) }
          break
        }
        default: break
      }
    }
  }
  return segments
}

// Chain segments into polylines by connecting shared endpoints
function chainSegments(segments) {
  if (!segments.length) return []
  const eps = 0.001
  const key = (p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`
  const unused = segments.map(() => true)
  const chains = []

  for (let i = 0; i < segments.length; i++) {
    if (!unused[i]) continue
    unused[i] = false
    const chain = [segments[i][0], segments[i][1]]
    let changed = true
    while (changed) {
      changed = false
      for (let j = 0; j < segments.length; j++) {
        if (!unused[j]) continue
        const [a, b] = segments[j]
        const tail = chain[chain.length - 1]
        const head = chain[0]
        if (Math.abs(a.x - tail.x) < eps && Math.abs(a.y - tail.y) < eps) {
          chain.push(b); unused[j] = false; changed = true
        } else if (Math.abs(b.x - tail.x) < eps && Math.abs(b.y - tail.y) < eps) {
          chain.push(a); unused[j] = false; changed = true
        } else if (Math.abs(b.x - head.x) < eps && Math.abs(b.y - head.y) < eps) {
          chain.unshift(a); unused[j] = false; changed = true
        } else if (Math.abs(a.x - head.x) < eps && Math.abs(a.y - head.y) < eps) {
          chain.unshift(b); unused[j] = false; changed = true
        }
      }
    }
    chains.push(chain)
  }
  return chains
}

// Catmull-Rom spline through a polyline for smoothing
function smoothPolyline(points, subdivisions = 4) {
  if (points.length < 3) return points
  const out = []
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    for (let t = 0; t < subdivisions; t++) {
      const s = t / subdivisions
      const s2 = s * s, s3 = s2 * s
      out.push({
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * s + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * s + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s3),
      })
    }
  }
  out.push(points[points.length - 1])
  return out
}

// Full contour pipeline: upsample → marching squares → chain → smooth → draw
function drawContours(ctx, grid, threshold, canvasW, canvasH) {
  // Upsample 4x for smoother contours on coarse grids
  const upGrid = grid.length <= 20 ? upsampleGrid(grid, 4) : grid
  const uRows = upGrid.length, uCols = upGrid[0].length

  const segments = marchingSquares(upGrid, threshold)
  const chains = chainSegments(segments)

  for (const chain of chains) {
    const smooth = smoothPolyline(chain, 3)
    if (smooth.length < 2) continue
    ctx.moveTo(
      (smooth[0].x / (uCols - 1)) * canvasW,
      (1 - smooth[0].y / (uRows - 1)) * canvasH
    )
    for (let i = 1; i < smooth.length; i++) {
      ctx.lineTo(
        (smooth[i].x / (uCols - 1)) * canvasW,
        (1 - smooth[i].y / (uRows - 1)) * canvasH
      )
    }
  }
}

// Build GeoJSON contour features for the satellite map view
// extendFactor: how many times to extend the grid beyond bbox (1 = original, 20 = 20x)
function buildContourGeoJSON(grid, bbox, minElev, maxElev, range, extendFactor = 1) {
  const rows = grid.length, cols = grid[0].length
  const levels = computeContourLevels(minElev, maxElev)
  if (!levels.length) return { type: 'FeatureCollection', features: [] }

  // Extend the bbox and extrapolate the grid edges
  const lonSpan = bbox[2] - bbox[0], latSpan = bbox[3] - bbox[1]
  const eBbox = [
    bbox[0] - lonSpan * (extendFactor - 1) / 2,
    bbox[1] - latSpan * (extendFactor - 1) / 2,
    bbox[2] + lonSpan * (extendFactor - 1) / 2,
    bbox[3] + latSpan * (extendFactor - 1) / 2,
  ]

  // Build extended grid by clamping edge values (extrapolate flat)
  const extPad = Math.max(1, Math.round((extendFactor - 1) * rows / 2))
  const eRows = rows + extPad * 2, eCols = cols + extPad * 2
  const eGrid = []
  for (let r = 0; r < eRows; r++) {
    const row = []
    for (let c = 0; c < eCols; c++) {
      const gr = Math.min(Math.max(r - extPad, 0), rows - 1)
      const gc = Math.min(Math.max(c - extPad, 0), cols - 1)
      row.push(grid[gr][gc])
    }
    eGrid.push(row)
  }

  // Upsample for smoothness
  const upGrid = eGrid[0].length <= 40 ? upsampleGrid(eGrid, 4) : eGrid
  const uRows = upGrid.length, uCols = upGrid[0].length

  // Convert upsampled grid coords to lng/lat within extended bbox
  const toLng = (c) => eBbox[0] + (c / (uCols - 1)) * (eBbox[2] - eBbox[0])
  const toLat = (r) => eBbox[1] + (r / (uRows - 1)) * (eBbox[3] - eBbox[1])

  const features = []
  for (let li = 0; li < levels.length; li++) {
    const level = levels[li]
    const isIndex = levels.length <= 4 || li % Math.max(1, Math.floor(levels.length / 3)) === 0
    const segments = marchingSquares(upGrid, level)
    const chains = chainSegments(segments)

    for (const chain of chains) {
      const smooth = smoothPolyline(chain, 3)
      if (smooth.length < 2) continue
      const coords = smooth.map(p => [toLng(p.x), toLat(p.y)])
      features.push({
        type: 'Feature',
        properties: { elevation: Math.round(level * 10) / 10, isIndex },
        geometry: { type: 'LineString', coordinates: coords },
      })
    }
  }
  return { type: 'FeatureCollection', features }
}

// ── satellite + contour view (interactive zoom/pan via MapLibre) ──────────────
function SatelliteContour({ grid, bbox, minElev, maxElev, range, polygon }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const { aspect } = geoSpans(bbox)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
        sources: {
          esri: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: 'Esri',
          },
        },
        layers: [{ id: 'esri-sat', type: 'raster', source: 'esri',
          paint: { 'raster-opacity': 0.8 },
        }],
      },
      bounds: [bbox[0], bbox[1], bbox[2], bbox[3]],
      fitBoundsOptions: { padding: 8 },
      interactive: true,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')

    // Build smooth contour GeoJSON extended 20x beyond bbox
    map.on('load', () => {
      const geojson = buildContourGeoJSON(grid, bbox, minElev, maxElev, range, 20)

      map.addSource('contours', { type: 'geojson', data: geojson })

      // Black contour lines — index contours thicker
      map.addLayer({
        id: 'contours-line', type: 'line', source: 'contours',
        paint: {
          'line-color': '#000000',
          'line-width': ['case', ['get', 'isIndex'], 2.0, 0.8],
          'line-opacity': ['case', ['get', 'isIndex'], 1.0, 0.6],
        },
      })

      // Elevation labels on ALL contour lines — placed along the line
      map.addLayer({
        id: 'contours-labels', type: 'symbol', source: 'contours',
        layout: {
          'symbol-placement': 'line-center',
          'text-field': ['concat', ['to-string', ['get', 'elevation']], '\''],
          'text-size': 14,
          'text-font': ['Open Sans Bold'],
          'text-max-angle': 45,
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-keep-upright': true,
          'text-anchor': 'center',
          'text-padding': 30,
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
      })

      // Draw the user's input polygon boundary
      if (polygon && polygon.coordinates) {
        map.addSource('parcel', {
          type: 'geojson',
          data: { type: 'Feature', geometry: polygon, properties: {} },
        })
        map.addLayer({
          id: 'parcel-outline', type: 'line', source: 'parcel',
          paint: { 'line-color': '#00e5ff', 'line-width': 3, 'line-dasharray': [3, 2] },
        })
        map.addLayer({
          id: 'parcel-fill', type: 'fill', source: 'parcel',
          paint: { 'fill-color': '#00e5ff', 'fill-opacity': 0.08 },
        })
      }
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [bbox, grid, minElev, maxElev, range, polygon])

  return (
    <div className="relative rounded overflow-hidden border border-gray-700"
         style={{ aspectRatio: Math.max(0.5, Math.min(2.5, aspect)).toFixed(2) }}>
      <div ref={containerRef} className="w-full h-full" />
      <p className="absolute bottom-1 left-2 text-[9px] text-white/50 pointer-events-none">Scroll to zoom · Drag to pan</p>
    </div>
  )
}

// ── canvas heatmap with zoom/pan + correct aspect ratio ──────────────────────
function Heatmap2D({ grid, bbox, minElev, maxElev, avgElev, range, polygon }) {
  const canvasRef = useRef(null)
  const { lonFt, latFt, aspect } = geoSpans(bbox)
  const rows = grid.length, cols = grid[0].length
  const cellW = Math.round(lonFt / cols), cellH = Math.round(latFt / rows)

  // Zoom/pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    const W = parent.clientWidth
    const H = Math.round(W / Math.max(0.5, Math.min(2.5, aspect)))
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // Apply zoom and pan transform
    ctx.save()
    ctx.translate(W / 2 + pan.x, H / 2 + pan.y)
    ctx.scale(zoom, zoom)
    ctx.translate(-W / 2, -H / 2)

    // Heatmap extended 20x so it fills the view when zoomed out
    const extFactor = 20
    const extPad = Math.max(1, Math.round((extFactor - 1) * rows / 2))
    const eRows = rows + extPad * 2, eCols = cols + extPad * 2
    const eGrid = []
    for (let er = 0; er < eRows; er++) {
      const row = []
      for (let ec = 0; ec < eCols; ec++) {
        const gr = Math.min(Math.max(er - extPad, 0), rows - 1)
        const gc = Math.min(Math.max(ec - extPad, 0), cols - 1)
        row.push(grid[gr][gc])
      }
      eGrid.push(row)
    }

    const extW = W * extFactor, extH = H * extFactor
    const offsetX = -W * (extFactor - 1) / 2
    const offsetY = -H * (extFactor - 1) / 2

    // Render extended heatmap (no contours — clean color field)
    const imgData = ctx.createImageData(W, H)
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const gx = ((px - offsetX) / extW) * (eCols - 1)
        const gy = (1 - (py - offsetY) / extH) * (eRows - 1)
        const elev = bilinearSample(eGrid, Math.max(0, Math.min(eCols - 1, gx)), Math.max(0, Math.min(eRows - 1, gy)))
        const [r, g, b] = elevColorRaw(elev, minElev, range)
        const idx = (py * W + px) * 4
        imgData.data[idx] = r; imgData.data[idx + 1] = g
        imgData.data[idx + 2] = b; imgData.data[idx + 3] = 230
      }
    }

    const tmp = document.createElement('canvas')
    tmp.width = W; tmp.height = H
    tmp.getContext('2d').putImageData(imgData, 0, 0)
    ctx.drawImage(tmp, 0, 0, W, H)

    // Draw polygon boundary on heatmap
    if (polygon && polygon.coordinates) {
      const coords = polygon.coordinates[0]
      // Map lng/lat to canvas pixels (within the extended grid space)
      const lonMin = bbox[0] - (bbox[2] - bbox[0]) * (extFactor - 1) / 2
      const latMin = bbox[1] - (bbox[3] - bbox[1]) * (extFactor - 1) / 2
      const lonMax = bbox[2] + (bbox[2] - bbox[0]) * (extFactor - 1) / 2
      const latMax = bbox[3] + (bbox[3] - bbox[1]) * (extFactor - 1) / 2
      const toLngPx = (lng) => ((lng - lonMin) / (lonMax - lonMin)) * extW + offsetX
      const toLatPx = (lat) => (1 - (lat - latMin) / (latMax - latMin)) * extH + offsetY

      ctx.beginPath()
      ctx.moveTo(toLngPx(coords[0][0]), toLatPx(coords[0][1]))
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(toLngPx(coords[i][0]), toLatPx(coords[i][1]))
      }
      ctx.closePath()
      ctx.strokeStyle = '#00e5ff'
      ctx.lineWidth = 2.5 / zoom
      ctx.setLineDash([8 / zoom, 4 / zoom])
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(0,229,255,0.06)'
      ctx.fill()
    }

    // Compass labels
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('N', W / 2, 12)
    ctx.fillText('S', W / 2, H - 4)
    ctx.textAlign = 'left';  ctx.fillText('W', 4, H / 2)
    ctx.textAlign = 'right'; ctx.fillText('E', W - 4, H / 2)

    ctx.restore()

    // Zoom indicator (outside transform)
    if (zoom !== 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(4, 4, 50, 16)
      ctx.fillStyle = '#fff'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`${zoom.toFixed(1)}x`, 8, 15)
    }

    // Hint
    ctx.fillStyle = 'rgba(156,163,175,0.4)'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('Scroll to zoom · Drag to pan · Double-click reset', W - 6, H - 4)

  }, [grid, bbox, minElev, maxElev, range, aspect, rows, cols, zoom, pan])

  useEffect(() => { draw() }, [draw])

  const onMouseDown = (e) => { dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY } }
  const onMouseMove = (e) => {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.lastX
    const dy = e.clientY - dragRef.current.lastY
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
  }
  const onMouseUp = () => { dragRef.current.active = false }
  const onDoubleClick = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // Native wheel listener with passive:false so preventDefault works
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const handler = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setZoom(prev => Math.max(0.5, Math.min(8, prev * (1 - e.deltaY * 0.001))))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  return (
    <>
      <p className="text-xs text-gray-500 mb-3">
        {cols}x{rows} grid · {cellW}x{cellH} ft/cell · Relief: {Math.round(range)} ft
      </p>
      <div className="w-full">
        <canvas ref={canvasRef}
          className="w-full rounded border border-gray-700 cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onDoubleClick={onDoubleClick}
        />
      </div>
      <LegendBar minElev={minElev} maxElev={maxElev} avgElev={avgElev} />
    </>
  )
}

// ── interactive 3D surface — smooth, extended 20x, satellite textured ─────────
function Surface3D({ grid, bbox, minElev, maxElev, range, polygon }) {
  const canvasRef = useRef(null)
  const satImgRef = useRef(null)
  const [rotation, setRotation] = useState({ x: 35, y: -30 })
  const [zoom, setZoom] = useState(1)
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 })
  const { aspect } = geoSpans(bbox)

  // Load satellite tile as texture — preserve geographic aspect ratio
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const lonSpan = bbox[2] - bbox[0], latSpan = bbox[3] - bbox[1]
    const eBbox = [
      bbox[0] - lonSpan * 2, bbox[1] - latSpan * 2,
      bbox[2] + lonSpan * 2, bbox[3] + latSpan * 2,
    ]
    // Compute pixel dimensions preserving the geographic aspect ratio
    const geoW = (eBbox[2] - eBbox[0]) * 91000 // approx meters lon
    const geoH = (eBbox[3] - eBbox[1]) * 111000 // approx meters lat
    const geoRatio = geoW / geoH
    const maxPx = 800
    const imgW = geoRatio >= 1 ? maxPx : Math.round(maxPx * geoRatio)
    const imgH = geoRatio >= 1 ? Math.round(maxPx / geoRatio) : maxPx
    const exportUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${eBbox[0]},${eBbox[1]},${eBbox[2]},${eBbox[3]}&bboxSR=4326&size=${imgW},${imgH}&format=png&f=image`
    img.src = exportUrl
    img.onload = () => { satImgRef.current = img }
    img.onerror = () => { satImgRef.current = null }
  }, [bbox])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    const W = parent.clientWidth
    const H = Math.round(W * 0.6)
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr; canvas.height = H * dpr
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    // Build extended grid (5x for 3D — 20x would be too many quads)
    const origRows = grid.length, origCols = grid[0].length
    const extFactor = 3
    const extPad = Math.max(1, Math.round((extFactor - 1) * origRows / 2))
    const eGrid = []
    for (let er = 0; er < origRows + extPad * 2; er++) {
      const row = []
      for (let ec = 0; ec < origCols + extPad * 2; ec++) {
        const gr = Math.min(Math.max(er - extPad, 0), origRows - 1)
        const gc = Math.min(Math.max(ec - extPad, 0), origCols - 1)
        row.push(grid[gr][gc])
      }
      eGrid.push(row)
    }

    // Upsample 6x for very smooth surface (8×8 → 48×48 = 2,209 quads — still fast)
    const upFactor = 10
    const sGrid = upsampleGrid(eGrid, upFactor)
    const rows = sGrid.length, cols = sGrid[0].length

    const cxC = W / 2, cyC = H / 2
    const scale = zoom * Math.min(W, H) * 0.3
    const geoAspect = Math.max(0.5, Math.min(2.5, aspect))

    const radX = rotation.x * Math.PI / 180
    const radY = rotation.y * Math.PI / 180
    const cosX = Math.cos(radX), sinX = Math.sin(radX)
    const cosY = Math.cos(radY), sinY = Math.sin(radY)

    function proj(col, row, elev) {
      const x3d = (col / (cols - 1) - 0.5) * geoAspect
      const y3d = (row / (rows - 1) - 0.5)
      const z3d = ((elev - minElev) / (range || 1) - 0.5) * 0.35
      const rx = x3d * cosY - y3d * sinY
      const ry1 = x3d * sinY + y3d * cosY
      const ry = ry1 * cosX - z3d * sinX
      const rz = ry1 * sinX + z3d * cosX
      return { x: cxC + rx * scale, y: cyC - ry * scale, z: rz }
    }

    // Pre-compute satellite image pixel data for fast sampling
    const satImg = satImgRef.current
    let satPixels = null, satW = 0, satH = 0
    if (satImg) {
      const sc = document.createElement('canvas')
      sc.width = satImg.width; sc.height = satImg.height
      const sctx = sc.getContext('2d')
      sctx.drawImage(satImg, 0, 0)
      satPixels = sctx.getImageData(0, 0, satImg.width, satImg.height).data
      satW = satImg.width; satH = satImg.height
    }

    function getColor(col, row, elev) {
      // Sample satellite + blend with elevation tint
      if (satPixels) {
        const u = col / (cols - 1), v = 1 - row / (rows - 1)
        const px = Math.min(Math.floor(u * (satW - 1)), satW - 1)
        const py = Math.min(Math.floor(v * (satH - 1)), satH - 1)
        const i = (py * satW + px) * 4
        const sr = satPixels[i], sg = satPixels[i + 1], sb = satPixels[i + 2]
        const [er, eg, eb] = elevColorRaw(elev, minElev, range)
        // 70% satellite, 30% elevation for depth
        return `rgb(${Math.round(sr * 0.7 + er * 0.3)},${Math.round(sg * 0.7 + eg * 0.3)},${Math.round(sb * 0.7 + eb * 0.3)})`
      }
      const [r, g, b] = elevColorRaw(elev, minElev, range)
      return `rgb(${r},${g},${b})`
    }

    // Build triangles — adaptive step for performance (cap ~5000 quads max)
    const maxQuads = 5000
    const totalCells = (rows - 1) * (cols - 1)
    const step = Math.max(1, Math.ceil(Math.sqrt(totalCells / maxQuads)))
    const tris = []
    for (let r = 0; r < rows - step; r += step) {
      for (let c = 0; c < cols - step; c += step) {
        const r2 = Math.min(r + step, rows - 1), c2 = Math.min(c + step, cols - 1)
        const p00 = proj(c, r, sGrid[r][c])
        const p10 = proj(c2, r, sGrid[r][c2])
        const p11 = proj(c2, r2, sGrid[r2][c2])
        const p01 = proj(c, r2, sGrid[r2][c])

        // Triangle 1: p00, p10, p11
        const z1 = (p00.z + p10.z + p11.z) / 3
        const e1 = (sGrid[r][c] + sGrid[r][c2] + sGrid[r2][c2]) / 3
        tris.push({ pts: [p00, p10, p11], z: z1, elev: e1, gc: (c + c2 + c2) / 3, gr: (r + r + r2) / 3 })

        // Triangle 2: p00, p11, p01
        const z2 = (p00.z + p11.z + p01.z) / 3
        const e2 = (sGrid[r][c] + sGrid[r2][c2] + sGrid[r2][c]) / 3
        tris.push({ pts: [p00, p11, p01], z: z2, elev: e2, gc: (c + c2 + c) / 3, gr: (r + r2 + r2) / 3 })
      }
    }

    // Painter's algorithm
    tris.sort((a, b) => a.z - b.z)

    for (const { pts, elev, gc, gr } of tris) {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      ctx.lineTo(pts[1].x, pts[1].y)
      ctx.lineTo(pts[2].x, pts[2].y)
      ctx.closePath()
      ctx.fillStyle = getColor(gc, gr, elev)
      ctx.fill()
      // No stroke — seamless surface
    }

    // Draw polygon boundary projected onto the 3D terrain
    if (polygon && polygon.coordinates) {
      const coords = polygon.coordinates[0]
      // The extended grid maps from eBbox to (0..cols-1, 0..rows-1)
      // Original bbox sits in the center of the extended grid
      // extPad cells on each side
      const lonMin = bbox[0] - (bbox[2] - bbox[0]) * (extFactor - 1) / 2
      const latMin = bbox[1] - (bbox[3] - bbox[1]) * (extFactor - 1) / 2
      const lonMax = bbox[2] + (bbox[2] - bbox[0]) * (extFactor - 1) / 2
      const latMax = bbox[3] + (bbox[3] - bbox[1]) * (extFactor - 1) / 2

      // Convert polygon lng/lat to grid col/row, sample elevation, project to 3D
      const projCoords = coords.map(([lng, lat]) => {
        const gc = ((lng - lonMin) / (lonMax - lonMin)) * (cols - 1)
        const gr = ((lat - latMin) / (latMax - latMin)) * (rows - 1)
        const gcC = Math.max(0, Math.min(cols - 1, gc))
        const grC = Math.max(0, Math.min(rows - 1, gr))
        const elev = bilinearSample(sGrid, gcC, grC)
        return proj(gc, gr, elev)
      })

      if (projCoords.length > 1) {
        // Draw dashed cyan boundary on the 3D surface
        ctx.beginPath()
        ctx.moveTo(projCoords[0].x, projCoords[0].y)
        for (let i = 1; i < projCoords.length; i++) {
          ctx.lineTo(projCoords[i].x, projCoords[i].y)
        }
        ctx.closePath()
        ctx.strokeStyle = '#00e5ff'
        ctx.lineWidth = 2.5
        ctx.setLineDash([6, 3])
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // Axis labels
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    const pS = proj(Math.floor(cols / 2), 0, minElev)
    const pN = proj(Math.floor(cols / 2), rows - 1, minElev)
    const pW = proj(0, Math.floor(rows / 2), minElev)
    const pE = proj(cols - 1, Math.floor(rows / 2), minElev)
    ctx.fillText('S', pS.x, pS.y + 14)
    ctx.fillText('N', pN.x, pN.y - 6)
    ctx.fillText('W', pW.x - 10, pW.y)
    ctx.fillText('E', pE.x + 10, pE.y)

    // Elevation range labels
    ctx.fillStyle = '#02C39A'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${Math.round(minElev)} ft`, 6, H - 6)
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.round(maxElev)} ft`, W - 6, H - 6)

    // Hint
    ctx.fillStyle = 'rgba(156,163,175,0.5)'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('Drag to rotate · Scroll to zoom', W - 8, 12)

  }, [grid, bbox, minElev, maxElev, range, rotation, zoom, aspect, satImgRef.current])

  useEffect(() => { draw() }, [draw])

  // Attach wheel listener with { passive: false } so preventDefault works
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const handler = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setZoom(prev => Math.max(0.3, Math.min(4, prev - e.deltaY * 0.002)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const onMouseDown = (e) => {
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }
  }
  const onMouseMove = (e) => {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.lastX
    const dy = e.clientY - dragRef.current.lastY
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
    setRotation(prev => ({
      x: Math.max(5, Math.min(85, prev.x + dy * 0.5)),
      y: prev.y + dx * 0.5,
    }))
  }
  const onMouseUp = () => { dragRef.current.active = false }

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-gray-700 cursor-grab active:cursor-grabbing"
        style={{ background: '#111827' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
    </div>
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
export default function ElevationChart({ grid, bbox, polygon }) {
  const [view, setView] = useState('sat')
  if (!grid || !bbox) return null

  const flat    = grid.flat()
  const minElev = Math.min(...flat)
  const maxElev = Math.max(...flat)
  const avgElev = flat.reduce((a, b) => a + b, 0) / flat.length
  const range   = maxElev - minElev || 1

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-sm text-teal">Elevation Grid</h2>
        <select
          value={view}
          onChange={e => setView(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-teal"
        >
          <option value="sat">Satellite + Contour</option>
          <option value="heat">Heatmap</option>
          <option value="3d">3D Surface</option>
        </select>
      </div>

      <TerrainSummary grid={grid} bbox={bbox} minElev={minElev} maxElev={maxElev} range={range} />

      {view === 'sat' && (
        <>
          <SatelliteContour grid={grid} bbox={bbox} minElev={minElev} maxElev={maxElev} range={range} polygon={polygon} />
          <LegendBar minElev={minElev} maxElev={maxElev} avgElev={avgElev} />
        </>
      )}

      {view === 'heat' && (
        <Heatmap2D grid={grid} bbox={bbox} minElev={minElev} maxElev={maxElev} avgElev={avgElev} range={range} polygon={polygon} />
      )}

      {view === '3d' && (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Interactive surface · {grid[0].length}x{grid.length} grid · Relief: {Math.round(range)} ft
          </p>
          <Surface3D grid={grid} bbox={bbox} minElev={minElev} maxElev={maxElev} range={range} polygon={polygon} />
          <LegendBar minElev={minElev} maxElev={maxElev} avgElev={avgElev} />
        </>
      )}
    </div>
  )
}
