import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, WIDTH, PAD, GAP, measure, fmt, type Box, type Layout, type Mode, type Theme } from './glass/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

export interface StackOptions {
  mode?: Mode;
  layout?: Layout;
}

type Glyph = 'code' | 'window' | 'database' | 'bolt' | 'sparkle' | 'display';

export interface StackCategory {
  title: string;
  color: keyof Theme['accents'];
  glyph: Glyph;
  items: string[];
}

export const STACK_DATA: StackCategory[] = [
  { title: 'Languages', color: 'blue', glyph: 'code', items: ['TypeScript', 'JavaScript', 'Python', 'Rust'] },
  { title: 'Frontend', color: 'teal', glyph: 'window', items: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion'] },
  {
    title: 'Backend & Data',
    color: 'green',
    glyph: 'database',
    items: ['Node.js', 'Express', 'PostgreSQL', 'Supabase', 'MongoDB', 'Redis'],
  },
  { title: 'Real-time', color: 'orange', glyph: 'bolt', items: ['Yjs CRDTs', 'WebSockets', 'Socket.io', 'Server-Sent Events'] },
  {
    title: 'AI & Retrieval',
    color: 'purple',
    glyph: 'sparkle',
    items: ['Gemini', 'Ollama', 'ChromaDB', 'BM25 hybrid search', 'MCP'],
  },
  {
    title: 'Desktop & Infra',
    color: 'indigo',
    glyph: 'display',
    items: ['Tauri', 'Electron', 'Docker', 'GitHub Actions', 'Vercel', 'Cloudflare Workers'],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return (
    '#' +
    ca
      .map((v, i) => Math.round(v + (cb[i] - v) * t))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Superellipse ("squircle") path, the continuous-corner shape of an app icon. */
function squirclePath(x: number, y: number, s: number, n = 5): string {
  const r = s / 2;
  const cx = x + r;
  const cy = y + r;
  const pts: string[] = [];
  const steps = 64;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a);
    const si = Math.sin(a);
    const px = cx + r * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    const py = cy + r * Math.sign(si) * Math.pow(Math.abs(si), 2 / n);
    pts.push(`${fmt(px)} ${fmt(py)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** White glyphs drawn on a 24-unit grid. */
function glyphSvg(glyph: Glyph): string {
  const stroke = 'fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const star = (cx: number, cy: number, r: number) =>
    `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
  switch (glyph) {
    case 'code':
      return `<path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.4 5.8l-2.8 12.4" ${stroke}/>`;
    case 'window':
      return (
        `<rect x="3.5" y="5" width="17" height="14" rx="3" ${stroke}/>` +
        `<path d="M3.5 9.5h17" ${stroke}/>` +
        `<path d="M8 13.5h8M8 16h5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.85"/>`
      );
    case 'database':
      return (
        `<ellipse cx="12" cy="6.5" rx="7" ry="2.8" ${stroke}/>` +
        `<path d="M5 6.5v11c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-11M5 12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8" ${stroke}/>`
      );
    case 'bolt':
      return `<path d="M13.2 3L5.6 13.4h5.6L10.4 21l8-10.6h-5.7z" fill="#fff" stroke="#fff" stroke-width="0.8" stroke-linejoin="round"/>`;
    case 'sparkle':
      return `<path d="${star(10.5, 13.5, 7.5)}" fill="#fff"/><path d="${star(17.5, 6, 3.2)}" fill="#fff" fill-opacity="0.9"/>`;
    case 'display':
      return `<rect x="3.5" y="4.5" width="17" height="12" rx="2.5" ${stroke}/><path d="M12 16.5V20M8.5 20h7" ${stroke}/>`;
  }
}

/**
 * App-icon style squircle with an accent gradient and a white glyph.
 * The squircle outline, rim gradient and shadow filter are defined once per document and reused.
 */
const shared = new WeakMap<GlassDoc, { shape: string; rim: string; shadow: string; size: number }>();

function iconDefs(d: GlassDoc, s: number) {
  const existing = shared.get(d);
  if (existing && existing.size === s) return existing;
  const ids = { shape: d.id('sq'), rim: d.id('ir'), shadow: d.id('is'), size: s };
  d.addDef(`<path id="${ids.shape}" d="${squirclePath(0, 0, s)}"/>`);
  d.addDef(
    `<linearGradient id="${ids.rim}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.08"/>` +
      `<stop offset="1" stop-color="#fff" stop-opacity="0.2"/></linearGradient>`
  );
  d.addDef(
    `<filter id="${ids.shadow}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="2.4"/></filter>`
  );
  shared.set(d, ids);
  return ids;
}

function drawIcon(d: GlassDoc, x: number, y: number, s: number, color: string, glyph: Glyph): void {
  const ids = iconDefs(d, s);
  const grad = d.id('ig');
  const top = mix(color, '#FFFFFF', 0.28);
  const bottom = mix(color, '#000000', 0.12);
  d.addDef(
    `<linearGradient id="${grad}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`
  );
  const k = (s / 24) * 0.72; // glyph scale: the 24-unit glyph grid fills 72% of the icon
  const dark = d.mode === 'dark';
  d.add(
    `<g transform="translate(${fmt(x)} ${fmt(y)})">` +
      `<use href="#${ids.shape}" transform="translate(1 ${fmt(1 + s * 0.08)}) scale(${fmt((s - 2) / s)})" fill="${bottom}" fill-opacity="${dark ? 0.55 : 0.35}" filter="url(#${ids.shadow})"/>` +
      `<use href="#${ids.shape}" fill="url(#${grad})"/>` +
      `<use href="#${ids.shape}" transform="translate(0.6 0.6) scale(${fmt((s - 1.2) / s)})" fill="none" stroke="url(#${ids.rim})" stroke-width="1"/>` +
      `<g transform="translate(${fmt((s - 24 * k) / 2)} ${fmt((s - 24 * k) / 2)}) scale(${fmt(k)})">${glyphSvg(glyph)}</g>` +
      `</g>`
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

interface Metrics {
  tilePad: number;
  icon: number;
  headerGap: number; // icon bottom → first capsule row
  pillH: number;
  pillPadX: number;
  pillSize: number;
  pillWeight: number;
  pillGapX: number;
  pillGapY: number;
}

const METRICS: Record<Layout, Metrics> = {
  wide: { tilePad: 18, icon: 32, headerGap: 16, pillH: 28, pillPadX: 11, pillSize: 12.5, pillWeight: 500, pillGapX: 6, pillGapY: 7 },
  compact: { tilePad: 16, icon: 30, headerGap: 14, pillH: 28, pillPadX: 11, pillSize: 12.5, pillWeight: 500, pillGapX: 6, pillGapY: 7 },
};

interface PlacedPill {
  text: string;
  dx: number;
  row: number;
}

function pillWidth(text: string, m: Metrics): number {
  return Math.ceil(measure(text, { size: m.pillSize, weight: m.pillWeight, cut: 'text' }) + m.pillPadX * 2);
}

/** Greedy flow of capsules into rows no wider than maxW. */
function flowPills(items: string[], maxW: number, m: Metrics): { pills: PlacedPill[]; rows: number } {
  const pills: PlacedPill[] = [];
  let row = 0;
  let dx = 0;
  for (const text of items) {
    const w = pillWidth(text, m);
    if (w > maxW) throw new Error(`[stack] capsule "${text}" (${w}px) wider than tile (${maxW}px)`);
    if (dx > 0 && dx + w > maxW) {
      row += 1;
      dx = 0;
    }
    pills.push({ text, dx, row });
    dx += w + m.pillGapX;
  }
  return { pills, rows: row + 1 };
}

function tileContentHeight(rows: number, m: Metrics): number {
  return m.tilePad + m.icon + m.headerGap + rows * m.pillH + (rows - 1) * m.pillGapY + m.tilePad;
}

function drawTile(d: GlassDoc, box: Box, cat: StackCategory, m: Metrics): void {
  const p = d.panel({ ...box });
  const ix = p.x + m.tilePad;
  const iy = p.y + m.tilePad;
  drawIcon(d, ix, iy, m.icon, d.accent(cat.color), cat.glyph);
  const tx = ix + m.icon + 12;
  d.text({
    x: tx,
    y: iy + m.icon / 2 + 17 * 0.36,
    text: cat.title,
    style: 'headline',
    maxWidth: p.x + p.w - m.tilePad - tx,
    container: p,
  });
  const innerW = p.w - m.tilePad * 2;
  const { pills } = flowPills(cat.items, innerW, m);
  const py = iy + m.icon + m.headerGap;
  for (const pill of pills) {
    d.pill({
      x: ix + pill.dx,
      y: py + pill.row * (m.pillH + m.pillGapY),
      text: pill.text,
      h: m.pillH,
      padX: m.pillPadX,
      size: m.pillSize,
      weight: m.pillWeight,
      color: d.t.text,
      container: p,
    });
  }
}

/**
 * "Toolbox": six frosted tiles, each with an app-icon squircle, a category title and capsules.
 * Wide: 3×2 grid. Compact: single column.
 */
export function renderStackSVG(options: StackOptions = {}): string {
  const { mode = 'dark', layout = 'wide' } = options;
  const wide = layout === 'wide';
  const W = WIDTH[layout];
  const pad = PAD[layout];
  const gap = GAP[layout];
  const m = METRICS[layout];
  const cols = wide ? 3 : 1;
  const tileW = (W - pad * 2 - gap * (cols - 1)) / cols;
  const innerW = tileW - m.tilePad * 2;

  // Header on the wallpaper.
  const headerBase = pad + 18;
  const gridTop = headerBase + (wide ? 18 : 16);

  // Row heights: tallest tile in each row (tiles in a row share a height).
  const rowsOfTiles: StackCategory[][] = [];
  for (let i = 0; i < STACK_DATA.length; i += cols) rowsOfTiles.push(STACK_DATA.slice(i, i + cols));
  const rowHeights = rowsOfTiles.map((row) => Math.max(...row.map((c) => tileContentHeight(flowPills(c.items, innerW, m).rows, m))));
  const H = gridTop + rowHeights.reduce((s, h) => s + h, 0) + gap * (rowHeights.length - 1) + pad;

  const d = new GlassDoc({
    width: W,
    height: H,
    mode,
    title: 'Toolbox — Prem Sai Kota',
    desc: STACK_DATA.map((c) => `${c.title}: ${c.items.join(', ')}`).join('. ') + '.',
    seed: wide ? 'stack' : 'stack-compact',
  });
  const canvas: Box = { x: 0, y: 0, w: W, h: H };

  d.text({
    x: pad + m.tilePad,
    y: headerBase,
    text: 'Toolbox',
    style: 'title',
    maxWidth: W - pad * 2,
    container: canvas,
  });

  let y = gridTop;
  rowsOfTiles.forEach((row, r) => {
    row.forEach((cat, c) => {
      drawTile(d, { x: pad + c * (tileW + gap), y, w: tileW, h: rowHeights[r] }, cat, m);
    });
    y += rowHeights[r] + gap;
  });

  return d.render();
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
  const outputs: [string, Mode, Layout][] = [
    ['stack-dark.svg', 'dark', 'wide'],
    ['stack-light.svg', 'light', 'wide'],
    ['stack-compact-dark.svg', 'dark', 'compact'],
    ['stack-compact-light.svg', 'light', 'compact'],
  ];
  for (const [file, mode, layout] of outputs) {
    fs.writeFileSync(path.join(ASSETS_DIR, file), renderStackSVG({ mode, layout }), 'utf8');
    console.log(`✔ Generated assets/${file}`);
  }
}
