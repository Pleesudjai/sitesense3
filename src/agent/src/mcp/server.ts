import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { parcelLookup, parcelLookupSchema } from './parcel_lookup.js';
import { floodZone, floodZoneSchema } from './flood_zone.js';
import { topoSlope, topoSlopeSchema } from './topo_slope.js';

export const sitesenseMcpServer = createSdkMcpServer({
  name: 'sitesense',
  version: '0.1.0',
  tools: [
    tool(
      'parcel_lookup',
      'Look up a Maricopa County parcel by APN. Returns lot size, owner, current use code (PUC), zoning code (often "CONTACT LOCAL JURISDICTION"), address, centroid (lat/lon), and boundary GeoJSON. Throws if APN is not found. The centroid is the input for flood_zone; the boundary coordinates are used to derive the bbox for topo_slope.',
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
      'Compute terrain elevation and slope statistics across a parcel from USGS 3DEP DEM (via the EPQS service). Input is the bounding box of the parcel boundary (min_lat, max_lat, min_lon, max_lon). Returns mean / min / max / relief elevation, mean and max slope percent, and the fraction of grid cells with slope > 15% (the threshold that commonly triggers Hillside Overlay zoning) and > 25%. Default grid_size=5 (25 EPQS calls) is fine for parcels under 1 acre; use 10 for larger lots. To get the bbox: scan the parcel_lookup boundary GeoJSON ring and take min/max of x (lon) and y (lat).',
      topoSlopeSchema.shape,
      async (args) => {
        const record = await topoSlope(args);
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
] as const;
