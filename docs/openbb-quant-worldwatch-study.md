# OpenBB / Quant / Worldwatch Study Pass

Study references only:

- OpenBB: https://github.com/OpenBB-finance/OpenBB
- awesome-quant: https://github.com/wilsonfreitas/awesome-quant
- trading-data GitHub discovery: https://github.com/search?q=trading+data&type=repositories
- WorldWideView: https://github.com/silvertakana/worldwideview

Do not copy code, branding, UI assets, or trade dress from these projects. OpenBB
is AGPLv3; WorldWideView is license-sensitive for direct reuse. Atlasz extracts
architecture and product discipline only.

## OpenBB-Inspired Pattern

OpenBB's useful pattern for Atlasz is not a UI clone. It is the data-platform
discipline:

```text
connect once -> consume everywhere
```

Atlasz equivalent:

```text
Hermes connector runtime
  -> Worldwatch Globe
  -> Source Operations
  -> Market Coverage Dashboard
  -> Entity Dossiers
  -> Source Trails
  -> local agent/control buses
```

Implemented Atlasz pattern:

- Connector capability data lives in runtime audit definitions.
- Coverage rows map connectors to market/world categories.
- Data Catalog UI shows connector, entities, proof fields, cadence/config, and
  consuming surfaces.
- Source proof remains the common currency: source URL, retrieval timestamp,
  payload hash, provenance, confidence, and stale state.

Gaps still worth improving:

- Public docs for connector method names and result schemas.
- Stronger typed provider capability schema shared across Electron and React.
- Exportable local read-only API surface for agents, with no remote server claim.

## Quant Coverage Matrix

The Market Coverage Dashboard uses the awesome-quant ecosystem as a checklist,
not as a dependency list. Atlasz tracks these categories explicitly:

- equities / ETFs
- crypto
- forex
- futures / commodities
- options / OI
- short interest
- SEC filings
- fundamentals
- ownership / 13F
- ETF/index holdings
- macro
- rates
- policy
- calendar / earnings
- sentiment / media observation
- alternative data
- physical infrastructure
- geospatial hazards
- supply chain / trade
- research / patents

Each category renders as covered, key-gated, configured-only, or missing, with
trust tier and non-claims. Missing categories are product truth, not failure text.

## WorldWideView-Inspired Globe Discipline

WorldWideView's useful pattern is globe/layer/data-bus architecture. Atlasz keeps
the proof and exposure model:

- `WorldwatchLayerRegistry` is the source of truth.
- Each layer has id, label, trust tier, cadence, connector IDs, proof
  requirements, marker renderer, stale renderer, disabled reason, and source
  trail handler.
- `WorldwatchDataBus` is a typed local app event bus.
- `WorldwatchAgentBus` is local only; no HTTP, WebSocket, or MCP claim.
- The renderer stays behind a lazy boundary. The current mode is an honest 2D
  fallback; Cesium/Resium can be added only after dependency/license/bundle/GUI
  smoke review.

## Trading-Data Triage Rules

GitHub trading-data search is discovery only. No candidate gets implemented until
it passes all checks:

- source type
- official or unofficial
- license
- API stability
- key required
- allowed usage
- proof fields available
- freshness/cadence
- whether it helps Atlasz

Likely useful next layers:

| Candidate | Status | Notes |
| --- | --- | --- |
| earnings calendar / releases / transcripts | candidate | Prefer official exchange/company/SEC/event provider APIs. No hype summaries. |
| short interest | candidate | Prefer FINRA/exchange/provider-backed source. Must preserve publication lag. |
| global central banks | candidate | Prefer official ECB/BOJ/BOE/IMF/World Bank/OECD APIs. |
| futures / commodity prices | candidate | Provider-backed; no scraped exchange pages. |
| forex rates | candidate | Official central bank or licensed/provider-backed source. |
| wildfire/flood/drought/hurricane | candidate | Official NOAA/NIFC/USGS/agency sources only. |
| AIS/marine movement | candidate | Only lawful official/provider-backed source; no fragile scraping. |

## Product Rule

Atlasz is not a trading bot. Coverage and relevance do not create advice,
predictions, urgency, or proof. Every surfaced claim must remain source-bounded.
