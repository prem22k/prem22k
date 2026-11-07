import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GlassDoc,
  wrap,
  ellipsize,
  WIDTH,
  PAD,
  fmt,
  formatNumber,
  type Box,
  type Layout,
  type Mode,
  type Theme,
} from './glass/index.ts';
import type { FetchedProfileData } from './fetch-data.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const PROFILE_JSON_PATH = path.join(ROOT_DIR, 'data/profile.json');

export interface CodebaseOptions {
  mode?: Mode;
  layout?: Layout;
  data?: FetchedProfileData;
}

interface LanguageInput {
  name: string;
  bytes: number;
  repos: number;
  percentage?: number;
}

interface Segment {
  name: string;
  bytes: number;
  share: number; // 0..1
  detail: string; // "14 repos" or "5 languages"
  members?: string[]; // languages grouped into "Other"
  color: keyof Theme['accents'];
}

/** Languages under this share (percent) are grouped into "Other". */
const MIN_PERCENT = 1;

const LANGUAGE_COLORS: Record<string, keyof Theme['accents']> = {
  TypeScript: 'blue',
  JavaScript: 'yellow',
  Python: 'green',
  CSS: 'purple',
  PLpgSQL: 'indigo',
  HTML: 'orange',
  Rust: 'red',
  Shell: 'teal',
  Go: 'teal',
  Java: 'red',
};
const FALLBACK_COLORS: (keyof Theme['accents'])[] = ['pink', 'teal', 'red', 'indigo', 'purple', 'orange'];

const FALLBACK_LANGUAGES: LanguageInput[] = [
  { name: 'TypeScript', bytes: 5950725, repos: 14 },
  { name: 'JavaScript', bytes: 1906741, repos: 24 },
  { name: 'Python', bytes: 345791, repos: 5 },
  { name: 'CSS', bytes: 280328, repos: 22 },
];

function loadProfile(data?: FetchedProfileData): FetchedProfileData | null {
  if (data) return data;
  if (!fs.existsSync(PROFILE_JSON_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(PROFILE_JSON_PATH, 'utf8'));
  } catch {
    return null;
  }
}

/** Finder-style sizes (decimal units, like macOS). */
function formatBytes(bytes: number): string {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${Math.round(bytes / 1e3)} KB`;
  return `${bytes} B`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function buildSegments(languages: LanguageInput[]): Segment[] {
  const list = languages.filter((l) => l.bytes > 0).sort((a, b) => b.bytes - a.bytes);
  const total = list.reduce((s, l) => s + l.bytes, 0) || 1;
  const main = list.filter((l) => (l.bytes / total) * 100 >= MIN_PERCENT - 1e-9);
  const rest = list.filter((l) => (l.bytes / total) * 100 < MIN_PERCENT - 1e-9);
  let fb = 0;
  const segments: Segment[] = main.map((l) => ({
    name: l.name,
    bytes: l.bytes,
    share: l.bytes / total,
    detail: plural(l.repos, 'repo', 'repos'),
    color: LANGUAGE_COLORS[l.name] ?? FALLBACK_COLORS[fb++ % FALLBACK_COLORS.length],
  }));
  if (rest.length) {
    const bytes = rest.reduce((s, l) => s + l.bytes, 0);
    segments.push({
      name: 'Other',
      bytes,
      share: bytes / total,
      detail: plural(rest.length, 'language', 'languages'),
      members: rest.map((l) => l.name),
      color: 'gray',
    });
  }
  return segments;
}

/**
 * Accent colour for filled shapes. Light mode's text-safe yellow (#D9A400) reads as mustard in a
 * large fill, so fills use Apple's systemYellow (#FFCC00) instead.
 */
function fillColor(d: GlassDoc, name: keyof Theme['accents']): string {
  if (name === 'yellow' && d.mode === 'light') return '#FFCC00';
  return d.accent(name);
}

/** Rounded segmented capsule bar (macOS Storage style). */
function drawBar(d: GlassDoc, x: number, y: number, w: number, h: number, segments: Segment[]): void {
  const gap = 3;
  const n = segments.length;
  const avail = w - gap * (n - 1);
  // Enforce a minimum visible width (end segments must clear the capsule's rounded cap),
  // taking the space from the larger segments.
  const minW = (i: number) => (i === 0 || i === n - 1 ? h / 2 + 4 : 6);
  const raw = segments.map((s) => s.share * avail);
  const small = raw.map((v, i) => v < minW(i));
  const smallTotal = small.reduce((s, isSmall, i) => s + (isSmall ? minW(i) : 0), 0);
  const bigRaw = raw.reduce((s, v, i) => s + (small[i] ? 0 : v), 0) || 1;
  const widths = raw.map((v, i) => (small[i] ? minW(i) : (v / bigRaw) * (avail - smallTotal)));

  const clip = d.id('bar');
  const gloss = d.id('gl');
  const dark = d.mode === 'dark';
  d.addDef(`<clipPath id="${clip}"><rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="${fmt(h / 2)}"/></clipPath>`);
  d.addDef(
    `<linearGradient id="${gloss}" x1="0" y1="${fmt(y)}" x2="0" y2="${fmt(y + h)}" gradientUnits="userSpaceOnUse">` +
      `<stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.32 : 0.4}"/>` +
      `<stop offset="0.5" stop-color="#fff" stop-opacity="0.04"/>` +
      `<stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.12 : 0.06}"/></linearGradient>`
  );
  const parts: string[] = [`<g clip-path="url(#${clip})">`];
  let cx = x;
  segments.forEach((s, i) => {
    const sw = widths[i];
    const r = Math.min(4, sw / 2);
    parts.push(
      `<rect x="${fmt(cx)}" y="${fmt(y)}" width="${fmt(sw)}" height="${fmt(h)}" rx="${fmt(r)}" fill="${fillColor(d, s.color)}"/>` +
        `<rect x="${fmt(cx)}" y="${fmt(y)}" width="${fmt(sw)}" height="${fmt(h)}" rx="${fmt(r)}" fill="url(#${gloss})"/>`
    );
    cx += sw + gap;
  });
  parts.push('</g>');
  parts.push(
    `<rect x="${fmt(x + 0.5)}" y="${fmt(y + 0.5)}" width="${fmt(w - 1)}" height="${fmt(h - 1)}" rx="${fmt(h / 2 - 0.5)}" fill="none" stroke="${dark ? '#FFFFFF' : '#0B1020'}" stroke-opacity="${dark ? 0.14 : 0.08}"/>`
  );
  d.add(parts.join(''));
}

