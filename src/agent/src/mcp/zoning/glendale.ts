import type { CityModule, ZoningResult } from './types.js';
import { asString, buildResult, queryArcGisPoint } from './helpers.js';

// Glendale (AZ) zoning — official GisAdmin_COG service on AGOL.
// Fields: BASE_ZONE (the canonical code), ZONING (descriptive), OVERLAY.
const REST =
  process.env.GLENDALE_ZONING_REST ??
  'https://services1.arcgis.com/9fVTQQSiODPjLUTa/arcgis/rest/services/Glendale_Zoning/FeatureServer/0/query';

type Entry = Omit<ZoningResult, 'jurisdiction' | 'zoning_code' | 'source_url' | 'fetched_at'>;
const REF = 'Glendale Zoning Ordinance';

const TABLE: Record<string, Entry> = {
  'A-1': { district_name: 'Agricultural', category: 'agricultural', min_lot_size_sf: 43560, setbacks_ft: { front: 40, side: 25, rear: 40 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify Glendale Zoning Ordinance.' },
  'RR-45': { district_name: 'Rural Residential, 45,000 sf min', category: 'single_family', min_lot_size_sf: 45000, setbacks_ft: { front: 40, side: 20, rear: 40 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'SR-30': { district_name: 'Suburban Residential, 30,000 sf', category: 'single_family', min_lot_size_sf: 30000, setbacks_ft: { front: 35, side: 15, rear: 30 }, max_height_ft: 30, max_density_du_per_acre: 1, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'SR-17': { district_name: 'Suburban Residential, 17,000 sf', category: 'single_family', min_lot_size_sf: 17000, setbacks_ft: { front: 30, side: 10, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 2, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'SR-12': { district_name: 'Suburban Residential, 12,000 sf', category: 'single_family', min_lot_size_sf: 12000, setbacks_ft: { front: 25, side: 8, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 3, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-10': { district_name: 'Single-Family Residence, 10,000 sf', category: 'single_family', min_lot_size_sf: 10000, setbacks_ft: { front: 25, side: 7, rear: 25 }, max_height_ft: 30, max_density_du_per_acre: 4, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-8': { district_name: 'Single-Family Residence, 8,000 sf', category: 'single_family', min_lot_size_sf: 8000, setbacks_ft: { front: 25, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 5, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-7': { district_name: 'Single-Family Residence, 7,000 sf', category: 'single_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 6, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-6': { district_name: 'Single-Family Residence, 6,000 sf', category: 'single_family', min_lot_size_sf: 6000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 7, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R1-4': { district_name: 'Single-Family Residence, 4,000 sf', category: 'single_family', min_lot_size_sf: 4000, setbacks_ft: { front: 15, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 10, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-2': { district_name: 'Multifamily Residential, low density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: 17, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-3': { district_name: 'Multifamily Residential, mid density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 40, max_density_du_per_acre: 25, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-4': { district_name: 'Multifamily Residential, high density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 56, max_density_du_per_acre: 36, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'medium', note: 'Verify.' },
  'R-5': { district_name: 'Multifamily Residential, very high density', category: 'multi_family', min_lot_size_sf: 7000, setbacks_ft: { front: 20, side: 5, rear: 20 }, max_height_ft: 70, max_density_du_per_acre: 50, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'R-O': { district_name: 'Residential-Office', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: 20, side: 7, rear: 20 }, max_height_ft: 30, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Office in residential context. Verify.' },
  'C-1': { district_name: 'Neighborhood Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 30, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'C-2': { district_name: 'Intermediate Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'C-3': { district_name: 'General Commercial', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 60, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'C-O': { district_name: 'Commercial Office', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 40, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  BP: { district_name: 'Business Park', category: 'commercial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 60, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'M-1': { district_name: 'Light Industrial', category: 'industrial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 56, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  'M-2': { district_name: 'Heavy Industrial', category: 'industrial', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 80, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Verify.' },
  PAD: { district_name: 'Planned Area Development', category: 'planned', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: null, max_density_du_per_acre: null, detached_dwelling_allowed: true, ordinance_reference: REF, confidence: 'low', note: 'PAD — verify governing ordinance.' },
  PR: { district_name: 'Park & Recreation', category: 'other', min_lot_size_sf: null, setbacks_ft: { front: null, side: null, rear: null }, max_height_ft: 30, max_density_du_per_acre: null, detached_dwelling_allowed: false, ordinance_reference: REF, confidence: 'low', note: 'Public park / recreation.' },
};

export const glendale: CityModule = {
  name: 'Glendale',
  query: async (lat, lon) => {
    const r = await queryArcGisPoint(REST, lat, lon, ['BASE_ZONE', 'ZONING', 'OVERLAY']);
    if (!r) return null;
    const code = asString(r.attributes['BASE_ZONE']);
    const desc = asString(r.attributes['ZONING']);
    const overlay = asString(r.attributes['OVERLAY']);
    const known = code ? TABLE[code] : null;
    const overlayNote = overlay ? ` Overlay: ${overlay}.` : '';
    if (known) {
      return buildResult(
        {
          jurisdiction: 'Glendale',
          zoning_code: code,
          ...known,
          note: known.note + overlayNote,
        },
        r.sourceUrl,
      );
    }
    return buildResult(
      {
        jurisdiction: 'Glendale',
        zoning_code: code,
        district_name: desc ?? (code ? `Glendale district ${code}` : 'Glendale — unknown'),
        category: 'other',
        min_lot_size_sf: null,
        setbacks_ft: { front: null, side: null, rear: null },
        max_height_ft: null,
        max_density_du_per_acre: null,
        detached_dwelling_allowed: null,
        ordinance_reference: REF,
        confidence: 'low',
        note: `Glendale zoning code ${code ?? '(none)'} not in agent table.${overlayNote} Consult Glendale Zoning Ordinance.`,
      },
      r.sourceUrl,
    );
  },
};
