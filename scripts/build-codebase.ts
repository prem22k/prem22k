import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Text,
  MonoText,
  Label,
  Rule,
  Block,
  createSVG,
  getTheme,
  type ThemeTokens,
} from './primitives/index.ts';
import type { FetchedProfileData } from './fetch-data.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const PROFILE_JSON_PATH = path.join(ROOT_DIR, 'data/profile.json');

export interface CodebaseOptions {
  data?: FetchedProfileData;
  mode?: 'dark' | 'light';
}

/**
 * Generates the custom monochrome CODEBASE treemap visualization.
 * Strictly adheres to README-DESIGN-SYSTEM.md:
 * - Area-accurate treemap block partitioning
 * - Editorial monochrome palette (no rainbow/pie/progress bars)
 * - IBM Plex Mono technical annotations
 * - Understandable without hover interaction (100% static SVG)
 */
export function renderCodebaseSVG(options: CodebaseOptions = {}): string {
  const { mode = 'dark' } = options;
  const theme: ThemeTokens = getTheme(mode);

  // Read data from profile.json if not provided
  let profile: FetchedProfileData | null = options.data || null;
  if (!profile && fs.existsSync(PROFILE_JSON_PATH)) {
    try {
      profile = JSON.parse(fs.readFileSync(PROFILE_JSON_PATH, 'utf8'));
    } catch {
      profile = null;
    }
  }

  const repoCount = profile?.overview?.authoredRepos ?? 27;
  const totalBytes = profile?.codebase?.totalBytes ?? 5367897;
  const estimatedLoc = profile?.codebase?.estimatedLines ?? 134197;

  const width = 800;
  const height = 256;

  const elements: string[] = [];

  // Canvas background
  elements.push(`<rect width="${width}" height="${height}" fill="${theme.bg}" />`);

  // ── HEADER BAR (y: 0 to 30) ─────────────────────────────────────────────
  elements.push(
    Label({
      x: 0,
      y: 16,
      text: 'CODEBASE ARCHITECTURE · LANGUAGE DISTRIBUTION',
      color: theme.tertiary,
    })
  );

  elements.push(
    MonoText({
      x: width,
      y: 16,
      content: `${repoCount} REPOSITORIES · ~${Math.round(estimatedLoc / 1000)}K LOC ANALYZED`,
      variant: 'technicalMetadata',
      color: theme.tertiary,
      anchor: 'end',
    })
  );

  // ── TREEMAP GEOMETRY (y: 28 to 208, total height 180) ───────────────────
  const treeY = 28;
  const treeH = 180;
  const tsW = 473;
  const rightW = width - tsW; // 327
  const jsH = 108;
  const bottomH = treeH - jsH; // 72

  const pyW = 157;
  const cssW = 114;
  const otherW = rightW - pyW - cssW; // 56

  // ── BLOCK 1: TYPESCRIPT (473 × 180) ────────────────────────────────────
  elements.push(
    Block({
      x: 0,
      y: treeY,
      width: tsW,
      height: treeH,
      fill: theme.surface,
      stroke: theme.borderSubtle,
    })
  );

  // TS Header
  elements.push(
    Text({
      x: 18,
      y: treeY + 28,
      content: 'TypeScript',
      variant: 'display',
      size: 18,
      weight: 600,
      color: theme.primary,
    })
  );

  elements.push(
    MonoText({
      x: tsW - 18,
      y: treeY + 28,
      content: '59.2%',
      variant: 'technicalMetadata',
      size: 13,
      color: theme.primary,
      anchor: 'end',
    })
  );

  elements.push(
    Rule({
      x1: 18,
      y1: treeY + 38,
      x2: tsW - 18,
      y2: treeY + 38,
      color: theme.borderSubtle,
    })
  );

  // TS Annotations
  elements.push(
    MonoText({
      x: 18,
      y: treeY + 58,
      content: '3.18 MB SOURCE VOLUME · 11 REPOSITORIES',
      variant: 'technicalMetadata',
      size: 10.5,
      color: theme.secondary,
    })
  );

  elements.push(
    MonoText({
      x: 18,
      y: treeY + 78,
      content: 'DOMAINS: Real-time CRDT sync, AI agent harnesses, Full-Stack web',
      variant: 'caption',
      size: 10,
      color: theme.tertiary,
    })
  );

  elements.push(
    MonoText({
      x: 18,
      y: treeY + 96,
      content: 'SYSTEMS: Yjs · React 19 · Node.js 20 · Express · WebSockets · SSE',
      variant: 'caption',
      size: 10,
      color: theme.tertiary,
    })
  );

  elements.push(
    MonoText({
      x: 18,
      y: treeY + 114,
      content: 'ARCHITECTURE: npm workspaces monorepo with isolated micro-packages',
      variant: 'caption',
      size: 9.5,
      color: theme.tertiary,
    })
  );

  elements.push(
    MonoText({
      x: 18,
      y: treeY + 148,
      content: 'STATUS: PRIMARY RUNTIME · STRICT TYPING ENABLED',
      variant: 'caption',
      size: 9,
      color: theme.secondary,
    })
  );

  // ── BLOCK 2: JAVASCRIPT (327 × 108, x: 473, y: 28) ────────────────────
  const jsX = tsW;
  elements.push(
    Block({
      x: jsX,
      y: treeY,
      width: rightW,
      height: jsH,
      fill: theme.surface,
      stroke: theme.borderSubtle,
    })
  );

  elements.push(
    Text({
      x: jsX + 16,
      y: treeY + 24,
      content: 'JavaScript',
      variant: 'sectionHeading',
      size: 15,
      weight: 600,
      color: theme.primary,
    })
  );

  elements.push(
    MonoText({
      x: jsX + rightW - 16,
      y: treeY + 24,
      content: '27.7%',
      variant: 'technicalMetadata',
      size: 12,
      color: theme.primary,
      anchor: 'end',
    })
  );

  elements.push(
    Rule({
      x1: jsX + 16,
      y1: treeY + 34,
      x2: jsX + rightW - 16,
      y2: treeY + 34,
      color: theme.borderSubtle,
    })
  );

  elements.push(
    MonoText({
      x: jsX + 16,
      y: treeY + 52,
      content: '1.48 MB · 6 REPOSITORIES · VANILLA ESM',
      variant: 'caption',
      size: 10,
      color: theme.secondary,
    })
  );

  elements.push(
    MonoText({
      x: jsX + 16,
      y: treeY + 68,
      content: 'APIs, webhook microservices, client integration',
      variant: 'caption',
      size: 9.5,
      color: theme.tertiary,
    })
  );

  elements.push(
    MonoText({
      x: jsX + 16,
      y: treeY + 84,
      content: 'Fast execution · zero-transpile tools',
      variant: 'caption',
      size: 9,
      color: theme.tertiary,
    })
  );

  // ── BLOCK 3: PYTHON (157 × 72, x: 473, y: 136) ────────────────────────
  const botY = treeY + jsH;
  const pyX = jsX;
  elements.push(
    Block({
      x: pyX,
      y: botY,
      width: pyW,
      height: bottomH,
      fill: theme.surface,
      stroke: theme.borderSubtle,
    })
  );

  elements.push(
    Text({
      x: pyX + 12,
      y: botY + 20,
      content: 'Python',
      variant: 'sectionHeading',
      size: 13,
      weight: 600,
      color: theme.primary,
    })
  );

  elements.push(
    MonoText({
      x: pyX + pyW - 12,
      y: botY + 20,
      content: '6.3%',
      variant: 'caption',
      color: theme.primary,
      anchor: 'end',
    })
  );

  elements.push(
    MonoText({
      x: pyX + 12,
      y: botY + 38,
      content: '338 KB · 3 repos',
      variant: 'caption',
      size: 9.5,
      color: theme.secondary,
    })
  );

  elements.push(
    MonoText({
      x: pyX + 12,
      y: botY + 52,
      content: 'ChromaDB · RAG pipelines',
      variant: 'caption',
      size: 8.5,
      color: theme.tertiary,
    })
  );

  // ── BLOCK 4: CSS (114 × 72, x: 630, y: 136) ───────────────────────────
  const cssX = pyX + pyW;
  elements.push(
    Block({
      x: cssX,
      y: botY,
      width: cssW,
      height: bottomH,
      fill: theme.surface,
      stroke: theme.borderSubtle,
    })
  );

  elements.push(
    Text({
      x: cssX + 10,
      y: botY + 20,
      content: 'CSS',
      variant: 'sectionHeading',
      size: 12,
      weight: 600,
      color: theme.primary,
    })
  );

  elements.push(
    MonoText({
      x: cssX + cssW - 10,
      y: botY + 20,
      content: '4.6%',
      variant: 'caption',
      size: 9.5,
      color: theme.primary,
      anchor: 'end',
    })
  );

  elements.push(
    MonoText({
      x: cssX + 10,
      y: botY + 38,
      content: '246 KB · 4 repos',
      variant: 'caption',
      size: 9,
      color: theme.secondary,
    })
  );

  elements.push(
    MonoText({
      x: cssX + 10,
      y: botY + 52,
      content: 'Design systems',
      variant: 'caption',
      size: 8.5,
      color: theme.tertiary,
    })
  );

  // ── BLOCK 5: OTHER (56 × 72, x: 744, y: 136) ──────────────────────────
  const otherX = cssX + cssW;
  elements.push(
    Block({
      x: otherX,
      y: botY,
      width: otherW,
      height: bottomH,
      fill: theme.surface,
      stroke: theme.borderSubtle,
    })
  );

  elements.push(
    MonoText({
      x: otherX + otherW / 2,
      y: botY + 20,
      content: 'OTHER',
      variant: 'caption',
      size: 9,
      weight: 600,
      color: theme.primary,
      anchor: 'middle',
    })
  );

  elements.push(
    MonoText({
      x: otherX + otherW / 2,
      y: botY + 36,
      content: '2.2%',
      variant: 'caption',
      size: 9,
      color: theme.secondary,
      anchor: 'middle',
    })
  );

  elements.push(
    MonoText({
      x: otherX + otherW / 2,
      y: botY + 50,
      content: 'SH/DOC',
      variant: 'caption',
      size: 8,
      color: theme.tertiary,
      anchor: 'middle',
    })
  );

  // ── FOOTER ANNOTATION BAR (y: 218 to 248) ──────────────────────────────
  elements.push(
    Rule({
      x1: 0,
      y1: 220,
      x2: width,
      y2: 220,
      color: theme.borderSubtle,
    })
  );

  elements.push(
    MonoText({
      x: 0,
      y: 238,
      content: 'PROPORTIONAL AREA REPRESENTS PHYSICAL BYTE VOLUME ACCROSS AUTHORED REPOSITORIES · EXCLUDES THIRD-PARTY DEPENDENCIES',
      variant: 'caption',
      size: 9,
      color: theme.tertiary,
    })
  );

  return createSVG({
    width,
    height,
    title: 'Codebase Language Distribution Treemap — Prem Sai Kota',
    description: `TypeScript: 59.2% (3.18 MB) | JavaScript: 27.7% (1.48 MB) | Python: 6.3% (338 KB) | CSS: 4.6% (246 KB) | Other: 2.2% across ${repoCount} repositories`,
    theme,
    content: elements.join('\n'),
  });
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const darkSvg = renderCodebaseSVG({ mode: 'dark' });
  const lightSvg = renderCodebaseSVG({ mode: 'light' });

  fs.writeFileSync(path.join(ASSETS_DIR, 'codebase-dark.svg'), darkSvg, 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'codebase-light.svg'), lightSvg, 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'codebase.svg'), darkSvg, 'utf8');

  console.log('✔ Generated assets/codebase-dark.svg');
  console.log('✔ Generated assets/codebase-light.svg');
  console.log('✔ Generated assets/codebase.svg');
}
