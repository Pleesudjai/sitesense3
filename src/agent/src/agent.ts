import 'dotenv/config';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { SITE_FEASIBILITY_SYSTEM_PROMPT } from './prompt.js';
import { sitesenseMcpServer, ALLOWED_TOOLS } from './mcp/server.js';
import type { FeasibilityReport } from './types.js';

export interface RunResult {
  report: FeasibilityReport | null;
  raw_text: string;
  tool_calls: Array<{ name: string; input: unknown; output: unknown }>;
}

export const runFeasibilityAgent = async (apn: string): Promise<RunResult> => {
  const toolCalls: RunResult['tool_calls'] = [];
  let finalText = '';

  const stream = query({
    prompt: `Produce a feasibility report for Maricopa County parcel APN ${apn}. Use the parcel_lookup tool to fetch the parcel record. Return only the JSON FeasibilityReport object — no markdown, no commentary.`,
    options: {
      model: 'claude-sonnet-4-6',
      systemPrompt: SITE_FEASIBILITY_SYSTEM_PROMPT,
      mcpServers: { sitesense: sitesenseMcpServer },
      allowedTools: [...ALLOWED_TOOLS],
      permissionMode: 'bypassPermissions',
    },
  });

  for await (const msg of stream) {
    if (msg.type === 'assistant' && 'message' in msg) {
      for (const block of msg.message.content) {
        if (block.type === 'text') finalText += block.text;
        if (block.type === 'tool_use') {
          toolCalls.push({ name: block.name, input: block.input, output: null });
        }
      }
    }
    if (msg.type === 'user' && 'message' in msg) {
      for (const block of msg.message.content) {
        if (typeof block === 'object' && block && 'type' in block && block.type === 'tool_result') {
          const last = toolCalls[toolCalls.length - 1];
          if (last) last.output = block.content;
        }
      }
    }
  }

  return {
    report: extractJsonReport(finalText),
    raw_text: finalText,
    tool_calls: toolCalls,
  };
};

const extractJsonReport = (text: string): FeasibilityReport | null => {
  const trimmed = text.trim();
  // 1. Fenced ```json ... ``` block anywhere in the text.
  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim()) as FeasibilityReport;
    } catch {
      /* fall through */
    }
  }
  // 2. First {...} balanced JSON object in the text.
  const start = trimmed.indexOf('{');
  if (start >= 0) {
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < trimmed.length; i++) {
      const ch = trimmed[i]!;
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(start, i + 1)) as FeasibilityReport;
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
};

const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('agent.ts');
if (isMain) {
  const apn = process.argv[2];
  if (!apn) {
    console.error('Usage: npm run dev -- <APN>');
    process.exit(1);
  }
  runFeasibilityAgent(apn).then((result) => {
    console.log('--- TOOL CALLS ---');
    for (const tc of result.tool_calls) {
      console.log(`${tc.name}(${JSON.stringify(tc.input)})`);
    }
    console.log('--- REPORT ---');
    console.log(JSON.stringify(result.report ?? result.raw_text, null, 2));
  });
}
