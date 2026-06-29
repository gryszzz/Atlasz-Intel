# Connector Super-Hardening Audit

Generated 2026-06-29T20:37:46.794Z from the live connector registry (CONNECTOR_AUDIT_DEFINITIONS).
Metadata-based hardening score (catalog attributes), not a line-by-line code audit. No secrets printed.

- Connectors: **48**
- Average hardening score: **100/100**
- Fully hardened (no catalog gaps): **47**
- With gaps: **1**

## Coverage table

| Connector | Domain | Cadence | Trust | Key | Source trail | Persistence | Resolver/Exposure | Score | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| arXiv AI | AI research metadata | periodic | official-api | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| ECB Press RSS | central bank policy releases | periodic | rss-public | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| Federal Reserve Press RSS | central bank policy releases | periodic | rss-public | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| SEC EDGAR | company disclosure | periodic | public-disclosure | yes | yes | yes | yes/curated-reference | 100 | None — fully hardened per catalog attributes. |
| SEC Press RSS | company disclosure and enforcement releases | periodic | rss-public | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| Public Crypto Realtime | crypto market data | realtime | public-unauthenticated | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| CISA Advisories | defensive security | periodic | official-api | no | yes | yes | partial/identifier-only | 100 | None — fully hardened per catalog attributes. |
| CISA KEV | defensive security | periodic | official-api | no | yes | yes | partial/identifier-only | 100 | None — fully hardened per catalog attributes. |
| GitHub Advisories | defensive security | periodic | public-unauthenticated | no | yes | yes | partial/identifier-only | 100 | None — fully hardened per catalog attributes. |
| NVD CVEs | defensive security | periodic | official-api | no | yes | yes | partial/identifier-only | 100 | None — fully hardened per catalog attributes. |
| OSV.dev | defensive security | periodic | official-api | no | yes | yes | partial/identifier-only | 100 | None — fully hardened per catalog attributes. |
| Crossref | DOI metadata | periodic | official-api | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| EIA | energy and commodities | periodic | official-api | yes | yes | yes | yes/curated-reference | 100 | None — fully hardened per catalog attributes. |
| EIA Public Bulk | energy and commodities | periodic | official-api | no | yes | yes | yes/curated-reference | 100 | None — fully hardened per catalog attributes. |
| EIA Nuclear Plants | energy facilities | periodic | official-api | yes | yes | yes | partial/curated-reference | 100 | None — fully hardened per catalog attributes. |
| EIA Power Plants | energy facilities | periodic | official-api | yes | yes | yes | partial/curated-reference | 100 | None — fully hardened per catalog attributes. |
| EIA Refineries | energy facilities | periodic | official-api | yes | yes | yes | partial/curated-reference | 100 | None — fully hardened per catalog attributes. |
| LNG Terminals | energy facilities | periodic | official-api | yes | yes | yes | partial/curated-reference | 100 | None — fully hardened per catalog attributes. |
| NRC Reactor Status | energy operations | periodic | official-api | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| ETF Holdings | ETF basket exposure | periodic | public-disclosure | no | yes | yes | partial/curated-reference | 100 | None — fully hardened per catalog attributes. |
| Treasury Fiscal Data | government finance | periodic | official-api | no | yes | yes | partial/identifier-only | 100 | None — fully hardened per catalog attributes. |
| EIA Grid Regions | grid geography | periodic | official-api | yes | yes | yes | partial/curated-reference | 100 | None — fully hardened per catalog attributes. |
| SEC Form 4 | insider transactions | periodic | public-disclosure | yes | yes | yes | yes/curated-reference | 100 | None — fully hardened per catalog attributes. |
| SEC Form 13F | institutional holdings | periodic | public-disclosure | yes | yes | yes | partial/curated-reference | 100 | None — fully hardened per catalog attributes. |
| BLS | labor and prices | periodic | official-api | no | yes | yes | partial/identifier-only | 100 | None — fully hardened per catalog attributes. |
| Congress.gov | legislative pipeline | periodic | official-api | no | yes | yes | identifier-only/future | 100 | None — fully hardened per catalog attributes. |
| FRED | macro time series | periodic | official-api | no | yes | yes | partial/identifier-only | 100 | None — fully hardened per catalog attributes. |
| WSJ Markets RSS | market headline observation | periodic | rss-public | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| Market Reference Master | market identity | periodic | official-api | no | yes | yes | yes/curated-reference | 100 | None — fully hardened per catalog attributes. |
| Equity/ETF Quotes | market price data | realtime | auth-gated | yes | yes | n/a (realtime) | no/none | 100 | None — fully hardened per catalog attributes. |
| USGS Minerals | materials | periodic | official-api | no | yes | yes | partial/curated-reference | 100 | None — fully hardened per catalog attributes. |
| GDELT (media) | media observation | periodic | media-observation | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| BEA | national accounts | periodic | official-api | yes | yes | yes | partial/identifier-only | 100 | None — fully hardened per catalog attributes. |
| GitHub Releases | open-source activity | periodic | public-unauthenticated | no | yes | yes | yes/curated-reference | 100 | None — fully hardened per catalog attributes. |
| GitHub Public Repository Search | open-source repository metadata | periodic | official-api | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| Options chain / open interest | options market data | realtime | auth-gated | yes | yes | n/a (realtime) | no/none | 90 | Wire the live fetch -> renderer store when prioritized. |
| USPTO PatentsView | patent intelligence | periodic | official-api | yes | yes | yes | yes/curated-reference | 100 | None — fully hardened per catalog attributes. |
| World Port Index | physical ports | periodic | official-api | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| USGS Earthquakes | physical-world events | periodic | official-api | no | yes | yes | partial/future | 100 | None — fully hardened per catalog attributes. |
| Federal Register | regulatory documents | periodic | official-api | no | yes | yes | partial/future | 100 | None — fully hardened per catalog attributes. |
| SEC Company Facts | reported fundamentals | periodic | public-disclosure | yes | yes | yes | yes/curated-reference | 100 | None — fully hardened per catalog attributes. |
| OpenAlex | research metadata | periodic | official-api | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| OFAC SDN | sanctions enforcement | periodic | official-api | no | yes | yes | identifier-only/future | 100 | None — fully hardened per catalog attributes. |
| NASA News RSS | space and science releases | periodic | rss-public | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| Launch Library 2 | space launch schedule | periodic | public-unauthenticated | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| UN Comtrade | trade flows | periodic | official-api | yes | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| UN/LOCODE | trade/logistics location codes | periodic | official-api | no | yes | yes | no/none | 100 | None — fully hardened per catalog attributes. |
| NOAA/NWS Alerts | weather disruption | periodic | official-api | no | yes | yes | partial/future | 100 | None — fully hardened per catalog attributes. |

