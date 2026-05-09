import { topoSlope } from '../src/mcp/topo_slope.js';

// Default: a small bbox around the Tempe APN 13209099 (1435 N Dorsey Ln) — should be flat.
// Pass 4 args (min_lat max_lat min_lon max_lon) to override.
const a = process.argv;
const min_lat = Number(a[2] ?? '33.44569687');
const max_lat = Number(a[3] ?? '33.44580191');
const min_lon = Number(a[4] ?? '-111.91739898');
const max_lon = Number(a[5] ?? '-111.91716037');
const grid = Number(a[6] ?? '5');

console.log(
  `Looking up topo/slope for bbox (${min_lat}..${max_lat}, ${min_lon}..${max_lon}) at grid ${grid}...`,
);
topoSlope({ min_lat, max_lat, min_lon, max_lon, grid_size: grid })
  .then((rec) => {
    console.log(JSON.stringify(rec, null, 2));
  })
  .catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
  });
