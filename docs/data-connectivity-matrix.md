# Connector Reality Matrix

<!-- GENERATED FILE — do not edit by hand.
     Source: src/engine/connectorRealityMatrix.ts (CONNECTOR_AUDIT_DEFINITIONS).
     Regenerate: npx tsx scripts/connectorRealityMatrix.mts -->

Generated 2026-06-29T20:37:46.141Z from the live connector registry.
Structural truth only — what each connector needs to run. Env-var NAMES only,
never values. "Online" is never claimed here; live status comes from the runtime
audit (`npx tsx scripts/runtimeVerification.mts`).

- Connectors: **48**
- no-key public: **33**
- no-key public (config-required): **4**
- key-gated: **8**
- configured-only: **2**
- deferred wiring: **1**
- not-wired: **0**

## Matrix

| Connector | Domain | Official owner | Cold-start status | Auth (secret key) | No-key mode | Configured URL | Required env | Cadence | Trust | Freshness window | Source trail / persistence | Decision | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| arXiv AI | AI research metadata | arXiv public API | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h (unresolved-by-design) | arXiv research source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| ECB Press RSS | central bank policy releases | European Central Bank press releases RSS | pending-first-fetch | no | yes | no | — | periodic | rss-public | 30h (unresolved-by-design) | ECB RSS source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| Federal Reserve Press RSS | central bank policy releases | Board of Governors of the Federal Reserve System press releases RSS | pending-first-fetch | no | yes | no | — | periodic | rss-public | 30h (unresolved-by-design) | Federal Reserve RSS source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| SEC EDGAR | company disclosure | U.S. Securities and Exchange Commission | missing-key | no | yes | no | ATLASZ_SEC_USER_AGENT | periodic | public-disclosure | 30h | SEC filing source trail — tables: sec_company_filings, world_intel_events, source_audit_log | no-key public (config-required) | Requires contact User-Agent: ATLASZ_SEC_USER_AGENT |
| SEC Press RSS | company disclosure and enforcement releases | U.S. Securities and Exchange Commission press releases RSS | pending-first-fetch | no | yes | no | — | periodic | rss-public | 30h (unresolved-by-design) | SEC press-release RSS source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| Public Crypto Realtime | crypto market data | CoinGecko public REST plus Coinbase/Binance public WebSocket market data | pending-first-fetch | no | yes | no | — | realtime | public-unauthenticated | 30h (unresolved-by-design) | Realtime widgets / sampled market tick source trail — tables: market_ticks_daily | no-key public | — |
| CISA Advisories | defensive security | CISA Cybersecurity Advisories RSS | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | CVE source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| CISA KEV | defensive security | CISA Known Exploited Vulnerabilities catalog | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | CVE source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| GitHub Advisories | defensive security | GitHub Security Advisory Database | pending-first-fetch | no | yes | no | — | periodic | public-unauthenticated | 30h | CVE source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| NVD CVEs | defensive security | NIST National Vulnerability Database | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | CVE source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| OSV.dev | defensive security | OSV.dev public API | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | CVE source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| Crossref | DOI metadata | Crossref REST API | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h (unresolved-by-design) | Crossref DOI metadata source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| EIA | energy and commodities | U.S. Energy Information Administration | missing-key | yes | no | no | ATLASZ_EIA_API_KEY | periodic | official-api | 30h | Energy source trail cards — tables: eia_energy_records, world_intel_events, source_audit_log | key-gated | Missing secret key: ATLASZ_EIA_API_KEY |
| EIA Public Bulk | energy and commodities | U.S. Energy Information Administration public bulk files | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | Energy source trail cards — tables: eia_energy_records, world_intel_events, source_audit_log | no-key public | — |
| EIA Nuclear Plants | energy facilities | EIA-860M filtered to nuclear | missing-key | yes | no | no | ATLASZ_EIA_API_KEY | periodic | official-api | 30h | Nuclear plant source trail — tables: world_intel_events, source_audit_log | key-gated | Missing secret key: ATLASZ_EIA_API_KEY |
| EIA Power Plants | energy facilities | EIA-860M operating generator capacity | missing-key | yes | no | no | ATLASZ_EIA_API_KEY | periodic | official-api | 30h | EIA facility source trail — tables: world_intel_events, source_audit_log | key-gated | Missing secret key: ATLASZ_EIA_API_KEY |
| EIA Refineries | energy facilities | EIA U.S. Energy Atlas Petroleum Refineries (EIA-820) | missing-key | no | yes | yes | ATLASZ_EIA_REFINERIES_URL | periodic | official-api | 30h | EIA refinery source trail — tables: world_intel_events, source_audit_log | configured-only | Requires official URL: ATLASZ_EIA_REFINERIES_URL |
| LNG Terminals | energy facilities | EIA Atlas / FERC LNG terminals | missing-key | no | yes | yes | ATLASZ_LNG_TERMINALS_URL | periodic | official-api | 30h | LNG terminal source trail — tables: world_intel_events, source_audit_log | configured-only | Requires official URL: ATLASZ_LNG_TERMINALS_URL |
| NRC Reactor Status | energy operations | NRC Power Reactor Status Report | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h (unresolved-by-design) | NRC reactor status source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| ETF Holdings | ETF basket exposure | Official issuer-published ETF holdings files | pending-first-fetch | no | yes | no | — | periodic | public-disclosure | 30h | ETF holdings source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| Treasury Fiscal Data | government finance | U.S. Treasury Fiscal Data | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | Fiscal source trail cards — tables: treasury_fiscal_records, world_intel_events, source_audit_log | no-key public | — |
| EIA Grid Regions | grid geography | EIA electricity/rto respondent facet | missing-key | yes | no | no | ATLASZ_EIA_API_KEY | periodic | official-api | 30h | Grid region source trail — tables: world_intel_events, source_audit_log | key-gated | Missing secret key: ATLASZ_EIA_API_KEY |
| SEC Form 4 | insider transactions | SEC Form 4 ownership filings | missing-key | no | yes | no | ATLASZ_SEC_USER_AGENT | periodic | public-disclosure | 30h | SEC Form 4 source trail — tables: world_intel_events, source_audit_log | no-key public (config-required) | Requires contact User-Agent: ATLASZ_SEC_USER_AGENT |
| SEC Form 13F | institutional holdings | SEC Form 13F-HR filings | missing-key | no | yes | no | ATLASZ_SEC_USER_AGENT | periodic | public-disclosure | 30h | SEC Form 13F source trail — tables: world_intel_events, source_audit_log | no-key public (config-required) | Requires contact User-Agent: ATLASZ_SEC_USER_AGENT |
| BLS | labor and prices | U.S. Bureau of Labor Statistics | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | Macro context cards — tables: world_intel_events, source_audit_log | no-key public | — |
| Congress.gov | legislative pipeline | Library of Congress / Congress.gov API | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | Congress bill/action source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| FRED | macro time series | Federal Reserve Bank of St. Louis FRED | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | Macro context cards — tables: fred_macro_observations, world_intel_events, source_audit_log | no-key public | — |
| WSJ Markets RSS | market headline observation | Dow Jones / WSJ public Markets RSS feed | pending-first-fetch | no | yes | no | — | periodic | rss-public | 30h (unresolved-by-design) | Public RSS headline source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| Market Reference Master | market identity | SEC company_tickers.json | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | Market identity source trail — tables: market_identity_master, world_intel_events, source_audit_log | no-key public | — |
| Equity/ETF Quotes | market price data | Alpaca Market Data (IEX) latest trades | missing-key | yes | no | no | ATLASZ_ALPACA_API_KEY, ATLASZ_ALPACA_SECRET_KEY | realtime | auth-gated | 30h (unresolved-by-design) | Market Quote source trail — no persistence | key-gated | Missing secret key: ATLASZ_ALPACA_API_KEY, ATLASZ_ALPACA_SECRET_KEY |
| USGS Minerals | materials | USGS Mineral Resources (MRDS default, optional USMIN) | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | USGS mineral site source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| GDELT (media) | media observation | GDELT Project DOC 2.0 API | pending-first-fetch | no | yes | no | — | periodic | media-observation | 30h (unresolved-by-design) | GDELT media-observation source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| BEA | national accounts | U.S. Bureau of Economic Analysis | missing-key | yes | no | no | ATLASZ_BEA_API_KEY | periodic | official-api | 30h | BEA macro context cards — tables: bea_observations, world_intel_events, source_audit_log | key-gated | Missing secret key: ATLASZ_BEA_API_KEY |
| GitHub Releases | open-source activity | GitHub REST Releases API | pending-first-fetch | no | yes | no | — | periodic | public-unauthenticated | 30h | Timeline/source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| GitHub Public Repository Search | open-source repository metadata | GitHub REST Search API | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h (unresolved-by-design) | GitHub public repository source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| Options chain / open interest | options market data | Alpaca Market Data options snapshots | deferred | yes | no | no | ATLASZ_ALPACA_API_KEY, ATLASZ_ALPACA_SECRET_KEY, ATLASZ_OPTIONS_UNDERLYINGS | realtime | auth-gated | 30h (unresolved-by-design) | Options source trail — no persistence | deferred wiring | Missing secret key: ATLASZ_ALPACA_API_KEY, ATLASZ_ALPACA_SECRET_KEY |
| USPTO PatentsView | patent intelligence | USPTO PatentsView API | missing-key | yes | no | no | ATLASZ_PATENTSVIEW_API_KEY | periodic | official-api | 30h | Patent source trail — tables: world_intel_events, source_audit_log | key-gated | Missing secret key: ATLASZ_PATENTSVIEW_API_KEY |
| World Port Index | physical ports | NGA World Port Index (Pub 150) | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h (unresolved-by-design) | World Port Index source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| USGS Earthquakes | physical-world events | USGS Earthquake Hazards Program | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | Timeline/event source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| Federal Register | regulatory documents | Office of the Federal Register / FederalRegister.gov API | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | Regulatory document source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| SEC Company Facts | reported fundamentals | SEC companyfacts XBRL API | missing-key | no | yes | no | ATLASZ_SEC_USER_AGENT | periodic | public-disclosure | 30h | SEC Company Facts source trail — tables: world_intel_events, source_audit_log | no-key public (config-required) | Requires contact User-Agent: ATLASZ_SEC_USER_AGENT |
| OpenAlex | research metadata | OpenAlex Works API | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h (unresolved-by-design) | OpenAlex research source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| OFAC SDN | sanctions enforcement | U.S. Treasury OFAC Sanctions List Service | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | OFAC sanctions source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| NASA News RSS | space and science releases | NASA news-release RSS | pending-first-fetch | no | yes | no | — | periodic | rss-public | 30h (unresolved-by-design) | NASA RSS source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| Launch Library 2 | space launch schedule | The Space Devs Launch Library 2 public API | pending-first-fetch | no | yes | no | — | periodic | public-unauthenticated | 30h (unresolved-by-design) | Launch Library source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| UN Comtrade | trade flows | United Nations Comtrade | missing-key | yes | no | no | ATLASZ_UN_COMTRADE_API_KEY | periodic | official-api | 30h (unresolved-by-design) | UN Comtrade trade-flow source trail — tables: world_intel_events, source_audit_log | key-gated | Missing secret key: ATLASZ_UN_COMTRADE_API_KEY |
| UN/LOCODE | trade/logistics location codes | UNECE UN/LOCODE code list | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h (unresolved-by-design) | Port / UN/LOCODE source trail — tables: world_intel_events, source_audit_log | no-key public | — |
| NOAA/NWS Alerts | weather disruption | National Weather Service alerts API | pending-first-fetch | no | yes | no | — | periodic | official-api | 30h | NOAA weather source trail — tables: world_intel_events, source_audit_log | no-key public | — |

