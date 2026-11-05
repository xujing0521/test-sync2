import { api } from "@pc-nexus/network";
import type { UserInfo } from "../model/index.js";

export class UserService {
  async getById(userId: string): Promise<UserInfo | undefined> {
    const id = userId.trim();
    if (!id) {
      return undefined;
    }
    const body = await this.getJson(
      `/v2/directory/users/${encodeURIComponent(id)}`,
    );
    return body ? this.profileOf(body, id) : undefined;
  }

  async getByIds(userIds: string[]): Promise<UserInfo[]> {
    const ids = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
    const users = await Promise.all(ids.map((id) => this.getById(id)));
    return users.filter((user): user is UserInfo => Boolean(user));
  }

  private async getJson(path: string): Promise<unknown> {
    try {
      const response = await api.invoke(path, { as: "app" });
      if (!response.ok) {
        return undefined;
      }
      const body: unknown = await response.json();
      if (typeof body === "string") {
        return JSON.parse(body) as unknown;
      }
      return body;
    } catch {
      return undefined;
    }
  }

  private profileOf(body: unknown, userId: string): UserInfo | undefined {
    if (!body || typeof body !== "object" || !userId) {
      return undefined;
    }
    const { name, display_name, avatar } = body as UserInfo;
    return {
      id: userId,
      ...(name && { name }),
      ...(display_name && { display_name }),
      ...(avatar && { avatar }),
    };
  }
}

export const userService = new UserService();
