/**
 * "At a glance": GitHub year in review as a Liquid Glass widget sheet.
 *
 * One frosted sheet with a header and a grid of widget tiles:
 *   - Contributions (last 12 months) with a monthly bar strip
 *   - Active days as an Activity-style ring (last 365 calendar days)
 *   - Current / longest streak, authored repos, total stars, languages
 *
 * Wide (800): two rows on a 5-column grid. Compact (400): stacked mobile layout.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, PAD, WIDTH, RADIUS, fmt, formatNumber, type Box, type Layout, type Mode } from './glass/index.ts';
import type { FetchedProfileData } from './fetch-data.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const PROFILE_JSON_PATH = path.join(ROOT_DIR, 'data/profile.json');

export interface GitHubStatsOptions {
  mode?: Mode;
  layout?: Layout;
  data?: FetchedProfileData;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function loadProfile(data?: FetchedProfileData): FetchedProfileData | null {
  if (data) return data;
  try {
    if (fs.existsSync(PROFILE_JSON_PATH)) return JSON.parse(fs.readFileSync(PROFILE_JSON_PATH, 'utf8'));
  } catch {
    // fall through to defaults
  }
  return null;
}

/** "2026-03-04" → "Mar 4" (UTC, deterministic). */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

interface Stats {
  contributions: number;
  activeDays: number;
  windowDays: number;
  currentStreak: number;
  currentEndsToday: boolean;
  currentStart: string | null;
  longestStreak: number;
  longestStart: string | null;
  longestEnd: string | null;
  longestIsCurrent: boolean;
  months: Array<{ key: string; label: string; count: number }>;
  rangeLabel: string;
  authoredRepos: number;
  publicRepos: number;
  totalStars: number;
  languages: number;
  topLanguage: { name: string; percentage: number } | null;
}

