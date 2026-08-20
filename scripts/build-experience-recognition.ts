import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Text,
  MonoText,
  Label,
  Rule,
  Block,
  createSVG,
  getTheme,
  type ThemeTokens,
} from './primitives/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

// ────────────────────────────────────────────────────────────────────────────
// 1. EXPERIENCE SVG GENERATOR
// ────────────────────────────────────────────────────────────────────────────
export function renderExperienceSVG(mode: 'dark' | 'light' = 'dark'): string {
  const theme: ThemeTokens = getTheme(mode);
  const width = 800;
  const height = 186;

  const elements: string[] = [];
  elements.push(`<rect width="${width}" height="${height}" fill="${theme.bg}" />`);

  // Section Header
  elements.push(
    Label({
      x: 0,
      y: 16,
      text: 'EXPERIENCE · PROFESSIONAL & TECHNICAL LEADERSHIP',
      color: theme.tertiary,
    })
  );

  elements.push(
    Rule({
      x1: 0,
      y1: 26,
      x2: width,
      y2: 26,
      color: theme.borderStrong,
    })
  );

  // ── ROW 1: RigorBase ───────────────────────────────────────────────────
  let curY = 48;
  const colDate = 0;
  const colContent = 130;

  elements.push(
    MonoText({
      x: colDate,
      y: curY,
      content: '2026',
      variant: 'technicalMetadata',
      size: 11,
      color: theme.primary,
    })
  );
  elements.push(
    MonoText({
      x: colDate,
      y: curY + 16,
      content: 'MAR — APR',
      variant: 'caption',
      size: 9.5,
      color: theme.tertiary,
    })
  );

  elements.push(
    Text({
      x: colContent,
      y: curY,
      content: 'RigorBase — Full-Stack Developer Intern',
      variant: 'sectionHeading',
      size: 13.5,
      weight: 600,
      color: theme.primary,
    })
  );
  elements.push(
    Text({
      x: colContent,
      y: curY + 18,
      content: 'Shipped closed beta access system (schema, Redis rate limiting, OAuth) & led frontend migration to v3 design system.',
      variant: 'body',
      size: 11.5,
      color: theme.secondary,
    })
  );

  // Divider 1
  elements.push(
    Rule({
      x1: 0,
      y1: 96,
      x2: width,
      y2: 96,
      color: theme.borderSubtle,
    })
  );

  // ── ROW 2: Cloud Community Club @ SNIST ─────────────────────────────────
  curY = 118;
  elements.push(
    MonoText({
      x: colDate,
      y: curY,
      content: '2024 —',
      variant: 'technicalMetadata',
      size: 11,
      color: theme.primary,
    })
  );
  elements.push(
    MonoText({
      x: colDate,
      y: curY + 16,
      content: 'NOV — PRESENT',
      variant: 'caption',
      size: 9.5,
      color: theme.tertiary,
    })
  );

  elements.push(
    Text({
      x: colContent,
      y: curY,
      content: 'Cloud Community Club (C³) @ SNIST — Technical Head & Lead Developer',
      variant: 'sectionHeading',
      size: 13.5,
      weight: 600,
      color: theme.primary,
    })
  );
  elements.push(
    Text({
      x: colContent,
      y: curY + 18,
      content: 'Architected platform serving 1,000+ campus members (Next.js); automated transactional email service with retry queues and CI/CD.',
      variant: 'body',
      size: 11.5,
      color: theme.secondary,
    })
  );

  // Bottom rule
  elements.push(
    Rule({
      x1: 0,
      y1: 166,
      x2: width,
      y2: 166,
      color: theme.borderSubtle,
    })
  );

  return createSVG({
    width,
    height,
    title: 'Experience — Prem Sai Kota',
    description: 'RigorBase (Full-Stack Intern, 2026) | Cloud Community Club (Technical Head, 2024-Present)',
    theme,
    content: elements.join('\n'),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// 2. RECOGNITION SVG GENERATOR
// ────────────────────────────────────────────────────────────────────────────
export function renderRecognitionSVG(mode: 'dark' | 'light' = 'dark'): string {
  const theme: ThemeTokens = getTheme(mode);
  const width = 800;
  const height = 186;

  const elements: string[] = [];
  elements.push(`<rect width="${width}" height="${height}" fill="${theme.bg}" />`);

  // Section Header
  elements.push(
    Label({
      x: 0,
      y: 16,
      text: 'RECOGNITION · COMPETITIVE EVALUATIONS & HACKATHONS',
      color: theme.tertiary,
    })
  );

  elements.push(
    Rule({
      x1: 0,
      y1: 26,
      x2: width,
      y2: 26,
      color: theme.borderStrong,
    })
  );

  // ── ROW 1: Brainrot Hackathon ──────────────────────────────────────────
  let curY = 48;
  const colDate = 0;
  const colContent = 130;

  elements.push(
    MonoText({
      x: colDate,
      y: curY,
      content: '2025',
      variant: 'technicalMetadata',
      size: 11,
      color: theme.primary,
    })
  );
  elements.push(
    MonoText({
      x: colDate,
      y: curY + 16,
      content: '1,224 ENTRANTS',
      variant: 'caption',
      size: 9.5,
      color: theme.tertiary,
    })
  );

  elements.push(
    Text({
      x: colContent,
      y: curY,
      content: 'Brainrot Hackathon — Double-Track Winner',
      variant: 'sectionHeading',
      size: 13.5,
      weight: 600,
      color: theme.primary,
    })
  );
  elements.push(
    Text({
      x: colContent,
      y: curY + 18,
      content: 'Awarded 1st place across both competitive tracks for full-stack real-time web application architecture.',
      variant: 'body',
      size: 11.5,
      color: theme.secondary,
    })
  );

  // Divider 1
  elements.push(
    Rule({
      x1: 0,
      y1: 96,
      x2: width,
      y2: 96,
      color: theme.borderSubtle,
    })
  );

  // ── ROW 2: JNTUH HackFusion-2K26 ───────────────────────────────────────
  curY = 118;
  elements.push(
    MonoText({
      x: colDate,
      y: curY,
      content: '2026',
      variant: 'technicalMetadata',
      size: 11,
      color: theme.primary,
    })
  );
  elements.push(
    MonoText({
      x: colDate,
      y: curY + 16,
      content: '230+ TEAMS',
      variant: 'caption',
      size: 9.5,
      color: theme.tertiary,
    })
  );

  elements.push(
    Text({
      x: colContent,
      y: curY,
      content: 'JNTUH HackFusion-2K26 — 5th Place Nationally',
      variant: 'sectionHeading',
      size: 13.5,
      weight: 600,
      color: theme.primary,
    })
  );
  elements.push(
    Text({
      x: colContent,
      y: curY + 18,
      content: 'Built and deployed an integrated hardware/software system in 48 hours, placing 5th nationally.',
      variant: 'body',
      size: 11.5,
      color: theme.secondary,
    })
  );

  // Bottom rule
  elements.push(
    Rule({
      x1: 0,
      y1: 166,
      x2: width,
      y2: 166,
      color: theme.borderSubtle,
    })
  );

  return createSVG({
    width,
    height,
    title: 'Recognition & Hackathons — Prem Sai Kota',
    description: 'Brainrot Hackathon (Double-Track Winner, 1224 entrants) | JNTUH HackFusion (5th place nationally, 230+ teams)',
    theme,
    content: elements.join('\n'),
  });
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Experience
  fs.writeFileSync(path.join(ASSETS_DIR, 'experience-dark.svg'), renderExperienceSVG('dark'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'experience-light.svg'), renderExperienceSVG('light'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'experience.svg'), renderExperienceSVG('dark'), 'utf8');

  // Recognition
  fs.writeFileSync(path.join(ASSETS_DIR, 'recognition-dark.svg'), renderRecognitionSVG('dark'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'recognition-light.svg'), renderRecognitionSVG('light'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'recognition.svg'), renderRecognitionSVG('dark'), 'utf8');

  console.log('✔ Generated Experience SVGs (dark/light)');
  console.log('✔ Generated Recognition SVGs (dark/light)');
}
