export interface DodConfig {
  loggedWorkload: boolean;
  subtaskCompletion: boolean;
  linkedTestCases: boolean;
}

export const DEFAULT_DOD_CONFIG: DodConfig = {
  loggedWorkload: true,
  subtaskCompletion: true,
  linkedTestCases: true,
};

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function parseDodConfig(raw: unknown): DodConfig {
  const source =
    raw && typeof raw === "object"
      ? ((raw as { config?: unknown }).config &&
        typeof (raw as { config?: unknown }).config === "object"
          ? (raw as { config: Record<string, unknown> }).config
          : (raw as Record<string, unknown>))
      : {};

  return {
    loggedWorkload: asBoolean(
      source["loggedWorkload"],
      DEFAULT_DOD_CONFIG.loggedWorkload,
    ),
    subtaskCompletion: asBoolean(
      source["subtaskCompletion"],
      DEFAULT_DOD_CONFIG.subtaskCompletion,
    ),
    linkedTestCases: asBoolean(
      source["linkedTestCases"],
      DEFAULT_DOD_CONFIG.linkedTestCases,
    ),
  };
}
