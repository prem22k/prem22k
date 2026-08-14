import { type ThemeTokens, THEME_DARK } from './tokens.ts';
import { escapeXml } from './utils.ts';
import { MonoText, Text, Label } from './typography.ts';
import { Rule, Block } from './layout.ts';

export interface MetricProps {
  x: number;
  y: number;
  label: string;
  value: string | number;
  subtext?: string;
  orientation?: 'vertical' | 'horizontal';
  theme?: ThemeTokens;
}

/**
 * Metric Primitive
 * Displays a structured technical metric: uppercase mono label, prominent value, optional subtext.
 */
export function Metric(props: MetricProps): string {
  const {
    x,
    y,
    label,
    value,
    subtext,
    orientation = 'vertical',
    theme = THEME_DARK,
  } = props;

  const elements: string[] = [];

  if (orientation === 'vertical') {
    // Label
    elements.push(
      Label({
        x,
        y: y,
        text: label,
        color: theme.tertiary,
      })
    );

    // Value (prominent)
    elements.push(
      Text({
        x,
        y: y + 22,
        content: String(value),
        variant: 'display',
        size: 20,
        weight: 600,
        color: theme.primary,
      })
    );

    // Subtext
    if (subtext) {
      elements.push(
        MonoText({
          x,
          y: y + 36,
          content: subtext,
          variant: 'caption',
          color: theme.secondary,
        })
      );
    }
  } else {
    // Horizontal layout
    elements.push(
      Label({
        x,
        y,
        text: label,
        color: theme.tertiary,
      })
    );
    elements.push(
      MonoText({
        x: x + 120,
        y,
        content: String(value),
        variant: 'technicalMetadata',
        color: theme.primary,
      })
    );
  }

  return elements.join('\n');
}

export interface BarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  max?: number;
  fill?: string;
  trackFill?: string;
  stroke?: string;
}

/**
 * Bar Primitive
 * Flat monochrome proportional bar with zero border-radius.
 */
export function Bar(props: BarProps): string {
  const {
    x,
    y,
    width,
    height,
    value,
    max = 100,
    fill = '#F5F2EB',
    trackFill = '#161b22',
    stroke = '#2C2825',
  } = props;

  const clampedRatio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const activeWidth = Math.round(width * clampedRatio);

  const track = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${escapeXml(
    trackFill
  )}" stroke="${escapeXml(stroke)}" stroke-width="1" rx="0" ry="0" />`;

  if (activeWidth <= 0) return track;

  const active = `<rect x="${x}" y="${y}" width="${activeWidth}" height="${height}" fill="${escapeXml(
    fill
  )}" rx="0" ry="0" />`;

  return `${track}\n${active}`;
}

export interface TimelineRowProps {
  x: number;
  y: number;
  width: number;
  date: string;
  title: string;
  subtitle: string;
  badge?: string;
  theme?: ThemeTokens;
  divider?: boolean;
}

/**
 * TimelineRow Primitive
 * Structured row for experience, milestone, or event list.
 */
export function TimelineRow(props: TimelineRowProps): string {
  const {
    x,
    y,
    width,
    date,
    title,
    subtitle,
    badge,
    theme = THEME_DARK,
    divider = true,
  } = props;

  const elements: string[] = [];

  // Date column (left)
  elements.push(
    MonoText({
      x,
      y: y + 14,
      content: date,
      variant: 'technicalMetadata',
      color: theme.tertiary,
    })
  );

  // Content column
  const contentX = x + 110;
  elements.push(
    Text({
      x: contentX,
      y: y + 14,
      content: title,
      variant: 'sectionHeading',
      size: 14,
      weight: 600,
      color: theme.primary,
    })
  );

  elements.push(
    Text({
      x: contentX,
      y: y + 32,
      content: subtitle,
      variant: 'body',
      size: 12,
      color: theme.secondary,
    })
  );

  if (badge) {
    const badgeX = x + width - 90;
    elements.push(
      Block({
        x: badgeX,
        y: y + 2,
        width: 90,
        height: 20,
        fill: theme.surface,
        stroke: theme.borderSubtle,
      })
    );
    elements.push(
      MonoText({
        x: badgeX + 45,
        y: y + 15,
        content: badge,
        variant: 'caption',
        color: theme.tertiary,
        anchor: 'middle',
      })
    );
  }

  // Bottom divider
  if (divider) {
    elements.push(
      Rule({
        x1: x,
        y1: y + 46,
        x2: x + width,
        y2: y + 46,
        color: theme.borderSubtle,
      })
    );
  }

  return elements.join('\n');
}

export interface ArrowLinkProps {
  x: number;
  y: number;
  size?: number;
  color?: string;
  direction?: 'up-right' | 'right' | 'down';
  strokeWidth?: number;
}

/**
 * ArrowLink Primitive
 * Crisp geometric arrow with sharp miter joints and square linecaps.
 */
export function ArrowLink(props: ArrowLinkProps): string {
  const {
    x,
    y,
    size = 12,
    color = '#A8A29E',
    direction = 'up-right',
    strokeWidth = 1.5,
  } = props;

  let pathD = '';
  if (direction === 'up-right') {
    // ↗ arrow
    pathD = `M${x} ${y + size} L${x + size} ${y} M${x + size * 0.35} ${y} L${x + size} ${y} L${x + size} ${y + size * 0.65}`;
  } else if (direction === 'right') {
    // → arrow
    const half = size / 2;
    pathD = `M${x} ${y + half} L${x + size} ${y + half} M${x + size - half} ${y} L${x + size} ${y + half} L${x + size - half} ${y + size}`;
  } else {
    // ↓ arrow
    const half = size / 2;
    pathD = `M${x + half} ${y} L${x + half} ${y + size} M${x} ${y + size - half} L${x + half} ${y + size} L${x + size} ${y + size - half}`;
  }

  return `<path d="${pathD}" stroke="${escapeXml(
    color
  )}" stroke-width="${strokeWidth}" stroke-linecap="square" stroke-linejoin="miter" fill="none" />`;
}
