import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

/**
 * ElevationChart — Elevation cross-section (north-south slice through center of grid).
 * Uses the middle row of the elevation grid.
 */
export default function ElevationChart({ grid, bbox }) {
  if (!grid || !bbox) return null

  const gridSize = grid.length
  const midRow = Math.floor(gridSize / 2)
  const rowData = grid[midRow]

  // Convert column index to approximate distance in feet
  const lonSpan = (bbox[2] - bbox[0]) * 91000 * 3.281  // degrees → feet at 33°N
  const cellFt = lonSpan / gridSize

  const data = rowData.map((elev, i) => ({
    dist: Math.round(i * cellFt),
    elevation: Math.round(elev * 10) / 10,
  }))

  const minElev = Math.min(...rowData)
  const maxElev = Math.max(...rowData)
  const avgElev = rowData.reduce((a, b) => a + b, 0) / rowData.length

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="font-bold text-sm text-teal mb-1">Elevation Profile</h2>
      <p className="text-xs text-gray-500 mb-3">
        E–W cross-section · Range: {minElev.toFixed(0)}–{maxElev.toFixed(0)} ft
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="dist"
            tick={{ fontSize: 9, fill: '#9CA3AF' }}
            tickFormatter={v => `${v}ft`}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#9CA3AF' }}
            tickFormatter={v => `${v}'`}
            domain={['auto', 'auto']}
            width={36}
          />
          <Tooltip
            contentStyle={{ background: '#1F2937', border: '1px solid #374151', fontSize: 11 }}
            formatter={(v) => [`${v} ft`, 'Elevation']}
            labelFormatter={(l) => `${l} ft from west edge`}
          />
          <ReferenceLine
            y={Math.round(avgElev)}
            stroke="#1C7293"
            strokeDasharray="4 2"
            label={{ value: 'avg', fontSize: 9, fill: '#1C7293' }}
          />
          <Line
            type="monotone"
            dataKey="elevation"
            stroke="#02C39A"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
