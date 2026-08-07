# GitHub Profile README Audit: `prem22k/prem22k`

**Date:** August 2026  
**Repository:** `prem22k/prem22k`  
**Current State:** Uncommitted exploratory custom SVG generator + hybrid legacy README

---

## 1. Current Architecture

```
prem22k/
├── README.md                  # Main profile entry point (mix of legacy widgets & SVG embeds)
├── banner.gif                 # Mario coding GIF banner (Non-negotiable asset)
├── adviser-cli.png            # Screenshot of Adviser-CLI terminal interface
├── servx.png                  # Screenshot of ServX dashboard interface
├── zync-meet.png              # Screenshot of Zync collaborative app interface
├── scripts/
│   └── build-assets.mjs       # Node.js script generating 16 static SVG card components
└── assets/                    # 16 generated dark/light SVG files
    ├── header-{dark,light}.svg
    ├── now-{dark,light}.svg
    ├── project-{servx,zync,adviser-cli}-{dark,light}.svg
    ├── stack-{dark,light}.svg
    ├── achievements-{dark,light}.svg
    └── contact-{dark,light}.svg
```

### Architecture Flow
1. `scripts/build-assets.mjs` hardcodes metadata and generates 16 SVGs into `assets/`.
2. `README.md` references the SVGs via `<picture>` HTML elements with `prefers-color-scheme`.
3. Project screenshots (`.png`) are referenced directly below the SVG cards.
4. Third-party Vercel services (`github-readme-activity-graph.vercel.app`, `github-readme-stats.vercel.app`) are referenced for dynamic GitHub stats.
5. **No GitHub Actions CI/CD:** Asset generation and metric updates are completely manual.

---

## 2. Current Assets Inventory

| Asset | Type / Size | Dimensions | Status / Purpose | Evaluation |
|---|---|---|---|---|
| `banner.gif` | GIF (154.8 KB) | 735 × 245 | **Mario coding GIF** (Hero Header) | **NON-NEGOTIABLE CORE ASSET**. Keep prominently placed. |
| `servx.png` | PNG (257.5 KB) | 1919 × 934 | ServX Dashboard Preview | **High quality real UI screenshot**. Keep. |
| `zync-meet.png` | PNG (136.7 KB) | 1919 × 934 | Zync Collaborative UI Preview | **High quality real UI screenshot**. Keep. |
| `adviser-cli.png` | PNG (61.9 KB) | 1832 × 822 | Adviser-CLI Terminal Preview | **High quality real CLI screenshot**. Keep. |
| `assets/contact-*.svg` | SVG (2.3 KB ea) | 800 × 46 | Faux Contact Buttons | **BROKEN / OBSOLETE**. SVGs in `<img>`/`<picture>` cannot handle links. Contains invalid XML syntax. |
| `assets/header-*.svg` | SVG (2.0 KB ea) | 800 × 130 | Identity & Tagline Card | **REDUNDANT**. Duplicates Mario banner & markdown headings. |
| `assets/now-*.svg` | SVG (2.8 KB ea) | 800 × 150 | "Current Focus" 3-Col Card | **UNNECESSARY CARD LAYER**. Traps readable text in static images. |
| `assets/project-*-*.svg` | SVG (4.6 KB ea) | 800 × 150 | 3x Project Header Cards | **EXCESSIVE VISUAL REPETITION**. Redundant with screenshots + markdown bullets. |
| `assets/stack-*.svg` | SVG (8.2 KB ea) | 800 × 230 | 6-Category Text Grid | **ACCESSIBILITY FAILURE**. Traps tech stack text in an unsearchable image; contains invalid XML syntax. |
| `assets/achievements-*.svg` | SVG (2.1 KB ea) | 800 × 120 | Hackathon Cards | **UNNECESSARY**. Better as crisp, searchable markdown or verified badge metadata. |

---

## 3. Current Problems

### A. Visual & UX Problems
1. **Unclickable SVG "Links":** `contact-dark.svg` / `contact-light.svg` visually look like pill buttons (Portfolio, LinkedIn, Email, GitHub), but GitHub renders SVGs inside `<img>` or `<picture>` tags in an isolated sandbox where `<a>` anchors are **completely disabled**. Visitors cannot click them.
2. **Quadruple Redundancy per Project:** Each project currently features:
   - (1) An SVG header card with tags and fake "CASE STUDY // ↗" buttons,
   - (2) A PNG screenshot,
   - (3) A blockquote summary with bold keywords,
   - (4) A list of markdown links.  
   This creates overwhelming vertical bloat and visual exhaustion.
