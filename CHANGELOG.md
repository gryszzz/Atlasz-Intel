# Changelog

All notable changes to Atlasz Intel. Real-source intelligence terminal — real data
only, no simulated production data.

## v0.2.0 — Real-Source Intelligence Terminal

Highlights:
- Intelligence synthesis: "What To Watch Next" briefs (observed change → proof →
  resolved entities → curated systems → corroboration → conflicts → unknowns →
  what it does NOT prove → confirmation-seeking watch items, every line basis-labeled).
- Cross-source corroboration (independent overlap, media never counts, stale downgrades)
  and conflict/contradiction detection (ticker↔CIK, CIK↔name, facility coordinates,
  ETF ticker↔CUSIP, operator identity — no silent merge).
- Honesty harness: Connector Dashboard, Market Coverage Dashboard, Market Data Reality
  audit, Connector Super-Hardening audit (docs/connector-hardening-audit.md), and an
  upgraded runtime verification pass (freshest/oldest record, coverage, eligibility,
  corroboration/conflict counts).
- Freshness hardening: canonical freshness model (live/fresh/cached/stale/expired/
  missing-key/unavailable/rate-limited) + "What Changed Today" now excludes static/
  annual reference data unless change-tracked today.
- Geospatial core + energy/trade/materials connectors: EIA power plants, refineries,
  LNG (guarded), nuclear (EIA facility + NRC reactor status), grid regions/balancing
  authorities, ports (UN/LOCODE + World Port Index), USGS minerals; critical-minerals
  curated crosswalk.
- Market data made real: key-gated equity/ETF quote provider (Alpaca, live-wired into
  the worker) + options chain/open interest provider; seeded/default market data gated
  out of production (no fake prices, PRICE_UNAVAILABLE until a real quote).
- Existing market/company/macro/policy/cyber/research connectors retained: SEC EDGAR,
  Company Facts, Form 4, 13F, Market Reference, ETF Holdings, FRED, Treasury, BLS, BEA,
  EIA, Federal Register, OFAC, Congress.gov, NOAA, USGS earthquakes, CISA KEV, NVD,
  GHSA, OSV, CISA advisories, USPTO, GitHub Releases, OpenAlex, Crossref, GDELT (media).

Connector matrix (see docs/connector-hardening-audit.md for the live table):
- Public (fetch live, no key): SEC Reference/EDGAR, ETF Holdings, Treasury, BLS,
  Federal Register, OFAC, NOAA, USGS earthquakes, CISA KEV/advisories, NVD, GHSA, OSV,
  GitHub Releases, Crossref, NRC reactor status.
- Key-gated (require .env, fail closed → missing-key): EIA (+ power plants / nuclear /
  grid), BEA, FRED, USPTO, OpenAlex, Congress.gov, UN Comtrade, Alpaca equity/ETF
  quotes + options, SEC User-Agent.
- Configured-only (need an operator-pinned official endpoint → DATA_UNAVAILABLE until
  set): LNG terminals, UN/LOCODE, USGS minerals (USMIN/MRDS), and the World Port
  Index / EIA refinery ArcGIS endpoints when the default is unreachable.

Contracts & boundaries:
- Real data only. No simulated/seeded production data, no random-walk price fallback,
  no fabricated causality, no AI-generated evidence.
- Every claim traces to live/source-backed evidence, curated-reference structure,
  explicitly labeled inference/rule, or unknown.
- NOT financial, legal, sanctions, or trading advice. No price prediction, no trade
  execution. Curated structure is reference, never live impact. Media observation is
  never verified fact.

Known limits:
- Keyed connectors require a `.env` (see `.env.example`); without keys they report
  missing-key and render DATA_UNAVAILABLE.
- Configured-only facility datasets require official endpoint URLs.
- GDELT may rate-limit (shown as rate-limited, never replaced with fake data).
- Options provider live-wiring is deferred (built + tested; reports `deferred`).
- Some source-trail cards still show raw retrievedAt/staleAt rather than the new
  canonical freshness label (incremental adoption).

## v0.1.0

- Initial local-first world intelligence command center: market context, public event
  streams, entity graph, research notes, and the first connector slices.
