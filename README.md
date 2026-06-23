# Atlasz Intel
<img width="1536" height="624" alt="3A445231-D4F1-4AC3-88DA-837BD1FCF774" src="https://github.com/user-attachments/assets/0532fee0-f103-4ed2-88e1-2cf1924c06a8" />

<p align="center">

</p>

<p align="center">
  <strong>Local-first world intelligence command center.</strong><br />
  Map the world behind the chart: public events, macro context, entity graphs,
  social attention, microstructure context, source trails, and research notes.
</p>

<p align="center">
  <a href="https://github.com/gryszzz/Atlasz-Intel/releases/latest">Latest release</a>
  
</p>

Atlasz Intel is a desktop intelligence terminal for researching the conditions
around global assets and narratives. It is built to run locally, persist locally,
and label every data source honestly.

It is **not** a broker, automated action system, financial adviser, price oracle,
or guaranteed prediction engine. Public unauthenticated data is labeled as public
unauthenticated. Simulated data is labeled as simulated. Local model output is
labeled as model-inferred. When Atlasz does not have enough data, it returns
`DATA_UNAVAILABLE` instead of inventing certainty.

## What It Does

- **Command Center**: high-density desktop shell with Data Core health, stress
  indicators, replay state, source trust, top signals, and watchlist context.
- **World Intelligence**: public event/news ingestion through no-auth sources,
  normalized into `WorldIntelEvent` records with source trails and provenance.
- **World Radar**: current events linked to regions, sectors, commodities,
  tickers, narratives, and uncertainty notes when keyword/entity evidence exists.
- **Entity Graph**: in-memory adjacency graph for downstream traversal from an
  event or risk node into exposed sectors and assets.
- **Signal Evidence**: local-derived signals can carry source trails, graph nodes,
  confidence, explanations, and provenance labels.
- **Daily Brief**: local daily context generated from the current event layer,
  not a static marketing page.
- **Watchlist Universe**: symbols can include crypto, stocks, sectors, indices,
  forex-style pairs, and local/seeded identities, with clear coverage states.
- **Social Pulse**: attention pressure and velocity surfaces, currently mostly
  seeded/local-derived unless a public source is explicitly wired.
- **Research Notes**: local observation journal with evidence IDs, confidence,
  emotional state, follow-up dates, and outcome context.
- **Ctrl/Cmd + K Command Menu**: fast navigation across modules, assets, country
  context, graph areas, and research-note actions.

## What It Does Not Do

- No broker connections.
- No broker-side routing.
- No automated market actions.
- No asset instructions.
- No claim that public unauthenticated sources are verified truth.
- No claim that proxy trade-flow pressure is true Level 2 book depth.

## Source Trust Contract

Atlasz uses explicit provenance labels across UI and persistence:

| Label | Meaning |
| --- | --- |
| `simulated` | Generated locally; not real-world data. |
| `public-unauthenticated` | Public no-auth feed; real external data, not verified. |
| `local-derived` | Deterministic local computation from available inputs. |
| `local-model` | Local model/parser output source. |
| `model-inferred` | Inferred relationship or extraction; uncertain and decays. |
| `auth-gated` | Connector requires credentials and fails closed by default. |
| `verified` | Reserved for explicitly verified/audited pipelines. |

Additional compatibility labels such as `rss-public`, `official-api`,
`public-disclosure`, `local-computed`, and `math-derived` are normalized into
the same trust model. Verified is never used as a fallback.

## Real Data Contract

Atlasz is allowed to be incomplete. It is not allowed to fake intelligence.

- No fake events.
- No fake alerts.
- No fake macro, fiscal, filing, GDP, labor, vulnerability, or OSS release data.
- No token/API-key leakage into persisted source trails, UI endpoint lists, or
  raw payload records.
- Missing config, rate limits, malformed payloads, stale sources, and failed
  requests fail closed as `DATA_UNAVAILABLE`, `missing-config`, `stale`,
  `rate-limited`, `failed`, `auth-gated`, or `PRICE_UNAVAILABLE`.
