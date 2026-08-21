#!/usr/bin/env node
/**
 * Output Validation Script for prem22k's Profile Pipeline
 * Stage 3 in WORKFLOW-ARCHITECTURE.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const PROFILE_JSON_PATH = path.join(ROOT_DIR, 'data/profile.json');

console.log('[validate] Validating generated assets and data schema...');

let errorCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✖ ERROR: ${message}`);
    errorCount++;
  }
}

// 1. Validate data/profile.json
assert(fs.existsSync(PROFILE_JSON_PATH), 'data/profile.json must exist');
if (fs.existsSync(PROFILE_JSON_PATH)) {
  try {
    const data = JSON.parse(fs.readFileSync(PROFILE_JSON_PATH, 'utf8'));
    assert(data.identity && data.identity.name, 'profile.json must contain identity.name');
    assert(data.overview && typeof data.overview.publicRepos === 'number', 'profile.json must contain overview.publicRepos');
    assert(data.contributions && data.contributions.currentYear, 'profile.json must contain contributions.currentYear');
    console.log('  ✔ data/profile.json is valid');
  } catch (err) {
    assert(false, `data/profile.json is invalid JSON: ${err.message}`);
  }
}

// 2. Validate all generated SVGs
const requiredSvgs = [
  'hero-dark.svg',
  'hero-light.svg',
  'github-year-dark.svg',
  'github-year-light.svg',
  'project-zync-arch-dark.svg',
  'project-zync-arch-light.svg',
  'project-servx-arch-dark.svg',
  'project-servx-arch-light.svg',
  'project-adviser-cli-arch-dark.svg',
  'project-adviser-cli-arch-light.svg',
  'codebase-dark.svg',
  'codebase-light.svg',
  'stack-dark.svg',
  'stack-light.svg',
  'activity-dark.svg',
  'activity-light.svg',
];

for (const svgFile of requiredSvgs) {
  const filePath = path.join(ASSETS_DIR, svgFile);
  assert(fs.existsSync(filePath), `Asset ${svgFile} must exist`);

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const size = fs.statSync(filePath).size;

    // Syntax & Structure
    assert(content.startsWith('<svg') && content.endsWith('</svg>'), `${svgFile} must be well-formed root <svg>`);
    assert(content.includes('width="800"') || content.includes('width='), `${svgFile} must specify explicit width`);
    assert(content.includes('height='), `${svgFile} must specify explicit height`);
    assert(content.includes('viewBox='), `${svgFile} must specify viewBox`);

    // Budget
    assert(size < 100 * 1024, `${svgFile} size (${Math.round(size / 1024)}KB) must be under 100KB budget`);

    // Prohibited patterns & security
    assert(!/linearGradient/i.test(content), `${svgFile} must not contain linear gradients`);
    assert(!/radialGradient/i.test(content), `${svgFile} must not contain radial gradients`);
    assert(!/feGaussianBlur/i.test(content), `${svgFile} must not contain blur filters`);
    assert(!/rx="[1-9]/.test(content), `${svgFile} must strictly enforce 0 border radius`);
    assert(!/<script/i.test(content), `${svgFile} must not contain <script> tags`);
    assert(!/on\w+="[^"]*"/i.test(content), `${svgFile} must not contain inline event handlers`);
    assert(!/<foreignObject/i.test(content), `${svgFile} must not contain <foreignObject>`);
    assert(!/@import/i.test(content), `${svgFile} must not contain external font @import`);
    assert(!/<link/i.test(content), `${svgFile} must not contain external <link> elements`);
  }
}

console.log(`  ✔ All ${requiredSvgs.length} SVG assets validated against security, size, and design tokens`);

// 3. Validate referenced images in README.md exist on disk
const readmePath = path.join(ROOT_DIR, 'README.md');
assert(fs.existsSync(readmePath), 'README.md must exist');
if (fs.existsSync(readmePath)) {
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const imgMatches = [...readmeContent.matchAll(/(?:src|srcset)="([^"]+)"/g)];
  for (const match of imgMatches) {
    const refPath = match[1];
    if (refPath.startsWith('http://') || refPath.startsWith('https://')) {
      continue; // remote link
    }
    const resolvedPath = path.join(ROOT_DIR, refPath);
    assert(fs.existsSync(resolvedPath), `README.md image reference '${refPath}' must exist on disk`);
  }
  console.log(`  ✔ All ${imgMatches.length} image references in README.md verified on disk`);
}

// 4. Validate timestamp
assert(fs.existsSync(path.join(ROOT_DIR, '.last-updated')), '.last-updated file must exist');

if (errorCount > 0) {
  console.error(`\n✖ Validation FAILED with ${errorCount} error(s).`);
  process.exit(1);
} else {
  console.log('\n✔ All validations PASSED successfully.');
}
