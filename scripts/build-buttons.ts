/**
 * Liquid Glass link buttons: one small SVG per link, so the README can wrap each in <a href> and keep
 * it clickable while matching the glass cards.
 *
 * Each button is a 40px capsule holding a tiny copy of the shared wallpaper under a light glass tint,
 * a top sheen and a specular rim, with a hand-drawn stroke icon and a measured label. The width is
 * measured from the label, so buttons line up with consistent height and padding when placed in a row.
 *
 * There are no compact variants: at 40px tall they already fit phones 1:1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, fmt, type Mode } from './glass/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

export type IconName = 'globe' | 'in' | 'x' | 'at' | 'envelope' | 'arrow-up-right' | 'code';

export type ButtonId = 'portfolio' | 'linkedin' | 'x' | 'threads' | 'email' | 'live' | 'source';

export interface ButtonSpec {
  id: ButtonId;
  label: string;
  icon: IconName;
  /** 'social' buttons sit in the contact row; 'project' buttons sit under a project card. */
  group: 'social' | 'project';
  /** Icon after the label (e.g. the ↗ of "Live demo") instead of before it. */
  trailing?: boolean;
  /** Tinted primary style (accent wash, accent label). */
  primary?: boolean;
}

export const BUTTONS: ButtonSpec[] = [
  { id: 'portfolio', label: 'Portfolio', icon: 'globe', group: 'social' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'in', group: 'social' },
  { id: 'x', label: 'X', icon: 'x', group: 'social' },
  { id: 'threads', label: 'Threads', icon: 'at', group: 'social' },
  { id: 'email', label: 'Email', icon: 'envelope', group: 'social' },
  { id: 'live', label: 'Live demo', icon: 'arrow-up-right', group: 'project', trailing: true, primary: true },
  { id: 'source', label: 'Source', icon: 'code', group: 'project' },
];

// ── Geometry ──────────────────────────────────────────────────────────────────

/** Capsule height. */
export const BUTTON_HEIGHT = 40;
const ICON = 16; // drawn icon box (px)
const ICON_GAP = 8; // icon ↔ label
const PAD_ICON_SIDE = 16; // the icon carries visual weight, so its side gets a little less padding
const PAD_TEXT_SIDE = 19;
const LABEL = { size: 14, weight: 600, cut: 'text' as const, ls: -0.1 };
/** Inter cap height (em). Used to centre the label's caps on the capsule's midline. */
const CAP = 0.727;

// ── Icons ─────────────────────────────────────────────────────────────────────
// Drawn on a 24-unit grid as round-capped strokes, scaled to ICON px. All paths are original,
// simple geometry (no brand artwork).

const ICON_PATHS: Record<IconName, string> = {
  // Globe: outline, one meridian ellipse and the equator (latitude lines clog it at 16px).
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  // "in" inside a rounded square.
  in:
    '<rect x="3" y="3" width="18" height="18" rx="4.5"/>' +
    '<path d="M8.25 11v6M12 17v-6M12 13.6c0-1.6 1.1-2.7 2.6-2.7s2.4 1.1 2.4 2.7V17"/>' +
    '<circle cx="8.25" cy="7.9" r="0.6" fill="currentColor"/>',
  // X mark: an open parallelogram for one diagonal, a single stroke for the other.
  x: '<path d="M4.5 4.5h4.2L19.5 19.5h-4.2z"/><path d="M19 4.5 5 19.5"/>',
  // @-style glyph: inner ring, outer ring opened into a tail.
  at:
    '<circle cx="12" cy="12" r="3.6"/>' +
    '<path d="M15.6 9v4.4a2.4 2.4 0 0 0 4.8 0V12a8.4 8.4 0 1 0-3.3 6.7"/>',
  // Envelope with a V flap.
  envelope: '<rect x="3" y="5.5" width="18" height="13" rx="2.6"/><path d="m3.8 7.3 8.2 6 8.2-6"/>',
  // ↗
  'arrow-up-right': '<path d="M7 17 17 7M9 7h8v8"/>',
  // </>
  code: '<path d="M8 7.5 3.5 12 8 16.5M16 7.5l4.5 4.5L16 16.5M13.6 5.5l-3.2 13"/>',
};

