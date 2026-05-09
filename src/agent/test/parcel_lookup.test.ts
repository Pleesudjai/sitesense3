import { parcelLookup } from '../src/mcp/parcel_lookup.js';

const apn = process.argv[2] ?? '12345678';

console.log(`Looking up Maricopa parcel APN ${apn}...`);
parcelLookup({ apn })
  .then((rec) => {
    console.log(JSON.stringify(rec, null, 2));
  })
  .catch((err) => {
    console.error('FAILED:', err.message);
    console.error(
      'If the error is a 404 or "no features", verify MARICOPA_PARCEL_REST is the right endpoint.',
    );
    console.error('Check: https://gis.mcassessor.maricopa.gov/arcgis/rest/services');
    process.exit(1);
  });
