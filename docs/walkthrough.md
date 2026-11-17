# Walkthrough: FullStory loaded directly by the app (no GTM)

This sets up FullStory with the official [`@fullstory/browser`](https://www.npmjs.com/package/@fullstory/browser)
npm package, called from app code. It's **L2 + T2** in the original PoC's
[integration options](../../fullstory/docs/05-integration-options.md). No GTM account, container or tag is
involved.

> Sources: the `@fullstory/browser` 2.1.2 package and its type definitions (Nov 2026), and FullStory's help
> article on the Browser API. Items marked **verify** haven't been tested against a real org yet. Record the results
> in §8.

---

## 1. Why load FullStory directly

**Choose this when:** engineering owns analytics end to end, the site doesn't otherwise use GTM, or Security wants
no tag manager (no third-party script that non-developers can change in production).

| You get | You give up |
|---|---|
| Nothing FullStory-related loads before opt-in: no script, no request, no cookie | Marketing / analysts can't add or change FullStory tracking without a release |
| Every change goes through code review, tests and your release pipeline | Snippet updates need `npm update` + a release |
| Typed API, unit-testable (the tests mock the package) | You must wire consent to your CMP in code (no Consent Mode auto-blocking) |
| Org ID, capture and devMode per environment from app config | |
| EU / NA region picked automatically from the Org ID | |
| CSP only needs FullStory domains, and no `unsafe-inline` for a tag manager | |

**Rule:** never combine this with a GTM FullStory tag on the same site. FullStory would load twice.

## 2. What you need

- **The FullStory Org ID** for each FullStory org you'll use: FullStory → Settings → Data Capture and Privacy →
  Fullstory Setup. It's the `orgId` in the snippet, e.g. `o-XXXXXX-na1`. You don't need the snippet itself; the
  package generates it.
- Nothing in Google. If your site has a GTM container with a FullStory tag (auto-setup or template), **pause it**
  for any domain this app runs on.

## 3. How the app loads FullStory

`src/analytics/fullstory.ts`:

1. **Start-up:** reads config and stored consent. If the user hasn't opted in, or `fsCapture` is false, or there's
   no Org ID, **nothing else happens**.
2. **Opt-in:** calls `init({ orgId, devMode })` from `@fullstory/browser`. The package injects the snippet, which
   downloads `edge.fullstory.com/s/fs.js` and starts recording. Then the app replays the current identity
   (`setIdentity`) and page name (`setProperties` type `page`).
3. **While capturing:** `identify` → `setIdentity`, logout → `setIdentity {anonymous: true}`, route change →
   page `setProperties` (`pageName`, `appEnv`, `appVersion`), `track` → `trackEvent`.
4. **Withdrawal:** `FS('shutdown')`. **Opt-in again** in the same page: `FS('restart')` (no second `init`).
5. **Before opt-in:** identity and page name are remembered but not sent; events are dropped.

Calls made while `fs.js` is still downloading are queued by the package, so the app doesn't need to wait for it.

## 4. Configure environments

Put the Org ID in each environment's config. A runtime `app-config.js` value overrides the build value, so one
build can serve every environment.

| App env | File | `VITE_FS_ORG_ID` | `VITE_FS_CAPTURE` | Notes |
|---|---|---|---|---|
| local | `.env.development.local` | non-prod org (or prod org) | `true` (from `.env.development`) | Set `VITE_DEBUG=true` here too. `VITE_FS_DEV_MODE=true` loads the SDK without recording. |
| test | `.env.test` | empty | `false` | Automated tests: FullStory never loads, so no sessions or quota used. |
| uat | `.env.uat` | non-prod org | `true` | |
| preprod | `.env.preprod` | non-prod or prod org | `true` | Use prod org if you want a production-like check of settings. |
| production | `.env.production` | **prod org** | `true` | Debug off. devMode must be off (the app warns). |

With a single FullStory org, use the same ID everywhere and filter by the `appEnv` page property in FullStory. Also
restrict capture domains in FullStory's settings.

## 5. Run locally

`fullstory-direct/.env.development.local`:

```dotenv
VITE_FS_ORG_ID=o-XXXXXX-na1
VITE_DEBUG=true
```

```bash
npm install
npm run dev
```

## 6. Verify

Clear site data for `localhost` first (DevTools → Application → Storage → Clear site data). Open **Analytics debug**
(bottom left).

| Step | Debug panel | DevTools |
|---|---|---|
| Load, before choosing | FS script: `not loaded`. FS capture: `waiting-for-consent`. Calls: empty. | Network filter `fullstory`: **nothing**. `typeof FS` → `"undefined"`. No `fs_` cookies. |
| Accept | FS script: `loaded`. Capture: `capturing`. Calls: `init (load fs.js)`. Replay link appears. | `edge.fullstory.com/s/fs.js?org=…`, settings, then `rec/page` and `rec/bundle`. `FS._v` → `2.1.0`. Cookies `fs_uid`, `fs_lua`. |
| Add to cart / log in | Calls: `trackEvent …`, `setIdentity …` | In FullStory: `Product Added`, identified user, page names |
| Privacy settings → Reject | Capture: `shut-down`, call `shutdown` | `rec/bundle` stops |
| Accept again | Capture: `capturing`, call `restart` | Recording resumes. No second `fs.js` download. |
| Reload with consent stored | `capturing` straight away | — |
| `npm run build:test && npm run preview` | Capture: `disabled for this env` | No FullStory requests at all |

**Tested in this PoC** (dummy Org ID, Nov 2026): before Accept there was no `window.FS`, no fullstory.com request and
no cookie. After Accept, `fs.js` and settings loaded from `edge.fullstory.com`, and `FS._v` was `2.1.0`.
**verify** the recording rows with a real Org ID.

## 7. Release pipeline

| Change | Who | How |
|---|---|---|
| New event, property, page name, identify field | Developers | Code change in the facade call sites → PR → tests → normal release |
| Turn recording on/off for an environment | Developers / ops | `VITE_FS_CAPTURE` (rebuild) or `fsCapture` in `app-config.js` (no rebuild) |
| Point an environment at another org | Developers / ops | `VITE_FS_ORG_ID` or `fsOrgId` in `app-config.js` |
| Emergency kill switch in production | Ops | Deploy `app-config.js` with `fsCapture: false` (no rebuild). Without GTM there's no faster switch, so make sure this file can be deployed quickly. **verify** whether FullStory settings can pause capture for the whole org. |
| Masking / exclusion | Developers (`fs-mask` / `fs-exclude` classes in markup) **and** FullStory admins (Privacy settings, no release needed) | |
| Snippet / package update | Developers | `npm update @fullstory/browser` → review changelog → test → release. Dependabot/Renovate can raise these. |
| Guides & Surveys, segments, funnels, dashboards | FullStory users | In FullStory, no release (they need FullStory loaded, which this does) |

## 8. Findings to record

- [x] Nothing loads before consent (dummy Org ID test)
- [x] Snippet version from the package: `FS._v` = 2.1.0
- [ ] First replay appears with a real Org ID; events, identity and page names visible
- [ ] Shutdown / restart behaves as expected in a real session
- [ ] EU org (if relevant): `fs.js` loads from `edge.eu1.fullstory.com` with only the Org ID set
- [ ] Bundle size cost of the package (the snippet is small; `fs.js` itself still loads from FullStory's CDN)
- [ ] CSP: the exact FullStory domains needed (`edge.fullstory.com`, `rs.fullstory.com`, …)

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Debug panel says `disabled for this env` | `VITE_FS_CAPTURE` isn't `true`, or `VITE_FS_ORG_ID` is empty or invalid (see the console warning) |
| `not loaded` after Accept | Ad blocker or CSP blocking `edge.fullstory.com` |
| Loaded but no replay link | `devMode` on, wrong Org ID, or FullStory's capture-domain setting excludes this domain |
| FullStory namespace conflict warning | A GTM FullStory tag or another snippet is still on the page. Keep only one loader. |
| Changes to `.env` not picked up | Restart `npm run dev`. Build values are fixed at build time; use `app-config.js` to change a deployed build. |
