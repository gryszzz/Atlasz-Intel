# Atlasz Improvement Plan — Defensive Security Corpus

Concrete, codebase-grounded work items derived from studying the defensive-security,
detection, DFIR, cloud, supply-chain, streaming, search, graph, and agent
ecosystems (see `docs/defensive-security-corpus.md` and
`src/defensiveSecurityCorpus.ts`). Structured to the
`defensive-security-engineering` skill output contract.

Professional path Atlasz follows:
`source -> evidence -> normalized record -> graph/signal -> UI explanation -> audit trail`.

## repositoryFamilies

CTI platforms (OpenCTI, MISP, Yeti, OpenTAXII, OASIS STIX), detection engineering
(Elastic detection-rules, Splunk security_content, Palantir ADS, OTRF
ThreatHunter/Security-Datasets, signature-base), SOC/endpoint (Wazuh, osquery,
Velociraptor), DFIR (Sleuth Kit, Plaso, GRR), malware RE (Ghidra, radare2, RetDec,
binwalk), recon (Censys), OSINT person tooling (Sherlock, holehe, Toutatis —
blocked), OPSEC/hardening (OWASP ASVS, ScubaGear, dev-sec, konstruktoid), cloud
posture (Prowler, ScoutSuite, CloudQuery, CloudMapper, Cloudsplaining), container
(Trivy, Grype, Syft, kube-bench, Polaris), supply chain (Scorecard, cosign,
in-toto, SLSA, Dependency-Track), streaming (Redpanda, NATS, Pulsar), search
(Typesense, ArangoDB), viz (Cytoscape, deck.gl, ECharts, D3, Superset, Metabase),
agents (Agno).

## architectures

- **Posture-as-read-only-evidence** (Prowler/ScoutSuite/Cloudsplaining): every
  finding links to the authoritative declared data it was derived from; offline
  analysis of exported config beats touching the target. Maps to Atlasz
  `electron/osint/osintGovernance.ts` + `electron/osint/sourceRegistry.ts`: each
  source/connector should carry a derived "posture" (reachable, stale, auth-gated,
  blocked) computed from declared config, not probing.
- **SBOM = provenance artifact** (Syft/Grype/Trivy): "what is actually inside, with
  evidence." The connector registry (`electron/osint/adapterRegistry.ts`,
  `electron/providers/builtinProviderCatalog.ts`) should expose a source-BOM:
  per-source endpoint, auth mode, ToS link, rate policy, provenance tier, last
  success/failure.
- **Append/replay/ordered-offset log** (Redpanda/NATS/Pulsar): already embodied by
  `src/engine/ringBuffer.ts` + `src/engine/realtimeEngine.ts` frame replay. Keep
  the live/replay separation explicit; do not add a broker until in-process
  delivery genuinely fails.

## workflows

- **Detection-as-code** (Elastic/Splunk/ADS): a rule is versioned code that
  declares required telemetry and documents blind spots. Apply to
  `src/engine/signalEngine.ts`: every signal definition declares `requiredInputs`
  and a `blindSpots` note; missing inputs -> `DATA_UNAVAILABLE`, not a silent zero.
- **Hypothesis-driven hunting** (ThreatHunter Playbook): hypothesis -> required
  data -> query -> validation. Apply to research-note / `decisionJournal.ts`
  flows: capture the hypothesis and the evidence IDs that support or refute it.
- **Ordered timeline normalization** (Plaso): heterogeneous events into one ordered
  timeline with a source per event. Reinforces `electron/intel/historicalPlaybookService.ts`
  and `worldIntel.ts` event normalization.

## dataModels

Target normalized record shape (already partly present via `src/provenance.ts`):

```
SourceRecord {
  id, sourceId, observedAt, fetchedAt,
  provenance: ProvenanceId,          // never defaults to 'verified'
  confidence: 0..1,
  tlp?: 'clear'|'green'|'amber'|'red',  // distribution scope (MISP lesson)
  rawRef,                            // pointer to retained raw evidence
  requiredInputsPresent: boolean
}
GraphEdge {
  from, to, type,
  evidenceRefs: string[],           // no edge without evidence
  confidence: 0..1,
  provenance: ProvenanceId,         // model-inferred edges decay
  firstSeen, lastReinforced
}
```

