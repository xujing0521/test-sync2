import { Resolver } from "@pc-nexus/core";
import { kvs } from "@pc-nexus/storage";
import { fetchPublicUser, toProfile, type GithubProfile } from "./github.js";

export type GithubLookup =
  | { status: "ready"; username: string; profile: GithubProfile; bound: boolean }
  | { status: "not_found"; username: string }
  | { status: "rate_limited"; username: string };

interface LookupPayload {
  username?: string;
}

interface StoredUsername {
  username: string;
}

/** Demo fallback when the user has never bound a username (not written to KVS). */
const EXAMPLE_USERNAME = "octocat";
const USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

const resolver = new Resolver();

function storageKey(userId: string): string {
  return `github-username-${userId}`;
}

async function readSavedUsername(userId: string): Promise<string> {
  const stored = await kvs.get<StoredUsername>(storageKey(userId));
  const username = stored?.username?.trim() ?? "";
  return USERNAME.test(username) ? username : "";
}

async function saveUsername(userId: string, username: string): Promise<void> {
  await kvs.set<StoredUsername>(storageKey(userId), { username }, { policy: "OVERRIDE" });
}

async function lookupUsername(username: string): Promise<GithubLookup> {
  const user = await fetchPublicUser(username);
  if (user === "not_found") {
    return { status: "not_found", username };
  }
  if (user === "rate_limited") {
    return { status: "rate_limited", username };
  }
  const profile = toProfile(user);
  return { status: "ready", username: profile.login, profile, bound: false };
}

/** Saved binding if any, otherwise the octocat demo profile (not persisted). */
async function resolveCurrent(userId: string): Promise<GithubLookup> {
  const saved = userId ? await readSavedUsername(userId) : "";
  const username = saved || EXAMPLE_USERNAME;
  const result = await lookupUsername(username);
  if (result.status !== "ready") {
    return result;
  }
  return { ...result, bound: Boolean(saved) };
}

resolver.define<LookupPayload, GithubLookup>("getGithubUser", async (context, payload) => {
  const requested = payload?.username?.trim() ?? "";
  if (requested && !USERNAME.test(requested)) {
    throw new Error("请输入有效的 GitHub 用户名");
  }

  const userId = context.user?.id?.trim() ?? "";
  if (!requested) {
    return resolveCurrent(userId);
  }

  // Explicit username: bind or rebind after a successful lookup.
  const result = await lookupUsername(requested);
  if (result.status !== "ready") {
    return result;
  }
  if (userId) {
    await saveUsername(userId, result.profile.login);
  }
  return { ...result, bound: true };
});

export { resolver };
