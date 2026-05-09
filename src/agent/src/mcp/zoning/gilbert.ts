import type { CityModule, ZoningResult } from './types.js';
import { asString, buildResult, queryArcGisPoint } from './helpers.js';

// Gilbert zoning — official Town of Gilbert maps.gilbertaz.gov MapServer layer 8.
// Fields: ZCODE, Description.
const REST =
  process.env.GILBERT_ZONING_REST ??
  'https://maps.gilbertaz.gov/arcgis/rest/services/OD/Growth_Development_Maps_1/MapServer/8/query';

type Entry = Omit<ZoningResult, 'jurisdiction' | 'zoning_code' | 'source_url' | 'fetched_at'>;
const REF = 'Gilbert Land Development Code Article 2 (Zoning Districts)';

const TABLE: Record<string, Entry> = {
  AG: { district_name: 'Agricultural', category: 'agricultural', min_lot_size_sf: 43560, setbacks_ft: { front: 50, side: 25, rear: 50 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'low', note: 'Agricultural — verify.' },
  'SF-43': { district_name: 'Single Family, 1 ac min (43,560 sf)', category: 'single_family', min_lot_size_sf: 43560, setbacks_ft: { front: 40, side: 20, rear: 40 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify Gilbert LDC Art. 2.' },
  'SF-15': { district_name: 'Single Family, 15,000 sf', category: 'single_family', min_lot_size_sf: 15000, setbacks_ft: { front: 30, side: 10, rear: 30 }, max_height_ft: 30, max_density_du_per_acre: 3, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'SF-10': { district_name: 'Single Family, 10,000 sf', category: 'single_family', min_lot_size_sf: 10000, setbacks_ft: { front: 25, side: 7, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 4, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'SF-8.5': { district_name: 'Single Family, 8,500 sf', category: 'single_family', min_lot_size_sf: 8500, setbacks_ft: { front: 25, side: 7, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 5, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'SF-7': { district_name: 'Single Family, 7,000 sf', category: 'single_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 6, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'SF-6': { district_name: 'Single Family, 6,000 sf', category: 'single_family', min_lot_size_sf: 6000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 7, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'SF-5': { district_name: 'Single Family, 5,000 sf', category: 'single_family', min_lot_size_sf: 5000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 8, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'MF-2': { district_name: 'Multi Family, low density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 12, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'MF-3': { district_name: 'Multi Family, mid density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 40, max_density_du_per_acre: 24, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  GO: { district_name: 'General Office', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  NS: { district_name: 'Neighborhood Service', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 30, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  RC: { district_name: 'Regional Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 56, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
};

export const gilbert: CityModule = {
  name: 'Gilbert',
  query: async (lat, lon) => {
    const r = await queryArcGisPoint(REST, lat, lon, ['ZCODE', 'Description']);
    if (!r) return null;
    const code = asString(r.attributes['ZCODE']);
    const desc = asString(r.attributes['Description']);
    const known = code ? TABLE[code] : null;
    if (known) {
      return buildResult({ jurisdiction: 'Gilbert', zoning_code: code, ...known }, r.sourceUrl);
    }
    return buildResult(
      {
        jurisdiction: 'Gilbert',
        zoning_code: code,
        district_name: desc ?? (code ? `Gilbert district ${code}` : 'Gilbert — unknown'),
        category: 'other',
        min_lot_size_sf: null,
        setbacks_ft: { front: null, side: null, rear: null },
        max_height_ft: null,
        max_density_du_per_acre: null,
        detached_dwelling_allowed: null,
        ordinance_reference: REF,
        confidence: 'low',
        note: `Gilbert zoning code ${code ?? '(none)'} not in agent table. Consult Gilbert Land Development Code.`,
      },
      r.sourceUrl,
    );
  },
};