- Every rendered data card must show source identity, freshness/timestamp,
  confidence, provenance, and a source trail when a URL exists.
- Local computation can explain or rank evidence, but it cannot upgrade source
  truth to verified.

## Architecture

```text
public/no-auth market + world sources
  -> worker_threads ingestion worker
  -> normalized batches
  -> realtime engine ring buffers
  -> 100ms frame publication
  -> Electron IPC / browser fallback store
  -> HUD widgets, graph, replay, source audit
```

Core local systems:

- **Worker-thread ingestion** keeps raw high-frequency packets off Electron main
  and React.
- **Connector registry** supports a broad public REST quote path, public crypto
  websockets, auth-gated placeholders, and dev/test simulation only when
  explicitly enabled.
- **Double-buffered UI delivery** publishes aggregated frames at a controlled
  cadence instead of pushing raw packets to React.
- **SQLite WAL persistence** stores local briefs, headlines, research notes,
  sampled frames, signal events, entity edges, and source audit logs.
- **JSON fallback** keeps the app boot-safe when native SQLite is unavailable.
- **Graph mutator** decays stale `model-inferred` edges while preserving seed,
  local-derived, and verified relationships.
- **Adaptive parser/orchestrator** uses rolling latency clamps, narrative
  velocity modes, and source reliability penalties to fail closed under load.

## Desktop UI Doctrine

Atlasz studies serious desktop shells, dashboards, graph tools, maps, command
palettes, and design systems without blindly copying them. The UI reference
catalog tracks Electron, Tauri, shadcn/ui, Radix, Tailwind, TanStack, ECharts,
Xyflow, Cytoscape, deck.gl, Grafana, Superset, Lucide, cmdk, resizable panel
systems, and related sources with full upstream URLs and adoption posture.

Every major screen is judged against five analyst questions: what is happening,
why it matters, what changed, what evidence supports it, and what to inspect
next. See `docs/desktop-intelligence-ui-doctrine.md` and
`src/desktopUiCorpus.ts`.

## Runtime Source Status

The runtime stack is intentionally split from the broader research corpus.
Runtime-wired means an adapter/provider path exists and is covered by validation;
it does not mean every provider is enabled or reachable on every machine.

Atlasz now exposes this contract in-product through the **Connector Dashboard**
and **Exposure Dashboard**. Connector Dashboard lists configured/missing-key,
unavailable, stale, rate-limited, failed, disabled, and not-wired states across
the runtime stack. Exposure Dashboard answers which real events resolved today,
which entities they activated, and which exposure paths are only
`curated-reference` rather than live evidence.

### Runtime-Wired Connectors

| Domain | Connector | Source identity | Default boundary |
| --- | --- | --- | --- |
| Markets | Yahoo public chart, CoinGecko, public crypto websocket paths | Public no-auth market endpoints | Public unauthenticated/delayed/stale/unavailable; not a price oracle. |
| World/news events | GDELT, RSS/official public-feed normalization | Public metadata/news feeds | Public unauthenticated or RSS-public; article metadata is not verification. |
| Government fiscal | Treasury Fiscal Data | Official Treasury Fiscal Data API | No key; official-api; no simulated fiscal values. |
| Labor/economic | BLS Public Data API | Official BLS API | No key required; optional key is never persisted. |
| Weather/natural events | NOAA/NWS active alerts, USGS earthquakes | Official NOAA/NWS and USGS APIs | No key; official-api; no fake weather, no severity inflation, unresolved exposure stays explicit. |
| Cyber/vulnerability | CISA KEV, NVD, GHSA, OSV, CISA advisories | Official/public defensive feeds | Defensive context only; no scanning, exploitation, or private target collection. |
| OSS technology | GitHub Releases | Official GitHub REST API for configured public repos | Public release metadata; optional token only raises limits and is not persisted. |

### Config-Required Runtime Connectors

