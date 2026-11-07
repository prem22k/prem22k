import test from 'node:test';
import assert from 'node:assert/strict';

import { GlassDoc, measure, ellipsize, wrap, escapeXml, fmt, WIDTH } from '../glass/index.ts';
import { renderHeroSVG } from '../build-hero.ts';
import { renderGitHubStatsSVG } from '../build-github-stats.ts';
import { renderProjectCardSVG, PROJECT_SLUGS } from '../build-projects.ts';
import { renderCodebaseSVG } from '../build-codebase.ts';
import { renderStackSVG } from '../build-stack.ts';
import { renderActivitySVG } from '../build-activity.ts';
import { renderSectionHeaderSVG } from '../build-section.ts';
import { renderTimelineSVG } from '../build-timeline.ts';
import { renderJourneySVG } from '../build-journey.ts';
import { renderButtonSVG, BUTTONS } from '../build-buttons.ts';

test('util: escapeXml and fmt', () => {
  assert.equal(escapeXml('A & B < C > "D" \'E\''), 'A &amp; B &lt; C &gt; &quot;D&quot; &apos;E&apos;');
  assert.equal(escapeXml(null), '');
  assert.equal(fmt(1.23456), '1.23');
  assert.equal(fmt(NaN), '0');
});

test('font: measure scales linearly with size and grows with weight', () => {
  const a = measure('Prem Sai Kota', { size: 20 });
  const b = measure('Prem Sai Kota', { size: 40 });
  assert.ok(Math.abs(b - a * 2) < 0.01);
  assert.ok(measure('Prem Sai Kota', { size: 20, weight: 700 }) > a);
  assert.ok(measure('W', { size: 14 }) > measure('i', { size: 14 }));
});

test('font: tabular digits share one width', () => {
  const one = measure('1111', { size: 20, tabular: true });
  const eight = measure('8888', { size: 20, tabular: true });
  assert.ok(Math.abs(one - eight) < 0.01);
});

test('font: ellipsize and wrap respect maxWidth', () => {
  const opts = { size: 14 };
  const long = 'Guard set_ignore_cursor_events on unrealized GTK window before showing';
  const cut = ellipsize(long, 120, opts);
  assert.ok(cut.endsWith('…'));
  assert.ok(measure(cut, opts) <= 120);
  for (const line of wrap(long, 160, opts)) assert.ok(measure(line, opts) <= 160 || !line.includes(' '));
});

test('doc: static text that overflows throws; dynamic text is fitted', () => {
  const d = new GlassDoc({ width: 400, height: 100, mode: 'dark', title: 'T' });
  const p = d.panel({ x: 10, y: 10, w: 100, h: 60 });
  assert.throws(() => d.text({ x: 20, y: 40, text: 'This is far too long to fit', maxWidth: p.w - 20, container: p }));
  const r = d.text({ x: 20, y: 40, text: 'This is far too long to fit', maxWidth: p.w - 20, overflow: 'ellipsis', container: p });
  assert.ok(r.width <= p.w - 20);
});

test('doc: render embeds the font and stays self-contained', () => {
  const d = new GlassDoc({ width: 400, height: 120, mode: 'light', title: 'Self contained' });
  const p = d.panel({ x: 16, y: 16, w: 200, h: 80 });
  d.text({ x: p.x + 16, y: p.y + 40, text: 'Hello', style: 'title', maxWidth: p.w - 32, container: p });
  const svg = d.render();
  assert.match(svg, /^<svg[^>]+width="400"/);
  assert.match(svg, /@font-face\{font-family:'InterGlassDisplay';src:url\(data:font\/woff2;base64,/);
  assert.doesNotMatch(svg, /(?:href|src)="(?!#|data:)/);
  assert.doesNotMatch(svg, /<script|<foreignObject/i);
});

const builders: Array<[string, (o: { mode: 'dark' | 'light'; layout: 'wide' | 'compact' }) => string]> = [
  ['hero', (o) => renderHeroSVG(o)],
  ['github-year', (o) => renderGitHubStatsSVG(o)],
  ...PROJECT_SLUGS.map((slug): [string, (o: { mode: 'dark' | 'light'; layout: 'wide' | 'compact' }) => string] => [
    `project-${slug}`,
    (o) => renderProjectCardSVG({ ...o, slug }),
  ]),
  ['codebase', (o) => renderCodebaseSVG(o)],
  ['stack', (o) => renderStackSVG(o)],
  ['activity', (o) => renderActivitySVG(o)],
  ['section-work', (o) => renderSectionHeaderSVG({ ...o, id: 'work' })],
  ['timeline', (o) => renderTimelineSVG(o)],
  ['journey', (o) => renderJourneySVG(o)],
];

test('timeline renders with no events', () => {
  const svg = renderTimelineSVG({ mode: 'dark', layout: 'wide', data: { recentActivity: { fetchedAt: '', events: [] } } as never });
  assert.match(svg, /^<svg/);
});

test('buttons: every button renders in both themes, self-contained and deterministic', () => {
  for (const { id } of BUTTONS) {
    for (const mode of ['dark', 'light'] as const) {
      const svg = renderButtonSVG({ id, mode });
      assert.match(svg, /^<svg/);
      assert.doesNotMatch(svg, /(?:href|src)="(?!#|data:)/);
      assert.equal(renderButtonSVG({ id, mode }), svg);
    }
  }
});

for (const [name, render] of builders) {
  test(`builder ${name}: 4 variants, correct width, deterministic, self-contained`, () => {
    for (const layout of ['wide', 'compact'] as const) {
      for (const mode of ['dark', 'light'] as const) {
        const svg = render({ mode, layout });
        const root = svg.slice(0, svg.indexOf('>'));
        assert.match(root, new RegExp(`width="${WIDTH[layout]}"`), `${name} ${layout} ${mode} width`);
        assert.match(svg, /<title>[^<]+<\/title>/);
        assert.doesNotMatch(svg, /(?:href|src)="(?!#|data:)/);
        assert.doesNotMatch(svg, /<script|<foreignObject|\son[a-z]+=/i);
        assert.equal(render({ mode, layout }), svg, `${name} ${layout} ${mode} must be deterministic`);
      }
    }
  });
}
