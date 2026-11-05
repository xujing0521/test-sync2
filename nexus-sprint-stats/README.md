# nexus-sprint-stats — 迭代统计 / Sprint Stats

A sprint details page with metric cards and a work-item completion table. Demonstrates the Nexus [Resolver](https://developer.pingcode.com/reference/functions/core/resolver) and [`api.invoke`](https://developer.pingcode.com/guide/development/network-calling-apis-from-backend) for the [PingCode REST API](https://developer.pingcode.com/restapi/pingcode/overview). Extension entry: [Sprint Page](https://developer.pingcode.com/reference/resource/extensions/pjm-sprint-page).

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

Then install from enterprise admin **App review** and open a sprint detail page to view the **迭代统计** page.

Related commands: [deploy](https://developer.pingcode.com/reference/cli/deploy), [distribute](https://developer.pingcode.com/reference/cli/distribute), [serve](https://developer.pingcode.com/reference/cli/serve).
