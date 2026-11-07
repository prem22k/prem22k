/**
 * Hero: the identity block right under the banner, in Liquid Glass.
 *
 *   [ Identity panel: eyebrow, name, tagline, pills ]  [ "Now building" widget ]
 *
 * The widget is styled like a small iOS widget: app-icon squircles with a glyph,
 * title + subtitle rows, and an optional "Latest push" footer from recent activity.
 * Wide (800): side by side. Compact (400): stacked.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, PAD, GAP, WIDTH, fmt, type Box, type Layout, type Mode } from './glass/index.ts';
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

type Glyph = 'wave' | 'tree';

interface Project {
  title: string;
  subtitle: string;
  stack: string;
  glyph: Glyph;
  /** Icon gradient [top, bottom] per mode. */
  colors: Record<Mode, [string, string]>;
}

const PROJECTS: Project[] = [
  {
    title: 'NEXUS',
    subtitle: 'Voice-first desktop companion',
    stack: 'Rust · Tauri',
    glyph: 'wave',
    colors: { dark: ['#8E8CFF', '#5146E5'], light: ['#8583FF', '#4B40DD'] },
  },
  {
    title: 'Mahayuddh',
    subtitle: 'DSA practice arena',
    stack: 'Next.js · Supabase',
    glyph: 'tree',
    colors: { dark: ['#FFB547', '#F2542D'], light: ['#FFAE3D', '#EE4E27'] },
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
  push: boolean;
}

const EVENT_KIND: Record<string, string> = {
  PushEvent: 'Latest push',
  PullRequestEvent: 'Latest PR',
  IssuesEvent: 'Latest issue',
  ReleaseEvent: 'Latest release',
  CreateEvent: 'Latest repo',
  PublicEvent: 'Open-sourced',
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
    push: ev.type === 'PushEvent',
  };
}

// ── Icon helpers ─────────────────────────────────────────────────────────────

/** iOS-style continuous-corner squircle (superellipse, n = 5) as a path. */
function squirclePath(x: number, y: number, size: number): string {
  const n = 5;
  const a = size / 2;
  const cx = x + a;
  const cy = y + a;
  const pts: string[] = [];
  const steps = 72;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const px = cx + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    const py = cy + a * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    pts.push(`${fmt(px)} ${fmt(py)}`);
  }
  return `M${pts.join('L')}Z`;
}

function appIcon(d: GlassDoc, x: number, y: number, size: number, p: Project) {
  const [c0, c1] = p.colors[d.mode];
  const gid = d.id('ic');
  const hid = d.id('ih');
  d.addDef(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient>`);
  d.addDef(
    `<linearGradient id="${hid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.45"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/></linearGradient>`
  );
  const shape = squirclePath(x, y, size);
  d.add(
    `<path d="${squirclePath(x, y + 2, size)}" fill="#000" fill-opacity="${d.mode === 'dark' ? 0.22 : 0.08}"/>` +
      `<path d="${shape}" fill="url(#${gid})"/>` +
      `<path d="${shape}" fill="none" stroke="url(#${hid})" stroke-width="1"/>`
  );
  const cx = x + size / 2;
  const cy = y + size / 2;
  const u = size / 44; // glyphs are drawn on a 44px grid
  if (p.glyph === 'wave') {
    const hs = [8, 16, 24, 14, 20, 9];
    const gapX = 5 * u;
    const startX = cx - ((hs.length - 1) * gapX) / 2;
    const bars = hs
      .map((h, i) => {
        const bx = startX + i * gapX;
        return `<line x1="${fmt(bx)}" y1="${fmt(cy - (h * u) / 2)}" x2="${fmt(bx)}" y2="${fmt(cy + (h * u) / 2)}"/>`;
      })
      .join('');
    d.add(`<g stroke="#fff" stroke-width="${fmt(2.6 * u)}" stroke-linecap="round">${bars}</g>`);
  } else {
    // binary tree: root, two children, two grandchildren on the left branch
    const r = 3 * u;
    const nodes = [
      [cx + 2 * u, cy - 10 * u],
      [cx - 5 * u, cy - 0.5 * u],
      [cx + 9 * u, cy - 0.5 * u],
      [cx - 10.5 * u, cy + 9.5 * u],
      [cx + 0.5 * u, cy + 9.5 * u],
    ];
    const edges = [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
    ];
    const lines = edges
      .map(([a, b]) => `<line x1="${fmt(nodes[a][0])}" y1="${fmt(nodes[a][1])}" x2="${fmt(nodes[b][0])}" y2="${fmt(nodes[b][1])}"/>`)
      .join('');
    d.add(`<g stroke="#fff" stroke-width="${fmt(1.9 * u)}" stroke-linecap="round" stroke-opacity="0.85">${lines}</g>`);
    d.add(nodes.map(([nx, ny]) => `<circle cx="${fmt(nx)}" cy="${fmt(ny)}" r="${fmt(r)}" fill="#fff"/>`).join(''));
  }
}

/** Small status glyph for the footer: arrow up for pushes, a dot for anything else. */
function activityGlyph(d: GlassDoc, cx: number, cy: number, push: boolean) {
  const g = d.accent(push ? 'green' : 'blue');
  if (!push) {
    d.add(
      `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="7" fill="${g}" fill-opacity="${d.mode === 'dark' ? 0.22 : 0.16}"/><circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="2.6" fill="${g}"/>`
    );
    return;
  }
  d.add(
    `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="7" fill="${g}" fill-opacity="${d.mode === 'dark' ? 0.22 : 0.16}"/>` +
      `<path d="M${fmt(cx)} ${fmt(cy + 3.2)}V${fmt(cy - 3.2)}M${fmt(cx - 2.8)} ${fmt(cy - 0.6)}L${fmt(cx)} ${fmt(cy - 3.4)}L${fmt(cx + 2.8)} ${fmt(cy - 0.6)}" stroke="${g}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
  );
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
  px += d.pill({ x: px, y, text: IDENTITY.location, dot: d.accent('green'), container: p, color: d.t.textSecondary }) + 8;
  if (hireable) {
    d.pill({ x: px, y, text: 'Open to roles', tinted: d.accent('blue'), color: d.mode === 'dark' ? '#8EC5FF' : '#0063D1', container: p });
  }
}

const W_PAD = 20;
const ICON = 44;
const ROW_H = 52; // icon height + breathing room for the three text lines
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

  // Header: small accent label like an iOS widget's app name
  d.text({ x, y: y + 12, text: 'Now building', style: 'callout', weight: 600, color: d.mode === 'dark' ? '#A9A7FF' : '#4B40DD', maxWidth: inner, container: p });
  const count = `${PROJECTS.length} projects`;
  d.text({ x: x + inner, y: y + 12, text: count, style: 'caption', anchor: 'end', color: d.t.textTertiary, maxWidth: 90, container: p });
  y += 16 + 18;

  const textX = x + ICON + 14;
  const textW = x + inner - textX;
  PROJECTS.forEach((proj, i) => {
    const iconY = y + (ROW_H - ICON) / 2;
    appIcon(d, x, iconY, ICON, proj);
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
    activityGlyph(d, x + 7, y + 9, latest.push);
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
