import { floodZone } from '../src/mcp/flood_zone.js';

// Default: the Tempe APN 13209099 centroid (1435 N Dorsey Ln)
const lat = Number(process.argv[2] ?? '33.44574');
const lon = Number(process.argv[3] ?? '-111.91728');

console.log(`Looking up FEMA flood zone at (${lat}, ${lon})...`);
floodZone({ lat, lon })
  .then((rec) => {
    console.log(JSON.stringify(rec, null, 2));
  })
  .catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
  });
