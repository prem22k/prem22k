/**
 * Link buttons: one small SVG per link, so the README can wrap each in <a href> and keep it
 * clickable while matching the cards.
 *
 * Each button is a 40px capsule in the Stone material: neutral surface capsules with a hairline, and
 * one primary ("Live demo") in the solid brand accent, flat like an apple.com pill button. Icons
 * come from the shared glyph set (scripts/glass/icons.ts). The width is measured from the label.
 *
 * Spacing lives inside the SVG: the README places buttons as adjacent images with no whitespace,
 * directly under their card, so every canvas carries transparent margins (left/right 4px, bottom
 * 12px). Neighbouring buttons therefore sit 8px apart and the row ends with the cards' 12px rhythm.
 *
 * There are no compact variants: at 40px tall they already fit phones 1:1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, fmt, glyph, type GlyphName, type Mode } from './glass/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

export type IconName = GlyphName;

export type ButtonId = 'portfolio' | 'linkedin' | 'x' | 'threads' | 'email' | 'live' | 'source';

export interface ButtonSpec {
  id: ButtonId;
  label: string;
  icon: IconName;
  /** 'social' buttons sit in the contact row; 'project' buttons sit under a project card. */
  group: 'social' | 'project';
  /** Icon after the label (e.g. the ↗ of "Live demo") instead of before it. */
  trailing?: boolean;
  /** Primary style: solid brand accent with inverse label (one per row at most). */
  primary?: boolean;
}

