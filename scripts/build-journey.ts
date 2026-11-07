/**
 * Journey: Experience and Recognition as two Liquid Glass panels.
 *
 *   renderJourneySVG({ mode: 'dark', layout: 'wide' })  → SVG string
 *
 * Experience: timeline entries (tinted icon tile, role in headline weight, org + dates in secondary,
 * wrapped bullets), the tiles joined by a faint spine. Recognition: a trophy / medal tile, the event in
 * headline weight, the placement as a tinted gold pill next to the year, and one wrapped sentence.
 *
 * Both layouts stack the two panels (side by side left a tall dead block under Recognition and
 * forced short, ragged bullet wraps). Wide (800) uses the width instead: dates right-aligned on the
 * role line, one-line bullets, and the two awards side by side. Compact (400): a plain list.
 *
 * Static content only; every line is measured and wrapped with the embedded font (nothing overflows).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, GAP, PAD, WIDTH, fmt, measure, wrap, type Box, type Layout, type Mode } from './glass/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const METRICS_PATH = path.join(__dirname, 'fonts/metrics.json');

export interface JourneyOptions {
  mode?: Mode;
  layout?: Layout;
}

// ── Content (facts as given; do not embellish) ──────────────────────────────────

/** "C³" needs U+00B3 in the embedded font; fall back to "C3" when the glyph is missing. */
function hasGlyph(ch: string): boolean {
  try {
    const m = JSON.parse(fs.readFileSync(METRICS_PATH, 'utf8'));
    return Object.values(m.cuts as Record<string, Record<string, { advances: Record<string, number> }>>).every((cut) =>
      Object.values(cut).every((w) => ch in w.advances)
    );
  } catch {
    return false;
  }
}
const C3 = hasGlyph('³') ? 'C³' : 'C3';

type Glyph = 'briefcase' | 'cloud' | 'trophy' | 'medal';
type AccentName = 'blue' | 'indigo' | 'teal' | 'yellow' | 'orange';

interface Job {
  role: string;
  org: string;
  dates: string;
  glyph: Glyph;
  accent: AccentName;
  bullets: string[];
}

interface Award {
  event: string;
  placement: string;
  year: string;
  glyph: Glyph;
  accent: AccentName;
  text: string;
}

const EXPERIENCE: Job[] = [
  {
    role: 'Full-Stack Developer Intern',
    org: 'RigorBase',
    dates: 'Mar 2026 – Apr 2026',
    glyph: 'briefcase',
    accent: 'indigo',
    bullets: [
      'Built the closed-beta access system end to end: schema, OAuth 2.0, Redis rate limiting.',
      'Led the frontend migration to the v3 design system.',
      'Shipped learning-metric dashboards and adaptive quiz gamification.',
    ],
  },
  {
    role: 'Technical Head / Lead Developer',
    org: `Cloud Community Club (${C3}) @ SNIST`,
    dates: 'Nov 2024 – Present',
    glyph: 'cloud',
    accent: 'blue',
    bullets: [
      'Architected the club platform serving 1,000+ active campus users (Next.js).',
      'Automated a transactional email service with retry queues and CI/CD.',
    ],
  },
];

const RECOGNITION: Award[] = [
  {
    event: 'Brainrot Hackathon',
    placement: 'Double-Track Winner',
    year: '2025',
    glyph: 'trophy',
    accent: 'yellow',
    text: '1st place in both tracks out of 1,224 entrants, for a full-stack real-time web app.',
  },
  {
    event: 'JNTUH HackFusion-2K26',
    placement: '5th Place Nationally',
    year: '2026',
    glyph: 'medal',
    accent: 'orange',
    text: 'Built and deployed an integrated hardware/software system in 48 hours, out of 230+ teams.',
  },
];

// ── Type & rhythm ───────────────────────────────────────────────────────────────

const HEAD = { size: 17, weight: 600, cut: 'text' as const, ls: -0.2 };
const META = { size: 13, weight: 500, cut: 'text' as const, ls: 0 };
const BODY = { size: 14, weight: 400, cut: 'text' as const, ls: 0 };
const PILL = { size: 12, weight: 600, cut: 'text' as const, ls: 0 };

