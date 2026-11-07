#!/usr/bin/env node
/**
 * Master SVG asset generator for prem22k's GitHub profile README.
 * Design system: Liquid Glass (see README-DESIGN-SYSTEM.md, engine in scripts/glass/).
 *
 * Every card renders 4 variants:
 *   assets/<name>-dark.svg, assets/<name>-light.svg                  (wide, 800px, desktop)
 *   assets/<name>-compact-dark.svg, assets/<name>-compact-light.svg  (compact, 400px, phones)
 * Link buttons render 2 variants: assets/btn-<id>-{dark,light}.svg
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { renderHeroSVG } from './build-hero.ts';
import { renderGitHubStatsSVG } from './build-github-stats.ts';
import { renderProjectCardSVG, PROJECT_SLUGS } from './build-projects.ts';
import { renderCodebaseSVG } from './build-codebase.ts';
import { renderStackSVG } from './build-stack.ts';
import { renderActivitySVG } from './build-activity.ts';
import { renderSectionHeaderSVG } from './build-section.ts';
import { renderTimelineSVG } from './build-timeline.ts';
import { renderJourneySVG } from './build-journey.ts';
import { renderButtonSVG, BUTTONS } from './build-buttons.ts';

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
  { name: 'section-work', fn: (o) => renderSectionHeaderSVG({ ...o, id: 'work' }) },
  ...PROJECT_SLUGS.map((slug) => ({ name: `project-${slug}`, fn: (o) => renderProjectCardSVG({ ...o, slug }) })),
  { name: 'codebase', fn: (o) => renderCodebaseSVG({ ...o, data }) },
  { name: 'stack', fn: (o) => renderStackSVG(o) },
  { name: 'activity', fn: (o) => renderActivitySVG({ ...o, data }) },
  { name: 'timeline', fn: (o) => renderTimelineSVG({ ...o, data }) },
  { name: 'journey', fn: (o) => renderJourneySVG(o) },
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

for (const { id } of BUTTONS) {
  for (const mode of ['dark', 'light']) {
    writeFileSync(resolve(ASSETS_DIR, `btn-${id}-${mode}.svg`), renderButtonSVG({ id, mode }), 'utf8');
  }
}
console.log(`  ✔ assets/btn-{${BUTTONS.map((b) => b.id).join(',')}}-{dark,light}.svg`);

// Version every local image URL in README.md by content hash (assets/x.svg?v=1a2b3c4d).
// GitHub serves README images through a CDN that can keep an old copy of a same-named file
// after a push; a new URL per content change means visitors never see a stale card.
function versionReadmeImages() {
  const readmePath = resolve(ROOT_DIR, 'README.md');
  if (!existsSync(readmePath)) return;
  const readme = readFileSync(readmePath, 'utf8');
  const next = readme.replace(/((?:src|srcset)=")((?:assets\/)?[\w./-]+\.(?:svg|gif|png|webp))(?:\?v=[0-9a-f]+)?(")/g, (m, pre, file, post) => {
    const abs = resolve(ROOT_DIR, file);
    if (!existsSync(abs)) return m;
    const v = createHash('sha1').update(readFileSync(abs)).digest('hex').slice(0, 8);
    return `${pre}${file}?v=${v}${post}`;
  });
  if (next !== readme) {
    writeFileSync(readmePath, next, 'utf8');
    console.log('✔ Versioned image URLs in README.md');
  }
}

versionReadmeImages();

// .last-updated mirrors the data timestamp so an unchanged fetch produces an unchanged file.
if (data?.generatedAt) {
  writeFileSync(resolve(ROOT_DIR, '.last-updated'), `${data.generatedAt}\n`, 'utf8');
}
