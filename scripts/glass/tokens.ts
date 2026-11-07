/**
 * Liquid Glass design tokens.
 * Apple-style materials: a soft wallpaper, frosted glass panels on top, SF-like type (Inter, embedded).
 */

export type Mode = 'dark' | 'light';
export type Layout = 'wide' | 'compact';

/** Canvas widths. Wide renders 1:1 on desktop GitHub; compact renders ~1:1 on phones. */
export const WIDTH: Record<Layout, number> = { wide: 800, compact: 400 };

/**
 * Material:
 *  - 'wallpaper': each card is a rounded wallpaper slab with frosted panels (v3.0).
 *  - 'graphite' / 'stone': page-integrated: transparent canvas, panels sit directly on GitHub's
 *    background like native surfaces. Graphite = Apple neutral greys; stone = premsai.dev's warm neutrals.
 */
export type Material = 'wallpaper' | 'graphite' | 'stone';
export const MATERIAL: Material = (process.env.GLASS_MATERIAL as Material) || 'stone';
const INTEGRATED = MATERIAL !== 'wallpaper';

/** Outer padding of the canvas (room for panel shadows when integrated) and gap between panels. */
export const PAD: Record<Layout, number> = INTEGRATED ? { wide: 12, compact: 10 } : { wide: 24, compact: 16 };
export const GAP: Record<Layout, number> = { wide: 16, compact: 12 };

export const RADIUS = {
  card: 28,
  panel: 20,
  inner: 14,
  pill: 999,
} as const;

export interface Accents {
  blue: string;
  green: string;
  indigo: string;
  orange: string;
  pink: string;
  purple: string;
  red: string;
  teal: string;
  yellow: string;
  gray: string;
}

export interface Theme {
  mode: Mode;
  /** Panels sit on the page (no wallpaper, no frost, transparent canvas). */
  integrated: boolean;
  /** Wallpaper base colour, painted under the blurred orbs. */
  wallBase: string;
  /** Orb colours for the wallpaper, in paint order. */
  wallOrbs: string[];
  wallOrbOpacity: number;
  /** Glass material. */
  glassTint: string;
  glassTintOpacity: number;
  glassStrongTintOpacity: number;
  rimTop: number;
  rimMid: number;
  rimBottom: number;
  sheen: number;
  hairline: string;
  hairlineOpacity: number;
  shadow: string;
  shadowOpacity: number;
  /** Outer card border. */
  cardStroke: string;
  cardStrokeOpacity: number;
  /** Text. */
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** Neutral fills for tracks, empty cells, separators. */
  fill: string;
  fillOpacity: number;
  separator: string;
  separatorOpacity: number;
  accents: Accents;
}

const WALL_DARK: Theme = {
  mode: 'dark',
  integrated: false,
  wallBase: '#07080E',
  wallOrbs: ['#2459F5', '#6A3BE0', '#3B2FD0', '#0C86A8', '#5328C2'],
  wallOrbOpacity: 0.62,
  glassTint: '#1C1C26',
  glassTintOpacity: 0.42,
  glassStrongTintOpacity: 0.6,
  rimTop: 0.5,
  rimMid: 0.06,
  rimBottom: 0.22,
  sheen: 0.1,
  hairline: '#FFFFFF',
  hairlineOpacity: 0.06,
  shadow: '#000000',
  shadowOpacity: 0.45,
  cardStroke: '#FFFFFF',
  cardStrokeOpacity: 0.1,
  text: '#F5F5F7',
  textSecondary: '#C7C7D1',
  textTertiary: '#8E8E9A',
  fill: '#FFFFFF',
  fillOpacity: 0.08,
  separator: '#FFFFFF',
  separatorOpacity: 0.1,
  accents: {
    blue: '#0A84FF',
    green: '#30D158',
    indigo: '#5E5CE6',
    orange: '#FF9F0A',
    pink: '#FF375F',
    purple: '#BF5AF2',
    red: '#FF453A',
    teal: '#64D2FF',
    yellow: '#FFD60A',
    gray: '#98989D',
  },
};

const WALL_LIGHT: Theme = {
  mode: 'light',
  integrated: false,
  wallBase: '#EEF0F7',
  wallOrbs: ['#9DB6FF', '#C8B4FF', '#B6C0FF', '#A3E2EE', '#D3BFFF'],
  wallOrbOpacity: 0.85,
  glassTint: '#FFFFFF',
  glassTintOpacity: 0.5,
  glassStrongTintOpacity: 0.68,
  rimTop: 0.95,
  rimMid: 0.35,
  rimBottom: 0.7,
  sheen: 0.35,
  hairline: '#0B1020',
  hairlineOpacity: 0.07,
  shadow: '#1E2A4A',
  shadowOpacity: 0.14,
  cardStroke: '#0B1020',
  cardStrokeOpacity: 0.08,
  text: '#1D1D1F',
  textSecondary: '#3C3C43',
  textTertiary: '#6E6E78',
  fill: '#0B1020',
  fillOpacity: 0.07,
  separator: '#0B1020',
  separatorOpacity: 0.09,
  accents: {
    blue: '#007AFF',
    green: '#28A745',
    indigo: '#5856D6',
    orange: '#F28C00',
    pink: '#FF2D55',
    purple: '#AF52DE',
    red: '#FF3B30',
    teal: '#0FA5C9',
    yellow: '#D9A400',
    gray: '#8E8E93',
  },
};