| Domain | Connector | Required config | Behavior without config |
| --- | --- | --- | --- |
| Company disclosure | SEC EDGAR company submissions | `ATLASZ_SEC_USER_AGENT` | `missing-config`; no simulated filings. |
| Macro time series | FRED | `ATLASZ_FRED_API_KEY` | `missing-config`; no synthetic macro charts. |
| National accounts/GDP | BEA NIPA GDP | `ATLASZ_BEA_API_KEY` | `missing-config`; no simulated GDP data. |
| Energy/commodities | EIA official energy series | `ATLASZ_EIA_API_KEY` | `missing-config`; no synthetic energy data or commodity alerts. |
| Patent intelligence | USPTO PatentsView | `ATLASZ_PATENTSVIEW_API_KEY` | `missing-config`; no fake patents or person enrichment. |
| Public disclosures | Operator-provided disclosure JSON | `ATLASZ_POLITICIAN_DISCLOSURE_URL` | `missing-config`; no guessed disclosure feed. |
| Local model parsing | Ollama | explicit local enable/config flags | Disabled/missing-config; output remains local-model/model-inferred. |

### Corpus And Reference Material

The OSINT, security, agent, UI, data-engineering, and systems-design corpora are
study/reference material unless a source is promoted through the provider
registry, adapter tests, source health, persistence, and UI evidence path.
Catalog membership is not runtime capability.

### Private Agent Skills

Codex/Claude skills are operator-private agent instructions, not Atlasz app
runtime. They should live in the user/agent skill system, not be required for a
public GitHub checkout. Repo docs may describe engineering doctrine; private
skills should not be treated as product code or installed source connectors.

### Not-Yet-Implemented Future Sources

EIA expansions beyond the first energy allowlist, BEA expansions beyond the
first NIPA slice, BLS expansions, BEA regional data, BEA industry tables, BEA
trade tables, BLS/BEA release calendars, OpenCTI, MISP, Yeti, UN Comtrade
runtime ingestion, World Bank, IMF, patent-family expansion, aviation, shipping,
geospatial, and premium news providers remain candidate/auth-gated/reference
sources until an evidence-bearing vertical slice is implemented and validated.

## Intelligence Source Atlas

Atlasz is being trained as a cross-domain intelligence terminal, not only an
OSINT shell. The source atlas now maps the major intelligence backbones:

- financial markets and SEC filings
- corporate intelligence and registry/source trails
- economic data and central banks
- semiconductor manufacturing and equipment
- global trade, shipping, ports, and aviation
- space, satellites, geospatial data, and Earth observation
- energy, grid, and nuclear context
- government/geopolitical releases
- patent intelligence
- AI research, academic research, models, and local model services
- GitHub/developer attention and cryptocurrency intelligence
- internet infrastructure, real-time news wires, weather, and natural events
- OSINT governance, threat-intel platforms, and agent-framework references

Each source is classified as runtime-wired, candidate public adapter,
auth-gated, commercial-gated, local-service, reference-only, or blocked. See
`docs/intelligence-source-atlas.md`, `docs/opsec-intelligence-doctrine.md`,
`src/intelligenceSourceCatalog.ts`, and `src/intelligenceOpsec.ts`.

## OSINT Engineering Posture

Atlasz studies the broader OSINT ecosystem, but it does not auto-run broad recon
tooling. Catalogs and frameworks such as Awesome OSINT, OSINT Framework,
OpenOSINT, LangGraph, CrewAI, AG2, SpiderFoot, theHarvester, Maryam, Photon, and
OpenCTI are mapped through an explicit governance layer before they can influence
runtime behavior.

- Broad catalogs are reference-only.
- Agent frameworks are reference-only until there are typed tool policies and
  human-visible audit points.
- Recon, harvesting, crawler, and identity-enrichment tools are not default
  Atlasz sources.
- Threat-intel platforms such as OpenCTI are future auth-gated adapters only.
- Public/official/local feeds remain the default path.

See `docs/osint-engineering-manual.md` and `electron/osint/osintGovernance.ts`.

## Agent Mastery Corpus

