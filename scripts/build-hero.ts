/**
 * Hero: the identity block right under the banner, in Liquid Glass.
 *
 *   [ Identity panel: eyebrow, name, tagline, pills ]  [ "Now building" widget ]
 *
 * The widget is styled like a small iOS widget: neutral glyph tiles (the shared icon language),
 * title + subtitle rows, and an optional "Latest push" footer from recent activity.
 * Wide (800): side by side. Compact (400): stacked.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, PAD, GAP, WIDTH, glyph, glyphTile, type Box, type GlyphName, type Layout, type Mode } from './glass/index.ts';
import type { FetchedProfileData, RecentActivityEvent } from './fetch-data.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const PROFILE_JSON_PATH = path.join(ROOT_DIR, 'data/profile.json');

export interface HeroOptions {
  mode?: Mode;
  layout?: Layout;
  data?: FetchedProfileData;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const IDENTITY = {
  eyebrow: 'Full-Stack Engineer',
  name: 'Prem Sai Kota',
  tagline: 'I build real-time, collaborative products and the tooling behind them.',
  location: 'Hyderabad, IN',
};

interface Project {
  title: string;
  subtitle: string;
  stack: string;
  glyph: GlyphName;
}

const PROJECTS: Project[] = [
  {
    title: 'NEXUS',
    subtitle: 'Voice-first desktop companion',
    stack: 'Rust · Tauri',
    glyph: 'waveform',
  },
  {
    title: 'Mahayuddh',
    subtitle: 'DSA practice arena',
    stack: 'Next.js · Supabase',
    glyph: 'tree',
  },
];

function loadProfile(data?: FetchedProfileData): FetchedProfileData | null {
  if (data) return data;
  try {
    if (fs.existsSync(PROFILE_JSON_PATH)) return JSON.parse(fs.readFileSync(PROFILE_JSON_PATH, 'utf8'));
  } catch {
    // fall through
  }
  return null;
}

interface Latest {
  kind: string;
  /** Repository names to try, longest first ("owner/repo", then "repo"). */
  repos: string[];
  date: string;
  glyph: GlyphName;
}

const EVENT_KIND: Record<string, string> = {
  PushEvent: 'Latest push',
  PullRequestEvent: 'Latest PR',
  IssuesEvent: 'Latest issue',
  ReleaseEvent: 'Latest release',
  CreateEvent: 'Latest repo',
  PublicEvent: 'Open-sourced',
};

/** Footer glyph per event type; anything unlisted reads as a push (arrow up). */
const EVENT_GLYPH: Record<string, GlyphName> = {
  PullRequestEvent: 'merge',
  ReleaseEvent: 'tag',
  CreateEvent: 'plus',
  PublicEvent: 'globe',
};

