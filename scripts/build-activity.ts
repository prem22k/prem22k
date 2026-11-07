/**
 * Activity: contribution heatmap, weekly rhythm and highlight tiles in the Liquid Glass style.
 *
 *   renderActivitySVG({ mode: 'dark', layout: 'wide', data })  → SVG string
 *
 * Wide (800px): full-width heatmap panel (53 weeks) over a row with the weekly-rhythm panel and
 * three stacked highlight tiles. Compact (400px): the same panels stacked, heatmap limited to the
 * last 26 weeks so the cells stay readable on phones.
 *
 * Every number comes from the last 365 calendar entries, so it matches the rest of the README.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, GAP, PAD, WIDTH, fmt, formatNumber, glyphTile, type Box, type GlyphName, type Layout, type Mode } from './glass/index.ts';
import type { FetchedProfileData } from './fetch-data.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const PROFILE_JSON_PATH = path.join(ROOT_DIR, 'data/profile.json');

export interface ContributionDay {
  date: string;
  count: number;
  level?: number;
}

export interface ActivityOptions {
  mode?: Mode;
  layout?: Layout;
  data?: Partial<FetchedProfileData> | { contributions?: { calendar?: ContributionDay[] } };
}

// ── Dates (deterministic, UTC, parsed from the data) ─────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
const DAY_MS = 86400000;

function parseDay(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}
function weekday(ms: number): number {
  return new Date(ms).getUTCDay();
}
function shortDate(ms: number, withYear = true): string {
  const dt = new Date(ms);
  return `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]}${withYear ? ` ${dt.getUTCFullYear()}` : ''}`;
}

// ── Data ────────────────────────────────────────────────────────────────────────

interface Cell {
  ms: number;
  count: number;
  level: number;
}

interface Stats {
  days: Cell[];
  firstMs: number;
  lastMs: number;
  weekdayTotals: number[];
  peakWeekday: number;
  busiestMonth: { label: string; count: number };
  bestDay: { ms: number; count: number };
  avgPerActiveDay: number;
  activeDays: number;
  thresholds: number[];
}

function loadCalendar(opts: ActivityOptions): ContributionDay[] {
  let cal = (opts.data?.contributions as { calendar?: ContributionDay[] } | undefined)?.calendar;
  if (!cal?.length && fs.existsSync(PROFILE_JSON_PATH)) {
    try {
      cal = JSON.parse(fs.readFileSync(PROFILE_JSON_PATH, 'utf8'))?.contributions?.calendar;
    } catch {
      cal = undefined;
    }
  }
  if (!cal?.length) {
    // Minimal fallback: an empty year so the layout still renders.
    const end = Date.UTC(2026, 0, 1);
    cal = Array.from({ length: 365 }, (_, i) => ({ date: new Date(end - (364 - i) * DAY_MS).toISOString().slice(0, 10), count: 0 }));
  }
  return [...cal].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).slice(-365);
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function computeStats(cal: ContributionDay[]): Stats {
  const positive = cal.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  // Quartiles of the active days: robust against one huge outlier day.
  const thresholds = [quantile(positive, 0.25), quantile(positive, 0.5), quantile(positive, 0.75)];
  const levelOf = (c: number) => (c <= 0 ? 0 : c <= thresholds[0] ? 1 : c <= thresholds[1] ? 2 : c <= thresholds[2] ? 3 : 4);
  const days: Cell[] = cal.map((d) => ({ ms: parseDay(d.date), count: Math.max(0, d.count || 0), level: levelOf(d.count || 0) }));

  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  const months = new Map<string, number>();
  let bestDay = { ms: days[days.length - 1].ms, count: 0 };
  for (const d of days) {
    weekdayTotals[weekday(d.ms)] += d.count;
    const dt = new Date(d.ms);
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()).padStart(2, '0')}`;
    months.set(key, (months.get(key) ?? 0) + d.count);
    if (d.count > bestDay.count) bestDay = { ms: d.ms, count: d.count };
  }
  let peakWeekday = 0;
  weekdayTotals.forEach((v, i) => {
    if (v > weekdayTotals[peakWeekday]) peakWeekday = i;
  });
  let bestKey = '';
  let bestCount = -1;
  for (const [k, v] of months) {
    if (v > bestCount) {
      bestKey = k;
      bestCount = v;
    }
  }
  const [by, bm] = bestKey.split('-').map(Number);
  const total = days.reduce((s, d) => s + d.count, 0);
  const activeDays = positive.length;
  return {
    days,
    firstMs: days[0].ms,
    lastMs: days[days.length - 1].ms,
    weekdayTotals,
    peakWeekday,
    busiestMonth: { label: `${MONTHS_LONG[bm]} ${by}`, count: Math.max(0, bestCount) },
    bestDay,
    avgPerActiveDay: activeDays ? total / activeDays : 0,
    activeDays,
    thresholds,
  };
}

// ── Small drawing helpers ───────────────────────────────────────────────────────

function rrect(x: number, y: number, w: number, h: number, r: number, fill: string, opacity: number): string {
  return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="${fmt(r)}" fill="${fill}" fill-opacity="${fmt(opacity)}"/>`;
}

/** A bar with rounded top corners and a square-ish (slightly rounded) base. */
function bar(x: number, y: number, w: number, h: number, r: number, fill: string, opacity: number): string {
  const rr = Math.min(r, w / 2, h);
  const b = Math.min(2, h / 2);
  const d =
    `M${fmt(x)} ${fmt(y + h - b)}V${fmt(y + rr)}Q${fmt(x)} ${fmt(y)} ${fmt(x + rr)} ${fmt(y)}` +
    `H${fmt(x + w - rr)}Q${fmt(x + w)} ${fmt(y)} ${fmt(x + w)} ${fmt(y + rr)}V${fmt(y + h - b)}` +
    `Q${fmt(x + w)} ${fmt(y + h)} ${fmt(x + w - b)} ${fmt(y + h)}H${fmt(x + b)}Q${fmt(x)} ${fmt(y + h)} ${fmt(x)} ${fmt(y + h - b)}Z`;
  return `<path d="${d}" fill="${fill}" fill-opacity="${fmt(opacity)}"/>`;
}

