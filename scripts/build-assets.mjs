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

import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
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

// Point README.md at content-hashed copies: assets/hero-dark.svg → assets/v/hero-dark.<hash>.svg.
// GitHub serves README images from raw.githubusercontent.com, whose CDN can keep an old copy of a
// same-named file after a push, and the /raw/ redirect drops query strings (so ?v= busting fails).
// A new filename per content change is the only reliable cache key. Identical content is a single
// git blob, so the copies cost no extra storage. Copies older than the previous README are deleted.
function versionReadmeImages() {
  const readmePath = resolve(ROOT_DIR, 'README.md');
  if (!existsSync(readmePath)) return;
  const versionDir = resolve(ASSETS_DIR, 'v');
  mkdirSync(versionDir, { recursive: true });
  const readme = readFileSync(readmePath, 'utf8');
  // Keep the previous generation too: GitHub can serve a cached README for a while after a push,
  // and deleting the copies it points at would show broken images until the cache expires.
  const keep = new Set([...readme.matchAll(/assets\/v\/([\w.-]+\.svg)/g)].map((m) => m[1]));
  const next = readme.replace(
    /((?:src|srcset)=")assets\/(?:v\/)?([\w-]+?)(?:\.[0-9a-f]{8})?\.svg(?:\?v=[0-9a-f]+)?(")/g,
    (m, pre, name, post) => {
      const source = resolve(ASSETS_DIR, `${name}.svg`);
      if (!existsSync(source)) return m;
      const bytes = readFileSync(source);
      const versioned = `${name}.${createHash('sha1').update(bytes).digest('hex').slice(0, 8)}.svg`;
      writeFileSync(resolve(versionDir, versioned), bytes);
      keep.add(versioned);
      return `${pre}assets/v/${versioned}${post}`;
    }
  );
  for (const file of readdirSync(versionDir)) {
    if (!keep.has(file)) rmSync(resolve(versionDir, file));
  }
  if (next !== readme) {
    writeFileSync(readmePath, next, 'utf8');
    console.log('✔ Pointed README.md at content-hashed image copies (assets/v/)');
  }
}

versionReadmeImages();

// .last-updated mirrors the data timestamp so an unchanged fetch produces an unchanged file.
if (data?.generatedAt) {
  writeFileSync(resolve(ROOT_DIR, '.last-updated'), `${data.generatedAt}\n`, 'utf8');
}