3. **Trapping Text in Static SVGs:** Rendering skills, roles, and current focus as fixed-dimension SVGs destroys mobile responsiveness, breaks screen readers/accessibility, and prevents recruiters from copying text or searching via `Ctrl+F`.
4. **2023–2025 "Template Grids" & Card Clutter:** Over-reliance on dark rounded cards (`rx="8"`), thick borders (`#30363d`), and numbered chips (`01 · BUILDING`, `02 · WORKING`) mimics outdated developer portfolio templates rather than an authentic senior/staff engineer presence.
5. **Inconsistent Header Treatment:** The Mario GIF is placed at the very top, immediately followed by a contact SVG card, immediately followed by a header SVG card, immediately followed by a "NOW" card. There are 4 distinct top banners before reaching any real content.

### B. Information & Content Problems
1. **High-Signal Data is Hidden:** Prem has genuine flagship technical achievements:
   - **ServX:** Enterprise infrastructure monitoring monorepo with AES-256 encrypted storage, SSE real-time audit streams, and webhook incident detection.
   - **Zync:** AI-native real-time collaborative workspace with conflict-free editing (Yjs CRDTs / WebSockets / Firestore sync) and LLM architecture generation.
   - **Adviser-CLI:** Local-first dense/sparse RAG engine (ChromaDB + BM25), VisionRAG ColPali embeddings, published as an MCP server.
   - **Real Experience:** RigorBase intern (Redis rate limiting, OAuth, v3 design system), Technical Head @ C³ SNIST (1,000+ users).
   - **Hackathons:** Brainrot Hackathon Double Track Winner (1,224 entrants), JNTUH HackFusion 5th place (230+ teams).  
   *Problem:* This compelling story is diluted under layers of boilerplate pills, duplicate summaries, and static SVG cards.
2. **Redundant Bio & Roles:** "About Me", "NOW card", and "Work Experience" repeat the exact same sentences 3 separate times.
3. **Flaky Third-Party Widgets:** Activity graph and top languages rely on external Vercel community deployments (`github-readme-activity-graph.vercel.app`) which are prone to rate limits, cold-start latency, and service outages.

### C. Engineering & Code Problems
1. **Invalid XML Attribute Syntax in `build-assets.mjs`:**  
   `FONT_MONO` is defined as `ui-monospace, SFMono-Regular, "SF Mono", Menlo, ...`. When interpolated into `<text font-family="${FONT_MONO}">`, the internal double quotes `"SF Mono"` break XML attribute parsing, producing invalid SVG attributes in all generated files.
2. **Zero Automated Pipeline / No GitHub Actions:** If anything in the stack or role changes, someone has to manually run `node scripts/build-assets.mjs` and git commit the output.
3. **Hardcoded State:** Hardcoded metrics (like "STATUS: OPEN TO WORK" inside `header-*.svg`) cannot be updated dynamically without re-running scripts and re-committing binary/SVG files.

---

## 4. Data Sources Audit

### 1. Verified Data (Directly validated from repositories & code)
- **Flagship Projects & Architectures:**
  - `ServX` (`Servx-lab/ServX`): Monorepo (apps/web, apps/api, apps/worker, packages/cli), Express 5 SSE streams, AES-256 crypto, Redis, PostgreSQL.
  - `Zync` (`zync-meet/Zync`): React 19, Socket.io, Yjs CRDT sync, MongoDB + Firestore hybrid consistency, Gemini LLM architecture generation.
  - `Adviser-CLI` (`prem22k/adviser-cli-tool`): Python + Node CLI (`@prem22k/adviser-cli` v0.3.3), ChromaDB vector store, BM25 retrieval, MCP server integration.
- **Assets:** `banner.gif` (Mario coding animation), `servx.png`, `zync-meet.png`, `adviser-cli.png`.
- **Profiles:** `https://github.com/prem22k`, `https://premsai.vercel.app`, `https://linkedin.com/in/premsai22k`, `mailto:premsai224k@gmail.com`.

