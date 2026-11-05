# nexus-external-profile

A personal-settings page (Angular Custom UI + [ngx-tethys](https://tethys.pingcode.com/)) that **binds** a GitHub username to the current PingCode user and shows that public profile. The first visit (no KVS value) still loads the demo user `octocat` and shows **绑定**; after a successful **绑定**, the username is stored and the button becomes **重新绑定**. Demonstrates Nexus [fetch.request](https://developer.pingcode.com/reference/functions/network/fetch), [KVS](https://developer.pingcode.com/reference/functions/storage/kvs), [external permissions](https://developer.pingcode.com/reference/manifest/permissions-external), and [content permissions](https://developer.pingcode.com/reference/manifest/permissions-content). Extension entry: [Account — Personal settings](https://developer.pingcode.com/reference/resource/extensions/global-personal-setting).

The page calls the resolver with [invoke](https://developer.pingcode.com/reference/interface/bridge/invoke). An empty payload loads the saved binding, or falls back to `octocat` without writing storage (`bound: false`). Submitting a username looks up `GET https://api.github.com/users/{username}` through `fetch.request` (no token) and, on success, saves with `kvs.set` under `pcp:storage:app`, keyed by the PingCode user. The avatar is loaded from `avatars.githubusercontent.com`. Anonymous GitHub requests are limited to 60 per hour for each egress IP, so a successful lookup is cached for 10 minutes. A failed bind/rebind does not replace the saved username.

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

Then install from enterprise admin **App review** and open account settings → **外部资料** → **GitHub** (route `github`).

Related commands: [deploy](https://developer.pingcode.com/reference/cli/deploy), [distribute](https://developer.pingcode.com/reference/cli/distribute), [serve](https://developer.pingcode.com/reference/cli/serve).
