import { pingCodeApi } from "../services/pingcode-api.js";
import type { RuleResult } from "../model/types.js";

export async function checkLinkedTestCases(
  workItemId: string,
): Promise<RuleResult> {
  const count = await pingCodeApi.countTestCaseRelations(workItemId);

  if (count > 0) {
    return { ok: true };
  }

  return {
    ok: false,
    message: "未关联任何测试用例",
  };
}
