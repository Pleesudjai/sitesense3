import { z } from 'zod';

const FEMA_NFHL_REST =
  process.env.FEMA_NFHL_REST ??
  // The /gis/nfhl/ path returns 404 as of 2026-05; FEMA now serves NFHL under /arcgis/.
  // Layer 28 = "Flood Hazard Zones".
  'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query';

export const floodZoneSchema = z.object({
  lat: z.number().min(-90).max(90).describe('Latitude in WGS84 decimal degrees.'),
  lon: z.number().min(-180).max(180).describe('Longitude in WGS84 decimal degrees.'),
});

export type FloodZoneInput = z.infer<typeof floodZoneSchema>;

export interface FloodZoneRecord {
  zone: string;
  zone_description: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN';
  sfha: boolean;
  bfe_ft: number | null;
  in_mapped_zone: boolean;
  source_url: string;
  fetched_at: string;
}

const ZONE_DESCRIPTIONS: Record<string, string> = {
  AE: 'Special Flood Hazard Area (1% annual chance) — base flood elevation established',
  A: 'Special Flood Hazard Area (1% annual chance) — no BFE established',
  AO: 'Special Flood Hazard Area — shallow flooding, sheet flow',
  AH: 'Special Flood Hazard Area — shallow ponding, BFE established',
  VE: 'Coastal High Hazard Area — wave action, BFE established',
  V: 'Coastal High Hazard Area — wave action, no BFE',
  X: 'Minimal flood risk (outside the 0.2% annual chance / 500-yr floodplain)',
  'X (shaded)': 'Moderate flood risk (between the 1% and 0.2% annual chance floodplains)',
  B: 'Moderate flood risk (between 100- and 500-year floodplain, older designation)',
  C: 'Minimal flood risk (older designation)',
  D: 'Possible but undetermined flood hazard',
};

const ZONE_RISK: Record<string, 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN'> = {
  AE: 'HIGH',
  A: 'HIGH',
  AO: 'HIGH',
  AH: 'HIGH',
  VE: 'HIGH',
  V: 'HIGH',
  X: 'LOW',
  'X (shaded)': 'MODERATE',
  B: 'MODERATE',
  C: 'LOW',
  D: 'UNKNOWN',
};

interface ArcGisResponse {
  features?: Array<{ attributes: Record<string, unknown> }>;
  error?: { message: string };
}

const asString = (v: unknown): string =>
  typeof v === 'string' ? v.trim() : v == null ? '' : String(v);

export const floodZone = async (
  input: FloodZoneInput,
): Promise<FloodZoneRecord> => {
  const params = new URLSearchParams({
    geometry: `${input.lon},${input.lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'FLD_ZONE,SFHA_TF,STATIC_BFE,ZONE_SUBTY,DEPTH,V_DATUM',
    returnGeometry: 'false',
    f: 'json',
  });
  const url = `${FEMA_NFHL_REST}?${params.toString()}`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 12000);
  let res: Response;
  try {
    res = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`FEMA NFHL returned ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as ArcGisResponse;
  if (data.error) throw new Error(`FEMA NFHL error: ${data.error.message}`);

  const features = data.features ?? [];
  if (features.length === 0) {
    // Point doesn't intersect any mapped flood polygon.
    // FEMA treats this as Zone X (minimal risk) by convention.
    return {
      zone: 'X',
      zone_description:
        'Point does not intersect any mapped FEMA flood polygon — treated as Zone X (minimal risk) by convention. Verify against the local FIRM panel for the property.',
      risk_level: 'LOW',
      sfha: false,
      bfe_ft: null,
      in_mapped_zone: false,
      source_url: url,
      fetched_at: new Date().toISOString(),
    };
  }

  const a = features[0]!.attributes;
  const rawZone = asString(a['FLD_ZONE']) || 'X';
  const subtype = asString(a['ZONE_SUBTY']);
  // FEMA encodes shaded X as FLD_ZONE='X' with ZONE_SUBTY mentioning '0.2 PCT'.
  const zone =
    rawZone === 'X' && subtype.includes('0.2 PCT') ? 'X (shaded)' : rawZone;

  const bfeRaw = a['STATIC_BFE'];
  const bfeNum = typeof bfeRaw === 'number' ? bfeRaw : Number(bfeRaw);
  // FEMA encodes "no BFE" as -9999 in STATIC_BFE.
  const bfe = Number.isFinite(bfeNum) && bfeNum > 0 && bfeNum < 9999 ? bfeNum : null;

  return {
    zone,
    zone_description: ZONE_DESCRIPTIONS[zone] ?? `Flood Zone ${zone}`,
    risk_level: ZONE_RISK[zone] ?? 'UNKNOWN',
    sfha: asString(a['SFHA_TF']).toUpperCase() === 'T',
    bfe_ft: bfe,
    in_mapped_zone: true,
    source_url: url,
    fetched_at: new Date().toISOString(),
  };
};
