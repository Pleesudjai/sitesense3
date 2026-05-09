import type { CityModule, ZoningResult } from './types.js';
import { asString, buildResult, queryArcGisPoint } from './helpers.js';

// Scottsdale zoning — official maps.scottsdaleaz.gov OpenData layer 24.
// Fields: full_zoning, comparable_zoning.
const REST =
  process.env.SCOTTSDALE_ZONING_REST ??
  'https://maps.scottsdaleaz.gov/arcgis/rest/services/OpenData/MapServer/24/query';

type Entry = Omit<ZoningResult, 'jurisdiction' | 'zoning_code' | 'source_url' | 'fetched_at'>;
const REF = 'Scottsdale Zoning Ordinance Article V (residential), Article VI (commercial), Article VII (industrial)';

const TABLE: Record<string, Entry> = {
  'R1-7': { district_name: 'Single-Family, 7,000 sf min', category: 'single_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 6, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify Scottsdale Zoning Ordinance.' },
  'R1-10': { district_name: 'Single-Family, 10,000 sf', category: 'single_family', min_lot_size_sf: 10000, setbacks_ft: { front: 25, side: 7, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 4, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-18': { district_name: 'Single-Family, 18,000 sf', category: 'single_family', min_lot_size_sf: 18000, setbacks_ft: { front: 30, side: 10, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 2, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-35': { district_name: 'Single-Family, 35,000 sf', category: 'single_family', min_lot_size_sf: 35000, setbacks_ft: { front: 40, side: 20, rear: 30 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-43': { district_name: 'Single-Family, 1 acre min (43,560 sf)', category: 'single_family', min_lot_size_sf: 43560, setbacks_ft: { front: 40, side: 20, rear: 40 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-130': { district_name: 'Single-Family, 130,000 sf (3 ac)', category: 'single_family', min_lot_size_sf: 130000, setbacks_ft: { front: 50, side: 30, rear: 50 }, max_height_ft: 30, max_density_du_per_acre: 0.3, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'low', note: 'Very low density. Verify.' },
  'R-2': { district_name: 'Multifamily Residential', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 17, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-3': { district_name: 'Multifamily Residential', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 40, max_density_du_per_acre: 25, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-4': { district_name: 'Multifamily Residential, high density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 56, max_density_du_per_acre: 36, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'C-2': { district_name: 'Central Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'C-3': { district_name: 'Highway Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 56, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
};

export const scottsdale: CityModule = {
  name: 'Scottsdale',
  query: async (lat, lon) => {
    const r = await queryArcGisPoint(REST, lat, lon, ['full_zoning', 'comparable_zoning']);
    if (!r) return null;
    const full = asString(r.attributes['full_zoning']);
    const comparable = asString(r.attributes['comparable_zoning']);
    // Comparable code (e.g., R1-7) is what matches the ordinance table; full may include overlays.
    const code = comparable ?? full;
    const known = code ? TABLE[code] : null;
    if (known) {
      return buildResult({ jurisdiction: 'Scottsdale', zoning_code: code, ...known }, r.sourceUrl);
    }
    return buildResult(
      {
        jurisdiction: 'Scottsdale',
        zoning_code: code,
        district_name: full ?? (code ? `Scottsdale district ${code}` : 'Scottsdale — unknown'),
        category: 'other',
        min_lot_size_sf: null,
        setbacks_ft: { front: null, side: null, rear: null },
        max_height_ft: null,
        max_density_du_per_acre: null,
        detached_dwelling_allowed: null,
        ordinance_reference: REF,
        confidence: 'low',
        note: `Scottsdale zoning code ${code ?? '(none)'} not in agent table. Consult Scottsdale Zoning Ordinance.`,
      },
      r.sourceUrl,
    );
  },
};