interface Rhythm {
  pad: number;
  titleY: number;
  listTop: number;
  icon: number;
  iconGap: number;
  bodyLine: number;
  bulletGap: number;
  entryGap: number;
  pillH: number;
}

function rhythm(layout: Layout): Rhythm {
  return layout === 'wide'
    ? { pad: 20, titleY: 41, listTop: 66, icon: 36, iconGap: 14, bodyLine: 20, bulletGap: 4, entryGap: 22, pillH: 24 }
    : { pad: 16, titleY: 37, listTop: 60, icon: 34, iconGap: 12, bodyLine: 20, bulletGap: 4, entryGap: 20, pillH: 24 };
}

const BULLET_INDENT = 14;

// ── Measured layouts ────────────────────────────────────────────────────────────

interface JobLayout {
  job: Job;
  /** Lines under the role (org, maybe dates). */
  meta: string[];
  /** Dates sit right-aligned on the role line (when every entry has room for it). */
  datesRight: boolean;
  bullets: string[][];
  h: number;
}

interface AwardLayout {
  award: Award;
  lines: string[];
  h: number;
}

/** Offsets inside an entry (from its top). */
const ROLE_Y = 15; // headline baseline
const META_STEP = 20; // headline → first meta line
const META_LINE = 18;
const FIRST_BODY = 24; // last header line → first body baseline
const DESCENT = 5;
const DATES_GAP = 20;
const YEAR_GAP = 10;
const COL_GAP = 32;

/**
 * Word-wrap with balanced lines: keep the greedy line count but use the narrowest width that still
 * gives it, so paragraphs don't end in a one-word orphan.
 */
function wrapBalanced(text: string, width: number, opts: typeof BODY): string[] {
  const greedy = wrap(text, width, opts);
  if (greedy.length < 2) return greedy;
  let lo = width * 0.5;
  let hi = width;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (wrap(text, mid, opts).length > greedy.length) lo = mid;
    else hi = mid;
  }
  const lines = wrap(text, hi, opts);
  return lines.every((l) => measure(l, opts) <= width) ? lines : greedy;
}

const datesW = (s: string) => measure(s, { ...META, tabular: true });

function layoutJob(job: Job, textW: number, r: Rhythm, datesRight: boolean): JobLayout {
  let meta: string[];
  if (datesRight) meta = [job.org];
  else {
    const oneLine = `${job.org} · ${job.dates}`;
    meta = measure(oneLine, META) <= textW ? [oneLine] : [job.org, job.dates];
  }
  for (const s of meta) if (measure(s, META) > textW) throw new Error(`[journey] "${s}" does not fit ${textW}px`);
  const bullets = job.bullets.map((b) => wrapBalanced(b, textW - BULLET_INDENT, BODY));
  const lines = bullets.reduce((s, b) => s + b.length, 0);
  const lastHeader = ROLE_Y + META_STEP + (meta.length - 1) * META_LINE;
  const h = lastHeader + FIRST_BODY + (lines - 1) * r.bodyLine + (bullets.length - 1) * r.bulletGap + DESCENT;
  return { job, meta, datesRight, bullets, h };
}

/** Width of an engine pill (padX 11, no dot) for this label. */
function pillW(text: string): number {
  return Math.ceil(measure(text, PILL) + 11 * 2);
}

function awardFits(a: Award, textW: number): boolean {
  return measure(a.event, HEAD) <= textW && pillW(a.placement) + YEAR_GAP + measure(a.year, { ...META, tabular: true }) <= textW;
}

function layoutAward(award: Award, textW: number, r: Rhythm): AwardLayout {
  const lines = wrapBalanced(award.text, textW, BODY);
  // headline → pill row → body
  const pillTop = ROLE_Y + 11;
  const h = pillTop + r.pillH + 21 + (lines.length - 1) * r.bodyLine + DESCENT;
  return { award, lines, h };
}

interface JobsPlan {
  items: JobLayout[];
  h: number;
}

interface AwardsPlan {
  items: AwardLayout[];
  cols: 1 | 2;
  colW: number;
  rowH: number;
  h: number;
}

