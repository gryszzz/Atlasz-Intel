# Runtime Verification Log

**Generated:** 2026-06-29T00:42:24.837Z
**Command:** `npx tsx scripts/runtimeVerification.mts`
**Result:** 13/13 checks passed
**Persistence:** node:sqlite (with JSON fallback)

> Operator pass. Drives the real adapter/registry/audit code: public connectors are
> exercised live, keyed connectors without keys report `missing-key`, keyed
> connectors with keys do a real fetch. No secrets are printed; key values are read
> only for the redaction scan. Fail-closed on provider errors.

## Env keys (names only)

- **present:** ATLASZ_SEC_USER_AGENT
- **missing:** ATLASZ_ALPACA_API_KEY, ATLASZ_ALPACA_SECRET_KEY, ATLASZ_BEA_API_KEY, ATLASZ_EIA_API_KEY, ATLASZ_EIA_REFINERIES_URL, ATLASZ_LNG_TERMINALS_URL, ATLASZ_OPTIONS_UNDERLYINGS, ATLASZ_PATENTSVIEW_API_KEY, ATLASZ_UN_COMTRADE_API_KEY

## Connector truth table

| connector | impl | gating | env required | key? | status | recs | persist | trail | redact | resolver | expose |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gdelt-doc | impl | public | - | public | rate-limited | 0 | n/a | n/a | n/a | no | no |
| wsj-markets-rss | impl | public | - | public | online | 20 | yes | yes | n/a | no | no |
| sec-edgar | impl | key-gated | ATLASZ_SEC_USER_AGENT | yes | online | 6 | yes | yes | yes | yes | yes |
| sec-press-rss | impl | public | - | public | online | 25 | yes | yes | n/a | no | no |
| market-reference-master | impl | public | - | public | online | 8021 | yes | yes | n/a | yes | yes |
| sec-company-facts | impl | key-gated | ATLASZ_SEC_USER_AGENT | yes | online | 72 | yes | yes | yes | yes | yes |
| sec-form4 | impl | key-gated | ATLASZ_SEC_USER_AGENT | yes | online | 149 | yes | yes | yes | yes | yes |
| sec-form13f | impl | key-gated | ATLASZ_SEC_USER_AGENT | yes | online | 400 | yes | yes | yes | partial | yes |
| etf-holdings | impl | public | - | public | online | 266 | yes | yes | n/a | partial | yes |
| fred | impl | public | - | public | online | 6 | yes | yes | n/a | partial | yes |
| treasury-fiscal | impl | public | - | public | failed | 0 | n/a | n/a | n/a | partial | yes |
| bls | impl | public | - | public | online | 5 | yes | yes | n/a | partial | yes |
| fed-press-rss | impl | public | - | public | online | 20 | yes | yes | n/a | no | no |
| ecb-press-rss | impl | public | - | public | online | 15 | yes | yes | n/a | no | no |
| bea | impl | key-gated | ATLASZ_BEA_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | partial | yes |
| eia | impl | key-gated | ATLASZ_EIA_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | yes | yes |
| eia-bulk-public | impl | public | - | public | online | 4 | yes | yes | n/a | yes | yes |
| noaa-alerts | impl | public | - | public | online | 30 | yes | yes | n/a | partial | yes |
| federal-register | impl | public | - | public | online | 25 | yes | yes | n/a | partial | yes |
| ofac-sdn | impl | public | - | public | failed | 0 | n/a | n/a | n/a | identifier-only | yes |
| congress-gov | impl | public | - | public | online | 20 | yes | yes | n/a | identifier-only | yes |
| usgs-earthquakes | impl | public | - | public | online | 19 | yes | yes | n/a | partial | yes |
| un-comtrade | impl | key-gated | ATLASZ_UN_COMTRADE_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | no | no |
| openalex-works | impl | public | - | public | failed | 0 | n/a | n/a | n/a | no | no |
| crossref-works | impl | public | - | public | online | 22 | yes | yes | n/a | no | no |
| uspto | impl | key-gated | ATLASZ_PATENTSVIEW_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | yes | yes |
| github-releases | impl | public | - | public | online | 15 | yes | yes | n/a | yes | yes |
| arxiv-ai | impl | public | - | public | online | 20 | yes | yes | n/a | no | no |
| github-high-signal-repos | impl | public | - | public | online | 15 | yes | yes | n/a | no | no |
| nasa-news | impl | public | - | public | online | 10 | yes | yes | n/a | no | no |
| space-launch-library | impl | public | - | public | online | 15 | yes | yes | n/a | no | no |
| cisa-kev | impl | public | - | public | online | 25 | yes | yes | n/a | partial | yes |
| nvd | impl | public | - | public | online | 25 | yes | yes | n/a | partial | yes |
| ghsa | impl | public | - | public | online | 30 | yes | yes | n/a | partial | yes |
| osv | impl | public | - | public | online | 34 | yes | yes | n/a | partial | yes |
| cisa-advisories | impl | public | - | public | online | 24 | yes | yes | n/a | partial | yes |
| eia-power-plants | impl | key-gated | ATLASZ_EIA_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | partial | yes |
| eia-refineries | impl | key-gated | ATLASZ_EIA_REFINERIES_URL | no | missing-key | 0 | n/a | n/a | n/a | partial | yes |
| lng-terminals | impl | key-gated | ATLASZ_LNG_TERMINALS_URL | no | missing-key | 0 | n/a | n/a | n/a | partial | yes |
| eia-nuclear | impl | key-gated | ATLASZ_EIA_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | partial | yes |
| nrc-reactor-status | impl | public | - | public | online | 95 | yes | yes | n/a | no | no |
| eia-balancing-authorities | impl | key-gated | ATLASZ_EIA_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | partial | yes |
| un-locode | impl | public | - | public | online | 157 | yes | yes | n/a | no | no |
| world-port-index | impl | public | - | public | online | 800 | yes | yes | n/a | no | no |
| usgs-minerals | impl | public | - | public | online | 600 | yes | yes | n/a | partial | yes |
| crypto-public-realtime | impl | public | - | public | managed-ingest | 0 | n/a | n/a | n/a | no | no |
| equities-prices | impl | key-gated | ATLASZ_ALPACA_API_KEY,ATLASZ_ALPACA_SECRET_KEY | no | missing-key | 0 | n/a | n/a | n/a | no | no |
| options-oi | impl | key-gated | ATLASZ_ALPACA_API_KEY,ATLASZ_ALPACA_SECRET_KEY,ATLASZ_OPTIONS_UNDERLYINGS | no | missing-key | 0 | n/a | n/a | n/a | no | no |

