# Local API Setup

Keys belong only in local `.env`. Do not paste keys into chat and do not commit
`.env`.

```bash
cp .env.example .env
# Fill values locally.
npx tsx scripts/checkRuntimeConfig.mts
```

The checker prints env-name presence only. It never prints secret values.

## Activation Matrix

| Env var | Connector unlocked | Source / signup | Type | Before key | After key |
| --- | --- | --- | --- | --- | --- |
| `ATLASZ_SEC_USER_AGENT` | SEC EDGAR, Company Facts, Form 4, Form 13F | <https://www.sec.gov/os/accessing-edgar-data> | contact User-Agent | `missing-key` / fail closed | online or honest SEC failure |
| `ATLASZ_FRED_API_KEY` | FRED macro series | <https://fred.stlouisfed.org/docs/api/api_key.html> | free public key | `missing-key` | online or honest failure |
| `ATLASZ_BEA_API_KEY` | BEA national accounts | <https://apps.bea.gov/API/signup/> | free public key | `missing-key` | online or honest failure |
| `ATLASZ_EIA_API_KEY` | EIA energy, power plants, nuclear, grid/BAs | <https://www.eia.gov/opendata/register.php> | free public key | `missing-key` | online or honest failure |
| `ATLASZ_PATENTSVIEW_API_KEY` | USPTO PatentsView | <https://patentsview.org/apis> | free public key | `missing-key` | online or honest failure |
| `ATLASZ_OPENALEX_API_KEY` | OpenAlex works | <https://openalex.org> | free public key | `missing-key` | online or honest failure |
| `ATLASZ_CONGRESS_API_KEY` | Congress.gov bill actions | <https://api.congress.gov/sign-up/> | free public key | `missing-key` | online or honest failure |
| `ATLASZ_UN_COMTRADE_API_KEY` | UN Comtrade trade flows | <https://comtradeplus.un.org/> | key-gated | `missing-key` | online or honest failure |
| `ATLASZ_ALPACA_API_KEY` + `ATLASZ_ALPACA_SECRET_KEY` | Equity/ETF quotes | <https://alpaca.markets/data> | key-gated | `PRICE_UNAVAILABLE` / `missing-key` | online or honest auth/rate failure |
| `ATLASZ_OPTIONS_UNDERLYINGS` | Options chain scope | <https://alpaca.markets/options> | local allowlist | deferred / missing scope | configured scope |
| `ATLASZ_CROSSREF_MAILTO` | Crossref polite pool | <https://www.crossref.org/documentation/retrieve-metadata/rest-api/tips-for-using-the-crossref-rest-api/> | optional contact | public pool | polite pool; stripped from trails |

## Configured Official URLs

| Env var | Connector unlocked | Accepted hosts | Before config | After config |
| --- | --- | --- | --- | --- |
| `ATLASZ_LNG_TERMINALS_URL` | LNG terminal facilities | `eia.gov`, `ferc.gov`, `energy.gov`, or confirmed EIA ArcGIS LNG service | configured-only URL missing | online or honest failure |
| `ATLASZ_UNLOCODE_URL` | UN/LOCODE registry | `unece.org` | configured-only URL missing | online or honest failure |
| `ATLASZ_USGS_USMIN_URL` | USGS USMIN minerals | `usgs.gov` | configured-only URL missing | online or honest failure |
| `ATLASZ_USGS_MRDS_URL` | USGS MRDS minerals | `usgs.gov` | optional companion missing | online or honest failure |
| `ATLASZ_WPI_URL` | World Port Index override | `nga.mil` | default NGA route used | override accepted |
| `ATLASZ_EIA_REFINERIES_URL` | EIA refinery override | `eia.gov` or ArcGIS refinery FeatureServer | default EIA route used | override accepted |

## First Run

```bash
npm run lint
npm run build
npm test
git diff --check
npx tsx scripts/checkRuntimeConfig.mts
npx tsx scripts/runtimeVerification.mts
npm run dev
```

Expected:
- key-gated connectors move from `missing-key` to online or honest failure
- no key value appears in output
- persisted JSON contains no secrets
- source trails render proof-backed records only
- no configured connector silently uses fake data
