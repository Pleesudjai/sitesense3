/**
 * RiskCards — Traffic-light risk indicators for each GIS layer.
 * Shows flood, seismic, fire, soil, wetlands, and wind risk.
 */

const RISK_CONFIG = {
  flood: {
    label: 'Flood Zone',
    getValue: d => d.flood?.zone || 'X',
    getLevel: zone => (['AE','VE','A','AO','AH'].includes(zone) ? 'HIGH' :
                       zone === 'B' ? 'MODERATE' : 'LOW'),
    getDetail: d => d.flood?.description || '',
  },
  seismic: {
    label: 'Seismic Risk',
    getValue: d => `SDC ${d.seismic?.sdc || 'A'}`,
    getLevel: d => (['D','E','F'].includes(d.seismic?.sdc) ? 'HIGH' :
                    d.seismic?.sdc === 'C' ? 'MODERATE' : 'LOW'),
    getDetail: d => `SDS=${d.seismic?.sds?.toFixed(2)}, SD1=${d.seismic?.sd1?.toFixed(2)}`,
  },
  fire: {
    label: 'Wildfire Risk',
    getValue: d => d.fire?.risk_class || 'Low',
    getLevel: d => {
      const r = d.fire?.risk_class || 'Low'
      return r === 'Very High' || r === 'High' ? 'HIGH' : r === 'Moderate' ? 'MODERATE' : 'LOW'
    },
    getDetail: d => d.fire?.wui_zone ? 'WUI zone — special construction req.' : 'Standard construction',
  },
  soil: {
    label: 'Soil Conditions',
    getValue: d => d.soil?.texture_description?.split(' ')[0] || 'Unknown',
    getLevel: d => (d.soil?.shrink_swell === 'High' ? 'HIGH' :
                    d.soil?.caliche ? 'MODERATE' : 'LOW'),
    getDetail: d => [
      d.soil?.shrink_swell === 'High' ? 'Expansive clay' : null,
      d.soil?.caliche ? 'Caliche detected' : null,
      d.soil?.bearing_hint?.split('—')[0]?.trim() || null,
    ].filter(Boolean).join(' · '),
  },
  wetlands: {
    label: 'Wetlands',
    getValue: d => d.wetlands?.present ? 'Present' : 'None',
    getLevel: d => (d.wetlands?.present ? 'HIGH' : 'LOW'),
    getDetail: d => d.wetlands?.present
      ? `Sec. 404 permit likely required`
      : 'No wetlands detected',
  },
  wind: {
    label: 'Wind Load',
    getValue: d => `${d.seismic?.wind_mph || 90} mph`,
    getLevel: d => (d.seismic?.wind_mph >= 115 ? 'HIGH' :
                    d.seismic?.wind_mph >= 100 ? 'MODERATE' : 'LOW'),
    getDetail: d => `ASCE 7-22 design wind speed`,
  },
}

const LEVEL_STYLES = {
  HIGH:     { dot: 'bg-red-500',    badge: 'bg-red-900/40 border-red-700 text-red-300',     label: 'HIGH' },
  MODERATE: { dot: 'bg-yellow-400', badge: 'bg-yellow-900/40 border-yellow-600 text-yellow-300', label: 'MOD' },
  LOW:      { dot: 'bg-green-500',  badge: 'bg-green-900/40 border-green-700 text-green-300', label: 'LOW' },
}

export default function RiskCards({ data }) {
  return (
    <div>
      <h2 className="font-bold text-sm text-teal mb-2">Risk Assessment</h2>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(RISK_CONFIG).map(([key, cfg]) => {
          const level = typeof cfg.getLevel === 'function'
            ? cfg.getLevel(data)
            : cfg.getLevel(cfg.getValue(data))
          const styles = LEVEL_STYLES[level] || LEVEL_STYLES.LOW

          return (
            <div
              key={key}
              className={`border rounded-lg p-3 ${styles.badge} flex flex-col gap-1`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${styles.dot} shrink-0`} />
                <span className="text-xs font-semibold">{cfg.label}</span>
                <span className="ml-auto text-xs font-bold opacity-80">{styles.label}</span>
              </div>
              <div className="text-sm font-bold">{cfg.getValue(data)}</div>
              <div className="text-xs opacity-70 leading-tight">{cfg.getDetail(data)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
