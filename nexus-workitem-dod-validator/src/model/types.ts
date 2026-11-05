import type { NexusAppContext } from "@pc-nexus/core";

export interface WorkflowValidatorTransition {
  id: string;
  state_plan: { id: string };
  from_state: { id: string };
  to_state: { id: string };
}

export interface WorkflowValidatorPayload {
  workitem?: { id: string };
  transition: WorkflowValidatorTransition;
  config?: Record<string, unknown>;
}

export interface WorkflowValidatorResult {
  result: boolean;
  errorMessage?: string;
}

export type WorkflowValidatorHandler = (
  context: NexusAppContext,
  payload: WorkflowValidatorPayload,
) => Promise<WorkflowValidatorResult>;

export interface RuleResult {
  ok: boolean;
  message?: string;
}

export interface WorkItemSummary {
  id: string;
  title?: string;
  type?: string;
  state?: {
    id?: string;
    name?: string;
    type?: string;
  };
}

export function isDoneState(stateType: string | undefined): boolean {
  const doneStateTypes = new Set(["completed", "closed"]);
  return Boolean(stateType && doneStateTypes.has(stateType));
}
