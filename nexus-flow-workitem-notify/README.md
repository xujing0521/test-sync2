# nexus-flow-workitem-notify — Nexus Workflow 动作最小示例

面向开发者的示例应用：**演示如何为 Nexus Workflow（智能引擎）开发一个自定义动作**，而不是演示通知功能本身。投递逻辑刻意压缩到「往企业微信机器人 Webhook POST 一条文本」，请把注意力放在 Workflow 的数据流上。

配置面板使用 React [Native UI](https://developer.pingcode.com/guide/development/native-ui-with-react)（`render: native` + `Nx*` 平台组件），结构与 `nexus-workitem-dod-validator` 一致。扩展点：[工作流 - 动作](https://developer.pingcode.com/reference/resource/extensions/pcm-flow-workflow-action)（`pcm:flow:workflow:action`）。

## Prerequisites

环境、账号与 CLI 准备：参见 [Getting started](https://developer.pingcode.com/guide/started/setup)。

## Quick start

```bash
npm install
npm run deploy
nexus distribute -s <your-domain>.pingcode.com -e development
```

本地调试：`npm run serve`（Native UI 不需要在 `nexus.json` 里配端口，CLI 自动分配）。

然后在企业管理后台 **App review** 中安装。相关命令：[deploy](https://developer.pingcode.com/reference/cli/deploy)、[distribute](https://developer.pingcode.com/reference/cli/distribute)、[serve](https://developer.pingcode.com/reference/cli/serve)。

## Workflow 数据流（本示例的核心）

```
When   工作项触发器（创建 / 状态变更）      输出属性含 pjm_workitem
  │
  ▼  ① 声明：manifest.inputPolicy / inputSchema / dynamicPropertySchema
Then   [本应用] 发送企业微信群通知
  │
  ▼  ② 配置：Native UI 把表单值写成 input_bindings 交给 Flow 画布
  │           webhookUrl = static（手填值）
  │           workItem   = dynamic（引用上游步骤的输出属性）
  ▼  ③ 执行：Flow 运行时求值绑定，注入 payload.inputs；resolver 读输入并 POST
  ▼  ④ 输出：resolver 返回 properties.notifyDelivered，供后续节点引用
```

四个环节分别对应的代码：

| 环节 | 位置 | 要点 |
| --- | --- | --- |
| ① 声明契约 | `manifest.yaml` | `inputSchema` 定义动作能接收什么；`dynamicPropertySchema` 定义留给下游的输出变量 |
| ② 配置面板 | `web/main/App.tsx` | 用 `NxInput` / `NxSelect` 收集，`view.submit({ input_schema, input_bindings, dynamic_property_schema })` 写回；上游数据源按属性 `type` 识别 |
| Native UI 入口 | `web/main/index.tsx` | `NexusReconciler.render`，`resources[].render: native` |
| ③ 运行时 | `src/resolvers/index.ts` | 从 `payload.inputs` 读绑定值，执行动作 |
| ④ 输出变量 | `src/resolvers/index.ts` | `return { properties: { notifyDelivered } }` |

配置面板通过 `view.submit` 一并提交 `input_schema` / `dynamic_property_schema`，**宿主据此在保存时做必填校验**。所以改契约时，`manifest.yaml` 的 ①、`App.tsx` 中的 `INPUT_SCHEMA` / `DYNAMIC_PROPERTY_SCHEMA`、以及 ④ 返回的 `properties` 键需要同步。

## Form fields

- **企业微信群机器人 Webhook 地址**：企业微信群机器人的 Webhook，静态配置，`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...`。鉴权 key 已在 URL 中，无需签名。只有 HTTP 请求成功且企业微信返回 `errcode: 0` 时，`notifyDelivered` 才为 `"true"`。
- **数据来源工作项**：只有一个 `pjm_workitem` 输出时，填写 Webhook 即会保存该绑定；有多个输出时，选择具体字段。重新打开面板会回显已保存的配置。

Flow 注入的 `workItem` 通常只是工作项 ID，resolver 会按 `GET /v2/pjm/workitems/{id}` 回查详情，再渲染固定格式文本：标题、项目、状态、操作人（取不到的字段自动省略）。回查失败时退化为一行 `工作项：ID`。不支持自定义模板、多渠道或加签。

## Notes

- 投递采用企业微信机器人的 `text` 报文（`{ msgtype: "text", text: { content } }`）；在群里添加机器人即可获得带 `key` 的 Webhook 地址，无需额外加签。
- `permissions.external.fetch.backend` 只放行 `qyapi.weixin.qq.com`；`scopes` 声明 `pcp:read:pjm:workitem`，用于按 ID 回查工作项详情。
- Native UI 只能渲染 `@pc-nexus/react` 的平台组件，不能用原生 HTML 标签或自定义 CSS；样式用白名单工具类（如 `mb-2`）。配置面板用 `NxLayout` / `NxContent` / `NxBox` 组织布局，与 `nexus-workitem-dod-validator` 的写法一致。
- 依赖集中在根 `package.json`（无 `web/main/package.json`、无 workspaces），`@pc-nexus/react-builder` 由 CLI 在部署时编译 `web/main/index.tsx`。
