# nexus-workitem-dod-validator — 工作项 DoD 校验

可配置的工作项完成定义（DoD）校验器：在状态流转时检查已登记工时、子任务完成情况与关联测试用例数量。Demonstrates Nexus [工作项 - 工作流验证](https://developer.pingcode.com/reference/resource/extensions/pjm-workitem-validator)（`pcm:pjm:workitem:validator`），配置弹窗使用 React [Native UI](https://developer.pingcode.com/guide/development/native-ui-with-react)。

## Prerequisites

Environment, account, and CLI setup: [Getting started](https://developer.pingcode.com/guide/started/setup).

## Quick start

See [CLI](https://developer.pingcode.com/reference/cli/overview).

```bash
nexus register <app-name>   # first time only
npm install
npm run deploy
nexus distribute -s <your-domain>.pingcode.com -e development
```

Then install from enterprise admin **App review** and add the validator to a workflow rule (see [Configuration](#configuration)); a failing transition then shows **DoD 校验未通过**.

Related commands: [deploy](https://developer.pingcode.com/reference/cli/deploy), [distribute](https://developer.pingcode.com/reference/cli/distribute), [serve](https://developer.pingcode.com/reference/cli/serve).

## Configuration

- **Workflow rule**: after installing the app, open a project → project settings → work item type → workflow / state transition rules → add a rule → choose **DoD 校验** → toggle the three DoD rules and save.
