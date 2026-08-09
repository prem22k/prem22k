# README Design System

**Direction:** A — Portfolio-Derived Editorial  
**Source of Truth:** [premsai.vercel.app](https://premsai.vercel.app) design system  
**Target:** GitHub profile README (`prem22k/prem22k`)  
**Rendering Context:** GitHub Markdown (no CSS, no JS, limited HTML, SVG sandboxed inside `<img>`)

---

## Tokens

All color values are derived directly from the portfolio's [globals.css](file:///home/premsaik/Desktop/Projects/portfolio/app/globals.css) custom properties.

| Token | Dark Mode | Light Mode | Portfolio Source |
|---|---|---|---|
| **Background** | `#0d1117` | `#ffffff` | GitHub native canvas (closest to `#111010` / `#f2f2f2`) |
| **Surface** | `#161b22` | `#f6f8fa` | Maps to `--color-bg-soft` (`#171616` / `#f8f8f8`) |
| **Primary Text** | `#F5F2EB` | `#1c1917` | `--color-text-primary` |
| **Secondary Text** | `#A8A29E` | `#57534e` | `--color-text-secondary` |
| **Tertiary Text** | `#78716C` | `#a8a29e` | `--color-text-tertiary` |
| **Subtle Border** | `#2C2825` | `#e7e5e4` | `--color-border-subtle` |
| **Strong Border** | `#57534E` | `#a8a29e` | `--color-border-strong` |
| **Accent** | `#F5F2EB` | `#292524` | `--color-accent` |

### Token Usage Rules

- **Background** is never set explicitly in markdown — it is the native GitHub canvas.
- **Surface** is used only inside SVG `<rect>` fills for generated components.
- **Primary Text** is used for names, project titles, and emphasis.
- **Secondary Text** is the default reading color for body copy and descriptions.
- **Tertiary Text** is used for labels, indices, captions, and de-emphasized metadata.
- **Subtle Border** is used for 1px horizontal rules and image frame strokes.
- **Strong Border** is reserved for emphasis dividers (used sparingly — at most 1–2 per README).
- **Accent** is used for exactly one element: a 2px vertical bar on the identity block. Nowhere else.

### Prohibited Colors

No red, blue, green, orange, or any chromatic color appears anywhere in the design system. The Mario GIF is the sole chromatic element. All other visual elements are achromatic (gray-scale with warm stone undertones).

---

## Typography

### Font Stacks

| Role | Stack | Portfolio Origin |
|---|---|---|
| **Sans (Primary)** | `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif` | `--font-sans` → Inter |
| **Mono (Technical)** | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | `--font-mono` → IBM Plex Mono / JetBrains Mono |

> **Note:** GitHub's SVG rendering does not load external fonts. These stacks ensure the closest system-level match to Inter and IBM Plex Mono across platforms.

### Type Scale

| Level | Name | Family | Size | Weight | Letter-Spacing | Color | Usage |
|---|---|---|---|---|---|---|---|
| 1 | **Display** | Sans | 24px | 600 | -0.5px | Primary | Profile name only |
| 2 | **Section Heading** | Sans | 16px | 600 | -0.2px | Primary | `## Section Title` in markdown |
| 3 | **Body** | Sans | 13.5px | 400 | 0 | Secondary | Descriptions, summaries, paragraphs |
| 4 | **Technical Metadata** | Mono | 11px | 600 | 0.8px | Tertiary | Category labels, tech stack items, architecture keywords |
| 5 | **Micro Label** | Mono | 10.5px | 600 | 1.2px | Tertiary | Section labels (`SELECTED WORK`, `EXPERIENCE`), always uppercase |
| 6 | **Data Number** | Mono | 11px | 400 | 0 | Secondary | Project indices (`01`, `02`), numeric counters |
| 7 | **Caption** | Mono | 10px | 400 | 0.5px | Tertiary | Image captions, source attributions, fine-print metadata |

### Typography Rules

1. **Uppercase is reserved for Micro Labels and Technical Metadata only.** Never uppercase body text, project names, or section headings.
2. **Bold (weight 600–700) is used sparingly.** Only Display, Section Heading, and inline `**emphasis**` in markdown body copy.
3. **Monospace is functional, not decorative.** It appears only where content is genuinely technical: labels, indices, stack items, metadata. Body text is always sans-serif.
4. **Line height:** Body text uses `1.55` (portfolio's `leading-[1.55]`). Headings use `1.2`. Labels use `1.0`.
5. **Maximum paragraph width:** `58ch` for body text (portfolio's `.intro-copy` max-width). In markdown, this is enforced by keeping sentences concise, not by CSS.

### Portfolio Typography Mapping

| Portfolio Class | Portfolio Value | README Equivalent |
|---|---|---|
| `.profile-block h1` | `clamp(2.5rem, 7vw, 4.6rem)`, weight 500 | Display: 24px, weight 600 (scaled for 800px SVG canvas) |
| `.section-heading` | `1.3rem`, weight 500 | Section Heading: 16px, weight 600 |
| `.intro-copy` | `1rem`, line-height 1.72, max-width 58ch | Body: 13.5px, line-height 1.55 |
| `.label` | `0.72rem`, tracking 0.08em, uppercase, tertiary | Micro Label: 10.5px, tracking 1.2px, uppercase |
| `.work-number` | `0.72rem`, tracking 0.08em, uppercase, tertiary | Data Number: 11px, mono |
| `.folder-meta strong` | `1rem`, weight 500 | Body emphasis: `**bold**` in markdown |
| `.role-line` | `1rem`, secondary | Body: 13.5px, secondary |

---

## Geometry

### Radii

```
border-radius: 0
```

All elements. No exceptions. This matches the portfolio's Tailwind config:
```js
borderRadius: { lg: '0', md: '0', sm: '0' }
```

### Border & Rule Thickness

| Element | Thickness | Color |
|---|---|---|
| Horizontal section divider | 1px | Subtle Border |
| Image frame stroke | 1px | Subtle Border |
| Identity accent bar | 2px wide × full block height | Accent |
| Strong divider (rare) | 1px | Strong Border |

### Spacing Scale

Derived from the portfolio's custom spacing tokens:

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Inline gaps, icon-to-text |
| `space-2` | 6px | Tight element spacing |
| `space-3` | 8px | Label-to-content gap |
| `space-4` | 12px | Intra-section spacing (between items in a list) |
| `space-5` | 16px | Standard content gap |
| `space-6` | 24px | Section padding, header-to-content |
| `space-7` | 40px | Major section spacing |
| `space-8` | 56px | Section-to-section gap (between `---` rules) |

### Section Spacing in Markdown

- Between the Mario GIF and the identity block: **1 blank line** (≈ 16px rendered)
- Between text blocks within a section: **1 blank line**
- Between sections (separated by `---`): **`---` produces ≈ 40–56px visual gap** — this is the primary structural rhythm
- Between a section label and its first content element: **1 blank line**

### Alignment Rules

1. **All content is left-aligned.** No `<div align="center">` except for the Mario GIF hero and the activity graph.
2. **The Mario GIF is the only centered element.** It is the deliberate exception.
3. **Images are left-aligned and full-width** within the content column.
4. **Text never wraps around images.** Content flows vertically, never in side-by-side layout (GitHub markdown does not support CSS grid/flexbox).

---

## Composition

### Content Dimensions

| Property | Value | Rationale |
|---|---|---|
| **Maximum content width** | 800px | GitHub's README rendering column is ≈ 800–888px. SVGs use 800px viewBox. |
| **SVG viewBox width** | 800 | Consistent across all generated SVG components |
| **Standard horizontal padding** | 0px in markdown, 24px inside SVGs | Markdown is flush to GitHub's content column; SVGs have internal padding |

### Grid Structure

**Single-column vertical flow.** No multi-column layouts in markdown (GitHub does not support them reliably). Columns are achieved only inside SVG components where precise positioning is possible.

```
┌──────────────────────────── 800px ────────────────────────────┐
│                                                                │
│  [Mario GIF — full-width, centered]                           │
│                                                                │
│  [Identity Block — left-aligned]                              │
│                                                                │
│  ────────────────── 1px rule ──────────────────               │
│                                                                │
│  SELECTED WORK                                                 │
│  01  Project Title                                             │
│      Description paragraph                                     │
│      [Screenshot — full-width, sharp frame]                   │
│      Links                                                     │
│                                                                │
│  ────────────────── 1px rule ──────────────────               │
│                                                                │
│  02  Project Title                                             │
│      ...                                                       │
│                                                                │
│  ────────────────── 1px rule ──────────────────               │
│                                                                │
│  EXPERIENCE                                                    │
│      ...                                                       │
│                                                                │
│  ────────────────── 1px rule ──────────────────               │
│                                                                │
│  STACK                                                         │
│      ...                                                       │
│                                                                │
│  ────────────────── 1px rule ──────────────────               │
│                                                                │
│  ACTIVITY                                                      │
│      [Graph — centered]                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Section Rhythm

The README follows a strict vertical rhythm:

```
HERO (Mario GIF)
↓ 16px
IDENTITY (name, role, tagline, contact)
↓ --- rule (40px)
SECTION (projects, experience, stack, etc.)
↓ --- rule (40px)
SECTION
↓ --- rule (40px)
SECTION
↓ --- rule (40px)
FOOTER (activity graph)
```

Every major section is separated by a markdown `---` horizontal rule. No other structural separator is used.

### Image Treatment

| Property | Value |
|---|---|
| **Width** | `width="100%"` — images fill the content column |
| **Frame** | None in markdown; 1px Subtle Border stroke in SVG containers |
| **Border radius** | 0 (no `style="border-radius"` attributes) |
| **Aspect ratios** | Screenshots maintain native aspect ratio (no cropping) |
| **Alt text** | Required on all images. Descriptive, not decorative. |

### Screenshot Specifications

| Screenshot | Native Dimensions | Treatment |
|---|---|---|
| `servx.png` | 1919 × 934 | Full-width, sharp frame, linked to live demo |
| `zync-meet.png` | 1919 × 934 | Full-width, sharp frame, linked to live demo |
| `adviser-cli.png` | 1832 × 822 | Full-width, sharp frame, linked to repo |
| `banner.gif` | 735 × 245 | Full-width, centered, no frame |

### Text Widths

- **Tagline / summary:** Natural markdown width (≈ 80–100 characters per line at 800px)
- **Project description blockquotes:** Keep to 2–3 lines maximum. If longer, the description is too verbose.
- **Experience bullets:** Single-line items. No nested bullets.

---

## Data Visualizations

### Contribution / Activity Graph

The activity graph uses the third-party `github-readme-activity-graph` widget, re-themed to match the design system.

| Parameter | Dark Mode | Light Mode |
|---|---|---|
| `bg_color` | `0d1117` | `ffffff` |
| `color` (text) | `A8A29E` | `57534e` |
| `line` (graph line) | `A8A29E` | `57534e` |
| `point` (data points) | `F5F2EB` | `1c1917` |
| `area` | `true` | `true` |
| `hide_border` | `true` | `true` |

> The graph line uses **Secondary Text** color, not any chromatic accent. Data points use **Primary Text**. This keeps the graph achromatic and warm, matching the editorial tone.

### Language Visualization

If a top-languages widget is used (optional), it must follow these rules:

1. **No pie charts or donut charts.** Use compact bar layout only.
2. **Colors:** Use the achromatic scale only. Primary language gets Primary Text color; subsequent languages get progressively lighter shades toward Tertiary.
3. **Hide border.** Match background to canvas.

### Chart Typography

- **Axes labels:** Mono, 10px, Tertiary color
- **Data labels:** Mono, 11px, Secondary color
- **No chart titles** — the section heading above serves that function

### Density Rules

- **Maximum 1 visualization widget** in the entire README.
- The widget should be the activity contribution graph only.
- No stats cards, no streak counters, no trophy widgets, no redundant language breakdowns.

---

## Anti-Patterns

The following are **explicitly prohibited** in this design system. Any PR or commit introducing these elements violates the visual contract.

| # | Anti-Pattern | Why Prohibited |
|---|---|---|
| 1 | **Gradients** | Violates flat achromatic design. No `linear-gradient`, no `radial-gradient`. |
| 2 | **Rounded cards** | `border-radius: 0` is absolute. No `rx="8"`, no `rounded-lg`, no `border-radius` attributes. |
| 3 | **Pill badges** | No `border-radius: 999px` containers for tags or labels. Use plain text or 1px-bordered rectangular containers. |
| 4 | **Glow effects** | No `box-shadow` with spread, no `filter: drop-shadow`, no SVG `<feGaussianBlur>` glow. |
| 5 | **Glass / blur** | No `backdrop-filter`, no `blur()`, no transparency-over-background effects. The portfolio uses glass; the README does not. |
| 6 | **Giant skill icons** | No `skillicons.dev` grids, no 48px technology logos, no icon walls. Stack is presented as categorized text. |
| 7 | **Excessive monospace** | Monospace is for labels, indices, and technical metadata only. Body text, project descriptions, and section headings are always sans-serif. |
| 8 | **Fake metrics** | No fabricated numbers. Every number in the README must be verifiable (e.g., "1,224 participants" is from a real hackathon result). |
| 9 | **Fake percentages** | No "95% TypeScript" unless derived from actual GitHub API data. No decorative skill-level percentages. |
| 10 | **Decorative progress bars** | No skill-level progress bars (e.g., "Python ████████░░ 80%"). These are meaningless and universally recognized as fake. |
| 11 | **Gamer / RPG language** | No "Arsenal", "Power-ups", "Level", "XP", "Quest", "Boss", "Achievement Unlocked". Use professional engineering language. |
| 12 | **Generic GitHub widgets** | No `github-readme-stats` cards, no streak counters, no trophy grids. Maximum 1 widget: the activity graph. |
| 13 | **Emoji section headers** | No `## 🚀 Projects` or `## 🛠️ Tech Stack`. Section headings are plain text. |
| 14 | **Shields.io badge walls** | No rows of `img.shields.io` badges for technologies, stars, forks, etc. |
| 15 | **Animated SVGs** | No CSS animations inside SVG files. The Mario GIF is the only animated element. |
| 16 | **Red/blue/green status indicators** | No traffic-light coloring, no "STATUS: OPEN TO WORK" with green dot. Status is communicated through plain text if needed. |

---

## Theme Implementation

GitHub supports `prefers-color-scheme` via `<picture>` elements:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/component-dark.svg" />
  <img src="assets/component-light.svg" alt="Description" width="100%" />
</picture>
```

### Rules

1. Every SVG component must be generated in **both** dark and light variants.
2. The light variant is always the `<img src>` fallback (default).
3. Alt text must be descriptive and content-relevant, never decorative.
4. SVGs rendered via `<img>` or `<picture>` are **sandboxed** — no links, no interactivity, no external resources. Clickable links must be native markdown, never inside SVGs.

---

## SVG Generation Contract

All SVG components produced by `scripts/build-assets.mjs` must satisfy:

1. **Valid XML.** All attribute values properly escaped. No unquoted font-family strings containing internal double quotes.
2. **Self-contained.** No external font loads, no `<image>` references, no `xlink:href` to external resources.
3. **Accessible.** Every `<svg>` has `role="img"` and `aria-label="..."` with meaningful text.
4. **Deterministic dimensions.** Fixed `width`, `height`, and `viewBox`. No responsive scaling inside SVGs.
5. **Token-compliant.** Every color value in the SVG must map to a token defined in this document. No ad-hoc hex values.

---

*This document is the visual contract. All implementation decisions defer to it.*
