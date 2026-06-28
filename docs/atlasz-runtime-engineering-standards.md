# Atlasz Runtime Engineering Standards

Atlasz should not treat the reference corpus as bookmarks. The corpus becomes
valuable only when its mature patterns shape runtime behavior:

```text
Repositories -> Patterns -> Rules -> Architecture -> Runtime Behavior -> Atlasz
```

This document is the compact operating standard for that translation. It
complements the source catalogs and doctrine docs; it does not add new data
sources by itself.

## Operating Axioms

1. Evidence before analysis.
   A connector must preserve source identity, URL/API endpoint, retrieval time,
   observed time, raw hash or raw payload pointer, provenance, and confidence
   before any graph, signal, summary, or UI panel consumes the record.

2. Unknown is a valid state.
   Missing config, failed fetches, stale feeds, unsupported symbols, malformed
   payloads, and absent telemetry render as `DATA_UNAVAILABLE`, `unavailable`,
   `stale`, `failed`, `auth-gated`, or `PRICE_UNAVAILABLE`. They never become a
   zero, a guessed value, or a simulated replacement.

3. Runtime health is product surface.
   Source health, provider discovery, worker status, frame cadence, retry state,
   persistence mode, freshness, parser errors, and replay/live mode are user
   visible because analysts need coverage awareness.

4. Local computation is not verification.
   Materiality, graph links, search matches, embeddings, signals, and local model
   output are `local-derived`, `local-computed`, `math-derived`,
   `local-model`, or `model-inferred`. They can explain evidence, but cannot
   upgrade source truth.

5. No edge without evidence.
   Entity graph nodes and relationships require evidence references with source
   URL/ID, provenance, confidence, time, and raw hash where available.

6. High-rate data stays off the UI thread.
   Realtime ingestion flows through worker/process boundaries, fixed buffers,
   throttled frames, sampled persistence, and replay records. React receives
   projections, not raw firehoses.

7. Defensive and lawful by default.
   Active recon, scanning, person enrichment, credentialed CTI, malware handling,
   cloud audits, and lab workflows are reference-only or explicit auth/authorized
   modes. They do not run in the default Atlasz desktop runtime.

## Pattern Translation Matrix

| Corpus family | Mature pattern | Atlasz rule | Current anchor |
| --- | --- | --- | --- |
| Grafana / Prometheus / Netdata | Source health, staleness, time-series observability | Every source/service exposes status, freshness, error, and last success. | `SourceHealthView`, `ProviderDiscoveryService`, `RealtimeHealth` |
| OpenCTI / MISP / STIX / TAXII | Typed entities, relationships, markings, evidence trails | Graph facts are typed, sourced, time-bound, confidence-scored, and never source-less. | `entityModel.ts`, `WorldIntelEvent`, `ProvenanceBadge` |
| Kafka / Flink / Redpanda / NATS | Streams, replay, backpressure, recovery | Ingestion uses bounded buffers, throttled frames, sampled durable history, and explicit replay/live state. | `marketIngestionWorker`, `RealTimeDataEngine`, `RealtimeService` |
| Zeek / Suricata / Security Onion | Parser health, signal extraction, fail-closed detections | Signals declare required evidence and missing telemetry yields unavailable state. | `signalEngine.ts`, `materialityEngine.ts` |
| Neo4j / NetworkX / entity-resolution systems | Graph-first relationship modeling | Entity profiles and graph traversal show why a relationship exists and what is still unknown. | `EntityEvidenceGraphPanel`, `EntityDossierPanel` |
| PostgreSQL / SQLite / etcd | Durable local state, WAL, migrations, safe fallback | Local persistence prefers SQLite/WAL, falls back predictably, and reports mode. | `persistence.ts`, Data Core/source health UI |
| OSSF / SBOM / supply-chain systems | Component provenance and source-BOM | Each provider has adapter, endpoint, auth mode, provenance, rate policy, and safety note. | `providerConfig.ts`, `builtinProviderCatalog.ts` |
| Superset / Metabase / Grafana UI | Dense but explainable dashboards | Panels answer what happened, why it matters, evidence, freshness, confidence, and next inspection path. | World intel panels, Quant/FRED cards, source trails |
| LangGraph / agent frameworks | Typed state, tool boundaries, recoverable workflows | Future agents may call only approved adapters and must emit audit/evidence records. | `osintGovernance.ts`, provider registry policy |

## Subsystem Standards

### Provider Registry

Required behavior:

- Provider definitions include ID, label, category, adapter, endpoint, auth type,
  rate limits, timeout, provenance, and legal safety note.
- Unsupported/private/credentialed providers fail closed as `disabled`,
  `auth-gated`, or `missing-config`.
- Health discovery must not leak secrets in persisted endpoint trails.
- Health discovery errors are visible and auditable, not swallowed into "ready".

Do not:

- Auto-wire tools from popularity lists.
- Treat star count, search results, or catalog membership as source reliability.
- Turn reference-only security tools into default background jobs.

### Ingestion And Parsing

Required behavior:

- Fetch through bounded timeout/retry/backoff policy.
- Honor rate-limit state and surface it as `rate-limited`.
- Validate the response shape before normalization.
- Preserve raw evidence where practical and at least store a stable raw hash.
- Deduplicate with stable source-aware keys.
- Record fetch/parse/persistence failure without crashing the ingestion loop.

Do not:

- Replace failed official data with simulated records.
- Infer missing timestamps, values, source URLs, or confidence silently.
- Let parser failures mutate the graph.

