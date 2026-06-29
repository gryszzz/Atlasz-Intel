# Atlasz Intelligence Source Atlas

Atlasz should become a cross-domain intelligence terminal, not a single-slice
market dashboard. This atlas defines the backbone domains and the source policy
for each one.

The source catalog contract lives in `src/intelligenceSourceCatalog.ts`.
The OPSEC assessment contract lives in `src/intelligenceOpsec.ts`.

## Source Policy

Every source is classified before it can influence runtime behavior:

- `runtime-wired`: already connected.
- `candidate-public-adapter`: safe public/official candidate, but not claimed
  live until an adapter exists and passes health checks.
- `auth-gated-adapter`: useful source that requires a key, token, endpoint, or
  operator config.
- `commercial-gated`: commercial/API terms gate; never scrape or bypass.
- `local-service`: local-only service such as Ollama.
- `reference-only`: useful for research or manual source trails, not runtime.
- `blocked`: incompatible with Atlasz default safety posture.

## Runtime Status Snapshot

This snapshot separates the app runtime from the broader source/corpus map. A
runtime connector has an adapter/provider path, source health behavior, tests,
and evidence-bearing persistence/UI wiring. A reference source is not live just
because it is listed here.

### Runtime-Wired

| Layer | Provider/source | Evidence path |
| --- | --- | --- |
| Markets | Yahoo public chart, CoinGecko, public crypto websocket paths | Public unauthenticated/delayed/stale source labels; no broker or advice behavior. |
| Market identity | SEC company_tickers.json | Official SEC reference -> ticker/CIK/legal title -> `market_identity_master` -> source trail -> evidence graph. No fake exchange, sector, industry, or ETF weights. |
| ETF holdings | iShares/BlackRock + State Street/SPDR issuer holdings files | Official issuer holdings file -> as-of date -> constituent rows -> source trail -> evidence graph. Weights/shares/market value only when source-provided; dated snapshot, not current-position guarantee or recommendation. |
| World events | GDELT and configured RSS/public official feeds | `WorldIntelEvent` records, source trails, freshness, confidence, provenance. |
| Government fiscal | Treasury Fiscal Data, Debt to the Penny | Official API -> fiscal record -> source trail -> macro/fiscal card -> graph. |
| Labor/economic | BLS Public Data API | Official API -> BLS observation -> source trail -> macro-series graph node. |
| Energy/commodities | EIA first energy allowlist | Official API -> energy record -> source trail -> commodity/energy graph node. |
| Energy/commodities | EIA public bulk reference | Official no-key bulk ZIP/manifest -> bounded allowlisted energy record -> source trail -> commodity graph node. Not full EIA API coverage. |
| Weather/natural events | NOAA/NWS active alerts, USGS earthquakes | Official APIs -> weather/quake event -> source trail -> timeline/evidence graph; unresolved exposure remains explicit. |
| Cyber/vulnerability | CISA KEV, NVD, GHSA, OSV, CISA advisories | Defensive advisory/vulnerability records -> evidence graph/dossier/source trails. |
| OSS technology | GitHub Releases | Official GitHub release metadata -> OSS technology timeline/source trail. |
| Research metadata | OpenAlex Works API, Crossref REST API | Official APIs -> research work / DOI metadata -> institution/topic/venue/publisher/funder graph nodes -> source trail; metadata only. |

### Config-Required Runtime

| Layer | Provider/source | Required config | Default unavailable state |
| --- | --- | --- | --- |
| Company disclosure | SEC EDGAR company submissions | `ATLASZ_SEC_USER_AGENT` | `missing-config`; no simulated filings. |
| Institutional holdings | SEC Form 13F-HR / 13F-HR/A information-table XML | `ATLASZ_SEC_USER_AGENT` | `missing-config`; no fake holdings or current-position claims. |
| Macro time series | FRED | optional `ATLASZ_FRED_API_KEY` | Public FRED CSV mode by default; optional key upgrades REST metadata. No synthetic macro observations. |
| National accounts/GDP | BEA NIPA GDP | `ATLASZ_BEA_API_KEY` | `missing-config`; no synthetic GDP observations. |
| Energy/commodities | EIA official energy series | `ATLASZ_EIA_API_KEY` | `missing-config`; no synthetic energy observations. |
| Research metadata | OpenAlex Works API | optional `ATLASZ_OPENALEX_API_KEY` | Public no-key mode by default; optional key raises quota. No fake papers, no breakthrough or market inference. |
| Public disclosures | Operator-owned public disclosure JSON | `ATLASZ_POLITICIAN_DISCLOSURE_URL` | `missing-config`; no guessed provider. |
| Local model parsing | Ollama | explicit local enable/config flags | disabled/missing-config; model output stays local/model-inferred. |

### Corpus / Reference Only

OSINT catalogs, agent frameworks, dashboard references, architecture corpora,
security tools, crawler frameworks, and research lists teach design patterns and
source taxonomy. They do not become runtime collection jobs until promoted
through the adapter checklist below.

### Private Agent Skills

Codex/Claude skills are private operator instructions. They are not Atlasz
runtime dependencies and should live in the user/agent skill system rather than
being required in the public repository. Public docs can capture doctrine and
patterns; private skills should not masquerade as app connectors.

