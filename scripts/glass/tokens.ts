/**
 * Liquid Glass design tokens.
 * Apple-style materials: a soft wallpaper, frosted glass panels on top, SF-like type (Inter, embedded).
 */

export type Mode = 'dark' | 'light';
export type Layout = 'wide' | 'compact';

/** Canvas widths. Wide renders 1:1 on desktop GitHub; compact renders ~1:1 on phones. */
export const WIDTH: Record<Layout, number> = { wide: 800, compact: 400 };

/** Outer padding of the wallpaper card and gap between panels. */
export const PAD: Record<Layout, number> = { wide: 24, compact: 16 };
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

export const DARK: Theme = {
  mode: 'dark',
  wallBase: '#07080E',
  wallOrbs: ['#3B2FD0', '#0A5CFF', '#9B3FD9', '#0FA3B8', '#D13A7A', '#FF8A3D'],
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

export const LIGHT: Theme = {
  mode: 'light',
  wallBase: '#EEF0F7',
  wallOrbs: ['#A5B4FC', '#93C5FD', '#C4B5FD', '#99F6E4', '#F9A8D4', '#FED7AA'],
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
