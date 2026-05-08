const pptxgen = require("pptxgenjs");
let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'Mobasher Group';
pres.title = 'SiteSense — How Claude Works in the Brain';

// Colors matching SiteSense dark theme
const BG = '0A1628';
const TEAL = '02C39A';
const NAVY = '1C7293';
const WHITE = 'FFFFFF';
const GRAY = '94A3B8';
const DARK = '0F1D32';
const RED = 'EF4444';
const AMBER = 'F59E0B';
const GREEN = '22C55E';
const ORANGE = 'F97316';
const PURPLE = 'A78BFA';

function darkSlide() {
  const s = pres.addSlide();
  s.background = { fill: BG };
  return s;
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 1: Title
// ═══════════════════════════════════════════════════════════════
let s1 = darkSlide();
s1.addText("How Claude Works\nin SiteSense", {
  x: 0.8, y: 1.0, w: 8.5, h: 2.5,
  fontSize: 42, fontFace: 'Arial Black', color: WHITE, bold: true, lineSpacingMultiple: 1.1
});
s1.addText("Claude is ONE replaceable component — not the brain itself", {
  x: 0.8, y: 3.5, w: 8, h: 0.5,
  fontSize: 18, fontFace: 'Calibri', color: TEAL, italic: true
});
// 3 stat boxes
const stats = [
  { num: '3', label: 'Places Claude\nis Used' },
  { num: '0', label: 'Calculations\nby Claude' },
  { num: '100%', label: 'Works Without\nAPI Key' },
];
stats.forEach((st, i) => {
  const x = 0.8 + i * 3.1;
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.3, w: 2.8, h: 1.1, fill: { color: DARK }, rectRadius: 0.08 });
  s1.addText(st.num, { x, y: 4.3, w: 1.2, h: 1.1, fontSize: 36, fontFace: 'Arial Black', color: TEAL, align: 'center', valign: 'middle' });
  s1.addText(st.label, { x: x + 1.1, y: 4.3, w: 1.6, h: 1.1, fontSize: 11, fontFace: 'Calibri', color: GRAY, valign: 'middle' });
});

// ═══════════════════════════════════════════════════════════════
// SLIDE 2: The 3 Places Claude is Used
// ═══════════════════════════════════════════════════════════════
let s2 = darkSlide();
s2.addText("Where Claude Appears in the 7 Layers", {
  x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 28, fontFace: 'Arial Black', color: WHITE
});

const layers = [
  { n: '1', name: 'Retrieval', desc: '15 GIS APIs', claude: false, color: NAVY },
  { n: '2', name: 'Tool Layer', desc: 'Deterministic calcs', claude: false, color: NAVY },
  { n: '3', name: 'Doctrine', desc: 'IBC / ASCE / ACI rules', claude: false, color: NAVY },
  { n: '4', name: 'Evidence Pack', desc: 'Structured memory', claude: false, color: NAVY },
  { n: '5', name: 'Expert Panel', desc: '6 experts — Claude EXTENDS', claude: true, color: TEAL },
  { n: '6', name: 'Brain Report', desc: 'Claude SYNTHESIZES', claude: true, color: TEAL },
  { n: '7', name: 'Engineering Q&A', desc: 'Claude ANSWERS', claude: true, color: TEAL },
];
layers.forEach((l, i) => {
  const y = 1.2 + i * 0.58;
  s2.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y, w: 9, h: 0.5,
    fill: { color: l.claude ? '0F2A1F' : DARK },
    line: l.claude ? { color: TEAL, width: 1.5 } : undefined,
    rectRadius: 0.05
  });
  s2.addText(l.n, { x: 0.6, y, w: 0.5, h: 0.5, fontSize: 14, fontFace: 'Arial Black', color: l.claude ? TEAL : GRAY, align: 'center', valign: 'middle' });
  s2.addText(l.name, { x: 1.2, y, w: 2.5, h: 0.5, fontSize: 14, fontFace: 'Calibri', color: WHITE, bold: true, valign: 'middle' });
  s2.addText(l.desc, { x: 3.8, y, w: 4, h: 0.5, fontSize: 12, fontFace: 'Calibri', color: l.claude ? TEAL : GRAY, valign: 'middle' });
  if (l.claude) {
    s2.addText('CLAUDE', { x: 8.2, y, w: 1.2, h: 0.5, fontSize: 10, fontFace: 'Arial', color: BG, bold: true, align: 'center', valign: 'middle',
      fill: { color: TEAL }, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.05 });
  }
});
s2.addText("Layers 1-4: No AI. Pure code + government data + engineering rules.", {
  x: 0.5, y: 5.1, w: 9, h: 0.4, fontSize: 12, fontFace: 'Calibri', color: GRAY, italic: true
});

