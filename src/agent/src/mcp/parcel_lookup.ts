import { z } from 'zod';
import type { ParcelRecord } from '../types.js';

const MARICOPA_PARCEL_REST =
  process.env.MARICOPA_PARCEL_REST ??
  'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query';

export const parcelLookupSchema = z.object({
  apn: z
    .string()
    .min(6)
    .describe(
      "Maricopa County Assessor Parcel Number (APN). Accepts plain digits ('13105001A') or dashed form ('131-05-001A').",
    ),
});

export type ParcelLookupInput = z.infer<typeof parcelLookupSchema>;

interface ArcGisFeature {
  attributes: Record<string, unknown>;
  geometry?: {
    rings?: number[][][];
    type?: string;
  };
}

interface ArcGisResponse {
  features?: ArcGisFeature[];
  error?: { message: string };
}

const stripNonAlnum = (raw: string): string => raw.replace(/[^0-9A-Za-z]/g, '');

const ringsToGeoJson = (
  rings: number[][][] | undefined,
): GeoJSON.Polygon | GeoJSON.MultiPolygon | null => {
  if (!rings || rings.length === 0) return null;
  if (rings.length === 1) return { type: 'Polygon', coordinates: rings };
  return { type: 'MultiPolygon', coordinates: rings.map((r) => [r]) };
};

const asString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
const asNumber = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)))
    return Number(v);
  return null;
};

export const parcelLookup = async (
  input: ParcelLookupInput,
): Promise<ParcelRecord> => {
  const flat = stripNonAlnum(input.apn);
  // Maricopa stores APN both flat ('13105001') and dashed ('131-05-001'). Try both.
  const where = `APN='${flat}' OR APN_DASH='${input.apn}' OR APN_DASH LIKE '%${flat}%'`;
  const params = new URLSearchParams({
    where,
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
    resultRecordCount: '1',
  });
  const url = `${MARICOPA_PARCEL_REST}?${params.toString()}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(
      `Maricopa parcel REST returned ${res.status} ${res.statusText} for ${url}`,
    );
  }
  const data = (await res.json()) as ArcGisResponse;
  if (data.error) {
    throw new Error(`Maricopa parcel REST error: ${data.error.message}`);
  }
  if (!data.features || data.features.length === 0) {
    throw new Error(`No parcel found for APN '${input.apn}' in Maricopa County.`);
  }

  const feat = data.features[0]!;
  const a = feat.attributes;

  // LAND_SIZE in Maricopa Assessor data is square feet for residential parcels.
  // Acres are derived from LAND_SIZE / 43560.
  const lotSizeSf = asNumber(a['LAND_SIZE']);
  const lotSizeAcres = lotSizeSf !== null ? lotSizeSf / 43560 : null;

  // Centroid: prefer the assessor's own LATITUDE/LONGITUDE; fall back to ring centroid.
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
    apn: asString(a['APN']) ?? flat,
    owner: asString(a['OWNER_NAME']),
    lot_size_sf: lotSizeSf,
    lot_size_acres: lotSizeAcres,
    // PUC = Property Use Code; combined with JURISDICTION it gives a useful "current use" hint.
    current_use: asString(a['PUC']) ?? asString(a['JURISDICTION']),
    zoning_code: asString(a['CITY_ZONING']),
    address: asString(a['PHYSICAL_ADDRESS']),
    centroid,
    boundary,
    source_url: url,
    fetched_at: new Date().toISOString(),
  };
};
