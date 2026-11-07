/**
 * Selected Work — Liquid Glass project showcase cards.
 *
 * One SVG per project, on the shared page wallpaper (plus the project's accent orb): a glass macOS
 * "app window" (toolbar with traffic lights + URL capsule, the product screenshot inset with a rounded
 * clip) and a slim info strip (index badge, name, tagline, three inline stats). The tech stack is listed
 * in the README under each card, so the SVG stays short.
 *
 * Screenshots are committed, pre-cropped (2.2:1, top-anchored) and pre-resized inputs in data/shots/
 * (<slug>.webp for wide at ~2x, <slug>-compact.webp for compact), base64-embedded so the card renders
 * inside GitHub's <img>. Project facts are copied (tightened, never invented) from the portfolio's
 * content/projects.json so the build has no dependency on the portfolio folder.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, WIDTH, PAD, GAP, fmt, type Box, type Layout, type Mode } from './glass/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const SHOTS_DIR = path.join(ROOT_DIR, 'data', 'shots');

export const PROJECT_SLUGS = ['zync', 'mahayuddh', 'nexus', 'servx'] as const;
export type ProjectSlug = (typeof PROJECT_SLUGS)[number];

interface Stat {
  value: string;
  label: string;
}

interface Identity {
  /** Badge gradient (top → bottom) per mode; matches the hero's project icons where they overlap. */
  badge: Record<Mode, [string, string]>;
  /** Accent hex per mode: the wallpaper's accent orb and a faint wash on the info strip. */
  accent: Record<Mode, string>;
}

interface Project {
  title: string;
  tagline: string;
  /** One-sentence description (for <desc> and the README). */
  description: string;
  /** Shown in the URL capsule; null → native app window title instead. */
  domain: string | null;
  stats: [Stat, Stat, Stat];
  /** Tech stack for the README (not drawn on the card). */
  tech: string[];
  identity: Identity;
}

export const PROJECTS: Record<ProjectSlug, Project> = {
  zync: {
    title: 'Zync',
    tagline: 'Remote Collaboration',
    description:
      'A collaborative workspace that brings project planning, communication, GitHub activity, notes, tasks, and meetings into one place for distributed teams.',
    domain: 'zync-meet.vercel.app',
    stats: [
      { value: '124+', label: 'API endpoints' },
      { value: '12', label: 'Data collections' },
      { value: '4', label: 'Real-time channels' },
    ],
    tech: ['React', 'Node.js', 'Socket.io', 'MongoDB', 'Redis'],
    identity: {
      badge: { dark: ['#5AAEFF', '#0A60EE'], light: ['#4FA6FF', '#0059E0'] },
      accent: { dark: '#0A84FF', light: '#007AFF' },
    },
  },
  mahayuddh: {
    title: 'Mahayuddh',
    tagline: 'DSA Practice Arena',
    description:
      'A social DSA practice platform built around LeetCode, pairing daily timed battles with squad accountability, approach write-ups, and verified progress.',
    domain: 'mahayuddh.vercel.app',
    stats: [
      { value: '4,000+', label: 'Problem catalog' },
      { value: '324', label: 'Automated tests' },
      { value: 'Every table', label: 'Row-level security' },
    ],
    tech: ['Next.js', 'TypeScript', 'Supabase', 'PostgreSQL', 'Tailwind CSS'],
    identity: {
      badge: { dark: ['#FFB547', '#F2542D'], light: ['#FFAE3D', '#EE4E27'] },
      accent: { dark: '#FF9F0A', light: '#FF9500' },
    },
  },
  nexus: {
    title: 'NEXUS',
    tagline: 'Voice-First Desktop Companion',
    description:
      'A voice-first desktop assistant built in Rust and Tauri that runs code navigation, system automation, and architecture reviews through local speech models.',
    domain: null,
    stats: [
      { value: '8.4 ms', label: 'Inference latency' },
      { value: '251', label: 'Linux port commits' },
      { value: 'Wayland & X11', label: 'Linux runtime' },
    ],
    tech: ['Rust', 'Tauri', 'React', 'TypeScript', 'Python'],
    identity: {
      badge: { dark: ['#8E8CFF', '#5146E5'], light: ['#8583FF', '#4B40DD'] },
      accent: { dark: '#7D7AFF', light: '#5856D6' },
    },
  },
  servx: {
    title: 'ServX',
    tagline: 'Infrastructure Command Center',
    description:
      'An infrastructure monitoring and incident-response suite (web app, CLI, and React SDK) for deployment monitoring, incident detection, and real-time telemetry.',
    domain: 'servx.vercel.app',
    stats: [
      { value: 'Web · CLI · SDK', label: 'Product suite' },
      { value: 'Real-time', label: 'SSE & WebSockets' },
      { value: '92%', label: 'of Attack Paths' },
    ],
    tech: ['Next.js', 'Node.js', 'MongoDB', 'Redis', 'Socket.io'],
    identity: {
      badge: { dark: ['#3FDDB5', '#0B8A74'], light: ['#34D6AE', '#0A8571'] },
      accent: { dark: '#30D1A8', light: '#14B8A6' },
    },
  },
};

