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
    getValue: d => {
      const hsg = d.soil?.hydrologic_group ? `HSG ${d.soil.hydrologic_group}` : ''
      const tex = d.soil?.texture_description?.split(' ')[0] || 'Unknown'
      return hsg ? `${tex} · ${hsg}` : tex
    },
    getLevel: d => (d.soil?.shrink_swell === 'High' ? 'HIGH' :
                    d.soil?.caliche || d.soil?.hydrologic_group === 'D' ? 'MODERATE' : 'LOW'),
    getDetail: d => {
      const items = []
      if (d.soil?.shrink_swell === 'High') items.push('Expansive clay')
      if (d.soil?.caliche) items.push('Caliche detected')
      if (d.soil?.flooding_frequency && d.soil.flooding_frequency !== 'None') items.push(`Flooding: ${d.soil.flooding_frequency}`)
      if (d.soil?.corrosion_concrete === 'High') items.push('High concrete corrosion')
      if (d.soil?.building_limitations?.length) items.push(`${d.soil.building_limitations.length} limitation(s)`)
      if (!items.length) items.push(d.soil?.drainage_class || 'Standard conditions')
      return items.join(' · ')
    },
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
  precipitation: {
    label: 'Stormwater',
    getValue: d => d.precipitation?.intensity_10yr_1hr_in
      ? `${d.precipitation.intensity_10yr_1hr_in} in/hr`
      : 'N/A',
    getLevel: d => {
      const i = d.precipitation?.intensity_10yr_1hr_in || 0
      return i >= 2.0 ? 'HIGH' : i >= 1.2 ? 'MODERATE' : 'LOW'
    },
    getDetail: d => d.precipitation?.source || 'NOAA Atlas 14 10-yr, 1-hr intensity',
  },
  contamination: {
    label: 'EPA Sites',
    getValue: d => d.contamination?.total_sites != null
      ? `${d.contamination.total_sites} nearby`
      : 'N/A',
    getLevel: d => d.contamination?.risk_level || 'LOW',
    getDetail: d => d.contamination?.description || 'No data',
  },
  hydrography: {
    label: 'Streams',
    getValue: d => d.hydrography?.streams_nearby
      ? `${d.hydrography.stream_count} found`
      : 'None',
    getLevel: d => d.hydrography?.risk_level || 'LOW',
    getDetail: d => d.hydrography?.description || 'No streams detected',
  },
  endangered_species: {
    label: 'Species',
    getValue: d => d.endangered_species?.critical_habitat
      ? `${d.endangered_species.species_count} species`
      : 'None',
    getLevel: d => d.endangered_species?.risk_level || 'LOW',
    getDetail: d => d.endangered_species?.description || 'No critical habitat detected',
  },
  historic_sites: {
    label: 'Historic',
    getValue: d => d.historic_sites?.sites_nearby
      ? `${d.historic_sites.site_count} sites`
      : 'None',
    getLevel: d => d.historic_sites?.risk_level || 'LOW',
    getDetail: d => d.historic_sites?.description || 'No historic sites nearby',
  },
  landslide: {
    label: 'Landslide',
    getValue: d => d.landslide?.risk_class || 'Low',
    getLevel: d => d.landslide?.risk_level || 'LOW',
    getDetail: d => d.landslide?.description || 'Low susceptibility',
  },
  sea_level_rise: {
    label: 'Sea Level',
    getValue: d => d.sea_level_rise?.coastal ? (d.sea_level_rise?.exposed_3ft ? 'Exposed' : 'Safe') : 'Inland',
    getLevel: d => d.sea_level_rise?.risk_level || 'LOW',
    getDetail: d => d.sea_level_rise?.description || 'Not applicable',
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
      <div className="grid grid-cols-3 gap-2">
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
