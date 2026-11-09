import { api, fetch } from "@pc-nexus/network";

type Inputs = Record<string, unknown>;

export interface NotifyPayload {
  inputs?: Inputs;
  [key: string]: unknown;
}

export interface NotifyResult {
  properties: {
    notifyDelivered: string;
  };
}

function unwrap(value: unknown): unknown {
  if (Array.isArray(value)) return value.length ? unwrap(value[0]) : undefined;
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if ("ref_value" in o) return unwrap(o["ref_value"]);
    if ("value" in o) return unwrap(o["value"]);
  }
  return value;
}

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    return text(o["name"] ?? o["title"] ?? o["display_name"] ?? o["id"]);
  }
  return String(value);
}

async function fetchWorkItem(id: string): Promise<unknown> {
  try {
    const response = await api.invoke(`/v2/pjm/workitems/${encodeURIComponent(id)}`, { as: "app" });
    if (!response.ok) return id;
    return await response.json();
  } catch {
    return id;
  }
}

async function resolveWorkItem(value: unknown): Promise<unknown> {
  const wi = unwrap(value);
  if (wi && typeof wi === "object" && !Array.isArray(wi)) {
    const o = wi as Record<string, unknown>;
    if (o["title"] != null || o["project"] != null || o["state"] != null) return wi;
    const id = text(o["id"] ?? o["identifier"] ?? o["short_id"] ?? o["workitem_id"]);
    return id ? fetchWorkItem(id) : wi;
  }
  const id = text(wi);
  return id ? fetchWorkItem(id) : undefined;
}

function message(wi: unknown): string {
  const lines = ["🔔 工作项变更通知"];
  if (wi && typeof wi === "object" && !Array.isArray(wi)) {
    const o = wi as Record<string, unknown>;
    const rows: [string, string][] = [
      ["标题", text(o["title"])],
      ["项目", text(o["project"] ?? o["projectName"])],
      ["状态", text(o["state"] ?? o["status"])],
      ["操作人", text(o["updated_by"] ?? o["operator"])],
    ];
    for (const [label, val] of rows) if (val) lines.push(`${label}：${val}`);
  } else {
    const label = text(wi);
    if (label) lines.push(`工作项：${label}`);
  }
  return lines.join("\n");
}

async function notify(payload: NotifyPayload): Promise<NotifyResult> {
  const inputs: Inputs = payload?.inputs ?? payload ?? {};
  const webhookUrl = text(unwrap(inputs["webhookUrl"]));
  if (!webhookUrl) throw new Error("请填写企业微信群机器人 Webhook 地址");

  const wi = await resolveWorkItem(inputs["workItem"]);
  if (!wi) throw new Error("请绑定上游工作项");

  const response = await fetch.request(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msgtype: "text", text: { content: message(wi) } }),
  });

  const receipt = response.ok ? await response.json().catch(() => null) as { errcode?: number } | null : null;
  return { properties: { notifyDelivered: String(receipt?.errcode === 0) } };
}

export async function resolver(arg0: unknown, arg1?: NotifyPayload): Promise<NotifyResult> {
  return notify((arg1 ?? arg0 ?? {}) as NotifyPayload);
}

const resolverExt = resolver as unknown as Record<string, unknown>;
resolverExt["define"] = () => resolver;
resolverExt["invoke"] = (_op: unknown, _ctx: unknown, payload: NotifyPayload) => notify(payload);
