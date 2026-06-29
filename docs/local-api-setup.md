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
| `ATLASZ_FRED_API_KEY` | FRED REST metadata upgrade | <https://fred.stlouisfed.org/docs/api/api_key.html> | optional quota/API key | public FRED CSV mode | online or honest failure |
| `ATLASZ_BEA_API_KEY` | BEA national accounts | <https://apps.bea.gov/API/signup/> | free public key | `missing-key` | online or honest failure |
| `ATLASZ_EIA_API_KEY` | EIA energy, power plants, nuclear, grid/BAs | <https://www.eia.gov/opendata/register.php> | free public key | `missing-key` | online or honest failure |
| `ATLASZ_PATENTSVIEW_API_KEY` | USPTO PatentsView | <https://patentsview.org/apis> | free public key | `missing-key` | online or honest failure |
| `ATLASZ_OPENALEX_API_KEY` | OpenAlex works higher quota | <https://openalex.org> | optional quota key | public no-key mode | online or honest failure |
| `ATLASZ_CONGRESS_API_KEY` | Congress.gov bill actions higher quota | <https://api.congress.gov/sign-up/> | optional quota key | public `DEMO_KEY` mode | online or honest failure |
| `ATLASZ_UN_COMTRADE_API_KEY` | UN Comtrade trade flows | <https://comtradeplus.un.org/> | key-gated | `missing-key` | online or honest failure |
| `ATLASZ_ALPACA_API_KEY` + `ATLASZ_ALPACA_SECRET_KEY` | Equity/ETF quotes | <https://alpaca.markets/data> | key-gated | `PRICE_UNAVAILABLE` / `missing-key` | online or honest auth/rate failure |
| `ATLASZ_OPTIONS_UNDERLYINGS` | Options chain scope | <https://alpaca.markets/options> | local allowlist | deferred / missing scope | configured scope |
| `ATLASZ_CROSSREF_MAILTO` | Crossref polite pool | <https://www.crossref.org/documentation/retrieve-metadata/rest-api/tips-for-using-the-crossref-rest-api/> | optional contact | public pool | polite pool; stripped from trails |

EIA public bulk reference runs without an API key through `eia-bulk-public`.
It is a bounded official ZIP/manifest subset only; it does not unlock the
authenticated EIA API, power-plant, nuclear, grid, refinery, or LNG connectors.

## Configured Official URLs

| Env var | Connector unlocked | Accepted hosts | Before config | After config |
| --- | --- | --- | --- | --- |
| `ATLASZ_LNG_TERMINALS_URL` | LNG terminal facilities | `eia.gov`, `ferc.gov`, `energy.gov`, or confirmed EIA ArcGIS LNG service | configured-only URL missing | online or honest failure |
| `ATLASZ_UNLOCODE_URL` | UN/LOCODE registry override | `unece.org` or official UNECE/UNICC package path | public UNECE/UNICC package mode | online or honest failure |
| `ATLASZ_USGS_USMIN_URL` | USGS USMIN minerals override/add-on | `usgs.gov` | MRDS legacy-reference mode | online or honest failure |
| `ATLASZ_USGS_MRDS_URL` | USGS MRDS minerals override | `usgs.gov` | default MRDS CSV used | online or honest failure |
| `ATLASZ_WPI_URL` | World Port Index override | `nga.mil` | default NGA route used | override accepted |
| `ATLASZ_EIA_REFINERIES_URL` | EIA refinery source URL | `eia.gov` or ArcGIS refinery FeatureServer | configured-only URL missing | online or honest endpoint failure |

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
