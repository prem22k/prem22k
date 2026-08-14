import { type ThemeTokens, THEME_DARK } from './tokens.ts';
import { escapeXml, attr } from './utils.ts';
import { Label, NumberPrimitive, MonoText, Text } from './typography.ts';

export interface RuleProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

/**
 * Rule Primitive
 * 1px crisp horizontal or vertical dividing line.
 */
export function Rule(props: RuleProps): string {
  const { x1, y1, x2, y2, color = '#2C2825', strokeWidth = 1, strokeDasharray } = props;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${escapeXml(color)}" stroke-width="${strokeWidth}"${attr(
    'stroke-dasharray',
    strokeDasharray
  )} />`;
}

export interface DividerProps {
  x: number;
  y: number;
  width: number;
  color?: string;
  strokeWidth?: number;
  label?: string;
  labelColor?: string;
}

/**
 * Divider Primitive
 * Section divider line with optional inline or offset label.
 */
export function Divider(props: DividerProps): string {
  const { x, y, width, color = '#2C2825', strokeWidth = 1, label, labelColor = '#78716C' } = props;

  if (!label) {
    return Rule({ x1: x, y1: y, x2: x + width, y2: y, color, strokeWidth });
  }

  // Divider with text label
  const labelElem = Label({ x, y: y - 8, text: label, color: labelColor });
  const lineElem = Rule({ x1: x, y1: y, x2: x + width, y2: y, color, strokeWidth });
  return `${labelElem}\n${lineElem}`;
}

export interface BlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  children?: string | string[];
}

/**
 * Block Primitive
 * Sharp rectangular container with zero border-radius and flat fill.
 */
export function Block(props: BlockProps): string {
  const {
    x,
    y,
    width,
    height,
    fill = '#161b22',
    stroke = '#2C2825',
    strokeWidth = 1,
    children,
  } = props;

  const rect = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${escapeXml(
    fill
  )}"${stroke && stroke !== 'none' ? ` stroke="${escapeXml(stroke)}" stroke-width="${strokeWidth}"` : ''} rx="0" ry="0" />`;

  if (!children) return rect;

  const childContent = Array.isArray(children) ? children.join('\n') : children;
  return `${rect}\n${childContent}`;
}

export interface ImageFrameProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  placeholderText?: string;
  placeholderColor?: string;
}

/**
 * ImageFrame Primitive
 * Sharp rectangular frame for screenshots or media containers with zero border-radius.
 */
export function ImageFrame(props: ImageFrameProps): string {
  const {
    x,
    y,
    width,
    height,
    fill = '#161b22',
    stroke = '#2C2825',
    strokeWidth = 1,
    placeholderText,
    placeholderColor = '#78716C',
  } = props;

  const rect = Block({ x, y, width, height, fill, stroke, strokeWidth });
  if (!placeholderText) return rect;

  const text = MonoText({
    x: x + width / 2,
    y: y + height / 2 + 4,
    content: placeholderText,
    variant: 'caption',
    color: placeholderColor,
    anchor: 'middle',
  });

  return `${rect}\n${text}`;
}

export interface GridCellProps {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  items: string[];
  index?: number | string;
  theme?: ThemeTokens;
  withBorder?: boolean;
  padding?: number;
}

/**
 * GridCell Primitive
 * Matrix or stack cell with index prefix, uppercase category title, and cleanly spaced text list.
 */
export function GridCell(props: GridCellProps): string {
  const {
    x,
    y,
    width,
    height,
    title,
    items,
    index,
    theme = THEME_DARK,
    withBorder = true,
    padding = 16,
  } = props;

  const elements: string[] = [];

  // Background box
  if (withBorder) {
    elements.push(
      Block({
        x,
        y,
        width,
        height,
        fill: theme.surface,
        stroke: theme.borderSubtle,
        strokeWidth: 1,
      })
    );
  }

  const contentX = x + padding;
  let currentY = y + padding + 12;

  // Index and Title Header
  if (index !== undefined) {
    elements.push(
      NumberPrimitive({
        x: contentX,
        y: currentY,
        value: index,
        color: theme.tertiary,
      })
    );
    elements.push(
      MonoText({
        x: contentX + 24,
        y: currentY,
        content: title,
        variant: 'technicalMetadata',
        color: theme.primary,
        uppercase: true,
      })
    );
  } else {
    elements.push(
      MonoText({
        x: contentX,
        y: currentY,
        content: title,
        variant: 'technicalMetadata',
        color: theme.primary,
        uppercase: true,
      })
    );
  }

  // Header separator rule inside cell
  currentY += 12;
  elements.push(
    Rule({
      x1: contentX,
      y1: currentY,
      x2: x + width - padding,
      y2: currentY,
      color: theme.borderSubtle,
    })
  );

  // Items list
  currentY += 18;
  const itemLineHeight = 18;
  for (const item of items) {
    elements.push(
      Text({
        x: contentX,
        y: currentY,
        content: item,
        variant: 'body',
        size: 12,
        color: theme.secondary,
      })
    );
    currentY += itemLineHeight;
  }

  return elements.join('\n');
}
