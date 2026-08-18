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
// 1. ZYNC: MULTI-CLIENT CRDT STAR TOPOLOGY
// ────────────────────────────────────────────────────────────────────────────
export function renderZyncArchSVG(mode: 'dark' | 'light' = 'dark'): string {
  const theme: ThemeTokens = getTheme(mode);
  const width = 800;
  const height = 136;

  const elements: string[] = [];
  elements.push(`<rect width="${width}" height="${height}" fill="${theme.bg}" />`);

  // Section Header
  elements.push(
    Label({
      x: 0,
      y: 16,
      text: 'ARCHITECTURE · MULTI-CLIENT CRDT SYNCHRONIZATION TOPOLOGY',
      color: theme.tertiary,
    })
  );

  const topY = 28;
  const boxH = 96;

  // Node 1: Multi-Client Cluster (x: 0, w: 220)
  elements.push(Block({ x: 0, y: topY, width: 220, height: boxH, fill: theme.surface, stroke: theme.borderSubtle }));
  elements.push(MonoText({ x: 14, y: topY + 20, content: 'CLIENT CLUSTER', variant: 'microLabel', color: theme.tertiary }));
  elements.push(Text({ x: 14, y: topY + 40, content: 'Web (React 19) & Desktop (Electron)', variant: 'sectionHeading', size: 12.5, weight: 600, color: theme.primary }));
  elements.push(MonoText({ x: 14, y: topY + 60, content: '· Local Y.Doc state replica', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: 14, y: topY + 74, content: '· Awareness: Cursors & presence', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: 14, y: topY + 88, content: '· Zero-latency optimistic UI', variant: 'caption', size: 9, color: theme.tertiary }));

  // Bidirectional connector: 1 <--> 2
  elements.push(`<line x1="220" y1="${topY + boxH / 2}" x2="256" y2="${topY + boxH / 2}" stroke="${theme.borderStrong}" stroke-width="1.5" />`);
  elements.push(MonoText({ x: 238, y: topY + boxH / 2 - 6, content: '⇄', variant: 'technicalMetadata', size: 14, color: theme.primary, anchor: 'middle' }));

  // Node 2: Central Yjs CRDT Broker (x: 256, w: 288)
  const n2X = 256;
  const n2W = 288;
  elements.push(Block({ x: n2X, y: topY, width: n2W, height: boxH, fill: theme.surface, stroke: theme.borderStrong }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 20, content: 'CENTRAL CRDT BROKER (NODE.JS)', variant: 'microLabel', color: theme.primary }));
  elements.push(Text({ x: n2X + 14, y: topY + 40, content: 'WebSocket Multiplexer & Room Sync', variant: 'sectionHeading', size: 12.5, weight: 600, color: theme.primary }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 60, content: '· State vector diff exchange', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 74, content: '· Conflict-free convergence logic', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 88, content: '· Isolated room namespace routing', variant: 'caption', size: 9, color: theme.tertiary }));

  // Connector: 2 --> 3
  elements.push(`<line x1="544" y1="${topY + boxH / 2}" x2="576" y2="${topY + boxH / 2}" stroke="${theme.borderStrong}" stroke-width="1.5" />`);
  elements.push(MonoText({ x: 560, y: topY + boxH / 2 - 6, content: '→', variant: 'technicalMetadata', size: 14, color: theme.primary, anchor: 'middle' }));

  // Node 3: Dual Persistence Tiers (x: 576, w: 224)
  const n3X = 576;
  const n3W = 224;
  elements.push(Block({ x: n3X, y: topY, width: n3W, height: boxH, fill: theme.surface, stroke: theme.borderSubtle }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 20, content: 'PERSISTENCE TIERS', variant: 'microLabel', color: theme.tertiary }));
  elements.push(Text({ x: n3X + 14, y: topY + 40, content: 'MongoDB + Firestore', variant: 'sectionHeading', size: 12.5, weight: 600, color: theme.primary }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 60, content: '· MongoDB: Document snapshot store', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 74, content: '· Firestore: Live room auth state', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 88, content: '· S3-compatible snapshot backups', variant: 'caption', size: 9, color: theme.tertiary }));

  return createSVG({
    width,
    height,
    title: 'Zync Architecture — Multi-Client CRDT Star Topology',
    description: 'Client Cluster (React 19 / Electron) <-> Central CRDT Broker (WebSocket / Yjs) -> Persistence (MongoDB + Firestore)',
    theme,
    content: elements.join('\n'),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// 2. SERVX: INCIDENT DETECTION & SSE EVENT STREAMING PIPELINE
// ────────────────────────────────────────────────────────────────────────────
export function renderServXArchSVG(mode: 'dark' | 'light' = 'dark'): string {
  const theme: ThemeTokens = getTheme(mode);
  const width = 800;
  const height = 136;

  const elements: string[] = [];
  elements.push(`<rect width="${width}" height="${height}" fill="${theme.bg}" />`);

  // Section Header
  elements.push(
    Label({
      x: 0,
      y: 16,
      text: 'ARCHITECTURE · TELEMETRY INGEST & SSE EVENT STREAMING PIPELINE',
      color: theme.tertiary,
    })
  );

  const topY = 28;
  const boxH = 96;

  // Node 1: Ingestion Sources (x: 0, w: 210)
  elements.push(Block({ x: 0, y: topY, width: 210, height: boxH, fill: theme.surface, stroke: theme.borderSubtle }));
  elements.push(MonoText({ x: 14, y: topY + 20, content: 'STAGE 1 · TELEMETRY INGEST', variant: 'microLabel', color: theme.tertiary }));
  elements.push(Text({ x: 14, y: topY + 40, content: 'Node Agents & Webhooks', variant: 'sectionHeading', size: 12.5, weight: 600, color: theme.primary }));
  elements.push(MonoText({ x: 14, y: topY + 60, content: '· Heartbeat ticks & ping probes', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: 14, y: topY + 74, content: '· Pluggable HTTP adapter protocol', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: 14, y: topY + 88, content: '· Ingest rate-limiting via Redis', variant: 'caption', size: 9, color: theme.tertiary }));

  // Connector: 1 --> 2
  elements.push(`<line x1="210" y1="${topY + boxH / 2}" x2="246" y2="${topY + boxH / 2}" stroke="${theme.borderStrong}" stroke-width="1.5" />`);
  elements.push(MonoText({ x: 228, y: topY + boxH / 2 - 6, content: '→', variant: 'technicalMetadata', size: 14, color: theme.primary, anchor: 'middle' }));

  // Node 2: Core Processing & Encrypted Storage (x: 246, w: 298)
  const n2X = 246;
  const n2W = 298;
  elements.push(Block({ x: n2X, y: topY, width: n2W, height: boxH, fill: theme.surface, stroke: theme.borderStrong }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 20, content: 'STAGE 2 · DETECTION & ENCRYPTION', variant: 'microLabel', color: theme.primary }));
  elements.push(Text({ x: n2X + 14, y: topY + 40, content: 'Anomaly Engine + AES-256-GCM', variant: 'sectionHeading', size: 12.5, weight: 600, color: theme.primary }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 60, content: '· Sliding-window threshold evaluation', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 74, content: '· Authenticated AES-256-GCM vault', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 88, content: '· Pluggable SQL / Prisma DB adapters', variant: 'caption', size: 9, color: theme.tertiary }));

  // Connector: 2 --> 3
  elements.push(`<line x1="544" y1="${topY + boxH / 2}" x2="576" y2="${topY + boxH / 2}" stroke="${theme.borderStrong}" stroke-width="1.5" />`);
  elements.push(MonoText({ x: 560, y: topY + boxH / 2 - 6, content: '→', variant: 'technicalMetadata', size: 14, color: theme.primary, anchor: 'middle' }));

  // Node 3: SSE Broadcast Stream (x: 576, w: 224)
  const n3X = 576;
  const n3W = 224;
  elements.push(Block({ x: n3X, y: topY, width: n3W, height: boxH, fill: theme.surface, stroke: theme.borderSubtle }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 20, content: 'STAGE 3 · REAL-TIME BROADCAST', variant: 'microLabel', color: theme.tertiary }));
  elements.push(Text({ x: n3X + 14, y: topY + 40, content: 'Server-Sent Events (SSE)', variant: 'sectionHeading', size: 12.5, weight: 600, color: theme.primary }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 60, content: '· Sub-100ms push to dashboards', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 74, content: '· Auto-reconnecting audit stream', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 88, content: '· Webhook alert dispatch triggers', variant: 'caption', size: 9, color: theme.tertiary }));

  return createSVG({
    width,
    height,
    title: 'ServX Architecture — Incident Ingestion & SSE Pipeline',
    description: 'Telemetry Ingestion -> Anomaly Engine & AES-256 Storage -> Real-Time Server-Sent Events (SSE) Broadcast',
    theme,
    content: elements.join('\n'),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// 3. ADVISER-CLI: LOCAL-FIRST HYBRID RETRIEVAL DAG
// ────────────────────────────────────────────────────────────────────────────
export function renderAdviserCliArchSVG(mode: 'dark' | 'light' = 'dark'): string {
  const theme: ThemeTokens = getTheme(mode);
  const width = 800;
  const height = 136;

  const elements: string[] = [];
  elements.push(`<rect width="${width}" height="${height}" fill="${theme.bg}" />`);

  // Section Header
  elements.push(
    Label({
      x: 0,
      y: 16,
      text: 'ARCHITECTURE · LOCAL-FIRST HYBRID RETRIEVAL DAG (DENSE + SPARSE + VISION)',
      color: theme.tertiary,
    })
  );

  const topY = 28;
  const boxH = 96;

  // Node 1: Input Ingestion & Chunking (x: 0, w: 200)
  elements.push(Block({ x: 0, y: topY, width: 200, height: boxH, fill: theme.surface, stroke: theme.borderSubtle }));
  elements.push(MonoText({ x: 14, y: topY + 20, content: '1 · MULTIMODAL INGEST', variant: 'microLabel', color: theme.tertiary }));
  elements.push(Text({ x: 14, y: topY + 40, content: 'PDFs, Code & Prompt', variant: 'sectionHeading', size: 12.5, weight: 600, color: theme.primary }));
  elements.push(MonoText({ x: 14, y: topY + 60, content: '· AST syntax chunking', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: 14, y: topY + 74, content: '· PDF raster page extractor', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: 14, y: topY + 88, content: '· Zero telemetry / 100% local', variant: 'caption', size: 9, color: theme.tertiary }));

  // Connector: 1 --> 2
  elements.push(`<line x1="200" y1="${topY + boxH / 2}" x2="236" y2="${topY + boxH / 2}" stroke="${theme.borderStrong}" stroke-width="1.5" />`);
  elements.push(MonoText({ x: 218, y: topY + boxH / 2 - 6, content: '→', variant: 'technicalMetadata', size: 14, color: theme.primary, anchor: 'middle' }));

  // Node 2: Hybrid Retrieval Engine (x: 236, w: 318)
  const n2X = 236;
  const n2W = 318;
  elements.push(Block({ x: n2X, y: topY, width: n2W, height: boxH, fill: theme.surface, stroke: theme.borderStrong }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 20, content: '2 · TRI-ENGINE RETRIEVAL + RRF', variant: 'microLabel', color: theme.primary }));
  elements.push(Text({ x: n2X + 14, y: topY + 40, content: 'ChromaDB + BM25 + ColPali', variant: 'sectionHeading', size: 12.5, weight: 600, color: theme.primary }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 60, content: '· Dense vector embeddings (ChromaDB)', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 74, content: '· Sparse lexical keyword search (BM25)', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n2X + 14, y: topY + 88, content: '· VisionRAG multi-vector patch ranking', variant: 'caption', size: 9, color: theme.tertiary }));

  // Connector: 2 --> 3
  elements.push(`<line x1="554" y1="${topY + boxH / 2}" x2="586" y2="${topY + boxH / 2}" stroke="${theme.borderStrong}" stroke-width="1.5" />`);
  elements.push(MonoText({ x: 570, y: topY + boxH / 2 - 6, content: '→', variant: 'technicalMetadata', size: 14, color: theme.primary, anchor: 'middle' }));

  // Node 3: LLM & MCP Interface (x: 586, w: 214)
  const n3X = 586;
  const n3W = 214;
  elements.push(Block({ x: n3X, y: topY, width: n3W, height: boxH, fill: theme.surface, stroke: theme.borderSubtle }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 20, content: '3 · MCP TOOL HARNESS', variant: 'microLabel', color: theme.tertiary }));
  elements.push(Text({ x: n3X + 14, y: topY + 40, content: 'Local LLM + MCP Server', variant: 'sectionHeading', size: 12.5, weight: 600, color: theme.primary }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 60, content: '· Local Ollama / Claude / OpenAI', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 74, content: '· Published npm MCP package', variant: 'caption', size: 9.5, color: theme.secondary }));
  elements.push(MonoText({ x: n3X + 14, y: topY + 88, content: '· Direct IDE context injection', variant: 'caption', size: 9, color: theme.tertiary }));

  return createSVG({
    width,
    height,
    title: 'Adviser-CLI Architecture — Hybrid RAG & Vision Pipeline',
    description: 'Multimodal Ingest -> Tri-Engine Retrieval (ChromaDB + BM25 + ColPali) -> Local LLM & Model Context Protocol (MCP) Server',
    theme,
    content: elements.join('\n'),
  });
}

// Generate all project diagrams when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Zync
  fs.writeFileSync(path.join(ASSETS_DIR, 'project-zync-arch-dark.svg'), renderZyncArchSVG('dark'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'project-zync-arch-light.svg'), renderZyncArchSVG('light'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'project-zync-arch.svg'), renderZyncArchSVG('dark'), 'utf8');

  // ServX
  fs.writeFileSync(path.join(ASSETS_DIR, 'project-servx-arch-dark.svg'), renderServXArchSVG('dark'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'project-servx-arch-light.svg'), renderServXArchSVG('light'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'project-servx-arch.svg'), renderServXArchSVG('dark'), 'utf8');

  // Adviser-CLI
  fs.writeFileSync(path.join(ASSETS_DIR, 'project-adviser-cli-arch-dark.svg'), renderAdviserCliArchSVG('dark'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'project-adviser-cli-arch-light.svg'), renderAdviserCliArchSVG('light'), 'utf8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'project-adviser-cli-arch.svg'), renderAdviserCliArchSVG('dark'), 'utf8');

  console.log('✔ Generated bespoke architecture diagrams for Zync, ServX, and Adviser-CLI');
}
