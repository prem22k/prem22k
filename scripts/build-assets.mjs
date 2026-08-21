#!/usr/bin/env node
/**
 * Master SVG Asset Generator for prem22k's GitHub Profile README
 * Design System: Direction A — Portfolio-Derived Editorial
 * Reference: README-DESIGN-SYSTEM.md
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderUnifiedHeroSVG } from './build-hero.ts';
import { renderGitHubStatsSVG } from './build-github-stats.ts';
import { renderZyncArchSVG, renderServXArchSVG, renderAdviserCliArchSVG } from './build-project-diagrams.ts';
import { renderCodebaseSVG } from './build-codebase.ts';
import { renderStackSVG } from './build-stack.ts';
import { renderActivitySVG } from './build-activity.ts';
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

// Write .last-updated timestamp
const timestamp = new Date().toISOString();
writeFileSync(resolve(ROOT_DIR, '.last-updated'), `${timestamp}\n`, 'utf8');
console.log(`✔ Updated .last-updated timestamp: ${timestamp}`);