// ── Sections ────────────────────────────────────────────────────────────────────

interface Ramp {
  empty: [string, number];
  steps: Array<[string, number]>;
}

function ramp(d: GlassDoc): Ramp {
  const green = d.accent('green');
  const dark = d.mode === 'dark';
  return {
    empty: [d.t.fill, dark ? d.t.fillOpacity : d.t.fillOpacity + 0.01],
    steps: dark
      ? [
          [green, 0.3],
          [green, 0.52],
          [green, 0.76],
          [green, 1],
        ]
      : [
          [green, 0.28],
          [green, 0.5],
          [green, 0.74],
          [green, 1],
        ],
  };
}

interface HeatmapGeom {
  pad: number;
  cell: number;
  pitch: number;
  weeks: number;
  labelCol: number;
}

function heatmapGeom(layout: Layout, innerW: number): HeatmapGeom {
  const pad = layout === 'wide' ? 20 : 16;
  const weeks = layout === 'wide' ? 53 : 26;
  const labelCol = layout === 'wide' ? 17 : 15;
  const gutter = layout === 'wide' ? 3 : 2.5;
  // The grid spans exactly from the day-label column to the right padding.
  const pitch = (innerW - pad * 2 - labelCol + gutter) / weeks;
  return { pad, cell: pitch - gutter, pitch, weeks, labelCol };
}

/** Vertical rhythm of the heatmap panel (offsets from the panel top). */
function heatmapRows(g: HeatmapGeom) {
  const title = g.pad + 21;
  const subtitle = title + 22;
  const months = subtitle + 30;
  const grid = months + 9;
  const gridH = 7 * g.pitch - (g.pitch - g.cell);
  return { title, subtitle, months, grid, gridH, height: Math.round(grid + gridH + g.pad + 1) };
}

function heatmapHeight(g: HeatmapGeom): number {
  return heatmapRows(g).height;
}

