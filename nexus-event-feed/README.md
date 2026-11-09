# nexus-event-feed — 事件动态

One timeline per team. Demonstrates [event subscriptions](https://developer.alpha.pingcode.live/guide/development/events): [lifecycle](https://developer.alpha.pingcode.live/guide/development/events-lifecycle-trigger), [system](https://developer.alpha.pingcode.live/guide/development/events-system-trigger), [scheduled](https://developer.alpha.pingcode.live/guide/development/events-scheduled-trigger), [webhook](https://developer.alpha.pingcode.live/guide/development/events-webhook-trigger), and [app](https://developer.alpha.pingcode.live/guide/development/events-app-trigger). Extension entry: [Global — App hub](https://developer.alpha.pingcode.live/reference/resource/extensions/global-app-hub).

Installing the app writes 「应用已安装，初始化完成」. Upgrading it writes 「应用已升级」. Creating or updating a work item writes a system line. POST a build result to the URL shown on the page to write an external line. The `tenMinute` trigger then claims pending lines, publishes [汇总完成](https://developer.alpha.pingcode.live/reference/functions/events/app), and the subscriber writes 「汇总完成事件已被消费」. An empty round writes nothing. Open the page again to see the new lines. The page shows one stable [webhook URL](https://developer.alpha.pingcode.live/reference/functions/events/webhook-url).

```bash
curl -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"build":"42","result":"succeeded"}'
```

`result` may also be `failed`. Any other body is stored as an unrecognized request. The handler responds with HTTP 200 and an empty body after the line is stored.

## Prerequisites

Environment, account, and CLI setup: [Getting started](https://developer.alpha.pingcode.live/guide/started/setup).

## Quick start

In Cursor, open this directory and ask the agent:

> 一键部署本示例

See [`.agents/skills/use/SKILL.md`](./.agents/skills/use/SKILL.md).

Or manually (see [CLI](https://developer.alpha.pingcode.live/reference/cli/overview)):

```bash
npm install
nexus deploy
nexus distribute -s <your-domain>.pingcode.com -e development
```

Then install from enterprise admin **App review**. Local debug: run `nexus serve` from this directory, with the frontend dev server on port `3110`.

After install, open **事件动态**. Copy the build URL, create or update a work item, POST the sample body, then wait for the next 10-minute tick and reopen the page.

Related commands: [deploy](https://developer.alpha.pingcode.live/reference/cli/deploy), [distribute](https://developer.alpha.pingcode.live/reference/cli/distribute), [serve](https://developer.alpha.pingcode.live/reference/cli/serve).
