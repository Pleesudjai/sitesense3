import { z } from 'zod';
import type { ParcelRecord } from '../types.js';

const NOMINATIM_URL =
  process.env.NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org/search';
const MARICOPA_PARCEL_REST =
  process.env.MARICOPA_PARCEL_REST ??
  'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query';

export const addressToApnSchema = z.object({
  address: z
    .string()
    .min(5)
    .describe(
      'Street address. Best results with full format: "1435 N Dorsey Ln, Tempe AZ 85288". Must be a Maricopa County, AZ address.',
    ),
});

export type AddressToApnInput = z.infer<typeof addressToApnSchema>;

interface NominatimHit {
  lat: string;
  lon: string;
  display_name: string;
}

interface ArcGisFeature {
  attributes: Record<string, unknown>;
  geometry?: { rings?: number[][][] };
}

interface ArcGisResponse {
  features?: ArcGisFeature[];
  error?: { message: string };
}

const asString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
const asNumber = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)))
    return Number(v);
  return null;
};
const ringsToGeoJson = (
  rings: number[][][] | undefined,
): GeoJSON.Polygon | GeoJSON.MultiPolygon | null => {
  if (!rings || rings.length === 0) return null;
  if (rings.length === 1) return { type: 'Polygon', coordinates: rings };
  return { type: 'MultiPolygon', coordinates: rings.map((r) => [r]) };
};

const geocode = async (
  address: string,
): Promise<{ lat: number; lon: number; matched: string }> => {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    countrycodes: 'us',
  });
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 10000);
  let res: Response;
  try {
    res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      signal: ac.signal,
      headers: {
        // Nominatim requires a User-Agent; identify ourselves clearly.
        'User-Agent': 'SiteSenseAgent/0.1 (sitesense; geocoder)',
        Accept: 'application/json',
      },
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`Nominatim returned ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as NominatimHit[];
  const hit = data[0];
  if (!hit) {
    throw new Error(`Nominatim could not geocode address: "${address}"`);
  }
  return {
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    matched: hit.display_name,
  };
};

const parcelByPoint = async (
  lat: number,
  lon: number,
): Promise<{ feat: ArcGisFeature; sourceUrl: string }> => {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
    resultRecordCount: '1',
  });
  const url = `${MARICOPA_PARCEL_REST}?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Maricopa parcel REST returned ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as ArcGisResponse;
  if (data.error) throw new Error(`Maricopa parcel REST error: ${data.error.message}`);
  const feats = data.features ?? [];
  if (feats.length === 0) {
    throw new Error(
      `No Maricopa parcel intersects (${lat}, ${lon}). The address may be outside Maricopa County, or on a right-of-way / open space that is not a recorded parcel.`,
    );
  }
  return { feat: feats[0]!, sourceUrl: url };
};

export const addressToApn = async (
  input: AddressToApnInput,
): Promise<ParcelRecord & { matched_address: string }> => {
  const geo = await geocode(input.address);
  const { feat, sourceUrl } = await parcelByPoint(geo.lat, geo.lon);
  const a = feat.attributes;

  const lotSizeSf = asNumber(a['LAND_SIZE']);
  const lotSizeAcres = lotSizeSf !== null ? lotSizeSf / 43560 : null;

  const lat = asNumber(a['LATITUDE']);
  const lon = asNumber(a['LONGITUDE']);
  let centroid: { lat: number; lon: number } | null =
    lat !== null && lon !== null ? { lat, lon } : null;

  const boundary = ringsToGeoJson(feat.geometry?.rings);
  if (!centroid && boundary && boundary.type === 'Polygon') {
    const ring = boundary.coordinates[0];
    if (ring && ring.length > 0) {
      const sum = ring.reduce<{ x: number; y: number }>(
        (acc, pt: number[]) => ({
          x: acc.x + (pt[0] ?? 0),
          y: acc.y + (pt[1] ?? 0),
        }),
        { x: 0, y: 0 },
      );
      centroid = { lon: sum.x / ring.length, lat: sum.y / ring.length };
    }
  }

  return {
    apn: asString(a['APN']) ?? '',
    owner: asString(a['OWNER_NAME']),
    lot_size_sf: lotSizeSf,
    lot_size_acres: lotSizeAcres,
    current_use: asString(a['PUC']) ?? asString(a['JURISDICTION']),
    zoning_code: asString(a['CITY_ZONING']),
    address: asString(a['PHYSICAL_ADDRESS']),
    centroid,
    boundary,
    source_url: sourceUrl,
    fetched_at: new Date().toISOString(),
    matched_address: geo.matched,
  };
};
