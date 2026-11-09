import { fetch } from "@pc-nexus/network";

const USER_AGENT = "nexus-external-profile";
const CACHE_MS = 10 * 60 * 1000;

export interface GithubUser {
  login?: string;
  name?: string | null;
  avatar_url?: string;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  html_url?: string;
  public_repos?: number;
}

export interface GithubProfile {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string;
  company: string;
  location: string;
  profileUrl: string;
  publicRepos: number;
}

const cache = new Map<string, { at: number; profile: GithubProfile }>();

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readCache(login: string): GithubProfile | undefined {
  const hit = cache.get(login);
  if (!hit) {
    return undefined;
  }
  if (Date.now() - hit.at > CACHE_MS) {
    cache.delete(login);
    return undefined;
  }
  return hit.profile;
}

function writeCache(profile: GithubProfile): void {
  cache.set(profile.login.toLowerCase(), { at: Date.now(), profile });
}

export function toProfile(user: GithubUser): GithubProfile {
  const login = text(user.login);
  const avatarUrl = text(user.avatar_url);
  if (!login || !avatarUrl) {
    throw new Error("GitHub 没有返回完整的用户资料");
  }
  return {
    login,
    name: text(user.name) || login,
    avatarUrl,
    bio: text(user.bio),
    company: text(user.company),
    location: text(user.location),
    profileUrl: text(user.html_url),
    publicRepos: typeof user.public_repos === "number" ? user.public_repos : 0,
  };
}

export async function fetchPublicUser(username: string): Promise<GithubUser | "not_found" | "rate_limited"> {
  const key = username.toLowerCase();
  const cached = readCache(key);
  if (cached) {
    return {
      login: cached.login,
      name: cached.name,
      avatar_url: cached.avatarUrl,
      bio: cached.bio,
      company: cached.company,
      location: cached.location,
      html_url: cached.profileUrl,
      public_repos: cached.publicRepos,
    };
  }

  const response = await fetch.request(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": USER_AGENT,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (response.status === 404) {
    return "not_found";
  }
  if (response.status === 403 || response.status === 429) {
    return "rate_limited";
  }
  if (!response.ok) {
    throw new Error(`GitHub 查询失败（${response.status}）`);
  }

  const user = (await response.json()) as GithubUser;
  writeCache(toProfile(user));
  return user;
}
