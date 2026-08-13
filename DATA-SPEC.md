# Data Specification

**Pipeline:** GitHub Actions → GitHub API → normalize → serialize → SVG render → commit  
**Schedule:** Daily at 00:30 UTC + on push to `main`  
**Auth:** `GITHUB_TOKEN` (automatic in Actions, scoped to public data)

---

## API Sources

### Available Endpoints

| Endpoint | Auth Required | Rate Limit | Data Provided |
|---|---|---|---|
| `GET /users/{username}` | No (60/hr) / Yes (5000/hr) | Per-IP or per-token | Name, bio, location, blog, public_repos, followers, following, created_at, hireable |
| `GET /users/{username}/repos?per_page=100` | No / Yes | Paginated | Full repo metadata: name, language, stars, forks, size, topics, pushed_at, created_at, homepage |
| `GET /repos/{owner}/{repo}/languages` | No / Yes | Per-repo | Byte counts per language (e.g., `{"Python": 107797, "Shell": 2924}`) |
| `GET /users/{username}/events?per_page=100` | No / Yes | Last 90 days, max 300 events | Event type, repo, timestamp (PushEvent, PullRequestEvent, IssuesEvent, etc.) |
| `POST /graphql` | **Yes** (token required) | 5000 points/hr | Contribution calendar, per-repo contribution counts, PR/issue totals, detailed language edges |
| `GET /repos/{owner}/{repo}/releases` | No / Yes | Paginated | Release tags, dates, names |

### GraphQL Query (Primary Data Source)

The GraphQL API is the **only** way to access contribution calendar data (the green squares grid). This is the single most important query.

```graphql
query($username: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $username) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      totalRepositoryContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            weekday
          }
        }
      }
      commitContributionsByRepository(maxRepositories: 10) {
        repository {
          nameWithOwner
          stargazerCount
          primaryLanguage { name }
        }
        contributions { totalCount }
      }
    }
    repositories(
      first: 100
      ownerAffiliations: [OWNER, ORGANIZATION_MEMBER]
      isFork: false
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      totalCount
      nodes {
        name
        nameWithOwner
        stargazerCount
        forkCount
        primaryLanguage { name }
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges {
            size
            node { name color }
          }
          totalSize
        }
        pushedAt
        createdAt
        defaultBranchRef {
          target {
            ... on Commit {
              history { totalCount }
            }
          }
        }
        releases { totalCount }
      }
    }
    pullRequests { totalCount }
    issues { totalCount }
    repositoriesContributedTo(
      first: 1
      contributionTypes: [COMMIT, PULL_REQUEST]
    ) {
      totalCount
    }
  }
}
```

### Rate Limit Strategy

| Context | Limit | Strategy |
|---|---|---|
| GitHub Actions with `GITHUB_TOKEN` | 1,000 REST requests/hr, 1,000 GraphQL points/hr | Single GraphQL query (~30 points) + 1 REST call for languages per repo. Well within limits. |
| Daily cron at 00:30 UTC | 1 run/day | No rate pressure |
| On-push trigger | Debounced by Action concurrency | `concurrency: { group: data-refresh, cancel-in-progress: true }` |

---

## Data Model

```typescript
interface ProfileData {
  generatedAt:     string;          // ISO 8601 timestamp of data generation
  username:        string;          // "prem22k"

  identity:        Identity;
  overview:        Overview;
  repositories:    Repository[];
  contributions:   Contributions;
  languages:       LanguageBreakdown;
  recentActivity:  RecentActivity;
  manualData:      ManualData;
}
```

### Identity

```typescript
interface Identity {
  name:            string;          // "Prem Sai Kota"
  login:           string;          // "prem22k"
  bio:             string;
  location:        string;          // "Hyderabad"
  blog:            string;          // "https://premsai.vercel.app/"
  hireable:        boolean;
  createdAt:       string;          // "2024-03-28T07:46:18Z"
  accountAgeDays:  number;          // Derived: now - createdAt
}
```

