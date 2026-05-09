export interface ZoningResult {
  jurisdiction: string;
  zoning_code: string | null;
  district_name: string;
  category:
    | 'single_family'
    | 'multi_family'
    | 'mixed_use'
    | 'commercial'
    | 'industrial'
    | 'agricultural'
    | 'planned'
    | 'other'
    | 'unknown';
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

export interface CityModule {
  name: string;
  /** Returns null if the point does not fall within this jurisdiction. */
  query: (lat: number, lon: number) => Promise<ZoningResult | null>;
}
