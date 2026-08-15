import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Text,
  MonoText,
  Label,
  NumberPrimitive,
  Rule,
  Divider,
  Block,
  ImageFrame,
  GridCell,
  Metric,
  Bar,
  TimelineRow,
  ArrowLink,
  Icon,
  createSVG,
  getTheme,
  type ThemeTokens,
  type IconName,
} from '../primitives/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

export function renderPrimitiveSpecimen(mode: 'dark' | 'light' = 'dark'): string {
  const theme: ThemeTokens = getTheme(mode);
  const width = 800;
  const height = 980;

  const elements: string[] = [];

  // Canvas background
  elements.push(`<rect width="${width}" height="${height}" fill="${theme.bg}" />`);

  // Specimen Header
  elements.push(
    Label({
      x: 32,
      y: 40,
      text: 'README PRIMITIVE SYSTEM SPECIMEN',
      color: theme.tertiary,
    })
  );

  elements.push(
    Text({
      x: 32,
      y: 72,
      content: `Visual Primitives Test Sheet — ${mode.toUpperCase()} MODE`,
      variant: 'display',
      color: theme.primary,
    })
  );

  elements.push(
    Rule({
      x1: 32,
      y1: 96,
      x2: width - 32,
      y2: 96,
      color: theme.borderSubtle,
    })
  );

  // ── 1. TYPOGRAPHY SPECIMEN ──────────────────────────────────────────────
  let curY = 130;
  elements.push(Label({ x: 32, y: curY, text: '01 · TYPOGRAPHY PRIMITIVES (TEXT, MONOTEXT, LABEL, NUMBER)', color: theme.tertiary }));

  curY += 28;
  elements.push(Text({ x: 32, y: curY, content: 'Display Sans 24px/600 · Prem Sai Kota', variant: 'display', color: theme.primary }));

  curY += 28;
  elements.push(Text({ x: 32, y: curY, content: 'Section Heading Sans 16px/600 · Infrastructure Monitoring Platform', variant: 'sectionHeading', color: theme.primary }));

  curY += 24;
  elements.push(Text({ x: 32, y: curY, content: 'Body Sans 13.5px/400 · Production-grade real-time systems, CRDT synchronization, and local RAG developer tooling.', variant: 'body', color: theme.secondary }));

  curY += 24;
  elements.push(MonoText({ x: 32, y: curY, content: 'Technical Metadata Mono 11px/600 · TYPESCRIPT · NODE.JS · DOCKER · REDIS', variant: 'technicalMetadata', color: theme.tertiary, uppercase: true }));

  curY += 20;
  elements.push(NumberPrimitive({ x: 32, y: curY, value: 1, pad: 2, color: theme.tertiary }));
  elements.push(MonoText({ x: 56, y: curY, content: 'Data Number Mono 11px/400 + Caption 10px', variant: 'caption', color: theme.secondary }));

  // Divider
  curY += 28;
  elements.push(Rule({ x1: 32, y1: curY, x2: width - 32, y2: curY, color: theme.borderSubtle }));

  // ── 2. METRICS & BARS ──────────────────────────────────────────────────
  curY += 36;
  elements.push(Label({ x: 32, y: curY, text: '02 · METRIC & BAR PRIMITIVES', color: theme.tertiary }));

  curY += 20;
  // 3 Metric columns
  elements.push(Metric({ x: 32, y: curY, label: 'PUBLIC REPOSITORIES', value: '27', subtext: 'non-fork active', theme }));
  elements.push(Metric({ x: 260, y: curY, label: 'FLAGSHIP STARS', value: '56', subtext: 'verified aggregate', theme }));
  elements.push(Metric({ x: 480, y: curY, label: 'PRIMARY DOMAIN', value: 'TypeScript', subtext: '11 repositories', theme }));

  curY += 68;
  elements.push(MonoText({ x: 32, y: curY, content: 'LANGUAGE DISTRIBUTION (MONOCHROME PROPORTIONAL BARS)', variant: 'technicalMetadata', color: theme.tertiary }));
  
  curY += 14;
  elements.push(MonoText({ x: 32, y: curY + 9, content: 'TypeScript 68%', variant: 'caption', color: theme.secondary }));
  elements.push(Bar({ x: 140, y: curY, width: 220, height: 10, value: 68, max: 100, fill: theme.primary, trackFill: theme.surface, stroke: theme.borderSubtle }));

  elements.push(MonoText({ x: 400, y: curY + 9, content: 'JavaScript 20%', variant: 'caption', color: theme.secondary }));
  elements.push(Bar({ x: 508, y: curY, width: 220, height: 10, value: 20, max: 100, fill: theme.secondary, trackFill: theme.surface, stroke: theme.borderSubtle }));

  // Divider
  curY += 36;
  elements.push(Rule({ x1: 32, y1: curY, x2: width - 32, y2: curY, color: theme.borderSubtle }));

  // ── 3. LAYOUT: GRID CELLS (0-RADIUS MATRIX) ────────────────────────────
  curY += 36;
  elements.push(Label({ x: 32, y: curY, text: '03 · GRIDCELL & BLOCK PRIMITIVES (ZERO BORDER RADIUS)', color: theme.tertiary }));

  curY += 18;
  const cellW = 230;
  const cellH = 140;

  elements.push(
    GridCell({
      x: 32,
      y: curY,
      width: cellW,
      height: cellH,
      index: 1,
      title: 'CORE & RUNTIME',
      items: ['TypeScript', 'JavaScript (ESM)', 'Python 3.11+', 'Node.js 20+'],
      theme,
    })
  );

  elements.push(
    GridCell({
      x: 32 + cellW + 23,
      y: curY,
      width: cellW,
      height: cellH,
      index: 2,
      title: 'REALTIME & DATA',
      items: ['Socket.io / WS', 'Yjs CRDTs', 'Server-Sent Events', 'PostgreSQL / Redis'],
      theme,
    })
  );

  elements.push(
    GridCell({
      x: 32 + (cellW + 23) * 2,
      y: curY,
      width: cellW,
      height: cellH,
      index: 3,
      title: 'AI & TOOLING',
      items: ['ChromaDB Vector', 'OpenAI / Gemini', 'Model Context Protocol', 'CLI Architectures'],
      theme,
    })
  );

  // Divider
  curY += cellH + 28;
  elements.push(Rule({ x1: 32, y1: curY, x2: width - 32, y2: curY, color: theme.borderSubtle }));

  // ── 4. TIMELINE ROW & IMAGE FRAME ──────────────────────────────────────
  curY += 36;
  elements.push(Label({ x: 32, y: curY, text: '04 · TIMELINE ROW & SHARP IMAGE FRAME', color: theme.tertiary }));

  curY += 16;
  elements.push(
    TimelineRow({
      x: 32,
      y: curY,
      width: width - 64,
      date: '2026',
      title: 'RigorBase — Software Engineer Intern',
      subtitle: 'Real-time pipeline architecture, production sync engines, and client integration.',
      badge: 'VERIFIED',
      theme,
      divider: false,
    })
  );

  curY += 60;
  elements.push(
    ImageFrame({
      x: 32,
      y: curY,
      width: width - 64,
      height: 90,
      fill: theme.surface,
      stroke: theme.borderSubtle,
      placeholderText: '[IMAGE FRAME — ZERO BORDER RADIUS, 1PX CRISP SUBTLE STROKE]',
      placeholderColor: theme.tertiary,
    })
  );

  // ── 5. ICONS & ARROWS ─────────────────────────────────────────────────
  curY += 114;
  elements.push(Label({ x: 32, y: curY, text: '05 · LIGHTWEIGHT GEOMETRIC ICONS & ARROW LINKS', color: theme.tertiary }));

  curY += 16;
  const iconList: IconName[] = [
    'terminal',
    'code',
    'git-branch',
    'layers',
    'shield',
    'cpu',
    'folder',
    'external-link',
    'circle-dot',
    'hash',
    'clock',
    'check',
  ];

  let iconX = 32;
  for (const name of iconList) {
    elements.push(
      Block({
        x: iconX,
        y: curY,
        width: 32,
        height: 32,
        fill: theme.surface,
        stroke: theme.borderSubtle,
      })
    );
    elements.push(
      Icon({
        name,
        x: iconX + 8,
        y: curY + 8,
        size: 16,
        color: theme.primary,
        strokeWidth: 1.2,
      })
    );
    iconX += 40;
  }

  // Arrow Links
  elements.push(ArrowLink({ x: iconX + 10, y: curY + 8, size: 16, direction: 'up-right', color: theme.primary }));
  elements.push(ArrowLink({ x: iconX + 40, y: curY + 8, size: 16, direction: 'right', color: theme.primary }));
  elements.push(ArrowLink({ x: iconX + 70, y: curY + 8, size: 16, direction: 'down', color: theme.primary }));

  return createSVG({
    width,
    height,
    title: `README Primitive System Specimen (${mode})`,
    description: 'Specimen sheet validating all 14 SVG primitives against README-DESIGN-SYSTEM.md',
    theme,
    content: elements.join('\n'),
  });
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const darkSvg = renderPrimitiveSpecimen('dark');
  const lightSvg = renderPrimitiveSpecimen('light');

  fs.writeFileSync(path.join(ASSETS_DIR, 'primitives-specimen-dark.svg'), darkSvg, 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'primitives-specimen-light.svg'), lightSvg, 'utf8');

  console.log('✔ Generated assets/primitives-specimen-dark.svg');
  console.log('✔ Generated assets/primitives-specimen-light.svg');
}
