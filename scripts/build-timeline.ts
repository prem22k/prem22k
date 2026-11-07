/**
 * Recent activity: the latest public GitHub events as an iOS-style vertical timeline.
 *
 *   renderTimelineSVG({ mode: 'dark', layout: 'wide', data })  → SVG string
 *
 * One panel titled "Recent activity". Each row: a neutral glyph tile by event kind
 * (push ↑, merged PR, created +, open-sourced ✦, released tag, branched), the repository in headline weight
 * with the event verb, the commit message (ellipsized), and the date right-aligned ("Nov 6", UTC).
 * Tiles are joined by a faint spine so the list reads as a timeline.
 *
 * Wide (800): one line of message per row. Compact (400): the message may wrap to two lines.
 * 0 events → one quiet "No recent public activity" row.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, PAD, WIDTH, fmt, wrap, ellipsize, glyphTile, type Box, type GlyphName, type Layout, type Mode } from './glass/index.ts';
import type { FetchedProfileData, RecentActivityEvent } from './fetch-data.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const PROFILE_JSON_PATH = path.join(ROOT_DIR, 'data/profile.json');

export interface TimelineOptions {
  mode?: Mode;
  layout?: Layout;
  data?: Partial<FetchedProfileData> | { recentActivity?: { events?: Partial<RecentActivityEvent>[] } };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_ROWS = 6;

// ── Data ────────────────────────────────────────────────────────────────────────

type Kind = 'push' | 'merge' | 'create' | 'public' | 'release' | 'branch';

interface Row {
  kind: Kind;
  verb: string;
  repo: string;
  message: string;
  /** The source message was already cut short upstream (ended in "..."). */
  cut: boolean;
  date: string;
  ms: number;
}

function loadEvents(opts: TimelineOptions): Partial<RecentActivityEvent>[] {
  const fromData = (opts.data as { recentActivity?: { events?: Partial<RecentActivityEvent>[] } } | undefined)?.recentActivity?.events;
  if (fromData) return fromData;
  try {
    if (fs.existsSync(PROFILE_JSON_PATH)) return JSON.parse(fs.readFileSync(PROFILE_JSON_PATH, 'utf8'))?.recentActivity?.events ?? [];
  } catch {
    // fall through
  }
  return [];
}

function kindOf(ev: Partial<RecentActivityEvent>): Kind {
  const e = (ev.event ?? '').toLowerCase();
  if (e.includes('merged')) return 'merge';
  if (e.includes('open-sourced') || ev.type === 'PublicEvent') return 'public';
  if (e.includes('released') || ev.type === 'ReleaseEvent') return 'release';
  if (e.includes('branched')) return 'branch';
  if (e.includes('created') || ev.type === 'CreateEvent') return 'create';
  return 'push';
}

/** ISO → "Nov 6" (UTC); falls back to the feed's "06 NOV" label. */
function dateLabel(ev: Partial<RecentActivityEvent>): { label: string; ms: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ev.rawDate ?? '');
  if (m) return { label: `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`, ms: Date.parse(ev.rawDate as string) || 0 };
  const f = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(ev.date ?? '');
  if (f) return { label: `${f[2][0].toUpperCase()}${f[2].slice(1, 3).toLowerCase()} ${Number(f[1])}`, ms: 0 };
  return { label: '', ms: 0 };
}

function cleanMessage(raw: string | undefined): { message: string; cut: boolean } {
  let s = (raw ?? '').split('\n')[0].replace(/\s+/g, ' ').trim();
  let cut = false;
  if (/(\.\.\.|…)$/.test(s)) {
    // Cut upstream, often mid-word ("Hitodama compe..."): drop the partial word, re-add one "…".
    const hadSpace = /\s(\.\.\.|…)$/.test(s);
    s = s.replace(/\s*(\.\.\.|…)$/, '').trimEnd();
    if (!hadSpace && s.includes(' ')) s = s.replace(/\s+\S*$/, '');
    s = s.replace(/[\s,;:+&·–-]+$/, '');
    cut = true;
  }
  return { message: s, cut };
}

function toRows(events: Partial<RecentActivityEvent>[]): Row[] {
  return events
    .filter((ev) => ev && (ev.repository || ev.repoFullName))
    .map((ev) => {
      const { label, ms } = dateLabel(ev);
      const { message, cut } = cleanMessage(ev.context);
      const kind = kindOf(ev);
      const repo = ev.repository || (ev.repoFullName ?? '').split('/').pop() || '';
      return { kind, verb: (ev.event || 'pushed').trim(), repo, message, cut, date: label, ms };
    })
    .sort((a, b) => b.ms - a.ms)
    .slice(0, MAX_ROWS);
}

