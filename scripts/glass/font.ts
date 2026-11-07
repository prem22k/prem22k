/**
 * Embedded Inter: exact text measurement + per-SVG font subsetting.
 *
 * Every SVG embeds its own tiny Inter subset (only the glyphs it uses), so text renders
 * identically on macOS, Windows, Linux, Android and iOS — and since we know the exact
 * glyph advances, layouts are measured at build time instead of guessed.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.resolve(__dirname, '../fonts');

export type Cut = 'text' | 'display';

interface CutMetrics {
  advances: Record<string, number>;
  tnumDigit: number | null;
}

interface MetricsFile {
  unitsPerEm: number;
  cuts: Record<Cut, Record<string, CutMetrics>>;
}

const METRICS: MetricsFile = JSON.parse(fs.readFileSync(path.join(FONT_DIR, 'metrics.json'), 'utf8'));
const WEIGHTS = [400, 500, 600, 700];

export const FONT_FAMILY: Record<Cut, string> = {
  text: 'InterGlass',
  display: 'InterGlassDisplay',
};

/** CSS font stack used in every SVG: embedded Inter first, platform UI fonts as a safety net. */
export function fontStack(cut: Cut): string {
  return `${FONT_FAMILY[cut]}, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
}

function advance(ch: string, weight: number, cut: Cut, tabular: boolean): number {
  const w = Math.min(700, Math.max(400, weight));
  const lo = WEIGHTS.filter((x) => x <= w).pop() ?? 400;
  const hi = WEIGHTS.find((x) => x >= w) ?? 700;
  const pick = (wt: number) => {
    const m = METRICS.cuts[cut][String(wt)];
    if (tabular && ch >= '0' && ch <= '9' && m.tnumDigit) return m.tnumDigit;
    return m.advances[ch] ?? m.advances['M'];
  };
  if (lo === hi) return pick(lo);
  const t = (w - lo) / (hi - lo);
  return pick(lo) * (1 - t) + pick(hi) * t;
}

export interface MeasureOptions {
  size: number;
  weight?: number;
  cut?: Cut;
  /** SVG letter-spacing in px. */
  ls?: number;
  tabular?: boolean;
  uppercase?: boolean;
}

/** Width in px of `text` rendered with the embedded font (kerning ignored → slightly conservative). */
export function measure(text: string, opts: MeasureOptions): number {
  const { size, weight = 400, cut = 'text', ls = 0, tabular = false, uppercase = false } = opts;
  const s = uppercase ? text.toUpperCase() : text;
  let units = 0;
  for (const ch of s) units += advance(ch, weight, cut, tabular);
  return (units / METRICS.unitsPerEm) * size + ls * [...s].length;
}

/** Truncate with an ellipsis so the text fits in maxWidth. */
export function ellipsize(text: string, maxWidth: number, opts: MeasureOptions): string {
  if (measure(text, opts) <= maxWidth) return text;
  const chars = [...text];
  while (chars.length > 1) {
    chars.pop();
    const candidate = chars.join('').trimEnd() + '…';
    if (measure(candidate, opts) <= maxWidth) return candidate;
  }
  return '…';
}

/** Greedy word-wrap into lines no wider than maxWidth. */
export function wrap(text: string, maxWidth: number, opts: MeasureOptions): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (!line || measure(next, opts) <= maxWidth) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ── Subsetting ────────────────────────────────────────────────────────────────

let subsetCommand: string[] | null | undefined;

function findSubsetCommand(): string[] | null {
  if (subsetCommand !== undefined) return subsetCommand;
  const candidates: string[][] = [];
  if (process.env.PYFTSUBSET) candidates.push([process.env.PYFTSUBSET]);
  candidates.push(['pyftsubset'], ['python3', '-m', 'fontTools.subset']);
  for (const cmd of candidates) {
    try {
      execFileSync(cmd[0], [...cmd.slice(1), '--help'], { stdio: 'ignore' });
      subsetCommand = cmd;
      return cmd;
    } catch {
      // try next
    }
  }
  console.warn('[glass/font] pyftsubset not found — embedding the full ASCII subset (larger SVGs).');
  subsetCommand = null;
  return null;
}

const subsetCache = new Map<string, string>();

/** Base64 woff2 containing only the glyphs in `chars` (falls back to the full ASCII subset). */
export function subsetFontBase64(cut: Cut, chars: string): string {
  const unique = [...new Set([...chars, ' ', '…'])].sort().join('');
  const key = `${cut}:${unique}`;
  const cached = subsetCache.get(key);
  if (cached) return cached;

  const source = path.join(FONT_DIR, `inter-${cut}.woff2`);
  const cmd = findSubsetCommand();
  let bytes: Buffer;
  if (!cmd) {
    bytes = fs.readFileSync(source);
  } else {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'glass-font-'));
    const textFile = path.join(tmp, 'text.txt');
    const outFile = path.join(tmp, 'out.woff2');
    fs.writeFileSync(textFile, unique, 'utf8');
    execFileSync(
      cmd[0],
      [
        ...cmd.slice(1),
        source,
        `--text-file=${textFile}`,
        '--layout-features=kern,liga,calt,tnum,case',
        '--flavor=woff2',
        '--no-hinting',
        '--desubroutinize',
        `--output-file=${outFile}`,
      ],
      { stdio: 'ignore' }
    );
    bytes = fs.readFileSync(outFile);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  const b64 = bytes.toString('base64');
  subsetCache.set(key, b64);
  return b64;
}

/** <style> block declaring the embedded faces for the cuts actually used. */
export function fontFaceStyle(used: Partial<Record<Cut, string>>): string {
  const faces: string[] = [];
  for (const cut of ['text', 'display'] as Cut[]) {
    const chars = used[cut];
    if (!chars) continue;
    const b64 = subsetFontBase64(cut, chars);
    faces.push(
      `@font-face{font-family:'${FONT_FAMILY[cut]}';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:400 700;font-style:normal}`
    );
  }
  return faces.join('');
}

export function hash(s: string): string {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
}
