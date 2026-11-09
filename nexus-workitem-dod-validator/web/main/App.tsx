import { useEffect, useMemo, useState } from "react";
import { view } from "@pc-nexus/bridge";
import {
  NxBox,
  NxContent,
  NxLayout,
  NxSelect,
  NxText,
} from "@pc-nexus/react";

type DodConfig = {
  loggedWorkload: boolean;
  subtaskCompletion: boolean;
  linkedTestCases: boolean;
};

const DEFAULT_CONFIG: DodConfig = {
  loggedWorkload: true,
  subtaskCompletion: true,
  linkedTestCases: true,
};

type RuleKey = keyof DodConfig;

const RULES: { key: RuleKey; label: string }[] = [
  { key: "loggedWorkload", label: "有登记工时记录" },
  { key: "subtaskCompletion", label: "所有子任务已完成" },
  { key: "linkedTestCases", label: "有关联测试用例" },
];

const RULE_OPTIONS = RULES.map((rule) => ({
  value: rule.key,
  label: rule.label,
}));

function readConfig(data: unknown): DodConfig {
  const root =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const source =
    root.config && typeof root.config === "object"
      ? (root.config as Record<string, unknown>)
      : root;

  const pick = (key: RuleKey): boolean =>
    typeof source[key] === "boolean"
      ? (source[key] as boolean)
      : DEFAULT_CONFIG[key];

  return {
    loggedWorkload: pick("loggedWorkload"),
    subtaskCompletion: pick("subtaskCompletion"),
    linkedTestCases: pick("linkedTestCases"),
  };
}

function selectedKeysOf(config: DodConfig): RuleKey[] {
  return RULES.filter((rule) => config[rule.key]).map((rule) => rule.key);
}

function configFromKeys(keys: readonly string[]): DodConfig {
  const selected = new Set(keys);
  return {
    loggedWorkload: selected.has("loggedWorkload"),
    subtaskCompletion: selected.has("subtaskCompletion"),
    linkedTestCases: selected.has("linkedTestCases"),
  };
}

export function App() {
  const [config, setConfig] = useState<DodConfig>(DEFAULT_CONFIG);

  const selectedKeys = useMemo(() => selectedKeysOf(config), [config]);

  useEffect(() => {
    void view
      .getContext()
      .then((context) => {
        setConfig(readConfig(context.extension?.data));
      })
      .catch(() => {
        setConfig(DEFAULT_CONFIG);
      });
  }, []);

  useEffect(() => {
    void view.onSubmit(() => ({ ...config }));
  }, [config]);

  return (
    <NxLayout>
      <NxContent>
        <NxBox className="mb-2">
          <NxText size="medium">状态流转规则</NxText>
        </NxBox>

        <NxBox className="d-flex align-items-center">
          <NxSelect
            multiple
            clearable
            placeholder="请选择要启用的 DoD 规则"
            options={RULE_OPTIONS}
            value={selectedKeys}
            onValueChange={(keys) => setConfig(configFromKeys(keys ?? []))}
          />
        </NxBox>
      </NxContent>
    </NxLayout>
  );
}
