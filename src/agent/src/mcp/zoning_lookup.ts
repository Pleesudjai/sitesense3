import { z } from 'zod';

const TEMPE_ZONING_REST =
  process.env.TEMPE_ZONING_REST ??
  'https://services.arcgis.com/lQySeXwbBg53XWDi/arcgis/rest/services/zoning_districts/FeatureServer/1/query';

export const zoningLookupSchema = z.object({
  lat: z.number().min(-90).max(90).describe('Latitude in WGS84 decimal degrees.'),
  lon: z.number().min(-180).max(180).describe('Longitude in WGS84 decimal degrees.'),
});

export type ZoningLookupInput = z.infer<typeof zoningLookupSchema>;

export interface ZoningLookupRecord {
  zoning_code: string | null;
  district_name: string;
  category: 'single_family' | 'multi_family' | 'mixed_use' | 'commercial' | 'industrial' | 'agricultural' | 'planned' | 'other' | 'unknown';
  min_lot_size_sf: number | null;
  setbacks_ft: {
    front: number | null;
    side: number | null;
    rear: number | null;
  };
  max_height_ft: number | null;
  max_density_du_per_acre: number | null;
  detached_dwelling_allowed: boolean | null;
  ordinance_reference: string;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  note: string;
  source_url: string;
  fetched_at: string;
}

// Tempe Zoning and Development Code dimensional standards.
// These are best-effort from the Tempe ZDC. Setbacks, FAR, height, and density
// vary by overlay, lot configuration (corner vs interior), and use type.
// The agent must hedge — these power a first-pass envelope calc only.
//
// Tempe ZDC: https://www.tempe.gov/government/community-development/zoning-development-code
const TEMPE_ZDC: Record<
  string,
  Omit<ZoningLookupRecord, 'zoning_code' | 'source_url' | 'fetched_at'>
