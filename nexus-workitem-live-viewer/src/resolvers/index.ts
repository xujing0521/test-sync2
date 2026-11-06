import { Resolver } from "@pc-nexus/core";
import { api } from "@pc-nexus/network";

export interface ViewerIdentity {
  id: string;
  displayName: string;
  avatarUrl: string;
}

const resolver = new Resolver();

resolver.define<undefined, ViewerIdentity>("getViewer", async (context) => {
  const userId = context.user?.id;
  if (!userId) {
    throw new Error("当前页面没有登录用户");
  }

  const response = await api.invoke(`/v1/directory/users/${userId}`, {
    as: "user",
    userId,
  });
  if (!response.ok) {
    throw new Error("无法读取当前用户");
  }

  const body = (await response.json()) as Record<string, unknown>;
  const displayName = textField(body, "display_name") || textField(body, "name") || userId;
  return { id: userId, displayName, avatarUrl: avatarUrl(textField(body, "avatar"), context.team.url) };
});

function avatarUrl(avatar: string, teamUrl: string): string {
  if (!avatar) {
    return "";
  }
  if (/^https?:\/\//i.test(avatar)) {
    return avatar;
  }
  if (!avatar.startsWith("/")) {
    return "";
  }
  try {
    return new URL(avatar, teamUrl).toString();
  } catch {
    return "";
  }
}

function textField(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

export { resolver };
