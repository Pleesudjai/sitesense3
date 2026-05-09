export interface ParcelRecord {
  apn: string;
  owner: string | null;
  lot_size_sf: number | null;
  lot_size_acres: number | null;
  current_use: string | null;
  zoning_code: string | null;
  address: string | null;
  centroid: { lat: number; lon: number } | null;
  boundary: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  source_url: string;
  fetched_at: string;
}

export interface FeasibilityReport {
  apn: string;
  parcel_summary: string;
  zoning_envelope: string;
  constraints: string;
  buildable_area_sf: number;
  buildable_area_note: string;
  red_flags: string[];
  recommendation: 'buildable' | 'proceed_with_caution' | 'not_recommended';
  recommendation_reasoning: string;
  citations: Citation[];
}

export interface Citation {
  claim: string;
  tool: string;
  source_url: string;
}
