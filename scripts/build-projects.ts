/**
 * Selected Work — Liquid Glass project showcase cards.
 *
 * One SVG per project: a glass macOS "app window" (toolbar with traffic lights + URL capsule, the
 * product screenshot inset with a rounded clip) floating on an accent-tinted wallpaper, and an info
 * glass panel (index badge, name, tagline, stat tiles, tech capsules).
 *
 * Screenshots are committed, pre-resized inputs in data/shots/ (<slug>.webp for wide at ~2x,
 * <slug>-compact.webp for compact) and are base64-embedded so the card renders inside GitHub's <img>.
 * Project facts are copied (tightened, never invented) from the portfolio's content/projects.json so the
 * build has no dependency on the portfolio folder.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, WIDTH, PAD, GAP, fmt, type Box, type Layout, type Mode, type Orb } from './glass/index.ts';

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
  /** Badge gradient (top → bottom) and the numeral colour on it. */
  badge: [string, string];
  badgeText: string;
  /** Panel wash per mode. */
  wash: Record<Mode, string>;
  /** Wallpaper orb colours per mode; the first is the dominant hue. */
  orbs: Record<Mode, [string, string, string, string]>;
}

interface Project {
  title: string;
  tagline: string;
  /** One-sentence description (for <desc> and the README). */
  description: string;
  /** Shown in the URL capsule; null → native app window title instead. */
  domain: string | null;
  stats: [Stat, Stat, Stat];
  /** In priority order; the layout shows as many as fit (3–5 wide, 2–4 compact). */
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
      badge: ['#5AAEFF', '#0A60EE'],
      badgeText: '#FFFFFF',
      wash: { dark: '#0A84FF', light: '#007AFF' },
      orbs: {
        dark: ['#0A5CFF', '#3B2FD0', '#0FA3B8', '#5E5CE6'],
        light: ['#93C5FD', '#A5B4FC', '#A5F3FC', '#BFDBFE'],
      },
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
      badge: ['#FFDA55', '#F0A30A'],
      badgeText: '#1D1D1F',
      wash: { dark: '#FFB800', light: '#F2A900' },
      orbs: {
        dark: ['#F5A300', '#FF5E1A', '#B0123F', '#4A1FB0'],
        light: ['#FDE68A', '#FED7AA', '#FCD34D', '#FBCFE8'],
      },
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
      badge: ['#CB86FF', '#8B3FE0'],
      badgeText: '#FFFFFF',
      wash: { dark: '#BF5AF2', light: '#AF52DE' },
      orbs: {
        dark: ['#8E3FD9', '#4B2FD0', '#C2367A', '#0A5CFF'],
        light: ['#D8B4FE', '#C4B5FD', '#F9A8D4', '#A5B4FC'],
      },
    },
  },
  servx: {
    title: 'ServX',
    tagline: 'Infrastructure Command Center',
    description:
      'An infrastructure monitoring and incident-response suite (web app, CLI, and React SDK) for deployment monitoring, incident detection, and real-time telemetry.',
    domain: 'servx.vercel.app',
    stats: [
      { value: 'Web + CLI + SDK', label: 'Product suite' },
      { value: 'SSE & WebSockets', label: 'Real-time telemetry' },
      { value: '92%', label: 'Attack Paths contribution' },
    ],
    tech: ['Next.js', 'Node.js', 'MongoDB', 'Redis', 'Socket.io'],
    identity: {
      badge: ['#34D6AE', '#0B8A74'],
      badgeText: '#FFFFFF',
      wash: { dark: '#30D1A8', light: '#0FA58A' },
      orbs: {
        dark: ['#0E9F86', '#0FA3B8', '#0A5CFF', '#17B26A'],
        light: ['#99F6E4', '#A7F3D0', '#93C5FD', '#BAE6FD'],
      },
    },
  },
};

// ── Assets ────────────────────────────────────────────────────────────────────

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
  /** Info panel. */
  infoPad: number;
  badge: number;
  badgeR: number;
  badgeText: number;
}

