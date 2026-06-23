# Runtime Verification Log

**Date:** 2026-06-23
**Build:** `main` @ checkpoint (16 connectors, 323 unit tests green)
**Method:** Headless harness `scripts/runtimeVerification.mts` (`npx tsx scripts/runtimeVerification.mts`).
It drives the **same code** the dashboards render — `buildConnectorAudit` (Connector
Dashboard engine), `summarizeExposure` / `eventStructuralExposure` (Exposure Dashboard
engine), the real connector fetch/normalize paths, and the SQLite persistence layer.

> **Scope honesty.** The GUI Electron window was **not** visually driven in this run — no
> display was available, and no screenshots are included rather than fabricated ones. The
> harness exercises the identical logic the dashboards consume. The "real keys" portion of
> the operator checklist could **not** be run: **no `.env` exists and zero API keys are set
> in this environment.** No keys were invented. Keyed connectors are therefore reported in
> their honest `missing-key` state, which is itself a valid thing to verify.

---

## 1. Env keys present / missing (names only, no values)

| Key | Present |
|---|---|
| `ATLASZ_PATENTSVIEW_API_KEY` | ❌ missing |
| `ATLASZ_EIA_API_KEY` | ❌ missing |
| `ATLASZ_BEA_API_KEY` | ❌ missing |
| `ATLASZ_FRED_API_KEY` | ❌ missing |
| `ATLASZ_SEC_USER_AGENT` | ❌ missing |
| `GITHUB_TOKEN` / `ATLASZ_GITHUB_TOKEN` | ❌ missing |

Only `.env.example` is present. To do a full keyed run, copy it to `.env` and populate the
keys, then re-run the harness (and, separately, the desktop app).

## 2. Connector state matrix (cold start, real env)

This is the dashboard exactly as it renders **before** the fetch loop registers any source
snapshot — derived from `buildConnectorAudit({ sources: [], events: [] })`.

| Connector | State | Reason |
|---|---|---|
| SEC EDGAR | `missing-key` | Missing `ATLASZ_SEC_USER_AGENT` |
| FRED | `missing-key` | Missing `ATLASZ_FRED_API_KEY` |
| BEA | `missing-key` | Missing `ATLASZ_BEA_API_KEY` |
| EIA | `missing-key` | Missing `ATLASZ_EIA_API_KEY` |
| USPTO PatentsView | `missing-key` | Missing `ATLASZ_PATENTSVIEW_API_KEY` |
| Treasury Fiscal Data | `pending-first-fetch`¹ | Configured; waiting for first poll/manual run |
| BLS | `pending-first-fetch`¹ | Configured; waiting for first poll/manual run |
| NOAA/NWS Alerts | `pending-first-fetch`¹ | Configured; waiting for first poll/manual run |
| USGS Earthquakes | `pending-first-fetch`¹ | Configured; waiting for first poll (**fetches live — see §3**) |
| GitHub Releases | `pending-first-fetch`¹ | Configured; waiting for first poll/manual run |
| CISA KEV | `pending-first-fetch`¹ | Configured; waiting for first poll (**fetches live — see §3**) |
| NVD CVEs | `pending-first-fetch`¹ | Configured; waiting for first poll/manual run |
| GitHub Advisories | `pending-first-fetch`¹ | Configured; waiting for first poll/manual run |
| OSV.dev | `pending-first-fetch`¹ | Configured; waiting for first poll/manual run |
| CISA Advisories | `pending-first-fetch`¹ | Configured; waiting for first poll/manual run |
| UN Comtrade | `not-wired`² | No runtime adapter/persistence/UI slice in this checkpoint (catalog only) |

¹ **Fixed (was the §8 finding).** Implemented, public, no-key connectors now cold-start as
`pending-first-fetch` — "configured, hasn't polled yet" — instead of sharing the `not-wired`
chip with genuinely-absent adapters. `not-wired` (²) is now reserved for
`implemented === false`. These connectors **do** fetch (proven live in §3).

## 3. Live fetch — public official sources (real network)

Real `https` fetches through the production adapter code (`fetchUsgsEarthquakes`,
`fetchKevVulnerabilities`):

