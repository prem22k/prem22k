import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GlassDoc,
  WIDTH,
  PAD,
  RADIUS,
  measure,
  glyphTile,
  type Box,
  type GlyphName,
  type Layout,
  type Mode,
} from './glass/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

export interface StackOptions {
  mode?: Mode;
  layout?: Layout;
}

export interface StackCategory {
  title: string;
  glyph: GlyphName;
  items: string[];
}

export const STACK_DATA: StackCategory[] = [
  { title: 'Languages', glyph: 'code', items: ['TypeScript', 'JavaScript', 'Python', 'Rust'] },
  { title: 'Frontend', glyph: 'window', items: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion'] },
  { title: 'Backend & Data', glyph: 'database', items: ['Node.js', 'Express', 'PostgreSQL', 'Supabase', 'MongoDB', 'Redis'] },
  { title: 'Real-time', glyph: 'bolt', items: ['Yjs CRDTs', 'WebSockets', 'Socket.io', 'Server-Sent Events'] },
  { title: 'AI & Retrieval', glyph: 'sparkle', items: ['Gemini', 'Ollama', 'ChromaDB', 'BM25 hybrid search', 'MCP'] },
  {
    title: 'Desktop & Infra',
    glyph: 'monitor',
    items: ['Tauri', 'Electron', 'Docker', 'GitHub Actions', 'Vercel', 'Cloudflare Workers'],
  },
];

// ── Layout ────────────────────────────────────────────────────────────────────

interface Metrics {
  sheetPad: number; // outer sheet edge → tiles
  headerH: number; // sheet top → first tile row
  titleBase: number; // sheet top → title baseline
  gap: number; // between tiles
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

const PILLS = { pillH: 28, pillPadX: 11, pillSize: 12.5, pillWeight: 500, pillGapX: 6, pillGapY: 7 };

// Sheet rhythm (padding, header, title baseline, tile gap) matches "At a glance".
const METRICS: Record<Layout, Metrics> = {
  wide: { sheetPad: 20, headerH: 66, titleBase: 44, gap: 12, tilePad: 16, icon: 32, headerGap: 14, ...PILLS },
  compact: { sheetPad: 14, headerH: 58, titleBase: 38, gap: 10, tilePad: 14, icon: 30, headerGap: 12, ...PILLS },
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
  const p = d.panel({ ...box, r: RADIUS.inner + 4, strong: true, flat: true });
  const ix = p.x + m.tilePad;
  const iy = p.y + m.tilePad;
  glyphTile(d, cat.glyph, { x: ix, y: iy, tile: m.icon });
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
 * "Toolbox": one sheet with the title, holding six flat tiles (neutral glyph tile, category title,
 * neutral capsules). Wide: 3×2 grid. Compact: single column.
 */
export function renderStackSVG(options: StackOptions = {}): string {
  const { mode = 'dark', layout = 'wide' } = options;
  const wide = layout === 'wide';
  const W = WIDTH[layout];
  const P = PAD[layout];
  const m = METRICS[layout];
  const cols = wide ? 3 : 1;
  const innerW = W - P * 2 - m.sheetPad * 2;
  const tileW = (innerW - m.gap * (cols - 1)) / cols;
  const tileInnerW = tileW - m.tilePad * 2;

  // Row heights: tallest tile in each row (tiles in a row share a height).
  const rowsOfTiles: StackCategory[][] = [];
  for (let i = 0; i < STACK_DATA.length; i += cols) rowsOfTiles.push(STACK_DATA.slice(i, i + cols));
  const rowHeights = rowsOfTiles.map((row) =>
    Math.max(...row.map((c) => tileContentHeight(flowPills(c.items, tileInnerW, m).rows, m)))
  );
  const gridH = rowHeights.reduce((s, h) => s + h, 0) + m.gap * (rowHeights.length - 1);
  const sheetH = m.headerH + gridH + m.sheetPad;
  const H = P * 2 + sheetH;

  const total = STACK_DATA.reduce((n, c) => n + c.items.length, 0);
  const d = new GlassDoc({
    width: W,
    height: H,
    mode,
    title: 'Toolbox — Prem Sai Kota',
    desc: STACK_DATA.map((c) => `${c.title}: ${c.items.join(', ')}`).join('. ') + '.',
    seed: wide ? 'stack' : 'stack-compact',
  });

  const sheet = d.panel({ x: P, y: P, w: W - P * 2, h: sheetH, r: RADIUS.panel + 4 });
  const ix = sheet.x + m.sheetPad;
  const titleY = sheet.y + m.titleBase;
  const meta = `${STACK_DATA.length} areas · ${total} tools`;
  const metaW = d.measure({ text: meta, style: 'caption' });
  d.text({ x: ix, y: titleY, text: 'Toolbox', style: 'title', maxWidth: innerW - metaW - 16, container: sheet });
  d.text({
    x: ix + innerW,
    y: titleY,
    text: meta,
    style: 'caption',
    anchor: 'end',
    color: d.t.textTertiary,
    maxWidth: metaW + 1,
    container: sheet,
  });

  let y = sheet.y + m.headerH;
  rowsOfTiles.forEach((row, r) => {
    row.forEach((cat, c) => {
      drawTile(d, { x: ix + c * (tileW + m.gap), y, w: tileW, h: rowHeights[r] }, cat, m);
    });
    y += rowHeights[r] + m.gap;
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
