/**
 * GlassDoc — builds one Liquid Glass SVG.
 *
 *   const d = new GlassDoc({ width: 800, height: 240, mode: 'dark', title: 'Hero', seed: 'hero' });
 *   const p = d.panel({ x: 24, y: 24, w: 360, h: 120 });
 *   d.text({ x: p.x + 20, y: p.y + 40, text: 'Hello', style: 'title', maxWidth: p.w - 40, container: p });
 *   const svg = d.render();
 *
 * Layers: wallpaper card (base colour + blurred colour orbs) → glass panels (frosted copy of the
 * wallpaper clipped to the panel, tint, sheen, specular rim, soft shadow) → content.
 *
 * Layout safety: every text() call is measured with the embedded font's real advances. Static text
 * that does not fit throws at build time; dynamic text (overflow: 'ellipsis' | 'shrink') is fitted.
 * Panels and texts carry data-* hooks so the browser QA pass can verify containment and overlaps.
 */
import { escapeXml, fmt } from './util.ts';
import { measure, ellipsize, fontFaceStyle, fontStack, type Cut } from './font.ts';
import { theme as getTheme, RADIUS, TYPE, type Mode, type Theme, type TypeStyle } from './tokens.ts';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  id?: string;
}

export interface Orb {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity?: number;
}

export interface DocOptions {
  width: number;
  height: number;
  mode: Mode;
  title: string;
  desc?: string;
  /** Kept for API compatibility; the wallpaper is one shared composition for every card. */
  seed?: string;
  /** Optional identity colour (e.g. a project's accent) added as one soft orb top-right. */
  accent?: string;
  /** Explicit orbs (overrides the shared wallpaper). Avoid: it breaks page-wide cohesion. */
  orbs?: Orb[];
  /** Outer card corner radius. */
  radius?: number;
  /** Blur of the visible wallpaper orbs. */
  wallBlur?: number;
}

export interface PanelOptions extends Box {
  r?: number;
  /** Heavier tint for dense content. */
  strong?: boolean;
  /** Skip the drop shadow (nested panels). */
  flat?: boolean;
  /** Optional accent wash (a hex colour) blended into the tint. */
  wash?: string;
  washOpacity?: number;
}

export type Overflow = 'error' | 'ellipsis' | 'shrink';

export interface TextOptions {
  x: number;
  y: number;
  text: string;
  style?: TypeStyle;
  size?: number;
  weight?: number;
  cut?: Cut;
  ls?: number;
  color?: string;
  opacity?: number;
  anchor?: 'start' | 'middle' | 'end';
  uppercase?: boolean;
  tabular?: boolean;
  maxWidth?: number;
  overflow?: Overflow;
  /** Smallest size 'shrink' may go to (default: 85% of size). */
  minSize?: number;
  container?: Box;
  /** Opt out of the QA overlap check (intentional overlaps only). */
  allowOverlap?: boolean;
}

export interface TextResult {
  width: number;
  size: number;
  text: string;
}

export class GlassDoc {
  readonly width: number;
  readonly height: number;
  readonly mode: Mode;
  readonly t: Theme;
  readonly title: string;
  readonly desc: string;
  readonly radius: number;
  private orbs: Orb[];
  private wallBlur: number;
  private defs: string[] = [];
  private body: string[] = [];
  private usedChars: Record<Cut, string> = { text: '', display: '' };
  private ids = 0;
  private panelCount = 0;

  constructor(opts: DocOptions) {
    this.width = opts.width;
    this.height = opts.height;
    this.mode = opts.mode;
    this.t = getTheme(opts.mode);
    this.title = opts.title;
    this.desc = opts.desc ?? opts.title;
    this.radius = opts.radius ?? RADIUS.card;
    this.wallBlur = opts.wallBlur ?? Math.round(Math.max(this.width, this.height) / 9);
    this.orbs = opts.orbs ?? this.wallpaperOrbs(opts.accent);
  }

  /** Unique id for defs. */
  id(prefix: string): string {
    this.ids += 1;
    return `${prefix}${this.ids}`;
  }

