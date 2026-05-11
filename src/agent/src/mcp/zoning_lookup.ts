import { z } from 'zod';
import type { CityModule, ZoningResult } from './zoning/types.js';
import { tempe } from './zoning/tempe.js';
import { phoenix } from './zoning/phoenix.js';
import { mesa } from './zoning/mesa.js';
import { scottsdale } from './zoning/scottsdale.js';
import { gilbert } from './zoning/gilbert.js';
import { chandler, chandlerStub } from './zoning/chandler.js';
import { glendale } from './zoning/glendale.js';
import {
  goodyear, goodyearStub,
  avondale, avondaleStub,
  surprise, surpriseStub,
  peoria, peoriaStub,
} from './zoning/stubs_west_valley.js';
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

// Order matters for the parallel scan: real-data city modules first (most
// authoritative for their territory), hint-only stubs are no-ops in the scan,
// Maricopa County last as the unincorporated fallback.
const MODULES: CityModule[] = [
  tempe,
  phoenix,
  mesa,
  scottsdale,
  gilbert,
  glendale,
  chandler, // no-op in scan
  goodyear, // no-op in scan
  avondale, // no-op in scan
  surprise, // no-op in scan
  peoria, // no-op in scan
  maricopaCounty,
];

const CITY_INDEX: Record<string, CityModule> = {
  TEMPE: tempe,
  PHOENIX: phoenix,
  MESA: mesa,
  SCOTTSDALE: scottsdale,
  GILBERT: gilbert,
  GLENDALE: glendale,
  CHANDLER: chandler,
  GOODYEAR: goodyear,
  AVONDALE: avondale,
  SURPRISE: surprise,
  PEORIA: peoria,
};

// Stubs that bypass the parallel scan and return a "no-public-REST" record
// directly when the agent passes their city as a hint.
const STUB_BY_HINT: Record<string, Omit<typeof chandlerStub, 'fetched_at'>> = {
  CHANDLER: chandlerStub,
  GOODYEAR: goodyearStub,
  AVONDALE: avondaleStub,
  SURPRISE: surpriseStub,
  PEORIA: peoriaStub,
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
    // Cities with no public zoning REST: return the stub directly via the hint.
    const stub = STUB_BY_HINT[hint];
    if (stub) {
      tried.push(stub.jurisdiction);
      return {
        ...stub,
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
    note: `Tried: ${tried.join(', ')}. Point did not intersect any covered jurisdiction (Tempe, Phoenix, Mesa, Scottsdale, Gilbert, Glendale with full data; Chandler, Goodyear, Avondale, Surprise, Peoria via hint-only stubs; Maricopa County unincorporated as fallback). Likely a Maricopa city not yet in the agent (Buckeye, Apache Junction, El Mirage, Tolleson, Fountain Hills, Litchfield Park, Paradise Valley, etc.) or outside Maricopa County entirely.`,
    source_url: 'N/A',
    fetched_at: fetchedAt,
    cities_tried: tried,
  };
};
