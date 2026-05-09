import { zoningLookup } from '../src/mcp/zoning_lookup.js';

const lat = Number(process.argv[2] ?? '33.44574');
const lon = Number(process.argv[3] ?? '-111.91728');

console.log(`Looking up Tempe zoning at (${lat}, ${lon})...`);
zoningLookup({ lat, lon })
  .then((rec) => console.log(JSON.stringify(rec, null, 2)))
  .catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
  });
