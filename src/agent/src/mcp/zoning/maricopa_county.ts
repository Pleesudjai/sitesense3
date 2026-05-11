import type { CityModule, ZoningResult } from './types.js';
import { asString, buildResult, queryArcGisPoint } from './helpers.js';

// Maricopa County unincorporated zoning — PND/PlanNet layer 11.
// Field: ZONE. JURIS field is always 'COUNTY' for this layer (covers
// only unincorporated areas).
const REST =
  process.env.MARICOPA_COUNTY_ZONING_REST ??
  'https://gis.maricopa.gov/arcgis/rest/services/PND/PlanNet/MapServer/11/query';

type Entry = Omit<ZoningResult, 'jurisdiction' | 'zoning_code' | 'source_url' | 'fetched_at'>;
const REF = 'Maricopa County Zoning Ordinance (rural and unincorporated areas)';

const TABLE: Record<string, Entry> = {
  'RU-43': { district_name: 'Rural-43 (1 ac min lot)', category: 'agricultural', min_lot_size_sf: 43560, setbacks_ft: { front: 40, side: 30, rear: 40 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Rural-43 is the most common Maricopa County unincorporated zone. Verify against current ordinance.' },
  'RU-70': { district_name: 'Rural-70 (70,000 sf min lot, ~1.6 ac)', category: 'agricultural', min_lot_size_sf: 70000, setbacks_ft: { front: 40, side: 30, rear: 40 }, max_height_ft: 30, max_density_du_per_acre: 0.6, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'RU-190': { district_name: 'Rural-190 (190,000 sf min, ~4.4 ac)', category: 'agricultural', min_lot_size_sf: 190000, setbacks_ft: { front: 50, side: 40, rear: 50 }, max_height_ft: 30, max_density_du_per_acre: 0.2, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Very low density rural. Verify.' },
  'R1-6': { district_name: 'Single-Family Residence, 6,000 sf', category: 'single_family', min_lot_size_sf: 6000, setbacks_ft: { front: 20, side: 5, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 7, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-7': { district_name: 'Single-Family Residence, 7,000 sf', category: 'single_family', min_lot_size_sf: 7000, setbacks_ft: { front: 25, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 6, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-8': { district_name: 'Single-Family Residence, 8,000 sf', category: 'single_family', min_lot_size_sf: 8000, setbacks_ft: { front: 25, side: 7, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 5, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-10': { district_name: 'Single-Family Residence, 10,000 sf', category: 'single_family', min_lot_size_sf: 10000, setbacks_ft: { front: 30, side: 8, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 4, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-18': { district_name: 'Single-Family Residence, 18,000 sf', category: 'single_family', min_lot_size_sf: 18000, setbacks_ft: { front: 40, side: 10, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 2, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-35': { district_name: 'Single-Family Residence, 35,000 sf', category: 'single_family', min_lot_size_sf: 35000, setbacks_ft: { front: 40, side: 20, rear: 30 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-2': { district_name: 'Multiple-Family Residence, low density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 17, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-3': { district_name: 'Multiple-Family Residence, mid density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 40, max_density_du_per_acre: 36, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-4': { district_name: 'Multiple-Family Residence, high density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 56, max_density_du_per_acre: 43, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-5': { district_name: 'Multiple-Family Residence, very high density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 70, max_density_du_per_acre: 60, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'C-1': { district_name: 'Neighborhood Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 30, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'C-2': { district_name: 'Intermediate Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'C-3': { district_name: 'General Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 60, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'C-O': { district_name: 'Commercial Office', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'C-S': { district_name: 'Commercial Service', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'IND-1': { district_name: 'Industrial-1, light', category: 'industrial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'IND-2': { district_name: 'Industrial-2, medium', category: 'industrial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 60, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'IND-3': { district_name: 'Industrial-3, heavy', category: 'industrial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 80, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'AD-1': { district_name: 'Airport District-1', category: 'other', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: null, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Airport-related restrictions apply. Verify.' },
  'AD-2': { district_name: 'Airport District-2', category: 'other', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: null, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Airport-related restrictions apply. Verify.' },
  'AD-3': { district_name: 'Airport District-3', category: 'other', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: null, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Airport-related restrictions apply. Verify.' },
};

export const maricopaCounty: CityModule = {
  name: 'Maricopa County (unincorporated)',
  query: async (lat, lon) => {
    const r = await queryArcGisPoint(REST, lat, lon, ['ZONE', 'JURIS']);
    if (!r) return null;
    // Layer 11 only contains unincorporated polygons; JURIS is always 'COUNTY'.
    const rawCode = asString(r.attributes['ZONE']);
    // Some codes have trailing spaces or modifier suffixes ('R1-6 RUPD' etc.).
    const code = rawCode?.trim() ?? null;
    const baseCode = code?.split(/\s+/)[0] ?? null;
    const known = (code && TABLE[code]) || (baseCode && TABLE[baseCode]) || null;
    if (known) {
      return buildResult(
        { jurisdiction: 'Maricopa County (unincorporated)', zoning_code: code, ...known },
        r.sourceUrl,
      );
    }
    return buildResult(
      {
        jurisdiction: 'Maricopa County (unincorporated)',
        zoning_code: code,
        district_name: code ? `Maricopa County district ${code}` : 'Maricopa County — unknown',
        category: 'other',
        min_lot_size_sf: null,
        setbacks_ft: { front: null, side: null, rear: null },
        max_height_ft: null,
        max_density_du_per_acre: null,
        detached_dwelling_allowed: null,
        ordinance_reference: REF,
        confidence: 'low',
        note: `Maricopa County zone ${code ?? '(none)'} not in agent table. Consult the Maricopa County Zoning Ordinance.`,
      },
      r.sourceUrl,
    );
  },
};
