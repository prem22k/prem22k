# Information Architecture & Content Model

**Design System:** Direction A — Portfolio-Derived Editorial  
**Visual Contract:** [README-DESIGN-SYSTEM.md](file:///home/premsaik/Desktop/Projects/prem22k/README-DESIGN-SYSTEM.md)

---

## Real Data Baseline

Before designing sections, here is what we actually have:

| Metric | Value | Signal Strength |
|---|---|---|
| Public repos | 37 (27 non-fork) | Moderate |
| Total stars (non-fork) | 56 | Low |
| Followers | 37 | Low |
| Account age | Mar 2024 → Aug 2026 (≈ 2.4 years) | Early career |
| Primary language | TypeScript (11 repos) | Clear identity |
| Secondary languages | JavaScript (6), CSS (4), Python (3) | Breadth |
| Flagship: Zync | ★16 F1 (org repo) | Strongest signal |
| Flagship: MemeCoin-Roulette | ★6 | Hackathon winner |
| Flagship: Adviser-CLI | ★5 | Published npm package |
| Verified experience | 1 internship (RigorBase), 1 leadership role (C³) | Solid for stage |
| Verified competitions | 2 hackathon placements | Strong for stage |

### Honest Assessment

Prem is **early-career** with **strong project depth but modest aggregate metrics**. The profile must lead with project quality and technical specificity — not volume metrics. Vanity numbers (stars, followers, repo count) will not impress at these levels and should not be featured.

The strategy: **depth over breadth, specificity over scale.**

---

## Impression Sequence Analysis

| Target Impression | What Produces It | Timing |
|---|---|---|
| **"This guy knows his stuff."** | Identity + role clarity + specific technical vocabulary | First 3 seconds (hero) |
| **"He clearly builds a lot."** | 3 real projects with real screenshots + contribution graph | First 10 seconds (scroll) |
| **"These projects are technically serious."** | Architecture details (CRDTs, SSE, AES-256, MCP) + live demos | 15–30 seconds (reading) |
| **"This profile itself is engineered."** | Consistent design system, achromatic warmth, restrained typography, no template DNA | Ambient (whole page) |

---

## Section-by-Section Evaluation

### Proposed sections evaluated against the impression sequence:

### 1. HERO ✅ Keep

| Attribute | Value |
|---|---|
| **Purpose** | Establish identity, role, and technical domain in 3 seconds |
| **Information** | Mario GIF, name, role title, one-line technical summary, contact links |
| **Data source** | Static (manually curated) |
| **Generation** | Markdown only — no SVG required |
| **Why it exists** | Non-negotiable. Every profile needs an identity block. The Mario GIF is the signature visual identity. |

### 2. CURRENTLY → Merge into Hero

| Attribute | Value |
|---|---|
| **Purpose** | Show active engagement and forward momentum |
| **Information** | What Prem is building/exploring right now |
| **Verdict** | **MERGE INTO HERO.** The portfolio's "NOW" block works because it's in a 2-column layout alongside the bio. In a single-column README, a standalone "Currently" section with 2–3 lines of text creates an anemic section that breaks rhythm. Instead, fold the current focus into the hero's one-line summary or a brief sub-line. |

**Example integration:**
```
Full-Stack Engineer · Building realtime collaboration, AI tooling, and production RAG pipelines
Currently: Technical Head @ Cloud Community Club · Ex-Intern @ RigorBase
```

### 3. GITHUB / YEAR ❌ Cut

| Attribute | Value |
|---|---|
| **Purpose** | Prove volume with aggregate year-to-date numbers |
| **Information** | Total contributions, repos created, primary language |
| **Verdict** | **CUT.** With 37 followers and 56 total stars, a prominent "YEAR IN REVIEW" section draws attention to modest aggregate numbers. This section format works for engineers with 500+ stars or 2,000+ contributions. For Prem's stage, it's a liability. The contribution graph at the bottom provides the same "builds consistently" signal without spotlighting raw numbers. |

**Revisit when:** Total stars exceed 200, or annual contributions exceed 1,500.

### 4. SELECTED WORK ✅ Keep (elevated to position 2)

| Attribute | Value |
|---|---|
| **Purpose** | Prove technical depth with real, shipped products |
| **Information** | 3 flagship projects: ServX, Zync, Adviser-CLI — each with category label, technical summary, screenshot, live/source links |
| **Data source** | Static (manually curated descriptions) + static screenshots |
| **Generation** | Markdown + PNG screenshots. No SVG cards above screenshots. |
| **Why it exists** | This is the **core of the profile**. Projects are the single strongest signal of engineering competence. They must come early — position 2, immediately after the hero. A recruiter who scrolls past the hero should land on a real project screenshot within 1 scroll. |

### 5. CODEBASE → Rename to STACK ✅ Keep

| Attribute | Value |
|---|---|
| **Purpose** | Demonstrate technical breadth across domains |
| **Information** | Categorized technology expertise: Languages, Frontend, Backend/Data, AI/RAG, Realtime Systems, DevOps |
| **Data source** | Manually curated (validated against actual project code) |
| **Generation** | SVG (dark/light) — a text-only categorized grid. Markdown cannot achieve the multi-column layout needed for 6 categories. |
| **Why it exists** | After seeing 3 deep project showcases, a recruiter wants to know "what else can this person do?" The stack section answers that question with categorized text — no icons, no pills, no progress bars. |

### 6. ACTIVITY ✅ Keep (repositioned)

| Attribute | Value |
|---|---|
| **Purpose** | Visual proof of consistent building over time |
| **Information** | GitHub contribution graph (commits, PRs, issues over time) |
| **Data source** | Derived (third-party widget pulling from GitHub API) |
| **Generation** | Third-party `github-readme-activity-graph` widget, re-themed to design system achromatic palette |
| **Why it exists** | The contribution graph is the most honest signal on a GitHub profile. It cannot be faked. A dense graph says "this person ships consistently." Even a moderately active graph is better than no graph — it shows real activity. |

### 7. RECENT WORK ❌ Cut

| Attribute | Value |
|---|---|
| **Purpose** | Show breadth beyond the 3 flagships |
| **Information** | List of recent repositories with one-line descriptions |
| **Verdict** | **CUT.** Prem's non-flagship repos (skillpath, verion, ToolDeck, jobscrape, wealth-folio, twimba-scrimba, etc.) are learning projects and experiments. Listing them dilutes the technical authority established by the 3 flagships. Signal-to-noise ratio drops sharply. |
| **Alternative:** If Prem ships a 4th strong project, add it to SELECTED WORK. Don't create a "recent" graveyard. |

### 8. EXPERIENCE ✅ Keep

| Attribute | Value |
|---|---|
| **Purpose** | Professional credibility — someone paid this person to build software |
| **Information** | RigorBase internship (what was built, technical specifics), C³ @ SNIST leadership (scale: 1,000+ users, platform architecture) |
| **Data source** | Manually curated (verified from portfolio and README history) |
| **Generation** | Markdown only — bullet lists with `**bold**` emphasis |
| **Why it exists** | An internship at a real company + a technical leadership role validate that Prem operates in professional environments, not just solo projects. This is a crucial signal for recruiters evaluating hire-readiness. |

### 9. RECOGNITION ✅ Keep

| Attribute | Value |
|---|---|
| **Purpose** | Competitive validation — external parties evaluated this person and ranked them highly |
| **Information** | Brainrot Hackathon (Double Track Winner, 1,224 entrants), JNTUH HackFusion-2K26 (5th place nationally, 230+ teams) |
| **Data source** | Manually curated (verifiable event results) |
| **Generation** | Markdown only — compact line items |
| **Why it exists** | Hackathon wins are the strongest third-party validation available to an early-career engineer. These are not self-assessed skills — they are ranked results from competitive events with verifiable participant counts. |

### 10. PROFILE DATA ❌ Cut

| Attribute | Value |
|---|---|
| **Purpose** | Contact information and profile links |
| **Verdict** | **CUT.** Contact links already live in the hero section. GitHub itself shows location, blog URL, and bio in the profile sidebar. A dedicated footer section repeating this data adds nothing. If someone has scrolled to the bottom of the README, they've already seen the hero links. |

---

## Final Architecture

7 sections. Each earns its position.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─ § 1  HERO ─────────────────────────────────────────────┐   │
│  │  Mario GIF (centered, full-width)                        │   │
│  │  Name · Role · Technical Summary                         │   │
│  │  Currently / Status · Contact Links                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ──────────────────── 1px rule ────────────────────────────     │
│                                                                 │
│  ┌─ § 2  SELECTED WORK ───────────────────────────────────┐   │
│  │  01 · ServX                                              │   │
│  │      Category · Technical Summary · Screenshot · Links   │   │
│  │                                                          │   │
│  │  02 · Zync                                               │   │
│  │      Category · Technical Summary · Screenshot · Links   │   │
│  │                                                          │   │
│  │  03 · Adviser-CLI                                        │   │
│  │      Category · Technical Summary · Screenshot · Links   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ──────────────────── 1px rule ────────────────────────────     │
│                                                                 │
│  ┌─ § 3  EXPERIENCE ──────────────────────────────────────┐   │
│  │  RigorBase · Role · Date · Bullet points                 │   │
│  │  C³ @ SNIST · Role · Date · Bullet points                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ──────────────────── 1px rule ────────────────────────────     │
│                                                                 │
│  ┌─ § 4  STACK ───────────────────────────────────────────┐   │
│  │  [SVG: 6-category text grid, dark/light]                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ──────────────────── 1px rule ────────────────────────────     │
│                                                                 │
│  ┌─ § 5  RECOGNITION ─────────────────────────────────────┐   │
│  │  Brainrot Hackathon · Result · Scale                     │   │
│  │  JNTUH HackFusion · Result · Scale                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ──────────────────── 1px rule ────────────────────────────     │
│                                                                 │
│  ┌─ § 6  ACTIVITY ────────────────────────────────────────┐   │
│  │  [Contribution graph widget, centered, achromatic]       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Order

| Position | Section | Impression Produced | Scroll Depth |
|---|---|---|---|
| 1 | **Hero** | "Knows his stuff" — clear role, specific domain, professional tone | Visible without scrolling |
| 2 | **Selected Work** | "Builds a lot" + "Technically serious" — 3 real products with screenshots and architecture details | First scroll |
| 3 | **Experience** | "Professionally validated" — someone hired him, he leads a 1,000+ user platform | Second scroll |
| 4 | **Stack** | "Broad and deep" — categorized expertise proves range beyond the 3 flagships | Second scroll |
| 5 | **Recognition** | "Competitively proven" — external ranking from 1,224+ person events | Third scroll |
| 6 | **Activity** | "Consistently builds" — visual proof of ongoing contribution | Bottom (quiet closer) |

---

## Content Model

### § 1 — Hero

| Field | Type | Source | Update Frequency | Implementation |
|---|---|---|---|---|
| `banner` | GIF asset | `banner.gif` (static) | Never (non-negotiable) | Markdown `<img>` centered |
| `name` | String | Manual | Rare | Markdown heading |
| `role` | String | Manual | When role changes | Inline text |
| `summary` | String (≤ 120 chars) | Manual | When focus shifts | Inline text |
| `current_role` | String | Manual | When role changes | Inline text: "Currently: X · Ex-Y" |
| `portfolio_url` | URL | Manual | Rare | Markdown link |
| `linkedin_url` | URL | Manual | Rare | Markdown link |
| `email` | String | Manual | Rare | Markdown `mailto:` link |

**SVG required:** No. Pure markdown.

### § 2 — Selected Work

3 entries. Each entry:

| Field | Type | Source | Update Frequency | Implementation |
|---|---|---|---|---|
| `index` | String (`01`, `02`, `03`) | Static | Never | Inline markdown text |
| `name` | String | Manual | Rare | Markdown bold |
| `category` | String (uppercase) | Manual | Rare | Inline code or small text |
| `summary` | String (2–3 lines max) | Manual | When project evolves | Markdown blockquote |
| `tech_keywords` | String (comma-separated) | Manual, validated against repos | When stack changes | Inline text |
| `screenshot` | PNG asset | Static file in repo | When UI changes significantly | Markdown `<img>` or `<a><img>` |
| `live_url` | URL | Manual | Rare | Markdown link |
| `source_url` | URL | Manual | Rare | Markdown link |

**SVG required:** No. Pure markdown + PNG screenshots.

**Project order:** ServX → Zync → Adviser-CLI (infrastructure → collaboration → AI tooling — shows range).

### § 3 — Experience

2 entries. Each entry:

| Field | Type | Source | Update Frequency | Implementation |
|---|---|---|---|---|
| `organization` | String | Manual | When role changes | Markdown bold |
| `role` | String | Manual | When role changes | Inline code |
| `dates` | String | Manual | When tenure ends | Inline bold |
| `bullets` | String[] (2–3 per role) | Manual | Rare | Markdown list items |

**SVG required:** No. Pure markdown.

### § 4 — Stack

6 categories, each with 3–5 items:

| Field | Type | Source | Update Frequency | Implementation |
|---|---|---|---|---|
| `category_id` | String (`01`–`06`) | Static | Never | SVG text |
| `category_name` | String (uppercase) | Manual | When stack evolves | SVG text |
| `items` | String[] | Manual, validated against repos | When stack evolves | SVG text list |

**SVG required:** Yes — dark/light variants. A 3×2 text grid cannot be achieved in GitHub markdown. This is the one component that justifies SVG generation.

**Categories:**
1. Languages & Core
2. Frontend
3. Backend & Data
4. AI, RAG & Tooling
5. Realtime Systems
6. DevOps & Infrastructure

### § 5 — Recognition

2 entries:

| Field | Type | Source | Update Frequency | Implementation |
|---|---|---|---|---|
| `event_name` | String | Manual | When new wins occur | Markdown bold |
| `result` | String | Manual | Never (historical) | Inline text |
| `scale` | String (participant/team count) | Manual | Never (historical) | Inline text |

**SVG required:** No. Pure markdown. 2 compact line items.

### § 6 — Activity

| Field | Type | Source | Update Frequency | Implementation |
|---|---|---|---|---|
| `graph_dark` | URL | Third-party widget | Real-time | `<picture>` with `<source>` |
| `graph_light` | URL | Third-party widget | Real-time | `<img>` fallback |

**SVG required:** No. Third-party widget URL with design system colors.

**Widget parameters (dark):**
```
username=prem22k&bg_color=0d1117&color=A8A29E&line=A8A29E&point=F5F2EB&area=true&hide_border=true
```

**Widget parameters (light):**
```
username=prem22k&bg_color=ffffff&color=57534e&line=57534e&point=1c1917&area=true&hide_border=true
```

---

## SVG Component Inventory

Only **1 SVG component** (in 2 theme variants) is required:

| Component | Variants | Dimensions | Purpose |
|---|---|---|---|
| `stack-{dark,light}.svg` | 2 | 800 × TBD | 6-category engineering stack text grid |

**Total SVG files:** 2 (down from 16 in the current implementation).

Everything else is native markdown + PNG screenshots + 1 third-party widget.

---

*This document defines what exists, where it goes, and why. Implementation begins only after approval.*