export function computeStats(profile: FetchedProfileData | null): Stats {
  const calendar = [...(profile?.contributions?.calendar ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  // Only the last 365 entries: the API pads the calendar to whole weeks.
  const win = calendar.slice(-365);

  const activeDays = win.filter((d) => d.count > 0).length;

  // Current streak may end today or yesterday (today may simply not have a contribution yet).
  let currentStreak = 0;
  let currentEndsToday = true;
  let currentStart: string | null = null;
  if (win.length) {
    let i = win.length - 1;
    if (win[i].count === 0) {
      currentEndsToday = false;
      i -= 1;
    }
    while (i >= 0 && win[i].count > 0) {
      currentStreak += 1;
      currentStart = win[i].date;
      i -= 1;
    }
  }

  let longestStreak = 0;
  let longestStart: string | null = null;
  let longestEnd: string | null = null;
  let run = 0;
  for (let i = 0; i < win.length; i++) {
    if (win[i].count > 0) {
      run += 1;
      if (run >= longestStreak) {
        // ">=" prefers the most recent run on ties
        longestStreak = run;
        longestStart = win[i - run + 1].date;
        longestEnd = win[i].date;
      }
    } else {
      run = 0;
    }
  }
  const lastDate = win.length ? win[win.length - 1].date : null;
  const longestIsCurrent =
    currentStreak > 0 &&
    longestStreak === currentStreak &&
    !!longestEnd &&
    (longestEnd === lastDate || (!currentEndsToday && win.length > 1 && longestEnd === win[win.length - 2].date));

  // Monthly buckets: the 12 calendar months ending with the latest month in the window.
  const months: Stats['months'] = [];
  if (lastDate) {
    const [ly, lm] = lastDate.split('-').map(Number);
    for (let k = 11; k >= 0; k--) {
      let y = ly;
      let m = lm - k;
      while (m <= 0) {
        m += 12;
        y -= 1;
      }
      const key = `${y}-${String(m).padStart(2, '0')}`;
      months.push({ key, label: MONTHS[m - 1][0], count: 0 });
    }
    const idx = new Map(months.map((mo, i) => [mo.key, i]));
    for (const d of calendar) {
      const i = idx.get(d.date.slice(0, 7));
      if (i !== undefined) months[i].count += d.count;
    }
  }

  const fmtMonthYear = (iso: string) => {
    const [y, m] = iso.split('-').map(Number);
    return `${MONTHS[m - 1]} ${y}`;
  };
  const rangeLabel = win.length ? `${fmtMonthYear(win[0].date)} – ${fmtMonthYear(win[win.length - 1].date)}` : 'Last 12 months';

  const langs = profile?.codebase?.languages ?? [];
  const top = [...langs].sort((a, b) => b.bytes - a.bytes)[0];

  return {
    contributions: profile?.contributions?.last12MonthsContributions ?? win.reduce((a, d) => a + d.count, 0),
    activeDays,
    windowDays: win.length || 365,
    currentStreak,
    currentEndsToday,
    currentStart,
    longestStreak,
    longestStart,
    longestEnd,
    longestIsCurrent,
    months,
    rangeLabel,
    authoredRepos: profile?.overview?.authoredRepos ?? 28,
    publicRepos: profile?.overview?.publicRepos ?? 38,
    totalStars: profile?.overview?.totalStars ?? 0,
    languages: profile?.codebase?.languagesCount ?? langs.length,
    topLanguage: top ? { name: top.name, percentage: top.percentage } : null,
  };
}

// ── Drawing helpers ──────────────────────────────────────────────────────────

function ringColors(mode: Mode): [string, string] {
  return mode === 'dark' ? ['#22C55E', '#B4F25A'] : ['#16A34A', '#65C93A'];
}

/** Activity-style ring: soft track + rounded progress arc starting at 12 o'clock. */
function drawRing(d: GlassDoc, cx: number, cy: number, r: number, stroke: number, progress: number) {
  const [c0, c1] = ringColors(d.mode);
  const gid = d.id('ring');
  d.addDef(
    `<linearGradient id="${gid}" x1="${fmt(cx + r)}" y1="${fmt(cy - r)}" x2="${fmt(cx - r)}" y2="${fmt(cy + r)}" gradientUnits="userSpaceOnUse">` +
      `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c0}"/></linearGradient>`
  );
  // Track: an opaque deep green in dark mode (like Activity), a soft tint in light mode.
  const track = d.mode === 'dark' ? `stroke="#16391F" stroke-opacity="0.9"` : `stroke="${c0}" stroke-opacity="0.15"`;
  d.add(`<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r)}" ${track} stroke-width="${stroke}"/>`);
  const p = Math.max(0, Math.min(0.9999, progress));
  if (p <= 0) return;
  const a0 = -Math.PI / 2;
  const a1 = a0 + p * Math.PI * 2;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = p > 0.5 ? 1 : 0;
  d.add(
    `<path d="M${fmt(x0)} ${fmt(y0)}A${fmt(r)} ${fmt(r)} 0 ${large} 1 ${fmt(x1)} ${fmt(y1)}" stroke="url(#${gid})" stroke-width="${stroke}" stroke-linecap="round"/>`
  );
}

/** Rounded monthly bars with single-letter month labels underneath. */
function drawBars(
  d: GlassDoc,
  box: { x: number; y: number; w: number; h: number },
  months: Stats['months'],
  container: Box
) {
  const n = months.length || 1;
  const labelH = 22;
  const chartH = box.h - labelH;
  const pitch = box.w / n;
  const barW = Math.min(12, Math.max(6, Math.round(pitch * 0.5)));
  const max = Math.max(1, ...months.map((m) => m.count));
  const peak = months.reduce((best, m, i) => (m.count > months[best].count ? i : best), 0);
  const blue = d.accent('blue');
  const teal = d.accent('teal');
  const gid = d.id('bar');
  d.addDef(
    `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${teal}"/><stop offset="1" stop-color="${blue}"/></linearGradient>`
  );
  const baseY = box.y + chartH;
  // faint guide lines (top, middle, base)
  for (const f of [0, 0.5]) {
    const gy = box.y + chartH * f;
    d.add(
      `<line x1="${fmt(box.x)}" y1="${fmt(gy)}" x2="${fmt(box.x + box.w)}" y2="${fmt(gy)}" stroke="${d.t.separator}" stroke-opacity="${fmt(d.t.separatorOpacity * 0.8)}" stroke-dasharray="2 3"/>`
    );
  }
  d.separator(box.x, baseY + 0.5, box.x + box.w, baseY + 0.5);
  months.forEach((m, i) => {
    const cx = box.x + pitch * (i + 0.5);
    const h = m.count > 0 ? Math.max(4, (m.count / max) * (chartH - 2)) : 0;
    if (h > 0) {
      d.add(
        `<rect x="${fmt(cx - barW / 2)}" y="${fmt(baseY - h)}" width="${barW}" height="${fmt(h)}" rx="${fmt(Math.min(barW / 2, h / 2))}" fill="url(#${gid})" fill-opacity="${i === peak ? 1 : 0.78}"/>`
      );
    } else {
      d.add(`<circle cx="${fmt(cx)}" cy="${fmt(baseY - 3)}" r="2" fill="${d.t.fill}" fill-opacity="${fmt(d.t.fillOpacity * 3)}"/>`);
    }
    d.text({
      x: cx,
      y: baseY + 17,
      text: m.label,
      style: 'caption',
      anchor: 'middle',
      color: i === peak ? d.t.textSecondary : d.t.textTertiary,
      weight: i === peak ? 600 : 500,
      maxWidth: pitch + 4,
      container,
    });
  });
}

/** Label / big number (+ unit) / caption stack used by every tile. Returns nothing. */
function statStack(
  d: GlassDoc,
  tile: Box,
  o: {
    x: number;
    top: number;
    width: number;
    label: string;
    value: string;
    unit?: string;
    caption: string;
    captionColor?: string;
  }
) {
  const { x, top, width } = o;
  d.text({ x, y: top + 13, text: o.label, style: 'callout', weight: 600, color: d.t.textSecondary, maxWidth: width, container: tile });
  const num = d.text({ x, y: top + 54, text: o.value, style: 'number', tabular: true, maxWidth: width, overflow: 'shrink', container: tile });
  if (o.unit) {
    d.text({
      x: x + num.width + 5,
      y: top + 54,
      text: o.unit,
      size: 15,
      weight: 600,
      cut: 'text',
      color: d.t.textSecondary,
      maxWidth: Math.max(10, width - num.width - 5),
      overflow: 'ellipsis',
      container: tile,
    });
  }
  d.text({
    x,
    y: top + 75,
    text: o.caption,
    style: 'caption',
    color: o.captionColor ?? d.t.textTertiary,
    maxWidth: width,
    overflow: 'ellipsis',
    container: tile,
  });
}
/** Height of a statStack block from its top (label cap) to the caption descender. */
const STACK_H = 79;

// ── Tiles ────────────────────────────────────────────────────────────────────

function contributionsTile(d: GlassDoc, b: Box, s: Stats, compact: boolean) {
  const tile = d.panel({ ...b, r: RADIUS.inner + 4, strong: true, flat: true });
  const pad = compact ? 12 : 20;
  const peak = s.months.reduce((best, m) => (m.count > best.count ? m : best), s.months[0] ?? { key: '', label: '', count: 0 });
  const busiest = peak && peak.count > 0 ? `Busiest: ${MONTHS_LONG[Number(peak.key.split('-')[1]) - 1]}` : '';
  if (compact) {
    // Mobile: numbers on top, full-width bar strip underneath (Screen Time style).
    const innerW = b.w - pad * 2;
    const top = b.y + pad + 4;
    const busyW = busiest ? d.measure({ text: busiest, style: 'caption', weight: 600 }) : 0;
    statStack(d, tile, {
      x: b.x + pad,
      top,
      width: innerW - busyW - 12,
      label: 'Contributions',
      value: formatNumber(s.contributions),
      caption: 'in the last 12 months',
    });
    if (busiest) {
      d.text({ x: b.x + b.w - pad, y: top + 75, text: busiest, style: 'caption', weight: 600, anchor: 'end', color: d.t.textSecondary, maxWidth: busyW + 1, container: tile });
    }
    const chartY = top + STACK_H + 14;
    drawBars(d, { x: b.x + pad, y: chartY, w: innerW, h: b.y + b.h - pad - chartY + 2 }, s.months, tile);
    return;
  }
  const caption = 'in the last 12 months';
  const leftW = Math.ceil(
    Math.max(
      d.measure({ text: caption, style: 'caption' }),
      d.measure({ text: formatNumber(s.contributions), style: 'number', tabular: true }),
      busiest ? d.measure({ text: busiest, style: 'caption', weight: 600 }) : 0
    )
  );
  const top = b.y + pad + 3;
  statStack(d, tile, {
    x: b.x + pad,
    top,
    width: leftW,
    label: 'Contributions',
    value: formatNumber(s.contributions),
    caption: 'in the last 12 months',
  });
  if (busiest) {
    // aligned with the month-letter baseline of the chart
    d.text({
      x: b.x + pad,
      y: b.y + b.h - pad - 5,
      text: busiest,
      style: 'caption',
      weight: 600,
      color: d.t.textSecondary,
      maxWidth: leftW,
      overflow: 'ellipsis',
      container: tile,
    });
  }
  const chartX = b.x + pad + leftW + 32;
  drawBars(d, { x: chartX, y: b.y + pad + 2, w: b.x + b.w - pad - chartX, h: b.h - pad * 2 + 3 }, s.months, tile);
}

function ringTile(d: GlassDoc, b: Box, s: Stats, compact: boolean) {
  const tile = d.panel({ ...b, r: RADIUS.inner + 4, strong: true, flat: true });
  const pad = compact ? 12 : 20;
  const stroke = 13;
  const diameter = Math.min(b.h - pad * 2, 112);
  const r = (diameter - stroke) / 2;
  const cx = b.x + pad + diameter / 2;
  const cy = b.y + b.h / 2;
  const ratio = s.windowDays ? s.activeDays / s.windowDays : 0;
  drawRing(d, cx, cy, r, stroke, ratio);
  const pct = `${Math.round(ratio * 100)}%`;
  d.text({
    x: cx,
    y: cy + 7,
    text: pct,
    style: 'numberSmall',
    size: 20,
    anchor: 'middle',
    tabular: true,
    maxWidth: (r - stroke / 2) * 2 - 6,
    overflow: 'shrink',
    container: tile,
  });
  const tx = b.x + pad + diameter + (compact ? 20 : 18);
  statStack(d, tile, {
    x: tx,
    top: cy - STACK_H / 2,
    width: b.x + b.w - pad - tx,
    label: 'Active days',
    value: formatNumber(s.activeDays),
    unit: `/ ${s.windowDays}`,
    caption: 'in the past year',
  });
}

function smallTile(
  d: GlassDoc,
  b: Box,
  o: { label: string; value: string; unit?: string; caption: string; compact: boolean }
) {
  const tile = d.panel({ ...b, r: RADIUS.inner + 4, strong: true, flat: true });
  const pad = o.compact ? 12 : 16;
  statStack(d, tile, {
    x: b.x + pad,
    top: b.y + (b.h - STACK_H) / 2,
    width: b.w - pad * 2,
    label: o.label,
    value: o.value,
    unit: o.unit,
    caption: o.caption,
  });
}

function streakTiles(s: Stats) {
  const days = (n: number) => (n === 1 ? 'day' : 'days');
  const current = {
    label: 'Current streak',
    value: String(s.currentStreak),
    unit: days(s.currentStreak),
    caption:
      s.currentStreak === 0 ? 'none right now' : s.currentStart ? `since ${shortDate(s.currentStart)}` : 'through today',
  };
  const longest = {
    label: 'Longest streak',
    value: String(s.longestStreak),
    unit: days(s.longestStreak),
    caption: s.longestIsCurrent && s.longestStart
      ? `${shortDate(s.longestStart)} – ${s.currentEndsToday ? 'today' : 'yesterday'}`
      : s.longestStart && s.longestEnd
        ? `${shortDate(s.longestStart)} – ${shortDate(s.longestEnd)}`
        : 'past 12 months',
  };
  return { current, longest };
}

// ── Render ───────────────────────────────────────────────────────────────────

export function renderGitHubStatsSVG(options: GitHubStatsOptions = {}): string {
  const mode = options.mode ?? 'dark';
  const layout = options.layout ?? 'wide';
  const compact = layout === 'compact';
  const s = computeStats(loadProfile(options.data));
  const W = WIDTH[layout];
  const P = PAD[layout];
  const sheetPad = compact ? 14 : 20;
  const gap = compact ? 10 : 12;
  const headerH = compact ? 58 : 66;

  const { current, longest } = streakTiles(s);
  const langCaption = s.topLanguage
    ? compact
      ? s.topLanguage.name
      : `${s.topLanguage.name} ${Math.round(s.topLanguage.percentage)}%`
    : 'by bytes';

  const innerW = W - P * 2 - sheetPad * 2;
  const row1H = compact ? 216 : 156;
  const ringH = 132;
  const smallH = compact ? 108 : 116;

  let contentH: number;
  if (compact) contentH = row1H + gap + ringH + gap + smallH + gap + smallH;
  else contentH = row1H + gap + smallH;
  const sheetH = headerH + contentH + sheetPad;
  const H = P * 2 + sheetH;

  const d = new GlassDoc({
    width: W,
    height: H,
    mode,
    title: 'At a glance: GitHub, last 12 months',
    desc:
      `${formatNumber(s.contributions)} contributions in the last 12 months; active on ${s.activeDays} of ${s.windowDays} days; ` +
      `current streak ${s.currentStreak} days, longest ${s.longestStreak} days; ${s.authoredRepos} authored of ${s.publicRepos} public repositories; ` +
      `${s.totalStars} stars; ${s.languages} languages.`,
    seed: compact ? 'github-year-compact' : 'github-year',
  });

  const sheet = d.panel({ x: P, y: P, w: W - P * 2, h: sheetH, r: RADIUS.panel + 4 });
  const ix = sheet.x + sheetPad;
  // Header: title left, period right (shared baseline)
  const titleY = sheet.y + (compact ? 38 : 44);
  const rangeW = d.measure({ text: s.rangeLabel, style: 'caption' });
  d.text({ x: ix, y: titleY, text: 'At a glance', style: 'title', maxWidth: innerW - rangeW - 16, container: sheet });
  d.text({
    x: ix + innerW,
    y: titleY,
    text: s.rangeLabel,
    style: 'caption',
    anchor: 'end',
    color: d.t.textTertiary,
    maxWidth: innerW - 150,
    overflow: 'ellipsis',
    container: sheet,
  });

  let y = sheet.y + headerH;
  if (!compact) {
    // 5-column grid: row 1 = contributions (3 cols) + ring (2 cols); row 2 = five small tiles.
    const col = (innerW - gap * 4) / 5;
    const span = (n: number) => col * n + gap * (n - 1);
    contributionsTile(d, { x: ix, y, w: span(3), h: row1H }, s, false);
    ringTile(d, { x: ix + span(3) + gap, y, w: span(2), h: row1H }, s, false);
    y += row1H + gap;
    const tiles = [
      current,
      longest,
      { label: 'Authored repos', value: formatNumber(s.authoredRepos), caption: `of ${s.publicRepos} public` },
      { label: 'Total stars', value: formatNumber(s.totalStars), caption: 'on own repos' },
      { label: 'Languages', value: formatNumber(s.languages), caption: langCaption },
    ];
    tiles.forEach((t, i) => smallTile(d, { x: ix + (col + gap) * i, y, w: col, h: smallH }, { ...t, compact: false }));
  } else {
    contributionsTile(d, { x: ix, y, w: innerW, h: row1H }, s, true);
    y += row1H + gap;
    ringTile(d, { x: ix, y, w: innerW, h: ringH }, s, true);
    y += ringH + gap;
    const half = (innerW - gap) / 2;
    smallTile(d, { x: ix, y, w: half, h: smallH }, { ...current, compact: true });
    smallTile(d, { x: ix + half + gap, y, w: half, h: smallH }, { ...longest, compact: true });
    y += smallH + gap;
    const third = (innerW - gap * 2) / 3;
    const row = [
      { label: 'Authored', value: formatNumber(s.authoredRepos), caption: `of ${s.publicRepos} public` },
      { label: 'Stars', value: formatNumber(s.totalStars), caption: 'on own repos' },
      { label: 'Languages', value: formatNumber(s.languages), caption: langCaption },
    ];
    row.forEach((t, i) => smallTile(d, { x: ix + (third + gap) * i, y, w: third, h: smallH }, { ...t, compact: true }));
  }

  return d.render();
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  for (const layout of ['wide', 'compact'] as const) {
    for (const mode of ['dark', 'light'] as const) {
      const svg = renderGitHubStatsSVG({ mode, layout });
      const name = layout === 'wide' ? `github-year-${mode}.svg` : `github-year-compact-${mode}.svg`;
      fs.writeFileSync(path.join(ASSETS_DIR, name), svg, 'utf8');
      console.log(`✔ Generated assets/${name}`);
    }
  }
}
