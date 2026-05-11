import { addressToApn } from '../src/mcp/address_to_apn.js';

const address = process.argv.slice(2).join(' ') || '1435 N Dorsey Ln, Tempe AZ 85288';

console.log(`Resolving address: "${address}"...`);
addressToApn({ address })
  .then((rec) => console.log(JSON.stringify(rec, null, 2)))
  .catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
  });