/** "Latest push · Engine-NEXUS/macos" + "Nov 6" from the newest activity event. */
function latestLine(ev?: RecentActivityEvent): Latest | null {
  if (!ev || !(ev.repoFullName || ev.repository)) return null;
  let date = '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ev.rawDate ?? '');
  if (m) date = `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
  return {
    kind: EVENT_KIND[ev.type] ?? 'Latest activity',
    repos: [...new Set([ev.repoFullName, ev.repository].filter(Boolean))],
    date,
    glyph: EVENT_GLYPH[ev.type] ?? 'arrowUp',
  };
}

// ── Layout ───────────────────────────────────────────────────────────────────

interface IdentityLayout {
  lines: string[];
  height: number;
}

const ID_PAD = { wide: 28, compact: 20 } as const;
const TAGLINE = { size: 16, weight: 400, line: 23 };

function identityLayout(d: GlassDoc, width: number, layout: Layout): IdentityLayout {
  const pad = ID_PAD[layout];
  const inner = width - pad * 2;
  // word-wrap the tagline with the real font
  const words = IDENTITY.tagline.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && d.measure({ text: next, size: TAGLINE.size, weight: TAGLINE.weight, cut: 'text' }) > inner) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  // eyebrow(14) → name → tagline → pills(26) with paddings
  const height = pad + 14 + 50 + 26 + (lines.length - 1) * TAGLINE.line + 20 + 26 + pad;
  return { lines, height };
}

function drawIdentity(d: GlassDoc, box: Box, lay: IdentityLayout, layout: Layout, hireable: boolean) {
  const p = d.panel({ ...box, strong: false });
  const pad = ID_PAD[layout];
  const x = p.x + pad;
  const inner = p.w - pad * 2;
  const content = 14 + 50 + 26 + (lay.lines.length - 1) * TAGLINE.line + 20 + 26;
  let y = p.y + (p.h - content) / 2; // centre vertically when the row is taller than needed
  d.text({ x, y: y + 11, text: IDENTITY.eyebrow, style: 'eyebrow', color: d.t.textTertiary, maxWidth: inner, container: p });
  y += 14;
  d.text({ x: x - 1.5, y: y + 44, text: IDENTITY.name, style: 'hero', maxWidth: inner, container: p });
  y += 50;
  lay.lines.forEach((ln, i) => {
    d.text({
      x,
      y: y + 22 + i * TAGLINE.line,
      text: ln,
      size: TAGLINE.size,
      weight: TAGLINE.weight,
      cut: 'text',
      color: d.t.textSecondary,
      maxWidth: inner,
      container: p,
    });
  });
  y += 26 + (lay.lines.length - 1) * TAGLINE.line + 20;
  let px = x;
  // Neutral pills; the only colour is the green "available" dot.
  px += d.pill({ x: px, y, text: IDENTITY.location, container: p, color: d.t.textSecondary }) + 8;
  if (hireable) {
    d.pill({ x: px, y, text: 'Open to roles', dot: d.accent('green'), container: p, color: d.t.textSecondary });
  }
}

const W_PAD = 20;
const TILE = 40; // neutral glyph tile
const ROW_H = 52; // room for the three text lines; the tile is centred on them
const ROW_GAP = 22; // space between rows (separator sits in the middle)

function widgetHeight(latest: boolean): number {
  // header (34) + rows + optional footer
  const rows = PROJECTS.length * ROW_H + (PROJECTS.length - 1) * ROW_GAP;
  return W_PAD + 16 + 18 + rows + (latest ? 20 + 18 : 0) + W_PAD;
}

function drawWidget(d: GlassDoc, box: Box, latest: Latest | null) {
  const p = d.panel({ ...box, strong: false });
  const x = p.x + W_PAD;
  const inner = p.w - W_PAD * 2;
  const content = widgetHeight(!!latest) - W_PAD * 2;
  let y = p.y + (p.h - content) / 2;

  // Header: small neutral label like an iOS widget's app name
  d.text({ x, y: y + 12, text: 'Now building', style: 'callout', weight: 600, color: d.t.textSecondary, maxWidth: inner, container: p });
  const count = `${PROJECTS.length} projects`;
  d.text({ x: x + inner, y: y + 12, text: count, style: 'caption', anchor: 'end', color: d.t.textTertiary, maxWidth: 90, container: p });
  y += 16 + 18;

  const textX = x + TILE + 14;
  const textW = x + inner - textX;
  PROJECTS.forEach((proj, i) => {
    glyphTile(d, proj.glyph, { x, y: y + (ROW_H - TILE) / 2, tile: TILE, size: 24 });
    d.text({ x: textX, y: y + 14, text: proj.title, size: 15, weight: 600, cut: 'text', ls: -0.1, maxWidth: textW, container: p });
    d.text({ x: textX, y: y + 32, text: proj.subtitle, style: 'callout', weight: 400, color: d.t.textSecondary, maxWidth: textW, container: p });
    d.text({ x: textX, y: y + 49, text: proj.stack, style: 'caption', color: d.t.textTertiary, maxWidth: textW, container: p });
    y += ROW_H;
    if (i < PROJECTS.length - 1) {
      d.separator(textX, y + ROW_GAP / 2, x + inner, y + ROW_GAP / 2);
      y += ROW_GAP;
    }
  });

  if (latest) {
    y += 20;
    d.separator(x, y - 10, x + inner, y - 10);
    glyph(d, latest.glyph, { x, y: y + 2, size: 14, weight: 1.5 });
    const dateW = latest.date ? d.measure({ text: latest.date, style: 'caption' }) : 0;
    const maxW = inner - 22 - dateW - 12;
    // Prefer "owner/repo"; fall back to the short repo name before truncating.
    const candidates = latest.repos.map((r) => `${latest.kind} · ${r}`);
    const label = candidates.find((c) => d.measure({ text: c, style: 'caption' }) <= maxW) ?? candidates[candidates.length - 1];
    d.text({ x: x + 22, y: y + 13, text: label, style: 'caption', color: d.t.textSecondary, maxWidth: maxW, overflow: 'ellipsis', container: p });
    if (latest.date) {
      d.text({ x: x + inner, y: y + 13, text: latest.date, style: 'caption', anchor: 'end', color: d.t.textTertiary, maxWidth: dateW + 1, container: p });
    }
  }
}

export function renderHeroSVG(options: HeroOptions = {}): string {
  const mode = options.mode ?? 'dark';
  const layout = options.layout ?? 'wide';
  const profile = loadProfile(options.data);
  const hireable = Boolean(profile?.identity?.hireable);
  const latest = latestLine(profile?.recentActivity?.events?.[0]);

  const W = WIDTH[layout];
  const P = PAD[layout];
  const G = GAP[layout];
  const widgetH = widgetHeight(!!latest);

  // A throwaway doc for measuring before the real height is known.
  const probe = new GlassDoc({ width: W, height: 100, mode, title: 'probe' });

  let H: number;
  let idBox: Box;
  let wBox: Box;
  let idLay: IdentityLayout;
  if (layout === 'wide') {
    const widgetW = 336;
    const idW = W - P * 2 - G - widgetW;
    idLay = identityLayout(probe, idW, layout);
    const rowH = Math.max(idLay.height, widgetH);
    H = P * 2 + rowH;
    idBox = { x: P, y: P, w: idW, h: rowH };
    wBox = { x: P + idW + G, y: P, w: widgetW, h: rowH };
  } else {
    const w = W - P * 2;
    idLay = identityLayout(probe, w, layout);
    H = P * 2 + idLay.height + G + widgetH;
    idBox = { x: P, y: P, w, h: idLay.height };
    wBox = { x: P, y: P + idLay.height + G, w, h: widgetH };
  }

  const d = new GlassDoc({
    width: W,
    height: H,
    mode,
    title: `${IDENTITY.name}, ${IDENTITY.eyebrow}`,
    desc:
      `${IDENTITY.name}, ${IDENTITY.eyebrow}. ${IDENTITY.tagline} Based in ${IDENTITY.location}${hireable ? ', open to roles' : ''}. ` +
      `Now building: ${PROJECTS.map((p) => `${p.title} (${p.subtitle}; ${p.stack})`).join(', ')}.` +
      (latest ? ` ${latest.kind}: ${latest.repos[0]}${latest.date ? `, ${latest.date}` : ''}.` : ''),
    seed: layout === 'wide' ? 'hero' : 'hero-compact',
  });

  drawIdentity(d, idBox, idLay, layout, hireable);
  drawWidget(d, wBox, latest);
  return d.render();
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  for (const layout of ['wide', 'compact'] as const) {
    for (const mode of ['dark', 'light'] as const) {
      const svg = renderHeroSVG({ mode, layout });
      const name = layout === 'wide' ? `hero-${mode}.svg` : `hero-compact-${mode}.svg`;
      fs.writeFileSync(path.join(ASSETS_DIR, name), svg, 'utf8');
      console.log(`✔ Generated assets/${name}`);
    }
  }
}
