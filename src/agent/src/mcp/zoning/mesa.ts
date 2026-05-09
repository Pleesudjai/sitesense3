import type { CityModule, ZoningResult } from './types.js';
import { asString, buildResult, queryArcGisPoint } from './helpers.js';

// Mesa zoning — official City of Mesa (ITDGIS) FeatureServer, layer 2.
// Field: Zoning (e.g., RS-7, RS-9, RM-2, OC, GC).
const REST =
  process.env.MESA_ZONING_REST ??
  'https://services2.arcgis.com/1gVyYKfYgW5Nxb1V/arcgis/rest/services/Zoning/FeatureServer/2/query';

type Entry = Omit<ZoningResult, 'jurisdiction' | 'zoning_code' | 'source_url' | 'fetched_at'>;
const REF = 'Mesa Zoning Ordinance Title 11 (Mesa City Code)';

const TABLE: Record<string, Entry> = {
  AG: { district_name: 'Agricultural', category: 'agricultural', min_lot_size_sf: 43560, setbacks_ft: { front: 50, side: 25, rear: 50 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'low', note: 'Agricultural — verify Mesa Title 11.' },
  'RS-43': { district_name: 'Single-Residence, 43,560 sf min (1 ac)', category: 'single_family', min_lot_size_sf: 43560, setbacks_ft: { front: 40, side: 20, rear: 40 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify Mesa Title 11.' },
  'RS-35': { district_name: 'Single-Residence, 35,000 sf', category: 'single_family', min_lot_size_sf: 35000, setbacks_ft: { front: 40, side: 15, rear: 40 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'RS-15': { district_name: 'Single-Residence, 15,000 sf', category: 'single_family', min_lot_size_sf: 15000, setbacks_ft: { front: 30, side: 10, rear: 30 }, max_height_ft: 30, max_density_du_per_acre: 3, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'RS-9': { district_name: 'Single-Residence, 9,000 sf', category: 'single_family', min_lot_size_sf: 9000, setbacks_ft: { front: 25, side: 7, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 4, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'RS-7': { district_name: 'Single-Residence, 7,000 sf', category: 'single_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 6, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'RS-6': { district_name: 'Single-Residence, 6,000 sf', category: 'single_family', min_lot_size_sf: 6000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 7, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'RM-2': { district_name: 'Multi-Residence, low density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 12, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'RM-3': { district_name: 'Multi-Residence, mid density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 40, max_density_du_per_acre: 24, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'RM-4': { district_name: 'Multi-Residence, high density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 60, max_density_du_per_acre: 35, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  OC: { district_name: 'Office Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify Mesa Title 11.' },
  LC: { district_name: 'Limited Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  GC: { district_name: 'General Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 60, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'DR-1': { district_name: 'Downtown Residential 1 (form-based)', category: 'mixed_use', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: 18, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Form-based downtown code.' },
  'DR-2': { district_name: 'Downtown Residential 2 (form-based)', category: 'mixed_use', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 60, max_density_du_per_acre: 35, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Form-based.' },
};

export const mesa: CityModule = {
  name: 'Mesa',
  query: async (lat, lon) => {
    const r = await queryArcGisPoint(REST, lat, lon, ['Zoning', 'Description']);
    if (!r) return null;
    const code = asString(r.attributes['Zoning']);
    const desc = asString(r.attributes['Description']);
    const known = code ? TABLE[code] : null;
    if (known) {
      return buildResult({ jurisdiction: 'Mesa', zoning_code: code, ...known }, r.sourceUrl);
    }
    return buildResult(
      {
        jurisdiction: 'Mesa',
        zoning_code: code,
        district_name: desc ?? (code ? `Mesa district ${code}` : 'Mesa — unknown'),
        category: 'other',
        min_lot_size_sf: null,
        setbacks_ft: { front: null, side: null, rear: null },
        max_height_ft: null,
        max_density_du_per_acre: null,
        detached_dwelling_allowed: null,
        ordinance_reference: REF,
        confidence: 'low',
        note: `Mesa zoning code ${code ?? '(none)'} not in agent table. Consult Mesa Title 11 zoning ordinance.`,
      },
      r.sourceUrl,
    );
  },
};