// ── Assets ────────────────────────────────────────────────────────────────────

/** Aspect of the committed, pre-cropped screenshots (width / height). */
const SHOT_ASPECT = 2.2;

const shotCache = new Map<string, string>();

function shotDataUri(slug: ProjectSlug, layout: Layout): string {
  const file = path.join(SHOTS_DIR, layout === 'wide' ? `${slug}.webp` : `${slug}-compact.webp`);
  let uri = shotCache.get(file);
  if (!uri) {
    uri = `data:image/webp;base64,${fs.readFileSync(file).toString('base64')}`;
    shotCache.set(file, uri);
  }
  return uri;
}

// ── Geometry ──────────────────────────────────────────────────────────────────

interface Geometry {
  pad: number;
  gap: number;
  /** Window: toolbar height, screenshot inset, corner radius. */
  toolbar: number;
  inset: number;
  winR: number;
  /** Traffic lights. */
  lightR: number;
  lightGap: number;
  lightX: number;
  /** URL capsule. */
  capsuleH: number;
  capsuleMinW: number;
  capsuleText: number;
  /** Info strip. */
  infoPad: number;
  badge: number;
  badgeR: number;
  badgeText: number;
}

const GEO: Record<Layout, Geometry> = {
  wide: {
    pad: PAD.wide,
    gap: GAP.wide,
    toolbar: 36,
    inset: 8,
    winR: 20,
    lightR: 6,
    lightGap: 20,
    lightX: 21,
    capsuleH: 24,
    capsuleMinW: 280,
    capsuleText: 13,
    infoPad: 16,
    badge: 44,
    badgeR: 12,
    badgeText: 17,
  },
  compact: {
    pad: PAD.compact,
    gap: GAP.compact,
    toolbar: 32,
    inset: 6,
    winR: 18,
    lightR: 5,
    lightGap: 16,
    lightX: 17,
    capsuleH: 22,
    capsuleMinW: 168,
    capsuleText: 12,
    infoPad: 16,
    badge: 40,
    badgeR: 11,
    badgeText: 16,
  },
};

/** Compact stat list row height. */
const ROW_H = 36;

function shotHeight(layout: Layout): number {
  const g = GEO[layout];
  return Math.round((WIDTH[layout] - g.pad * 2 - g.inset * 2) / SHOT_ASPECT);
}

function windowHeight(layout: Layout): number {
  const g = GEO[layout];
  return g.toolbar + shotHeight(layout) + g.inset;
}

function infoHeight(layout: Layout): number {
  const g = GEO[layout];
  return layout === 'wide' ? g.infoPad * 2 + g.badge : g.infoPad * 2 + g.badge + 12 + ROW_H * 3;
}

function cardHeight(layout: Layout): number {
  const g = GEO[layout];
  return g.pad + windowHeight(layout) + g.gap + infoHeight(layout) + g.pad;
}

// ── Pieces ────────────────────────────────────────────────────────────────────

function trafficLights(d: GlassDoc, win: Box, g: Geometry): void {
  const cy = win.y + g.toolbar / 2;
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => {
    const cx = win.x + g.lightX + i * g.lightGap;
    d.add(
      `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${g.lightR}" fill="${c}"/>` +
        `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(g.lightR - 0.35)}" fill="none" stroke="#000000" stroke-opacity="0.14" stroke-width="0.7"/>`
    );
  });
}