function drawHeatmap(d: GlassDoc, p: Box, g: HeatmapGeom, s: Stats, layout: Layout): void {
  const t = d.t;
  const r = ramp(d);
  const left = p.x + g.pad;
  const right = p.x + p.w - g.pad;
  const innerW = right - left;

  // Header
  const rows = heatmapRows(g);
  const titleY = p.y + rows.title;
  d.text({ x: left, y: titleY, text: 'Activity', style: 'title', container: p, maxWidth: innerW * 0.5 });
  const lastWeekStart = s.lastMs - weekday(s.lastMs) * DAY_MS;
  const gridStartMs = layout === 'wide' ? s.firstMs - weekday(s.firstMs) * DAY_MS : lastWeekStart - (g.weeks - 1) * 7 * DAY_MS;
  const shownFirst = Math.max(gridStartMs, s.firstMs);
  const range = `${shortDate(shownFirst, layout === 'wide')} – ${shortDate(s.lastMs)}`;
  const subtitle = layout === 'wide' ? `Contributions · ${range}` : `Last 6 months · ${range}`;
  d.text({ x: left, y: p.y + rows.subtitle, text: subtitle, style: 'callout', color: t.textSecondary, container: p, maxWidth: innerW * 0.75, overflow: 'ellipsis' });

  // Legend: Less ▢▢▢▢▢ More, right-aligned on the title line.
  const lc = Math.min(g.cell, 11);
  const lGap = 3;
  const moreW = d.measure({ text: 'More', style: 'caption' });
  const lessW = d.measure({ text: 'Less', style: 'caption' });
  const squaresW = 5 * lc + 4 * lGap;
  const legendY = titleY - 8.5; // vertical centre of the title's cap height
  let lx = right - moreW;
  d.text({ x: lx, y: legendY + 4.3, text: 'More', style: 'caption', color: t.textTertiary, container: p, maxWidth: moreW + 1 });
  lx -= 7 + squaresW;
  const legendFills = [r.empty, ...r.steps];
  legendFills.forEach(([c, o], i) => d.add(rrect(lx + i * (lc + lGap), legendY - lc / 2, lc, lc, lc * 0.3, c, o)));
  lx -= 7 + lessW;
  d.text({ x: lx, y: legendY + 4.3, text: 'Less', style: 'caption', color: t.textTertiary, container: p, maxWidth: lessW + 1 });

  // Grid geometry
  const gridX = left + g.labelCol;
  const monthY = p.y + rows.months;
  const gridY = p.y + rows.grid;
  const byMs = new Map(s.days.map((c) => [c.ms, c]));
  const cr = Math.max(2, g.cell * 0.28);

  // Month labels at the column that contains the 1st of each month.
  const labels: Array<{ x: number; text: string }> = [];
  let prevMonth = -1;
  for (let w = 0; w < g.weeks; w++) {
    const sat = new Date(gridStartMs + (w * 7 + 6) * DAY_MS);
    const m = sat.getUTCMonth();
    if (m !== prevMonth) {
      // Skip a leading partial month when its column would be too short to label.
      labels.push({ x: gridX + w * g.pitch, text: MONTHS[m] });
      prevMonth = m;
    }
  }
  const gridRight = gridX + (g.weeks - 1) * g.pitch + g.cell;
  const kept: typeof labels = [];
  for (let i = 0; i < labels.length; i++) {
    const L = labels[i];
    const wL = d.measure({ text: L.text, style: 'caption' });
    const next = labels[i + 1];
    if (next && L.x + wL + 10 > next.x) continue; // collides with the next month: drop the earlier one
    if (L.x + wL > gridRight + 1) continue; // would hang past the grid
    kept.push(L);
  }
  for (const L of kept) {
    d.text({ x: L.x, y: monthY, text: L.text, style: 'caption', color: t.textTertiary, container: p, maxWidth: 40 });
  }

  // Day labels (M / W / F), vertically centred on their rows.
  for (const [row, letter] of [
    [1, 'M'],
    [3, 'W'],
    [5, 'F'],
  ] as const) {
    d.text({ x: left, y: gridY + row * g.pitch + g.cell / 2 + 4.3, text: letter, style: 'caption', color: t.textTertiary, container: p, maxWidth: g.labelCol });
  }

  // Cells: one shared rounded square (<use>), grouped by intensity level to keep the file small.
  const cellId = d.id('hc');
  d.addDef(`<rect id="${cellId}" width="${fmt(g.cell)}" height="${fmt(g.cell)}" rx="${fmt(cr)}"/>`);
  const byLevel: string[][] = [[], [], [], [], []];
  for (let w = 0; w < g.weeks; w++) {
    for (let dow = 0; dow < 7; dow++) {
      const ms = gridStartMs + (w * 7 + dow) * DAY_MS;
      const c = byMs.get(ms);
      if (!c) continue; // outside the 365-day window: leave the slot empty
      byLevel[c.level].push(`<use href="#${cellId}" x="${fmt(gridX + w * g.pitch)}" y="${fmt(gridY + dow * g.pitch)}"/>`);
    }
  }
  byLevel.forEach((uses, level) => {
    if (!uses.length) return;
    const [fill, op] = level === 0 ? r.empty : r.steps[level - 1];
    d.add(`<g fill="${fill}" fill-opacity="${fmt(op)}">${uses.join('')}</g>`);
  });
}

