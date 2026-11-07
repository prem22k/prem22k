/** Escapes characters that are special in XML/SVG. */
export function escapeXml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Compact, deterministic number formatting for SVG attributes. */
export function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return String(Math.round(n * 100) / 100);
}

/** 1234 → "1,234"; 221344 → "221k" when compact. */
export function formatNumber(n: number, compact = false): string {
  if (compact && n >= 10000) return `${Math.round(n / 1000)}k`;
  return n.toLocaleString('en-US');
}
