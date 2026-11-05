import { pingCodeApi } from "../services/pingcode-api.js";
import type { RuleResult } from "../model/types.js";

export async function checkLoggedWorkload(
  workItemId: string,
): Promise<RuleResult> {
  const workloads = await pingCodeApi.listWorkloads(workItemId);
  if (workloads.length > 0) {
    return { ok: true };
  }
  return {
    ok: false,
    message: "无工时记录",
  };
}
