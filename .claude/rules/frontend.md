# Frontend Rules
# Load this ONLY when building or editing UI files in src/frontend/

## Tech Stack
- HTML5, CSS3, vanilla JS (or React if complexity warrants it)
- Leaflet.js for maps/GIS
- Chart.js for data visualization
- No heavy UI frameworks (no Angular, no Material UI bloat)

## Design Principles
- Clean, professional look — judges are engineers, not designers
- Mobile-responsive (use CSS Grid or Flexbox)
- Color palette: blues and greens for maps, amber/red for risk indicators
- Font: system fonts (no Google Fonts required for MVP)

## Component Patterns
- Always separate HTML structure, CSS styles, and JS logic into different files
- Forms: validate inputs client-side before sending to backend
- Maps: load GeoJSON from `src/data/` for static demos; API for live data
- Loading states: show a spinner when waiting for Claude API responses

## Map Component (Leaflet)
```js
// Standard Leaflet initialization for Arizona-focused maps
const map = L.map('map').setView([33.4484, -112.0740], 10); // Phoenix center
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
```

## Error Handling
- Show user-friendly error messages (not raw API errors)
- Gracefully handle empty/null data — display "No data available" placeholder
