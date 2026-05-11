import { utilityAvail } from '../src/mcp/utility_avail.js';

const lat = Number(process.argv[2] ?? '33.44574');
const lon = Number(process.argv[3] ?? '-111.91728');
const city = process.argv[4];

console.log(`Looking up utilities at (${lat}, ${lon})${city ? ` city=${city}` : ''}...`);
utilityAvail({ lat, lon, ...(city ? { city } : {}) })
  .then((rec) => console.log(JSON.stringify(rec, null, 2)))
  .catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
  });
