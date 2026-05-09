import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { parcelLookup, parcelLookupSchema } from './parcel_lookup.js';
import { floodZone, floodZoneSchema } from './flood_zone.js';
import { topoSlope, topoSlopeSchema } from './topo_slope.js';
import { zoningLookup, zoningLookupSchema } from './zoning_lookup.js';
import { reportBuilder, reportBuilderSchema } from './report_builder.js';

export const sitesenseMcpServer = createSdkMcpServer({
  name: 'sitesense',
  version: '0.1.0',
  tools: [
    tool(
      'parcel_lookup',
      'Look up a Maricopa County parcel by APN. Returns lot size, owner, current use code (PUC), assessor zoning code (often "CONTACT LOCAL JURISDICTION" — use zoning_lookup for the real district), address, centroid (lat/lon), and boundary GeoJSON. Throws if APN is not found. The centroid is the input for flood_zone and zoning_lookup; the boundary coordinates are used to derive the bbox for topo_slope.',
      parcelLookupSchema.shape,
      async (args) => {
        const record = await parcelLookup(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(record, null, 2) }],
        };
      },
    ),
    tool(
      'flood_zone',
      'Look up the FEMA flood zone for a single point (lat/lon). Returns flood zone designation (X / X (shaded) / AE / A / AO / VE etc.), Special Flood Hazard Area flag, base flood elevation in feet (if any), and a plain-English risk description. Use the centroid returned by parcel_lookup as the input.',
      floodZoneSchema.shape,
      async (args) => {
        const record = await floodZone(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(record, null, 2) }],
        };
      },
    ),
    tool(
      'topo_slope',
      'Compute terrain elevation and slope statistics across a parcel from USGS 3DEP DEM (via the EPQS service). Input is the bounding box of the parcel boundary (min_lat, max_lat, min_lon, max_lon). Returns mean / min / max / relief elevation, mean and max slope percent, and the fraction of grid cells with slope > 15% (the threshold that commonly triggers Hillside Overlay zoning) and > 25%. Default grid_size=5 (25 EPQS calls) is fine for parcels under 1 acre; use 10 for larger lots. To get the bbox: scan the parcel_lookup boundary GeoJSON ring and take min/max of x (lon) and y (lat). Note: for very small parcels (< ~100 ft on a side) EPQS may return missing samples; the tool degrades gracefully and reports missing_samples.',
      topoSlopeSchema.shape,
      async (args) => {
        const record = await topoSlope(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(record, null, 2) }],
        };
      },
    ),
    tool(
      'zoning_lookup',
      'Look up the City of Tempe zoning district at a point (lat/lon). Returns the GIS-confirmed zoning code (e.g., R1-4, R-3, MU-3) plus dimensional standards from the Tempe ZDC: min lot size, front/side/rear setbacks (ft), max height (ft), and max density (du/acre). Setbacks and density values are best-effort from the ordinance and carry a confidence rating — use them to compute a first-pass buildable envelope, but always note the agent\'s note field and tell the user to verify with Tempe Planning before committing. If the point is outside Tempe city limits the tool says so explicitly. Use the centroid returned by parcel_lookup. (MVP-Maricopa note: the tool only knows Tempe; calling for a non-Tempe parcel will return "Outside City of Tempe" rather than an error.)',
      zoningLookupSchema.shape,
      async (args) => {
        const record = await zoningLookup(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(record, null, 2) }],
        };
      },
    ),
    tool(
      'report_builder',
      'Render the final 1-page feasibility report to a styled HTML file on disk. Call this AFTER all data tools have been called and the verdict is decided. Input is structured: apn, address, verdict (one of buildable / proceed_with_caution / not_recommended), verdict_one_liner (one-sentence summary), sections (array of {heading, body_md} — Markdown body), and citations. The tool writes a print-ready HTML file (8.5×11", 0.6" margins, color-coded verdict banner, citations footer, disclaimer) and returns the path. Recommended sections in order: Parcel Summary, Zoning Envelope, Constraints, Buildable Area, Red Flags, Recommendation. Keep section bodies tight — this is a single page.',
      reportBuilderSchema.shape,
      async (args) => {
        const record = await reportBuilder(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(record, null, 2) }],
        };
      },
    ),
  ],
});

export const ALLOWED_TOOLS = [
  'mcp__sitesense__parcel_lookup',
  'mcp__sitesense__flood_zone',
  'mcp__sitesense__topo_slope',
  'mcp__sitesense__zoning_lookup',
  'mcp__sitesense__report_builder',
] as const;
