import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Text,
  Label,
  Rule,
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

export interface GitHubStatsOptions {
  data?: FetchedProfileData;
  mode?: 'dark' | 'light';
}

/**
 * Editorial Overview Datasheet.
 * Emphasizes high-signal engineering substance:
 * - Authored repositories & volume
 * - 365-day annual contributions & commit consistency
 * - Estimated source lines of code & multi-language spread
 */
export function renderGitHubStatsSVG(options: GitHubStatsOptions = {}): string {
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

  const authoredRepos = profile?.overview?.authoredRepos ?? 27;
  const publicRepos = profile?.overview?.publicRepos ?? 37;
  const annualContribs = profile?.contributions?.last12MonthsContributions ?? 5207;
  const activeDays = profile?.contributions?.calendar?.filter((d: { count: number }) => d.count > 0).length ?? 211;
  const estimatedLoc = profile?.codebase?.estimatedLines ?? 134197;
  const coreLanguages = profile?.codebase?.languagesCount ?? 10;
  const sourceBytesMb = ((profile?.codebase?.totalBytes ?? 5367897) / (1024 * 1024)).toFixed(1);

  const width = 800;
  const height = 158;

  const elements: string[] = [];

  // Canvas background
  elements.push(`<rect width="${width}" height="${height}" fill="${theme.bg}" />`);

  // Top Section Label
  elements.push(
    Label({
      x: 0,
      y: 16,
      text: 'ANNUAL SYSTEM METRICS · ENGINEERING VOLUME & VELOCITY',
      color: theme.tertiary,
    })
  );

  // 1px top rule
  elements.push(
    Rule({
      x1: 0,
      y1: 26,
      x2: width,
      y2: 26,
      color: theme.borderStrong,
    })
  );

  const colWidth = 266;

  // ── ROW 1: CORE VOLUME & CONSISTENCY (y: 36 to 82) ──────────────────────
  // Col 1: Repositories
  elements.push(
    Text({
      x: 0,
      y: 60,
      content: `${authoredRepos}`,
      variant: 'display',
      size: 30,
      weight: 600,
      color: theme.primary,
    })
  );
  elements.push(
    Label({
      x: 0,
      y: 78,
      text: `AUTHORED REPOSITORIES (${publicRepos} PUBLIC)`,
      color: theme.tertiary,
    })
  );

  // Col 2: Annual Contributions
  elements.push(
    Text({
      x: colWidth,
      y: 60,
      content: annualContribs.toLocaleString(),
      variant: 'display',
      size: 30,
      weight: 600,
      color: theme.primary,
    })
  );
  elements.push(
    Label({
      x: colWidth,
      y: 78,
      text: 'ANNUAL CONTRIBUTIONS (365 DAYS)',
      color: theme.tertiary,
    })
  );

  // Col 3: Consistency
  elements.push(
    Text({
      x: colWidth * 2,
      y: 60,
      content: `${activeDays} / 365`,
      variant: 'display',
      size: 30,
      weight: 600,
      color: theme.primary,
    })
  );
  elements.push(
    Label({
      x: colWidth * 2,
      y: 78,
      text: 'ACTIVE DAYS (58% CONSISTENCY)',
      color: theme.tertiary,
    })
  );

  // 1px middle subtle rule
  elements.push(
    Rule({
      x1: 0,
      y1: 92,
      x2: width,
      y2: 92,
      color: theme.borderSubtle,
    })
  );

  // ── ROW 2: CODE VOLUME & TOOLING SPREAD (y: 102 to 148) ────────────────
  // Col 1: LOC
  elements.push(
    Text({
      x: 0,
      y: 126,
      content: `~${Math.round(estimatedLoc / 1000)}k`,
      variant: 'display',
      size: 30,
      weight: 600,
      color: theme.primary,
    })
  );
  elements.push(
    Label({
      x: 0,
      y: 144,
      text: 'ESTIMATED SOURCE LINES',
      color: theme.tertiary,
    })
  );

  // Col 2: Total Source Volume
  elements.push(
    Text({
      x: colWidth,
      y: 126,
      content: `${sourceBytesMb} MB`,
      variant: 'display',
      size: 30,
      weight: 600,
      color: theme.primary,
    })
  );
  elements.push(
    Label({
      x: colWidth,
      y: 144,
      text: 'RAW SOURCE BYTE VOLUME',
      color: theme.tertiary,
    })
  );

  // Col 3: Core Languages
  elements.push(
    Text({
      x: colWidth * 2,
      y: 126,
      content: `${coreLanguages}`,
      variant: 'display',
      size: 30,
      weight: 600,
      color: theme.primary,
    })
  );
  elements.push(
    Label({
      x: colWidth * 2,
      y: 144,
      text: 'CORE COMPILED LANGUAGES',
      color: theme.tertiary,
    })
  );

  // 1px bottom rule
  elements.push(
    Rule({
      x1: 0,
      y1: 156,
      x2: width,
      y2: 156,
      color: theme.borderSubtle,
    })
  );

  return createSVG({
    width,
    height,
    title: 'Engineering Volume & Velocity Datasheet — Prem Sai Kota',
    description: `Authored Repositories: ${authoredRepos} | Annual Contributions: ${annualContribs.toLocaleString()} | Active Days: ${activeDays}/365 | Source Volume: ${sourceBytesMb}MB (~${Math.round(estimatedLoc / 1000)}k LOC) across ${coreLanguages} languages`,
    theme,
    content: elements.join('\n'),
  });
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const darkSvg = renderGitHubStatsSVG({ mode: 'dark' });
  const lightSvg = renderGitHubStatsSVG({ mode: 'light' });

  fs.writeFileSync(path.join(ASSETS_DIR, 'github-year-dark.svg'), darkSvg, 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'github-year-light.svg'), lightSvg, 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'github-year.svg'), darkSvg, 'utf8');

  console.log('✔ Generated assets/github-year-dark.svg');
  console.log('✔ Generated assets/github-year-light.svg');
}
