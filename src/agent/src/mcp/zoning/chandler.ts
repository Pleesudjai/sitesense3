import type { CityModule } from './types.js';

// City of Chandler exposes only historical zoning-amendment ordinance polygons
// (Chandler_Ordinances_Public_View — 241 features total, old code system) —
// not a current per-parcel zoning layer, and Chandler_CityLimits has only 1
// feature with a tiny extent (effectively broken). So this module is
// hint-only: it produces a "Chandler — zoning not in agent" result when the
// agent passes city='CHANDLER' (via parcel_lookup PHYSICAL_CITY), and it
// always returns null in the parallel scan so it doesn't false-match other
// jurisdictions. The dispatcher reaches this module only through the hint
// path or as the final fallback.
const NOTE =
  'The City of Chandler does not publish a public REST endpoint for current zoning districts. The agent confirms the parcel is in Chandler (via Maricopa Assessor PHYSICAL_CITY) but cannot return setback/height/density values. Look up zoning manually at https://www.chandleraz.gov/business/planning/zoning or call Chandler Planning at (480) 782-3000.';

export const chandlerStub = {
  jurisdiction: 'Chandler',
  zoning_code: null,
  district_name: 'Chandler — zoning not in agent (Chandler does not publish public zoning REST)',
  category: 'unknown' as const,
  min_lot_size_sf: null,
  setbacks_ft: { front: null, side: null, rear: null },
  max_height_ft: null,
  max_density_du_per_acre: null,
  detached_dwelling_allowed: null,
  ordinance_reference: 'Chandler Code of Ordinances Chapter 35 (Zoning)',
  confidence: 'unknown' as const,
  note: NOTE,
  source_url: 'https://www.chandleraz.gov/business/planning/zoning',
  fetched_at: '',
};

export const chandler: CityModule = {
  name: 'Chandler',
  // Parallel-scan path always returns null — Chandler only fires via the city hint.
  query: async () => null,
};
