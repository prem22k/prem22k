import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Text,
  MonoText,
  Label,
  Rule,
  createSVG,
  getTheme,
  type ThemeTokens,
} from './primitives/index.ts';
import type { FetchedProfileData } from './fetch-data.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const PROFILE_JSON_PATH = path.join(ROOT_DIR, 'data/profile.json');

export interface RecentEvent {
  date: string;       // e.g. "15 AUG"
  event: string;      // e.g. "pushed", "released", "created", "merged PR"
  repository: string; // e.g. "ServX", "Zync"
  context: string;    // e.g. "Audit streaming & encrypted storage"
}

export interface RecentWorkOptions {
  events?: RecentEvent[];
  mode?: 'dark' | 'light';
}

const DEFAULT_RECENT_EVENTS: RecentEvent[] = [
  {
    date: '15 AUG',
    event: 'pushed',
    repository: 'ServX',
    context: 'Audit streaming over SSE & encrypted storage',
  },
  {
    date: '15 AUG',
    event: 'pushed',
    repository: 'Zync',
    context: 'Yjs CRDT live cursors & multi-namespace sync',
  },
  {
    date: '13 AUG',
    event: 'created',
    repository: 'skillpath',
    context: 'Interactive developer curriculum engine',
  },
  {
    date: '19 JUL',
    event: 'pushed',
    repository: 'verion',
    context: 'Versioned system configuration harness',
  },
  {
    date: '07 JUL',
    event: 'updated',
    repository: 'Adviser-CLI',
    context: 'ChromaDB vector & ColPali VisionRAG module',
  },
];

/**
 * Generates the compact engineering RECENT WORK log SVG.
 * Strictly adheres to README-DESIGN-SYSTEM.md:
 * - IBM Plex Mono for timestamps and event types
 * - Inter-like sans for repository titles and activity context
 * - Crisp 1px thin rules for row separation
 * - Zero cards, zero timeline circles, zero icon clutter
 */
export function renderRecentWorkSVG(options: RecentWorkOptions = {}): string {
  const { mode = 'dark' } = options;
  const theme: ThemeTokens = getTheme(mode);

  const events: RecentEvent[] = options.events && options.events.length > 0
    ? options.events
    : DEFAULT_RECENT_EVENTS;

  const width = 800;
  const rowHeight = 32;
  const headerHeight = 32;
  const height = headerHeight + events.length * rowHeight + 16;

  const elements: string[] = [];

  // Canvas background
  elements.push(`<rect width="${width}" height="${height}" fill="${theme.bg}" />`);

  // ── TABLE HEADER (y: 0 to 24) ───────────────────────────────────────────
  const colDate = 0;
  const colEvent = 90;
  const colRepo = 210;
  const colContext = 380;

  elements.push(
    Label({
      x: colDate,
      y: 16,
      text: 'DATE',
      color: theme.tertiary,
    })
  );

  elements.push(
    Label({
      x: colEvent,
      y: 16,
      text: 'EVENT',
      color: theme.tertiary,
    })
  );

  elements.push(
    Label({
      x: colRepo,
      y: 16,
      text: 'REPOSITORY',
      color: theme.tertiary,
    })
  );

  elements.push(
    Label({
      x: colContext,
      y: 16,
      text: 'ACTIVITY / CONTEXT',
      color: theme.tertiary,
    })
  );

  // Header bottom rule
  elements.push(
    Rule({
      x1: 0,
      y1: 26,
      x2: width,
      y2: 26,
      color: theme.borderStrong,
    })
  );

  // ── EVENT ROWS ──────────────────────────────────────────────────────────
  let currentY = 26;

  for (let i = 0; i < events.length; i++) {
    const item = events[i];
    const rowY = currentY + 20;

    // Date (IBM Plex Mono uppercase)
    elements.push(
      MonoText({
        x: colDate,
        y: rowY,
        content: item.date,
        variant: 'technicalMetadata',
        size: 10.5,
        color: theme.secondary,
        uppercase: true,
      })
    );

    // Event type (IBM Plex Mono lowercase/mono)
    elements.push(
      MonoText({
        x: colEvent,
        y: rowY,
        content: item.event,
        variant: 'technicalMetadata',
        size: 10.5,
        color: theme.tertiary,
      })
    );

    // Repository name (Inter Sans 600)
    elements.push(
      Text({
        x: colRepo,
        y: rowY,
        content: item.repository,
        variant: 'sectionHeading',
        size: 13,
        weight: 600,
        color: theme.primary,
      })
    );

    // Context / activity details (Inter Sans 400)
    elements.push(
      Text({
        x: colContext,
        y: rowY,
        content: item.context,
        variant: 'body',
        size: 12,
        color: theme.secondary,
      })
    );

    // 1px subtle rule separator
    currentY += rowHeight;
    elements.push(
      Rule({
        x1: 0,
        y1: currentY,
        x2: width,
        y2: currentY,
        color: theme.borderSubtle,
      })
    );
  }

  return createSVG({
    width,
    height,
    title: 'Recent Engineering Activity Log — Prem Sai Kota',
    description: `Latest GitHub engineering events across ServX, Zync, Adviser-CLI, and core repositories.`,
    theme,
    content: elements.join('\n'),
  });
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const darkSvg = renderRecentWorkSVG({ mode: 'dark' });
  const lightSvg = renderRecentWorkSVG({ mode: 'light' });

  fs.writeFileSync(path.join(ASSETS_DIR, 'recent-work-dark.svg'), darkSvg, 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'recent-work-light.svg'), lightSvg, 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'recent-work.svg'), darkSvg, 'utf8');

  console.log('✔ Generated assets/recent-work-dark.svg');
  console.log('✔ Generated assets/recent-work-light.svg');
  console.log('✔ Generated assets/recent-work.svg');
}