const GRAPHITE_DARK: Theme = {
  ...WALL_DARK,
  integrated: true,
  glassTint: '#1C1C1E',
  glassTintOpacity: 1,
  glassStrongTintOpacity: 1,
  rimTop: 0.16,
  rimMid: 0.04,
  rimBottom: 0.06,
  sheen: 0.045,
  hairline: '#FFFFFF',
  hairlineOpacity: 0.09,
  shadow: '#000000',
  shadowOpacity: 0.35,
  text: '#F5F5F7',
  textSecondary: '#AEAEB2',
  textTertiary: '#8E8E93',
  fill: '#FFFFFF',
  fillOpacity: 0.07,
  separator: '#FFFFFF',
  separatorOpacity: 0.09,
};

const GRAPHITE_LIGHT: Theme = {
  ...WALL_LIGHT,
  integrated: true,
  glassTint: '#F5F5F7',
  glassTintOpacity: 1,
  glassStrongTintOpacity: 1,
  rimTop: 0.95,
  rimMid: 0.5,
  rimBottom: 0.3,
  sheen: 0.55,
  hairline: '#000000',
  hairlineOpacity: 0.08,
  shadow: '#000000',
  shadowOpacity: 0.07,
  text: '#1D1D1F',
  textSecondary: '#515154',
  textTertiary: '#86868B',
  fill: '#000000',
  fillOpacity: 0.06,
  separator: '#000000',
  separatorOpacity: 0.08,
};

/** premsai.dev tokens (app/globals.css): bg-soft surfaces, stone text, stone borders. */
const STONE_DARK: Theme = {
  ...GRAPHITE_DARK,
  glassTint: '#171616',
  rimTop: 0.12,
  sheen: 0.035,
  hairline: '#2C2825',
  hairlineOpacity: 1,
  text: '#F5F2EB',
  textSecondary: '#A8A29E',
  textTertiary: '#78716C',
  fill: '#F5F2EB',
  fillOpacity: 0.07,
  separator: '#2C2825',
  separatorOpacity: 1,
};

const STONE_LIGHT: Theme = {
  ...GRAPHITE_LIGHT,
  glassTint: '#F8F7F5',
  hairline: '#E7E5E4',
  hairlineOpacity: 1,
  text: '#1C1917',
  textSecondary: '#57534E',
  textTertiary: '#78716C',
  fill: '#1C1917',
  fillOpacity: 0.06,
  separator: '#E7E5E4',
  separatorOpacity: 1,
};

const THEMES: Record<Material, Record<Mode, Theme>> = {
  wallpaper: { dark: WALL_DARK, light: WALL_LIGHT },
  graphite: { dark: GRAPHITE_DARK, light: GRAPHITE_LIGHT },
  stone: { dark: STONE_DARK, light: STONE_LIGHT },
};

export const DARK: Theme = THEMES[MATERIAL].dark;
export const LIGHT: Theme = THEMES[MATERIAL].light;

export function theme(mode: Mode): Theme {
  return mode === 'light' ? LIGHT : DARK;
}

/**
 * Type scale (px). Minimum on-canvas size is 12px so text stays legible at 1:1
 * (wide on desktop, compact on phones).
 */
export const TYPE = {
  hero: { size: 40, weight: 700, cut: 'display', ls: -0.8 },
  title: { size: 24, weight: 700, cut: 'display', ls: -0.4 },
  headline: { size: 17, weight: 600, cut: 'text', ls: -0.2 },
  body: { size: 14, weight: 400, cut: 'text', ls: 0 },
  callout: { size: 13, weight: 500, cut: 'text', ls: 0 },
  caption: { size: 12, weight: 500, cut: 'text', ls: 0.1 },
  /** Small uppercase section eyebrow. */
  eyebrow: { size: 11.5, weight: 600, cut: 'text', ls: 0.9 },
  /** Big widget number. */
  number: { size: 34, weight: 700, cut: 'display', ls: -0.8 },
  numberSmall: { size: 22, weight: 700, cut: 'display', ls: -0.4 },
} as const;

export type TypeStyle = keyof typeof TYPE;