// ═══════════════════════════════════════════════════════════════
// SLIDE 3: Expert Extension (Layer 5)
// ═══════════════════════════════════════════════════════════════
let s3 = darkSlide();
s3.addText("Layer 5: Expert Extension", {
  x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 28, fontFace: 'Arial Black', color: WHITE
});
s3.addText("Rules run FIRST — Claude adds what rules can't see", {
  x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 14, fontFace: 'Calibri', color: TEAL, italic: true
});

// Flow diagram: 3 boxes with arrows
const flowBoxes = [
  { label: 'STEP 1: Rules Run', sub: '19 compound risk checks\nFoundation ladder (IBC/ACI)\nCost premiums\nAlways executes', color: GREEN, x: 0.5 },
  { label: 'STEP 2: Claude Extends', sub: 'Reads rule findings + evidence\nFinds NEW cross-domain risks\nAdds [AI INSIGHT] tags\nSonnet, 600 tokens, 8s max', color: TEAL, x: 3.6 },
  { label: 'STEP 3: Merged Output', sub: 'Rule findings (guaranteed)\n+ AI insights (bonus)\nSame JSON schema\nFrontend renders both', color: PURPLE, x: 6.7 },
];
flowBoxes.forEach(b => {
  s3.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: b.x, y: 1.5, w: 2.8, h: 2.2, fill: { color: DARK }, line: { color: b.color, width: 2 }, rectRadius: 0.08 });
  s3.addText(b.label, { x: b.x + 0.15, y: 1.6, w: 2.5, h: 0.4, fontSize: 13, fontFace: 'Arial', color: b.color, bold: true });
  s3.addText(b.sub, { x: b.x + 0.15, y: 2.1, w: 2.5, h: 1.5, fontSize: 11, fontFace: 'Calibri', color: GRAY });
});
// Arrows
s3.addText('\u2192', { x: 3.15, y: 2.2, w: 0.5, h: 0.5, fontSize: 28, color: GRAY, align: 'center' });
s3.addText('\u2192', { x: 6.25, y: 2.2, w: 0.5, h: 0.5, fontSize: 28, color: GRAY, align: 'center' });

// Example
s3.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.0, w: 9, h: 1.3, fill: { color: '0F2A1F' }, line: { color: TEAL, width: 1 }, rectRadius: 0.08 });
s3.addText("Example", { x: 0.7, y: 4.05, w: 2, h: 0.35, fontSize: 12, fontFace: 'Arial', color: TEAL, bold: true });
s3.addText([
  { text: 'Rule finding: ', options: { bold: true, color: WHITE, fontSize: 11 } },
  { text: '"Expansive soil on 6% slope \u2192 differential settlement risk"', options: { color: GRAY, fontSize: 11, breakLine: true } },
  { text: '[AI INSIGHT]: ', options: { bold: true, color: TEAL, fontSize: 11 } },
  { text: '"North-facing slope = asymmetric drying \u2192 worse heave on south wall. Consider asymmetric PT cable spacing."', options: { color: GRAY, fontSize: 11 } },
], { x: 0.7, y: 4.4, w: 8.6, h: 0.85, fontFace: 'Calibri', valign: 'top' });

// ═══════════════════════════════════════════════════════════════
// SLIDE 4: Brain Report (Layer 6)
// ═══════════════════════════════════════════════════════════════
let s4 = darkSlide();
s4.addText("Layer 6: Brain Report", {
  x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 28, fontFace: 'Arial Black', color: WHITE
});
s4.addText("Claude as Parcel Strategist — OR rule-based fallback produces identical output", {
  x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 14, fontFace: 'Calibri', color: TEAL, italic: true
});