interface LegendColumns {
  pctEnd: number; // offset from the column's right edge (0)
  sizeEnd: number;
  detailEnd: number;
  detailW: number;
}

function legendColumns(d: GlassDoc, segments: Segment[]): LegendColumns {
  const max = (vals: number[]) => Math.max(...vals);
  const pctW = max(segments.map((s) => d.measure({ text: `${(s.share * 100).toFixed(1)}%`, size: 14, weight: 600, cut: 'text', ls: 0, tabular: true })));
  const sizeW = max(segments.map((s) => d.measure({ text: formatBytes(s.bytes), size: 13, weight: 500, cut: 'text', ls: 0, tabular: true })));
  const detailW = max(segments.map((s) => d.measure({ text: s.detail, size: 13, weight: 500, cut: 'text', ls: 0, tabular: true })));
  const colGap = 22;
  const pctEnd = 0;
  const sizeEnd = -(Math.ceil(pctW) + colGap);
  const detailEnd = sizeEnd - (Math.ceil(sizeW) + colGap);
  return { pctEnd, sizeEnd, detailEnd, detailW: Math.ceil(detailW) };
}

function drawLegendRow(
  d: GlassDoc,
  s: Segment,
  x: number,
  y: number,
  w: number,
  rowH: number,
  cols: LegendColumns,
  container: Box
): void {
  const right = x + w;
  const base = y + rowH / 2 + 14 * 0.36;
  d.add(`<circle cx="${fmt(x + 5)}" cy="${fmt(y + rowH / 2)}" r="5" fill="${fillColor(d, s.color)}"/>`);
  const nameX = x + 20;
  const detailStart = right + cols.detailEnd - cols.detailW;
  d.text({
    x: nameX,
    y: base,
    text: s.name,
    size: 14,
    weight: 500,
    cut: 'text',
    ls: 0,
    color: d.t.text,
    maxWidth: detailStart - 14 - nameX,
    overflow: 'ellipsis',
    container,
  });
  d.text({
    x: right + cols.detailEnd,
    y: base,
    text: s.detail,
    size: 13,
    weight: 500,
    cut: 'text',
    ls: 0,
    tabular: true,
    anchor: 'end',
    color: d.t.textTertiary,
    maxWidth: cols.detailW + 1,
    overflow: 'ellipsis',
    container,
  });
  d.text({
    x: right + cols.sizeEnd,
    y: base,
    text: formatBytes(s.bytes),
    size: 13,
    weight: 500,
    cut: 'text',
    ls: 0,
    tabular: true,
    anchor: 'end',
    color: d.t.textSecondary,
    maxWidth: 90,
    overflow: 'ellipsis',
    container,
  });
  d.text({
    x: right + cols.pctEnd,
    y: base,
    text: `${(s.share * 100).toFixed(1)}%`,
    size: 14,
    weight: 600,
    cut: 'text',
    ls: 0,
    tabular: true,
    anchor: 'end',
    color: d.t.text,
    maxWidth: 70,
    overflow: 'ellipsis',
    container,
  });
}

/**
 * Languages widget in the style of macOS System Settings › Storage:
 * title row, one segmented capsule bar, and a legend with share, size and repo count.
 */