export const BUTTONS: ButtonSpec[] = [
  { id: 'portfolio', label: 'Portfolio', icon: 'globe', group: 'social' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', group: 'social' },
  { id: 'x', label: 'X', icon: 'x', group: 'social' },
  { id: 'threads', label: 'Threads', icon: 'at', group: 'social' },
  { id: 'email', label: 'Email', icon: 'envelope', group: 'social' },
  { id: 'live', label: 'Live demo', icon: 'arrowUpRight', group: 'project', trailing: true, primary: true },
  { id: 'source', label: 'Source', icon: 'code', group: 'project' },
];

// ── Geometry ──────────────────────────────────────────────────────────────────

/** Capsule height (the visible button). The SVG canvas adds BUTTON_MARGIN around it. */
export const BUTTON_HEIGHT = 40;
/** Transparent margins inside each button's canvas (px). */
export const BUTTON_MARGIN = { left: 4, right: 4, top: 0, bottom: 12 } as const;
/** Full canvas height: capsule plus top and bottom margins. */
export const BUTTON_CANVAS_HEIGHT = BUTTON_MARGIN.top + BUTTON_HEIGHT + BUTTON_MARGIN.bottom;

const ICON = 16; // rendered glyph size (px)
const ICON_WEIGHT = 1.7;
const ICON_GAP = 8; // icon <-> label
const PAD_ICON_SIDE = 16; // the icon carries visual weight, so its side gets a little less padding
const PAD_TEXT_SIDE = 19;
const LABEL = { size: 14, weight: 600, cut: 'text' as const, ls: -0.1 };
/** Inter cap height (em). Used to centre the label's caps on the capsule's midline. */
const CAP = 0.727;

// ── Colours ───────────────────────────────────────────────────────────────────

/** premsai.dev --color-accent and its inverse text, per mode. */
const BRAND = {
  dark: { fill: '#F5F2EB', ink: '#111010' },
  light: { fill: '#292524', ink: '#F5F2EB' },
} as const;

interface ButtonColors {
  label: string;
  icon: string;
  /** Solid fill for the primary button; neutral buttons use the theme surface. */
  fill?: string;
}

function colorsFor(d: GlassDoc, spec: ButtonSpec): ButtonColors {
  if (spec.primary) {
    const b = BRAND[d.mode];
    return { label: b.ink, icon: b.ink, fill: b.fill };
  }
  return { label: d.t.text, icon: d.t.textSecondary };
}

// ── Capsule ───────────────────────────────────────────────────────────────────

/**
 * The capsule at (x, y). Neutral: the cards' opaque surface with their soft top sheen and hairline.
 * Primary: one flat solid fill with a faint darker hairline for definition (no sheen, no gradient).
 * Its group carries the data-box the QA checks text against (the capsule, not the canvas).
 */
function capsule(d: GlassDoc, x: number, y: number, w: number, h: number, colors: ButtonColors): void {
  const dark = d.mode === 'dark';
  const r = h / 2;
  const rect = (extra: string, inset = 0) =>
    `<rect x="${fmt(x + inset)}" y="${fmt(y + inset)}" width="${fmt(w - inset * 2)}" height="${fmt(h - inset * 2)}" rx="${fmt(r - inset)}" ${extra}/>`;
  const parts = [`<g data-panel="b" data-box="${fmt(x)},${fmt(y)},${fmt(w)},${fmt(h)}">`];
  if (colors.fill) {
    parts.push(rect(`fill="${colors.fill}"`));
    parts.push(rect(`fill="none" stroke="#000" stroke-opacity="${dark ? 0.1 : 0.22}" stroke-width="1"`, 0.5));
  } else {
    const sheen = d.id('sh');
    d.addDef(
      `<linearGradient id="${sheen}" x1="0" y1="${fmt(y)}" x2="0" y2="${fmt(y + h)}" gradientUnits="userSpaceOnUse">` +
        `<stop offset="0" stop-color="#fff" stop-opacity="${fmt(d.t.sheen)}"/>` +
        `<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
    );
    parts.push(rect(`fill="${d.t.glassTint}"`));
    parts.push(rect(`fill="url(#${sheen})"`));
    parts.push(rect(`fill="none" stroke="${d.t.hairline}" stroke-opacity="${fmt(d.t.hairlineOpacity)}" stroke-width="1"`, 0.5));
  }
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

function labelWidth(spec: ButtonSpec): number {
  const probe = new GlassDoc({ width: 100, height: BUTTON_HEIGHT, mode: 'dark', title: 'probe' });
  return probe.measure({ text: spec.label, ...LABEL });
}

/** Width of the visible capsule (identical for dark and light). */
export function capsuleWidth(id: ButtonId): number {
  return Math.ceil(PAD_ICON_SIDE + ICON + ICON_GAP + labelWidth(specFor(id)) + PAD_TEXT_SIDE);
}

/**
 * Width of the button's SVG canvas: the capsule plus its left and right transparent margins
 * (identical for dark and light). Use this, with BUTTON_CANVAS_HEIGHT, when laying out the images.
 */
export function buttonWidth(id: ButtonId): number {
  return capsuleWidth(id) + BUTTON_MARGIN.left + BUTTON_MARGIN.right;
}

export function renderButtonSVG({ id, mode = 'dark' }: ButtonRenderOptions): string {
  const spec = specFor(id);
  const W = buttonWidth(id);
  const H = BUTTON_CANVAS_HEIGHT;
  const cw = capsuleWidth(id);
  const ch = BUTTON_HEIGHT;
  const cx = BUTTON_MARGIN.left;
  const cy = BUTTON_MARGIN.top;
  const d = new GlassDoc({
    width: W,
    height: H,
    mode,
    radius: ch / 2,
    title: spec.label,
    desc: spec.group === 'social' ? `${spec.label}, Prem Sai Kota` : `${spec.label} link`,
  });
  const colors = colorsFor(d, spec);
  capsule(d, cx, cy, cw, ch, colors);

  const labelW = d.measure({ text: spec.label, ...LABEL });
  // The icon side gets PAD_ICON_SIDE, the text side PAD_TEXT_SIDE (optically equal).
  const startX = cx + (spec.trailing ? PAD_TEXT_SIDE : PAD_ICON_SIDE);
  const iconX = spec.trailing ? startX + labelW + ICON_GAP : startX;
  const labelX = spec.trailing ? startX : startX + ICON + ICON_GAP;
  const baseline = cy + ch / 2 + (LABEL.size * CAP) / 2;

  glyph(d, spec.icon, { x: iconX, y: cy + (ch - ICON) / 2, size: ICON, color: colors.icon, weight: ICON_WEIGHT });
  d.text({
    x: labelX,
    y: baseline,
    text: spec.label,
    ...LABEL,
    color: colors.label,
    maxWidth: labelW + 0.5,
    container: { x: cx, y: cy, w: cw, h: ch, id: 'b' },
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