  addDef(svg: string): void {
    this.defs.push(svg);
  }

  add(svg: string): void {
    this.body.push(svg);
  }

  /** Accent colour by name. */
  accent(name: keyof Theme['accents']): string {
    return this.t.accents[name];
  }

  /**
   * The shared wallpaper: the same composition on every card (scaled to its size), so the README
   * reads as one desktop rather than a patchwork. Cool hues only; identity colour comes from `accent`.
   */
  private wallpaperOrbs(accent?: string): Orb[] {
    const { width: W, height: H } = this;
    const c = this.t.wallOrbs;
    const R = Math.hypot(W, H) / 2;
    const orbs: Orb[] = [
      { cx: 0.02 * W, cy: 0.0 * H, r: 0.62 * R, color: c[0] },
      { cx: 0.98 * W, cy: 0.04 * H, r: 0.58 * R, color: c[1] },
      { cx: 0.5 * W, cy: 0.55 * H, r: 0.45 * R, color: c[2], opacity: this.t.wallOrbOpacity * 0.7 },
      { cx: 0.04 * W, cy: 1.0 * H, r: 0.55 * R, color: c[3] },
      { cx: 0.96 * W, cy: 0.98 * H, r: 0.6 * R, color: c[4] },
    ];
    if (accent) orbs.push({ cx: 0.88 * W, cy: 0.12 * H, r: 0.4 * R, color: accent, opacity: this.mode === 'dark' ? 0.5 : 0.45 });
    return orbs;
  }

