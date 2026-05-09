import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { parcelLookup, parcelLookupSchema } from './parcel_lookup.js';

export const sitesenseMcpServer = createSdkMcpServer({
  name: 'sitesense',
  version: '0.1.0',
  tools: [
    tool(
      'parcel_lookup',
      'Look up a Maricopa County parcel by APN. Returns lot size, owner, current use, zoning code, address, centroid, and boundary GeoJSON. Throws if APN is not found.',
      parcelLookupSchema.shape,
      async (args) => {
        const record = await parcelLookup(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(record, null, 2),
            },
          ],
        };
      },
    ),
  ],
});

export const ALLOWED_TOOLS = ['mcp__sitesense__parcel_lookup'] as const;