| Field | Source | Calculation | Refresh | Fallback |
|---|---|---|---|---|
| `name` | `GET /users/{username}` → `name` | Direct | Daily | `login` |
| `login` | `GET /users/{username}` → `login` | Direct | Daily | Hardcoded `"prem22k"` |
| `bio` | `GET /users/{username}` → `bio` | Direct | Daily | Empty string |
| `location` | `GET /users/{username}` → `location` | Direct | Daily | `"Unknown"` |
| `blog` | `GET /users/{username}` → `blog` | Direct | Daily | Empty string |
| `hireable` | `GET /users/{username}` → `hireable` | Direct | Daily | `false` |
| `createdAt` | `GET /users/{username}` → `created_at` | Direct | Never changes | Hardcoded |
| `accountAgeDays` | Derived | `Math.floor((Date.now() - Date.parse(createdAt)) / 86400000)` | Daily | `0` |

### Overview

```typescript
interface Overview {
  publicRepos:     number;          // Total public repos (non-fork)
  totalStars:      number;          // Sum of stargazers across non-fork repos
  totalForks:      number;          // Sum of fork counts across non-fork repos
  followers:       number;
  following:       number;
  totalPRs:        number;          // Lifetime PR count
  totalIssues:     number;          // Lifetime issue count
  contributedTo:   number;          // Repos contributed to (outside own)
}
```

| Field | Source | Calculation | Refresh | Fallback |
|---|---|---|---|---|
| `publicRepos` | GraphQL `repositories.totalCount` | Direct (non-fork filter in query) | Daily | REST `public_repos` minus fork count |
| `totalStars` | GraphQL `repositories.nodes[*].stargazerCount` | `sum(nodes.map(n => n.stargazerCount))` | Daily | `0` |
| `totalForks` | GraphQL `repositories.nodes[*].forkCount` | `sum(nodes.map(n => n.forkCount))` | Daily | `0` |
| `followers` | `GET /users/{username}` → `followers` | Direct | Daily | `0` |
| `following` | `GET /users/{username}` → `following` | Direct | Daily | `0` |
| `totalPRs` | GraphQL `pullRequests.totalCount` | Direct | Daily | `0` |
| `totalIssues` | GraphQL `issues.totalCount` | Direct | Daily | `0` |
| `contributedTo` | GraphQL `repositoriesContributedTo.totalCount` | Direct | Daily | `0` |

### Repository

```typescript
interface Repository {
  name:            string;
  nameWithOwner:   string;          // "prem22k/adviser-cli-tool"
  stars:           number;
  forks:           number;
  primaryLanguage: string | null;
  languages:       { name: string; bytes: number; color: string }[];
  totalBytes:      number;          // Total language bytes (proxy for codebase size)
  totalCommits:    number;          // Default branch commit count
  releases:        number;
  pushedAt:        string;          // Last push timestamp
  createdAt:       string;
  homepage:        string | null;   // Live demo URL
  topics:          string[];
}
```

| Field | Source | Calculation | Refresh | Fallback |
|---|---|---|---|---|
| `name` | GraphQL `nodes[*].name` | Direct | Daily | — |
| `nameWithOwner` | GraphQL `nodes[*].nameWithOwner` | Direct | Daily | — |
| `stars` | GraphQL `nodes[*].stargazerCount` | Direct | Daily | `0` |
| `forks` | GraphQL `nodes[*].forkCount` | Direct | Daily | `0` |
| `primaryLanguage` | GraphQL `nodes[*].primaryLanguage.name` | Direct | Daily | `null` |
| `languages` | GraphQL `nodes[*].languages.edges` | Map `{ name: edge.node.name, bytes: edge.size, color: edge.node.color }` | Daily | `[]` |
| `totalBytes` | GraphQL `nodes[*].languages.totalSize` | Direct | Daily | `0` |
| `totalCommits` | GraphQL `defaultBranchRef.target.history.totalCount` | Direct | Daily | `0` |
| `releases` | GraphQL `nodes[*].releases.totalCount` | Direct | Daily | `0` |
| `pushedAt` | GraphQL `nodes[*].pushedAt` | Direct | Daily | `createdAt` |
| `createdAt` | GraphQL `nodes[*].createdAt` | Direct | Daily | — |
| `homepage` | REST `repos[*].homepage` | Direct | Daily | `null` |
| `topics` | REST `repos[*].topics` | Direct | Daily | `[]` |

