import type { NexusAppContext } from "@pc-nexus/core";
import { parseDodConfig } from "./model/config.js";
import type {
  WorkflowValidatorHandler,
  WorkflowValidatorResult,
} from "./model/types.js";
import { DOD_RULES } from "./rules/index.js";

function extensionData(
  context: NexusAppContext,
): Record<string, unknown> | undefined {
  const data = context.extension?.data;
  return data && typeof data === "object"
    ? (data as Record<string, unknown>)
    : undefined;
}

export const dodValidate: WorkflowValidatorHandler = async (
  context,
  payload,
): Promise<WorkflowValidatorResult> => {
  const workItemId = payload.workitem?.id;
  if (!workItemId) {
    return {
      result: false,
      errorMessage: "缺少工作项上下文，无法执行 DoD 校验",
    };
  }

  const config = parseDodConfig(payload.config ?? extensionData(context));

  const results = await Promise.all(
    DOD_RULES.filter((rule) => config[rule.key]).map((rule) =>
      rule.check(workItemId),
    ),
  );

  const failures = results.flatMap((rule) =>
    !rule.ok && rule.message ? [rule.message] : [],
  );

  if (failures.length === 0) {
    return { result: true };
  }

  return {
    result: false,
    errorMessage: failures.join("；"),
  };
};
