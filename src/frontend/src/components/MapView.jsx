import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

const ESRI_SATELLITE_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: '© Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    'esri-labels': {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'satellite', type: 'raster', source: 'esri-satellite' },
    { id: 'labels',    type: 'raster', source: 'esri-labels' },
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
}

async function geocodeAddress(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'SiteSense-HackASU2025' } }
  )
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

function makeRectGeoJSON(c1, c2) {
  if (!c1 || !c2) return null
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [c1[0], c1[1]], [c2[0], c1[1]],
        [c2[0], c2[1]], [c1[0], c2[1]],
        [c1[0], c1[1]],
      ]],
    },
  }
}

export default function MapView({ onPolygonChange, onSearchError, result, searchAddress, searchTrigger }) {
  const mapContainer = useRef(null)
  const map          = useRef(null)
  const markers      = useRef([])
  const corner1      = useRef(null)   // first click [lng, lat]
  const drawMode     = useRef('idle') // 'idle' | 'first' | 'done'

  const [phase, setPhase] = useState('idle') // for cursor + hint re-render

  // ── helpers to update the rectangle layers ─────────────────────────────────
  function setRectSource(geojson) {
    if (!map.current) return
    const src = map.current.getSource('rect-source')
    if (!src) return
    src.setData(geojson || { type: 'FeatureCollection', features: [] })
  }

  function finalizeRect(c1, c2) {
    const geojson = makeRectGeoJSON(c1, c2)
    if (!geojson) return
    setRectSource(geojson)
    onPolygonChange(geojson.geometry)
    drawMode.current = 'done'
    setPhase('done')

    const lngs = [c1[0], c2[0]], lats = [c1[1], c2[1]]
    map.current.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, maxZoom: 18, duration: 700 }
    )
  }

  function resetDraw() {
    corner1.current = null
    drawMode.current = 'first'
    setPhase('first')
    setRectSource(null)
    onPolygonChange(null)
  }

  // ── map init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: ESRI_SATELLITE_STYLE,
      center: [-112.07, 33.45],
      zoom: 14,
      dragRotate: false,       // ← disables tilt AND rotation via right-click/touch
      pitchWithRotate: false,  // ← locks to top-down view
      touchPitch: false,
    })

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }), 'bottom-left')

    map.current.on('load', () => {
      // Rectangle GeoJSON source + layers
      map.current.addSource('rect-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.current.addLayer({
        id: 'rect-fill',
        type: 'fill',
        source: 'rect-source',
        paint: { 'fill-color': '#1C7293', 'fill-opacity': 0.25 },
      })
      map.current.addLayer({
        id: 'rect-stroke',
        type: 'line',
        source: 'rect-source',
        paint: { 'line-color': '#02C39A', 'line-width': 2.5, 'line-dasharray': [4, 2] },
      })

      // Start in draw mode
      drawMode.current = 'first'
      setPhase('first')

      // Click handler
      map.current.on('click', (e) => {
        const lng = e.lngLat.lng, lat = e.lngLat.lat

        if (drawMode.current === 'first') {
          corner1.current = [lng, lat]
          drawMode.current = 'second'
          setPhase('second')
          // show a tiny dot for corner 1
          setRectSource(makeRectGeoJSON([lng, lat], [lng + 0.0001, lat + 0.0001]))
        } else if (drawMode.current === 'second') {
          finalizeRect(corner1.current, [lng, lat])
        }
      })

      // Live preview while moving mouse after first click
      map.current.on('mousemove', (e) => {
        if (drawMode.current !== 'second' || !corner1.current) return
        setRectSource(makeRectGeoJSON(corner1.current, [e.lngLat.lng, e.lngLat.lat]))
      })
    })

    return () => map.current?.remove()
  }, [])

  // Update cursor based on phase
  useEffect(() => {
    if (!map.current) return
    const canvas = map.current.getCanvas()
    if (phase === 'first' || phase === 'second') canvas.style.cursor = 'crosshair'
    else canvas.style.cursor = ''
  }, [phase])

  // Fly to address
  useEffect(() => {
    if (!searchTrigger || !searchAddress || !map.current) return
    geocodeAddress(searchAddress).then(loc => {
      if (!loc) { onSearchError?.('Address not found — try a more specific address'); return }
      map.current.flyTo({ center: [loc.lon, loc.lat], zoom: 17, speed: 1.8 })
      setTimeout(() => resetDraw(), 1200)
    })
  }, [searchTrigger])

  // Zoom to result bbox + add marker
  useEffect(() => {
    if (!map.current || !result?.elevation?.bbox) return
    const [minLng, minLat, maxLng, maxLat] = result.elevation.bbox
    map.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 18, duration: 600 })

    markers.current.forEach(m => m.remove())
    markers.current = []
    const el = document.createElement('div')
    el.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#02C39A;border:2px solid white;box-shadow:0 0 8px rgba(2,195,154,0.6);cursor:pointer;'
    const marker = new maplibregl.Marker(el)
      .setLngLat([(minLng + maxLng) / 2, (minLat + maxLat) / 2])
      .setPopup(new maplibregl.Popup().setHTML(
        `<div style="font-size:12px;color:#000;line-height:1.6">
          <b>Analysis Complete</b><br/>
          Slope: ${result.slope?.avg_slope_pct?.toFixed(1)}%<br/>
          Flood: Zone ${result.flood?.zone}<br/>
          Foundation: ${result.foundation?.type?.replace(/_/g, ' ')}
        </div>`
      ))
      .addTo(map.current)
    markers.current.push(marker)
  }, [result])

  // Hint text for overlay
  const hint = phase === 'first'  ? { text: 'Click to place first corner of your parcel', sub: null }
             : phase === 'second' ? { text: 'Click to place opposite corner', sub: 'Move mouse to preview' }
             : null

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Draw hint */}
      {hint && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/80 text-white text-sm px-5 py-3 rounded-xl backdrop-blur border border-teal/40 shadow-lg text-center">
            <div className="font-semibold text-teal">{hint.text}</div>
            {hint.sub && <div className="text-gray-400 text-xs mt-0.5">{hint.sub}</div>}
          </div>
        </div>
      )}

      {/* Parcel drawn badge + redraw button */}
      {phase === 'done' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className="bg-teal/90 text-white text-sm px-4 py-2 rounded-xl shadow-lg font-semibold">
            ✓ Parcel selected — click Analyze Parcel
          </div>
          <button
            onClick={resetDraw}
            className="bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-2 rounded-lg border border-white/20 transition-colors"
          >
            Redraw
          </button>
        </div>
      )}
    </div>
  )
}
