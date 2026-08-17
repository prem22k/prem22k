import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Text,
  MonoText,
  Label,
  Rule,
  createSVG,
  getTheme,
  type ThemeTokens,
} from './primitives/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

export interface HeroOptions {
  name?: string;
  role?: string;
  focus?: string;
  status?: string;
  mode?: 'dark' | 'light';
}

/**
 * Unified Editorial Hero & Status Header
 * Combines identity, core domains, and current engineering focus into ONE calm composition.
 */
export function renderUnifiedHeroSVG(options: HeroOptions = {}): string {
  const {
    name = 'PREM SAI KOTA',
    role = 'FULL-STACK ENGINEER',
    focus = 'Real-time CRDT systems · local-first AI tooling · infrastructure monitoring',
    status = 'BUILDING: Zync & ServX  ·  EXPLORING: VisionRAG (ColPali) & MCP Agents  ·  HYDERABAD, IN',
    mode = 'dark',
  } = options;

  const theme: ThemeTokens = getTheme(mode);
  const width = 800;
  const height = 130;

  const elements: string[] = [];

  // Canvas background
  elements.push(`<rect width="${width}" height="${height}" fill="${theme.bg}" />`);

  // 1. Role micro-label (IBM Plex Mono uppercase)
  elements.push(
    Label({
      x: 0,
      y: 18,
      text: role,
      color: theme.tertiary,
      letterSpacing: 1.5,
    })
  );

  // 2. Name (Display Sans 26px / 600)
  elements.push(
    Text({
      x: 0,
      y: 52,
      content: name,
      variant: 'display',
      size: 26,
      weight: 600,
      letterSpacing: -0.5,
      color: theme.primary,
    })
  );

  // 3. Focus tagline (Body Sans 13.5px / 400)
  elements.push(
    Text({
      x: 0,
      y: 78,
      content: focus,
      variant: 'body',
      size: 13,
      weight: 400,
      color: theme.secondary,
    })
  );

  // 4. Subtle dividing rule
  elements.push(
    Rule({
      x1: 0,
      y1: 96,
      x2: width,
      y2: 96,
      color: theme.borderSubtle,
    })
  );

  // 5. Current focus strip (IBM Plex Mono 10px)
  elements.push(
    MonoText({
      x: 0,
      y: 114,
      content: status,
      variant: 'technicalMetadata',
      size: 10,
      color: theme.tertiary,
    })
  );

  return createSVG({
    width,
    height,
    title: `${name} — ${role}`,
    description: `${name} | ${role} | ${focus} | ${status}`,
    theme,
    content: elements.join('\n'),
  });
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const darkHero = renderUnifiedHeroSVG({ mode: 'dark' });
  const lightHero = renderUnifiedHeroSVG({ mode: 'light' });

  fs.writeFileSync(path.join(ASSETS_DIR, 'hero-dark.svg'), darkHero, 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'hero-light.svg'), lightHero, 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'hero.svg'), darkHero, 'utf8');

  console.log('✔ Generated unified assets/hero-dark.svg & hero-light.svg');
}
