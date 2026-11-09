import { useCallback, useEffect, useRef, useState } from "react";
import { view, ɵNexusBridge as NexusBridge } from "@pc-nexus/bridge";
import { NxBox, NxContent, NxInput, NxLayout, NxSelect, NxText } from "@pc-nexus/react";

const INPUT_SCHEMA = {
  webhookUrl: { display_name: "企业微信群机器人 Webhook 地址", type: "text", required: true },
  workItem: { display_name: "数据来源工作项", type: "pjm_workitem", required: true },
};

const DYNAMIC_PROPERTY_SCHEMA = {
  notifyDelivered: { display_name: "投递是否成功", type: "text", required: false },
};

type Binding = { ref_type: string; ref_value: unknown };
type Identity = { app_id: string; env_id: string; extension_key: string };

const staticBinding = (value: string): Binding => ({ ref_type: "static", ref_value: value });
const dynamicBinding = (stepId: string, propertyName: string): Binding => ({
  ref_type: "dynamic",
  ref_value: { rule_step_id: stepId, property_name: propertyName },
});

type PreviousStep = {
  stepId?: string;
  id?: string;
  identifier?: string;
  stepName?: string;
  element_display_name?: string;
  name?: string;
  properties?: { name?: string; title?: string; type?: string }[];
};

type FlowContext = {
  step?: { nexus_app_directives?: { input_bindings?: Record<string, Binding | Binding[]> } };
  previousSteps?: Record<string, PreviousStep>;
};

type Choice = { stepId: string; propertyName: string; value: string; label: string };

const choiceKey = (stepId: string, propertyName: string) => JSON.stringify([stepId, propertyName]);

function workitemChoices(flow: FlowContext): Choice[] {
  return Object.values(flow.previousSteps ?? {}).flatMap((step) => {
    const stepId = (step.stepId ?? step.id ?? step.identifier ?? "").trim();
    if (!stepId) return [];
    const stepLabel = step.stepName ?? step.element_display_name ?? step.name ?? stepId;
    return (step.properties ?? []).flatMap((property) => {
      if (property.type !== "pjm_workitem" || !property.name) return [];
      return [{
        stepId,
        propertyName: property.name,
        value: choiceKey(stepId, property.name),
        label: `${stepLabel} · ${property.title ?? property.name}`,
      }];
    });
  });
}

function unwrap(value: Binding | Binding[] | undefined): unknown {
  return (Array.isArray(value) ? value[0] : value)?.ref_value;
}

function submit(identity: Identity, url: string, choice: Choice | undefined): Promise<boolean> {
  return view.submit({
    ...identity,
    input_schema: INPUT_SCHEMA,
    input_bindings: {
      webhookUrl: [staticBinding(url.trim())],
      workItem: [choice ? dynamicBinding(choice.stepId, choice.propertyName) : staticBinding("")],
    },
    dynamic_property_schema: DYNAMIC_PROPERTY_SCHEMA,
  });
}

export function App() {
  const [identity, setIdentity] = useState<Identity>();
  const [choices, setChoices] = useState<Choice[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selection, setSelection] = useState("");
  const [error, setError] = useState("");
  const pendingSave = useRef(Promise.resolve());

  const commit = useCallback(
    (url: string, value: string) => {
      if (!identity) return;
      const choice = choices.find((item) => item.value === value);
      pendingSave.current = pendingSave.current.then(async () => {
        try {
          if (await submit(identity, url, choice) === false) throw new Error("保存失败");
          setError("");
        } catch {
          setError("无法保存通知配置，请重试");
        }
      });
    },
    [identity, choices],
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const host = await view.getContext();
        const flow = await NexusBridge.call<FlowContext>("flow.getContext");
        if (!flow) throw new Error("缺少 Flow 上下文");
        if (!active) return;

        const nextChoices = workitemChoices(flow);
        const saved = flow.step?.nexus_app_directives?.input_bindings ?? {};
        const ref = unwrap(saved["workItem"]) as { rule_step_id?: string; property_name?: string } | undefined;
        const savedKey = ref?.rule_step_id && ref.property_name
          ? choiceKey(ref.rule_step_id, ref.property_name)
          : "";
        const selection = savedKey
          ? nextChoices.find((item) => item.value === savedKey)?.value ?? ""
          : nextChoices.length === 1 ? nextChoices[0]!.value : "";

        setChoices(nextChoices);
        setSelection(selection);
        setWebhookUrl(String(unwrap(saved["webhookUrl"]) ?? ""));
        setIdentity({
          app_id: host.app.id,
          env_id: host.environment.id,
          extension_key: host.extension.key,
        });
      } catch {
        if (active) setError("无法读取 Flow 配置，请重新打开动作面板");
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <NxLayout>
      <NxContent>
        {error && <NxText>{error}</NxText>}
        {identity && (
          <>
            {choices.length === 0 && <NxText>请先添加输出工作项的上游步骤</NxText>}
            {(choices.length > 1 || (choices.length === 1 && !selection)) && (
              <>
                <NxBox className="mt-3 mb-2">
                  <NxText size="medium">数据来源工作项</NxText>
                </NxBox>
                <NxSelect
                  size="large"
                  placeholder="请选择上游工作项输出"
                  options={choices.map(({ value, label }) => ({ value, label }))}
                  value={selection}
                  onValueChange={(value) => {
                    const next = String(value ?? "");
                    setSelection(next);
                    commit(webhookUrl, next);
                  }}
                />
              </>
            )}
            <NxBox className="mt-4 mb-2">
              <NxText size="medium">企业微信群机器人 Webhook 地址</NxText>
            </NxBox>
            <NxInput
              value={webhookUrl}
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
              onValueChange={(value) => {
                setWebhookUrl(value);
                commit(value, selection);
              }}
            />
          </>
        )}
      </NxContent>
    </NxLayout>
  );
}
