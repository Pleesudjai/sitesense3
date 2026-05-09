import { z } from 'zod';
import type { CityModule, ZoningResult } from './zoning/types.js';
import { tempe } from './zoning/tempe.js';
import { phoenix } from './zoning/phoenix.js';
import { mesa } from './zoning/mesa.js';
import { scottsdale } from './zoning/scottsdale.js';
import { gilbert } from './zoning/gilbert.js';

export const zoningLookupSchema = z.object({
  lat: z.number().min(-90).max(90).describe('Latitude in WGS84 decimal degrees.'),
  lon: z.number().min(-180).max(180).describe('Longitude in WGS84 decimal degrees.'),
  city: z
    .string()
    .optional()
    .describe(
      'Optional jurisdiction hint from parcel_lookup PHYSICAL_CITY (e.g., "TEMPE", "PHOENIX", "MESA", "SCOTTSDALE", "GILBERT"). When provided, the dispatcher tries that city first; if absent or no match, all cities are queried in parallel and the first hit wins.',
    ),
});

export type ZoningLookupInput = z.infer<typeof zoningLookupSchema>;

const MODULES: CityModule[] = [tempe, phoenix, mesa, scottsdale, gilbert];

const CITY_INDEX: Record<string, CityModule> = {
  TEMPE: tempe,
  PHOENIX: phoenix,
  MESA: mesa,
  SCOTTSDALE: scottsdale,
  GILBERT: gilbert,
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
    const hinted = CITY_INDEX[input.city.trim().toUpperCase()];
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
    note: `Tried: ${tried.join(', ')}. Point did not intersect any covered city's zoning layer. Likely Maricopa County unincorporated or a city not yet in the agent (Chandler, Goodyear, Avondale, Surprise, Peoria, etc.).`,
    source_url: 'N/A',
    fetched_at: fetchedAt,
    cities_tried: tried,
  };
};