### 2. Manually Curated Data (High credibility, maintained by user)
- **Internship:** RigorBase Full-Stack Developer Intern (Mar 2026 – Apr 2026) — closed beta access, Redis rate limiting, OAuth, v3 design system, gamified quizzes.
- **Leadership:** Technical Head @ Cloud Community Club (C³), SNIST (Nov 2024 – Present) — platform for 1,000+ campus developers, automated notifications, CI/CD.
- **Competitions:** 
  - 🥇 Double Track Winner @ Brainrot Hackathon (1,224 participants).
  - 🏅 5th Place Nationally @ JNTUH HackFusion-2K26 (230+ teams).

### 3. Derived Data (Computed or external)
- GitHub commit activity, contribution streaks, top language percentages (fetched from GitHub API or third-party badge endpoints).

### 4. Assumptions / Unknowns
- Uptime and maintenance overhead of external third-party SVG services (`github-readme-activity-graph` vs native GitHub metrics or scheduled GitHub Action generation).
- Preferred contact hierarchy (Portfolio vs LinkedIn vs Email).

---

## 5. Reusable Code & Assets

- **Keep Intact:**
  - `banner.gif`: Mario coding GIF (non-negotiable).
  - `servx.png`, `zync-meet.png`, `adviser-cli.png`: High-resolution real UI/CLI preview screenshots.
  - Project architectural copy: Rich, technically accurate descriptions of ServX, Zync, and Adviser-CLI.
  - Verified work experience & hackathon win records.
- **Reusable Utility Patterns:**
  - Dark/Light theme color token mapping (`#0d1117` vs `#ffffff`, accent `#f85149` / `#cf222e`) from `build-assets.mjs` if any minimal dynamic SVGs are retained.
  - HTML `<picture>` tag standard for theme-aware switching.

---

## 6. Code & Assets to Delete

- **Delete from Assets / README:**
  - `assets/contact-*.svg`: Broken unclickable faux-buttons.
  - `assets/header-*.svg`: Redundant with Mario banner and markdown title.
  - `assets/now-*.svg`: Unnecessary static image card.
  - `assets/project-*.svg` (all 6 files): Unnecessary card bloat above screenshots.
  - `assets/stack-*.svg`: Inaccessible static text image.
  - `assets/achievements-*.svg`: Inaccessible static card.
- **Delete from `scripts/build-assets.mjs`:**
  - All static card generation code that outputs text as SVG graphics.

---

## 7. Recommended Rebuild Boundary

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HERO HEADER                                              │
│    • Mario Coding GIF (banner.gif)                          │
│    • Clean Markdown Title & Punchy 2026 Focus One-Liner     │
│    • Native Clickable Contact Badges (Markdown / SVGs)      │
├─────────────────────────────────────────────────────────────┤
│ 2. FLAGSHIP PROJECTS (Editorial Case Studies)              │
│    • Crisp Header + Live / Source Links (Directly Clickable)│
│    • Architecture Specs & Highlights (Yjs, SSE, Chroma/MCP) │
│    • Single High-Res UI Preview Screenshot per project      │
├─────────────────────────────────────────────────────────────┤
│ 3. PRODUCTION EXPERIENCE & LEADERSHIP                       │
│    • RigorBase (Full-Stack Intern) & C³ SNIST (Tech Head)   │
│    • Verified Hackathon Wins (Brainrot 1st, HackFusion 5th) │
├─────────────────────────────────────────────────────────────┤
│ 4. TECHNICAL ARSENAL                                        │
│    • Clean, uniform skill icons (skillicons.dev) or curated │
│      semantic markdown matrix with categorised domains      │
├─────────────────────────────────────────────────────────────┤
│ 5. VERIFIED GITHUB ACTIVITY & METRICS                       │
│    • Single unified, reliable metrics card / activity graph │
│      with zero layout shift or broken links                 │
└─────────────────────────────────────────────────────────────┘
```

### Architectural Principles for Rebuild:
1. **30-Second Readability:** Clear visual hierarchy that guides technical recruiters and engineering managers directly to proof of competence.
2. **100% Clickable & Accessible:** Text is selectable markdown; links are real URLs; zero unclickable SVG faux-buttons.
3. **Zero Redundancy:** No 4-layer stacked project blocks. One cohesive project block per system.
4. **Theme Native:** Clean support for both GitHub Dark and Light modes using `<picture>` elements.
5. **Preserve Identity:** The Mario coding GIF remains the centerpiece visual identity.
