import { type ThemeTokens, THEME_DARK } from './tokens.ts';

/**
 * Escapes characters that are special in XML/SVG.
 */
export function escapeXml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an attribute string for SVG elements, omitting undefined or null values.
 */
export function attr(name: string, value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null || value === false) return '';
  if (value === true) return ` ${name}="true"`;
  return ` ${name}="${escapeXml(value)}"`;
}

export interface CreateSVGOptions {
  width: number;
  height: number;
  content: string;
  title?: string;
  description?: string;
  theme?: ThemeTokens;
  viewBox?: string;
  role?: string;
}

/**
 * Wraps SVG element content in a standards-compliant, standalone SVG document wrapper.
 */
export function createSVG(options: CreateSVGOptions): string {
  const {
    width,
    height,
    content,
    title,
    description,
    theme = THEME_DARK,
    viewBox = `0 0 ${width} ${height}`,
    role = 'img',
  } = options;

  const titleElem = title ? `<title>${escapeXml(title)}</title>` : '';
  const descElem = description ? `<desc>${escapeXml(description)}</desc>` : '';
  const ariaLabel = title ? ` aria-label="${escapeXml(title)}"` : '';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" fill="none" role="${role}"${ariaLabel}>`,
    titleElem,
    descElem,
    content.trim(),
    '</svg>',
  ]
    .filter(Boolean)
    .join('\n');
}