const GEO: Record<Layout, Geometry> = {
  wide: {
    pad: PAD.wide,
    gap: GAP.wide,
    toolbar: 42,
    inset: 8,
    winR: 22,
    lightR: 6,
    lightGap: 20,
    lightX: 22,
    capsuleH: 26,
    capsuleMinW: 300,
    capsuleText: 13,
    infoPad: 22,
    badge: 48,
    badgeR: 13,
    badgeText: 19,
  },
  compact: {
    pad: PAD.compact,
    gap: GAP.compact,
    toolbar: 34,
    inset: 6,
    winR: 18,
    lightR: 5,
    lightGap: 16,
    lightX: 17,
    capsuleH: 22,
    capsuleMinW: 168,
    capsuleText: 12,
    infoPad: 18,
    badge: 44,
    badgeR: 12,
    badgeText: 17,
  },
};

const PILL_H = 26;
const PILL_GAP = 6;
const PILL_PADX = 11;

function pillWidth(d: GlassDoc, text: string): number {
  return Math.ceil(d.measure({ text, size: 12, weight: 600, cut: 'text', ls: 0 }) + PILL_PADX * 2);
}

/** Pick tech pills in priority order while they fit in maxWidth. */
function fitPills(d: GlassDoc, tech: string[], maxWidth: number, max: number): { items: string[]; width: number } {
  const items: string[] = [];
  let width = 0;
  for (const t of tech) {
    if (items.length >= max) break;
    const w = pillWidth(d, t);
    const next = items.length ? width + PILL_GAP + w : w;
    if (next > maxWidth) break;
    items.push(t);
    width = next;
  }
  return { items, width };
}

// ── Pieces ────────────────────────────────────────────────────────────────────

function wallpaper(slug: ProjectSlug, mode: Mode, W: number, H: number): Orb[] {
  const [a, b, c, e] = PROJECTS[slug].identity.orbs[mode];
  const s = Math.max(W, H);
  return [
    { cx: W * 0.06, cy: H * 0.08, r: s * 0.46, color: a },
    { cx: W * 0.96, cy: H * 0.2, r: s * 0.4, color: b },
    { cx: W * 0.55, cy: H * 0.5, r: s * 0.26, color: e, opacity: mode === 'dark' ? 0.4 : 0.6 },
    { cx: W * 0.1, cy: H * 0.94, r: s * 0.42, color: c },
    { cx: W * 0.92, cy: H * 0.96, r: s * 0.44, color: a },
  ];
}

