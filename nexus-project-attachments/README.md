# nexus-project-attachments — 附件

项目级附件库示例（Angular Custom UI + [ngx-tethys](https://tethys.pingcode.com)）：列表上传 / 重传 / 重命名 / 下载 / 删除；按关键词搜索；列表按上传时间倒序。上传只记录账号 id，列表通过 `references.members` 返回人员资料（含头像）。演示 Nexus [Storage](https://developer.pingcode.com/reference/functions/storage)（[NOS 管理对象](https://developer.pingcode.com/reference/functions/storage/nos-objects) 经 [store.upload / store.download](https://developer.pingcode.com/reference/interface/bridge/store) + [CES](https://developer.pingcode.com/reference/functions/storage/ces)）与 [Resolver](https://developer.pingcode.com/reference/functions/core/resolver) / [invoke](https://developer.pingcode.com/reference/interface/bridge/invoke)。扩展入口：[项目 - 组件页面](https://developer.pingcode.com/reference/resource/extensions/pjm-project-page)（路由 `attachments`）。

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

Then install from enterprise admin **App review** and open **附件** on a project's component page (route `attachments`).

Related commands: [deploy](https://developer.pingcode.com/reference/cli/deploy), [distribute](https://developer.pingcode.com/reference/cli/distribute), [serve](https://developer.pingcode.com/reference/cli/serve).
