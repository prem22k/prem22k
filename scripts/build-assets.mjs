#!/usr/bin/env node
/**
 * Master SVG Asset Generator for prem22k's GitHub Profile README
 * Design System: Direction A — Portfolio-Derived Editorial
 * Reference: README-DESIGN-SYSTEM.md
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderUnifiedHeroSVG } from './build-hero.ts';
import { renderGitHubStatsSVG } from './build-github-stats.ts';
import { renderZyncArchSVG, renderServXArchSVG, renderAdviserCliArchSVG } from './build-project-diagrams.ts';
import { renderCodebaseSVG } from './build-codebase.ts';
import { renderStackSVG } from './build-stack.ts';
import { renderActivitySVG } from './build-activity.ts';
import { renderRecentWorkSVG } from './build-recent-work.ts';
import { renderPrimitiveSpecimen } from './test/snapshots.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const ASSETS_DIR = resolve(ROOT_DIR, 'assets');
mkdirSync(ASSETS_DIR, { recursive: true });

console.log('[build-assets] Building all design system SVGs...');

const generators = [
  { name: 'hero', fn: (m) => renderUnifiedHeroSVG({ mode: m }) },
  { name: 'github-year', fn: (m) => renderGitHubStatsSVG({ mode: m }) },
  { name: 'project-zync-arch', fn: (m) => renderZyncArchSVG(m) },
  { name: 'project-servx-arch', fn: (m) => renderServXArchSVG(m) },
  { name: 'project-adviser-cli-arch', fn: (m) => renderAdviserCliArchSVG(m) },
  { name: 'codebase', fn: (m) => renderCodebaseSVG({ mode: m }) },
  { name: 'stack', fn: (m) => renderStackSVG(m) },
  { name: 'activity', fn: (m) => renderActivitySVG({ mode: m }) },
  { name: 'recent-work', fn: (m) => renderRecentWorkSVG({ mode: m }) },
  { name: 'primitives-specimen', fn: (m) => renderPrimitiveSpecimen(m) },
];

for (const gen of generators) {
  const darkSvg = gen.fn('dark');
  const lightSvg = gen.fn('light');

  writeFileSync(resolve(ASSETS_DIR, `${gen.name}-dark.svg`), darkSvg, 'utf8');
  writeFileSync(resolve(ASSETS_DIR, `${gen.name}-light.svg`), lightSvg, 'utf8');
  writeFileSync(resolve(ASSETS_DIR, `${gen.name}.svg`), darkSvg, 'utf8');

  console.log(`  ✔ assets/${gen.name}-dark.svg & ${gen.name}-light.svg`);
}

// Update Recent Engineering Activity table in README.md from profile.json
function updateReadmeRecentActivity() {
  const readmePath = resolve(ROOT_DIR, 'README.md');
  const profilePath = resolve(ROOT_DIR, 'data/profile.json');
  if (!existsSync(readmePath) || !existsSync(profilePath)) return;

  try {
    const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
    const events = profile.recentActivity?.events;
    if (!Array.isArray(events) || events.length === 0) return;

    const rows = events.map(e => 
      `| \`${e.date}\` | \`${e.event}\` | [**${e.repository}**](${e.repoUrl}) | ${e.context} |`
    ).join('\n');

    let readme = readFileSync(readmePath, 'utf8');
    const pattern = /(## Recent Engineering Activity\s*\n\n\| Date \| Event \| Repository \| Context \|\n\| :--- \| :--- \| :--- \| :--- \|\n)(?:\|[^\n]+\n)+/;

    if (pattern.test(readme)) {
      readme = readme.replace(pattern, `$1${rows}\n`);
      writeFileSync(readmePath, readme, 'utf8');
      console.log('✔ Updated Recent Engineering Activity table in README.md');
    }
  } catch (err) {
    console.warn('Failed to update README.md recent activity table:', err);
  }
}

updateReadmeRecentActivity();

// Write .last-updated timestamp
const timestamp = new Date().toISOString();
writeFileSync(resolve(ROOT_DIR, '.last-updated'), `${timestamp}\n`, 'utf8');
console.log(`✔ Updated .last-updated timestamp: ${timestamp}`);