| Source | Result | Payload hash | retrievedAt | Trail URL |
|---|---|---|---|---|
| USGS Earthquakes | ✅ 14 records normalized | ✅ present | ✅ present | ✅ `https://…` |
| CISA KEV | ✅ 25 records normalized | ✅ present | ✅ present | ✅ `https://…` |

Both fetch **or** fail honestly (empty result throws nothing; HTTP errors would surface via
`assertOk`). Every normalized event carried a non-empty `rawPayloadHash`, a numeric
sub-record `retrievedAt`, and an `https` source-trail URL.

## 4. Key redaction (sentinel canary, USPTO keyed adapter)

No real key needed: a sentinel (`SENTINEL_LEAK_CANARY_…`) was injected as the USPTO API key
with `fetch` stubbed, then the full normalize path was scanned.

- ✅ Key travels **only** in the request header (`x-api-key`), confirmed captured outbound.
- ✅ Key **absent** from the request URL / query string.
- ✅ Key **absent** from the normalized event (source URL, payload, record) — 1,980 bytes scanned.
- ✅ Key **absent** from the persisted SQLite DB after a restart (§5).

No API key appeared in any UI-bound field, source URL, normalized payload, or persisted JSON.

## 5. Persistence round-trip across restart

- Persistence mode active: **`node:sqlite`**.
- Saved 6 events (5 live public + 1 keyed-adapter patent) + an audit row, called `close()`
  to simulate shutdown, reopened a **new** persistence instance against the same data dir.
- ✅ **6/6** events reloaded after restart.
- ✅ No sentinel key present in the reloaded DB.
- ✅ Reloaded patent retained its `rawPayloadHash` and sub-record `retrievedAt` (sub-record
  round-trip intact).

## 6. Exposure activation vs honest non-resolution

- ✅ Resolvable event (NVIDIA patent, CPC `H01L`/`G06N`) activated **3** curated seed
  entities (company + technologies); every exposure carried `source: 'resolver-rule'`.
- ✅ An event stripped of identifiers stayed **unresolved** — no seed exposure was inferred.
- ✅ No `"verified"` token anywhere in exposure output. Curated structure is never shown as
  verified.
- `summarizeExposure` over today's live events: `considered=0`. Honest and expected — the
  live USGS/KEV records' timestamps fall outside the rolling 24h materiality window (KEV
  `dateAdded` values are historical). Not a failure; the window is working as designed.

## 7. Restart / replay state

Covered by §5: SQLite state (`world_intel_events`, sub-records, `source_audit_log`) survived
a close+reopen cycle with full fidelity. Stale/cached states are labeled honestly by the
audit engine (`stale`, `rate-limited`, `failed`, `unavailable` are distinct states).

## 8. Failures & next fixes

1. **No blocking failures. 16/16 harness checks passed.**
2. ~~**`not-wired` is overloaded** (cold start).~~ **FIXED.** Added a distinct
   `pending-first-fetch` status. `not-wired` is now reserved for `implemented === false`
   (UN Comtrade). Implemented public connectors cold-start as `pending-first-fetch`;
   key-gated connectors without a key stay `missing-key`; `unavailable`/`rate-limited`/
   `failed`/`stale` keep their meaning. Change isolated to `connectorStatus` in
   `runtimeAudit.ts` + dashboard legend/labels/CSS + tests.
3. **Full keyed run still outstanding.** EIA / BEA / FRED / USPTO / SEC could not be
   exercised end-to-end (no keys in this environment). Once `.env` is populated, re-run the
   harness — it will fetch those sources for real and the key-redaction scan will cover the
   query-param adapters (EIA/BEA/FRED) the same way it covered USPTO's header.
4. **GUI pass not done.** A human/operator should still open the Electron app once with real
   keys to confirm the visual dashboard chips and source-trail cards match these
   logic-level results (they share the same engine, so divergence would be a rendering bug).

## How to reproduce

```bash
# logic + live public-source verification (no keys needed):
npx tsx scripts/runtimeVerification.mts

# full keyed run:
cp .env.example .env && $EDITOR .env   # add real keys
npx tsx scripts/runtimeVerification.mts
npm run dev                            # then visually confirm the dashboards
```