/** Back/forward chevrons after the traffic lights (browser windows, wide only). */
function navChevrons(d: GlassDoc, win: Box, g: Geometry): void {
  const cy = win.y + g.toolbar / 2;
  const x0 = win.x + g.lightX + 2 * g.lightGap + g.lightR + 24;
  const stroke = d.t.textTertiary;
  const chev = (x: number, dir: 1 | -1, op: number) =>
    `<path d="M${fmt(x + 2.5 * dir)} ${fmt(cy - 5)} L${fmt(x - 2.5 * dir)} ${fmt(cy)} L${fmt(x + 2.5 * dir)} ${fmt(cy + 5)}" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  d.add(chev(x0, 1, 0.9) + chev(x0 + 24, -1, 0.45));
}

function lockGlyph(x: number, cy: number, color: string, s: number): string {
  const top = cy - 5.2 * s;
  const bodyY = top + 4.2 * s;
  return (
    `<path d="M${fmt(x + 1.9 * s)} ${fmt(bodyY)} V${fmt(top + 2.6 * s)} a${fmt(2.1 * s)} ${fmt(2.1 * s)} 0 0 1 ${fmt(4.2 * s)} 0 V${fmt(bodyY)}" stroke="${color}" stroke-width="${fmt(1.2 * s)}" fill="none"/>` +
    `<rect x="${fmt(x)}" y="${fmt(bodyY)}" width="${fmt(8 * s)}" height="${fmt(6.2 * s)}" rx="${fmt(1.6 * s)}" fill="${color}"/>`
  );
}

function toolbarCenter(d: GlassDoc, win: Box, g: Geometry, p: Project, layout: Layout): void {
  const cx = win.x + win.w / 2;
  const cy = win.y + g.toolbar / 2;
  const dark = d.mode === 'dark';
  if (!p.domain) {
    // Native app: window title.
    d.text({
      x: cx,
      y: cy + 4.5,
      text: p.title,
      size: 13,
      weight: 600,
      cut: 'text',
      ls: 0.4,
      anchor: 'middle',
      color: d.t.textSecondary,
      maxWidth: win.w / 2,
      container: win,
    });
    return;
  }
  const size = g.capsuleText;
  const textW = d.measure({ text: p.domain, size, weight: 500, cut: 'text', ls: 0 });
  const lockS = layout === 'wide' ? 1 : 0.9;
  const lockW = 8 * lockS;
  const inner = lockW + 6 + textW;
  const w = Math.max(g.capsuleMinW, Math.ceil(inner + 32));
  const x = cx - w / 2;
  const y = cy - g.capsuleH / 2;
  d.add(
    `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${g.capsuleH}" rx="${g.capsuleH / 2}" ` +
      `fill="${dark ? '#FFFFFF' : '#0B1020'}" fill-opacity="${dark ? 0.08 : 0.05}" ` +
      `stroke="${dark ? '#FFFFFF' : '#0B1020'}" stroke-opacity="${dark ? 0.09 : 0.06}"/>`
  );
  const sx = cx - inner / 2;
  d.add(lockGlyph(sx, cy, d.t.textTertiary, lockS));
  d.text({
    x: sx + lockW + 6,
    y: cy + size * 0.36,
    text: p.domain,
    size,
    weight: 500,
    cut: 'text',
    ls: 0,
    color: d.t.textSecondary,
    maxWidth: w - 24,
    container: win,
  });
}

/** Glass window with toolbar and the inset screenshot. Returns the window box. */
function appWindow(d: GlassDoc, slug: ProjectSlug, layout: Layout): Box {
  const g = GEO[layout];
  const p = PROJECTS[slug];
  const x = g.pad;
  const y = g.pad;
  const w = WIDTH[layout] - g.pad * 2;
  const shotW = w - g.inset * 2;
  const shotH = shotHeight(layout);
  const win = d.panel({ x, y, w, h: windowHeight(layout), r: g.winR });

  trafficLights(d, win, g);
  if (p.domain && layout === 'wide') navChevrons(d, win, g);
  toolbarCenter(d, win, g, p, layout);

  const sx = x + g.inset;
  const sy = y + g.toolbar;
  const r = g.winR - g.inset;
  const clip = d.id('shot');
  d.addDef(`<clipPath id="${clip}"><rect x="${fmt(sx)}" y="${fmt(sy)}" width="${fmt(shotW)}" height="${fmt(shotH)}" rx="${fmt(r)}"/></clipPath>`);
  d.add(
    `<image x="${fmt(sx)}" y="${fmt(sy)}" width="${fmt(shotW)}" height="${fmt(shotH)}" preserveAspectRatio="xMidYMin slice" clip-path="url(#${clip})" href="${shotDataUri(slug, layout)}"/>`
  );
  const dark = d.mode === 'dark';
  d.add(
    `<rect x="${fmt(sx + 0.5)}" y="${fmt(sy + 0.5)}" width="${fmt(shotW - 1)}" height="${fmt(shotH - 1)}" rx="${fmt(r - 0.5)}" fill="none" ` +
      `stroke="${dark ? '#FFFFFF' : '#0B1020'}" stroke-opacity="${dark ? 0.12 : 0.1}"/>`
  );
  return win;
}

