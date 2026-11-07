# README Design System: Liquid Glass (v3)

**Target:** GitHub profile README (`prem22k/prem22k`)
**Engine:** [`scripts/glass/`](scripts/glass/)
**Rendering context:** GitHub Markdown. Each SVG is shown inside an `<img>`, so no scripts and no external resources load; fonts and screenshots are embedded as `data:` URIs.

The look follows Apple's Liquid Glass material (macOS Tahoe / iOS 26): every component is a rounded card with a soft colour wallpaper, frosted glass panels float on top, and the type is SF-like.

---

## Material

| Layer | How it's drawn |
|---|---|
| **Wallpaper card** | Rounded rect (r=28) with a base colour and 4–7 colour orbs under a large Gaussian blur. The orb layout is seeded per component, so output is deterministic. |
| **Frosted glass** | An opaque, more-blurred and more saturated copy of the wallpaper, clipped to the panel. |
| **Tint** | Dark: `#1C1C26` at 42% (60% "strong"). Light: white at 50% (68% "strong"). An optional accent `wash`. |
| **Sheen** | Vertical white gradient fading out over the top of the panel. |
| **Specular rim** | 1.2px diagonal gradient stroke: bright top-left, quiet middle, soft bottom-right. Plus a 1px hairline for definition. |
| **Shadow** | Blurred, offset rect under the panel; the frosted layer hides it inside the panel. |

Panel radius 20, inner elements 14, pills fully rounded.

## Colour

- **Wallpaper:** dark uses deep indigo, blue, violet, teal, magenta and amber orbs on `#07080E`. Light uses pastel indigo, sky, lilac, mint, pink and peach on `#EEF0F7`.
- **Text:** dark `#F5F5F7` / `#C7C7D1` / `#8E8E9A`. Light `#1D1D1F` / `#3C3C43` / `#6E6E78`.
- **Accents:** Apple system colours (blue, green, indigo, orange, pink, purple, red, teal, yellow), with per-theme values in `tokens.ts`. Use them sparingly and with meaning, e.g. a project's identity colour or a highlighted data point.

## Typography

- **Inter** (SIL OFL, see `scripts/fonts/Inter-LICENSE.txt`), in two optical cuts: *text* (opsz 14) and *display* (opsz 32), with weights 400–700.
- Every SVG embeds **only the glyphs it uses**, subset at build time with `pyftsubset`, which comes to about 5–15KB per SVG. Text renders identically on every OS.
- `scripts/fonts/metrics.json` holds the real glyph advances, so every string is **measured at build time**. Static text that doesn't fit its box fails the build; data-driven text is ellipsized or shrunk.
- Scale (px): hero 40, title 24, headline 17, body 14, callout 13, caption 12, eyebrow 11.5 (uppercase), number 34 / 22. Nothing is smaller than 11.5px.

## Responsive behaviour

Text inside an image scales with the image, so each component ships two layouts instead of one stretched one:

| Layout | Width | Shown when | Result |
|---|---|---|---|
| `wide` | 800px | viewport > 600px | 1:1 on desktop GitHub (the README column is ~830px) |
| `compact` | 400px | viewport ≤ 600px | ~1:1 on phones; panels stack vertically |

The README picks a variant with `<picture>` sources (`media="(max-width: 600px) and (prefers-color-scheme: dark)"` …). The `<img>` has **no width attribute**, so images render at their natural size and only shrink when the column is narrower (GitHub sets `max-width: 100%`). They never get blown up.

## Components

| Asset | Builder | Data |
|---|---|---|
| `hero` | `build-hero.ts` | identity, latest activity |
| `github-year` | `build-github-stats.ts` | contributions, calendar, overview |
| `project-<slug>` | `build-projects.ts` | static facts + screenshots in `data/shots/` |
| `codebase` | `build-codebase.ts` | language bytes |
| `stack` | `build-stack.ts` | static |
| `activity` | `build-activity.ts` | contribution calendar (last 365 days) |

Each one writes `<name>-{dark,light}.svg` and `<name>-compact-{dark,light}.svg`.

## Rules (enforced by `scripts/validate.mjs`)

- Allowed: gradients, filters, clip paths, masks, rounded corners, embedded `data:` images and fonts.
- Forbidden: `<script>`, `<foreignObject>`, `on*=` handlers, external `href`/`src`/`url()`, `@import`, animation.
- Budgets: 80KB per component (activity 120KB, project cards 280KB).
- Every variant must embed its Inter subset and have an accessible `<title>`.
- Text that numbers depend on (active days etc.) always uses the last 365 calendar days, so figures agree across components.
