import type { CityModule, ZoningResult } from './types.js';

/**
 * Builds a "hint-only" city module for jurisdictions that have no public
 * zoning REST endpoint. The module:
 *
 * - Returns null in the dispatcher's parallel scan (so it doesn't
 *   false-match other jurisdictions).
 * - Is used by the dispatcher's hint path: when the agent passes a city
 *   hint matching this module's stub.cityKey, the dispatcher returns
 *   stub.record directly with a fresh timestamp.
 *
 * This is the honest path for cities that publish zoning maps only as
 * static PDFs or via a paid-data login. The agent confirms the parcel
 * is in that city (via Maricopa Assessor PHYSICAL_CITY) and tells the
 * user where to look manually instead of fabricating setbacks.
 */
export interface CityStub {
  cityKey: string; // upper-case key matching PHYSICAL_CITY from parcel_lookup
  record: Omit<ZoningResult, 'fetched_at'>;
}

export const buildStubRecord = (
  cityName: string,
  planningUrl: string,
  planningPhone: string,
  zoningChapter: string,
): Omit<ZoningResult, 'fetched_at'> => ({
  jurisdiction: cityName,
  zoning_code: null,
  district_name: `${cityName} — zoning not in agent (no public zoning REST endpoint)`,
  category: 'unknown',
  min_lot_size_sf: null,
  setbacks_ft: { front: null, side: null, rear: null },
  max_height_ft: null,
  max_density_du_per_acre: null,
  detached_dwelling_allowed: null,
  ordinance_reference: zoningChapter,
  confidence: 'unknown',
  note: `The City of ${cityName} does not publish a public REST endpoint for current zoning districts. The agent confirms the parcel is in ${cityName} (via Maricopa Assessor PHYSICAL_CITY) but cannot return setback / height / density values. Look up zoning manually at ${planningUrl} or call ${cityName} Planning at ${planningPhone}.`,
  source_url: planningUrl,
});

export const buildStubModule = (cityName: string): CityModule => ({
  name: cityName,
  // Parallel scan: hint-only modules never auto-match.
  query: async () => null,
});