### Contributions

```typescript
interface Contributions {
  year:            number;          // Current year (e.g. 2026)
  totalContributions: number;       // Calendar year total
  commits:         number;
  pullRequests:    number;
  issues:          number;
  reviews:         number;
  repositoriesCreated: number;

  calendar:        CalendarDay[];   // 365/366 entries
  byRepository:    { nameWithOwner: string; commits: number; stars: number; language: string | null }[];

  // Derived
  currentStreak:   number;          // Consecutive days with >=1 contribution ending today
  longestStreak:   number;          // Longest consecutive run this year
  mostActiveDay:   string;          // Weekday name with highest avg contributions
  mostActiveMonth: string;          // Month name with highest total
  firstContribution: string;        // ISO date of first contribution this year
  latestContribution: string;       // ISO date of most recent contribution
  weekdayDistribution: number[];    // [Sun, Mon, Tue, Wed, Thu, Fri, Sat] totals
  monthlyTotals:   number[];        // [Jan, Feb, ..., Dec] totals
}

interface CalendarDay {
  date:            string;          // "2026-08-21"
  count:           number;          // Contribution count
  weekday:         number;          // 0=Sun ... 6=Sat
  level:           number;          // 0-4 intensity quartile (derived)
}
```

| Field | Source | Calculation | Refresh | Fallback |
|---|---|---|---|---|
| `totalContributions` | GraphQL `contributionCalendar.totalContributions` | Direct | Daily | `0` |
| `commits` | GraphQL `totalCommitContributions` | Direct | Daily | `0` |
| `pullRequests` | GraphQL `totalPullRequestContributions` | Direct | Daily | `0` |
| `issues` | GraphQL `totalIssueContributions` | Direct | Daily | `0` |
| `reviews` | GraphQL `totalPullRequestReviewContributions` | Direct | Daily | `0` |
| `repositoriesCreated` | GraphQL `totalRepositoryContributions` | Direct | Daily | `0` |
| `calendar` | GraphQL `contributionCalendar.weeks[*].contributionDays` | Flatten weeks into days array | Daily | `[]` |
| `byRepository` | GraphQL `commitContributionsByRepository` | Map to `{ nameWithOwner, commits, stars, language }` | Daily | `[]` |
| `currentStreak` | Derived from `calendar` | Walk backwards from today counting consecutive days with `count > 0` | Daily | `0` |
| `longestStreak` | Derived from `calendar` | Scan for longest consecutive run of `count > 0` | Daily | `0` |
| `mostActiveDay` | Derived from `calendar` | Group by `weekday`, sum counts, return weekday name with max | Daily | `"Unknown"` |
| `mostActiveMonth` | Derived from `monthlyTotals` | `monthNames[indexOf(max(monthlyTotals))]` | Daily | `"Unknown"` |
| `firstContribution` | Derived from `calendar` | First entry with `count > 0` | Daily | `null` |
| `latestContribution` | Derived from `calendar` | Last entry with `count > 0` | Daily | `null` |
| `weekdayDistribution` | Derived from `calendar` | `Array(7).fill(0)`, accumulate `calendar[i].count` into `weekday` bucket | Daily | `[0,0,0,0,0,0,0]` |
| `monthlyTotals` | Derived from `calendar` | `Array(12).fill(0)`, accumulate by `parseInt(date.slice(5,7)) - 1` | Daily | `Array(12).fill(0)` |
| `level` (per CalendarDay) | Derived from `calendar` | Quartile: 0 = zero, 1-4 = quartile of non-zero distribution | Daily | `0` |

### LanguageBreakdown

```typescript
interface LanguageBreakdown {
  // Aggregated across all non-fork repos
  byBytes:         { name: string; bytes: number; percentage: number; color: string }[];
  byRepoCount:     { name: string; repos: number; percentage: number }[];
  totalBytes:      number;
  totalRepos:      number;
  primaryLanguage: string;          // Language with most bytes
}
```

