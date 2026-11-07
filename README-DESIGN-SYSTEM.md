# README Design System: Stone Glass (v3.1)

**Target:** GitHub profile README (`prem22k/prem22k`)
**Engine:** [`scripts/glass/`](scripts/glass/)
**Rendering context:** GitHub Markdown. Each SVG is shown inside an `<img>`, so no scripts and no external resources load; fonts and screenshots are embedded as `data:` URIs.

The look takes Apple's material language (rounded glass surfaces, specular rims, SF-like type, widget layouts) and dresses it in **premsai.dev's warm stone palette**, so the README feels like part of the portfolio rather than a generic gradient UI.

**Material: `stone` (default).** Every SVG has a transparent canvas, and the panels sit directly on GitHub's page background like native surfaces, so the README reads as one page instead of stacked image slabs. Two other materials exist behind `GLASS_MATERIAL`: `graphite` (Apple neutral greys) and `wallpaper` (the v3.0 blue/violet wallpaper slabs, retired because the glowing indigo gradient read as generic "AI" styling).

| Token | Dark | Light | premsai.dev source |
|---|---|---|---|
| Surface | `#171616` | `#F8F7F5` | `--color-bg-soft` |
| Hairline / separators | `#2C2825` | `#E7E5E4` | `--color-border-subtle` |
| Text | `#F5F2EB` | `#1C1917` | `--color-text-primary` |
| Secondary | `#A8A29E` | `#57534E` | `--color-text-secondary` |
| Tertiary | `#78716C` | `#78716C` | `--color-text-tertiary` (dark value used in light for contrast) |

Colour appears only where it carries meaning: data (language bars, the activity heatmap), app icons, project badges, and the two "action/status" accents ("Open to roles", "Live demo").

---

## Material (wallpaper mode, `GLASS_MATERIAL=wallpaper`)

| Layer | How it's drawn |
|---|---|
| **Wallpaper card** | Rounded rect (r=28) with a base colour and 5 cool colour orbs under a large Gaussian blur. **Every card uses the same composition** (scaled to its size) so the page reads as one desktop. An optional `accent` adds one soft identity-colour orb at the top right (used by project cards). |
| **Frosted glass** | An opaque, more-blurred and more saturated copy of the wallpaper, clipped to the panel. |
| **Tint** | Dark: `#1C1C26` at 42% (60% "strong"). Light: white at 50% (68% "strong"). An optional accent `wash`. |
| **Sheen** | Vertical white gradient fading out over the top of the panel. |
| **Specular rim** | 1.2px diagonal gradient stroke: bright top-left, quiet middle, soft bottom-right. Plus a 1px hairline for definition. |
| **Shadow** | Blurred, offset rect under the panel; the frosted layer hides it inside the panel. |

Panel radius 20, inner elements 14, pills fully rounded.

## Colour

- **Wallpaper:** dark uses blue, violet, indigo, teal and purple orbs on `#07080E`. Light uses pastel versions of the same on `#EEF0F7`. No warm hues in the wallpaper; warmth only comes from accents.
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
| `section-work` | `build-section.ts` | project count |
| `timeline` | `build-timeline.ts` | recent engineering events |
| `journey` | `build-journey.ts` | static experience and recognition |
| `btn-<id>` | `build-buttons.ts` | static (link buttons, wrapped in `<a>` in the README) |

Each card writes `<name>-{dark,light}.svg` and `<name>-compact-{dark,light}.svg`. Buttons write `btn-<id>-{dark,light}.svg` only.

## README layout

- Everything sits inside one `<div align="center">`. There is no plain markdown text, so nothing breaks the glass look.
- Each card is a pair of `<picture>` elements on one line: a desktop one, whose `(max-width: 600px)` source points at the 0×0 `assets/blank.svg`, and a phone one, whose `(min-width: 601px)` source points at the blank. Theme queries are kept on their own sources because GitHub's `<themed-picture>` script rewrites any `media` containing `prefers-color-scheme` when a user forces a theme, and that would drop a combined width condition.
- Links are glass button images inside `<a href>`, so they stay clickable.
- `build-assets.mjs` points the README at content-hashed copies (`assets/v/<name>.<hash>.svg`). GitHub's image CDN can keep serving an old copy of a same-named file after a push, and the `/raw/` redirect drops query strings, so `?v=` cache-busting doesn't work. A new filename per content change does. Identical content is one git blob, so the copies cost no storage, and stale copies are deleted on each build.

## Rules (enforced by `scripts/validate.mjs`)

- Allowed: gradients, filters, clip paths, masks, rounded corners, embedded `data:` images and fonts.
- Forbidden: `<script>`, `<foreignObject>`, `on*=` handlers, external `href`/`src`/`url()`, `@import`, animation.
- Budgets: 80KB per card (section header 60KB, activity 120KB, project cards 280KB), 30KB per button.
- Every variant must embed its Inter subset and have an accessible `<title>`.
- Text that numbers depend on (active days etc.) always uses the last 365 calendar days, so figures agree across components.
