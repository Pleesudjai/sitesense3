import 'dotenv/config';
import { runFeasibilityAgent } from '../src/agent.js';

const apn = process.argv[2] ?? '12345678';

console.log(`Running SiteSense agent on Maricopa APN ${apn}...`);
console.log('(Requires ANTHROPIC_API_KEY in environment.)\n');

runFeasibilityAgent(apn)
  .then((result) => {
    console.log('=== TOOL CALLS ===');
    for (const tc of result.tool_calls) {
      console.log(`${tc.name}(${JSON.stringify(tc.input)})`);
    }
    console.log('\n=== REPORT ===');
    if (result.report) {
      console.log(JSON.stringify(result.report, null, 2));
    } else {
      console.log('(could not parse report as JSON; raw text below)');
      console.log(result.raw_text);
    }
  })
  .catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
