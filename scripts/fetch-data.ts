import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const PROFILE_JSON_PATH = path.join(DATA_DIR, 'profile.json');
const MANUAL_JSON_PATH = path.join(DATA_DIR, 'manual.json');

export interface RecentActivityEvent {
  date: string;       // e.g. "05 SEP"
  rawDate: string;    // ISO 8601
  type: string;       // "PushEvent", "PublicEvent", etc.
  event: string;      // "pushed", "open-sourced", "created", "merged PR"
  repository: string; // "linux", "WINDOWS", "ServX"
  repoFullName: string; // "Engine-NEXUS/linux"
  repoUrl: string;    // "https://github.com/Engine-NEXUS/linux"
  context: string;    // High-signal context message
}

export interface FetchedProfileData {
  generatedAt: string;
  username: string;
  identity: {
    name: string;
    login: string;
    bio: string;
    location: string;
    blog: string;
    hireable: boolean;
    createdAt: string;
    accountAgeDays: number;
  };
  overview: {
    publicRepos: number;
    authoredRepos: number;
    totalStars: number;
    totalForks: number;
    followers: number;
    following: number;
    totalSizeKb: number;
  };
  contributions: {
    currentYear: number;
    yearContributions: number;
    last12MonthsContributions: number;
    yearlyTotals: Record<string, number>;
    calendar?: Array<{ date: string; count: number; level?: number }>;
  };
  codebase: {
    totalBytes: number;
    estimatedLines: number;
    languagesCount: number;
    languages: Array<{ name: string; bytes: number; percentage: number; repos?: number }>;
  };
  recentActivity?: {
    fetchedAt: string;
    events: RecentActivityEvent[];
  };
  manualData?: Record<string, unknown>;
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'prem22k-readme-builder',
        ...headers,
      },
    });
    if (!res.ok) {
      console.warn(`[fetch-data] Warning: ${url} returned ${res.status} ${res.statusText}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[fetch-data] Failed to fetch ${url}:`, err);
    return null;
  }
}