function trafficLights(d: GlassDoc, win: Box, g: Geometry): void {
  const cy = win.y + g.toolbar / 2;
  const colors = ['#FF5F57', '#FEBC2E', '#28C840'];
  const ring = '#000000';
  colors.forEach((c, i) => {
    const cx = win.x + g.lightX + i * g.lightGap;
    d.add(
      `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${g.lightR}" fill="${c}"/>` +
        `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(g.lightR - 0.35)}" fill="none" stroke="${ring}" stroke-opacity="0.14" stroke-width="0.7"/>`
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
  // 8×10 padlock at scale s, top-left at (x, cy - 5s).
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
function appWindow(d: GlassDoc, slug: ProjectSlug, layout: Layout, x: number, y: number, w: number): Box {
  const g = GEO[layout];
  const p = PROJECTS[slug];
  const shotW = w - g.inset * 2;
  const shotH = Math.round((shotW * 9) / 16);
  const h = g.toolbar + shotH + g.inset;
  const win = d.panel({ x, y, w, h, r: g.winR, wash: p.identity.wash[d.mode], washOpacity: d.mode === 'dark' ? 0.05 : 0.04 });

  trafficLights(d, win, g);
  if (p.domain && layout === 'wide') navChevrons(d, win, g);
  toolbarCenter(d, win, g, p, layout);

  const sx = x + g.inset;
  const sy = y + g.toolbar;
  const r = g.winR - g.inset;
  const clip = d.id('shot');
  d.addDef(`<clipPath id="${clip}"><rect x="${fmt(sx)}" y="${fmt(sy)}" width="${fmt(shotW)}" height="${fmt(shotH)}" rx="${fmt(r)}"/></clipPath>`);
  d.add(
    `<image x="${fmt(sx)}" y="${fmt(sy)}" width="${fmt(shotW)}" height="${fmt(shotH)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clip})" href="${shotDataUri(slug, layout)}"/>`
  );
  const dark = d.mode === 'dark';
  d.add(
    `<rect x="${fmt(sx + 0.5)}" y="${fmt(sy + 0.5)}" width="${fmt(shotW - 1)}" height="${fmt(shotH - 1)}" rx="${fmt(r - 0.5)}" fill="none" ` +
      `stroke="${dark ? '#FFFFFF' : '#0B1020'}" stroke-opacity="${dark ? 0.12 : 0.1}"/>`
  );
  return win;
}

function indexBadge(d: GlassDoc, slug: ProjectSlug, index: number, x: number, y: number, g: Geometry, container: Box): void {
  const { badge, badgeText } = PROJECTS[slug].identity;
  const s = g.badge;
  const grad = d.id('bg');
  const hi = d.id('bh');
  d.addDef(
    `<linearGradient id="${grad}" x1="0" y1="${fmt(y)}" x2="0" y2="${fmt(y + s)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${badge[0]}"/><stop offset="1" stop-color="${badge[1]}"/></linearGradient>` +
      `<linearGradient id="${hi}" x1="0" y1="${fmt(y)}" x2="0" y2="${fmt(y + s)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.08"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.2"/></linearGradient>`
  );
  const shadowOp = d.mode === 'dark' ? 0.4 : 0.22;
  const blur = d.id('bs');
  d.addDef(`<filter id="${blur}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="4"/></filter>`);
  d.add(
    `<rect x="${fmt(x + 3)}" y="${fmt(y + 5)}" width="${fmt(s - 6)}" height="${fmt(s - 4)}" rx="${g.badgeR}" fill="${badge[1]}" fill-opacity="${shadowOp}" filter="url(#${blur})"/>` +
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
    color: badgeText,
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
  const name = d.text({
    x: tx,
    y: y + g.badge / 2 - 2,
    text: p.title,
    style: 'title',
    maxWidth: maxRight - tx,
    container,
  });
  const tag = d.text({
    x: tx,
    y: y + g.badge / 2 + 19,
    text: p.tagline,
    style: 'body',
    color: d.t.textSecondary,
    maxWidth: maxRight - tx,
    container,
  });
  return tx + Math.max(name.width, tag.width);
}

function pillsRow(d: GlassDoc, items: string[], x: number, y: number, container: Box): void {
  let px = x;
  for (const t of items) {
    px += d.pill({ x: px, y, text: t, h: PILL_H, padX: PILL_PADX, container }) + PILL_GAP;
  }
}

function innerFill(d: GlassDoc, x: number, y: number, w: number, h: number, r: number): void {
  const dark = d.mode === 'dark';
  d.add(
    `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="${r}" fill="${d.t.fill}" fill-opacity="${dark ? 0.07 : 0.045}" ` +
      `stroke="${dark ? '#FFFFFF' : '#0B1020'}" stroke-opacity="${dark ? 0.06 : 0.05}"/>`
  );
}

// ── Layouts ───────────────────────────────────────────────────────────────────

function wideHeight(): number {
  const g = GEO.wide;
  const winW = WIDTH.wide - g.pad * 2;
  const shotH = Math.round(((winW - g.inset * 2) * 9) / 16);
  const winH = g.toolbar + shotH + g.inset;
  return g.pad + winH + g.gap + WIDE_INFO_H + g.pad;
}

const TILE_H = 74;
const WIDE_INFO_H = GEO.wide.infoPad * 2 + GEO.wide.badge + 18 + TILE_H;

const ROW_H = 42;
const COMPACT_INFO_H = GEO.compact.infoPad * 2 + GEO.compact.badge + 16 + ROW_H * 3 + 14 + PILL_H;

function compactHeight(): number {
  const g = GEO.compact;
  const winW = WIDTH.compact - g.pad * 2;
  const shotH = Math.round(((winW - g.inset * 2) * 9) / 16);
  const winH = g.toolbar + shotH + g.inset;
  return g.pad + winH + g.gap + COMPACT_INFO_H + g.pad;
}

function renderWide(d: GlassDoc, slug: ProjectSlug, index: number): void {
  const g = GEO.wide;
  const p = PROJECTS[slug];
  const W = WIDTH.wide;
  const win = appWindow(d, slug, 'wide', g.pad, g.pad, W - g.pad * 2);

  const info = d.panel({
    x: g.pad,
    y: win.y + win.h + g.gap,
    w: W - g.pad * 2,
    h: WIDE_INFO_H,
    wash: p.identity.wash[d.mode],
    washOpacity: d.mode === 'dark' ? 0.1 : 0.07,
  });
  const ix = info.x + g.infoPad;
  const iy = info.y + g.infoPad;
  const innerW = info.w - g.infoPad * 2;
  const right = ix + innerW;

  // Row A: identity left, tech capsules right (vertically centred on the badge).
  const textRight = identityBlock(d, slug, index, ix, iy, g, info, right - 200);
  const pills = fitPills(d, p.tech, right - (textRight + 28), 5);
  if (pills.items.length < 3) throw new Error(`[projects] only ${pills.items.length} pills fit for ${slug} (wide)`);
  pillsRow(d, pills.items, right - pills.width, iy + (g.badge - PILL_H) / 2, info);

  // Row B: three stat tiles.
  const ty = iy + g.badge + 18;
  const tGap = 10;
  const tw = (innerW - tGap * 2) / 3;
  p.stats.forEach((s, i) => {
    const tx = ix + i * (tw + tGap);
    innerFill(d, tx, ty, tw, TILE_H, 14);
    d.text({
      x: tx + 16,
      y: ty + 34,
      text: s.value,
      style: 'numberSmall',
      maxWidth: tw - 32,
      overflow: 'shrink',
      minSize: 18,
      container: info,
    });
    d.text({
      x: tx + 16,
      y: ty + 56,
      text: s.label,
      style: 'caption',
      color: d.t.textSecondary,
      maxWidth: tw - 32,
      container: info,
    });
  });
}

function renderCompact(d: GlassDoc, slug: ProjectSlug, index: number): void {
  const g = GEO.compact;
  const p = PROJECTS[slug];
  const W = WIDTH.compact;
  const win = appWindow(d, slug, 'compact', g.pad, g.pad, W - g.pad * 2);

  const info = d.panel({
    x: g.pad,
    y: win.y + win.h + g.gap,
    w: W - g.pad * 2,
    h: COMPACT_INFO_H,
    wash: p.identity.wash[d.mode],
    washOpacity: d.mode === 'dark' ? 0.1 : 0.07,
  });
  const ix = info.x + g.infoPad;
  const iy = info.y + g.infoPad;
  const innerW = info.w - g.infoPad * 2;
  const right = ix + innerW;

  identityBlock(d, slug, index, ix, iy, g, info, right);

  // Stats: an inset grouped list (label left, value right).
  const ly = iy + g.badge + 16;
  innerFill(d, ix, ly, innerW, ROW_H * 3, 14);
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
      y: ry + ROW_H / 2 + 6.5,
      text: s.value,
      size: 18,
      weight: 700,
      cut: 'display',
      ls: -0.3,
      anchor: 'end',
      maxWidth: innerW - 28 - label.width - 16,
      overflow: 'shrink',
      minSize: 15,
      container: info,
    });
  });

  const pills = fitPills(d, p.tech, innerW, 4);
  if (pills.items.length < 2) throw new Error(`[projects] only ${pills.items.length} pills fit for ${slug} (compact)`);
  pillsRow(d, pills.items, ix, ly + ROW_H * 3 + 14, info);
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
  const W = WIDTH[layout];
  const H = layout === 'wide' ? wideHeight() : compactHeight();
  const d = new GlassDoc({
    width: W,
    height: H,
    mode,
    title: `${p.title}: ${p.tagline}`,
    desc: p.description,
    orbs: wallpaper(slug, mode, W, H),
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
        console.log(`✓ assets/${name} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)`);
      }
    }
  }
}
