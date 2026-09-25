<div align="center">

# YSZ // WORLDSTATE

**An evidence-first world-state intelligence system.**

YSZ Worldstate maps meaningful change across **markets, capital, policy, trade, infrastructure, energy, public-chain activity, cyber, and the physical world** into one source-trailed geospatial model.

It is built to answer a harder question than “what is happening?”:

> **What changed in the world, where did it happen, what systems does it touch, how material is it, and what actually proves it?**

The surface stays quiet. The system underneath stays deep.

**Worldstate is not a feed. It is a continuously updated model of relationships, flows, exposures, and evidence.**

<br/>

[![Evidence first](https://img.shields.io/badge/evidence-source--trailed-0b7285?style=flat-square)](docs/runtime-verification-log.md)
[![World model](https://img.shields.io/badge/model-geospatial%20world%20state-1864ab?style=flat-square)](docs/atlasz-world-rebuild.md)
[![Local first](https://img.shields.io/badge/runtime-local--first-364fc7?style=flat-square)](#run-locally)
[![Verification](https://img.shields.io/badge/runtime-verification-enforced-2b8a3e?style=flat-square)](docs/runtime-verification-log.md)

<br/>

[World architecture](docs/atlasz-world-rebuild.md)
&nbsp;·&nbsp;
[Runtime verification](docs/runtime-verification-log.md)
&nbsp;·&nbsp;
[Source atlas](docs/intelligence-source-atlas.md)
&nbsp;·&nbsp;
[Engineering standards](docs/atlasz-runtime-engineering-standards.md)

---

YSZ Worldstate is **not** a chatbot, a news clone, a trading bot, or a placeholder dashboard. It is a desktop intelligence workspace built around one discipline: every line on screen traces to live evidence, curated structure, an explicitly-labeled inference, or an honest *unknown*. Nothing is invented to fill a gap.

It exists to answer the questions that matter when systems move:

> **What changed? · Where? · Who or what is exposed? · Is the signal unusual? · Where is capital or physical flow changing? · What evidence supports it? · What conflicts with it? · What remains unknown?**

Worldstate treats politics, markets, shipping, infrastructure, energy, public blockchains, ownership, and macro data as connected parts of one system rather than separate dashboards.

---

## The Real-Data Contract

This is the core of the product, not a footnote. Worldstate is *allowed to be incomplete*. It is *not allowed to fabricate intelligence*.

- **No simulated production data.** No fake events, alerts, macro prints, filings, patents, sanctions, prices, or weather.
- **Fail closed, always.** Failed, stale, malformed, unavailable, or rate-limited sources surface as exactly that — never as silently-substituted data.
- **Missing keys are honest.** Key-gated providers render `missing-key` / `DATA_UNAVAILABLE` until configured. There is no random-walk price fallback.
- **Provenance or it didn't happen.** Source trails carry source identity, freshness, confidence, provenance, a URL when available, and payload proof when practical.
- **Media is observation, not fact.** GDELT shows what public media *metadata* observed — it never becomes a verified event and never enters exposure ranking.
- **Curated structure is reference, not causality.** Exposure chains describe relationships; they are labeled `curated-reference` and are never upgraded into live proof.
- **Secrets stay secret.** Keys are read from the environment only and must never appear in source trails, logs, raw payloads, or UI endpoint lists. A redaction scan enforces it.

---

## What's New in v0.2.0

The terminal grew from a connector dashboard into a full reasoning surface. Highlights since the last README:

### Aegis Worldwatch Profiles
Profile-aware watchlists rank intelligence by the systems you care about: tickers,
companies/CIKs, ETFs, commodities, regions, facilities, ports, grid regions,
minerals, CVEs, connectors, and themes. Hermes delivers evidence, Aegis evaluates
trust/freshness/conflict, and Worldwatch only ranks relevance. Watchlists never
create evidence or raise truth confidence.

### Local API Activation
`docs/local-api-setup.md` and `scripts/checkRuntimeConfig.mts` give operators a
safe key activation path: env-name presence only, official-host validation for
configured URLs, and locked connector summaries. The UI now includes a Connector
Activation Panel for missing-key, configured, online, failed, rate-limited, and
stale states without rendering key values.

### Intelligence Synthesis — "What To Watch Next"
The forward end of the evidence chain. Atlasz composes briefs that walk:
`observed change → proof → resolved entities → curated systems → corroboration → conflicts → unknowns → what it does NOT prove → confirmation-seeking watch items` — **every line basis-labeled** so you always know whether you're reading evidence, structure, or inference.

### Cross-Source Corroboration & Conflict Detection
- **Corroboration** rewards independent overlap across sources — media never counts as corroboration, and stale sources are downgraded.
- **Conflict detection** flags contradictions instead of silently merging them: ticker↔CIK, CIK↔name, facility coordinates, ETF ticker↔CUSIP, and operator-identity mismatches.

### Canonical Freshness Model
One freshness vocabulary across the whole app: `live · fresh · cached · stale · expired · missing-key · unavailable · rate-limited`. **"What Changed Today"** now excludes static/annual reference data unless it was genuinely change-tracked today.

### Geospatial + Energy / Trade / Materials Core
A real geospatial layer with energy, logistics, and critical-materials connectors: EIA **power plants, refineries, LNG terminals, nuclear plants**, **NRC reactor status**, **grid regions / balancing authorities**, **ports (UN/LOCODE + World Port Index)**, **USGS minerals**, and a curated **critical-minerals crosswalk**.

### Real Market Data (no fake prices)
A key-gated equity/ETF **quote provider (Alpaca)** wired live into the ingestion worker, plus an **options chain / open-interest** provider. Seeded/default market surfaces are gated out of production — it's `PRICE_UNAVAILABLE` until a real quote arrives, never a guess.

### Honesty Harness
A self-auditing spine: Connector Dashboard, Market Coverage Dashboard, Market Data Reality audit, the [Connector Super-Hardening audit](docs/connector-hardening-audit.md), and an upgraded [runtime verification pass](docs/runtime-verification-log.md) reporting freshest/oldest record, coverage, eligibility, and corroboration/conflict counts.

---

## Interface

Repo-owned previews of the public-facing surfaces and the evidence boundaries they enforce.

| Connector Dashboard | Exposure Dashboard |
| --- | --- |
| ![Connector Dashboard](docs/screenshots/connector-dashboard.svg) | ![Exposure Dashboard](docs/screenshots/exposure-dashboard.svg) |

| What Changed Today | Source Trail Card |
| --- | --- |
| ![What Changed Today](docs/screenshots/what-changed-today.svg) | ![Source Trail Card](docs/screenshots/source-trail-card.svg) |

| Curated Exposure Chains |
| --- |
| ![Curated Exposure Chains](docs/screenshots/curated-exposure-chains.svg) |

---

## Architecture Loop

```text
 connectors ─▶ normalize ─▶ persist ─▶ source trail ─▶ Evidence Graph ─▶ resolver
                                                                            │
   verification log ◀── dashboards ◀── intelligence synthesis ◀── curated exposure
```

**Runtime flow**

1. **Connectors** fetch bounded records from official/public sources with retry, backoff, and fail-closed guards.
2. **Adapters** normalize records into stable internal types carrying source identity and payload hashes.
3. **Persistence** stores source-backed records, audit rows, source trails, and graph evidence in local SQLite (WAL) with a JSON fallback.
4. The **Evidence Graph** links records to entities, topics, publishers, companies, countries, sectors, commodities, vulnerabilities, filings, patents, facilities, and events — only when proof fields exist.
5. The **resolver** can surface curated structural exposure, labeled `curated-reference`, never upgraded into live causality.
6. **Corroboration & conflict** passes cross-check sources before anything is presented as agreement.
7. **Intelligence synthesis** composes basis-labeled "What To Watch Next" briefs.
8. **Dashboards** show source health, freshness state, ranked change, source trails, entity dossiers, and unresolved gaps.
9. `scripts/runtimeVerification.mts` drives the real registry and writes an auditable truth table.

---

## Connector Matrix

**48 runtime-driven connectors.** *Runtime-wired* means there is an adapter/provider path, tests, source-health behavior, and UI/persistence wiring — not that every source is reachable without keys on every machine. The live, generated table lives in [`docs/runtime-verification-log.md`](docs/runtime-verification-log.md).

### Live public — fetch live, no key required
SEC Market Reference Master · ETF Holdings · FRED CSV · Treasury Fiscal Data · BLS · EIA public bulk reference · Federal Register · Congress.gov *(DEMO_KEY mode)* · OFAC SDN · NOAA/NWS Alerts · USGS Earthquakes · CISA KEV · CISA Advisories · NVD · GHSA · OSV · GitHub Releases · OpenAlex Works · Crossref DOI · UN/LOCODE · NRC Reactor Status · World Port Index · USGS Minerals *(MRDS legacy reference)* · arXiv/GitHub/NASA/Space public feeds · GDELT *(media observation)* · Yahoo/CoinGecko public market paths · optional public crypto websockets

### Key-gated — require `.env`, fail closed to `missing-key`
SEC EDGAR · SEC Company Facts · SEC Form 4 · SEC Form 13F *(SEC User-Agent)* · BEA · EIA authenticated API *(+ power plants / nuclear / grid)* · UN Comtrade · USPTO PatentsView · Alpaca equity/ETF quotes · Alpaca options chain/open-interest

### Configured official URLs — no fake facility layers
LNG terminals · EIA refineries require pinned official URLs unless a trusted default is configured. Missing URLs render as configured-only / missing-key states, not fabricated map markers.

### Domain coverage at a glance

| Domain | Connectors |
| --- | --- |
| **Markets & identity** | Market Reference Master, Equity/ETF Quotes, ETF Holdings, Options chain/OI |
| **Company disclosure** | SEC EDGAR, Company Facts, Form 4 (insiders), Form 13F (institutions) |
| **Macro & fiscal** | FRED, BEA, BLS, Treasury Fiscal Data |
| **Policy & regulatory** | Federal Register, Congress.gov, OFAC SDN |
| **Cyber & vulnerabilities** | CISA KEV, CISA Advisories, NVD, GHSA, OSV |
| **Energy & facilities** | EIA, EIA Power/Nuclear Plants, Refineries, LNG Terminals, NRC Reactor Status, Grid Regions |
| **Trade, ports & materials** | UN Comtrade, UN/LOCODE, World Port Index, USGS Minerals |
| **Physical world** | USGS Earthquakes, NOAA/NWS Alerts |
| **Research & IP** | USPTO PatentsView, OpenAlex Works, Crossref DOI |
| **OSS & media** | GitHub Releases, GDELT *(media observation)* |

---

## What It Does

- **High-density local command center** — a desktop workspace, not a web tab.
- **Connector Dashboard** — source health, trust tier, freshness state, record counts, persistence, and source-trail coverage.
- **Connector Activation Panel** — local key/config presence and what each connector unlocks, without exposing values.
- **Exposure Dashboard** — resolved events, unresolved gaps, media-observation boundaries, and curated-reference exposure counts.
- **Market Coverage Dashboard + Market Data Reality panel** — honest gaps where real quotes don't exist yet.
- **Aegis Worldwatch Profiles** — relevance profiles and watchlist chips for what matters to your systems without changing proof or confidence.
- **What Changed Today** — ranked change across filings, macro, weather, policy, cyber, research, fiscal, patents, OSS releases, and trade layers.
- **What To Watch Next** — forward-looking, basis-labeled intelligence briefs.
- **Evidence Graph + Entity Dossiers** — timelines, proof rows, unknowns, source links, freshness, confidence, and curated exposure chains.
- **World globe + event timeline** — geospatial context for physical-world and facility events.
- **Quant terminal, Decision Journal, and research notes** — local operator context.
- **`Ctrl/Cmd + K` command palette** — navigation and inspection from the keyboard.

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Shell | **Electron 42** (desktop) with a browser-only preview mode |
| UI | **React 19** + TypeScript, Tailwind v4, Recharts, `@xyflow/react` graph |
| Build | **Vite 8**, `vite-plugin-electron`, `tsc` project references |
| Persistence | **SQLite (WAL)** via `better-sqlite3`, with a JSON fallback store |
| Ingestion | Worker-thread realtime market ingestion + browser fallback store |
| Verification | `scripts/runtimeVerification.mts` (real registry, fail-closed, redaction scan) |

---

## Quickstart

```bash
git clone https://github.com/gryszzz/Atlasz-Intel.git
cd Atlasz-Intel
npm install
npm run dev          # desktop (Electron) dev
```

Browser-only preview:

```bash
npm run web:dev
```

With no `.env`, Atlasz starts on safe defaults: public/no-auth paths may run, key-gated providers report `missing-key`, unavailable data stays unavailable, and any simulator/dev data must be explicitly enabled **and** labeled.

### Configuration

Copy `.env.example` to `.env` only to opt into external public feeds, keyed official APIs, or local model experiments.

```bash
ATLASZ_ENABLE_PUBLIC_WORLD=1
# Background Worldwatch refresh loop; due providers still respect their own
# source cadence/rate guards.
ATLASZ_WORLD_REFRESH_MS=600000
ATLASZ_SEC_USER_AGENT="Atlasz Intel research (you@example.com)"
ATLASZ_EIA_API_KEY="..."
# No-key EIA public bulk reference is enabled by default; this key is still
# required for authenticated EIA API/facility/grid coverage.
# Optional quota upgrades, not required for baseline:
ATLASZ_FRED_API_KEY="..."
ATLASZ_OPENALEX_API_KEY="..."
ATLASZ_CONGRESS_API_KEY="..."
ATLASZ_CROSSREF_MAILTO="you@example.com"
# Real market data (no fake prices):
ATLASZ_ALPACA_API_KEY="..."
ATLASZ_ALPACA_SECRET_KEY="..."
```

> Never commit `.env`, generated local databases, logs, caches, or local API keys.

---

## Operator Verification

The verification pass is the source of truth for what was online, failed closed, or missing-key on the last run.

```bash
npx tsx scripts/runtimeVerification.mts
```

It drives the **real** provider registry and adapter code: public connectors are exercised live where reachable, keyed connectors without keys report `missing-key`, and keyed connectors with keys do a real fetch. It verifies fail-closed boundaries and trust labels, scans normalized output for secret leakage, prints **environment key names only — never values**, and writes [`docs/runtime-verification-log.md`](docs/runtime-verification-log.md).

Full local gate:

```bash
npm run lint
npm run build
npm test
git diff --check
npx tsx scripts/runtimeVerification.mts
```

Desktop packaging (when Electron build deps and host requirements are satisfied):

```bash
npm run desktop:build
```

---

## Boundaries

YSZ Worldstate is **informational research software**. It is:

- **Not** financial, legal, or sanctions-screening advice.
- **Not** a trading bot, broker, execution engine, smart order router, or price oracle.
- **Not** true Level-2 order-book depth unless a real depth connector is added later.
- **Not** OSINT targeting people — no scraping of private/personal data.
- **Not** a tool for bypassing authentication, paywalls, CAPTCHAs, or rate limits, and **not** for offensive security automation.

Public unauthenticated data carries no guarantee of completeness, freshness, or verification — and Worldstate labels it as such.

---

## Source Atlas & Private Skills

The OSINT, security, agent, UI, data-engineering, and systems-design corpora in `docs/` are **reference material** unless promoted through the full evidence path: provider registry → adapter tests → source health → persistence → UI.

Private Codex/Claude skills are operator-private agent instructions. They are **not** Atlasz runtime, not required for a public checkout, and not source connectors. The repo docs may describe the engineering doctrine; private skills live in the user/agent skill system.

## Release Hygiene

Release assets exclude `node_modules`, `.env`, generated databases, logs, caches, local screenshots containing secrets, and untracked Electron output unless a desktop package is explicitly produced.

<div align="center">
<br/>
<sub>Public repo · <a href="https://github.com/gryszzz/Atlasz-Intel">github.com/gryszzz/Atlasz-Intel</a> · Real data only.</sub>
</div>
