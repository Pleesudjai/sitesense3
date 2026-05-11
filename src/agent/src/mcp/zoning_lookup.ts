import { z } from 'zod';
import type { CityModule, ZoningResult } from './zoning/types.js';
import { tempe } from './zoning/tempe.js';
import { phoenix } from './zoning/phoenix.js';
import { mesa } from './zoning/mesa.js';
import { scottsdale } from './zoning/scottsdale.js';
import { gilbert } from './zoning/gilbert.js';
import { chandler, chandlerStub } from './zoning/chandler.js';
import { maricopaCounty } from './zoning/maricopa_county.js';

export const zoningLookupSchema = z.object({
  lat: z.number().min(-90).max(90).describe('Latitude in WGS84 decimal degrees.'),
  lon: z.number().min(-180).max(180).describe('Longitude in WGS84 decimal degrees.'),
  city: z
    .string()
    .optional()
    .describe(
      'Optional jurisdiction hint from parcel_lookup PHYSICAL_CITY (e.g., "TEMPE", "PHOENIX", "MESA", "SCOTTSDALE", "GILBERT", "CHANDLER"). When provided, the dispatcher tries that city first; if absent or no match, all cities + Maricopa County unincorporated are queried in parallel and the first hit wins.',
    ),
});

export type ZoningLookupInput = z.infer<typeof zoningLookupSchema>;

// Order matters for the parallel scan: city-level modules first (most authoritative
// for their territory), Chandler before County (Chandler is inside Maricopa but its
// boundaries override), Maricopa County last as the unincorporated fallback.
const MODULES: CityModule[] = [
  tempe,
  phoenix,
  mesa,
  scottsdale,
  gilbert,
  chandler,
  maricopaCounty,
];

const CITY_INDEX: Record<string, CityModule> = {
  TEMPE: tempe,
  PHOENIX: phoenix,
  MESA: mesa,
  SCOTTSDALE: scottsdale,
  GILBERT: gilbert,
  CHANDLER: chandler,
};

export type ZoningLookupRecord = ZoningResult & {
  cities_tried: string[];
};

export const zoningLookup = async (
  input: ZoningLookupInput,
): Promise<ZoningLookupRecord> => {
  const tried: string[] = [];

  // Hint dispatch — try the specified city first.
  if (input.city) {
    const hint = input.city.trim().toUpperCase();
    // Special case: Chandler has no public zoning REST. When the hint is CHANDLER
    // we return the stub directly with the current timestamp.
    if (hint === 'CHANDLER') {
      tried.push('Chandler');
      return {
        ...chandlerStub,
        fetched_at: new Date().toISOString(),
        cities_tried: tried,
      };
    }
    const hinted = CITY_INDEX[hint];
    if (hinted) {
      tried.push(hinted.name);
      try {
        const r = await hinted.query(input.lat, input.lon);
        if (r) return { ...r, cities_tried: tried };
      } catch {
        /* fall through to parallel scan */
      }
    }
  }

  // Parallel scan across all city modules. First non-null result wins.
  // Tracked.allSettled so a single broken endpoint doesn't kill the lookup.
  const remaining = input.city
    ? MODULES.filter(
        (m) => m.name.toUpperCase() !== input.city!.trim().toUpperCase(),
      )
    : MODULES;
  for (const m of remaining) tried.push(m.name);

  const results = await Promise.allSettled(
    remaining.map((m) => m.query(input.lat, input.lon)),
  );
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) return { ...r.value, cities_tried: tried };
  }

  // No match anywhere — point is outside all covered jurisdictions.
  const fetchedAt = new Date().toISOString();
  return {
    jurisdiction: 'Outside covered jurisdictions',
    zoning_code: null,
    district_name: 'Not in any covered Maricopa city',
    category: 'unknown',
    min_lot_size_sf: null,
    setbacks_ft: { front: null, side: null, rear: null },
    max_height_ft: null,
    max_density_du_per_acre: null,
    detached_dwelling_allowed: null,
    ordinance_reference: 'N/A',
    confidence: 'unknown',
    note: `Tried: ${tried.join(', ')}. Point did not intersect any covered city's zoning layer or Maricopa County unincorporated. Likely a Maricopa city not yet in the agent (Goodyear, Avondale, Surprise, Peoria, Buckeye, Glendale, Apache Junction, etc.) or outside Maricopa County entirely.`,
    source_url: 'N/A',
    fetched_at: fetchedAt,
    cities_tried: tried,
  };
};
