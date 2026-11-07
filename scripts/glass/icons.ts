/**
 * One icon language for every card: SF Symbols-style line glyphs on a 24×24 grid, drawn with a
 * single stroke weight in the neutral text colour. No gradient "app icon" tiles: colour belongs to
 * data, not decoration.
 */
import type { GlassDoc } from './doc.ts';
import { fmt } from './util.ts';

/** Path data per glyph (24×24 grid, stroke only; `M x y h0` draws a dot with the round cap). */
export const GLYPHS = {
  globe: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M3.5 12h17M12 3c-2.6 2.5-3.9 5.5-3.9 9s1.3 6.5 3.9 9c2.6-2.5 3.9-5.5 3.9-9S14.6 5.5 12 3',
  linkedin: 'M6.5 3.5h11a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3M8.3 11v5.7M8.3 7.9h0M11.8 16.7V11M11.8 13.6c0-1.7 1.1-2.7 2.5-2.7s2.4.9 2.4 2.7v3.1',
  x: 'M5 4.5h3.6L19 19.5h-3.6ZM18.6 4.5l-5.4 6.2M5.4 19.5l5.4-6.2',
  at: 'M15.5 12a3.5 3.5 0 1 1-7 0a3.5 3.5 0 1 1 7 0v1.3a2.4 2.4 0 0 0 4.8 0V12a8.3 8.3 0 1 0-3.4 6.7',
  envelope: 'M5.5 5.5h13a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16V8a2.5 2.5 0 0 1 2.5-2.5M3.6 7.2 12 13l8.4-5.8',
  arrowUpRight: 'M7 17 17 7M9 7h8v8',
  arrowUp: 'M12 19V5M6.5 10.5 12 5l5.5 5.5',
  code: 'M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5M13.4 5.5l-2.8 13',
  waveform: 'M4 10.5v3M7.2 8v8M10.4 4.5v15M13.6 7.5v9M16.8 9.5v5M20 11v2',
  tree: 'M12 3.5a2 2 0 1 1 0 4a2 2 0 1 1 0-4M6 16.5a2 2 0 1 1 0 4a2 2 0 1 1 0-4M18 16.5a2 2 0 1 1 0 4a2 2 0 1 1 0-4M10.9 7.2 7 16.7M13.1 7.2l3.9 9.5',
  window: 'M5.5 4.5h13a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17V7a2.5 2.5 0 0 1 2.5-2.5M3 9h18M6 6.8h0M8.4 6.8h0',
  database: 'M5 6.5c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3M5 6.5v11c0 1.7 3.1 3 7 3s7-1.3 7-3v-11M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3',
  bolt: 'M13.2 3 5.5 13.5h6l-.8 7.5 7.8-10.6h-6Z',
  sparkle: 'M12 3.5c.7 4.6 3.4 7.3 8 8-4.6.7-7.3 3.4-8 8-.7-4.6-3.4-7.3-8-8 4.6-.7 7.3-3.4 8-8',
  monitor: 'M5.5 4h13A2.5 2.5 0 0 1 21 6.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 14.5v-8A2.5 2.5 0 0 1 5.5 4M9 20.5h6M12 17v3.5',
  calendar: 'M6 5h12a2.5 2.5 0 0 1 2.5 2.5v10.5a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V7.5A2.5 2.5 0 0 1 6 5M3.5 10h17M8 3v3.5M16 3v3.5',
  star: 'M12 3.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7Z',
  chart: 'M5 19.5v-6M9.7 19.5V8M14.3 19.5v-8.5M19 19.5V4.5',
  merge: 'M7 3.5a2 2 0 1 1 0 4a2 2 0 1 1 0-4M7 16.5a2 2 0 1 1 0 4a2 2 0 1 1 0-4M17 10a2 2 0 1 1 0 4a2 2 0 1 1 0-4M7 7.5v9M7 7.5c0 3 2.5 4.5 8 4.5',
  plus: 'M12 5v14M5 12h14',
  tag: 'M3.5 11.4V5a1.5 1.5 0 0 1 1.5-1.5h6.4l9.1 9.1-7.9 7.9ZM8 8h0',
  branch: 'M6 3.5a2 2 0 1 1 0 4a2 2 0 1 1 0-4M6 16.5a2 2 0 1 1 0 4a2 2 0 1 1 0-4M18 5.5a2 2 0 1 1 0 4a2 2 0 1 1 0-4M6 7.5v9M18 9.5c0 4-6 3.5-12 7',
  briefcase: 'M5.5 7.5h13A2.5 2.5 0 0 1 21 10v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18v-8a2.5 2.5 0 0 1 2.5-2.5M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 13h18',
  cloud: 'M7.2 18.5h9.6a3.9 3.9 0 0 0 .5-7.8 5.6 5.6 0 0 0-10.8 1.1A3.4 3.4 0 0 0 7.2 18.5',
  trophy: 'M8 4h8v5.5a4 4 0 0 1-8 0ZM8 6H5v1.3a3 3 0 0 0 3 3M16 6h3v1.3a3 3 0 0 1-3 3M12 13.5v3.5M8.5 20.5h7M9.5 17h5v3.5h-5',
  medal: 'M12 10.5a5 5 0 1 1 0 10a5 5 0 1 1 0-10M8 3.5l2.6 7.2M16 3.5l-2.6 7.2M8 3.5h8',
  pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11M12 7.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 1 1 0-5',
} as const;

export type GlyphName = keyof typeof GLYPHS;

export interface GlyphOptions {
  x: number;
  y: number;
  /** Rendered size in px (the 24-grid is scaled to this). */
  size?: number;
  color?: string;
  /** Stroke width in px, independent of size. */
  weight?: number;
  opacity?: number;
}

/** A bare glyph. Default colour: the theme's secondary text colour. */
export function glyph(d: GlassDoc, name: GlyphName, opts: GlyphOptions): void {
  const size = opts.size ?? 18;
  const s = size / 24;
  const weight = opts.weight ?? 1.6;
  d.add(
    `<path d="${GLYPHS[name]}" transform="translate(${fmt(opts.x)} ${fmt(opts.y)}) scale(${fmt(s)})" fill="none" stroke="${opts.color ?? d.t.textSecondary}"` +
      `${opts.opacity !== undefined ? ` stroke-opacity="${fmt(opts.opacity)}"` : ''} stroke-width="${fmt(weight / s)}" stroke-linecap="round" stroke-linejoin="round"/>`
  );
}

export interface GlyphTileOptions extends GlyphOptions {
  /** Tile edge length in px (default 32). */
  tile?: number;
  radius?: number;
}

/** A glyph centred on a quiet neutral tile (fill + hairline), the only icon container we use. */
export function glyphTile(d: GlassDoc, name: GlyphName, opts: GlyphTileOptions): void {
  const tile = opts.tile ?? 32;
  const size = opts.size ?? Math.round(tile * 0.56);
  const r = opts.radius ?? Math.round(tile * 0.28);
  d.add(
    `<rect x="${fmt(opts.x)}" y="${fmt(opts.y)}" width="${tile}" height="${tile}" rx="${r}" fill="${d.t.fill}" fill-opacity="${fmt(d.t.fillOpacity * 1.1)}"` +
      ` stroke="${d.t.hairline}" stroke-opacity="${fmt(d.t.hairlineOpacity)}" stroke-width="1"/>`
  );
  glyph(d, name, { ...opts, x: opts.x + (tile - size) / 2, y: opts.y + (tile - size) / 2, size });
}