function rhythmHeight(layout: Layout): number {
  return layout === 'wide' ? 214 : 192;
}

function drawRhythm(d: GlassDoc, p: Box, s: Stats, layout: Layout): void {
  const t = d.t;
  const pad = layout === 'wide' ? 20 : 16;
  const left = p.x + pad;
  const right = p.x + p.w - pad;
  const innerW = right - left;
  const green = d.accent('green');

  const titleY = p.y + pad + 15;
  d.text({ x: left, y: titleY, text: 'Weekly rhythm', style: 'headline', container: p, maxWidth: innerW });
  d.text({
    x: left,
    y: titleY + 20,
    text: `${WEEKDAYS_LONG[s.peakWeekday]} are busiest`,
    style: 'callout',
    color: t.textSecondary,
    container: p,
    maxWidth: innerW,
    overflow: 'ellipsis',
  });

  // Key for the dashed average guide, right-aligned on the title line.
  const keyW = d.measure({ text: 'Average', style: 'caption' });
  const keyX = right - keyW;
  d.text({ x: keyX, y: titleY - 1, text: 'Average', style: 'caption', color: t.textTertiary, container: p, maxWidth: keyW + 1 });
  d.add(
    `<line x1="${fmt(keyX - 22)}" y1="${fmt(titleY - 5)}" x2="${fmt(keyX - 6)}" y2="${fmt(titleY - 5)}" stroke="${t.text}" stroke-opacity="${d.mode === 'dark' ? 0.45 : 0.4}" stroke-width="1.2" stroke-dasharray="2 3"/>`
  );

  const labelY = p.y + p.h - pad;
  const baseY = labelY - 20;
  const topY = titleY + 20 + 34; // room for the peak value label
  const maxH = baseY - topY;
  const max = Math.max(1, ...s.weekdayTotals);
  const colW = innerW / 7;
  const barW = Math.min(30, Math.round(colW * 0.52));
  const dark = d.mode === 'dark';

  // Average guide (dashed), like Screen Time's weekly chart.
  const avg = s.weekdayTotals.reduce((a, b) => a + b, 0) / 7;
  const avgY = baseY - (avg / max) * maxH;

  d.separator(left, baseY + 0.5, right, baseY + 0.5);
  for (let i = 0; i < 7; i++) {
    const v = s.weekdayTotals[i];
    const h = Math.max(4, (v / max) * maxH);
    const cx = left + colW * (i + 0.5);
    const x = cx - barW / 2;
    const peak = i === s.peakWeekday;
    d.add(bar(x, baseY - h, barW, h, Math.min(7, barW / 2), peak ? green : t.fill, peak ? 1 : dark ? 0.2 : 0.14));
    d.text({
      x: cx,
      y: labelY,
      text: WEEKDAYS[i],
      style: 'caption',
      weight: peak ? 600 : 500,
      color: peak ? t.text : t.textTertiary,
      anchor: 'middle',
      container: p,
      maxWidth: colW,
    });
    if (peak) {
      d.text({
        x: cx,
        y: baseY - h - 8,
        text: formatNumber(v),
        style: 'caption',
        weight: 600,
        tabular: true,
        color: t.text,
        anchor: 'middle',
        container: p,
        maxWidth: colW * 1.6,
        overflow: 'shrink',
      });
    }
  }
  d.add(
    `<line x1="${fmt(left)}" y1="${fmt(avgY)}" x2="${fmt(right)}" y2="${fmt(avgY)}" stroke="${t.text}" stroke-opacity="${dark ? 0.32 : 0.28}" stroke-width="1" stroke-dasharray="2 3"/>`
  );
}

interface TileSpec {
  glyph: GlyphName;
  label: string;
  detail: string;
  value: string;
}

