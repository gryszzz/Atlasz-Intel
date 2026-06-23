# Runtime Verification Log

**Generated:** 2026-06-23T20:24:37.499Z
**Command:** `npx tsx scripts/runtimeVerification.mts`
**Result:** 13/13 checks passed
**Persistence:** node:sqlite (with JSON fallback)

> Operator pass. Drives the real adapter/registry/audit code: public connectors are
> exercised live, keyed connectors without keys report `missing-key`, keyed
> connectors with keys do a real fetch. No secrets are printed; key values are read
> only for the redaction scan. Fail-closed on provider errors.

## Env keys (names only)

- **present:** (none)
- **missing:** ATLASZ_BEA_API_KEY, ATLASZ_CONGRESS_API_KEY, ATLASZ_EIA_API_KEY, ATLASZ_FRED_API_KEY, ATLASZ_OPENALEX_API_KEY, ATLASZ_PATENTSVIEW_API_KEY, ATLASZ_SEC_USER_AGENT, ATLASZ_UN_COMTRADE_API_KEY

## Connector truth table

| connector | impl | gating | env required | key? | status | recs | persist | trail | redact | resolver | expose |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gdelt-doc | impl | public | - | public | failed | 0 | n/a | n/a | n/a | no | no |
| sec-edgar | impl | key-gated | ATLASZ_SEC_USER_AGENT | no | missing-key | 0 | n/a | n/a | n/a | yes | yes |
| market-reference-master | impl | public | - | public | online | 8021 | yes | yes | n/a | yes | yes |
| fred | impl | key-gated | ATLASZ_FRED_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | partial | yes |
| treasury-fiscal | impl | public | - | public | online | 3 | yes | yes | n/a | partial | yes |
| bls | impl | public | - | public | online | 5 | yes | yes | n/a | partial | yes |
| bea | impl | key-gated | ATLASZ_BEA_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | partial | yes |
| eia | impl | key-gated | ATLASZ_EIA_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | yes | yes |
| noaa-alerts | impl | public | - | public | online | 30 | yes | yes | n/a | partial | yes |
| federal-register | impl | public | - | public | online | 25 | yes | yes | n/a | partial | yes |
| ofac-sdn | impl | public | - | public | online | 40 | yes | yes | n/a | identifier-only | yes |
| congress-gov | impl | key-gated | ATLASZ_CONGRESS_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | identifier-only | yes |
| usgs-earthquakes | impl | public | - | public | online | 14 | yes | yes | n/a | partial | yes |
| un-comtrade | impl | key-gated | ATLASZ_UN_COMTRADE_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | no | no |
| openalex-works | impl | key-gated | ATLASZ_OPENALEX_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | no | no |
| crossref-works | impl | public | - | public | online | 23 | yes | yes | n/a | no | no |
| uspto | impl | key-gated | ATLASZ_PATENTSVIEW_API_KEY | no | missing-key | 0 | n/a | n/a | n/a | yes | yes |
| github-releases | impl | public | - | public | online | 15 | yes | yes | n/a | yes | yes |
| cisa-kev | impl | public | - | public | online | 25 | yes | yes | n/a | partial | yes |
| nvd | impl | public | - | public | online | 25 | yes | yes | n/a | partial | yes |
| ghsa | impl | public | - | public | online | 30 | yes | yes | n/a | partial | yes |
| osv | impl | public | - | public | online | 34 | yes | yes | n/a | partial | yes |
| cisa-advisories | impl | public | - | public | online | 23 | yes | yes | n/a | partial | yes |

## Trust tiers

| tier | count | connectors |
|---|---|---|
| media-observation | 1 | gdelt-doc |
| public-disclosure | 1 | sec-edgar |
| official-api | 19 | market-reference-master, fred, treasury-fiscal, bls, bea, eia, noaa-alerts, federal-register, ofac-sdn, congress-gov, usgs-earthquakes, un-comtrade, openalex-works, crossref-works, uspto, cisa-kev, nvd, osv, cisa-advisories |
| public-unauthenticated | 2 | github-releases, ghsa |

## Failures

_None — all checks passed._

## Next required keys (to exercise keyed connectors live)

- `ATLASZ_BEA_API_KEY`
- `ATLASZ_CONGRESS_API_KEY`
- `ATLASZ_EIA_API_KEY`
- `ATLASZ_FRED_API_KEY`
- `ATLASZ_OPENALEX_API_KEY`
- `ATLASZ_PATENTSVIEW_API_KEY`
- `ATLASZ_SEC_USER_AGENT`
- `ATLASZ_UN_COMTRADE_API_KEY`

## Reproduce

```bash
npx tsx scripts/runtimeVerification.mts
```
