#!/usr/bin/env node
/**
 * Output validation for prem22k's profile pipeline (Stage 3 in WORKFLOW-ARCHITECTURE.md).
 * Checks data shape, every generated SVG variant (structure, safety, budget, embedded font),
 * and that every image the README references exists.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

// 1. data/profile.json
assert(fs.existsSync(PROFILE_JSON_PATH), 'data/profile.json must exist');
if (fs.existsSync(PROFILE_JSON_PATH)) {
  try {
    const data = JSON.parse(fs.readFileSync(PROFILE_JSON_PATH, 'utf8'));
    assert(data.identity && data.identity.name, 'profile.json must contain identity.name');
    assert(data.overview && typeof data.overview.publicRepos === 'number', 'profile.json must contain overview.publicRepos');
    assert(data.contributions && data.contributions.currentYear, 'profile.json must contain contributions.currentYear');
    assert(Array.isArray(data.contributions?.calendar) && data.contributions.calendar.length >= 365, 'profile.json must contain a 365-day calendar');
    console.log('  ✔ data/profile.json is valid');
  } catch (err) {
    assert(false, `data/profile.json is invalid JSON: ${err.message}`);
  }
}

// 2. Generated SVGs: 4 variants per component
const COMPONENTS = [
  { name: 'hero', budgetKb: 80 },
  { name: 'github-year', budgetKb: 80 },
  { name: 'section-work', budgetKb: 60 },
  { name: 'project-zync', budgetKb: 280 },
  { name: 'project-mahayuddh', budgetKb: 280 },
  { name: 'project-nexus', budgetKb: 280 },
  { name: 'project-servx', budgetKb: 280 },
  { name: 'codebase', budgetKb: 80 },
  { name: 'stack', budgetKb: 80 },
  { name: 'activity', budgetKb: 120 },
  { name: 'timeline', budgetKb: 80 },
  { name: 'journey', budgetKb: 80 },
];
const BUTTON_IDS = ['portfolio', 'linkedin', 'x', 'threads', 'email', 'live', 'source'];
const VARIANTS = ['dark', 'light', 'compact-dark', 'compact-light'];

let svgCount = 0;
for (const { name, budgetKb } of COMPONENTS) {
  for (const variant of VARIANTS) {
    const svgFile = `${name}-${variant}.svg`;
    const filePath = path.join(ASSETS_DIR, svgFile);
    assert(fs.existsSync(filePath), `Asset ${svgFile} must exist`);
    if (!fs.existsSync(filePath)) continue;
    svgCount++;

    const content = fs.readFileSync(filePath, 'utf8').trim();
    const size = fs.statSync(filePath).size;
    const expectedWidth = variant.startsWith('compact') ? 400 : 800;

    // Structure
    assert(content.startsWith('<svg') && content.endsWith('</svg>'), `${svgFile} must be a well-formed root <svg>`);
    const root = content.slice(0, content.indexOf('>'));
    assert(new RegExp(`\\bwidth="${expectedWidth}"`).test(root), `${svgFile} must be ${expectedWidth}px wide`);
    assert(/\bheight="\d+(\.\d+)?"/.test(root), `${svgFile} must specify an explicit height`);
    assert(/viewBox="0 0 /.test(root), `${svgFile} must specify a viewBox`);
    assert(/<title>[^<]+<\/title>/.test(content), `${svgFile} must have an accessible <title>`);

    // Spacing rhythm: the canvas edge to the first/last panel is exactly PAD (12 wide, 10 compact),
    // so one <br /> between images gives every gap on the page the same size.
    const boxes = [...content.matchAll(/data-box="([\d.]+),([\d.]+),([\d.]+),([\d.]+)"/g)].map((m) => m.slice(1).map(Number));
    if (boxes.length) {
      const pad = variant.startsWith('compact') ? 10 : 12;
      const height = Number(root.match(/\bheight="([\d.]+)"/)[1]);
      const top = Math.min(...boxes.map((b) => b[1]));
      const bottom = height - Math.max(...boxes.map((b) => b[1] + b[3]));
      assert(Math.abs(top - pad) < 0.5 && Math.abs(bottom - pad) < 0.5, `${svgFile} must have ${pad}px above and below its panels (has ${top} / ${bottom})`);
    }

    // Budget
    assert(size < budgetKb * 1024, `${svgFile} size (${Math.round(size / 1024)}KB) must be under ${budgetKb}KB`);

    // Embedded font (text must render identically everywhere)
    assert(/@font-face\{font-family:'InterGlass(Display)?';src:url\(data:font\/woff2;base64,/.test(content), `${svgFile} must embed its Inter subset`);

    // Safety: GitHub renders these in <img>, so anything external or executable is dead weight or worse
    assert(!/<script/i.test(content), `${svgFile} must not contain <script>`);
    assert(!/\son[a-z]+\s*=/i.test(content), `${svgFile} must not contain inline event handlers`);
    assert(!/<foreignObject/i.test(content), `${svgFile} must not contain <foreignObject>`);
    assert(!/@import/i.test(content), `${svgFile} must not contain @import`);
    assert(!/(?:href|src)="(?!#|data:)/i.test(content), `${svgFile} must not reference external resources`);
    assert(!/url\((?!#|data:)/i.test(content), `${svgFile} must not reference external URLs in CSS`);
    assert(!/<animate|@keyframes/i.test(content), `${svgFile} must be static (no animation)`);
  }
}
for (const id of BUTTON_IDS) {
  for (const mode of ['dark', 'light']) {
    const svgFile = `btn-${id}-${mode}.svg`;
    const filePath = path.join(ASSETS_DIR, svgFile);
    assert(fs.existsSync(filePath), `Asset ${svgFile} must exist`);
    if (!fs.existsSync(filePath)) continue;
    svgCount++;
    const content = fs.readFileSync(filePath, 'utf8').trim();
    assert(content.startsWith('<svg') && content.endsWith('</svg>'), `${svgFile} must be a well-formed root <svg>`);
    assert(fs.statSync(filePath).size < 30 * 1024, `${svgFile} must be under 30KB`);
    // Buttons sit right under their card: 0 above the capsule, the cards' 12px below it.
    const box = content.match(/data-box="([\d.]+),([\d.]+),([\d.]+),([\d.]+)"/);
    const btnHeight = Number(content.slice(0, content.indexOf('>')).match(/\bheight="([\d.]+)"/)[1]);
    assert(box && Math.abs(Number(box[2])) < 0.5 && Math.abs(btnHeight - Number(box[2]) - Number(box[4]) - 12) < 0.5, `${svgFile} must have 0px above and 12px below its capsule`);
    assert(/@font-face\{font-family:'InterGlass(Display)?';src:url\(data:font\/woff2;base64,/.test(content), `${svgFile} must embed its Inter subset`);
    assert(!/<script|<foreignObject|@import|<animate|@keyframes/i.test(content), `${svgFile} must be static and script-free`);
    assert(!/(?:href|src)="(?!#|data:)/i.test(content) && !/url\((?!#|data:)/i.test(content), `${svgFile} must not reference external resources`);
  }
}
console.log(`  ✔ ${svgCount} SVG assets validated (structure, budget, embedded font, safety)`);

// 3. README image references exist
const readmePath = path.join(ROOT_DIR, 'README.md');
assert(fs.existsSync(readmePath), 'README.md must exist');
if (fs.existsSync(readmePath)) {
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  assert(!/<br \/>\s*<br \/>/.test(readmeContent), 'README.md must separate blocks with a single <br /> (spacing lives in the SVGs)');
  const imgMatches = [...readmeContent.matchAll(/(?:src|srcset)="([^"]+)"/g)];
  for (const match of imgMatches) {
    const refPath = match[1].split('?')[0];
    if (/^https?:\/\//.test(refPath)) continue;
    assert(fs.existsSync(path.join(ROOT_DIR, refPath)), `README.md image reference '${refPath}' must exist on disk`);
  }
  console.log(`  ✔ All ${imgMatches.length} image references in README.md verified on disk`);
}

// 4. Timestamp
assert(fs.existsSync(path.join(ROOT_DIR, '.last-updated')), '.last-updated file must exist');

if (errorCount > 0) {
  console.error(`\n✖ Validation FAILED with ${errorCount} error(s).`);
  process.exit(1);
} else {
  console.log('\n✔ All validations PASSED successfully.');
}
