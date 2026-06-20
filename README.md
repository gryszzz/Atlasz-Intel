# Atlasz Intel

<p align="center">
  <img src="docs/atlasz-intel-preview.png" alt="Atlasz Intel transparent banner" width="900" />
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

## Data Sources

Default desktop mode is real-source-capable and fail-closed:

- Broad market lookup: Yahoo public chart endpoint for stocks, ETFs, indices,
  FX pairs, sectors, and commodity futures proxies.
- Crypto lookup: CoinGecko public REST for mapped assets such as BTC, ETH, SOL,
  LINK, AVAX, and KAS.

- Public crypto websockets: CoinCap, Binance, Coinbase style feeds where wired.
- Public world/event layer: GDELT/RSS/official-source normalization where enabled.
- Public macro/OSINT adapters: no-auth sources only where configured.
- Auth-gated equities placeholders: intentionally fail closed unless credentials
  and connector support are added later.

Public data is useful, but it is not presented as verified. The UI marks it as
`public-unauthenticated`, `delayed`, `stale-cache`, or `unavailable` and keeps
source trails visible.

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

With no `.env`, Atlasz uses local simulation/fallback paths and labels them.

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
