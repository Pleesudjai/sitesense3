import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'

// Free Esri World Imagery satellite style — no token required
const ESRI_SATELLITE_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    'esri-labels': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
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
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'SiteSense-HackASU2025' },
  })
  const data = await res.json()
  if (data.length === 0) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name }
}

export default function MapView({ onPolygonChange, onSearchError, result, searchAddress, searchTrigger }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const draw = useRef(null)
  const markers = useRef([])

  useEffect(() => {
    if (map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: ESRI_SATELLITE_STYLE,
      center: [-112.07, 33.45],  // Phoenix AZ default
      zoom: 14,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left')
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }), 'bottom-left')

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'simple_select',
      styles: [
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: { 'fill-color': '#1C7293', 'fill-opacity': 0.25 },
        },
        {
          id: 'gl-draw-polygon-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: { 'line-color': '#02C39A', 'line-width': 2 },
        },
      ],
    })
    map.current.addControl(draw.current, 'top-left')

    // Enter draw mode only AFTER map fully loads
    map.current.on('load', () => {
      draw.current.changeMode('draw_polygon')
    })

    const handleCreate = () => {
      const data = draw.current.getAll()
      if (data.features.length === 0) return

      // Keep only the most recently drawn polygon — delete all previous
      if (data.features.length > 1) {
        const ids = data.features.slice(0, -1).map(f => f.id)
        draw.current.delete(ids)
      }

      const feature = draw.current.getAll().features[0]
      if (!feature) return

      onPolygonChange(feature.geometry)

      // Auto-zoom to the drawn polygon
      const coords = feature.geometry.coordinates[0]
      const lngs = coords.map(c => c[0])
      const lats = coords.map(c => c[1])
      map.current.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 80, maxZoom: 18, duration: 800 }
      )
    }

    const handleUpdate = () => {
      const data = draw.current.getAll()
      if (data.features.length > 0) onPolygonChange(data.features[0].geometry)
    }

    const handleDelete = () => onPolygonChange(null)

    map.current.on('draw.create', handleCreate)
    map.current.on('draw.update', handleUpdate)
    map.current.on('draw.delete', handleDelete)

    return () => map.current?.remove()
  }, [])

  // Fly to address when searchTrigger increments
  useEffect(() => {
    if (!searchTrigger || !searchAddress || !map.current) return
    geocodeAddress(searchAddress).then(loc => {
      if (!loc) {
        onSearchError?.('Address not found — try a more specific address')
        return
      }
      map.current.flyTo({ center: [loc.lon, loc.lat], zoom: 17, speed: 1.8 })
      // Clear old polygon and re-enter draw mode after fly
      setTimeout(() => {
        if (draw.current) {
          draw.current.deleteAll()
          onPolygonChange(null)
          draw.current.changeMode('draw_polygon')
        }
      }, 1200)
    })
  }, [searchTrigger])

  // Zoom to analysis result bbox
  useEffect(() => {
    if (!map.current || !result?.elevation?.bbox) return

    const [minLng, minLat, maxLng, maxLat] = result.elevation.bbox
    map.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 18, duration: 600 })

    // Clear old markers
    markers.current.forEach(m => m.remove())
    markers.current = []

    const center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
    const el = document.createElement('div')
    el.style.cssText = `
      width: 14px; height: 14px; border-radius: 50%;
      background: #02C39A; border: 2px solid white;
      box-shadow: 0 0 8px rgba(2,195,154,0.6); cursor: pointer;
    `
    const marker = new maplibregl.Marker(el)
      .setLngLat(center)
      .setPopup(new maplibregl.Popup().setHTML(
        `<div style="font-size:12px; color:#000; line-height:1.6">
          <b>Analysis Complete</b><br/>
          Slope: ${result.slope?.avg_slope_pct?.toFixed(1)}%<br/>
          Flood: Zone ${result.flood?.zone}<br/>
          Foundation: ${result.foundation?.type?.replace(/_/g, ' ')}
        </div>`
      ))
      .addTo(map.current)
    markers.current.push(marker)
  }, [result])

  return (
    <div ref={mapContainer} className="w-full h-full" />
  )
}
