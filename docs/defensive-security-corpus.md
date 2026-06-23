# Defensive Security Corpus

Atlasz studies the defensive-security, detection-engineering, SOC/SIEM, DFIR,
malware-RE, cloud/container/supply-chain, and intelligence-platform ecosystems to
sharpen its engineering — not to become a scanner, harvester, or attack tool.

This corpus is the typed companion to `src/defensiveSecurityCorpus.ts` and its
test `test/defensiveSecurityCorpus.test.ts`. It is deliberately **disjoint** from
`src/agentMasteryCorpus.ts` and `electron/osint/osintGovernance.ts`: tools already
catalogued there (Sigma, Zeek, Suricata, Security Onion, the ProjectDiscovery
recon suite, Volatility, capa/FLOSS, Neo4j, Qdrant, Airflow, Kafka, the agent
frameworks, OpenCTI as a future adapter) are referenced by domain, not repeated.

## Why these repositories

The list maps the operational backbone of defensive intelligence work. Atlasz
extracts the *engineering* — data models, evidence trails, observability,
reliability, entity relationships — and rejects the *operations* (active probing,
endpoint acquisition, person enrichment, malware execution) from default runtime.

## Policy model

Mirrors the rest of the codebase. Only two policies are default-safe:

| Policy | Meaning | Default-safe |
| --- | --- | --- |
| `study-only` | Architecture/lesson reference; no code path. | yes |
| `allowed-library` | May inform local, evidence-preserving features. | yes |
| `manual-review` | Needs explicit per-use review before any wiring. | no |
| `auth-required` | Credentialed/ToS-bound; fails closed by default. | no |
| `commercial-terms` | License/commercial gate. | no |
| `authorized-lab-only` | Owned/authorized lab environment only. | no |
| `blocked` | Never runs in Atlasz; studied as a boundary. | no |

Active scanning, endpoint agents, forensic acquisition, malware handling, and
person enrichment are **never** silently promoted into runtime behavior. The test
suite enforces this: person-enrichment tooling is `blocked`, CTI platforms are
`auth-required` and never "verified by default", and SBOM/detection references
stay `study-only`/`allowed-library` without being upgraded to truth.

## Engineering priorities encoded

`DEFENSIVE_ENGINEERING_PRIORITIES` pins the seven lenses every lesson advances:

1. **defensive-security** — study attacks only to build defenses and honest labels.
2. **source-validation** — provenance, freshness, and confidence on every record.
3. **real-time-data** — append/replay/ordered-offset thinking over heavy infra.
4. **evidence-trails** — SBOM/attestation discipline applied to data lineage.
5. **observability** — addressable state, first-class change, declared blind spots.
6. **entity-relationships** — typed, sourced, decaying edges; reachability ≠ cause.
7. **reliable-engineering** — fail-closed defaults, leveled honesty (SLSA-style).

## Lessons that change Atlasz

- **CTI platforms (OpenCTI, MISP, Yeti, OpenTAXII, STIX schemas)**: model typed,
  versioned, confidence-scored, TLP-bounded relationships. Provenance includes
  *distribution scope*, not just origin. Validity of shape ≠ accuracy of content.
- **Detection engineering (Elastic rules, Splunk content, ADS, ThreatHunter,
  Security-Datasets)**: detections are versioned, tested code that *declare the
  telemetry they need* and *document their blind spots*. Atlasz signals should do
  the same and degrade to `DATA_UNAVAILABLE` when inputs are missing.
- **SOC/endpoint (Wazuh, osquery, Velociraptor)**: expose state as addressable,
  queryable tables; make change first-class; require consent + scope as part of
  the architecture, not a bolt-on.
- **DFIR (Sleuth Kit, Plaso, GRR)**: preserve original artifacts, hashes, and
  acquisition metadata before any derived analysis; normalize heterogeneous events
  into one ordered timeline with a source per event.
- **Malware RE (Ghidra, radare2, RetDec, binwalk)**: derived representations
  (decompilation, carving) are hypotheses requiring verification — they never run
  in app runtime and stay inside an isolated lab.
- **Cloud posture (Prowler, ScoutSuite, CloudQuery, CloudMapper, Cloudsplaining)**:
  derive findings from *authoritative declared config* with read-only least
  privilege, link evidence to every finding, and prefer offline analysis (analyze
  exported policy JSON) over touching the target.
- **Container/supply-chain (Trivy, Grype, Syft, kube-bench, Polaris; Scorecard,
  cosign, in-toto, SLSA, Dependency-Track)**: an SBOM is a provenance artifact;
  signatures are what *earn* the word "verified"; integrity is leveled and honest.
- **Streaming (Redpanda, NATS, Pulsar)**: event-log thinking (append, replay,
  ordered offsets, separation of live vs replay) matters more than the broker.
- **Search/graph/viz (Typesense, ArangoDB, Cytoscape, deck.gl, ECharts, D3,
  Superset, Metabase)**: keep source IDs on every indexed doc; encode edge
  confidence and uncertainty visually; lead with the analyst question.

## Boundaries restated

- Never fabricate data; label `DATA_UNAVAILABLE` instead of inventing certainty.
- Never bypass access controls, paywalls, logins, or CAPTCHAs.
- Never evade rate limits; respect ToS, quotas, and backoff.
- Never collect private or person-targeted data by default.

See `docs/atlasz-improvement-plan.md` for how these lessons turn into concrete,
codebase-grounded work items.
