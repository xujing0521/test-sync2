import { pingCodeApi } from "../services/pingcode-api.js";
import { type RuleResult, isDoneState } from "../model/types.js";

export async function checkSubtaskCompletion(
  workItemId: string,
): Promise<RuleResult> {
  const children = await pingCodeApi.listChildren(workItemId);
  if (!children.length) {
    return { ok: true };
  }

  const open = children.filter((item) => !isDoneState(item.state?.type));
  if (open.length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    message: `有 ${open.length} 条子工作项未完成`,
  };
}
