# nexus-wiki-html-preview — HTML Preview

在 Wiki 页面中插入 HTML 内容块：编辑弹窗左侧输入 HTML，右侧实时预览。演示 Nexus [页面 - 文档内容块](https://developer.pingcode.com/reference/resource/extensions/wiki-document-block) 与 React [Custom UI](https://developer.pingcode.com/guide/development/custom-ui-with-react)。

编辑弹窗通过 [view.submit](https://developer.pingcode.com/reference/interface/bridge/view) 写入 `config.html`。阅读态首次用 `view.getContext()`；之后每次保存宿主派发 `NEXUS_EXTENSION_DATA_CONFIG_CHANGED`（见 [events](https://developer.pingcode.com/reference/interface/bridge/events)），main 订阅后更新渲染。

## Prerequisites

See [Getting started](https://developer.pingcode.com/guide/started/setup).

## Quick start

See [CLI](https://developer.pingcode.com/reference/cli/overview).

```bash
nexus register <app-name>   # first time only
npm install
npm run deploy
nexus distribute -s <your-domain>.pingcode.com -e development
```

Then install from enterprise admin **App review** and insert **HTML Preview** from a Wiki page's edit menu.

Related commands: [deploy](https://developer.pingcode.com/reference/cli/deploy), [distribute](https://developer.pingcode.com/reference/cli/distribute), [serve](https://developer.pingcode.com/reference/cli/serve).
