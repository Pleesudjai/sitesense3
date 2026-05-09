import { z } from 'zod';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { marked } from 'marked';

const REPORT_OUTPUT_DIR =
  process.env.REPORT_OUTPUT_DIR ?? resolve(process.cwd(), 'output');

const sectionSchema = z.object({
  heading: z.string(),
  body_md: z
    .string()
    .describe(
      'Section body in plain Markdown. Use - for bullets, ** for bold, etc. Keep it tight — this is a 1-page report.',
    ),
});

const citationSchema = z.object({
  claim: z.string(),
  source: z.string(),
  url: z.string(),
});

export const reportBuilderSchema = z.object({
  apn: z.string(),
  address: z.string(),
  verdict: z.enum(['buildable', 'proceed_with_caution', 'not_recommended']),
  verdict_one_liner: z
    .string()
    .describe('One sentence summary of the verdict, < 200 chars.'),
  sections: z
    .array(sectionSchema)
    .min(1)
    .describe(
      'Body sections. Recommended order: Parcel Summary, Zoning Envelope, Constraints, Buildable Area, Red Flags, Recommendation.',
    ),
  citations: z.array(citationSchema).min(1),
});

export type ReportBuilderInput = z.infer<typeof reportBuilderSchema>;

export interface ReportBuilderRecord {
  html_path: string;
  size_bytes: number;
  apn: string;
  generated_at: string;
}

const VERDICT_STYLES: Record<
  ReportBuilderInput['verdict'],
  { label: string; color: string; bg: string }
> = {
  buildable: { label: 'Buildable', color: '#0f5132', bg: '#d1e7dd' },
  proceed_with_caution: {
    label: 'Proceed With Caution',
    color: '#664d03',
    bg: '#fff3cd',
  },
  not_recommended: {
    label: 'Not Recommended',
    color: '#842029',
    bg: '#f8d7da',
  },
};

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&'
      ? '&amp;'
      : c === '<'
        ? '&lt;'
        : c === '>'
          ? '&gt;'
          : c === '"'
            ? '&quot;'
            : '&#39;',
  );

const renderHtml = (input: ReportBuilderInput): string => {
  const v = VERDICT_STYLES[input.verdict];
  const sectionsHtml = input.sections
    .map(
      (s) =>
        `<section><h2>${escapeHtml(s.heading)}</h2><div class="body">${marked.parse(s.body_md, { async: false }) as string}</div></section>`,
    )
    .join('\n');
  const citationsHtml = input.citations
    .map(
      (c, i) =>
        `<li><strong>[${i + 1}]</strong> ${escapeHtml(c.claim)} — <em>${escapeHtml(c.source)}</em><br/><a href="${escapeHtml(c.url)}">${escapeHtml(c.url)}</a></li>`,
    )
    .join('\n');

  const generatedAt = new Date().toISOString().slice(0, 10);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>SiteSense Feasibility — APN ${escapeHtml(input.apn)}</title>
<style>
  @page { size: Letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    line-height: 1.45;
    font-size: 10.5pt;
    margin: 0;
    padding: 24px;
    max-width: 7.3in;
  }
  header { border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 14px; }
  header h1 { margin: 0; font-size: 18pt; letter-spacing: -0.01em; }
  header .meta { color: #666; font-size: 9pt; margin-top: 4px; }
  .verdict-banner {
    margin: 12px 0;
    padding: 10px 14px;
    border-radius: 6px;
    background: ${v.bg};
    color: ${v.color};
    border-left: 4px solid ${v.color};
  }
  .verdict-banner .label {
    font-weight: 700;
    font-size: 11pt;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .verdict-banner .one-liner { margin-top: 4px; font-size: 10.5pt; }
  section { margin-bottom: 12px; page-break-inside: avoid; }
  section h2 {
    font-size: 11pt;
    margin: 0 0 4px;
    padding-bottom: 2px;
    border-bottom: 1px solid #ccc;
    color: #1a1a1a;
  }
  section .body { font-size: 10pt; }
  section .body p { margin: 4px 0; }
  section .body ul { margin: 4px 0; padding-left: 20px; }
  section .body li { margin: 2px 0; }
  section .body code {
    background: #f4f4f4;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 9.5pt;
  }
  footer {
    margin-top: 16px;
    padding-top: 8px;
    border-top: 1px solid #ccc;
    font-size: 8.5pt;
    color: #555;
  }
  footer h3 { font-size: 9pt; margin: 0 0 4px; color: #1a1a1a; }
  footer ol { margin: 0; padding-left: 18px; }
  footer ol li { margin-bottom: 3px; word-break: break-all; }
  .disclaimer {
    margin-top: 8px;
    padding: 6px 10px;
    background: #f9f9f9;
    border-left: 3px solid #999;
    font-size: 8pt;
    color: #555;
    line-height: 1.35;
  }
</style>
</head>
<body>
<header>
  <h1>SiteSense Feasibility Report</h1>
  <div class="meta">APN ${escapeHtml(input.apn)} &middot; ${escapeHtml(input.address)} &middot; Generated ${generatedAt}</div>
</header>
<div class="verdict-banner">
  <div class="label">${v.label}</div>
  <div class="one-liner">${escapeHtml(input.verdict_one_liner)}</div>
</div>
${sectionsHtml}
<footer>
  <h3>Citations</h3>
  <ol>${citationsHtml}</ol>
  <div class="disclaimer">
    Preliminary due-diligence only. Verify all findings with the City of Tempe Planning &amp; Zoning Division,
    Maricopa County Flood Control District, and a licensed Arizona surveyor or civil engineer before any commitment.
    Setback and dimensional standards drawn from the Tempe Zoning &amp; Development Code at the time of report
    generation; current ZDC controls.
  </div>
</footer>
</body>
</html>`;
};

export const reportBuilder = async (
  rawInput: ReportBuilderInput,
): Promise<ReportBuilderRecord> => {
  const input = reportBuilderSchema.parse(rawInput);
  await mkdir(REPORT_OUTPUT_DIR, { recursive: true });
  const filename = `sitesense-${input.apn}-${Date.now()}.html`;
  const path = join(REPORT_OUTPUT_DIR, filename);
  const html = renderHtml(input);
  await writeFile(path, html, 'utf8');
  const sizeBytes = Buffer.byteLength(html, 'utf8');
  return {
    html_path: path,
    size_bytes: sizeBytes,
    apn: input.apn,
    generated_at: new Date().toISOString(),
  };
};
