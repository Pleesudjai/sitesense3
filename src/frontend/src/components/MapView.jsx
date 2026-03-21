import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import * as turf from '@turf/area'

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

/**
 * MapView — Satellite map with polygon drawing tool.
 * Uses MapLibre GL JS (no token) + Esri World Imagery (free satellite).
 * Calls onPolygonChange(GeoJSON_geometry) when user draws/updates a polygon.
 */
export default function MapView({ onPolygonChange, result }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const draw = useRef(null)

  useEffect(() => {
    if (map.current) return  // already initialized

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: ESRI_SATELLITE_STYLE,
      center: [-112.07, 33.45],  // Phoenix AZ default
      zoom: 14,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left')
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }), 'bottom-left')

    // Polygon draw tool (uses mapbox-gl-draw aliased to maplibre-gl)
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
        turf.default(data.features[0])  // compute area (acres) if needed
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

  // Add result marker when analysis is ready
  useEffect(() => {
    if (!map.current || !result?.elevation?.bbox) return

    const bbox = result.elevation.bbox
    const center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]

    const el = document.createElement('div')
    el.style.cssText = `
      width: 14px; height: 14px; border-radius: 50%;
      background: #02C39A; border: 2px solid white;
      box-shadow: 0 0 8px rgba(2,195,154,0.6); cursor: pointer;
    `

    new maplibregl.Marker(el)
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

  }, [result])

  return (
    <div ref={mapContainer} className="w-full h-full" />
  )
}