// ── Icon tiles ──────────────────────────────────────────────────────────────────

const KIND_GLYPH: Record<Kind, GlyphName> = {
  push: 'arrowUp',
  merge: 'merge',
  create: 'plus',
  public: 'sparkle',
  release: 'tag',
  branch: 'branch',
};

/** Neutral glyph tile per event kind (the shared icon language; no colour in the timeline). */
function chip(d: GlassDoc, x: number, y: number, size: number, kind: Kind | 'none'): void {
  if (kind === 'none') {
    glyphTile(d, 'calendar', { x, y, tile: size, color: d.t.textTertiary });
    return;
  }
  glyphTile(d, KIND_GLYPH[kind], { x, y, tile: size });
}

// ── Layout ──────────────────────────────────────────────────────────────────────

const REPO = { size: 15, weight: 600, cut: 'text' as const, ls: -0.15 };
const MSG = { size: 14, weight: 400, cut: 'text' as const, ls: 0 };

interface Metrics {
  pad: number;
  chip: number;
  chipGap: number;
  titleY: number;
  listTop: number;
  lineH: number;
  rowGap: number;
  maxLines: number;
}

function metrics(layout: Layout): Metrics {
  return layout === 'wide'
    ? { pad: 20, chip: 32, chipGap: 14, titleY: 41, listTop: 64, lineH: 20, rowGap: 14, maxLines: 1 }
    : { pad: 16, chip: 30, chipGap: 12, titleY: 37, listTop: 58, lineH: 19, rowGap: 14, maxLines: 2 };
}

interface Placed {
  row: Row;
  lines: string[];
  h: number;
}

/** Message lines for a row: wrapped to maxLines, the last one ellipsized (and "…" kept when cut upstream). */
function messageLines(row: Row, width: number, maxLines: number): string[] {
  if (!row.message) return [];
  const tail = row.cut ? '…' : '';
  if (maxLines <= 1) return [ellipsize(row.message + tail, width, MSG)];
  const words = wrap(row.message, width, MSG);
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const last = out.length === maxLines - 1;
    const overflows = ellipsize(words[i], width, MSG) !== words[i]; // one unbreakable word wider than the line
    if (last || overflows) {
      // Everything left goes on this line; ellipsize() adds "…" whenever it does not fit.
      const rest = words.slice(i).join(' ') + tail;
      out.push(ellipsize(rest, width, MSG));
      return out;
    }
    out.push(words[i]);
  }
  if (row.cut) out[out.length - 1] = ellipsize(out[out.length - 1] + tail, width, MSG);
  return out;
}

function rowHeight(lines: number, m: Metrics): number {
  // repo line (cap ≈ 11) + message lines + breathing room; never shorter than the chip.
  if (!lines) return m.chip + 2;
  return Math.max(m.chip + 6, 22 + lines * m.lineH);
}

// ── Render ──────────────────────────────────────────────────────────────────────

