---
name: use-nexus-event-feed
description: >-
  One-click environment setup, deploy, distribute, and install guidance for the
  nexus-event-feed example app. Use when the user asks to 一键部署本示例, deploy,
  install, set up, or run this Nexus event feed example.
---

# Use nexus-event-feed

Help the user run this example end-to-end. Work from `nexus-event-feed` (this app root). Ask for secrets/URLs when missing; do not invent CLI commands.

## Checklist

Copy and track progress:

```text
- [ ] 1. Tooling
- [ ] 2. Login
- [ ] 3. App id / register
- [ ] 4. remoteUrl + site URL
- [ ] 5. Install deps + deploy
- [ ] 6. Distribute
- [ ] 7. Enterprise install (manual)
- [ ] 8. Verify in product
- [ ] 9. Optional local serve
```

### 1. Tooling

- Node.js >= 24: `node -v`
- npm: `npm -v` (ships with Node)
- Nexus CLI: `nexus --version` or `npx nexus --version`
  - Install globally if needed: `npm i -g @pc-nexus/cli@latest`

### 2. Login

```bash
nexus whoami
```

If not logged in, ask for a developer PAT and run:

```bash
nexus login --token <PAT>
```

### 3. App id / register

Read `manifest.yaml` → `app.id`.

- If deploy fails because the app is not registered on the user's developer account, run `nexus register` (or the current CLI register flow), then write the new UUID back to `manifest.yaml` `app.id`.
- Also replace that same UUID inside `event.triggers` for the `summary-completed` app trigger (`nae:app:<app.id>:summary-completed`). The subscription has to name this app.
- Confirm `app.version` is valid semver.

### 4. Collect URLs

- Confirm or update `nexus.json` `remoteUrl` (developer platform, e.g. `https://developer.alpha.pingcode.live`).
- Ask for the PingCode enterprise site used for distribute, e.g. `https://{domain}.pingcode.com` → pass as `-s`.

### 5. Install and deploy

```bash
npm install
npm run build-web
nexus deploy
```

(Default environment: `development`. This Custom UI app must build `web/main/dist` before deploy. `npm run deploy` builds the frontend and then deploys.)

### 6. Distribute

```bash
nexus distribute -s <site-url-or-domain> -e development
```

### 7. Enterprise install (manual)

There is **no** `nexus install` command. Tell the user to open the enterprise admin **App review** list and install this app.

### 8. Verify

1. Open **事件动态** from the main navigation (`/nexus/apps/{appId}/{envId}`).
2. Confirm the timeline shows 「应用已安装，初始化完成」 and a single build-result URL.
3. Create or update a work item. Reopen the page and confirm a system line.
4. POST the URL:

```bash
curl -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"build":"42","result":"succeeded"}'
```

5. Reopen the page and confirm 「收到外部构建结果」.
6. Wait for the next `tenMinute` tick (up to about 10 minutes). Reopen the page. Confirm 「本轮收到 N 条事件」, 「汇总完成事件已被消费」, and one schedule row. N does not include those two lines.

### 9. Optional local development

```bash
npm run start-web
nexus serve
```

The frontend dev server listens on port `3110`, matching `nexus.json` `serve.resources.main.port`. Run `nexus` commands from `nexus-event-feed/` so local `nexus.json` is picked up.