## Trust tiers

| tier | count | connectors |
|---|---|---|
| media-observation | 1 | gdelt-doc |
| rss-public | 5 | wsj-markets-rss, sec-press-rss, fed-press-rss, ecb-press-rss, nasa-news |
| public-disclosure | 5 | sec-edgar, sec-company-facts, sec-form4, sec-form13f, etf-holdings |
| official-api | 31 | market-reference-master, fred, treasury-fiscal, bls, bea, eia, eia-bulk-public, noaa-alerts, federal-register, ofac-sdn, congress-gov, usgs-earthquakes, un-comtrade, openalex-works, crossref-works, uspto, arxiv-ai, github-high-signal-repos, cisa-kev, nvd, osv, cisa-advisories, eia-power-plants, eia-refineries, lng-terminals, eia-nuclear, nrc-reactor-status, eia-balancing-authorities, un-locode, world-port-index, usgs-minerals |
| public-unauthenticated | 4 | github-releases, space-launch-library, ghsa, crypto-public-realtime |
| auth-gated | 2 | equities-prices, options-oi |

## Failures

_None — all checks passed._

## Next required keys (to exercise keyed connectors live)

- `ATLASZ_ALPACA_API_KEY`
- `ATLASZ_ALPACA_SECRET_KEY`
- `ATLASZ_BEA_API_KEY`
- `ATLASZ_EIA_API_KEY`
- `ATLASZ_EIA_REFINERIES_URL`
- `ATLASZ_LNG_TERMINALS_URL`
- `ATLASZ_OPTIONS_UNDERLYINGS`
- `ATLASZ_PATENTSVIEW_API_KEY`
- `ATLASZ_UN_COMTRADE_API_KEY`

## Reproduce

```bash
npx tsx scripts/runtimeVerification.mts
```