function iconSVG(name: IconName, x: number, y: number, size: number, color: string, strokeWidth: number): string {
  const s = size / 24;
  return (
    `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})" color="${color}" stroke="${color}" ` +
    `stroke-width="${fmt(strokeWidth / s)}" stroke-linecap="round" stroke-linejoin="round" fill="none">` +
    ICON_PATHS[name] +
    `</g>`
  );
}

// ── Colours ───────────────────────────────────────────────────────────────────

interface ButtonColors {
  label: string;
  icon: string;
  /** Optional wash over the glass (primary buttons). */
  wash?: string;
  washOpacity?: number;
}

function colorsFor(d: GlassDoc, spec: ButtonSpec): ButtonColors {
  const dark = d.mode === 'dark';
  if (spec.primary) {
    // Same treatment as the hero's "Open to roles" pill: blue-tinted glass, blue label.
    return {
      label: dark ? '#6CB6FF' : '#0062D6',
      icon: dark ? '#6CB6FF' : '#0062D6',
      wash: d.accent('blue'),
      washOpacity: dark ? 0.24 : 0.14,
    };
  }
  // Page-integrated materials stay neutral (icons in the secondary text colour); the wallpaper
  // material keeps the hero's indigo so the row matches its tinted glass.
  if (d.t.integrated) return { label: d.t.text, icon: d.t.textSecondary };
  return { label: d.t.text, icon: dark ? '#B4B2FF' : '#4B40DD' };
}

// ── Glass capsule ─────────────────────────────────────────────────────────────

/**
 * The glass layer over the doc's tiny wallpaper. Unlike GlassDoc.panel(), it keeps the wallpaper
 * colour visible (no heavy frost) so the capsule reads as glass on GitHub's flat background.
 */
function glassCapsule(d: GlassDoc, w: number, h: number, colors: ButtonColors): void {
  const dark = d.mode === 'dark';
  const r = h / 2;
  const rim = d.id('rim');
  const sheen = d.id('sh');
  const shade = d.id('sd');
  d.addDef(
    `<linearGradient id="${rim}" x1="0" y1="0" x2="${fmt(w * 0.3)}" y2="${h}" gradientUnits="userSpaceOnUse">` +
      `<stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.55 : 0.95}"/>` +
      `<stop offset="0.45" stop-color="#fff" stop-opacity="${dark ? 0.08 : 0.4}"/>` +
      `<stop offset="1" stop-color="#fff" stop-opacity="${dark ? 0.26 : 0.75}"/></linearGradient>`
  );
  d.addDef(
    `<linearGradient id="${sheen}" x1="0" y1="0" x2="0" y2="${h}" gradientUnits="userSpaceOnUse">` +
      `<stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.16 : 0.42}"/>` +
      `<stop offset="0.5" stop-color="#fff" stop-opacity="${dark ? 0.03 : 0.1}"/>` +
      `<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
  );
  // A faint darkening toward the bottom gives the capsule a little volume.
  d.addDef(
    `<linearGradient id="${shade}" x1="0" y1="0" x2="0" y2="${h}" gradientUnits="userSpaceOnUse">` +
      `<stop offset="0.55" stop-color="#000" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.18 : 0.04}"/></linearGradient>`
  );
  const rect = (extra: string, inset = 0) =>
    `<rect x="${fmt(inset)}" y="${fmt(inset)}" width="${fmt(w - inset * 2)}" height="${fmt(h - inset * 2)}" rx="${fmt(r - inset)}" ${extra}/>`;
  const parts = [`<g data-panel="b" data-box="0,0,${fmt(w)},${fmt(h)}">`];
  if (d.t.integrated) {
    // On the page itself: an opaque surface like the cards, with the same hairline and a soft sheen.
    parts.push(rect(`fill="${d.t.glassTint}"`));
    if (colors.wash) parts.push(rect(`fill="${colors.wash}" fill-opacity="${fmt(colors.washOpacity ?? 0.15)}"`));
    parts.push(rect(`fill="url(#${sheen})" fill-opacity="${dark ? 0.4 : 1}"`));
    parts.push(rect(`fill="none" stroke="${d.t.hairline}" stroke-opacity="${d.t.hairlineOpacity}" stroke-width="1"`, 0.5));
    parts.push('</g>');
    d.add(parts.join(''));
    return;
  }
  parts.push(rect(`fill="${d.t.glassTint}" fill-opacity="${dark ? 0.34 : 0.4}"`));
  if (colors.wash) parts.push(rect(`fill="${colors.wash}" fill-opacity="${fmt(colors.washOpacity ?? 0.15)}"`));
  parts.push(rect(`fill="url(#${sheen})"`));
  parts.push(rect(`fill="url(#${shade})"`));
  parts.push(rect(`fill="none" stroke="url(#${rim})" stroke-width="1.2"`, 1.1));
  parts.push('</g>');
  d.add(parts.join(''));
}