> = {
  'R1-4': {
    district_name: 'Single-Family Residential, 4,000 sf min lot',
    category: 'single_family',
    min_lot_size_sf: 4000,
    setbacks_ft: { front: 15, side: 5, rear: 20 },
    max_height_ft: 30,
    max_density_du_per_acre: 10,
    detached_dwelling_allowed: true,
    ordinance_reference: 'Tempe ZDC Part 4-2 (R1 districts)',
    confidence: 'medium',
    note: 'Tempe R1-4 is the highest-density single-family detached district. Setback values are approximate — verify against current ZDC and any overlays.',
  },
  'R1-5': {
    district_name: 'Single-Family Residential, 5,000 sf min lot',
    category: 'single_family',
    min_lot_size_sf: 5000,
    setbacks_ft: { front: 20, side: 5, rear: 20 },
    max_height_ft: 30,
    max_density_du_per_acre: 8,
    detached_dwelling_allowed: true,
    ordinance_reference: 'Tempe ZDC Part 4-2 (R1 districts)',
    confidence: 'medium',
    note: 'Setback values are approximate — verify against current ZDC and any overlays.',
  },
  'R1-6': {
    district_name: 'Single-Family Residential, 6,000 sf min lot',
    category: 'single_family',
    min_lot_size_sf: 6000,
    setbacks_ft: { front: 20, side: 5, rear: 20 },
    max_height_ft: 30,
    max_density_du_per_acre: 7,
    detached_dwelling_allowed: true,
    ordinance_reference: 'Tempe ZDC Part 4-2 (R1 districts)',
    confidence: 'medium',
    note: 'Setback values are approximate — verify against current ZDC.',
  },
  'R1-7': {
    district_name: 'Single-Family Residential, 7,000 sf min lot',
    category: 'single_family',
    min_lot_size_sf: 7000,
    setbacks_ft: { front: 25, side: 7, rear: 20 },
    max_height_ft: 30,
    max_density_du_per_acre: 6,
    detached_dwelling_allowed: true,
    ordinance_reference: 'Tempe ZDC Part 4-2 (R1 districts)',
    confidence: 'medium',
    note: 'Setback values are approximate — verify against current ZDC.',
  },
  'R1-8': {
    district_name: 'Single-Family Residential, 8,000 sf min lot',
    category: 'single_family',
    min_lot_size_sf: 8000,
    setbacks_ft: { front: 25, side: 7, rear: 25 },
    max_height_ft: 30,
    max_density_du_per_acre: 5,
    detached_dwelling_allowed: true,
    ordinance_reference: 'Tempe ZDC Part 4-2 (R1 districts)',
    confidence: 'medium',
    note: 'Setback values are approximate — verify against current ZDC.',
  },
  'R1-10': {
    district_name: 'Single-Family Residential, 10,000 sf min lot',
    category: 'single_family',
    min_lot_size_sf: 10000,
    setbacks_ft: { front: 30, side: 10, rear: 25 },
    max_height_ft: 30,
    max_density_du_per_acre: 4,
    detached_dwelling_allowed: true,
    ordinance_reference: 'Tempe ZDC Part 4-2 (R1 districts)',
    confidence: 'medium',
    note: 'Setback values are approximate — verify against current ZDC.',
  },
  'R1-15': {
    district_name: 'Single-Family Residential, 15,000 sf min lot',
    category: 'single_family',
    min_lot_size_sf: 15000,
    setbacks_ft: { front: 35, side: 10, rear: 25 },
    max_height_ft: 30,
    max_density_du_per_acre: 3,
    detached_dwelling_allowed: true,
    ordinance_reference: 'Tempe ZDC Part 4-2 (R1 districts)',
    confidence: 'medium',
    note: 'Setback values are approximate — verify against current ZDC.',
  },
  'R1-PAD': {
    district_name: 'Single-Family Planned Area Development',
    category: 'planned',
    min_lot_size_sf: null,
    setbacks_ft: { front: null, side: null, rear: null },
    max_height_ft: null,
    max_density_du_per_acre: null,
    detached_dwelling_allowed: true,
    ordinance_reference: 'Tempe ZDC Part 4-2 + governing PAD ordinance',
    confidence: 'low',
    note: 'PAD standards are set by the governing Planned Area Development ordinance for the specific subdivision. Standard R1 dimensional rules do not apply — must request the PAD document from Tempe Planning.',
  },
  'R-2': {
    district_name: 'Multi-Family Residential Limited',
    category: 'multi_family',
    min_lot_size_sf: 7000,
    setbacks_ft: { front: 20, side: 5, rear: 20 },
    max_height_ft: 30,
    max_density_du_per_acre: 18,
    detached_dwelling_allowed: true,
    ordinance_reference: 'Tempe ZDC Part 4-3 (R-2 / R-3 / R-4 / R-5)',
    confidence: 'medium',
    note: 'Multi-family district. Density and setback standards approximate — verify against current ZDC.',
  },
  'R-3': {
    district_name: 'Multi-Family Residential General',
    category: 'multi_family',
    min_lot_size_sf: 7000,
    setbacks_ft: { front: 20, side: 5, rear: 20 },
    max_height_ft: 30,
    max_density_du_per_acre: 25,
    detached_dwelling_allowed: true,
    ordinance_reference: 'Tempe ZDC Part 4-3',
    confidence: 'medium',
    note: 'Multi-family. Approximate values — verify ZDC.',
  },
  'R-3R': {
    district_name: 'Multi-Family Residential, Restricted',
    category: 'multi_family',
    min_lot_size_sf: 7000,
    setbacks_ft: { front: 20, side: 5, rear: 20 },
    max_height_ft: 30,
    max_density_du_per_acre: 18,
    detached_dwelling_allowed: true,
    ordinance_reference: 'Tempe ZDC Part 4-3',
    confidence: 'low',
    note: 'R-3R is a restricted variant of R-3. Verify dimensional and use restrictions with Tempe Planning.',
  },
  'R-4': {
    district_name: 'Multi-Family Residential Medium-High Density',
    category: 'multi_family',
    min_lot_size_sf: 7000,
    setbacks_ft: { front: 20, side: 5, rear: 20 },
    max_height_ft: 40,
    max_density_du_per_acre: 36,
    detached_dwelling_allowed: false,
    ordinance_reference: 'Tempe ZDC Part 4-3',
    confidence: 'medium',
    note: 'Higher-density multi-family. Approximate values.',
  },
  'R-5': {
    district_name: 'Multi-Family Residential High Density',
    category: 'multi_family',
    min_lot_size_sf: 7000,
    setbacks_ft: { front: 20, side: 5, rear: 20 },
    max_height_ft: 55,
    max_density_du_per_acre: 50,
    detached_dwelling_allowed: false,
    ordinance_reference: 'Tempe ZDC Part 4-3',
    confidence: 'medium',
    note: 'Highest-density residential. Approximate values.',
  },
  'MU-2': {
    district_name: 'Mixed Use Light',
    category: 'mixed_use',
    min_lot_size_sf: null,
    setbacks_ft: { front: null, side: null, rear: null },
    max_height_ft: 40,
    max_density_du_per_acre: 25,
    detached_dwelling_allowed: false,
    ordinance_reference: 'Tempe ZDC Part 4-5 (Mixed Use)',
    confidence: 'low',
    note: 'MU districts use form-based standards rather than traditional setbacks. Refer to Mixed Use form-based code in the ZDC.',
  },
  'MU-3': {
    district_name: 'Mixed Use Moderate',
    category: 'mixed_use',
    min_lot_size_sf: null,
    setbacks_ft: { front: null, side: null, rear: null },
    max_height_ft: 60,
    max_density_du_per_acre: 35,
    detached_dwelling_allowed: false,
    ordinance_reference: 'Tempe ZDC Part 4-5',
    confidence: 'low',
    note: 'Form-based code. Heights and step-backs vary by frontage and overlay.',
  },
  'MU-4': {
    district_name: 'Mixed Use Intense',
    category: 'mixed_use',
    min_lot_size_sf: null,
    setbacks_ft: { front: null, side: null, rear: null },
    max_height_ft: 90,
    max_density_du_per_acre: 65,
    detached_dwelling_allowed: false,
    ordinance_reference: 'Tempe ZDC Part 4-5',
    confidence: 'low',
    note: 'Form-based code. Most intense mixed-use district.',
  },
  'MU-ED': {
    district_name: 'Mixed Use, Educational District',
    category: 'mixed_use',
    min_lot_size_sf: null,
    setbacks_ft: { front: null, side: null, rear: null },
    max_height_ft: null,
    max_density_du_per_acre: null,
    detached_dwelling_allowed: false,
    ordinance_reference: 'Tempe ZDC Part 4-5',
    confidence: 'low',
    note: 'Educational mixed-use district (around ASU). Standards vary with overlay; verify with Tempe Planning.',
  },
};