function planJobs(w: number, r: Rhythm): JobsPlan {
  const textW = w - r.pad * 2 - r.icon - r.iconGap;
  for (const j of EXPERIENCE) if (measure(j.role, HEAD) > textW) throw new Error(`[journey] "${j.role}" does not fit ${textW}px`);
  const datesRight = EXPERIENCE.every((j) => measure(j.role, HEAD) + DATES_GAP + datesW(j.dates) <= textW);
  const items = EXPERIENCE.map((j) => layoutJob(j, textW, r, datesRight));
  const h = r.listTop + items.reduce((s, it) => s + it.h, 0) + r.entryGap * (items.length - 1) + r.pad;
  return { items, h };
}

/** Two columns when both awards fit side by side in at most three body lines; otherwise a list. */
function planAwards(w: number, r: Rhythm): AwardsPlan {
  const inner = w - r.pad * 2;
  const colW2 = (inner - COL_GAP) / 2;
  const textW2 = colW2 - r.icon - r.iconGap;
  if (RECOGNITION.every((a) => awardFits(a, textW2))) {
    const items = RECOGNITION.map((a) => layoutAward(a, textW2, r));
    if (items.every((it) => it.lines.length <= 3)) {
      const rowH = Math.max(...items.map((it) => it.h));
      return { items, cols: 2, colW: colW2, rowH, h: r.listTop + rowH + r.pad };
    }
  }
  const textW = inner - r.icon - r.iconGap;
  for (const a of RECOGNITION) if (!awardFits(a, textW)) throw new Error(`[journey] "${a.event}" does not fit ${textW}px`);
  const items = RECOGNITION.map((a) => layoutAward(a, textW, r));
  const h = r.listTop + items.reduce((s, it) => s + it.h, 0) + r.entryGap * (items.length - 1) + r.pad;
  return { items, cols: 1, colW: inner, rowH: 0, h };
}

// ── Drawing helpers ─────────────────────────────────────────────────────────────

/** Tinted rounded tile with a line glyph on a 30px grid (same recipe as the Activity tiles). */
function iconTile(d: GlassDoc, x: number, y: number, size: number, glyph: Glyph, color: string): void {
  const dark = d.mode === 'dark';
  const hl = d.id('ih');
  d.addDef(
    `<linearGradient id="${hl}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.22 : 0.6}"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/></linearGradient>`
  );
  const rx = size * 0.3;
  d.add(
    `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(size)}" height="${fmt(size)}" rx="${fmt(rx)}" fill="${color}" fill-opacity="${dark ? 0.24 : 0.16}"/>` +
      `<rect x="${fmt(x + 0.5)}" y="${fmt(y + 0.5)}" width="${fmt(size - 1)}" height="${fmt(size - 1)}" rx="${fmt(rx - 0.5)}" fill="none" stroke="url(#${hl})"/>`
  );
  const s = size / 30;
  const g = (inner: string) =>
    d.add(
      `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`
    );
  if (glyph === 'briefcase') {
    g(
      `<rect x="7.5" y="11" width="15" height="10.5" rx="2.4"/>` +
        `<path d="M12 11V9.7C12 9 12.5 8.5 13.2 8.5H16.8C17.5 8.5 18 9 18 9.7V11"/><path d="M7.5 15.6H22.5"/>`
    );
  } else if (glyph === 'cloud') {
    g(
      `<path d="M10.4 20.6H19.9C21.9 20.6 23.5 19 23.5 17C23.5 15.2 22.1 13.7 20.3 13.5C19.8 11 17.6 9.2 15 9.2C12.6 9.2 10.6 10.7 9.9 12.9C7.9 13.2 6.5 14.9 6.5 16.8C6.5 18.9 8.2 20.6 10.4 20.6Z"/>`
    );
  } else if (glyph === 'trophy') {
    g(
      `<path d="M10.6 8.2H19.4V13.4C19.4 15.8 17.4 17.8 15 17.8C12.6 17.8 10.6 15.8 10.6 13.4Z" fill="${color}" fill-opacity="0.9"/>` +
        `<path d="M10.6 10.2H8.4C8.4 12.8 9.3 14.2 11 14.7M19.4 10.2H21.6C21.6 12.8 20.7 14.2 19 14.7"/>` +
        `<path d="M15 17.8V21.2M11.6 21.8H18.4"/>`
    );
  } else {
    g(
      `<path d="M11 7.5L13.4 12.6M19 7.5L16.6 12.6"/>` +
        `<circle cx="15" cy="17.6" r="4.9"/><circle cx="15" cy="17.6" r="2" fill="${color}" stroke="none"/>`
    );
  }
}