Atlasz now carries a broader engineering corpus for lawful data acquisition,
defensive security, OPSEC, systems design, parsing, indexing, knowledge graphs,
reliability, decision analysis, intelligence tradecraft, history, economics,
and engineering judgment. This includes the practical stack around Crawl4AI,
Playwright, Trafilatura, Unstructured, Airbyte, Qdrant, Neo4j, OpenBB, CCXT,
GeoPandas, and changedetection.io.

The corpus is policy-labeled: study-only, allowed-library, manual-review,
auth-required, commercial-terms, authorized-lab-only, or blocked. Active recon,
malware handling, person enrichment, browser automation, and credentialed APIs
are not silently promoted into runtime behavior. See
`docs/agent-mastery-corpus.md`, `docs/analyst-mental-models-doctrine.md`,
`docs/lawful-data-acquisition-doctrine.md`, and `src/agentMasteryCorpus.ts`.

## Microstructure Boundary

Atlasz can compute local microstructure-style context, but the labels matter:

- `TRUE_L2_ORDER_BOOK`: only valid when a real depth/book connector provides
  book-depth updates.
- `PROXY_TRADE_FLOW_PRESSURE`: local-computed proxy pressure from public trade
  flow / public quote updates.
- `MICROSTRUCTURE_UNAVAILABLE`: shown when there is not enough data.

The current public path does **not** claim verified Level 2 order-book truth.

## Historical Precedent / Graph Memory

The historical layer is local-first:

- lexical/vector-style similarity is local-computed
- sparse memory returns `DATA_UNAVAILABLE`
- inferred historical relationships remain provenance-labeled
- no local model output is upgraded to verified truth

This is designed for research context, not certainty.

## Screens and Media

The README banner is a transparent PNG derived from the in-repo Atlasz logo:

- `docs/atlasz-intel-preview.png`
- `docs/atlasz-intel-banner-transparent.png`
- `docs/atlasz-intel-logo.png`
- `docs/atlasz-intel-icon-sz.png`
- `docs/atlasz-intel-sz-transparent.png`
- `public/atlasz-logo.png`
- `public/favicon.png`

The banner is intentionally a transparent brand asset, not a generated app view.
Real app captures can be added later when the release needs them.

## Install

```bash
git clone https://github.com/gryszzz/Atlasz-Intel.git
cd Atlasz-Intel
npm install
```

## Run Locally

```bash
npm run dev
```

Browser-only preview:

```bash
npm run web:dev
```

## Configuration

Copy `.env.example` to `.env` only when you want to opt in to external public
feeds or local model experiments.

Common flags:

```bash
ATLASZ_ENABLE_PUBLIC_WS=1
ATLASZ_CONNECTOR=coinbase_public_ws
ATLASZ_ENABLE_PUBLIC_WORLD=1
ATLASZ_ENABLE_COGNITIVE_PARSER=0
```

With no `.env`, Atlasz starts with safe defaults: no-auth public paths may run,
key-gated providers show `missing-config`, unavailable data stays unavailable,
and simulator/dev data must remain explicitly labeled.

## Validate

```bash
npm run test
npm run lint
npm run build
git diff --check
```

The desktop package script is available when Electron packaging dependencies and
host platform requirements are satisfied:

```bash
npm run desktop:build
```

## Release

Target repository:

```text
https://github.com/gryszzz/Atlasz-Intel
```

Public checkpoint tag:

```text
v0.1.0
```

Release assets should exclude `node_modules`, local `.env` files, generated
databases, logs, caches, and local Electron output unless a desktop package is
explicitly produced.

## Roadmap

- Phase 3.5: historical precedent and Graph-RAG memory.
- Phase 4: microstructure stress context and richer research-note workflows.
- Future: semantic/vector matching after the deterministic lexical baseline is
  stable enough to measure against.

## Disclaimer

Atlasz Intel is informational research software. It can surface public,
unauthenticated, simulated, locally derived, or model-inferred data, and each
state is labeled. Nothing in this repository is financial advice.