  /** A frosted Liquid Glass panel. Returns its box (with id) for use as a text container. */
  panel(opts: PanelOptions): Box {
    const { x, y, w, h } = opts;
    const r = Math.min(opts.r ?? RADIUS.panel, h / 2, w / 2);
    const t = this.t;
    this.panelCount += 1;
    const pid = opts.id ?? `p${this.panelCount}`;
    const clip = this.id('c');
    const rim = this.id('g');
    const sheen = this.id('s');
    this.addDef(`<clipPath id="${clip}"><rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="${fmt(r)}"/></clipPath>`);
    this.addDef(
      `<linearGradient id="${rim}" x1="${fmt(x)}" y1="${fmt(y)}" x2="${fmt(x + w * 0.35)}" y2="${fmt(y + h)}" gradientUnits="userSpaceOnUse">` +
        `<stop offset="0" stop-color="#fff" stop-opacity="${t.rimTop}"/>` +
        `<stop offset="0.38" stop-color="#fff" stop-opacity="${t.rimMid}"/>` +
        `<stop offset="0.72" stop-color="#fff" stop-opacity="${t.rimMid}"/>` +
        `<stop offset="1" stop-color="#fff" stop-opacity="${t.rimBottom}"/></linearGradient>`
    );
    this.addDef(
      `<linearGradient id="${sheen}" x1="0" y1="${fmt(y)}" x2="0" y2="${fmt(y + Math.min(h, 160))}" gradientUnits="userSpaceOnUse">` +
        `<stop offset="0" stop-color="#fff" stop-opacity="${t.sheen}"/>` +
        `<stop offset="0.55" stop-color="#fff" stop-opacity="${fmt(t.sheen * 0.25)}"/>` +
        `<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
    );

    const rect = (extra: string, inset = 0) =>
      `<rect x="${fmt(x + inset)}" y="${fmt(y + inset)}" width="${fmt(w - inset * 2)}" height="${fmt(h - inset * 2)}" rx="${fmt(Math.max(0, r - inset))}" ${extra}/>`;

    const parts: string[] = [`<g data-panel="${pid}" data-box="${fmt(x)},${fmt(y)},${fmt(w)},${fmt(h)}">`];
    if (!opts.flat) {
      parts.push(
        `<rect x="${fmt(x + 2)}" y="${fmt(y + 10)}" width="${fmt(w - 4)}" height="${fmt(h - 6)}" rx="${fmt(r)}" fill="${t.shadow}" fill-opacity="${t.shadowOpacity}" filter="url(#gShadow)"/>`
      );
    }
    // Frosted wallpaper: an opaque, more-blurred copy of the wallpaper clipped to the panel.
    parts.push(`<g clip-path="url(#${clip})"><rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" fill="${t.wallBase}"/><use href="#gOrbs" filter="url(#gFrost)"/></g>`);
    parts.push(rect(`fill="${t.glassTint}" fill-opacity="${opts.strong ? t.glassStrongTintOpacity : t.glassTintOpacity}"`));
    if (opts.wash) parts.push(rect(`fill="${opts.wash}" fill-opacity="${opts.washOpacity ?? 0.12}"`));
    parts.push(rect(`fill="url(#${sheen})"`));
    parts.push(rect(`fill="none" stroke="${t.hairline}" stroke-opacity="${t.hairlineOpacity}" stroke-width="1"`, 0.5));
    parts.push(rect(`fill="none" stroke="url(#${rim})" stroke-width="1.2"`, 1));
    parts.push('</g>');
    this.add(parts.join(''));
    return { x, y, w, h, id: pid };
  }

  /** Measured text. Returns the final width/size/string after fitting. */
  text(opts: TextOptions): TextResult {
    const base = opts.style ? TYPE[opts.style] : TYPE.body;
    let size = opts.size ?? base.size;
    const weight = opts.weight ?? base.weight;
    const cut: Cut = opts.cut ?? (base.cut as Cut);
    const ls = opts.ls ?? base.ls;
    const uppercase = opts.uppercase ?? opts.style === 'eyebrow';
    const tabular = opts.tabular ?? false;
    let str = uppercase ? opts.text.toUpperCase() : opts.text;
    const m = () => measure(str, { size, weight, cut, ls, tabular });

    if (opts.maxWidth !== undefined && m() > opts.maxWidth + 0.01) {
      const overflow = opts.overflow ?? 'error';
      if (overflow === 'error') {
        throw new Error(
          `[glass] "${str}" (${m().toFixed(1)}px @${size}px) overflows maxWidth ${opts.maxWidth.toFixed(1)}px in "${this.title}" (${this.mode}, ${this.width}w)`
        );
      }
      if (overflow === 'shrink') {
        const min = opts.minSize ?? size * 0.85;
        while (size > min && m() > opts.maxWidth) size = Math.max(min, size - 0.5);
      }
      if (m() > opts.maxWidth) str = ellipsize(str, opts.maxWidth, { size, weight, cut, ls, tabular });
    }

    this.usedChars[cut] += str;
    const width = m();
    const anchor = opts.anchor ?? 'start';
    const attrs = [
      `x="${fmt(opts.x)}"`,
      `y="${fmt(opts.y)}"`,
      `font-family="${escapeXml(fontStack(cut))}"`,
      `font-size="${fmt(size)}"`,
      `font-weight="${weight}"`,
      ls ? `letter-spacing="${fmt(ls)}"` : '',
      anchor !== 'start' ? `text-anchor="${anchor}"` : '',
      `fill="${opts.color ?? this.t.text}"`,
      opts.opacity !== undefined ? `fill-opacity="${fmt(opts.opacity)}"` : '',
      tabular ? `style="font-variant-numeric:tabular-nums"` : '',
      opts.container?.id ? `data-in="${opts.container.id}"` : '',
      opts.allowOverlap ? 'data-overlap="ok"' : '',
    ]
      .filter(Boolean)
      .join(' ');
    this.add(`<text ${attrs}>${escapeXml(str)}</text>`);
    return { width, size, text: str };
  }

  /** Measure without drawing (same options as text()). */
  measure(opts: Omit<TextOptions, 'x' | 'y'>): number {
    const base = opts.style ? TYPE[opts.style] : TYPE.body;
    const uppercase = opts.uppercase ?? opts.style === 'eyebrow';
    return measure(uppercase ? opts.text.toUpperCase() : opts.text, {
      size: opts.size ?? base.size,
      weight: opts.weight ?? base.weight,
      cut: opts.cut ?? (base.cut as Cut),
      ls: opts.ls ?? base.ls,
      tabular: opts.tabular ?? false,
    });
  }

  /** Small glass capsule with a label; returns its width. */
  pill(opts: {
    x: number;
    y: number;
    text: string;
    h?: number;
    padX?: number;
    color?: string;
    dot?: string;
    size?: number;
    weight?: number;
    container?: Box;
    tinted?: string;
  }): number {
    const h = opts.h ?? 26;
    const padX = opts.padX ?? 11;
    const size = opts.size ?? 12;
    const weight = opts.weight ?? 600;
    const dotW = opts.dot ? 12 : 0;
    const tw = measure(opts.text, { size, weight, cut: 'text' });
    const w = Math.ceil(tw + padX * 2 + dotW);
    const t = this.t;
    const dark = this.mode === 'dark';
    const fill = opts.tinted ?? '#FFFFFF';
    const fillOpacity = opts.tinted ? (dark ? 0.2 : 0.14) : dark ? 0.1 : 0.55;
    this.add(
      `<rect x="${fmt(opts.x)}" y="${fmt(opts.y)}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" fill-opacity="${fmt(fillOpacity)}" stroke="${dark ? '#FFFFFF' : t.hairline}" stroke-opacity="${dark ? 0.14 : 0.08}"/>`
    );
    if (opts.dot) {
      this.add(`<circle cx="${fmt(opts.x + padX + 3.5)}" cy="${fmt(opts.y + h / 2)}" r="3.5" fill="${opts.dot}"/>`);
    }
    this.text({
      x: opts.x + padX + dotW,
      y: opts.y + h / 2 + size * 0.36,
      text: opts.text,
      size,
      weight,
      cut: 'text',
      ls: 0,
      color: opts.color ?? t.textSecondary,
      container: opts.container,
    });
    return w;
  }

  /** Hairline separator. */
  separator(x1: number, y1: number, x2: number, y2: number): void {
    this.add(
      `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${this.t.separator}" stroke-opacity="${this.t.separatorOpacity}" stroke-width="1"/>`
    );
  }

  render(): string {
    const { width: W, height: H, t, radius: R } = this;
    const orbs = this.orbs
      .map(
        (o) =>
          `<circle cx="${fmt(o.cx)}" cy="${fmt(o.cy)}" r="${fmt(o.r)}" fill="${o.color}" fill-opacity="${fmt(o.opacity ?? t.wallOrbOpacity)}"/>`
      )
      .join('');
    const blur = this.wallBlur;
    const frostBlur = Math.round(blur * 0.55 + 18);
    const sat = this.mode === 'dark' ? 1.6 : 1.35;
    const style = fontFaceStyle(this.usedChars);
    const defs = [
      `<clipPath id="gCard"><rect width="${W}" height="${H}" rx="${R}"/></clipPath>`,
      `<filter id="gWall" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${blur}"/></filter>`,
      `<filter id="gFrost" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${blur + frostBlur}"/><feColorMatrix type="saturate" values="${sat}"/></filter>`,
      `<filter id="gShadow" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${this.mode === 'dark' ? 12 : 14}"/></filter>`,
      `<g id="gOrbs">${orbs}</g>`,
      ...this.defs,
    ];
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="${escapeXml(this.title)}">`,
      `<title>${escapeXml(this.title)}</title>`,
      `<desc>${escapeXml(this.desc)}</desc>`,
      style ? `<style>${style}</style>` : '',
      `<defs>${defs.join('')}</defs>`,
      `<g clip-path="url(#gCard)">`,
      `<rect width="${W}" height="${H}" fill="${t.wallBase}"/>`,
      `<use href="#gOrbs" filter="url(#gWall)"/>`,
      ...this.body,
      `</g>`,
      `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${R - 0.5}" fill="none" stroke="${t.cardStroke}" stroke-opacity="${t.cardStrokeOpacity}"/>`,
      `</svg>`,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
