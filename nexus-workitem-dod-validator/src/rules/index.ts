import type { DodConfig } from "../model/config.js";
import type { RuleResult } from "../model/types.js";
import { checkLinkedTestCases } from "./linked-test-cases.js";
import { checkLoggedWorkload } from "./logged-workload.js";
import { checkSubtaskCompletion } from "./subtask-completion.js";

export { checkLinkedTestCases } from "./linked-test-cases.js";
export { checkLoggedWorkload } from "./logged-workload.js";
export { checkSubtaskCompletion } from "./subtask-completion.js";

export interface DodRule {
  key: keyof DodConfig;
  check: (workItemId: string) => Promise<RuleResult>;
}

export const DOD_RULES: DodRule[] = [
  { key: "loggedWorkload", check: checkLoggedWorkload },
  { key: "subtaskCompletion", check: checkSubtaskCompletion },
  { key: "linkedTestCases", check: checkLinkedTestCases },
];
