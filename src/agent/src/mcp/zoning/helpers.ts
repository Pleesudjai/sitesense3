import type { ZoningResult } from './types.js';

interface ArcGisResponse {
  features?: Array<{ attributes: Record<string, unknown> }>;
  error?: { message: string };
}

export const queryArcGisPoint = async (
  baseUrl: string,
  lat: number,
  lon: number,
  outFields: string[],
  timeoutMs = 10000,
): Promise<{ attributes: Record<string, unknown>; sourceUrl: string } | null> => {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: outFields.join(','),
    returnGeometry: 'false',
    f: 'json',
  });
  const url = `${baseUrl}?${params.toString()}`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`Zoning REST returned ${res.status} ${res.statusText} for ${baseUrl}`);
  }
  const data = (await res.json()) as ArcGisResponse;
  if (data.error) throw new Error(`Zoning REST error: ${data.error.message}`);

  const feats = data.features ?? [];
  if (feats.length === 0) return null;
  return { attributes: feats[0]!.attributes, sourceUrl: url };
};

export const asString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : null;

export const buildResult = (
  base: Omit<ZoningResult, 'source_url' | 'fetched_at'>,
  sourceUrl: string,
): ZoningResult => ({
  ...base,
  source_url: sourceUrl,
  fetched_at: new Date().toISOString(),
});
