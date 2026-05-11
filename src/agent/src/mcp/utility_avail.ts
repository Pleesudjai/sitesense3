import { z } from 'zod';

// Data sources:
//  - SRP electric: SRP-owned AGOL service. The polygon itself is ToS-restricted
//    ("no display of this boundary is permitted without SRP written consent").
//    We use it ONLY for binary in/out classification, not for redistribution.
//    The report mentions "likely SRP service" — a public fact — not the polygon.
//  - APS electric: public APS Service Territory (CCN_ServiceTerritory) layer.
//  - Maricopa County water/sewer provider layers — sparse, only cover
//    unincorporated parcels (in-city parcels return zero features here).
//  - ADWR Municipal Service Area — authoritative water company designation
//    for the whole county including incorporated areas.
const SRP_REST =
  process.env.SRP_PSA_REST ??
  'https://services2.arcgis.com/ICaY8VX3lsUsMBRl/arcgis/rest/services/SRP_PSA/FeatureServer/3/query';
const APS_REST =
  process.env.APS_TERRITORY_REST ??
  'https://services6.arcgis.com/wF9gckwE55J0Ayag/arcgis/rest/services/CCN_ServiceTerritory/FeatureServer/0/query';
const COUNTY_WATER_REST =
  process.env.COUNTY_WATER_REST ??
  'https://gis.maricopa.gov/arcgis/rest/services/PND/PlanNet/MapServer/48/query';
const COUNTY_SEWER_REST =
  process.env.COUNTY_SEWER_REST ??
  'https://gis.maricopa.gov/arcgis/rest/services/PND/PlanNet/MapServer/50/query';
const ADWR_REST =
  process.env.ADWR_MSA_REST ??
  'https://gis.maricopa.gov/arcgis/rest/services/PND/PlanNet/MapServer/49/query';

export const utilityAvailSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  city: z
    .string()
    .optional()
    .describe('Optional PHYSICAL_CITY hint from parcel_lookup; used to infer service providers for incorporated parcels.'),
});

export type UtilityAvailInput = z.infer<typeof utilityAvailSchema>;

export interface UtilityAvailRecord {
  electric: {
    in_srp_service_area: boolean;
    in_aps_service_area: boolean;
    likely_provider: string | null;
    note: string;
  };
  water: {
    adwr_designated_company: string | null;
    county_provider: string | null;
    likely_provider: string;
    note: string;
  };
  sewer: {
    county_provider: string | null;
    likely_provider: string;
    note: string;
  };
  sources: Array<{ name: string; url: string }>;
  fetched_at: string;
}

interface ArcGisResponse {
  features?: Array<{ attributes: Record<string, unknown> }>;
  error?: { message: string };
}

const pointParams = (lat: number, lon: number, outFields: string): URLSearchParams =>
  new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields,
    returnGeometry: 'false',
    f: 'json',
  });

const queryArc = async (
  baseUrl: string,
  lat: number,
  lon: number,
  outFields: string,
  timeoutMs = 10000,
): Promise<{ features: Array<{ attributes: Record<string, unknown> }>; url: string }> => {
  const url = `${baseUrl}?${pointParams(lat, lon, outFields).toString()}`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      signal: ac.signal,
      headers: { Accept: 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`Utility REST returned ${res.status} ${res.statusText} for ${baseUrl}`);
  }
  const data = (await res.json()) as ArcGisResponse;
  if (data.error) throw new Error(`Utility REST error: ${data.error.message}`);
  return { features: data.features ?? [], url };
};

const asString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : null;

const cityKey = (s: string | undefined): string =>
  (s ?? '').trim().toUpperCase();