function formatEventContext(rawMsg: string, eventType: string, refType?: string): string {
  if (!rawMsg) {
    if (eventType === 'PublicEvent') return 'Open-sourced repository';
    if (eventType === 'CreateEvent') return `Created ${refType || 'repository'}`;
    if (eventType === 'PullRequestEvent') return 'Pull request activity';
    return 'Pushed updates to repository';
  }
  let cleaned = rawMsg.trim().split('\n')[0];
  cleaned = cleaned.replace(/\s*\(#[0-9]+\)$/, '');
  const match = cleaned.match(/^[a-z]+(?:\([^\)]+\))?!?:?\s+(.*)$/i);
  if (match && match[1]) {
    cleaned = match[1];
  }
  if (cleaned.length > 0) {
    cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
  }
  if (cleaned.length > 75) {
    cleaned = cleaned.slice(0, 72).trim() + '...';
  }
  return cleaned;
}

export async function fetchProfileData(username: string = 'prem22k'): Promise<FetchedProfileData> {
  const token = process.env.GITHUB_TOKEN;
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  // 1. Fetch user profile
  interface GhUser {
    name?: string;
    login: string;
    bio?: string;
    location?: string;
    blog?: string;
    hireable?: boolean;
    created_at: string;
    public_repos: number;
    followers: number;
    following: number;
  }

  const user = await fetchJson<GhUser>(`https://api.github.com/users/${username}`, authHeader);

  // 2. Fetch repos
  interface GhRepo {
    name: string;
    fork: boolean;
    stargazers_count: number;
    forks_count: number;
    size: number;
    language: string | null;
    languages_url: string;
  }

  const repos = (await fetchJson<GhRepo[]>(`https://api.github.com/users/${username}/repos?per_page=100`, authHeader)) || [];
  const nonForkRepos = repos.filter(r => !r.fork);

  const totalStars = nonForkRepos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);
  const totalForks = nonForkRepos.reduce((acc, r) => acc + (r.forks_count || 0), 0);
  const totalSizeKb = nonForkRepos.reduce((acc, r) => acc + (r.size || 0), 0);

  // 3. Fetch language breakdown across non-fork repos
  const languageBytesMap: Record<string, number> = {};
  const languageReposMap: Record<string, number> = {};
  let totalBytes = 0;

  let successfulRepoLangsCount = 0;
  for (const repo of nonForkRepos) {
    if (!repo.languages_url) continue;
    const repoLangs = await fetchJson<Record<string, number>>(repo.languages_url, authHeader);
    if (repoLangs) {
      successfulRepoLangsCount++;
      for (const [lang, bytes] of Object.entries(repoLangs)) {
        languageBytesMap[lang] = (languageBytesMap[lang] || 0) + bytes;
        languageReposMap[lang] = (languageReposMap[lang] || 0) + 1;
        totalBytes += bytes;
      }
    }
  }

  const languagesList = Object.entries(languageBytesMap)
    .map(([name, bytes]) => ({
      name,
      bytes,
      repos: languageReposMap[name] || 0,
      percentage: totalBytes > 0 ? Number(((bytes / totalBytes) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  // 4. Fetch contribution stats
  interface ContribApiResponse {
    total: Record<string, number>;
    contributions: Array<{ date: string; count: number; level: number }>;
  }

  const contribData = await fetchJson<ContribApiResponse>(`https://github-contributions-api.jogruber.de/v4/${username}`);
  const yearlyTotals = contribData?.total || {};
  const currentYear = new Date().getUTCFullYear();
  const yearContributions = yearlyTotals[String(currentYear)] || 4768;
  const last12MonthsData = await fetchJson<ContribApiResponse>(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
  const last12MonthsContributions = last12MonthsData?.total?.lastYear || 5207;
  const calendarDays = last12MonthsData?.contributions || contribData?.contributions || [];

  // 5. Fetch recent events
  interface GhEvent {
    id: string;
    type: string;
    repo: { name: string; url: string };
    created_at: string;
    payload?: {
      action?: string;
      ref?: string;
      ref_type?: string;
      description?: string;
      head?: string;
      size?: number;
      commits?: Array<{ message?: string; sha?: string }>;
    };
  }

  const rawEvents = (await fetchJson<GhEvent[]>(`https://api.github.com/users/${username}/events?per_page=100`, authHeader)) || [];
  const filteredEvents = rawEvents.filter(e => {
    if (!e || !e.repo || !e.created_at) return false;
    if (e.type === 'DeleteEvent') return false;
    if (e.repo.name === `${username}/${username}`) return false;
    return true;
  });

  const seenEventKeys = new Set<string>();
  const candidateEvents: Array<{
    rawDate: string;
    date: string;
    type: string;
    repoFullName: string;
    repoName: string;
    repoUrl: string;
    head?: string;
    refType?: string;
    initialContext?: string;
  }> = [];

  for (const e of filteredEvents) {
    const d = new Date(e.created_at);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
    const dateStr = `${day} ${month}`;
    const key = `${e.repo.name}-${dateStr}`;

    if (!seenEventKeys.has(key)) {
      seenEventKeys.add(key);
      const repoFullName = e.repo.name;
      const repoShort = repoFullName.split('/')[1] || repoFullName;
      const repoName = repoShort === 'adviser-cli-tool' ? 'Adviser-CLI' : repoShort;
      const repoUrl = `https://github.com/${repoFullName}`;

      let initialContext = '';
      if (e.payload?.commits?.[0]?.message) {
        initialContext = e.payload.commits[0].message;
      }

      candidateEvents.push({
        rawDate: e.created_at,
        date: dateStr,
        type: e.type,
        repoFullName,
        repoName,
        repoUrl,
        head: e.payload?.head,
        refType: e.payload?.ref_type,
        initialContext,
      });
    }
  }

  candidateEvents.sort((a, b) => Date.parse(b.rawDate) - Date.parse(a.rawDate));
  const topCandidates = candidateEvents.slice(0, 6);
  const normalizedEvents: RecentActivityEvent[] = [];

  for (const item of topCandidates) {
    let context = item.initialContext || '';
    if (!context && item.head) {
      interface GhCommit {
        commit?: { message?: string };
      }
      const commitData = await fetchJson<GhCommit>(`https://api.github.com/repos/${item.repoFullName}/commits/${item.head}`, authHeader);
      if (commitData?.commit?.message) {
        context = commitData.commit.message;
      }
    }

    let eventVerb = 'pushed';
    if (item.type === 'CreateEvent') {
      eventVerb = item.refType === 'repository' ? 'created' : 'branched';
    } else if (item.type === 'PublicEvent') {
      eventVerb = 'open-sourced';
    } else if (item.type === 'ReleaseEvent') {
      eventVerb = 'released';
    } else if (item.type === 'PullRequestEvent') {
      eventVerb = 'merged PR';
    }

    normalizedEvents.push({
      date: item.date,
      rawDate: item.rawDate,
      type: item.type,
      event: eventVerb,
      repository: item.repoName,
      repoFullName: item.repoFullName,
      repoUrl: item.repoUrl,
      context: formatEventContext(context, item.type, item.refType),
    });
  }

  // 6. Read manual data if available
  let manualData: Record<string, unknown> = {};
  if (fs.existsSync(MANUAL_JSON_PATH)) {
    try {
      manualData = JSON.parse(fs.readFileSync(MANUAL_JSON_PATH, 'utf8'));
    } catch {
      // ignore
    }
  }

  // Load previous cache for fallback
  let previousData: Partial<FetchedProfileData> = {};
  if (fs.existsSync(PROFILE_JSON_PATH)) {
    try {
      previousData = JSON.parse(fs.readFileSync(PROFILE_JSON_PATH, 'utf8'));
    } catch {
      // ignore
    }
  }

  const finalRecentEvents = normalizedEvents.length > 0
    ? normalizedEvents
    : (previousData.recentActivity?.events || []);

  const createdAt = user?.created_at || previousData.identity?.createdAt || '2024-03-28T07:46:18Z';
  const accountAgeDays = Math.floor((Date.now() - Date.parse(createdAt)) / 86400000);

  const finalPublicRepos = user?.public_repos || (repos.length > 0 ? repos.length : previousData.overview?.publicRepos) || 37;
  const finalAuthoredRepos = (nonForkRepos.length > 0 ? nonForkRepos.length : previousData.overview?.authoredRepos) || 27;
  const finalStars = totalStars > 0 ? totalStars : (previousData.overview?.totalStars || 56);
  const finalForks = totalForks > 0 ? totalForks : (previousData.overview?.totalForks || 1);
  const finalFollowers = user?.followers || previousData.overview?.followers || 37;
  const finalFollowing = user?.following || previousData.overview?.following || 21;
  const finalSizeKb = totalSizeKb > 0 ? totalSizeKb : (previousData.overview?.totalSizeKb || 5240);

  const finalYearContribs = yearContributions || previousData.contributions?.yearContributions || 4768;
  const final12MonthContribs = last12MonthsContributions || previousData.contributions?.last12MonthsContributions || 5207;
  const finalCalendar = calendarDays.length > 0 ? calendarDays : (previousData.contributions?.calendar || []);

  const isLanguageDataComplete = nonForkRepos.length === 0 || successfulRepoLangsCount >= Math.floor(nonForkRepos.length * 0.7);

  const finalTotalBytes = (isLanguageDataComplete && totalBytes > 0)
    ? totalBytes
    : (previousData.codebase?.totalBytes || (totalBytes > 0 ? totalBytes : 5924649));

  const finalLanguages = (isLanguageDataComplete && languagesList.length > 0)
    ? languagesList
    : (previousData.codebase?.languages || (languagesList.length > 0 ? languagesList : [
        { name: 'TypeScript', bytes: 3693183, percentage: 62.3, repos: 14 },
        { name: 'JavaScript', bytes: 1495559, percentage: 25.2, repos: 24 },
        { name: 'Python', bytes: 337921, percentage: 5.7, repos: 4 },
        { name: 'CSS', bytes: 258034, percentage: 4.4, repos: 22 },
        { name: 'Other', bytes: 140000, percentage: 2.4 },
      ]));

  const profileData: FetchedProfileData = {
    generatedAt: new Date().toISOString(),
    username,
    identity: {
      name: user?.name || previousData.identity?.name || 'Prem Sai Kota',
      login: user?.login || previousData.identity?.login || username,
      bio: user?.bio || previousData.identity?.bio || '',
      location: user?.location || previousData.identity?.location || 'Hyderabad',
      blog: user?.blog || previousData.identity?.blog || 'https://premsai.dev/',
      hireable: user?.hireable !== undefined ? Boolean(user.hireable) : Boolean(previousData.identity?.hireable),
      createdAt,
      accountAgeDays,
    },
    overview: {
      publicRepos: finalPublicRepos,
      authoredRepos: finalAuthoredRepos,
      totalStars: finalStars,
      totalForks: finalForks,
      followers: finalFollowers,
      following: finalFollowing,
      totalSizeKb: finalSizeKb,
    },
    contributions: {
      currentYear,
      yearContributions: finalYearContribs,
      last12MonthsContributions: final12MonthContribs,
      yearlyTotals: Object.keys(yearlyTotals).length > 0 ? yearlyTotals : (previousData.contributions?.yearlyTotals || {}),
      calendar: finalCalendar,
    },
    codebase: {
      totalBytes: finalTotalBytes,
      estimatedLines: Math.round(finalTotalBytes / 40),
      languagesCount: finalLanguages.length,
      languages: finalLanguages,
    },
    recentActivity: {
      fetchedAt: new Date().toISOString(),
      events: finalRecentEvents,
    },
    manualData,
  };

  return profileData;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log('[fetch-data] Fetching live GitHub data for prem22k...');
  fetchProfileData('prem22k')
    .then((data) => {
      fs.writeFileSync(PROFILE_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✔ Written normalized data to ${PROFILE_JSON_PATH}`);
      console.log(`  - Public Repos: ${data.overview.publicRepos} (${data.overview.authoredRepos} authored)`);
      console.log(`  - Total Stars: ${data.overview.totalStars}`);
      console.log(`  - Followers: ${data.overview.followers}`);
      console.log(`  - ${data.contributions.currentYear} Contributions: ${data.contributions.yearContributions.toLocaleString()}`);
      console.log(`  - Source Code: ${(data.codebase.totalBytes / (1024 * 1024)).toFixed(2)} MB (~${data.codebase.estimatedLines.toLocaleString()} LOC)`);
      console.log(`  - Core Languages: ${data.codebase.languagesCount}`);
      console.log(`  - Recent Activity Events: ${data.recentActivity?.events?.length || 0}`);
    })
    .catch((err) => {
      console.error('[fetch-data] Critical error during fetch:', err);
      // Exit cleanly if profile.json exists to preserve pipeline stability
      if (fs.existsSync(PROFILE_JSON_PATH)) {
        console.log('[fetch-data] Existing data/profile.json preserved. Continuing pipeline.');
        process.exit(0);
      } else {
        process.exit(1);
      }
    });
}