export function renderTimelineSVG(options: TimelineOptions = {}): string {
  const mode: Mode = options.mode ?? 'dark';
  const layout: Layout = options.layout ?? 'wide';
  const rows = toRows(loadEvents(options));
  const W = WIDTH[layout];
  const P = PAD[layout];
  const m = metrics(layout);
  const panelW = W - P * 2;
  const textX0 = m.pad + m.chip + m.chipGap; // relative to the panel
  const textW = panelW - m.pad - textX0;

  const placed: Placed[] = rows.map((row) => {
    const lines = messageLines(row, textW, m.maxLines);
    return { row, lines, h: rowHeight(lines.length, m) };
  });
  const listH = placed.length
    ? placed.reduce((s, r) => s + r.h, 0) + m.rowGap * (placed.length - 1)
    : m.chip + 6;
  const panelH = m.listTop + listH + m.pad - 2;
  const H = P * 2 + panelH;

  const newest = rows[0];
  const oldest = rows[rows.length - 1];
  // The span only adds information when the rows cover more than one day.
  const range = rows.length > 1 && newest.date && oldest.date && newest.date !== oldest.date ? `${oldest.date} – ${newest.date}` : '';
  const desc = rows.length
    ? `Recent public GitHub activity: ${rows.map((r) => `${r.verb} ${r.repo}${r.message ? ` (“${r.message}”)` : ''}, ${r.date}`).join('; ')}.`
    : 'Recent public GitHub activity: none in the latest feed.';

  const d = new GlassDoc({ width: W, height: H, mode, title: 'Recent activity', desc, seed: `timeline-${layout}` });
  const t = d.t;
  const p: Box = d.panel({ x: P, y: P, w: panelW, h: panelH, strong: true });
  const left = p.x + m.pad;
  const right = p.x + p.w - m.pad;

  // Header: title left, date range right on the same baseline.
  const titleY = p.y + m.titleY;
  const rangeW = range ? d.measure({ text: range, style: 'caption' }) : 0;
  d.text({ x: left, y: titleY, text: 'Recent activity', style: 'title', container: p, maxWidth: right - left - rangeW - 16 });
  if (range) {
    d.text({ x: right, y: titleY, text: range, style: 'caption', anchor: 'end', color: t.textTertiary, container: p, maxWidth: rangeW + 1 });
  }

  const textX = p.x + textX0;
  let y = p.y + m.listTop;

  if (!placed.length) {
    chip(d, left, y + 3, m.chip, 'none');
    d.text({
      x: textX,
      y: y + 3 + m.chip / 2 + 5,
      text: 'No recent public activity',
      size: 15,
      weight: 500,
      cut: 'text',
      color: t.textSecondary,
      container: p,
      maxWidth: textW,
    });
    return d.render();
  }

  const chipX = left;
  const spineX = chipX + m.chip / 2;
  const chipTops: number[] = [];
  placed.forEach((r) => {
    const { row, lines, h } = r;
    const chipY = y + 1;
    // With a message the repo line sits at the top of the row; alone, it centres on the chip.
    const repoY = lines.length ? y + 15 : chipY + m.chip / 2 + 5.5;
    chipTops.push(chipY);
    chip(d, chipX, chipY, m.chip, row.kind);

    // Date, right-aligned on the repo line.
    const dateW = row.date ? d.measure({ text: row.date, style: 'callout', tabular: true }) : 0;
    if (row.date) {
      d.text({ x: right, y: repoY, text: row.date, style: 'callout', tabular: true, anchor: 'end', color: t.textTertiary, container: p, maxWidth: dateW + 1 });
    }

    // Repo name (headline weight) + verb in tertiary when it fits.
    const lineMax = right - textX - (dateW ? dateW + 14 : 0);
    const verbW = d.measure({ text: row.verb, style: 'callout' });
    const repoFullW = d.measure({ text: row.repo, ...REPO });
    const showVerb = repoFullW + 8 + verbW <= lineMax;
    const repo = d.text({ x: textX, y: repoY, text: row.repo, ...REPO, color: t.text, container: p, maxWidth: lineMax, overflow: 'ellipsis' });
    if (showVerb) {
      d.text({ x: textX + repo.width + 8, y: repoY, text: row.verb, style: 'callout', color: t.textTertiary, container: p, maxWidth: verbW + 1 });
    }

    lines.forEach((line, i) => {
      d.text({
        x: textX,
        y: repoY + m.lineH * (i + 1) + 1,
        text: line,
        ...MSG,
        color: t.textSecondary,
        container: p,
        maxWidth: textW,
        overflow: 'ellipsis',
      });
    });
    y += h + m.rowGap;
  });

  // Spine between consecutive chips (drawn under nothing: chips already sit on the glass).
  const spine: string[] = [];
  for (let i = 0; i < chipTops.length - 1; i++) {
    const y1 = chipTops[i] + m.chip + 5;
    const y2 = chipTops[i + 1] - 5;
    if (y2 - y1 > 2) spine.push(`M${fmt(spineX)} ${fmt(y1)}V${fmt(y2)}`);
  }
  if (spine.length) {
    d.add(`<path d="${spine.join('')}" stroke="${t.fill}" stroke-opacity="${d.mode === 'dark' ? 0.2 : 0.14}" stroke-width="2" stroke-linecap="round"/>`);
  }

  return d.render();
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  for (const layout of ['wide', 'compact'] as const) {
    for (const mode of ['dark', 'light'] as const) {
      const name = `timeline-${layout === 'compact' ? 'compact-' : ''}${mode}.svg`;
      const svg = renderTimelineSVG({ mode, layout });
      fs.writeFileSync(path.join(ASSETS_DIR, name), svg, 'utf8');
      console.log(`✔ Generated assets/${name} (${(svg.length / 1024).toFixed(1)} KB, ${svg.match(/<svg[^>]*height="(\d+)"/)?.[1]}px)`);
    }
  }
}