// Inferred service providers by city when explicit GIS data is silent.
const CITY_WATER_DEFAULTS: Record<string, string> = {
  TEMPE: 'City of Tempe Water Utilities',
  PHOENIX: 'City of Phoenix Water Services Department',
  MESA: 'City of Mesa Utilities',
  SCOTTSDALE: 'City of Scottsdale Water Resources',
  GILBERT: 'Town of Gilbert Water Resources',
  GLENDALE: 'City of Glendale Water Services',
  CHANDLER: 'City of Chandler Water Operations',
  GOODYEAR: 'City of Goodyear Water',
  AVONDALE: 'City of Avondale Water',
  SURPRISE: 'City of Surprise Water',
  PEORIA: 'City of Peoria Water Services',
  BUCKEYE: 'City of Buckeye Water',
};

const CITY_SEWER_DEFAULTS: Record<string, string> = {
  TEMPE: 'City of Tempe Wastewater',
  PHOENIX: 'City of Phoenix Water Services Department',
  MESA: 'City of Mesa Utilities (sewer)',
  SCOTTSDALE: 'City of Scottsdale Water Resources (sewer)',
  GILBERT: 'Town of Gilbert (sewer)',
  GLENDALE: 'City of Glendale (sewer)',
  CHANDLER: 'City of Chandler Wastewater',
  GOODYEAR: 'City of Goodyear (sewer)',
  AVONDALE: 'City of Avondale (sewer)',
  SURPRISE: 'City of Surprise (sewer)',
  PEORIA: 'City of Peoria (sewer)',
  BUCKEYE: 'City of Buckeye (sewer)',
};

// Cities served by SRP (where electric defaults to SRP) vs APS-served cities.
// (Both serve overlapping areas; SRP_PSA query is authoritative when it hits.)
const SRP_CITIES = new Set(['TEMPE', 'MESA', 'CHANDLER', 'GILBERT', 'SCOTTSDALE']);
const APS_DOMINANT_CITIES = new Set([
  'PHOENIX',
  'GOODYEAR',
  'AVONDALE',
  'SURPRISE',
  'PEORIA',
  'BUCKEYE',
  'GLENDALE', // Glendale is mostly APS; small SRP enclave
]);

