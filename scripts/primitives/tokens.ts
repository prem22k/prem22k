/**
 * README Design System Tokens
 * Source of truth: README-DESIGN-SYSTEM.md & portfolio/app/globals.css
 */

export interface ThemeTokens {
  mode: 'dark' | 'light';
  bg: string;
  surface: string;
  primary: string;
  secondary: string;
  tertiary: string;
  borderSubtle: string;
  borderStrong: string;
  accent: string;
}

export const THEME_DARK: ThemeTokens = {
  mode: 'dark',
  bg: '#0d1117',
  surface: '#161b22',
  primary: '#F5F2EB',
  secondary: '#A8A29E',
  tertiary: '#78716C',
  borderSubtle: '#2C2825',
  borderStrong: '#57534E',
  accent: '#F5F2EB',
};

export const THEME_LIGHT: ThemeTokens = {
  mode: 'light',
  bg: '#ffffff',
  surface: '#f6f8fa',
  primary: '#1c1917',
  secondary: '#57534e',
  tertiary: '#a8a29e',
  borderSubtle: '#e7e5e4',
  borderStrong: '#a8a29e',
  accent: '#292524',
};

export function getTheme(mode: 'dark' | 'light' = 'dark'): ThemeTokens {
  return mode === 'light' ? THEME_LIGHT : THEME_DARK;
}

export const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";

export const FONT_MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

export const SPACING = {
  s1: 4,
  s2: 6,
  s3: 8,
  s4: 12,
  s5: 16,
  s6: 24,
  s7: 40,
  s8: 56,
} as const;

export const TYPE_SCALE = {
  display: {
    fontFamily: FONT_SANS,
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: -0.5,
    lineHeight: 1.2,
  },
  sectionHeading: {
    fontFamily: FONT_SANS,
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: -0.2,
    lineHeight: 1.2,
  },
  body: {
    fontFamily: FONT_SANS,
    fontSize: 13.5,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.55,
  },
  technicalMetadata: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.8,
    lineHeight: 1.0,
  },
  microLabel: {
    fontFamily: FONT_MONO,
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: 1.2,
    lineHeight: 1.0,
  },
  dataNumber: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.0,
  },
  caption: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    fontWeight: 400,
    letterSpacing: 0.5,
    lineHeight: 1.0,
  },
} as const;