// ── Renderer ──────────────────────────────────────────────────────────────────

export interface ButtonRenderOptions {
  id: ButtonId;
  mode?: Mode;
}

function specFor(id: ButtonId): ButtonSpec {
  const spec = BUTTONS.find((b) => b.id === id);
  if (!spec) throw new Error(`[buttons] unknown button "${id}"`);
  return spec;
}

/** Measured width of a button (identical for dark and light). */
export function buttonWidth(id: ButtonId): number {
  const spec = specFor(id);
  const probe = new GlassDoc({ width: 100, height: BUTTON_HEIGHT, mode: 'dark', title: 'probe' });
  const labelW = probe.measure({ text: spec.label, ...LABEL });
  return Math.ceil(PAD_ICON_SIDE + ICON + ICON_GAP + labelW + PAD_TEXT_SIDE);
}

export function renderButtonSVG({ id, mode = 'dark' }: ButtonRenderOptions): string {
  const spec = specFor(id);
  const H = BUTTON_HEIGHT;
  const W = buttonWidth(id);
  const d = new GlassDoc({
    width: W,
    height: H,
    mode,
    radius: H / 2,
    title: spec.label,
    desc: spec.group === 'social' ? `${spec.label} — Prem Sai Kota` : `${spec.label} link`,
  });
  const colors = colorsFor(d, spec);
  glassCapsule(d, W, H, colors);

  const labelW = d.measure({ text: spec.label, ...LABEL });
  // The icon side gets PAD_ICON_SIDE, the text side PAD_TEXT_SIDE (optically equal).
  const startX = spec.trailing ? PAD_TEXT_SIDE : PAD_ICON_SIDE;
  const iconX = spec.trailing ? startX + labelW + ICON_GAP : startX;
  const labelX = spec.trailing ? startX : startX + ICON + ICON_GAP;
  const baseline = H / 2 + (LABEL.size * CAP) / 2;

  d.add(iconSVG(spec.icon, iconX, (H - ICON) / 2, ICON, colors.icon, 1.6));
  d.text({
    x: labelX,
    y: baseline,
    text: spec.label,
    ...LABEL,
    color: colors.label,
    maxWidth: labelW + 0.5,
    container: { x: 0, y: 0, w: W, h: H, id: 'b' },
  });
  return d.render();
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
  for (const b of BUTTONS) {
    for (const mode of ['dark', 'light'] as Mode[]) {
      const file = `btn-${b.id}-${mode}.svg`;
      fs.writeFileSync(path.join(ASSETS_DIR, file), renderButtonSVG({ id: b.id, mode }), 'utf8');
      console.log(`✔ Generated assets/${file}`);
    }
  }
}
