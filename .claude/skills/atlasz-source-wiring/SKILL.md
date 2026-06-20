---
name: atlasz-source-wiring
description: >-
  Use when adding, wiring, or auditing a public data source/provider in Atlasz
  Intel (OSINT, macro, markets, filings, space, research, natural-events, etc.).
  Encodes the lawful verify-then-wire discipline, the provider/adapter model,
  honest provenance, and the validation gates so new sources land fast, real,
  and fail-closed. Triggers: "add a source/feed/provider", "wire <feed> into
  Atlasz", "plug in <API/RSS>", "source health", "make a connector".
---

# Atlasz source wiring

Atlasz is a local-first (Electron/Node + React) world/markets intelligence
terminal. Sources are **provider-driven** and **honest**: real public data or an
explicit unavailable state — never fake data, never scraping.

## 1. Lawful acquisition directive (non-negotiable)

Prefer, in order: **official API → public dataset → RSS/Atom → official filing**.
Only public, documented, no-auth (or your-own-key) endpoints.

NEVER: collect private/personal data, bypass auth/login/paywall/CAPTCHA, evade
rate limits, scrape people (emails/socials/usernames), or hit undocumented
private endpoints. Respect robots.txt, rate limits, ToS, attribution, privacy.
If a source needs any of that → it does not get wired. State that plainly.

## 2. Verify BEFORE you wire (always)

Never add a guessed URL. Confirm it is live and returns the expected shape first
(use WebFetch, or a throwaway node/vitest fetch). Record: status 200, format
(RSS/Atom vs JSON vs GeoJSON), and which keys hold title / url / date.
If it 403s without a User-Agent, note it (see §4). If geo-blocked (e.g. Binance
451) or paywalled → skip and say why. A dead feed must surface as `failed`, not
get faked.

## 3. Wire it (files + steps)

1. **Add the provider** in `electron/providers/providerConfig.ts`
   → `BUILTIN_PROVIDERS` (or a user's `atlasz.providers.json` for custom).
   Fields: `providerId, providerName, category, adapter, enabled, endpoint,
   authType ('none'|'api-key'|'bearer-token'|'env'), envKey?, pollIntervalMs,
   rateLimitGuardMs, timeoutMs, provenance, legalSafetyNote`.
   Helpers exist: `rssProvider(...)`, `managedProvider(...)`.
2. **Pick the adapter** (in `electron/osint/adapterRegistry.ts` →
   `electron/osint/adapters/`):
   `rss` (RSS/Atom), `custom-json` (JSON/GeoJSON), `gdelt`, `sec-edgar`,
   `fred-macro`, `public-disclosure-json`; `managed-ingest` (handled by an
   existing subsystem), `disabled` (scaffold). Custom providers are restricted
   to `rss` / `custom-json` / `gdelt` + a public http(s) endpoint.
3. **Add capability metadata** in `electron/providers/builtinProviderCatalog.ts`
   → `PROVIDER_CAPABILITY_META[providerId]`: `feedTypes`, `envKeysRequired`,
   `symbolDiscovery?`, `supportedEventTypes`, `supportedRegions`.
4. Adapters normalize into **`WorldIntelEvent`** (via
   `buildWorldIntelEventFromHeadline` for news; asset mapping is adapter-
   authoritative — never text-guess tickers).

## 4. Provenance + fail-closed (the honesty contract)

Set the most truthful label (`src/provenance.ts`):
`official-api` · `public-disclosure` · `public-unauthenticated` · `rss-public` ·
`local-derived` · `local-computed` · `math-derived` · `model-inferred` ·
`simulated` (only if truly simulated). Never make inferred/local look verified.

- Missing key → provider shows `missing-config` (not failure, not fake).
- Configured-but-dead → `failed` with the real error on its Source Health tile.
- No public adapter → `auth-gated` / `disabled`.
- Gov/official feeds (esp. SEC): send a descriptive **User-Agent** in the
  adapter fetch AND the discovery health-check, or they 403 → false "unavailable".

## 5. custom-json adapter conventions

`electron/osint/adapters/customJsonAdapter.ts` does flexible key mapping:
- record arrays under `items|data|results|articles|events|features`;
- title from `title|headline|name|full_name|summary|event`;
- url from `url|link|html_url|source_url|permalink|webcast_live`;
- date from `timestamp|date|published|net|created_at|updated_at|pushed_at|time`.
- **GeoJSON**: `features[].properties` is flattened automatically (USGS,
  weather.gov, gov feeds). Add new keys here when an API uses different names.

## 6. Validation gates (all must pass)

```
npx tsc -b            # clean
npm run lint          # clean
npm run test          # all pass (registry test gates with ATLASZ_ENABLE_PUBLIC_WORLD=0)
npm run build         # no "larger than 500 kB" chunk warning
git diff --check
```
Then **verify-by-running**: a throwaway vitest that calls the adapter/registry
against the live endpoint and confirms real events come back (write results to a
file — vitest swallows console.log). Delete the throwaway after. Generated
`dist-electron/src-*.js` chunks flip hashes each build; only commit the one
`main.js` references and `rm` strays before `git add dist-electron/main.js`.

## 7. Quick reference

- Discovery + health: `electron/providers/providerDiscoveryService.ts`
  (env probe, endpoint health, symbol/KAS resolution → `PRICE_UNAVAILABLE` when
  unlisted). UI: `src/components/status/SourceHealthView.tsx`.
- Config path env: `ATLASZ_PROVIDER_CONFIG` (alias `ATLASZ_PROVIDERS_CONFIG`).
- World registry gate: `ATLASZ_ENABLE_PUBLIC_WORLD` (`0` disables polling).
- Numeric time-series (FRED/Treasury/World Bank) are quant data, NOT
  `WorldIntelEvent` — they belong in the macro/quant path, not the news adapters.