export function renderCodebaseSVG(options: CodebaseOptions = {}): string {
  const { mode = 'dark', layout = 'wide' } = options;
  const profile = loadProfile(options.data);
  const languages: LanguageInput[] = profile?.codebase?.languages?.length ? profile.codebase.languages : FALLBACK_LANGUAGES;
  const segments = buildSegments(languages);
  const totalBytes = segments.reduce((s, x) => s + x.bytes, 0);
  const lines = profile?.codebase?.estimatedLines ?? Math.round(totalBytes / 40);
  const repos = profile?.overview?.authoredRepos ?? 28;
  const caption = `~${formatNumber(lines, true)} lines · ${formatBytes(totalBytes)} · ${plural(repos, 'repository', 'repositories')}`;

  const wide = layout === 'wide';
  const W = WIDTH[layout];
  const pad = PAD[layout];
  const P = wide ? 24 : 20; // inner panel padding
  const rowH = wide ? 38 : 40;
  const columns = wide ? 2 : 1;
  const colGap = 36;
  const perCol = Math.ceil(segments.length / columns);

  // Vertical rhythm (relative to panel top).
  const titleBase = P + 18; // 24px title, cap height ≈ 17.5
  const captionBase = wide ? titleBase : titleBase + 24;
  const barTop = (wide ? titleBase : captionBase) + (wide ? 24 : 20);
  const barH = wide ? 26 : 22;
  const legendTop = barTop + barH + (wide ? 14 : 12);
  // Footnote naming the languages grouped into "Other": fills the free slot of the wide grid,
  // or sits under the list in compact.
  const other = segments.find((s) => s.members?.length);
  const noteStyle = { size: 12, weight: 500, cut: 'text' as const, ls: 0.1 };
  const noteLH = 16;
  const contentW = W - pad * 2 - P * 2;
  const slotFree = wide && segments.length % columns !== 0;
  const noteW = wide ? (contentW - colGap) / 2 - 20 : contentW;
  let noteLines: string[] = [];
  if (other && (slotFree || !wide)) {
    noteLines = wrap(`Other: ${other.members!.join(', ')}`, noteW, noteStyle);
    if (noteLines.length > 2) noteLines = [noteLines[0], ellipsize(noteLines.slice(1).join(' '), noteW, noteStyle)];
  }
  const noteH = !wide && noteLines.length ? 12 + noteLines.length * noteLH : 0;
  const panelH = legendTop + perCol * rowH + noteH + P - 10;
  const H = panelH + pad * 2;

  const d = new GlassDoc({
    width: W,
    height: H,
    mode,
    title: 'Languages — Prem Sai Kota',
    desc: `Language breakdown across ${repos} repositories: ${segments.map((s) => `${s.name} ${(s.share * 100).toFixed(1)}%`).join(', ')}.`,
    seed: wide ? 'codebase' : 'codebase-compact',
  });

  const p = d.panel({ x: pad, y: pad, w: W - pad * 2, h: panelH });
  const cx = p.x + P;
  const cw = p.w - P * 2;

  const title = d.text({
    x: cx,
    y: p.y + titleBase,
    text: 'Languages',
    style: 'title',
    maxWidth: cw,
    container: p,
  });
  if (wide) {
    d.text({
      x: cx + cw,
      y: p.y + captionBase,
      text: caption,
      style: 'callout',
      anchor: 'end',
      color: d.t.textSecondary,
      maxWidth: cw - title.width - 24,
      overflow: 'ellipsis',
      container: p,
    });
  } else {
    d.text({
      x: cx,
      y: p.y + captionBase,
      text: caption,
      style: 'callout',
      color: d.t.textSecondary,
      maxWidth: cw,
      overflow: 'ellipsis',
      container: p,
    });
  }

  drawBar(d, cx, p.y + barTop, cw, barH, segments);

  const cols = legendColumns(d, segments);
  const colW = (cw - colGap * (columns - 1)) / columns;
  segments.forEach((s, i) => {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    const x = cx + col * (colW + colGap);
    const y = p.y + legendTop + row * rowH;
    if (row > 0) d.separator(x + 20, y, x + colW, y);
    drawLegendRow(d, s, x, y, colW, rowH, cols, p);
  });

  if (noteLines.length) {
    const nx = wide ? cx + colW + colGap + 20 : cx;
    const blockTop = wide
      ? p.y + legendTop + (perCol - 1) * rowH + (rowH - noteLines.length * noteLH) / 2
      : p.y + legendTop + perCol * rowH + 6;
    noteLines.forEach((line, i) => {
      d.text({
        x: nx,
        y: blockTop + i * noteLH + 12,
        text: line,
        style: 'caption',
        color: d.t.textTertiary,
        maxWidth: noteW,
        overflow: 'ellipsis',
        container: p,
      });
    });
  }

  return d.render();
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
  const outputs: [string, Mode, Layout][] = [
    ['codebase-dark.svg', 'dark', 'wide'],
    ['codebase-light.svg', 'light', 'wide'],
    ['codebase-compact-dark.svg', 'dark', 'compact'],
    ['codebase-compact-light.svg', 'light', 'compact'],
  ];
  for (const [file, mode, layout] of outputs) {
    fs.writeFileSync(path.join(ASSETS_DIR, file), renderCodebaseSVG({ mode, layout }), 'utf8');
    console.log(`✔ Generated assets/${file}`);
  }
}