/** Text colour for a tinted pill: the accent itself in dark mode, a deeper shade in light mode. */
function pillInk(d: GlassDoc, accent: AccentName): string {
  if (d.mode === 'dark') return d.accent(accent);
  return accent === 'yellow' ? '#8F5F00' : accent === 'orange' ? '#A34E00' : d.accent(accent);
}

function iconColor(d: GlassDoc, accent: AccentName): string {
  if (d.mode === 'dark') return d.accent(accent);
  return accent === 'yellow' ? '#E09A00' : d.accent(accent);
}

function drawTitle(d: GlassDoc, p: Box, r: Rhythm, title: string): void {
  d.text({ x: p.x + r.pad, y: p.y + r.titleY, text: title, style: 'title', container: p, maxWidth: p.w - r.pad * 2 });
}

function drawJobs(d: GlassDoc, p: Box, plan: JobsPlan, r: Rhythm): void {
  const t = d.t;
  drawTitle(d, p, r, 'Experience');
  const ix = p.x + r.pad;
  const tx = ix + r.icon + r.iconGap;
  const textW = p.x + p.w - r.pad - tx;
  let y = p.y + r.listTop;
  const tiles: number[] = [];
  for (const it of plan.items) {
    const { job } = it;
    const iconY = y + ROLE_Y - 13; // tile top aligned just above the headline cap
    tiles.push(iconY);
    iconTile(d, ix, iconY, r.icon, job.glyph, iconColor(d, job.accent));
    d.text({ x: tx, y: y + ROLE_Y, text: job.role, ...HEAD, color: t.text, container: p, maxWidth: textW });
    if (it.datesRight) {
      const dw = datesW(job.dates);
      d.text({ x: tx + textW, y: y + ROLE_Y, text: job.dates, ...META, tabular: true, anchor: 'end', color: t.textTertiary, container: p, maxWidth: dw + 1 });
    }
    let by = y + ROLE_Y + META_STEP;
    it.meta.forEach((line, i) => {
      // Org in secondary, dates in tertiary when they share a line.
      if (i === 0 && it.meta.length === 1 && !it.datesRight) {
        const orgPart = `${job.org} · `;
        const ow = d.text({ x: tx, y: by, text: orgPart, ...META, color: t.textSecondary, container: p, maxWidth: textW }).width;
        d.text({ x: tx + ow, y: by, text: job.dates, ...META, color: t.textTertiary, container: p, maxWidth: textW - ow });
      } else {
        d.text({ x: tx, y: by, text: line, ...META, color: i === 0 ? t.textSecondary : t.textTertiary, container: p, maxWidth: textW });
      }
      if (i < it.meta.length - 1) by += META_LINE;
    });
    by += FIRST_BODY;
    it.bullets.forEach((lines, bi) => {
      d.add(`<circle cx="${fmt(tx + 3)}" cy="${fmt(by - 4.5)}" r="2" fill="${t.textTertiary}"/>`);
      lines.forEach((line, li) => {
        d.text({ x: tx + BULLET_INDENT, y: by, text: line, ...BODY, color: t.textSecondary, container: p, maxWidth: textW - BULLET_INDENT });
        if (li < lines.length - 1) by += r.bodyLine;
      });
      if (bi < it.bullets.length - 1) by += r.bodyLine + r.bulletGap;
    });
    y += it.h + r.entryGap;
  }
  // Spine joining the tiles: the timeline thread.
  const sx = ix + r.icon / 2;
  const segs: string[] = [];
  for (let i = 0; i < tiles.length - 1; i++) {
    const y1 = tiles[i] + r.icon + 6;
    const y2 = tiles[i + 1] - 6;
    if (y2 > y1 + 2) segs.push(`M${fmt(sx)} ${fmt(y1)}V${fmt(y2)}`);
  }
  if (segs.length) {
    d.add(`<path d="${segs.join('')}" stroke="${t.fill}" stroke-opacity="${d.mode === 'dark' ? 0.2 : 0.14}" stroke-width="2" stroke-linecap="round"/>`);
  }
}

