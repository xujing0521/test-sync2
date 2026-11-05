# nexus-router — Router

A multi-page hub (sidebar: page1 / page2 / page3 / bridge router). Demonstrates app-internal routing with [`@pc-nexus/react/router`](https://developer.pingcode.com/guide/development/user-interface-with-route-by-react) `<BrowserRouter>`, and host navigation with Bridge [`router`](https://developer.pingcode.com/reference/interface/bridge/router) (`navigate` / `open` / `generateUrl` / `reload`). Extension entry: [全局 - 独立应用](https://developer.pingcode.com/reference/resource/extensions/global-app-hub) (React [Custom UI](https://developer.pingcode.com/guide/development/custom-ui-with-react)).

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

Then install from enterprise admin **App review** and open **Router** from the product main navigation (or `/nexus/apps/{appId}/{envId}`).

Related commands: [deploy](https://developer.pingcode.com/reference/cli/deploy), [distribute](https://developer.pingcode.com/reference/cli/distribute), [serve](https://developer.pingcode.com/reference/cli/serve).
