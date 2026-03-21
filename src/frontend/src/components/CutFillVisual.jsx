import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

/**
 * CutFillVisual — Bar chart showing cut vs fill volumes and net earthwork.
 * Cut = earth to remove (red). Fill = earth to add (blue). Net = export/import.
 */
export default function CutFillVisual({ cutFill }) {
  if (!cutFill) return null

  const data = [
    { name: 'Cut (Remove)', cy: cutFill.cut_cy, color: '#EF4444' },
    { name: 'Fill (Add)', cy: cutFill.fill_cy, color: '#3B82F6' },
  ]

  const netPositive = cutFill.net_cy >= 0  // positive = export surplus

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="font-bold text-sm text-teal mb-1">Cut & Fill Earthwork</h2>
      <p className="text-xs text-gray-500 mb-3">
        Volumes in cubic yards (CY) · Grid Prismatic Method
      </p>

      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
          <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
          <Tooltip
            contentStyle={{ background: '#1F2937', border: '1px solid #374151', fontSize: 11 }}
            formatter={(v) => [`${v.toLocaleString()} CY`, '']}
          />
          <Bar dataKey="cy" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Net summary */}
      <div className={`mt-3 p-2.5 rounded text-xs font-medium border ${
        netPositive
          ? 'bg-green-900/30 border-green-700 text-green-300'
          : 'bg-blue-900/30 border-blue-700 text-blue-300'
      }`}>
        Net: {Math.abs(cutFill.net_cy).toLocaleString()} CY {netPositive ? '→ Export (surplus)' : '→ Import needed'}
        <span className="ml-2 opacity-70">· Target grade: {cutFill.target_grade_ft} ft</span>
      </div>
    </div>
  )
}
