# Defensive Security Engineering Playbook

This playbook distills the attached cybersecurity, CTI, detection, SOC, DFIR,
OSINT, OPSEC, cloud, container, supply-chain, data, graph, UI, and agent
repository corpus into Atlasz engineering rules.

It is intentionally defensive. Atlasz studies these projects for architecture,
data models, evidence handling, reliability, and analyst workflow. It does not
turn recon, malware, person-enrichment, or cloud/cluster audit tools into
default runtime actions.

The typed contract lives in `src/defensiveSecurityEngineering.ts`.

## Core Rule

Every claim must preserve:

- source URL or source identifier
- retrieval time
- parser or extraction method
- source trust label
- evidence ID
- freshness/staleness state
- confidence and uncertainty

If that chain is missing, the UI should show `DATA_UNAVAILABLE`, `unavailable`,
`stale`, `auth-gated`, or `failed` instead of filling in a story.

## Repository Lessons

| Family | What Atlasz Learns | Default Runtime |
| --- | --- | --- |
| Cybersecurity master lists | Domain taxonomy and capability discovery. | Study-only. |
| CTI platforms | STIX/TAXII-style typed threat graphs and markings. | Auth-gated future adapter only. |
| Detection engineering | Rule-as-code, telemetry requirements, fixture tests. | Candidate library patterns only. |
| SOC/SIEM monitoring | Sensor health, parser errors, alert-to-evidence flow. | Authorized lab only. |
| DFIR/forensics | Chain of custody, immutable evidence, timelines. | Authorized lab only. |
| Malware/reversing | Capability extraction and signature design. | Authorized lab only. |
| Internet mapping/recon | Scope enforcement, rate limits, audit logs. | Authorized lab only. |
| OSINT collection | Source review, provenance, privacy boundaries. | Reference-only. |
| OPSEC/privacy/hardening | Threat models, data minimization, control checks. | Study-only. |
| Cloud security | Inventory graph and least-privilege collection. | Auth-gated future mode only. |
| Container/Kubernetes security | SBOM, vulnerability, config, and runtime profile patterns. | Authorized lab only. |
| Supply-chain security | SBOMs, attestations, signatures, dependency risk. | Candidate library patterns only. |
| Production systems | State, replay, health, observability, compatibility. | Study-only. |
| Real-time data engineering | Backpressure, checkpoints, schema drift, replay. | Study-only patterns. |
| Search/vector systems | Retrieval with citations and metadata filters. | Candidate library patterns only. |
| Knowledge graphs/entity resolution | Typed edges, reversible merges, evidence trails. | Candidate library patterns only. |
| Intelligence dashboards | Dense UI with source lineage and empty/stale states. | Candidate UI patterns only. |
| Agent engineering | Tool allowlists, traces, typed state, human review. | Study-only until policy is built. |

## Reusable Engineering Rules

1. Provenance before analysis.
   Data must be source-trailed before parsers, models, graph mutators, or
   signal engines consume it.

2. Coverage gaps are product state.
   Missing telemetry, stale feeds, dropped packets, malformed records, and
   unsupported sources must be visible.

3. Active tools require authorized scope.
   Recon, vulnerability scanning, cloud audits, cluster probes, and malware
   workflows stay out of default Atlasz runtime.

4. Graph edges need evidence and time.
   Every relationship needs confidence, provenance, validity, and decay rules
   for weak inferred edges.

5. Retrieval is not truth.
   Search and vector similarity suggest candidate evidence; they do not verify
   claims.

6. UI consumes projections, not raw firehoses.
   High-rate streams must flow through workers, buffers, validators, and
   throttled projections.

## Atlasz Improvement Plan

Near-term:

- Add a source lineage drawer to World Radar and Signal panels.
- Make Signal Engine definitions look more like detection rules: required
  inputs, condition, false-positive notes, evidence IDs, positive and negative
  fixtures.
- Extend Data Core with parser errors, source freshness, schema drift, and
  dropped-message counters.

Mid-term:

- Prepare auth-gated OpenCTI/MISP contracts without enabling them by default.
- Add local evidence retrieval with mandatory citations and source trust labels.
- Add graph-path explanations showing each edge, source, confidence, and time.

Later:

- Design a separate authorized defensive lab mode with explicit target scope,
  rate limits, local-only storage, and audit logs.
- Add SBOM/provenance release checks for Atlasz packaging.

## Testing Contract

The regression tests in `test/defensiveSecurityEngineering.test.ts` enforce:

- every studied family has URLs, workflows, data models, failure modes, tests,
  anti-patterns, and Atlasz plans
- active recon, malware handling, and person-enrichment are not default-runtime
  eligible
- auth-gated and authorized-lab families require human review
- reusable rules include concrete validation tests
- Atlasz improvement plans do not silently enable unsafe features

This keeps the agent strong without turning Atlasz into an unbounded security
scanner, scraper, or private-data collector.