const KNOWN_CATEGORIES: Record<string, ZoningLookupRecord['category']> = {
  CC: 'commercial',
  CSS: 'commercial',
  RCC: 'commercial',
  RO: 'commercial',
  HID: 'industrial',
  LID: 'industrial',
  GID: 'industrial',
  PCC: 'commercial',
  'PCC-1': 'commercial',
  'PCC-2': 'commercial',
  AG: 'agricultural',
  RMH: 'multi_family',
  TP: 'other',
  GLUPE: 'other',
  COUNTY: 'unknown',
};

interface ArcGisResponse {
  features?: Array<{ attributes: { ZoningCode?: string | null } }>;
  error?: { message: string };
}

export const zoningLookup = async (
  input: ZoningLookupInput,
): Promise<ZoningLookupRecord> => {
  const params = new URLSearchParams({
    geometry: `${input.lon},${input.lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'ZoningCode',
    returnGeometry: 'false',
    f: 'json',
  });
  const url = `${TEMPE_ZONING_REST}?${params.toString()}`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 10000);
  let res: Response;
  try {
    res = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`Tempe zoning REST returned ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as ArcGisResponse;
  if (data.error) throw new Error(`Tempe zoning REST error: ${data.error.message}`);

  const features = data.features ?? [];
  const fetchedAt = new Date().toISOString();

  if (features.length === 0) {
    return {
      zoning_code: null,
      district_name: 'Outside City of Tempe',
      category: 'unknown',
      min_lot_size_sf: null,
      setbacks_ft: { front: null, side: null, rear: null },
      max_height_ft: null,
      max_density_du_per_acre: null,
      detached_dwelling_allowed: null,
      ordinance_reference: 'N/A — point is outside Tempe city limits',
      confidence: 'unknown',
      note: 'The point does not intersect any Tempe zoning district. Parcel may be in another jurisdiction (Phoenix, Mesa, Chandler, Scottsdale, Maricopa County unincorporated).',
      source_url: url,
      fetched_at: fetchedAt,
    };
  }

  const code = features[0]?.attributes.ZoningCode?.trim() ?? null;
  if (!code) {
    return {
      zoning_code: null,
      district_name: 'Tempe — zoning code not returned',
      category: 'unknown',
      min_lot_size_sf: null,
      setbacks_ft: { front: null, side: null, rear: null },
      max_height_ft: null,
      max_density_du_per_acre: null,
      detached_dwelling_allowed: null,
      ordinance_reference: 'N/A',
      confidence: 'unknown',
      note: 'Tempe zoning REST returned a feature but no ZoningCode attribute. Contact Tempe Planning directly.',
      source_url: url,
      fetched_at: fetchedAt,
    };
  }

  const known = TEMPE_ZDC[code];
  if (known) {
    return { ...known, zoning_code: code, source_url: url, fetched_at: fetchedAt };
  }

  // Unknown to our table — return the GIS result with a flag.
  const category = KNOWN_CATEGORIES[code] ?? 'other';
  return {
    zoning_code: code,
    district_name: `Tempe district ${code}`,
    category,
    min_lot_size_sf: null,
    setbacks_ft: { front: null, side: null, rear: null },
    max_height_ft: null,
    max_density_du_per_acre: null,
    detached_dwelling_allowed: null,
    ordinance_reference: 'Tempe ZDC — code not in agent dimensional table',
    confidence: 'low',
    note: `Zoning code ${code} confirmed via GIS but dimensional standards are not in the agent's lookup table. Consult Tempe ZDC at https://www.tempe.gov/government/community-development/zoning-development-code for setbacks, height, and density standards.`,
    source_url: url,
    fetched_at: fetchedAt,
  };
};
