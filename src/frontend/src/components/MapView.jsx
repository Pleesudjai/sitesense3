import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import * as turf from '@turf/area'

// Set your Mapbox token in .env.local as VITE_MAPBOX_TOKEN
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE'

/**
 * MapView — Satellite map with polygon drawing tool.
 * Calls onPolygonChange(GeoJSON_geometry) when user draws/updates a polygon.
 * Shows elevation slope heatmap and cut/fill overlay when result is available.
 */
export default function MapView({ onPolygonChange, result }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const draw = useRef(null)

  useEffect(() => {
    if (map.current) return  // already initialized

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-112.07, 33.45],  // Phoenix AZ default
      zoom: 14,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left')
    map.current.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }), 'bottom-left')

    // Polygon draw tool
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

    const handleChange = () => {
      const data = draw.current.getAll()
      if (data.features.length > 0) {
        const geom = data.features[0].geometry
        const area = turf.default(data.features[0]) / 4047  // m² → acres
        onPolygonChange(geom)
      } else {
        onPolygonChange(null)
      }
    }

    map.current.on('draw.create', handleChange)
    map.current.on('draw.update', handleChange)
    map.current.on('draw.delete', handleChange)

    return () => map.current?.remove()
  }, [])

  // Add slope heatmap layer when result changes
  useEffect(() => {
    if (!map.current || !result?.slope?.slope_grid) return

    // Remove existing layers
    ['slope-heatmap', 'cut-overlay', 'fill-overlay'].forEach(id => {
      if (map.current.getLayer(id)) map.current.removeLayer(id)
      if (map.current.getSource(id)) map.current.removeSource(id)
    })

    // For hackathon: show a simple indicator on map center when data is ready
    // Full raster overlay requires tile server — this is MVP approach
    const bbox = result.elevation?.bbox
    if (!bbox) return

    const center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]

    // Add a result marker
    const el = document.createElement('div')
    el.className = 'result-marker'
    el.style.cssText = `
      width: 14px; height: 14px; border-radius: 50%;
      background: #02C39A; border: 2px solid white;
      box-shadow: 0 0 8px rgba(2,195,154,0.6);
    `

    new mapboxgl.Marker(el)
      .setLngLat(center)
      .setPopup(new mapboxgl.Popup().setHTML(
        `<div style="font-size:12px; color:#000">
          <b>Analysis Complete</b><br/>
          Slope: ${result.slope?.avg_slope_pct?.toFixed(1)}%<br/>
          Flood: Zone ${result.flood?.zone}<br/>
          Foundation: ${result.foundation?.type?.replace(/_/g, ' ')}
        </div>`
      ))
      .addTo(map.current)

  }, [result])

  return (
    <div ref={mapContainer} className="w-full h-full" />
  )
}