Gaps to close: add `tlp` (distribution scope) and `rawRef` (retained raw evidence)
to source records; ensure `src/engine/intelGraph.ts` / `graphMutator.ts` edges
always carry `evidenceRefs` and reject edges without them.

## securityModels

- Active tools (Censys, kube-hunter, Velociraptor, Wazuh, GRR) require authorized
  scope and stay out of default runtime — enforced by corpus policy + tests.
- Person enrichment (Sherlock/holehe/Toutatis) is `blocked`, full stop.
- Read-only least privilege for any future credentialed adapter; fail closed.
- Data minimization: retain raw evidence pointers, not bulk personal data.

## detectionLogic

- Each signal declares its telemetry contract; absent telemetry is a first-class
  state (`DATA_UNAVAILABLE`), mirroring Splunk content's data-source requirements.
- Source-reliability scoring modeled on OSSF Scorecard: score connectors on
  freshness, success rate, schema stability — surfaced, not hidden.
- Detections ship with blind spots (ADS framework) so coverage gaps are honest.

## ingestionPatterns

Fetch -> validate (schema, like STIX schema validation) -> queue
(`ringBuffer.ts`) -> parse (`cognitiveParser.ts`) -> persist (SQLite WAL / JSON
fallback) -> fail-closed. Add: structural validation step that records *shape
valid but unverified* — validity is not accuracy.

## uiPatterns

- Encode edge confidence/provenance visually (Cytoscape lesson): inferred edges
  must never look verified — extends the existing provenance trust tiers.
- Lead with the analyst question (Metabase/Superset): every panel answers what is
  happening / why / what changed / what evidence / what next.
- Source-health surface: per-connector reachable/stale/auth-gated/blocked with last
  success time (osquery "change is first-class" + Prowler evidence-per-finding).
- Charts label units + source + freshness (ECharts/D3): labeling is correctness.

## failureModes

Stale feeds, missing telemetry, parser errors, duplicate events, wrong entity
merge, auth failure, rate-limit hits, clock skew, dropped frames. Each must map to
a visible state, never a silent zero or a fabricated value. Entity-merge mistakes
must be reversible with an audit trail (entity-resolution discipline).

## tests

- `test/defensiveSecurityCorpus.test.ts` (added): coverage, policy labeling,
  active/person tools out of default runtime, refs not upgraded to truth.
- Follow-ups to add as features land: signal `requiredInputs` -> `DATA_UNAVAILABLE`
  regression; graph edge rejected without `evidenceRefs`; source-BOM completeness;
  provenance never resolves to `verified` via fallback.

## atlaszPlan

**Near-term (low risk, high signal)**

1. Add `requiredInputs` + `blindSpots` to signal definitions in
   `src/engine/signalEngine.ts`; missing inputs render `DATA_UNAVAILABLE`.
2. Add a source-BOM view over `electron/osint/adapterRegistry.ts` /
   `builtinProviderCatalog.ts`: endpoint, auth mode, ToS, rate policy, provenance
   tier, last success/failure. Reuse `summarizeDefensiveCorpus()` posture style.
3. Enforce `evidenceRefs.length > 0` on new edges in `src/engine/graphMutator.ts`;
   add the regression test.

**Mid-term**

4. Add `tlp` (distribution scope) + `rawRef` (retained raw evidence pointer) to the
   normalized source record and persistence schema.
5. Source-reliability scoring (Scorecard-style) on connectors: freshness, success
   rate, schema stability — surfaced in the Data Core health panel.
6. Structural-validation step in ingestion that marks "shape valid, unverified".

**Later**

7. Auth-gated CTI adapter pattern (OpenCTI/OpenTAXII/STIX) behind explicit
   credentials, confidence + TLP preserved, never `verified` by default.
8. Graph UI confidence/provenance visual encoding (Cytoscape lesson) so inferred
   edges are visibly distinct from local-derived/verified.
9. Reversible entity-merge with audit trail before any automated resolution.

Guardrail: defensive security only. Evidence beats narrative. When coverage is
missing or unsafe, Atlasz returns `DATA_UNAVAILABLE` / `auth-gated` / `blocked`
rather than inventing certainty.
