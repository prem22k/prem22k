/**
 * Slim Liquid Glass section header, placed once above the project cards:
 *
 *   [ SELECTED WORK                                          ]
 *   [ Things I've built                  4 featured projects ]
 *
 * A sibling of the other cards: same wallpaper, outer padding, glass panel and `title` treatment,
 * kept as short as the two lines allow.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GlassDoc, WIDTH, PAD, type Layout, type Mode } from './glass/index.ts';
import { PROJECT_SLUGS } from './build-projects.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

export type SectionId = 'work';

interface SectionCopy {
  eyebrow: string;
  title: string;
  caption: string;
}

const SECTIONS: Record<SectionId, SectionCopy> = {
  work: {
    eyebrow: 'Selected work',
    title: 'Things I\u2019ve built',
    caption: `${PROJECT_SLUGS.length} featured projects`,
  },
};

export interface SectionHeaderOptions {
  id?: SectionId;
  mode?: Mode;
  layout?: Layout;
}

/** Inter cap heights (em) for placing caps, not line boxes. */
const CAP = 0.727;

export function renderSectionHeaderSVG(options: SectionHeaderOptions = {}): string {
  const { id = 'work', mode = 'dark', layout = 'wide' } = options;
  const copy = SECTIONS[id];
  const wide = layout === 'wide';
  const W = WIDTH[layout];
  const pad = PAD[layout];
  const P = wide ? 24 : 20; // horizontal inner padding (matches the Languages / At a glance panels)
  const V = wide ? 20 : 18; // vertical inner padding, measured to cap tops / baselines

  const eyebrowCap = 11.5 * CAP;
  const titleCap = 24 * CAP;
  const eyebrowBase = V + eyebrowCap;
  const titleBase = eyebrowBase + 10 + titleCap;
  // Bottom padding is measured from the title baseline; the descender of "g" lives inside it.
  const panelH = Math.round(titleBase + V + 1);
  const H = panelH + pad * 2;

  const d = new GlassDoc({
    width: W,
    height: H,
    mode,
    title: `${copy.eyebrow}: ${copy.title}`,
    desc: `${copy.eyebrow}. ${copy.title} — ${copy.caption}.`,
    seed: wide ? `section-${id}` : `section-${id}-compact`,
  });

  const p = d.panel({ x: pad, y: pad, w: W - pad * 2, h: panelH });
  const cx = p.x + P;
  const cw = p.w - P * 2;

  d.text({
    x: cx,
    y: p.y + eyebrowBase,
    text: copy.eyebrow,
    style: 'eyebrow',
    color: d.t.textTertiary,
    maxWidth: cw,
    container: p,
  });
  const title = d.text({
    x: cx - 0.5,
    y: p.y + titleBase,
    text: copy.title,
    style: 'title',
    maxWidth: cw,
    container: p,
  });

  // Caption: right-aligned on the title baseline when it fits beside the title, otherwise on the
  // eyebrow row (still right-aligned), so compact stays two lines tall.
  const captionW = d.measure({ text: copy.caption, style: 'callout' });
  const besideTitle = title.width + 24 + captionW <= cw;
  d.text({
    x: cx + cw,
    y: p.y + (besideTitle ? titleBase : eyebrowBase),
    text: copy.caption,
    style: 'callout',
    anchor: 'end',
    color: d.t.textSecondary,
    maxWidth: besideTitle ? cw - title.width - 24 : cw - d.measure({ text: copy.eyebrow, style: 'eyebrow' }) - 24,
    overflow: 'ellipsis',
    container: p,
  });

  return d.render();
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
  const outputs: [string, Mode, Layout][] = [
    ['section-work-dark.svg', 'dark', 'wide'],
    ['section-work-light.svg', 'light', 'wide'],
    ['section-work-compact-dark.svg', 'dark', 'compact'],
    ['section-work-compact-light.svg', 'light', 'compact'],
  ];
  for (const [file, mode, layout] of outputs) {
    fs.writeFileSync(path.join(ASSETS_DIR, file), renderSectionHeaderSVG({ id: 'work', mode, layout }), 'utf8');
    console.log(`✔ Generated assets/${file}`);
  }
}