## Locked connectors — blocker and no-key options

Each row below cannot complete a first fetch until its blocker is resolved.
A same-domain no-key sibling means partial coverage already exists without a key.

| Connector | Decision | Blocker | Official docs | Same-domain no-key sibling |
| --- | --- | --- | --- | --- |
| EIA (`eia`) | key-gated | Missing secret key: ATLASZ_EIA_API_KEY | https://www.eia.gov/opendata/ | eia-bulk-public |
| EIA Nuclear Plants (`eia-nuclear`) | key-gated | Missing secret key: ATLASZ_EIA_API_KEY | https://www.eia.gov/electricity/data/eia860m/ | — (none) |
| EIA Power Plants (`eia-power-plants`) | key-gated | Missing secret key: ATLASZ_EIA_API_KEY | https://www.eia.gov/electricity/data/eia860m/ | — (none) |
| EIA Refineries (`eia-refineries`) | configured-only | Requires official URL: ATLASZ_EIA_REFINERIES_URL | https://atlas.eia.gov/datasets/petroleum-refineries | — (none) |
| LNG Terminals (`lng-terminals`) | configured-only | Requires official URL: ATLASZ_LNG_TERMINALS_URL | https://atlas.eia.gov/datasets/liquefied-natural-gas-lng-import-and-export-terminals | — (none) |
| EIA Grid Regions (`eia-balancing-authorities`) | key-gated | Missing secret key: ATLASZ_EIA_API_KEY | https://www.eia.gov/opendata/browser/electricity/rto/region-data | — (none) |
| Equity/ETF Quotes (`equities-prices`) | key-gated | Missing secret key: ATLASZ_ALPACA_API_KEY, ATLASZ_ALPACA_SECRET_KEY | https://alpaca.markets/data | — (none) |
| BEA (`bea`) | key-gated | Missing secret key: ATLASZ_BEA_API_KEY | https://www.bea.gov/resources/for-developers | — (none) |
| USPTO PatentsView (`uspto`) | key-gated | Missing secret key: ATLASZ_PATENTSVIEW_API_KEY | https://developer.uspto.gov/api-catalog | — (none) |
| UN Comtrade (`un-comtrade`) | key-gated | Missing secret key: ATLASZ_UN_COMTRADE_API_KEY | https://comtradeplus.un.org/ | — (none) |

## How to read "Decision"

- **no-key public** — runs with no key and no extra config.
- **no-key public (config-required)** — no secret key, but needs a contact User-Agent or an allowlist/config value.
- **key-gated** — requires a secret API key (named in Required env). Fails closed until configured.
- **configured-only** — requires an official source URL to be pinned (named in Required env). No stale default.
- **deferred wiring** — built and tested, live runtime wiring intentionally deferred.
- **not-wired** — no runtime adapter yet.