### Future / Not Yet Implemented

Broader EIA datasets, broader BLS/BEA tables, BEA release calendars, UN
Comtrade, World Bank, IMF, patents, shipping/aviation/geospatial feeds,
OpenCTI/MISP/Yeti, and premium news sources remain candidate, auth-gated,
commercial-gated, or reference-only until a validated vertical slice exists.

## Backbone Domains

| Domain | What Atlasz Watches | Initial Source Examples |
| --- | --- | --- |
| Financial Markets | Filings, disclosures, source trails | SEC EDGAR, SEC search |
| Economic Data | Macro time series and fiscal/labor data | FRED, BLS, BEA, Treasury Fiscal Data |
| Central Banks | Policy language and liquidity context | Federal Reserve, ECB, BOJ, BoE |
| Semiconductor Intelligence | AI infrastructure bottlenecks | TSMC, Samsung Semi, Intel Foundry, ASML, Applied Materials, Lam Research, KLA |
| Global Trade | Shipping, ports, trade flows | MarineTraffic, Port of LA, UN Comtrade, World Bank, IMF |
| Corporate Intelligence | Company, funding, hiring, and registry context | Crunchbase, OpenCorporates, SEC, Glassdoor, LinkedIn |
| Aviation Intelligence | Flight, airport, cargo, and aerospace movement context | ADS-B Exchange, Flightradar24, FlightAware |
| Space Intelligence | Launches, satellites, Earth observation | SpaceX, NASA Earthdata, ESA, CelesTrak, N2YO |
| Geospatial Intelligence | Maps, imagery, and physical-world spatial context | OpenStreetMap, NASA Earthdata, USGS Earth Explorer, Sentinel, Planet, Earth Engine |
| Energy Intelligence | Grid, power, inventories, nuclear | EIA, IEA, IAEA |
| Geopolitical Intelligence | Official policy and security releases | White House, State Department, NATO, United Nations |
| Patent Intelligence | Future technology traces | Google Patents, USPTO, WIPO PATENTSCOPE |
| AI Intelligence | Research and model releases | arXiv, Hugging Face Papers, Hugging Face Hub, Ollama |
| Academic & Research | Scholarly metadata and citation trails | Google Scholar, Semantic Scholar, ResearchGate |
| GitHub Intelligence | Developer attention and software velocity | GitHub REST Search, Trending, Explore |
| Cryptocurrency Intelligence | Crypto markets, DeFi, and on-chain context | CoinGecko, CoinMarketCap, DefiLlama, Dune, Glassnode, CryptoQuant, Messari |
| Internet Infrastructure | Network, exposure, URL/file, and outage context | BGP HE, Cloudflare Radar, Shodan, Censys, urlscan.io, VirusTotal |
| Real-Time News Wires | Licensed and public news surfaces | Reuters, AP, Bloomberg, FT, WSJ |
| Weather & Natural Events | Weather, earthquakes, hurricanes, and climate hazards | weather.gov, USGS Earthquake, NHC, NOAA |
| OSINT Governance | Tool/source taxonomy | Awesome OSINT, OpenOSINT, OSINT Framework, SpiderFoot, theHarvester, Maryam, Photon |
| Threat Intelligence | Configured CTI graphs | OpenCTI, MISP, Yeti |
| Agent Frameworks | Future bounded agent design | LangGraph, CrewAI, AG2, OpenHands, Agent Laboratory, Agno |

## Important Boundaries

Atlasz should connect signals across domains, but it must not blur data states:

- Official/public feeds are not automatically verified truth.
- Commercial sources require explicit credentials and terms.
- Person/account-enrichment tools are blocked from default runtime.
- Recon/crawler tools are reference-only unless a future authorized mode exists.
- Agent frameworks are architecture references until Atlasz has typed tool
  policies, audit logs, and human review points.
- Internet-exposure tools such as Shodan/Censys/urlscan/VirusTotal are
  auth-gated and OPSEC-sensitive; submissions can expose observables.
- LinkedIn/person-enrichment and account-enumeration workflows are blocked from
  default Atlasz runtime.
- Aviation, shipping, corporate, and premium news platforms are commercial/API
  gated unless an explicit licensed endpoint is configured.
- Patents, papers, model releases, and GitHub stars are weak/early signals, not
  predictions.

## Adapter Promotion Checklist

Before a catalog source becomes a runtime adapter:

1. Add a provider config entry or explicit local-service registration.
2. Implement timeout, retry, and rate-limit behavior.
3. Normalize into typed events/records.
4. Attach source URL, timestamp, provenance, and confidence.
5. Persist audit events for start/fail/recover/publish.
6. Show source health in the Data Core.
7. Add tests for malformed, slow, missing-config, and unavailable states.
8. Keep `DATA_UNAVAILABLE` or source-specific unavailable states instead of
   invented output.

## Current Stance

This atlas is a training map for Atlasz. It makes the terminal aware of what
matters across finance, AI infrastructure, policy, energy, shipping, patents,
space, and developer attention. It does not claim all of those sources are live.

Live capability still depends on the provider registry, adapters, health checks,
and provenance labels.