function indexBadge(d: GlassDoc, slug: ProjectSlug, index: number, x: number, y: number, g: Geometry, container: Box): void {
  const [c0, c1] = PROJECTS[slug].identity.badge[d.mode];
  const s = g.badge;
  const grad = d.id('bg');
  const hi = d.id('bh');
  const blur = d.id('bs');
  d.addDef(
    `<linearGradient id="${grad}" x1="0" y1="${fmt(y)}" x2="0" y2="${fmt(y + s)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient>` +
      `<linearGradient id="${hi}" x1="0" y1="${fmt(y)}" x2="0" y2="${fmt(y + s)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.06"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.18"/></linearGradient>` +
      `<filter id="${blur}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="4"/></filter>`
  );
  const shadowOp = d.mode === 'dark' ? 0.4 : 0.22;
  d.add(
    `<rect x="${fmt(x + 3)}" y="${fmt(y + 5)}" width="${fmt(s - 6)}" height="${fmt(s - 4)}" rx="${g.badgeR}" fill="${c1}" fill-opacity="${shadowOp}" filter="url(#${blur})"/>` +
      `<rect x="${fmt(x)}" y="${fmt(y)}" width="${s}" height="${s}" rx="${g.badgeR}" fill="url(#${grad})"/>` +
      `<rect x="${fmt(x + 0.6)}" y="${fmt(y + 0.6)}" width="${fmt(s - 1.2)}" height="${fmt(s - 1.2)}" rx="${fmt(g.badgeR - 0.6)}" fill="none" stroke="url(#${hi})" stroke-width="1.2"/>`
  );
  d.text({
    x: x + s / 2,
    y: y + s / 2 + g.badgeText * 0.36,
    text: String(index).padStart(2, '0'),
    size: g.badgeText,
    weight: 700,
    cut: 'display',
    ls: -0.3,
    anchor: 'middle',
    color: '#FFFFFF',
    tabular: true,
    maxWidth: s - 8,
    container,
  });
}

/** Badge + name + tagline. Returns the right edge of the text block. */
function identityBlock(d: GlassDoc, slug: ProjectSlug, index: number, x: number, y: number, g: Geometry, container: Box, maxRight: number): number {
  const p = PROJECTS[slug];
  indexBadge(d, slug, index, x, y, g, container);
  const tx = x + g.badge + 14;
  const name = d.text({ x: tx, y: y + g.badge / 2 - 1, text: p.title, style: 'title', maxWidth: maxRight - tx, container });
  const tag = d.text({
    x: tx,
    y: y + g.badge / 2 + 18,
    text: p.tagline,
    style: 'body',
    color: d.t.textSecondary,
    maxWidth: maxRight - tx,
    container,
  });
  return tx + Math.max(name.width, tag.width);
}

function infoStrip(d: GlassDoc, slug: ProjectSlug, layout: Layout, y: number): Box {
  const g = GEO[layout];
  const p = PROJECTS[slug];
  return d.panel({
    x: g.pad,
    y,
    w: WIDTH[layout] - g.pad * 2,
    h: infoHeight(layout),
    wash: p.identity.accent[d.mode],
    washOpacity: d.mode === 'dark' ? 0.06 : 0.04,
  });
}

// ── Layouts ───────────────────────────────────────────────────────────────────

const STAT_LABEL = { size: 12, weight: 500, cut: 'text', ls: 0.1 } as const;

