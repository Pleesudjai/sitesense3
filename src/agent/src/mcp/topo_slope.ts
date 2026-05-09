import { z } from 'zod';

const USGS_EPQS =
  process.env.USGS_EPQS ?? 'https://epqs.nationalmap.gov/v1/json';

export const topoSlopeSchema = z.object({
  min_lat: z.number().min(-90).max(90),
  max_lat: z.number().min(-90).max(90),
  min_lon: z.number().min(-180).max(180),
  max_lon: z.number().min(-180).max(180),
  grid_size: z
    .number()
    .int()
    .min(3)
    .max(20)
    .default(5)
    .describe(
      'Grid resolution per side. 5 (=25 EPQS calls) is fine for small parcels; 10 for >1 acre. Max 20.',
    ),
});

export type TopoSlopeInput = z.infer<typeof topoSlopeSchema>;

export interface TopoSlopeRecord {
  grid_size: number;
  cell_width_ft: number;
  area_acres_bbox: number;
  elevation: {
    mean_ft: number;
    min_ft: number;
    max_ft: number;
    relief_ft: number;
  };
  slope: {
    mean_pct: number;
    max_pct: number;
    frac_over_15_pct: number;
    frac_over_25_pct: number;
  };
  hillside_overlay_likely: boolean;
  hillside_overlay_note: string;
  missing_samples: number;
  source: string;
  fetched_at: string;
}

const linspace = (a: number, b: number, n: number): number[] => {
  if (n <= 1) return [a];
  const step = (b - a) / (n - 1);
  return Array.from({ length: n }, (_, i) => a + i * step);
};

const queryElevation = async (
  lon: number,
  lat: number,
  retries = 2,
): Promise<number | null> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const url = `${USGS_EPQS}?x=${lon}&y=${lat}&units=Feet&includeDate=false`;
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 6000);
      let res: Response;
      try {
        res = await fetch(url, { signal: ac.signal });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) continue;
      const data = (await res.json()) as { value?: unknown };
      const val = typeof data.value === 'number' ? data.value : Number(data.value);
      // EPQS returns sentinel values like -1000000 for "no data"; > -900 is the validity gate.
      if (Number.isFinite(val) && val > -900) return val;
    } catch {
      // retry
    }
  }
  return null;
};

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

const degradedRecord = (
  input: TopoSlopeInput,
  n: number,
  validCount: number,
  note: string,
): TopoSlopeRecord => ({
  grid_size: n,
  cell_width_ft: 0,
  area_acres_bbox: 0,
  elevation: { mean_ft: 0, min_ft: 0, max_ft: 0, relief_ft: 0 },
  slope: { mean_pct: 0, max_pct: 0, frac_over_15_pct: 0, frac_over_25_pct: 0 },
  hillside_overlay_likely: false,
  hillside_overlay_note: note,
  missing_samples: n * n - validCount,
  source: USGS_EPQS,
  fetched_at: new Date().toISOString(),
});

