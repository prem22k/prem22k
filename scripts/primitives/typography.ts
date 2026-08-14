import { FONT_SANS, FONT_MONO, TYPE_SCALE } from './tokens.ts';
import { escapeXml, attr } from './utils.ts';

export interface TextProps {
  x: number;
  y: number;
  content: string;
  variant?: 'display' | 'sectionHeading' | 'body' | 'caption';
  color?: string;
  weight?: number | string;
  size?: number;
  letterSpacing?: number;
  anchor?: 'start' | 'middle' | 'end';
  opacity?: number;
}

/**
 * Text Primitive
 * Renders Inter-like system sans text matching the design system type scale.
 */
export function Text(props: TextProps): string {
  const {
    x,
    y,
    content,
    variant = 'body',
    color = '#A8A29E',
    weight,
    size,
    letterSpacing,
    anchor,
    opacity,
  } = props;

  const scale = TYPE_SCALE[variant === 'sectionHeading' ? 'sectionHeading' : variant];
  const finalSize = size ?? scale.fontSize;
  const finalWeight = weight ?? scale.fontWeight;
  const finalSpacing = letterSpacing ?? scale.letterSpacing;

  return `<text x="${x}" y="${y}" font-family="${FONT_SANS}" font-size="${finalSize}" font-weight="${finalWeight}"${
    finalSpacing ? ` letter-spacing="${finalSpacing}"` : ''
  }${attr('text-anchor', anchor)}${attr('fill-opacity', opacity)} fill="${escapeXml(color)}">${escapeXml(content)}</text>`;
}

export interface MonoTextProps {
  x: number;
  y: number;
  content: string;
  variant?: 'technicalMetadata' | 'microLabel' | 'dataNumber' | 'caption';
  color?: string;
  weight?: number | string;
  size?: number;
  letterSpacing?: number;
  anchor?: 'start' | 'middle' | 'end';
  uppercase?: boolean;
  opacity?: number;
}

/**
 * MonoText Primitive
 * Renders IBM Plex Mono-like monospace text for technical data and metadata.
 */
export function MonoText(props: MonoTextProps): string {
  const {
    x,
    y,
    content,
    variant = 'technicalMetadata',
    color = '#78716C',
    weight,
    size,
    letterSpacing,
    anchor,
    uppercase,
    opacity,
  } = props;

  const scale = TYPE_SCALE[variant];
  const finalSize = size ?? scale.fontSize;
  const finalWeight = weight ?? scale.fontWeight;
  const finalSpacing = letterSpacing ?? scale.letterSpacing;
  const finalContent = uppercase ? String(content).toUpperCase() : String(content);

  return `<text x="${x}" y="${y}" font-family="${FONT_MONO}" font-size="${finalSize}" font-weight="${finalWeight}"${
    finalSpacing ? ` letter-spacing="${finalSpacing}"` : ''
  }${attr('text-anchor', anchor)}${attr('fill-opacity', opacity)} fill="${escapeXml(color)}">${escapeXml(finalContent)}</text>`;
}

export interface LabelProps {
  x: number;
  y: number;
  text: string;
  color?: string;
  letterSpacing?: number;
  anchor?: 'start' | 'middle' | 'end';
}

/**
 * Label Primitive
 * Micro label in uppercase monospace with wide tracking (1.2px), per portfolio design DNA.
 */
export function Label(props: LabelProps): string {
  const { x, y, text, color = '#78716C', letterSpacing = 1.2, anchor } = props;
  return MonoText({
    x,
    y,
    content: text,
    variant: 'microLabel',
    color,
    letterSpacing,
    anchor,
    uppercase: true,
  });
}

export interface NumberProps {
  x: number;
  y: number;
  value: number | string;
  pad?: number;
  color?: string;
  fontSize?: number;
  anchor?: 'start' | 'middle' | 'end';
}

/**
 * Number Primitive
 * Data counter or project index ("01", "02") in clean monospace.
 */
export function NumberPrimitive(props: NumberProps): string {
  const { x, y, value, pad = 2, color = '#78716C', fontSize = 11, anchor } = props;
  const paddedValue = typeof value === 'number' ? String(value).padStart(pad, '0') : String(value);

  return MonoText({
    x,
    y,
    content: paddedValue,
    variant: 'dataNumber',
    size: fontSize,
    color,
    anchor,
  });
}
