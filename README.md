# Atlasz Intel

Atlasz Intel is a private, local-first desktop intelligence terminal that connects
markets, world events, social attention, macro risk, and entity relationships into
one controllable signal map.

It is **local-first and honest by default**: with no configuration it runs entirely
on an offline simulator and seeded intelligence, and it labels that data as such. It
can opt in to real **public, unauthenticated** market feeds, and leaves
authenticated/credentialed sources as conservative, fail-closed placeholders.

Atlasz is **not a trading bot, not financial advice, and not a prediction machine.**
It never presents simulated, seeded, local, or unaudited data as verified live truth.

## Current State — Realtime Core MVP (`v0.3.0`)

A coherent local-first MVP with a real-time data core, replayable history, signal
detection, an in-memory risk graph, a decision journal, layered local persistence,
and a command-menu-driven desktop shell.

### Surfaces

- **Command Center** — Data Core health, realtime pulse, top movers, attention
  pressure, risk map, signals, radar, and the selected-object dossier.
- **Data Core** — active connector, source-trust tier, packets/frames per second,
  dropped packets, reconnects, SQLite mode, and replay controls (Replay 5m /
  play / pause / live), all honestly labeled.
- **Market Terminal** — per-asset chart context plus a live (or simulated) readout
  with volatility velocity, volume acceleration, and tick counts.
- **World Radar** — normalized events with timestamps, detected entities, linked
  markets, uncertainty, and source trails.
- **Social Pulse** — attention pressure, mention velocity (dV/dt), and sentiment
  divergence (simulator/local-derived).
- **Entity Graph** — React Flow relationship map with O(V+E) risk-chain traversal
  (e.g. Red Sea → Crude → Energy → XLE).
- **AI Analyst** — answers grounded in the local evidence layer, with explicit
  confidence/uncertainty and source trails (never claims live truth).
- **Daily Brief** — headline, why-it-matters, confidence, uncertainty, watch-next,
  and source trail.
- **Decision Journal** — thesis, evidence IDs, conviction, emotional state, review
  date, and post-mortem — a discipline layer, persisted locally.
- **Command Menu (Ctrl/Cmd + K)** — discoverable jump-actions and intelligence
  commands; also reachable from the topbar "Command" button.

## Realtime Data Core

Ingestion runs in an Electron worker thread and feeds a double-buffered engine:

```
connector (simulator | public WS) → worker batch → engine ring buffer (1000)
   → 100ms requestAnimationFrame frame → renderer (IPC) → HUD widgets
```

- **Zero-copy ring buffer** per asset; **100ms throttled frames**; only subscribed
  leaf widgets re-render.
- **Signal detection** (volume spikes, volatility, correlation breaks) over frames.
- **Replay** of the last sampled window from local persistence.
- **Risk graph traversal** in-memory (adjacency list).
- All frames/ticks/attention/signals are sampled into local persistence with an
  audit log of connector and source events.

## Source-Trust / Honesty Model

Every realtime surface carries a source-trust tier, so the live/simulated/local/
authenticated boundary is always visible:

| Tier | Meaning | In this build |
| --- | --- | --- |
| `Simulated` | Generated locally, not market data | **Default.** Simulator + seeded data |
| `Public unauthenticated` | Real public feed, unaudited | Opt-in crypto WS (CoinCap/Binance/Coinbase) |
| `Authenticated` | Requires credentials | Equities/ETF placeholder — **fails closed** |
| `Verified` | Audited/verified pipeline | Not yet implemented |

## What Is Truly Live-Capable

- **Crypto (BTC/ETH)** via real **public, unauthenticated** WebSockets — CoinCap,
  Binance, and Coinbase — when explicitly enabled (see Configuration). Labeled
  "Public unauthenticated".

## What Remains Simulated / Seeded / Auth-Gated

- **Default market data**: offline simulator (no network).
- **Equities / ETFs**: Alpaca IEX is an auth-gated placeholder that intentionally
  fails closed — no credentials are wired by design.
- **Social attention, signals, source trails, daily brief, world headlines, and
  entity-graph relationships**: simulator/seeded/locally derived.

## Persistence (layered, boot-safe)

Tries in order, reporting the active mode to the UI:

1. `node:sqlite` (built-in) with WAL
2. `better-sqlite3` (if installed)
3. JSON file store (Electron main)
4. `localStorage` (browser preview)

Stores daily briefs, world headlines, the decision journal, sampled market ticks,
attention batches, entity edges, signal events, realtime frames, and a source
audit log.

## Configuration

All configuration is optional. Copy `.env.example` to `.env` to opt in to real data.

- `ATLASZ_ENABLE_PUBLIC_WS=1` — enable real public, unauthenticated crypto feeds.
- `ATLASZ_CONNECTOR=<id>` — force a connector (`simulated`, `coincap_public_ws`,
  `binance_public_ws`, `coinbase_public_ws`, `alpaca_iex_placeholder`).

With no configuration, Atlasz runs the simulator and labels everything as simulated.

## Local Development

```bash
npm install
npm run dev        # Electron app from the Vite dev server
npm run web:dev    # browser-only preview (localStorage persistence, simulator)
```

## Build & Package

```bash
npm run build          # tsc -b + vite build (renderer + electron main + worker)
npm run lint           # eslint
npm run desktop:build  # electron-builder desktop package
```

## Not Financial Advice

Atlasz Intel is an analysis and reasoning tool. Market data — when live — is public
and unaudited; by default it is simulated. Nothing in the app is financial advice or
a prediction, and it should not be used as the sole basis for any decision.
