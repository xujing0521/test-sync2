import { api } from "@pc-nexus/network";
import type { WorkItemSummary } from "../model/types.js";

const WORKITEMS_PATH = "/v2/pjm/workitems";
const WORKLOADS_PATH = "/v2/workloads";
const RELATIONS_PATH = "/v2/relations";

function toQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function asValues(body: unknown): unknown[] {
  const record = asRecord(body);
  if (!record) {
    return [];
  }
  const values = record["values"];
  if (Array.isArray(values)) {
    return values;
  }
  if (Array.isArray(body)) {
    return body;
  }
  return [];
}

function workItemOf(raw: unknown): WorkItemSummary | undefined {
  const record = asRecord(raw);
  const id = record?.["id"];
  if (!record || typeof id !== "string" || !id) {
    return undefined;
  }
  const state = asRecord(record["state"]);
  const title = record["title"];
  const type = record["type"];
  return {
    id,
    ...(typeof title === "string" ? { title } : {}),
    ...(typeof type === "string" ? { type } : {}),
    ...(state
      ? {
          state: {
            ...(typeof state["id"] === "string" ? { id: state["id"] } : {}),
            ...(typeof state["name"] === "string"
              ? { name: state["name"] }
              : {}),
            ...(typeof state["type"] === "string"
              ? { type: state["type"] }
              : {}),
          },
        }
      : {}),
  };
}

export class PingCodeApi {
  async listWorkloads(workItemId: string): Promise<unknown[]> {
    const path =
      WORKLOADS_PATH +
      toQuery({
        principal_type: "workitem",
        principal_id: workItemId,
      });
    const body = await this.getJson(path);
    return asValues(body);
  }

  async listChildren(parentId: string): Promise<WorkItemSummary[]> {
    const path =
      WORKITEMS_PATH +
      toQuery({
        parent_id: parentId,
        page_size: "100",
        page_index: "0",
      });
    const body = await this.getJson(path);
    return asValues(body)
      .map(workItemOf)
      .filter((item): item is WorkItemSummary => Boolean(item));
  }

  async countTestCaseRelations(workItemId: string): Promise<number> {
    const path =
      RELATIONS_PATH +
      toQuery({
        principal_type: "workitem",
        principal_id: workItemId,
        target_type: "testcase",
      });
    const body = await this.getJson(path);
    const record = asRecord(body);
    const total = record?.["total"];
    if (typeof total === "number") {
      return total;
    }
    return asValues(body).length;
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
}

export const pingCodeApi = new PingCodeApi();