// What Claude receives
s4.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.5, w: 4.2, h: 3.0, fill: { color: DARK }, line: { color: NAVY, width: 1.5 }, rectRadius: 0.08 });
s4.addText("Claude Receives", { x: 0.7, y: 1.55, w: 3.8, h: 0.35, fontSize: 13, fontFace: 'Arial', color: NAVY, bold: true });
s4.addText([
  { text: 'Evidence Pack (150+ fields)', options: { bullet: true, breakLine: true, fontSize: 11 } },
  { text: '14 GIS layers with confidence levels', options: { bullet: true, breakLine: true, fontSize: 11 } },
  { text: '7 computed results (slope, cost, runoff...)', options: { bullet: true, breakLine: true, fontSize: 11 } },
  { text: 'Doctrine rules triggered', options: { bullet: true, breakLine: true, fontSize: 11 } },
  { text: 'Assumptions & unknowns list', options: { bullet: true, breakLine: true, fontSize: 11 } },
  { text: 'Expert panel findings', options: { bullet: true, fontSize: 11 } },
], { x: 0.7, y: 2.0, w: 3.8, h: 2.3, fontFace: 'Calibri', color: GRAY, valign: 'top' });

// What Claude produces
s4.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.3, y: 1.5, w: 4.2, h: 3.0, fill: { color: DARK }, line: { color: TEAL, width: 1.5 }, rectRadius: 0.08 });
s4.addText("Claude Produces", { x: 5.5, y: 1.55, w: 3.8, h: 0.35, fontSize: 13, fontFace: 'Arial', color: TEAL, bold: true });
s4.addText([
  { text: 'Verdict with reasoning', options: { bullet: true, breakLine: true, fontSize: 11 } },
  { text: 'Tradeoffs between competing signals', options: { bullet: true, breakLine: true, fontSize: 11 } },
  { text: 'Best-fit building concept', options: { bullet: true, breakLine: true, fontSize: 11 } },
  { text: 'Build now vs wait comparison', options: { bullet: true, breakLine: true, fontSize: 11 } },
  { text: 'Site design (pad, orientation, windows)', options: { bullet: true, breakLine: true, fontSize: 11 } },
  { text: 'Professional next steps with WHO to call', options: { bullet: true, fontSize: 11 } },
], { x: 5.5, y: 2.0, w: 3.8, h: 2.3, fontFace: 'Calibri', color: GRAY, valign: 'top' });

s4.addText('\u2192', { x: 4.55, y: 2.5, w: 0.8, h: 0.5, fontSize: 32, color: TEAL, align: 'center' });

// Fallback callout
s4.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.7, w: 9, h: 0.7, fill: { color: '1A1A2E' }, line: { color: AMBER, width: 1 }, rectRadius: 0.06 });
s4.addText([
  { text: 'No API key? ', options: { bold: true, color: AMBER, fontSize: 12 } },
  { text: 'generateRuleBasedReport() produces the EXACT SAME JSON structure. App works 100% without Claude.', options: { color: GRAY, fontSize: 12 } },
], { x: 0.7, y: 4.7, w: 8.6, h: 0.7, fontFace: 'Calibri', valign: 'middle' });

// ═══════════════════════════════════════════════════════════════
// SLIDE 5: Engineering Q&A (Layer 7)
// ═══════════════════════════════════════════════════════════════
let s5 = darkSlide();
s5.addText("Layer 7: Engineering Q&A", {
  x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 28, fontFace: 'Arial Black', color: WHITE
});
s5.addText("Haiku answers engineering questions with code citations in <5 seconds", {
  x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 14, fontFace: 'Calibri', color: TEAL, italic: true
});

// Chat-like UI mockup
const chatItems = [
  { q: true, text: '"What foundation for expansive clay soil?"' },
  { q: false, text: 'For expansive clay (CL/CH), ACI 360R-10 \u00A75.4 recommends a post-tensioned slab. PT cables provide internal compression that resists cracking from differential heave...' },
  { q: true, text: '"What should I be concerned about on this site?"' },
  { q: false, text: 'Based on your site data (SDC B, Loam soil, Zone X): foundation bearing is adequate at 2,000 psf, no flood risk, low seismic demand. Primary concern: verify shrink-swell potential with geotech boring...' },
];
chatItems.forEach((c, i) => {
  const y = 1.5 + i * 0.85;
  const bgCol = c.q ? '1A2744' : '0F2A1F';
  const borderCol = c.q ? NAVY : TEAL;
  s5.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: c.q ? 3.5 : 0.5, y, w: c.q ? 6 : 7.5, h: 0.7, fill: { color: bgCol }, line: { color: borderCol, width: 1 }, rectRadius: 0.06 });
  s5.addText(c.text, { x: c.q ? 3.7 : 0.7, y, w: c.q ? 5.6 : 7.1, h: 0.7, fontSize: 11, fontFace: 'Calibri', color: c.q ? WHITE : GRAY, valign: 'middle' });
});