function drawAwards(d: GlassDoc, p: Box, plan: AwardsPlan, r: Rhythm): void {
  const t = d.t;
  drawTitle(d, p, r, 'Recognition');
  const top = p.y + r.listTop;
  let y = top;
  plan.items.forEach((it, i) => {
    const { award } = it;
    const ix = p.x + r.pad + (plan.cols === 2 ? i * (plan.colW + COL_GAP) : 0);
    const ey = plan.cols === 2 ? top : y;
    const tx = ix + r.icon + r.iconGap;
    const textW = ix + plan.colW - tx;
    iconTile(d, ix, ey + ROLE_Y - 13, r.icon, award.glyph, iconColor(d, award.accent));
    d.text({ x: tx, y: ey + ROLE_Y, text: award.event, ...HEAD, color: t.text, container: p, maxWidth: textW });
    const pillY = ey + ROLE_Y + 11;
    const pw = d.pill({
      x: tx,
      y: pillY,
      h: r.pillH,
      text: award.placement,
      tinted: iconColor(d, award.accent),
      color: pillInk(d, award.accent),
      size: PILL.size,
      weight: PILL.weight,
      container: p,
    });
    d.text({ x: tx + pw + YEAR_GAP, y: pillY + r.pillH / 2 + 4.6, text: award.year, ...META, color: t.textTertiary, tabular: true, container: p, maxWidth: textW - pw - YEAR_GAP });
    let by = pillY + r.pillH + 21;
    it.lines.forEach((line, li) => {
      d.text({ x: tx, y: by, text: line, ...BODY, color: t.textSecondary, container: p, maxWidth: textW });
      if (li < it.lines.length - 1) by += r.bodyLine;
    });
    if (i < plan.items.length - 1) {
      if (plan.cols === 2) {
        // vertical hairline centred in the column gap
        const sx = ix + plan.colW + COL_GAP / 2;
        d.separator(sx, top - 2, sx, top + plan.rowH + 2);
      } else {
        // hairline between awards, inset to the text column (iOS list style)
        const sepY = ey + it.h + r.entryGap / 2;
        d.separator(tx, sepY, p.x + p.w - r.pad, sepY);
      }
    }
    y += it.h + r.entryGap;
  });
}

// ── Render ──────────────────────────────────────────────────────────────────────

export function renderJourneySVG(options: JourneyOptions = {}): string {
  const mode: Mode = options.mode ?? 'dark';
  const layout: Layout = options.layout ?? 'wide';
  const W = WIDTH[layout];
  const P = PAD[layout];
  const G = GAP[layout];
  const r = rhythm(layout);
  const innerW = W - P * 2;

  // Both layouts stack the panels; wide gains right-aligned dates, one-line bullets and
  // side-by-side awards from the extra width.
  const jobs = planJobs(innerW, r);
  const awards = planAwards(innerW, r);
  const jobBox: Box = { x: P, y: P, w: innerW, h: jobs.h };
  const awardBox: Box = { x: P, y: P + jobs.h + G, w: innerW, h: awards.h };
  const H = awardBox.y + awardBox.h + P;

  const desc =
    'Experience: ' +
    EXPERIENCE.map((j) => `${j.role}, ${j.org} (${j.dates}): ${j.bullets.join(' ')}`).join(' ') +
    ' Recognition: ' +
    RECOGNITION.map((a) => `${a.event}, ${a.placement} (${a.year}): ${a.text}`).join(' ');

  const d = new GlassDoc({ width: W, height: H, mode, title: 'Experience and recognition', desc, seed: `journey-${layout}` });
  drawJobs(d, d.panel({ ...jobBox, strong: true }), jobs, r);
  drawAwards(d, d.panel({ ...awardBox, strong: true }), awards, r);
  return d.render();
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  for (const layout of ['wide', 'compact'] as const) {
    for (const mode of ['dark', 'light'] as const) {
      const name = `journey-${layout === 'compact' ? 'compact-' : ''}${mode}.svg`;
      const svg = renderJourneySVG({ mode, layout });
      fs.writeFileSync(path.join(ASSETS_DIR, name), svg, 'utf8');
      console.log(`✔ Generated assets/${name} (${(svg.length / 1024).toFixed(1)} KB, ${svg.match(/<svg[^>]*height="(\d+)"/)?.[1]}px)`);
    }
  }
}
