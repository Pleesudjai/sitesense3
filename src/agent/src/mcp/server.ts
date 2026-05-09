import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { parcelLookup, parcelLookupSchema } from './parcel_lookup.js';
import { floodZone, floodZoneSchema } from './flood_zone.js';

export const sitesenseMcpServer = createSdkMcpServer({
  name: 'sitesense',
  version: '0.1.0',
  tools: [
    tool(
      'parcel_lookup',
      'Look up a Maricopa County parcel by APN. Returns lot size, owner, current use code (PUC), zoning code (often "CONTACT LOCAL JURISDICTION"), address, centroid (lat/lon), and boundary GeoJSON. Throws if APN is not found. The centroid this returns is the input you pass to flood_zone.',
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
      'Look up the FEMA flood zone for a point (lat/lon). Returns FEMA flood zone designation (X / AE / A / AO / VE etc.), Special Flood Hazard Area flag, base flood elevation in feet (if any), and a plain-English risk description. Use the centroid returned by parcel_lookup as the input.',
      floodZoneSchema.shape,
      async (args) => {
        const record = await floodZone(args);
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
] as const;