## Weakest connectors (lowest score first)

### Options chain / open interest — 90/100
- Source: Alpaca Market Data options snapshots (https://alpaca.markets/options)
- Key required: ATLASZ_ALPACA_API_KEY, ATLASZ_ALPACA_SECRET_KEY, ATLASZ_OPTIONS_UNDERLYINGS
- Gaps: Live runtime wiring deferred (built + tested, not yet flowing).
- Next action: Wire the live fetch -> renderer store when prioritized.

### arXiv AI — 100/100
- Source: arXiv public API (https://export.arxiv.org/api/query)
- Key required: no
- Gaps: none
- Next action: None — fully hardened per catalog attributes.

### BEA — 100/100
- Source: U.S. Bureau of Economic Analysis (https://www.bea.gov/resources/for-developers)
- Key required: ATLASZ_BEA_API_KEY
- Gaps: none
- Next action: None — fully hardened per catalog attributes.

### BLS — 100/100
- Source: U.S. Bureau of Labor Statistics (https://www.bls.gov/developers/)
- Key required: no
- Gaps: none
- Next action: None — fully hardened per catalog attributes.

### CISA Advisories — 100/100
- Source: CISA Cybersecurity Advisories RSS (https://www.cisa.gov/news-events/cybersecurity-advisories)
- Key required: no
- Gaps: none
- Next action: None — fully hardened per catalog attributes.