export const utilityAvail = async (
  input: UtilityAvailInput,
): Promise<UtilityAvailRecord> => {
  const { lat, lon } = input;
  const city = cityKey(input.city);

  // 5 lookups in parallel. Promise.allSettled so a single failure doesn't kill the tool.
  const [srpRes, apsRes, waterCountyRes, sewerCountyRes, adwrRes] = await Promise.allSettled([
    queryArc(SRP_REST, lat, lon, 'OBJECTID'),
    queryArc(APS_REST, lat, lon, 'NAME,TYPE'),
    queryArc(COUNTY_WATER_REST, lat, lon, 'LABEL'),
    queryArc(COUNTY_SEWER_REST, lat, lon, 'LABEL'),
    queryArc(ADWR_REST, lat, lon, 'WATERCO'),
  ]);

  // SRP: presence of any feature = inside SRP service area.
  const inSrp = srpRes.status === 'fulfilled' && srpRes.value.features.length > 0;

  // APS: returns features even for non-APS areas, but with NAME=null. Treat
  // "feature with non-null NAME" as inside-APS.
  let inAps = false;
  if (apsRes.status === 'fulfilled') {
    for (const f of apsRes.value.features) {
      if (asString(f.attributes['NAME'])) {
        inAps = true;
        break;
      }
    }
  }

  // ADWR water company — most authoritative.
  let adwrWaterCo: string | null = null;
  if (adwrRes.status === 'fulfilled' && adwrRes.value.features[0]) {
    adwrWaterCo = asString(adwrRes.value.features[0].attributes['WATERCO']);
  }

  // County water/sewer (sparse — only unincorporated).
  const countyWater =
    waterCountyRes.status === 'fulfilled' && waterCountyRes.value.features[0]
      ? asString(waterCountyRes.value.features[0].attributes['LABEL'])
      : null;
  const countySewer =
    sewerCountyRes.status === 'fulfilled' && sewerCountyRes.value.features[0]
      ? asString(sewerCountyRes.value.features[0].attributes['LABEL'])
      : null;

  // Electric provider inference.
  let electricProvider: string | null = null;
  let electricNote: string;
  if (inSrp && inAps) {
    electricProvider = 'SRP or APS (both service areas overlap here)';
    electricNote = 'Both SRP and APS service areas cover this point; the actual provider depends on the specific service connection. Verify with the parcel owner or by calling SRP (602-236-8888) and APS (602-371-7171).';
  } else if (inSrp) {
    electricProvider = 'SRP (Salt River Project)';
    electricNote = 'Parcel is within the SRP electric service area.';
  } else if (inAps) {
    electricProvider = 'APS (Arizona Public Service)';
    electricNote = 'Parcel is within the APS Certificate of Convenience and Necessity territory.';
  } else if (SRP_CITIES.has(city)) {
    electricProvider = 'Likely SRP (city default)';
    electricNote = `${input.city ?? 'This city'} is typically served by SRP for electric. GIS lookup returned no match — verify directly with SRP.`;
  } else if (APS_DOMINANT_CITIES.has(city)) {
    electricProvider = 'Likely APS (city default)';
    electricNote = `${input.city ?? 'This city'} is typically served by APS for electric. GIS lookup returned no match — verify directly with APS.`;
  } else {
    electricProvider = null;
    electricNote = 'Could not determine electric provider from GIS or city hint. Likely options for Maricopa County: SRP, APS, or a city-owned utility. Verify with the parcel address.';
  }

  // Water provider inference.
  let waterProvider: string;
  let waterNote: string;
  if (adwrWaterCo) {
    waterProvider = adwrWaterCo;
    waterNote = `ADWR-designated water company per the Maricopa County Municipal Service Area layer.`;
  } else if (countyWater) {
    waterProvider = countyWater;
    waterNote = 'From Maricopa County water provider layer (unincorporated coverage).';
  } else if (city && CITY_WATER_DEFAULTS[city]) {
    waterProvider = CITY_WATER_DEFAULTS[city]!;
    waterNote = 'Inferred from city default — verify with city water utility billing department.';
  } else {
    waterProvider = 'Likely well water (no service area match)';
    waterNote = 'No ADWR, county, or city water provider matched. Parcel is likely on a private well; Arizona ADWR Assured Water Supply rules may apply for new development. Verify with the parcel address and ADWR.';
  }

  // Sewer provider inference.
  let sewerProvider: string;
  let sewerNote: string;
  if (countySewer) {
    sewerProvider = countySewer;
    sewerNote = 'From Maricopa County sewer provider layer.';
  } else if (city && CITY_SEWER_DEFAULTS[city]) {
    sewerProvider = CITY_SEWER_DEFAULTS[city]!;
    sewerNote = 'Inferred from city default — verify with city wastewater department.';
  } else {
    sewerProvider = 'Likely on-site septic (no sewer service area match)';
    sewerNote = 'No county sewer provider matched and no city hint. Parcel is likely on a septic system; site soils and percolation must support a septic field. Verify with Maricopa County Environmental Services.';
  }

  return {
    electric: {
      in_srp_service_area: inSrp,
      in_aps_service_area: inAps,
      likely_provider: electricProvider,
      note: electricNote,
    },
    water: {
      adwr_designated_company: adwrWaterCo,
      county_provider: countyWater,
      likely_provider: waterProvider,
      note: waterNote,
    },
    sewer: {
      county_provider: countySewer,
      likely_provider: sewerProvider,
      note: sewerNote,
    },
    sources: [
      { name: 'SRP service area', url: SRP_REST },
      { name: 'APS CCN service territory', url: APS_REST },
      { name: 'Maricopa County water provider', url: COUNTY_WATER_REST },
      { name: 'Maricopa County sewer provider', url: COUNTY_SEWER_REST },
      { name: 'ADWR Municipal Service Area', url: ADWR_REST },
    ],
    fetched_at: new Date().toISOString(),
  };
};