// Tech specs box
s5.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.8, w: 9, h: 0.6, fill: { color: DARK }, rectRadius: 0.05 });
s5.addText([
  { text: 'Model: ', options: { bold: true, color: WHITE, fontSize: 11 } },
  { text: 'Haiku (3x faster than Sonnet)  |  ', options: { color: GRAY, fontSize: 11 } },
  { text: 'Tokens: ', options: { bold: true, color: WHITE, fontSize: 11 } },
  { text: '800 max  |  ', options: { color: GRAY, fontSize: 11 } },
  { text: 'Sources: ', options: { bold: true, color: WHITE, fontSize: 11 } },
  { text: '[PUBLIC] [LICENSED] [CALCULATED]  |  ', options: { color: GRAY, fontSize: 11 } },
  { text: 'Fallback: ', options: { bold: true, color: WHITE, fontSize: 11 } },
  { text: '6 rule-based topics', options: { color: GRAY, fontSize: 11 } },
], { x: 0.7, y: 4.8, w: 8.6, h: 0.6, fontFace: 'Calibri', valign: 'middle' });

// ═══════════════════════════════════════════════════════════════
// SLIDE 6: What Claude Does NOT Do
// ═══════════════════════════════════════════════════════════════
let s6 = darkSlide();
s6.addText("What Claude Does NOT Do", {
  x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 28, fontFace: 'Arial Black', color: WHITE
});

const nots = [
  { icon: '\u2716', task: 'No math', detail: 'Code computes slope, cost, runoff, cut/fill, loads — Claude never touches arithmetic' },
  { icon: '\u2716', task: 'No foundation selection', detail: 'If-else priority ladder picks type — experts can upgrade, Claude cannot override' },
  { icon: '\u2716', task: 'No GIS data fetching', detail: '15 government APIs do that — Claude sees results, not raw requests' },
  { icon: '\u2716', task: 'No final verdict', detail: 'Weighted scoring formula: foundation\u00D73, stormwater\u00D72, compounds bonus' },
  { icon: '\u2716', task: 'No code compliance claims', detail: 'Boundary rule: "consult a licensed PE" — Claude cannot stamp or certify' },
  { icon: '\u2716', task: 'No structural sizing', detail: 'No member dimensions, rebar, or load path — that requires a licensed engineer' },
];
nots.forEach((n, i) => {
  const y = 1.2 + i * 0.7;
  s6.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 9, h: 0.6, fill: { color: DARK }, rectRadius: 0.05 });
  s6.addText(n.icon, { x: 0.6, y, w: 0.5, h: 0.6, fontSize: 16, color: RED, align: 'center', valign: 'middle' });
  s6.addText(n.task, { x: 1.2, y, w: 2.3, h: 0.6, fontSize: 13, fontFace: 'Calibri', color: WHITE, bold: true, valign: 'middle' });
  s6.addText(n.detail, { x: 3.6, y, w: 5.7, h: 0.6, fontSize: 11, fontFace: 'Calibri', color: GRAY, valign: 'middle' });
});

// Bottom emphasis
s6.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 5.0, w: 9, h: 0.5, fill: { color: '0F2A1F' }, line: { color: TEAL, width: 1.5 }, rectRadius: 0.06 });
s6.addText("Remove the API key \u2192 app still works 100% with rule-based output", {
  x: 0.7, y: 5.0, w: 8.6, h: 0.5, fontSize: 14, fontFace: 'Calibri', color: TEAL, bold: true, align: 'center', valign: 'middle'
});

// ═══════════════════════════════════════════════════════════════
// SLIDE 7: Feedback Loops
// ═══════════════════════════════════════════════════════════════
let s7 = darkSlide();
s7.addText("Feedback Loops — AI Upgrades the Baseline", {
  x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 28, fontFace: 'Arial Black', color: WHITE
});
s7.addText("Expert findings flow BACK to change actual outputs — not just text", {
  x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 14, fontFace: 'Calibri', color: TEAL, italic: true
});