function renderWide(d: GlassDoc, slug: ProjectSlug, index: number): void {
  const g = GEO.wide;
  const p = PROJECTS[slug];
  const win = appWindow(d, slug, 'wide');
  const info = infoStrip(d, slug, 'wide', win.y + win.h + g.gap);
  const ix = info.x + g.infoPad;
  const iy = info.y + g.infoPad;
  const right = info.x + info.w - g.infoPad;

  // Left: identity. Right: three inline stats separated by hairlines.
  const textRight = identityBlock(d, slug, index, ix, iy, g, info, right - 300);
  const avail = right - (textRight + 28);
  const colGap = 16;
  const measureCols = (size: number) =>
    p.stats.map((s) =>
      Math.ceil(
        Math.max(
          d.measure({ text: s.value, size, weight: 700, cut: 'display', ls: -0.4 }),
          d.measure({ text: s.label, ...STAT_LABEL })
        )
      )
    );
  let valueSize = 20;
  let cols = measureCols(valueSize);
  const total = () => cols.reduce((a, b) => a + b, 0) + colGap * 2 * (cols.length - 1);
  while (total() > avail && valueSize > 16) {
    valueSize -= 1;
    cols = measureCols(valueSize);
  }
  if (total() > avail) throw new Error(`[projects] stats do not fit for ${slug} (wide): ${total()} > ${avail}`);

  let cx = right - total();
  p.stats.forEach((s, i) => {
    if (i > 0) {
      const sepX = cx - colGap;
      d.separator(sepX, iy + 4, sepX, iy + g.badge - 4);
    }
    d.text({ x: cx, y: iy + 19, text: s.value, size: valueSize, weight: 700, cut: 'display', ls: -0.4, maxWidth: cols[i], container: info });
    d.text({ x: cx, y: iy + 39, text: s.label, ...STAT_LABEL, color: d.t.textSecondary, maxWidth: cols[i], container: info });
    cx += cols[i] + colGap * 2;
  });
}

function renderCompact(d: GlassDoc, slug: ProjectSlug, index: number): void {
  const g = GEO.compact;
  const p = PROJECTS[slug];
  const win = appWindow(d, slug, 'compact');
  const info = infoStrip(d, slug, 'compact', win.y + win.h + g.gap);
  const ix = info.x + g.infoPad;
  const iy = info.y + g.infoPad;
  const innerW = info.w - g.infoPad * 2;
  const right = ix + innerW;

  identityBlock(d, slug, index, ix, iy, g, info, right);

  // Stats: an inset grouped list (label left, value right).
  const ly = iy + g.badge + 12;
  const dark = d.mode === 'dark';
  d.add(
    `<rect x="${fmt(ix)}" y="${fmt(ly)}" width="${fmt(innerW)}" height="${ROW_H * 3}" rx="12" fill="${d.t.fill}" fill-opacity="${dark ? 0.07 : 0.045}" ` +
      `stroke="${dark ? '#FFFFFF' : '#0B1020'}" stroke-opacity="${dark ? 0.06 : 0.05}"/>`
  );
  p.stats.forEach((s, i) => {
    const ry = ly + i * ROW_H;
    if (i > 0) d.separator(ix + 14, ry, right - 14, ry);
    const label = d.text({
      x: ix + 14,
      y: ry + ROW_H / 2 + 4.5,
      text: s.label,
      style: 'callout',
      color: d.t.textSecondary,
      maxWidth: innerW - 28 - 60,
      container: info,
    });
    d.text({
      x: right - 14,
      y: ry + ROW_H / 2 + 6,
      text: s.value,
      size: 17,
      weight: 700,
      cut: 'display',
      ls: -0.3,
      anchor: 'end',
      maxWidth: innerW - 28 - label.width - 16,
      overflow: 'shrink',
      minSize: 14,
      container: info,
    });
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface ProjectCardOptions {
  slug: ProjectSlug;
  mode?: Mode;
  layout?: Layout;
}

export function renderProjectCardSVG({ slug, mode = 'dark', layout = 'wide' }: ProjectCardOptions): string {
  const p = PROJECTS[slug];
  if (!p) throw new Error(`[projects] unknown project slug "${slug}"`);
  const index = PROJECT_SLUGS.indexOf(slug) + 1;
  const d = new GlassDoc({
    width: WIDTH[layout],
    height: cardHeight(layout),
    mode,
    title: `${p.title}: ${p.tagline}`,
    desc: p.description,
    accent: p.identity.accent[mode],
  });
  if (layout === 'wide') renderWide(d, slug, index);
  else renderCompact(d, slug, index);
  return d.render();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  for (const slug of PROJECT_SLUGS) {
    for (const layout of ['wide', 'compact'] as const) {
      for (const mode of ['dark', 'light'] as const) {
        const name = layout === 'wide' ? `project-${slug}-${mode}.svg` : `project-${slug}-compact-${mode}.svg`;
        const svg = renderProjectCardSVG({ slug, mode, layout });
        fs.writeFileSync(path.join(ASSETS_DIR, name), svg);
        console.log(`✓ assets/${name} ${WIDTH[layout]}×${cardHeight(layout)} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)`);
      }
    }
  }
}