### Persistence

Required behavior:

- Prefer local SQLite with WAL.
- Keep JSON fallback behavior explicit and visible.
- Store source audit events for connector start/fail/retry/frame/signal/provider
  discovery/persistence failure.
- Use idempotent writes and stable IDs so replay and refresh are recoverable.
- Keep append/replay records separate from live buffers.

Do not:

- Write raw high-frequency firehose packets directly to SQLite.
- Hide fallback mode from the UI.

### Realtime Data Core

Required behavior:

- Worker-owned ingestion for raw stream packets.
- Fixed-size buffers and batched UI frame publishing.
- Sampled persistence for history, with health metrics describing sampling.
- Clear `LIVE` versus `REPLAY` status and no replay writes into live buffers.
- Public trade feeds and locally computed pressure are labeled as proxies unless
  a true order-book-depth connector exists.

Do not:

- Present trade-flow proxy pressure as verified Level 2 order-book truth.
- Add execution, routing, IOC/SOR, or financial advice behavior.

### Graph And Entity Model

Required behavior:

- Nodes and edges are deterministic projections from events.
- Each node/edge carries evidence refs, provenance, confidence, first seen, last
  observed, freshness, and unknowns.
- `model-inferred` edges decay/purge independently of seed/official/verified
  edges.
- Entity resolution must be reversible or reviewable before it mutates durable
  identity.

Do not:

- Collapse two entities because names are similar without evidence.
- Upgrade local graph inference to `verified`.

### Signals And Materiality

Required behavior:

- A signal is a detection rule: required inputs, condition, evidence IDs,
  confidence, created time, explanation, related graph nodes, blind spots.
- Materiality scoring remains deterministic and `local-derived`.
- Corroboration means independent sources converge on a shared entity/key.
- Missing telemetry produces unavailable state, not weak synthetic scores.

Do not:

- Generate alerts without source trails.
- Let local-model commentary become a signal unless grounded in retrieved
  evidence.

### UI And Analyst Workflow

Required behavior:

- Every card with data shows source, freshness, confidence, provenance, and a
  source trail when a URL exists.
- Empty/loading/error/unavailable states are intentional and visible.
- Dense views should rank the next useful inspection path, not decorate.
- Command palette actions must point to real state or render unavailable.
- Local/simulated/public/auth-gated/verified states must never blur.

Do not:

- Fill panels with placeholder intelligence.
- Show charts without units, source, and freshness.

## Acceptance Gates For Future Work

For any runtime feature or connector:

1. Source contract documented.
2. Lawful acquisition path confirmed.
3. Provenance label chosen from `src/provenance.ts`.
4. Parser tests cover valid, malformed, empty, slow, and unavailable responses.
5. Persistence tests verify durable records and raw/source trail fields.
6. UI tests verify loading/error/unavailable/source/freshness/confidence states.
7. Source health and audit events are emitted.
8. Graph/signal mutations require evidence IDs.
9. `npm run lint`, `npm run build`, `npm test`, and `git diff --check` pass
   before checkpointing.

## Current Runtime Readout

Confirmed strengths in the current codebase:

- Provider-driven source registry with fail-closed configuration.
- Canonical provenance values and UI badges.
- SQLite/WAL persistence with JSON fallback and visible mode.
- SEC EDGAR, SEC Company Facts/Form 4/Form 13F, Market Reference Master, FRED, Treasury Fiscal Data, BLS, BEA, EIA,
  NOAA/NWS, USGS, OpenAlex, and Crossref
  evidence-bearing vertical slices with source trails, confidence, freshness,
  and unavailable states.
- Defensive/security connector slices for CISA KEV, NVD, GHSA, OSV, and CISA
  advisories, kept defensive and source-trailed.
- GitHub Releases as an OSS technology-layer source for configured public repos.
- Realtime worker boundary, frame throttling, sampled persistence, and replay.
- Source Health/Data Core surface with provider discovery and unavailable states.
- Evidence graph and entity dossiers derived from normalized events.
- Deterministic "What Changed Today" materiality ranking with source evidence.

Runtime status rules:

- Runtime-wired means a provider/adapter path exists and is validated; it does
  not mean a local machine has credentials or that the upstream source is
  currently reachable.
- Config-required providers such as SEC, FRED, BEA, and EIA show
  `missing-config` until the operator supplies the required key/User-Agent.
- Optional quota providers such as Congress.gov and OpenAlex run in official
  public/demo modes first; personal keys only raise quota and must not change
  truth confidence.
- Corpus/reference material and private agent skills are not app runtime.
- Future sources such as shipping, aviation, OpenCTI,
  MISP, and premium news stay candidate/auth-gated/reference-only until they
  receive their own evidence-bearing vertical slice.

High-leverage gaps to close next:

- Extend EIA beyond the first allowlist into richer energy demand, inventories,
  generation, and regional context.
- Add `requiredInputs` and `blindSpots` to every signal definition.
- Add parser/schema-drift counters to Source Health.
- Add a source-BOM table view over provider endpoint/auth/rate/provenance fields.
- Enforce evidence refs in any graph mutator path that creates durable edges.
- Add reversible review flow before automated entity merges.
- Add retained raw-evidence pointers where storing full raw payload is too heavy.

The core rule stays simple: if Atlasz cannot show where a claim came from, when
it was seen, how fresh it is, and what confidence/provenance applies, Atlasz must
show an unavailable or review state instead of a story.
