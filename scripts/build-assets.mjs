#!/usr/bin/env node
/**
 * Master SVG asset generator for prem22k's GitHub profile README.
 * Design system: Liquid Glass (see README-DESIGN-SYSTEM.md, engine in scripts/glass/).
 *
 * Every component renders 4 variants:
 *   assets/<name>-dark.svg, assets/<name>-light.svg                  (wide, 800px, desktop)
 *   assets/<name>-compact-dark.svg, assets/<name>-compact-light.svg  (compact, 400px, phones)
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderHeroSVG } from './build-hero.ts';
import { renderGitHubStatsSVG } from './build-github-stats.ts';
import { renderProjectCardSVG, PROJECT_SLUGS } from './build-projects.ts';
import { renderCodebaseSVG } from './build-codebase.ts';
import { renderStackSVG } from './build-stack.ts';
import { renderActivitySVG } from './build-activity.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const ASSETS_DIR = resolve(ROOT_DIR, 'assets');
const PROFILE_PATH = resolve(ROOT_DIR, 'data/profile.json');
mkdirSync(ASSETS_DIR, { recursive: true });

const data = existsSync(PROFILE_PATH) ? JSON.parse(readFileSync(PROFILE_PATH, 'utf8')) : undefined;

console.log('[build-assets] Building Liquid Glass SVGs...');

const GENERATORS = [
  { name: 'hero', fn: (o) => renderHeroSVG({ ...o, data }) },
  { name: 'github-year', fn: (o) => renderGitHubStatsSVG({ ...o, data }) },
  ...PROJECT_SLUGS.map((slug) => ({ name: `project-${slug}`, fn: (o) => renderProjectCardSVG({ ...o, slug }) })),
  { name: 'codebase', fn: (o) => renderCodebaseSVG({ ...o, data }) },
  { name: 'stack', fn: (o) => renderStackSVG(o) },
  { name: 'activity', fn: (o) => renderActivitySVG({ ...o, data }) },
];

for (const gen of GENERATORS) {
  for (const layout of ['wide', 'compact']) {
    for (const mode of ['dark', 'light']) {
      const svg = gen.fn({ mode, layout });
      const file = layout === 'wide' ? `${gen.name}-${mode}.svg` : `${gen.name}-compact-${mode}.svg`;
      writeFileSync(resolve(ASSETS_DIR, file), svg, 'utf8');
    }
  }
  console.log(`  ✔ assets/${gen.name}-{dark,light}.svg + compact variants`);
}

// Update the Recent Engineering Activity table in README.md from profile.json
function updateReadmeRecentActivity() {
  const readmePath = resolve(ROOT_DIR, 'README.md');
  if (!existsSync(readmePath) || !data) return;

  const events = data.recentActivity?.events;
  if (!Array.isArray(events) || events.length === 0) return;

  const cell = (s) => String(s).replace(/\|/g, '\\|');
  const rows = events
    .map((e) => `| \`${e.date}\` | \`${e.event}\` | [**${cell(e.repository)}**](${e.repoUrl}) | ${cell(e.context)} |`)
    .join('\n');

  let readme = readFileSync(readmePath, 'utf8');
  const pattern = /(\| Date \| Event \| Repository \| Context \|\n\| :--- \| :--- \| :--- \| :--- \|\n)(?:\|[^\n]+\n)+/;

  if (pattern.test(readme)) {
    readme = readme.replace(pattern, `$1${rows}\n`);
    writeFileSync(readmePath, readme, 'utf8');
    console.log('✔ Updated Recent Engineering Activity table in README.md');
  }
}

updateReadmeRecentActivity();

// .last-updated mirrors the data timestamp so an unchanged fetch produces an unchanged file.
if (data?.generatedAt) {
  writeFileSync(resolve(ROOT_DIR, '.last-updated'), `${data.generatedAt}\n`, 'utf8');
}
