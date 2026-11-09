# nexus-my-todos-widget — 我的待办

A personal todo list for the PingCode dashboard. View mode saves each add, check, and delete immediately through the `save` resolver ([CES](https://developer.pingcode.com/reference/functions/storage/ces) entity `todos`), and shows the list according to widget config: display count (`10` / `20` / `50`) and whether completed items are shown. Edit mode only sets that config, then **确定** calls [`view.submit()`](https://developer.pingcode.com/reference/interface/bridge/view). Extension entry: [工作台 - 仪表盘部件](https://developer.pingcode.com/reference/resource/extensions/global-dashboard-widget).

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

Then install from enterprise admin **App review** and add the **我的待办** widget on a dashboard.

Related commands: [deploy](https://developer.pingcode.com/reference/cli/deploy), [distribute](https://developer.pingcode.com/reference/cli/distribute), [serve](https://developer.pingcode.com/reference/cli/serve).
