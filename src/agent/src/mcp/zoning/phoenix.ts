import type { CityModule, ZoningResult } from './types.js';
import { asString, buildResult, queryArcGisPoint } from './helpers.js';

// Phoenix zoning service — community-curated mirror of City of Phoenix data.
// Field: ZONING (e.g., "R1-6", "R-3A", "C-2"); GEN_ZONE for the general category.
const REST =
  process.env.PHOENIX_ZONING_REST ??
  'https://services6.arcgis.com/u2Q4oAfciDZpDAD8/arcgis/rest/services/Zoning_PhoenixAZ/FeatureServer/0/query';

type Entry = Omit<ZoningResult, 'jurisdiction' | 'zoning_code' | 'source_url' | 'fetched_at'>;
const REF = 'City of Phoenix Zoning Ordinance Ch. 6 (Residential), Ch. 6.5–6.6 (Multifamily), Ch. 7+ (Commercial)';

const TABLE: Record<string, Entry> = {
  'R1-6': { district_name: 'Single-Family Residence, 6,000 sf min', category: 'single_family', min_lot_size_sf: 6000, setbacks_ft: { front: 20, side: 5, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 7, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify against current Phoenix Zoning Ordinance.' },
  'R1-8': { district_name: 'Single-Family Residence, 8,000 sf', category: 'single_family', min_lot_size_sf: 8000, setbacks_ft: { front: 25, side: 5, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 5, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-10': { district_name: 'Single-Family Residence, 10,000 sf', category: 'single_family', min_lot_size_sf: 10000, setbacks_ft: { front: 30, side: 8, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 4, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-14': { district_name: 'Single-Family Residence, 14,000 sf', category: 'single_family', min_lot_size_sf: 14000, setbacks_ft: { front: 30, side: 10, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 3, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-18': { district_name: 'Single-Family Residence, 18,000 sf', category: 'single_family', min_lot_size_sf: 18000, setbacks_ft: { front: 40, side: 10, rear: 30 }, max_height_ft: 30, max_density_du_per_acre: 2, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-35': { district_name: 'Single-Family Residence, 35,000 sf', category: 'single_family', min_lot_size_sf: 35000, setbacks_ft: { front: 40, side: 20, rear: 30 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-2': { district_name: 'Multifamily, low density', category: 'multi_family', min_lot_size_sf: 6000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 17, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-3': { district_name: 'Multifamily, mid density', category: 'multi_family', min_lot_size_sf: 6000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 40, max_density_du_per_acre: 36, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-4': { district_name: 'Multifamily, high density', category: 'multi_family', min_lot_size_sf: 6000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 56, max_density_du_per_acre: 43, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-5': { district_name: 'Multifamily, very high density', category: 'multi_family', min_lot_size_sf: 6000, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 70, max_density_du_per_acre: 87, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'C-1': { district_name: 'Neighborhood Retail Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 30, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Setback rules vary by adjacent residential. Verify ordinance.' },
  'C-2': { district_name: 'Intermediate Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 56, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify ordinance.' },
  'C-3': { district_name: 'General Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 250, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify ordinance.' },
};

const matchPrefix = (code: string): Entry | null => {
  // Phoenix uses suffix variants like R1-6 RI (Reduced Intensity), R-3A, etc.
  // Strip suffix letters and try the base code.
  const base = code.replace(/\s.*$/, '').replace(/[A-Z]+$/i, (m) =>
    /^[A-Z]+$/.test(m) && code.endsWith(m) ? '' : m,
  );
  const trial = TABLE[base] ?? TABLE[code.split(/[\s-]/)[0] ?? ''];
  return trial ?? null;
};

export const phoenix: CityModule = {
  name: 'Phoenix',
  query: async (lat, lon) => {
    const r = await queryArcGisPoint(REST, lat, lon, ['ZONING', 'GEN_ZONE', 'LABEL1']);
    if (!r) return null;
    const code = asString(r.attributes['ZONING']) ?? asString(r.attributes['LABEL1']);
    const genZone = asString(r.attributes['GEN_ZONE']);
    const known = code ? (TABLE[code] ?? matchPrefix(code)) : null;
    if (known) {
      return buildResult({ jurisdiction: 'Phoenix', zoning_code: code, ...known }, r.sourceUrl);
    }
    return buildResult(
      {
        jurisdiction: 'Phoenix',
        zoning_code: code,
        district_name: code ? `Phoenix district ${code}${genZone ? ` (${genZone})` : ''}` : 'Phoenix — unknown',
        category: 'other',
        min_lot_size_sf: null,
        setbacks_ft: { front: null, side: null, rear: null },
        max_height_ft: null,
        max_density_du_per_acre: null,
        detached_dwelling_allowed: null,
        ordinance_reference: REF,
        confidence: 'low',
        note: `Zoning code ${code ?? '(none returned)'} not in agent table. Consult Phoenix Zoning Ordinance for setback, height, and density standards.`,
      },
      r.sourceUrl,
    );
  },
};
