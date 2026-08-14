import { escapeXml } from './utils.ts';

export type IconName =
  | 'terminal'
  | 'code'
  | 'git-branch'
  | 'layers'
  | 'shield'
  | 'cpu'
  | 'folder'
  | 'arrow-up-right'
  | 'arrow-right'
  | 'external-link'
  | 'circle-dot'
  | 'hash'
  | 'clock'
  | 'check';

export interface IconProps {
  name: IconName;
  x: number;
  y: number;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Icon Primitive
 * Ultra-lightweight geometric vector icons without bloated curves.
 * Rendered using sharp miter joins and strict 0-radius box geometry.
 */
export function Icon(props: IconProps): string {
  const {
    name,
    x,
    y,
    size = 14,
    color = '#A8A29E',
    strokeWidth = 1.2,
  } = props;

  const s = size;
  let inner = '';

  switch (name) {
    case 'terminal': {
      // Prompt >_ in a box
      inner = `
        <polyline points="${x + s * 0.2},${y + s * 0.3} ${x + s * 0.45},${y + s * 0.5} ${x + s * 0.2},${y + s * 0.7}" />
        <line x1="${x + s * 0.55}" y1="${y + s * 0.7}" x2="${x + s * 0.8}" y2="${y + s * 0.7}" />
      `;
      break;
    }
    case 'code': {
      // < / >
      inner = `
        <polyline points="${x + s * 0.35},${y + s * 0.25} ${x + s * 0.15},${y + s * 0.5} ${x + s * 0.35},${y + s * 0.75}" />
        <polyline points="${x + s * 0.65},${y + s * 0.25} ${x + s * 0.85},${y + s * 0.5} ${x + s * 0.65},${y + s * 0.75}" />
      `;
      break;
    }
    case 'git-branch': {
      inner = `
        <line x1="${x + s * 0.25}" y1="${y + s * 0.2}" x2="${x + s * 0.25}" y2="${y + s * 0.8}" />
        <circle cx="${x + s * 0.25}" cy="${y + s * 0.25}" r="${s * 0.15}" fill="none" />
        <circle cx="${x + s * 0.25}" cy="${y + s * 0.75}" r="${s * 0.15}" fill="none" />
        <circle cx="${x + s * 0.75}" cy="${y + s * 0.35}" r="${s * 0.15}" fill="none" />
        <path d="M${x + s * 0.25} ${y + s * 0.5} L${x + s * 0.5} ${y + s * 0.5} L${x + s * 0.75} ${y + s * 0.5} L${x + s * 0.75} ${y + s * 0.35}" fill="none" />
      `;
      break;
    }
    case 'layers': {
      // Stacked parallel quads
      inner = `
        <polygon points="${x + s * 0.5},${y + s * 0.15} ${x + s * 0.85},${y + s * 0.35} ${x + s * 0.5},${y + s * 0.55} ${x + s * 0.15},${y + s * 0.35}" fill="none" />
        <polyline points="${x + s * 0.15},${y + s * 0.55} ${x + s * 0.5},${y + s * 0.75} ${x + s * 0.85},${y + s * 0.55}" fill="none" />
        <polyline points="${x + s * 0.15},${y + s * 0.75} ${x + s * 0.5},${y + s * 0.95} ${x + s * 0.85},${y + s * 0.75}" fill="none" />
      `;
      break;
    }
    case 'shield': {
      inner = `
        <polygon points="${x + s * 0.5},${y + s * 0.15} ${x + s * 0.85},${y + s * 0.25} ${x + s * 0.85},${y + s * 0.55} ${x + s * 0.5},${y + s * 0.85} ${x + s * 0.15},${y + s * 0.55} ${x + s * 0.15},${y + s * 0.25}" fill="none" />
      `;
      break;
    }
    case 'cpu': {
      inner = `
        <rect x="${x + s * 0.25}" y="${y + s * 0.25}" width="${s * 0.5}" height="${s * 0.5}" fill="none" rx="0" ry="0" />
        <line x1="${x + s * 0.35}" y1="${y}" x2="${x + s * 0.35}" y2="${y + s * 0.25}" />
        <line x1="${x + s * 0.65}" y1="${y}" x2="${x + s * 0.65}" y2="${y + s * 0.25}" />
        <line x1="${x + s * 0.35}" y1="${y + s * 0.75}" x2="${x + s * 0.35}" y2="${y + s}" />
        <line x1="${x + s * 0.65}" y1="${y + s * 0.75}" x2="${x + s * 0.65}" y2="${y + s}" />
        <line x1="${x}" y1="${y + s * 0.35}" x2="${x + s * 0.25}" y2="${y + s * 0.35}" />
        <line x1="${x}" y1="${y + s * 0.65}" x2="${x + s * 0.25}" y2="${y + s * 0.65}" />
        <line x1="${x + s * 0.75}" y1="${y + s * 0.35}" x2="${x + s}" y2="${y + s * 0.35}" />
        <line x1="${x + s * 0.75}" y1="${y + s * 0.65}" x2="${x + s}" y2="${y + s * 0.65}" />
      `;
      break;
    }
    case 'folder': {
      inner = `
        <polygon points="${x + s * 0.1},${y + s * 0.25} ${x + s * 0.4},${y + s * 0.25} ${x + s * 0.5},${y + s * 0.35} ${x + s * 0.9},${y + s * 0.35} ${x + s * 0.9},${y + s * 0.8} ${x + s * 0.1},${y + s * 0.8}" fill="none" />
      `;
      break;
    }
    case 'arrow-up-right': {
      inner = `
        <line x1="${x + s * 0.2}" y1="${y + s * 0.8}" x2="${x + s * 0.8}" y2="${y + s * 0.2}" />
        <polyline points="${x + s * 0.4},${y + s * 0.2} ${x + s * 0.8},${y + s * 0.2} ${x + s * 0.8},${y + s * 0.6}" fill="none" />
      `;
      break;
    }
    case 'arrow-right': {
      inner = `
        <line x1="${x + s * 0.15}" y1="${y + s * 0.5}" x2="${x + s * 0.85}" y2="${y + s * 0.5}" />
        <polyline points="${x + s * 0.55},${y + s * 0.2} ${x + s * 0.85},${y + s * 0.5} ${x + s * 0.5},${y + s * 0.8}" fill="none" />
      `;
      break;
    }
    case 'external-link': {
      inner = `
        <path d="M${x + s * 0.45} ${y + s * 0.15} H${x + s * 0.85} V${y + s * 0.55}" fill="none" />
        <line x1="${x + s * 0.85}" y1="${y + s * 0.15}" x2="${x + s * 0.4}" y2="${y + s * 0.6}" />
        <polyline points="${x + s * 0.65},${y + s * 0.45} ${x + s * 0.65},${y + s * 0.85} ${x + s * 0.15},${y + s * 0.85} ${x + s * 0.15},${y + s * 0.35} ${x + s * 0.55},${y + s * 0.35}" fill="none" />
      `;
      break;
    }
    case 'circle-dot': {
      inner = `
        <circle cx="${x + s * 0.5}" cy="${y + s * 0.5}" r="${s * 0.35}" fill="none" />
        <circle cx="${x + s * 0.5}" cy="${y + s * 0.5}" r="${s * 0.12}" fill="${escapeXml(color)}" />
      `;
      break;
    }
    case 'hash': {
      inner = `
        <line x1="${x + s * 0.35}" y1="${y + s * 0.15}" x2="${x + s * 0.25}" y2="${y + s * 0.85}" />
        <line x1="${x + s * 0.75}" y1="${y + s * 0.15}" x2="${x + s * 0.65}" y2="${y + s * 0.85}" />
        <line x1="${x + s * 0.15}" y1="${y + s * 0.35}" x2="${x + s * 0.85}" y2="${y + s * 0.35}" />
        <line x1="${x + s * 0.15}" y1="${y + s * 0.65}" x2="${x + s * 0.85}" y2="${y + s * 0.65}" />
      `;
      break;
    }
    case 'clock': {
      inner = `
        <circle cx="${x + s * 0.5}" cy="${y + s * 0.5}" r="${s * 0.4}" fill="none" />
        <polyline points="${x + s * 0.5},${y + s * 0.25} ${x + s * 0.5},${y + s * 0.5} ${x + s * 0.7},${y + s * 0.5}" fill="none" />
      `;
      break;
    }
    case 'check': {
      inner = `
        <polyline points="${x + s * 0.2},${y + s * 0.5} ${x + s * 0.45},${y + s * 0.75} ${x + s * 0.8},${y + s * 0.25}" fill="none" />
      `;
      break;
    }
  }

  return `<g stroke="${escapeXml(
    color
  )}" stroke-width="${strokeWidth}" stroke-linecap="square" stroke-linejoin="miter">${inner.trim()}</g>`;
}