export const topoSlope = async (
  rawInput: TopoSlopeInput,
): Promise<TopoSlopeRecord> => {
  const input = topoSlopeSchema.parse(rawInput);
  const { min_lat, max_lat, min_lon, max_lon, grid_size: n } = input;

  const lats = linspace(min_lat, max_lat, n);
  const lons = linspace(min_lon, max_lon, n);

  const tasks: Array<Promise<number | null>> = [];
  for (const lat of lats) {
    for (const lon of lons) {
      tasks.push(queryElevation(lon, lat));
    }
  }
  const raw = await Promise.all(tasks);
  const valid = raw.filter((v): v is number => v !== null);
  // EPQS resolution is ~10 m. For very small parcels (bbox < ~100 ft on a side) the grid
  // points fall within a single DEM cell and EPQS may return identical values or null.
  // Don't throw — degrade gracefully so the agent can keep going with the other tools.
  if (valid.length === 0) {
    const note =
      'USGS EPQS returned no valid elevation samples for this bbox. The parcel may be outside CONUS DEM coverage, over water, or smaller than the EPQS resolution (~10 m / ~33 ft). No slope data available.';
    return degradedRecord(input, n, 0, note);
  }
  const fillValue = median(valid);
  const filled = raw.map((v) => v ?? fillValue);

  // Reshape into 2D grid [row][col]; row is constant lat (y), col is constant lon (x).
  const grid: number[][] = [];
  for (let r = 0; r < n; r++) {
    grid.push(filled.slice(r * n, (r + 1) * n));
  }

  // Approximate horizontal cell width in feet (constant-lat slice midpoint).
  const midLat = (min_lat + max_lat) / 2;
  const dLonDeg = (max_lon - min_lon) / (n - 1);
  const dLatDeg = (max_lat - min_lat) / (n - 1);
  const ftPerDegLat = 364000;
  const ftPerDegLonAt = (lat: number) =>
    ftPerDegLat * Math.cos((lat * Math.PI) / 180);
  const cellWidthLonFt = dLonDeg * ftPerDegLonAt(midLat);
  const cellWidthLatFt = dLatDeg * ftPerDegLat;
  const cellWidthFt = (cellWidthLonFt + cellWidthLatFt) / 2;

  // Slope via central difference at each grid cell.
  const slopes: number[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const right = grid[r]![Math.min(c + 1, n - 1)]!;
      const left = grid[r]![Math.max(c - 1, 0)]!;
      const dzdx = (right - left) / (2 * cellWidthLonFt);
      const down = grid[Math.min(r + 1, n - 1)]![c]!;
      const up = grid[Math.max(r - 1, 0)]![c]!;
      const dzdy = (down - up) / (2 * cellWidthLatFt);
      slopes.push(Math.sqrt(dzdx ** 2 + dzdy ** 2) * 100);
    }
  }

  const elevMin = Math.min(...filled);
  const elevMax = Math.max(...filled);
  const elevMean = filled.reduce((s, v) => s + v, 0) / filled.length;
  const slopeMean = slopes.reduce((s, v) => s + v, 0) / slopes.length;
  const slopeMax = Math.max(...slopes);
  const fracOver15 = slopes.filter((s) => s > 15).length / slopes.length;
  const fracOver25 = slopes.filter((s) => s > 25).length / slopes.length;

  // Hillside overlay heuristic: max slope > 15% OR mean > 10% means hillside provisions
  // are very likely to apply. Per architecture doc, slope > 15% commonly triggers reduced
  // density caps in AZ municipal codes.
  const hillsideLikely = slopeMax > 15 || slopeMean > 10;
  const note = hillsideLikely
    ? `Max slope ${slopeMax.toFixed(1)}% (mean ${slopeMean.toFixed(1)}%) is high enough that local Hillside Overlay or steep-slope provisions likely apply. Verify with the city's zoning code.`
    : `Max slope ${slopeMax.toFixed(1)}% (mean ${slopeMean.toFixed(1)}%) is below the typical 15% threshold for steep-slope overlays. Confirm with the local zoning code.`;

  // Bbox area in acres (Lambert, midpoint-corrected)
  const widthFt = (max_lon - min_lon) * ftPerDegLonAt(midLat);
  const heightFt = (max_lat - min_lat) * ftPerDegLat;
  const areaAcres = (widthFt * heightFt) / 43560;

  const round = (x: number, d: number) => {
    const f = 10 ** d;
    return Math.round(x * f) / f;
  };

  return {
    grid_size: n,
    cell_width_ft: round(cellWidthFt, 1),
    area_acres_bbox: round(areaAcres, 4),
    elevation: {
      mean_ft: round(elevMean, 1),
      min_ft: round(elevMin, 1),
      max_ft: round(elevMax, 1),
      relief_ft: round(elevMax - elevMin, 1),
    },
    slope: {
      mean_pct: round(slopeMean, 2),
      max_pct: round(slopeMax, 2),
      frac_over_15_pct: round(fracOver15 * 100, 1),
      frac_over_25_pct: round(fracOver25 * 100, 1),
    },
    hillside_overlay_likely: hillsideLikely,
    hillside_overlay_note: note,
    missing_samples: raw.length - valid.length,
    source: USGS_EPQS,
    fetched_at: new Date().toISOString(),
  };
};
