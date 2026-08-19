import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Label,
  GridCell,
  createSVG,
  getTheme,
  type ThemeTokens,
} from './primitives/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

export interface StackCategory {
  id: number;
  title: string;
  items: string[];
}

export const STACK_DATA: StackCategory[] = [
  {
    id: 1,
    title: 'LANGUAGES & CORE',
    items: ['TypeScript', 'JavaScript (ESM)', 'Python 3.11+', 'Node.js 20+'],
  },
  {
    id: 2,
    title: 'FRONTEND',
    items: ['React 19', 'Next.js App Router', 'Tailwind CSS', 'HTML5 / Semantic CSS'],
  },
  {
    id: 3,
    title: 'BACKEND & DATA',
    items: ['Express.js', 'REST & Webhooks', 'PostgreSQL / Prisma', 'MongoDB / Firestore'],
  },
  {
    id: 4,
    title: 'AI, RAG & TOOLING',
    items: ['ChromaDB Vector', 'BM25 Sparse Lexical', 'ColPali VisionRAG', 'Model Context Protocol (MCP)'],
  },
  {
    id: 5,
    title: 'REALTIME SYSTEMS',
    items: ['Yjs CRDT Engine', 'WebSocket Multiplexing', 'Server-Sent Events (SSE)', 'Redis Pub/Sub & Rates'],
  },
  {
    id: 6,
    title: 'DEVOPS & INFRA',
    items: ['Docker', 'GitHub Actions CI/CD', 'Linux CLI', 'Vercel / Cloudflare'],
  },
];

/**
 * Generates the 6-category Engineering Stack matrix SVG.
 * Strictly adheres to README-DESIGN-SYSTEM.md:
 * - 0 radius on all cells
 * - 3x2 matrix layout
 * - IBM Plex Mono category headers with index numbers
 * - Warm stone text hierarchy
 */
export function renderStackSVG(mode: 'dark' | 'light' = 'dark'): string {
  const theme: ThemeTokens = getTheme(mode);
  const width = 800;
  const height = 328;

  const elements: string[] = [];
  elements.push(`<rect width="${width}" height="${height}" fill="${theme.bg}" />`);

  // Section Header
  elements.push(
    Label({
      x: 0,
      y: 16,
      text: 'ENGINEERING STACK · CORE DOMAINS & TOOLING',
      color: theme.tertiary,
    })
  );

  const cellW = 256;
  const cellH = 135;
  const gapX = 16;
  const gapY = 12;
  const startY = 28;

  for (let i = 0; i < STACK_DATA.length; i++) {
    const cat = STACK_DATA[i];
    const row = Math.floor(i / 3);
    const col = i % 3;

    const x = col * (cellW + gapX);
    const y = startY + row * (cellH + gapY);

    elements.push(
      GridCell({
        x,
        y,
        width: cellW,
        height: cellH,
        index: cat.id,
        title: cat.title,
        items: cat.items,
        theme,
        withBorder: true,
        padding: 14,
      })
    );
  }

  return createSVG({
    width,
    height,
    title: 'Engineering Stack — Prem Sai Kota',
    description: 'Languages, Frontend, Backend & Data, AI/RAG Tooling, Realtime Systems, DevOps & Infrastructure',
    theme,
    content: elements.join('\n'),
  });
}

// Generate files when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  fs.writeFileSync(path.join(ASSETS_DIR, 'stack-dark.svg'), renderStackSVG('dark'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'stack-light.svg'), renderStackSVG('light'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'stack.svg'), renderStackSVG('dark'), 'utf8');

  console.log('✔ Generated assets/stack-dark.svg');
  console.log('✔ Generated assets/stack-light.svg');
  console.log('✔ Generated assets/stack.svg');
}