function drawTile(d: GlassDoc, p: Box, spec: TileSpec, layout: Layout): void {
  const t = d.t;
  const pad = layout === 'wide' ? 16 : 16;
  const iconSize = 32;
  const cy = p.y + p.h / 2;
  glyphTile(d, spec.glyph, { x: p.x + pad, y: cy - iconSize / 2, tile: iconSize });
  const valueW = d.measure({ text: spec.value, style: 'numberSmall', tabular: true });
  const right = p.x + p.w - pad;
  d.text({ x: right, y: cy + 8, text: spec.value, style: 'numberSmall', tabular: true, anchor: 'end', container: p, maxWidth: p.w * 0.45 });
  const tx = p.x + pad + iconSize + 12;
  const tw = right - valueW - 12 - tx;
  d.text({ x: tx, y: cy - 3, text: spec.label, size: 14, weight: 600, cut: 'text', ls: -0.1, container: p, maxWidth: tw, overflow: 'ellipsis' });
  d.text({ x: tx, y: cy + 14, text: spec.detail, style: 'caption', color: t.textTertiary, container: p, maxWidth: tw, overflow: 'ellipsis' });
}

function tiles(s: Stats): TileSpec[] {
  return [
    { glyph: 'calendar', label: 'Busiest month', detail: s.busiestMonth.label, value: formatNumber(s.busiestMonth.count) },
    { glyph: 'star', label: 'Best day', detail: shortDate(s.bestDay.ms), value: formatNumber(s.bestDay.count) },
    { glyph: 'chart', label: 'Daily average', detail: 'per active day', value: s.avgPerActiveDay.toFixed(1) },
  ];
}

// ── Render ──────────────────────────────────────────────────────────────────────

export function renderActivitySVG(options: ActivityOptions = {}): string {
  const mode: Mode = options.mode ?? 'dark';
  const layout: Layout = options.layout ?? 'wide';
  const s = computeStats(loadCalendar(options));
  const W = WIDTH[layout];
  const pad = PAD[layout];
  const gap = GAP[layout];
  const innerW = W - pad * 2;

  const g = heatmapGeom(layout, innerW);
  const hmH = heatmapHeight(g);
  const tileSpecs = tiles(s);

  let H: number;
  let rhythmBox: Box;
  let tileBoxes: Box[];
  if (layout === 'wide') {
    const rowY = pad + hmH + gap;
    const rowH = rhythmHeight(layout);
    const rhythmW = Math.round(innerW * 0.58);
    rhythmBox = { x: pad, y: rowY, w: rhythmW, h: rowH };
    const tx = pad + rhythmW + gap;
    const tw = innerW - rhythmW - gap;
    const th = (rowH - gap * 2) / 3;
    tileBoxes = tileSpecs.map((_, i) => ({ x: tx, y: rowY + i * (th + gap), w: tw, h: th }));
    H = rowY + rowH + pad;
  } else {
    const rY = pad + hmH + gap;
    const rH = rhythmHeight(layout);
    rhythmBox = { x: pad, y: rY, w: innerW, h: rH };
    const th = 62;
    let y = rY + rH + gap;
    tileBoxes = tileSpecs.map(() => {
      const b = { x: pad, y, w: innerW, h: th };
      y += th + gap;
      return b;
    });
    H = y - gap + pad;
  }

  const peak = WEEKDAYS_LONG[s.peakWeekday];
  const d = new GlassDoc({
    width: W,
    height: H,
    mode,
    title: 'Activity',
    desc: `Contribution heatmap (${layout === 'wide' ? 'last 12 months' : 'last 6 months'}), weekly rhythm (${peak} busiest) and highlights: busiest month ${s.busiestMonth.label} (${s.busiestMonth.count}), best day ${shortDate(s.bestDay.ms)} (${s.bestDay.count}), ${s.avgPerActiveDay.toFixed(1)} per active day.`,
    seed: `activity-${layout}`,
  });

  const hm = d.panel({ x: pad, y: pad, w: innerW, h: hmH, strong: true });
  drawHeatmap(d, hm, g, s, layout);
  const rp = d.panel(rhythmBox);
  drawRhythm(d, rp, s, layout);
  tileBoxes.forEach((b, i) => drawTile(d, d.panel(b), tileSpecs[i], layout));
  return d.render();
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  for (const layout of ['wide', 'compact'] as const) {
    for (const mode of ['dark', 'light'] as const) {
      const name = `activity-${layout === 'compact' ? 'compact-' : ''}${mode}.svg`;
      const svg = renderActivitySVG({ mode, layout });
      fs.writeFileSync(path.join(ASSETS_DIR, name), svg, 'utf8');
      console.log(`✔ Generated assets/${name} (${(svg.length / 1024).toFixed(1)} KB, ${svg.match(/<svg[^>]*height="(\d+)"/)?.[1]}px)`);
    }
  }
}
