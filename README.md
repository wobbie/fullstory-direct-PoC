# FullStory PoC: direct variant (no GTM)

A copy of the [original PoC](../fullstory/README.md) ("Leaf & Bean" storefront) that loads FullStory **directly
from the app**, using FullStory's official npm package
[`@fullstory/browser`](https://www.npmjs.com/package/@fullstory/browser). Google Tag Manager isn't used at all.

In the terms of the original PoC's [integration options](../fullstory/docs/05-integration-options.md) this is
**L2 + T2**:
- **Loading (L2):** `@fullstory/browser` 2.1.2 bundles the FullStory snippet (2.1.0, the same version auto-setup
  used) into the app's JavaScript. The app calls its `init()` **only after consent**.
- **Calling (T2):** the app's analytics facade calls FullStory for start/stop, identify, page names and events.
  This is the same facade as the auto-setup and template variants.

Setup steps: **[docs/walkthrough.md](docs/walkthrough.md)**.

## How it differs from the other versions

| | Original PoC (L6 + T3) | Auto-setup / template (L5/L4 + T2) | **This variant (L2 + T2)** |
|---|---|---|---|
| What loads FullStory | GTM Custom HTML tag | GTM tag (Custom HTML / template) | **App bundle (`@fullstory/browser`)** |
| GTM needed | Yes | Yes | **No** |
| Before consent | Tag blocked by Consent Mode | Script may load (auto-setup) and waits for `FS('start')` | **Nothing**: no script, no request, no cookie |
| Consent | GTM Consent Mode | App + optional GTM gating | **App only** (`src/analytics/consent.ts`, swap for your CMP) |
| Per-environment on/off | GTM lookup table | `VITE_FS_CAPTURE` | `VITE_FS_CAPTURE` |
| Per-environment FullStory org | GTM lookup table | One org (auto-setup) / lookup (template) | **`VITE_FS_ORG_ID` per env** |
| Data region (NA / EU) | Configurable | Auto-setup: your snippet. Template: NA only | **Automatic** from the Org ID suffix (`-na1` / `-eu1`) |
| Snippet updates | Hosted snippet | Edit tag / accept template update | **`npm update`**, then a normal release |
| Who can change tracking | GTM publishers | GTM publishers + developers | **Developers only, through code review and releases** |
| CSP | GTM + FullStory domains, Custom HTML needs `unsafe-inline` or a nonce | GTM + FullStory domains | **FullStory domains only** |
| Tests | Container JSON + app | App (stubbed `window.FS`) | **App (mocked npm package)** |

## Quick start

```bash
npm install
# .env.development.local (git-ignored):
#   VITE_FS_ORG_ID=o-XXXXXX-na1
#   VITE_DEBUG=true
npm run dev     # http://localhost:5173
```

With no Org ID set, FullStory never loads and the app runs normally.

## Configuration

| Variable (`.env.<mode>`) | Runtime key (`app-config.js`) | Meaning |
|---|---|---|
| `VITE_APP_ENV` | `appEnv` | `local`, `test`, `uat`, `preprod`, `production` |
| `VITE_FS_ORG_ID` | `fsOrgId` | FullStory Org ID for this environment. Empty = FullStory off. The region suffix picks the data centre. |
| `VITE_FS_CAPTURE` | `fsCapture` | `true` = this environment may load FullStory (after consent). `test` = false. |
| `VITE_FS_DEV_MODE` | `fsDevMode` | `true` = SDK loads but records nothing (FullStory `devMode`). Warns if on in production. |
| `VITE_CONSENT_DEFAULT` | `consentDefault` | `denied` (opt-in, default) or `granted` |
| `VITE_DEBUG` | `debug` | Debug panel (bottom left) and console logging |

Runtime keys in `public/app-config.js` override build-time values, so one build can be deployed to every
environment with a different Org ID or capture setting. `app-config.js` stays plain JavaScript (the browser loads it
unbuilt), but `npm run typecheck` checks it against `RuntimeConfig` in `src/globals.d.ts`. `VITE_*` variables are
typed in `src/vite-env.d.ts`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build:test` / `build:uat` / `build:preprod` / `build:prod` | Environment builds |
| `npm test` | Unit tests: nothing loads before consent, init + replay, shutdown/restart, env and org switches, devMode |
| `npm run typecheck` | TypeScript check |

## Key files

```
src/analytics/fullstory.ts   FullStory client: init() only after consent, shutdown/restart,
                             replay identity + page on start, call log for the debug panel
src/analytics/index.ts       public entry point: re-exports the facade; the only import the app uses
src/analytics/analytics.ts   the facade (pageView, identify, track, setConsent, debugStatus)
src/analytics/consent.ts     stores the consent choice (replace with your CMP)
src/config.ts                Org ID / capture / devMode per environment
```

## Secrets and local config

- **Never commit Org IDs or other per-environment values in `.env*` files.** Put them in `.env.local` /
  `.env.<mode>.local` (git-ignored, loaded automatically by Vite), in CI variables, or in `app-config.js` at deploy
  time. The committed `.env*` files only hold non-sensitive defaults.
- **Turn on the pre-commit guard once per clone:** `git config core.hooksPath .githooks`. It blocks commits that
  stage `*.local`, key/cert files or `.npmrc`, `.env` files that set ID/secret-like keys, and common token
  patterns. It prints file and key names only, never values.
- **Claude Code** is denied from reading `*.local`, key files and the environment via `.claude/settings.json`.
  This is a guard rail, not a guarantee: shell commands can still be written to read files, so keep real secrets out
  of this folder where possible.
