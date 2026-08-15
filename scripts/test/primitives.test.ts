import test from 'node:test';
import assert from 'node:assert/strict';

import {
  Text,
  MonoText,
  Rule,
  Label,
  NumberPrimitive as Number,
  ImageFrame,
  ArrowLink,
  Metric,
  TimelineRow,
  GridCell,
  Bar,
  Block,
  Divider,
  Icon,
  createSVG,
  escapeXml,
  THEME_DARK,
  THEME_LIGHT,
  FONT_SANS,
  FONT_MONO,
} from '../primitives/index.ts';

test('Utility: escapeXml sanitizes special characters', () => {
  assert.strictEqual(escapeXml('A & B < C > "D" \'E\''), 'A &amp; B &lt; C &gt; &quot;D&quot; &apos;E&apos;');
  assert.strictEqual(escapeXml(null), '');
  assert.strictEqual(escapeXml(undefined), '');
  assert.strictEqual(escapeXml(123), '123');
});

test('Primitive: Text produces valid sans-serif element', () => {
  const svg = Text({
    x: 10,
    y: 20,
    content: 'Full-Stack Engineer',
    variant: 'display',
    color: THEME_DARK.primary,
  });

  assert.match(svg, /^<text /);
  assert.match(svg, /font-family="-apple-system/);
  assert.match(svg, /font-size="24"/);
  assert.match(svg, /font-weight="600"/);
  assert.match(svg, /fill="#F5F2EB"/);
  assert.match(svg, />Full-Stack Engineer<\/text>$/);
});

test('Primitive: MonoText produces valid monospace element with tracking', () => {
  const svg = MonoText({
    x: 0,
    y: 15,
    content: 'INFRASTRUCTURE',
    variant: 'microLabel',
    color: THEME_DARK.tertiary,
    uppercase: true,
  });

  assert.match(svg, /^<text /);
  assert.match(svg, /font-family="ui-monospace/);
  assert.match(svg, /font-size="10.5"/);
  assert.match(svg, /letter-spacing="1.2"/);
  assert.match(svg, /fill="#78716C"/);
  assert.match(svg, />INFRASTRUCTURE<\/text>$/);
});

test('Primitive: Label renders uppercase micro label', () => {
  const svg = Label({
    x: 20,
    y: 30,
    text: 'selected work',
  });

  assert.match(svg, />SELECTED WORK<\/text>/);
  assert.match(svg, /font-size="10.5"/);
});

test('Primitive: Number renders zero-padded mono index', () => {
  const svg = Number({
    x: 0,
    y: 10,
    value: 1,
    pad: 2,
    color: THEME_DARK.tertiary,
  });

  assert.match(svg, />01<\/text>/);
  assert.match(svg, /font-family="ui-monospace/);
});

test('Primitive: Rule renders 1px stroke line', () => {
  const svg = Rule({
    x1: 0,
    y1: 50,
    x2: 800,
    y2: 50,
    color: THEME_DARK.borderSubtle,
    strokeWidth: 1,
  });

  assert.strictEqual(
    svg,
    '<line x1="0" y1="50" x2="800" y2="50" stroke="#2C2825" stroke-width="1" />'
  );
});

test('Primitive: Divider renders section rule with optional label', () => {
  const simple = Divider({ x: 0, y: 100, width: 800, color: THEME_DARK.borderSubtle });
  assert.match(simple, /^<line /);

  const labeled = Divider({
    x: 0,
    y: 100,
    width: 800,
    label: 'EXPERIENCE',
    color: THEME_DARK.borderSubtle,
  });
  assert.match(labeled, />EXPERIENCE<\/text>/);
  assert.match(labeled, /<line x1="0" y1="100" x2="800" y2="100"/);
});

test('Primitive: Block enforces 0 border radius', () => {
  const svg = Block({
    x: 10,
    y: 10,
    width: 200,
    height: 100,
    fill: THEME_DARK.surface,
    stroke: THEME_DARK.borderSubtle,
  });

  assert.match(svg, /rx="0" ry="0"/);
  assert.doesNotMatch(svg, /rx="[1-9]/);
  assert.doesNotMatch(svg, /ry="[1-9]/);
  assert.match(svg, /fill="#161b22"/);
  assert.match(svg, /stroke="#2C2825"/);
});

test('Primitive: ImageFrame renders sharp container with optional caption', () => {
  const svg = ImageFrame({
    x: 0,
    y: 0,
    width: 400,
    height: 200,
    placeholderText: '[servx.png]',
    theme: THEME_DARK,
  });

  assert.match(svg, /<rect /);
  assert.match(svg, /rx="0" ry="0"/);
  assert.match(svg, />\[servx\.png\]<\/text>/);
});

test('Primitive: ArrowLink renders crisp geometric path with miter joints', () => {
  const upRight = ArrowLink({ x: 10, y: 10, size: 14, color: THEME_DARK.secondary, direction: 'up-right' });
  assert.match(upRight, /stroke-linecap="square"/);
  assert.match(upRight, /stroke-linejoin="miter"/);
  assert.match(upRight, /fill="none"/);

  const right = ArrowLink({ x: 10, y: 10, size: 14, direction: 'right' });
  assert.match(right, /stroke-linecap="square"/);
});

test('Primitive: Metric renders vertical and horizontal layout', () => {
  const vertical = Metric({
    x: 0,
    y: 0,
    label: 'REPOSITORIES',
    value: '27',
    subtext: 'active public',
    theme: THEME_DARK,
  });
  assert.match(vertical, />REPOSITORIES<\/text>/);
  assert.match(vertical, />27<\/text>/);
  assert.match(vertical, />active public<\/text>/);

  const horizontal = Metric({
    x: 0,
    y: 0,
    label: 'STATUS',
    value: 'OPEN',
    orientation: 'horizontal',
    theme: THEME_DARK,
  });
  assert.match(horizontal, />STATUS<\/text>/);
  assert.match(horizontal, />OPEN<\/text>/);
});

test('Primitive: Bar renders flat monochrome proportional rect with zero radius', () => {
  const svg = Bar({
    x: 0,
    y: 0,
    width: 200,
    height: 8,
    value: 75,
    max: 100,
    fill: THEME_DARK.primary,
    trackFill: THEME_DARK.surface,
  });

  assert.match(svg, /width="200"/); // track
  assert.match(svg, /width="150"/); // 75% of 200 = 150
  assert.match(svg, /rx="0" ry="0"/);
  assert.doesNotMatch(svg, /linearGradient/);
});

test('Primitive: TimelineRow renders date, title, subtitle, and bottom rule', () => {
  const svg = TimelineRow({
    x: 0,
    y: 0,
    width: 800,
    date: '2026',
    title: 'Software Engineer Intern',
    subtitle: 'RigorBase · Real-time pipeline architecture',
    badge: 'INTERNSHIP',
    theme: THEME_DARK,
  });

  assert.match(svg, />2026<\/text>/);
  assert.match(svg, />Software Engineer Intern<\/text>/);
  assert.match(svg, />RigorBase · Real-time pipeline architecture<\/text>/);
  assert.match(svg, />INTERNSHIP<\/text>/);
  assert.match(svg, /<line x1="0" y1="46" x2="800" y2="46"/);
});

test('Primitive: GridCell renders category box with items and zero radius', () => {
  const svg = GridCell({
    x: 0,
    y: 0,
    width: 250,
    height: 180,
    index: 1,
    title: 'LANGUAGES & CORE',
    items: ['TypeScript', 'JavaScript', 'Python', 'Go'],
    theme: THEME_DARK,
  });

  assert.match(svg, />01<\/text>/);
  assert.match(svg, />LANGUAGES &amp; CORE<\/text>/);
  assert.match(svg, />TypeScript<\/text>/);
  assert.match(svg, />Go<\/text>/);
  assert.match(svg, /rx="0" ry="0"/);
});

test('Primitive: Icon renders lightweight vector geometry', () => {
  const names = [
    'terminal',
    'code',
    'git-branch',
    'layers',
    'shield',
    'cpu',
    'folder',
    'arrow-up-right',
    'arrow-right',
    'external-link',
    'circle-dot',
    'hash',
    'clock',
    'check',
  ] as const;

  for (const name of names) {
    const svg = Icon({ name, x: 0, y: 0, size: 16, color: THEME_DARK.secondary });
    assert.match(svg, /^<g /);
    assert.match(svg, /stroke-linecap="square"/);
    assert.match(svg, /<\/g>$/);
  }
});

test('Anti-Pattern Guard: Zero prohibited elements in output', () => {
  const combinedOutput = [
    Text({ x: 0, y: 0, content: 'Test' }),
    MonoText({ x: 0, y: 0, content: 'Test' }),
    Rule({ x1: 0, y1: 0, x2: 100, y2: 0 }),
    Block({ x: 0, y: 0, width: 100, height: 100 }),
    ImageFrame({ x: 0, y: 0, width: 100, height: 100 }),
    Bar({ x: 0, y: 0, width: 100, height: 10, value: 50 }),
    GridCell({ x: 0, y: 0, width: 100, height: 100, title: 'T', items: ['A'] }),
  ].join('\n');

  assert.doesNotMatch(combinedOutput, /linearGradient/i, 'No linear gradients');
  assert.doesNotMatch(combinedOutput, /radialGradient/i, 'No radial gradients');
  assert.doesNotMatch(combinedOutput, /feGaussianBlur/i, 'No blur filters');
  assert.doesNotMatch(combinedOutput, /drop-shadow/i, 'No drop shadows');
  assert.doesNotMatch(combinedOutput, /rx="[1-9]/, 'No positive border radius');
});

test('SVGDocument: createSVG produces valid root element', () => {
  const doc = createSVG({
    width: 800,
    height: 400,
    title: 'Test Component',
    content: '<rect x="0" y="0" width="800" height="400" fill="#0d1117" />',
    theme: THEME_DARK,
  });

  assert.match(doc, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="800" height="400" viewBox="0 0 800 400" fill="none" role="img" aria-label="Test Component">/);
  assert.match(doc, /<title>Test Component<\/title>/);
  assert.match(doc, /<\/svg>$/);
});test('Component: Hero SVG produces valid editorial header', async () => {
  const { renderUnifiedHeroSVG } = await import('../build-hero.ts');
  const svg = renderUnifiedHeroSVG({ mode: 'dark' });

  assert.match(svg, /PREM SAI KOTA/);
  assert.match(svg, /FULL-STACK ENGINEER/);
  assert.match(svg, /BUILDING: Zync/);
  assert.match(svg, /width="800"/);
  assert.doesNotMatch(svg, /rx="[1-9]/);
  assert.doesNotMatch(svg, /linearGradient/);
});

test('Component: GitHub Stats Datasheet SVG produces valid typographic metrics', async () => {
  const { renderGitHubStatsSVG } = await import('../build-github-stats.ts');
  const svg = renderGitHubStatsSVG({ mode: 'dark' });

  assert.match(svg, /AUTHORED REPOSITORIES/);
  assert.match(svg, /ANNUAL CONTRIBUTIONS/);
  assert.match(svg, /ACTIVE DAYS/);
  assert.match(svg, /ESTIMATED SOURCE LINES/);
  assert.match(svg, /CORE COMPILED LANGUAGES/);
  assert.match(svg, /width="800"/);
  assert.doesNotMatch(svg, /rx="[1-9]/);
  assert.doesNotMatch(svg, /linearGradient/);
});

test('Component: Codebase Treemap SVG produces area-proportional monochrome blocks', async () => {
  const { renderCodebaseSVG } = await import('../build-codebase.ts');
  const svg = renderCodebaseSVG({ mode: 'dark' });

  assert.match(svg, /CODEBASE ARCHITECTURE · LANGUAGE DISTRIBUTION/);
  assert.match(svg, /TypeScript/);
  assert.match(svg, /59\.2%/);
  assert.match(svg, /JavaScript/);
  assert.match(svg, /27\.7%/);
  assert.match(svg, /Python/);
  assert.match(svg, /CSS/);
  assert.match(svg, /width="800"/);
  assert.match(svg, /height="256"/);
  assert.doesNotMatch(svg, /rx="[1-9]/);
  assert.doesNotMatch(svg, /linearGradient/);
});

test('Component: Activity Contribution SVG produces monochromatic square cells and velocity breakdown', async () => {
  const { renderActivitySVG } = await import('../build-activity.ts');
  const svg = renderActivitySVG({ mode: 'dark' });

  assert.match(svg, /CONTRIBUTION METRICS · ANNUAL VELOCITY/);
  assert.match(svg, /TOTAL CONTRIBUTIONS/);
  assert.match(svg, /ACTIVE DAYS/);
  assert.match(svg, /PRIMARY REPOSITORY/);
  assert.match(svg, /WEEKDAY VELOCITY/);
  assert.match(svg, /width="800"/);
  assert.match(svg, /height="308"/);
  assert.match(svg, /fill="#1A1A1A"/); // empty cell
  assert.match(svg, /fill="#DCDCDC"/); // level 4 cell
  assert.doesNotMatch(svg, /rx="[1-9]/);
  assert.doesNotMatch(svg, /linearGradient/);
});

test('Component: Recent Work Log SVG produces compact tabular engineering log', async () => {
  const { renderRecentWorkSVG } = await import('../build-recent-work.ts');
  const svg = renderRecentWorkSVG({ mode: 'dark' });

  assert.match(svg, />DATE<\/text>/);
  assert.match(svg, />EVENT<\/text>/);
  assert.match(svg, />REPOSITORY<\/text>/);
  assert.match(svg, />ACTIVITY \/ CONTEXT<\/text>/);
  assert.match(svg, /ServX/);
  assert.match(svg, /Zync/);
  assert.match(svg, /Adviser-CLI/);
  assert.match(svg, /width="800"/);
  assert.doesNotMatch(svg, /rx="[1-9]/);
  assert.doesNotMatch(svg, /linearGradient/);
});

test('Component: Project Architecture Diagrams produce valid bespoke engineering flows', async () => {
  const { renderZyncArchSVG, renderServXArchSVG, renderAdviserCliArchSVG } = await import('../build-project-diagrams.ts');

  const zyncSvg = renderZyncArchSVG('dark');
  assert.match(zyncSvg, /MULTI-CLIENT CRDT SYNCHRONIZATION TOPOLOGY/);
  assert.match(zyncSvg, /Yjs/);
  assert.match(zyncSvg, /Electron/);
  assert.match(zyncSvg, /MongoDB/);
  assert.doesNotMatch(zyncSvg, /rx="[1-9]/);

  const servxSvg = renderServXArchSVG('dark');
  assert.match(servxSvg, /TELEMETRY INGEST &amp; SSE EVENT STREAMING PIPELINE/);
  assert.match(servxSvg, /AES-256-GCM/);
  assert.match(servxSvg, /Server-Sent Events/);
  assert.doesNotMatch(servxSvg, /rx="[1-9]/);

  const cliSvg = renderAdviserCliArchSVG('dark');
  assert.match(cliSvg, /LOCAL-FIRST HYBRID RETRIEVAL DAG/);
  assert.match(cliSvg, /ChromaDB/);
  assert.match(cliSvg, /ColPali/);
  assert.match(cliSvg, /MCP/);
  assert.doesNotMatch(cliSvg, /rx="[1-9]/);
});

test('Component: Experience & Recognition SVGs produce clean editorial metadata', async () => {
  const { renderExperienceSVG, renderRecognitionSVG } = await import('../build-experience-recognition.ts');

  const expSvg = renderExperienceSVG('dark');
  assert.match(expSvg, /RigorBase/);
  assert.match(expSvg, /Cloud Community Club/);
  assert.match(expSvg, /2026/);
  assert.match(expSvg, /2024 —/);
  assert.doesNotMatch(expSvg, /rx="[1-9]/);

  const recSvg = renderRecognitionSVG('dark');
  assert.match(recSvg, /Brainrot Hackathon/);
  assert.match(recSvg, /Double-Track Winner/);
  assert.match(recSvg, /JNTUH HackFusion/);
  assert.match(recSvg, /5th Place Nationally/);
  assert.doesNotMatch(recSvg, /rx="[1-9]/);
});