| Field | Source | Calculation | Refresh | Fallback |
|---|---|---|---|---|
| `byBytes` | GraphQL `repositories.nodes[*].languages.edges` | Aggregate bytes per language across all repos. `percentage = bytes / totalBytes * 100`. Sort descending. | Daily | `[]` |
| `byRepoCount` | GraphQL `repositories.nodes[*].primaryLanguage` | Count repos per primary language. `percentage = repos / totalRepos * 100`. Sort descending. | Daily | `[]` |
| `totalBytes` | Sum of all `byBytes[*].bytes` | Aggregation | Daily | `0` |
| `totalRepos` | Count of non-fork repos with a language | Count | Daily | `0` |
| `primaryLanguage` | `byBytes[0].name` | First element after sort | Daily | `"Unknown"` |

**Note on `color`:** GraphQL returns the official GitHub language color (e.g., `"#3178c6"` for TypeScript). These colors are available for reference but **will not be used in rendering** — the design system mandates achromatic colors only. The `color` field is stored for potential future use but ignored during SVG generation.

### RecentActivity

```typescript
interface RecentActivity {
  events:          ActivityEvent[];
  fetchedAt:       string;
  coverageDays:    number;          // How many days the events span

  // Derived
  activeDays:      number;          // Unique dates with >=1 event in the window
  dominantType:    string;          // Most frequent event type
  activeRepos:     string[];        // Unique repos with activity, sorted by frequency
}

interface ActivityEvent {
  type:            string;          // "PushEvent", "PullRequestEvent", etc.
  repo:            string;          // "prem22k/adviser-cli-tool"
  date:            string;          // "2026-08-15"
  timestamp:       string;          // Full ISO 8601
}
```

| Field | Source | Calculation | Refresh | Fallback |
|---|---|---|---|---|
| `events` | `GET /users/{username}/events?per_page=100` | Map to `{ type, repo: event.repo.name, date, timestamp }` | Daily | `[]` |
| `coverageDays` | Derived | `daysBetween(events[last].date, events[0].date)` | Daily | `0` |
| `activeDays` | Derived | `new Set(events.map(e => e.date)).size` | Daily | `0` |
| `dominantType` | Derived | Mode of `events.map(e => e.type)` | Daily | `"Unknown"` |
| `activeRepos` | Derived | Unique repos sorted by event frequency | Daily | `[]` |

**Limitation:** The Events API returns only the last 90 days and max 300 events. This is supplementary data, not the primary contribution source.

### ManualData

```typescript
interface ManualData {
  // These fields are NOT from GitHub API — they are manually curated
  // and stored in a config file (data/manual.json)

  role:            string;          // "Full-Stack Engineer"
  summary:         string;          // One-line technical summary
  currentRole:     string;          // "Technical Head @ Cloud Community Club"
  previousRole:    string;          // "Ex-Intern @ RigorBase"
  portfolioUrl:    string;
  linkedinUrl:     string;
  email:           string;

  experience:      ExperienceEntry[];
  recognition:     RecognitionEntry[];
  featuredProjects: FeaturedProject[];

  stack:           StackCategory[];
}

interface ExperienceEntry {
  organization:    string;
  role:            string;
  startDate:       string;          // "Mar 2026"
  endDate:         string;          // "Apr 2026" or "Present"
  bullets:         string[];
}

interface RecognitionEntry {
  event:           string;
  result:          string;
  scale:           string;          // "1,224 participants"
}

interface FeaturedProject {
  id:              string;          // "servx", "zync", "adviser-cli"
  name:            string;
  category:        string;          // "INFRASTRUCTURE MONITORING"
  summary:         string;
  techKeywords:    string[];
  screenshot:      string;          // Filename: "servx.png"
  liveUrl:         string | null;
  sourceUrl:       string;
}

interface StackCategory {
  id:              string;          // "01"
  name:            string;          // "LANGUAGES & CORE"
  items:           string[];        // ["TypeScript", "JavaScript", "Python", ...]
}
```

| Field | Source | Refresh | Fallback |
|---|---|---|---|
| All `ManualData` fields | `data/manual.json` in repo | On manual edit + push | Hardcoded defaults in script |

