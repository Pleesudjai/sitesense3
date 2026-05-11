import 'dotenv/config';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { runFeasibilityAgent } from './agent.js';

// SiteSense Agent — minimal standalone HTTP server.
//
// Single endpoint:
//   POST /api/feasibility
//     body: { "input": "<APN or street address>" }
//     returns: { report, raw_text, tool_calls } (same shape as runFeasibilityAgent)
//
// Optional:
//   GET /healthz → 200 OK
//
// Designed for any Node host (Render, Fly, Railway, AWS Lambda runtime, etc.).
// Not Netlify-Functions-bundled because the Agent SDK is heavy and the agent
// typically runs longer than the 26s Netlify Pro sync timeout.

const PORT = Number(process.env.PORT ?? 3001);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

const writeJson = (res: ServerResponse, status: number, payload: unknown) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(body).toString(),
  });
  res.end(body);
};

const handleFeasibility = async (req: IncomingMessage, res: ServerResponse) => {
  let body: { input?: unknown };
  try {
    const raw = await readBody(req);
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return writeJson(res, 400, { error: 'Body must be valid JSON' });
  }
  const input = typeof body.input === 'string' ? body.input.trim() : '';
  if (!input || input.length < 4) {
    return writeJson(res, 400, {
      error: 'Body must include "input": "<APN or street address>" (min 4 chars).',
    });
  }
  try {
    const started = Date.now();
    const result = await runFeasibilityAgent(input);
    const elapsed = Date.now() - started;
    return writeJson(res, 200, {
      input,
      elapsed_ms: elapsed,
      report: result.report,
      raw_text: result.raw_text,
      tool_calls: result.tool_calls,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return writeJson(res, 500, { error: 'Agent failed', detail: msg });
  }
};

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = req.url ?? '/';
  if (req.method === 'GET' && (url === '/' || url === '/healthz')) {
    return writeJson(res, 200, { status: 'ok', service: 'sitesense-agent' });
  }
  if (req.method === 'POST' && url === '/api/feasibility') {
    return handleFeasibility(req, res);
  }
  return writeJson(res, 404, { error: 'Not found', path: url });
});

server.listen(PORT, () => {
  console.log(`SiteSense Agent server listening on http://localhost:${PORT}`);
  console.log(`  Health: GET  http://localhost:${PORT}/healthz`);
  console.log(`  Run:    POST http://localhost:${PORT}/api/feasibility  body={"input":"<APN or address>"}`);
});
