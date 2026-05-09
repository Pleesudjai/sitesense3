import type { CityModule, ZoningResult } from './types.js';
import { asString, buildResult, queryArcGisPoint } from './helpers.js';

const REST =
  process.env.TEMPE_ZONING_REST ??
  'https://services.arcgis.com/lQySeXwbBg53XWDi/arcgis/rest/services/zoning_districts/FeatureServer/1/query';

type Entry = Omit<ZoningResult, 'jurisdiction' | 'zoning_code' | 'source_url' | 'fetched_at'>;

const TABLE: Record<string, Entry> = {
  'R1-4': { district_name: 'Single-Family Residential, 4,000 sf min lot', category: 'single_family', min_lot_size_sf: 4000, setbacks_ft: { front: 15, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 10, detached_dwelling_allowed: true, ordinance_reference: 'Tempe ZDC Part 4-2', confidence: 'medium', note: 'Highest-density single-family detached. Verify with current Tempe ZDC.' },
  'R1-5': { district_name: 'Single-Family Residential, 5,000 sf', category: 'single_family', min_lot_size_sf: 5000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 8, detached_dwelling_allowed: true, ordinance_reference: 'Tempe ZDC Part 4-2', confidence: 'medium', note: 'Verify against current ZDC.' },
  'R1-6': { district_name: 'Single-Family Residential, 6,000 sf', category: 'single_family', min_lot_size_sf: 6000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 7, detached_dwelling_allowed: true, ordinance_reference: 'Tempe ZDC Part 4-2', confidence: 'medium', note: 'Verify against current ZDC.' },
  'R1-7': { district_name: 'Single-Family Residential, 7,000 sf', category: 'single_family', min_lot_size_sf: 7000, setbacks_ft: { front: 25, side: 7, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 6, detached_dwelling_allowed: true, ordinance_reference: 'Tempe ZDC Part 4-2', confidence: 'medium', note: 'Verify against current ZDC.' },
  'R1-8': { district_name: 'Single-Family Residential, 8,000 sf', category: 'single_family', min_lot_size_sf: 8000, setbacks_ft: { front: 25, side: 7, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 5, detached_dwelling_allowed: true, ordinance_reference: 'Tempe ZDC Part 4-2', confidence: 'medium', note: 'Verify against current ZDC.' },
  'R1-10': { district_name: 'Single-Family Residential, 10,000 sf', category: 'single_family', min_lot_size_sf: 10000, setbacks_ft: { front: 30, side: 10, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 4, detached_dwelling_allowed: true, ordinance_reference: 'Tempe ZDC Part 4-2', confidence: 'medium', note: 'Verify against current ZDC.' },
  'R1-15': { district_name: 'Single-Family Residential, 15,000 sf', category: 'single_family', min_lot_size_sf: 15000, setbacks_ft: { front: 35, side: 10, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 3, detached_dwelling_allowed: true, ordinance_reference: 'Tempe ZDC Part 4-2', confidence: 'medium', note: 'Verify against current ZDC.' },
  'R1-PAD': { district_name: 'Single-Family Planned Area Development', category: 'planned', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: null, max_density_du_per_acre: null, detached_dwelling_allowed: true, ordinance_reference: 'Tempe ZDC Part 4-2 + governing PAD ordinance', confidence: 'low', note: 'PAD standards set by the governing ordinance for this subdivision; standard R1 rules do not apply.' },
  'R-2': { district_name: 'Multi-Family Limited', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 18, detached_dwelling_allowed: true, ordinance_reference: 'Tempe ZDC Part 4-3', confidence: 'medium', note: 'Verify against current ZDC.' },
  'R-3': { district_name: 'Multi-Family General', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 25, detached_dwelling_allowed: true, ordinance_reference: 'Tempe ZDC Part 4-3', confidence: 'medium', note: 'Verify.' },
  'R-4': { district_name: 'Multi-Family Med-High Density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 40, max_density_du_per_acre: 36, detached_dwelling_allowed: false, ordinance_reference: 'Tempe ZDC Part 4-3', confidence: 'medium', note: 'Verify.' },
  'R-5': { district_name: 'Multi-Family High Density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 55, max_density_du_per_acre: 50, detached_dwelling_allowed: false, ordinance_reference: 'Tempe ZDC Part 4-3', confidence: 'medium', note: 'Verify.' },
  'MU-2': { district_name: 'Mixed Use Light', category: 'mixed_use', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: 25, detached_dwelling_allowed: false, ordinance_reference: 'Tempe ZDC Part 4-5', confidence: 'low', note: 'Form-based code; refer to Tempe MU section.' },
  'MU-3': { district_name: 'Mixed Use Moderate', category: 'mixed_use', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 60, max_density_du_per_acre: 35, detached_dwelling_allowed: false, ordinance_reference: 'Tempe ZDC Part 4-5', confidence: 'low', note: 'Form-based code.' },
  'MU-4': { district_name: 'Mixed Use Intense', category: 'mixed_use', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 90, max_density_du_per_acre: 65, detached_dwelling_allowed: false, ordinance_reference: 'Tempe ZDC Part 4-5', confidence: 'low', note: 'Form-based code.' },
};

export const tempe: CityModule = {
  name: 'Tempe',
  query: async (lat, lon) => {
    const r = await queryArcGisPoint(REST, lat, lon, ['ZoningCode']);
    if (!r) return null;
    const code = asString(r.attributes['ZoningCode']);
    const known = code && TABLE[code];
    if (known) {
      return buildResult({ jurisdiction: 'Tempe', zoning_code: code, ...known }, r.sourceUrl);
    }
    return buildResult(
      {
        jurisdiction: 'Tempe',
        zoning_code: code,
        district_name: code ? `Tempe district ${code}` : 'Tempe — unknown district',
        category: 'other',
        min_lot_size_sf: null,
        setbacks_ft: { front: null, side: null, rear: null },
        max_height_ft: null,
        max_density_du_per_acre: null,
        detached_dwelling_allowed: null,
        ordinance_reference: 'Tempe ZDC',
        confidence: 'low',
        note: `Zoning code ${code ?? '(none returned)'} not in agent dimensional table. Consult Tempe ZDC.`,
      },
      r.sourceUrl,
    );
  },
};