const loops = [
  { expert: 'Foundation Advisor', action: 'Upgrades foundation type', example: 'Conventional Slab \u2192 Grade Beam on Piers', color: GREEN },
  { expert: 'Cost Forecaster', action: 'Applies compound premiums', example: '+15% flood+fnd, +10% slope+fnd, +8% flood+slope', color: AMBER },
  { expert: 'Fire Risk Analysis', action: 'Cost uplift for WUI zones', example: 'Very High \u2192 +12%, High \u2192 +6% to total cost', color: ORANGE },
  { expert: 'Stormwater', action: 'NOAA + HSG-adjusted runoff', example: 'HSG D soil adds +0.15 to C-value, NOAA Atlas 14 rainfall', color: NAVY },
];
loops.forEach((l, i) => {
  const y = 1.5 + i * 0.95;
  s7.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 9, h: 0.8, fill: { color: DARK }, line: { color: l.color, width: 1.5 }, rectRadius: 0.06 });
  s7.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 0.12, h: 0.8, fill: { color: l.color }, rectRadius: 0 });
  s7.addText(l.expert, { x: 0.8, y, w: 2.5, h: 0.4, fontSize: 13, fontFace: 'Calibri', color: WHITE, bold: true, valign: 'bottom' });
  s7.addText(l.action, { x: 0.8, y: y + 0.35, w: 2.5, h: 0.4, fontSize: 11, fontFace: 'Calibri', color: GRAY, valign: 'top' });
  s7.addText(l.example, { x: 3.8, y, w: 5.5, h: 0.8, fontSize: 12, fontFace: 'Calibri', color: l.color, valign: 'middle' });
});

s7.addText("These are NOT cosmetic — they change costs.total_now, foundation.type, and the final verdict", {
  x: 0.5, y: 5.1, w: 9, h: 0.4, fontSize: 12, fontFace: 'Calibri', color: GRAY, italic: true
});

// ═══════════════════════════════════════════════════════════════
// SLIDE 8: Key Insight
// ═══════════════════════════════════════════════════════════════
let s8 = darkSlide();
s8.addText("The Key Insight", {
  x: 0.5, y: 0.5, w: 9, h: 0.7, fontSize: 32, fontFace: 'Arial Black', color: WHITE
});
s8.addText("Claude is one replaceable component\ninside a larger persistent architecture.", {
  x: 0.8, y: 1.5, w: 8.5, h: 1.2, fontSize: 22, fontFace: 'Calibri', color: TEAL, italic: true, lineSpacingMultiple: 1.4
});
s8.addText("The brain is the persistent system:\nretrieval, tools, doctrine, evidence pack,\nexpert panel, feedback loops, and governance.", {
  x: 0.8, y: 2.8, w: 8.5, h: 1.2, fontSize: 18, fontFace: 'Calibri', color: GRAY, lineSpacingMultiple: 1.4
});

// 4 stats at bottom
const finalStats = [
  { num: '15', label: 'GIS Layers' },
  { num: '19', label: 'Compound Risks' },
  { num: '6', label: 'Domain Experts' },
  { num: '4', label: 'Feedback Loops' },
];
finalStats.forEach((st, i) => {
  const x = 0.5 + i * 2.4;
  s8.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.3, w: 2.1, h: 1.0, fill: { color: DARK }, line: { color: TEAL, width: 1 }, rectRadius: 0.06 });
  s8.addText(st.num, { x, y: 4.3, w: 2.1, h: 0.6, fontSize: 32, fontFace: 'Arial Black', color: TEAL, align: 'center', valign: 'bottom' });
  s8.addText(st.label, { x, y: 4.85, w: 2.1, h: 0.4, fontSize: 11, fontFace: 'Calibri', color: GRAY, align: 'center', valign: 'top' });
});

// Save
const outPath = "C:/Users/chidc/ASU Dropbox/Mobasher_Group/Hackathon ASU 2025/SiteSense_Claude_Role.pptx";
pres.writeFile({ fileName: outPath }).then(() => {
  console.log('Saved:', outPath);
}).catch(err => {
  console.error('Error:', err);
});