---

## Pipeline Architecture

```
+----------------------------------------------------------+
|                   GitHub Actions Workflow                  |
|                                                            |
|  Trigger: cron (daily 00:30 UTC) OR push to main          |
|                                                            |
|  +- Step 1: FETCH -----------------------------------------+
|  |  GraphQL query -> contributions, repos, languages       |
|  |  REST /users/{username} -> identity                     |
|  |  REST /users/{username}/events -> recent activity       |
|  |  Read data/manual.json -> manual data                   |
|  +----------------------------------------------------------+
|                          |                                 |
|  +- Step 2: NORMALIZE ----------------------------------+ |
|  |  Merge API responses into ProfileData typed model     | |
|  |  Calculate derived fields (streaks, distributions)    | |
|  |  Apply fallbacks for missing/null fields              | |
|  +-------------------------------------------------------+ |
|                          |                                 |
|  +- Step 3: SERIALIZE ----------------------------------+ |
|  |  Write data/profile.json (full normalized data)       | |
|  +-------------------------------------------------------+ |
|                          |                                 |
|  +- Step 4: RENDER -------------------------------------+ |
|  |  Read data/profile.json + README-DESIGN-SYSTEM.md     | |
|  |  Generate SVG components (stack grid only, 2 files)   | |
|  |  Write to assets/                                     | |
|  +-------------------------------------------------------+ |
|                          |                                 |
|  +- Step 5: COMMIT -------------------------------------+ |
|  |  git add data/profile.json assets/                    | |
|  |  git diff --quiet || git commit + push                | |
|  +-------------------------------------------------------+ |
|                                                            |
+------------------------------------------------------------+
```

### GitHub Action Workflow Spec

```yaml
name: Update Profile Data
on:
  schedule:
    - cron: '30 0 * * *'        # Daily at 00:30 UTC
  push:
    branches: [main]
    paths:
      - 'data/manual.json'     # Re-render when manual data changes
      - 'scripts/**'           # Re-render when build script changes
  workflow_dispatch:             # Manual trigger

concurrency:
  group: profile-data
  cancel-in-progress: true

permissions:
  contents: write               # To commit updated assets

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: node scripts/fetch-data.mjs
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - run: node scripts/build-assets.mjs
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: update profile data [skip ci]'
          file_pattern: 'data/profile.json assets/*.svg'
```

---

## Serialized Output

### `data/profile.json`

Written by `scripts/fetch-data.mjs` after normalization. Contains the full `ProfileData` object. This file is committed to the repo so that:

1. SVG rendering (`build-assets.mjs`) can read it without re-fetching.
2. Data history is tracked in git (diffable JSON).
3. Local development can use the cached data without API auth.

### `data/manual.json`

Manually maintained. Contains all `ManualData` fields. Edited by the repo owner directly.

---

## Metrics NOT Included

| Metric | Why Excluded |
|---|---|
| **Productivity score** | Invented, meaningless, no transparent definition |
| **Developer level / rank** | Arbitrary tier assignment with no basis |
| **Skill percentage** | Cannot be objectively measured from GitHub data |
| **Engineering score / XP** | Gamification language, violates design system anti-patterns |
| **LOC as quality metric** | LOC may appear as `totalBytes` (codebase size proxy) but is never presented as a quality indicator. `totalBytes` is descriptive, not evaluative. |
| **Commit frequency "grade"** | Transparent data (commits per day/week) is provided. No letter grade or ranking is assigned. |
| **"Top X%" badge** | Requires global comparison data that is not available from the API |

### Transparency Principle

Every derived metric has a **visible, auditable calculation**:

- `languageShare` = `languageBytes / totalBytes * 100` — arithmetic, not opinion
- `currentStreak` = consecutive days with `count > 0` ending today — countable
- `mostActiveDay` = weekday with highest sum — deterministic
- `monthlyTotals` = sum per calendar month — additive

No metric involves a weighting function, scoring rubric, or subjective threshold.

---

*This document defines what data is fetched, how it is calculated, and where it flows. Rendering decisions are deferred to the SVG generation phase.*
