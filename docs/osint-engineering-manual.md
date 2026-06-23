# Atlasz OSINT Engineering Manual

Atlasz can learn from the OSINT ecosystem without becoming an unsafe crawler,
identity-enrichment tool, or attack-surface scanner. This manual defines how
OSINT capabilities enter the product.

## Prime Directive

Atlasz only ingests sources through explicit adapters with provenance, source
health, rate/timeout boundaries, and auditable failure states.

When a source is missing, auth-gated, stale, rate-limited, malformed, or outside
scope, Atlasz returns `DATA_UNAVAILABLE`, `PRICE_UNAVAILABLE`, `auth-gated`,
`unavailable`, or `failed`. It does not invent intelligence.

## Ecosystem Lessons

The referenced OSINT projects break into five useful classes:

| Class | Examples | Atlasz posture |
| --- | --- | --- |
| Catalogs | Awesome OSINT, OSINT Framework, GitHub OSINT search | Reference-only. Useful for taxonomy and manual source review. |
| Agent frameworks | LangGraph, CrewAI, AG2, OpenOSINT | Reference-only until Atlasz has typed tool policies and human review points. |
| Threat-intel platforms | OpenCTI | Future auth-gated adapter only. Never verified by default. |
| Recon frameworks | SpiderFoot, Maryam | Reference-only unless there is explicit authorized scope. |
| Harvesters/crawlers | theHarvester, Photon | Not default Atlasz sources. No unbounded crawling or identity harvesting. |

## Adapter Admission Rules

A provider can become a runtime Atlasz adapter only when all of these are true:

- The endpoint is public, official, configured, or explicitly authorized.
- The adapter has deterministic timeout, retry, and rate-limit behavior.
- The adapter returns typed records, not free-form blobs.
- Every record carries `sourceId`, `sourceUrl` where available, timestamp,
  confidence, and provenance.
- The source can fail closed without crashing ingestion.
- The UI can show online, missing config, auth-gated, stale, rate-limited, or
  failed status.
- The adapter does not bypass login, CAPTCHA, paywalls, anti-bot defenses, or
  private endpoints.

## Runtime Categories

### Safe Public Adapter

Used for public no-auth feeds such as GDELT, RSS, public market quote endpoints,
and official public feeds. These are still not verified truth.

Default provenance: `public-unauthenticated`, `rss-public`, or `official-api`.

### Auth-Gated Adapter

Used for APIs requiring keys, tokens, organization endpoints, or operator-owned
instances, such as a future OpenCTI integration.

Default provenance: `auth-gated` until configured; source-specific after
configuration.

### Local Service

Used for local SQLite, local vector memory, Ollama, or deterministic local
analysis. These services may produce `local-derived`, `local-computed`,
`local-model`, or `model-inferred` outputs.

### Reference-Only

Used for broad catalogs, agent frameworks, recon systems, harvesters, and
crawlers. Reference-only means the project can inform architecture, taxonomy,
or manual research, but Atlasz must not run it automatically.

## Agentic OSINT Rules

Agent frameworks can help Atlasz only after the workflow has:

- typed state transitions
- an approved tool allowlist
- human-visible audit records
- bounded target scope
- no autonomous source expansion outside the provider registry
- clear output provenance
- interruption points before network actions

Agent output is never `verified`. It is `local-model` or `model-inferred` until
confirmed by an independent source.

## Recon and Identity-Enrichment Boundary

Tools that enumerate emails, accounts, usernames, subdomains, metadata, exposed
services, or site structure are not default Atlasz market/world-intelligence
sources.

They may be studied for architecture, or used only in a future explicit
authorized-investigation mode with:

- operator-provided target scope
- proof of authorization language in the UI
- rate limits
- logs
- local-only result storage
- no enrichment of unrelated people or organizations

## Engineering Baseline

Before adding a new OSINT source, implement:

- provider config entry
- capability metadata
- adapter or explicit reference-only governance entry
- source health snapshot
- provenance mapping
- timeout/rate-limit handling
- persistence/audit path
- regression tests for missing config, malformed response, slow response, and
  fail-closed behavior

The code contract for the reference catalog lives in
`electron/osint/osintGovernance.ts`.

## Current Atlasz Policy

Default runtime auto-wires zero recon/identity-enrichment OSINT tools.

Current runtime-capable paths remain public/official/local and fail-closed:

- GDELT/RSS/official public event feeds where enabled
- Yahoo/CoinGecko/public exchange metadata where enabled
- SEC EDGAR when `ATLASZ_SEC_USER_AGENT` is configured
- FRED when `ATLASZ_FRED_API_KEY` is configured
- Treasury Fiscal Data
- BLS Public Data API
- BEA NIPA GDP when `ATLASZ_BEA_API_KEY` is configured
- EIA energy series when `ATLASZ_EIA_API_KEY` is configured
- NOAA/NWS active alerts and USGS earthquake events
- CISA KEV, NVD, GHSA, OSV, and CISA advisory defensive feeds
- GitHub Releases for configured public repositories
- OpenAlex Works when `ATLASZ_OPENALEX_API_KEY` is configured
- SQLite WAL / JSON fallback
- local deterministic graph/source analysis
- optional local model parsing when explicitly enabled

Everything else in the corpus remains candidate, auth-gated, reference-only, or
blocked until promoted through the adapter admission rules above. Private
Codex/Claude skills are operator instructions, not Atlasz runtime dependencies.

This is the professional path: fewer hidden tricks, more evidence, clearer
boundaries.
