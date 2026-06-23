/*
 * Defensive-security engineering corpus for Atlasz.
 *
 * This catalog distills the defensive-security, detection-engineering, SOC/SIEM,
 * DFIR, malware-RE, cloud/container/supply-chain, and intelligence-platform
 * ecosystems into reusable engineering lessons WITHOUT promoting any of them into
 * default Atlasz runtime behavior. It is deliberately disjoint from
 * `agentMasteryCorpus.ts` and `osint/osintGovernance.ts`: entries already covered
 * there (Sigma, Zeek, Suricata, Security Onion, OpenCTI as an adapter, the
 * ProjectDiscovery recon suite, Volatility, capa, FLOSS, Neo4j, Qdrant, Airflow,
 * Kafka, the agent frameworks, etc.) are referenced by domain, not duplicated.
 *
 * Policy model mirrors the rest of the codebase:
 *   - study-only / allowed-library are the only DEFAULT-SAFE policies.
 *   - auth-required, manual-review, commercial-terms, authorized-lab-only, and
 *     blocked never become silent runtime sources.
 * Active scanning, endpoint agents, person enrichment, malware handling, and
 * forensic acquisition are never default Atlasz actions.
 */

export type DefensiveDomainId =
  | 'cti-platform'
  | 'cti-data-model'
  | 'detection-engineering'
  | 'soc-siem-endpoint'
  | 'dfir-forensics'
  | 'malware-reverse-engineering'
  | 'recon-discovery'
  | 'osint-collection'
  | 'opsec-hardening'
  | 'cloud-security-posture'
  | 'container-k8s-security'
  | 'supply-chain-integrity'
  | 'streaming-eventing'
  | 'search-retrieval'
  | 'graph-visualization'
  | 'agent-engineering'

export type DefensiveRuntimePolicy =
  | 'study-only'
  | 'allowed-library'
  | 'manual-review'
  | 'auth-required'
  | 'commercial-terms'
  | 'authorized-lab-only'
  | 'blocked'

export type DefensiveRiskTag =
  | 'cti-data'
  | 'detection-rule'
  | 'defensive-sensor'
  | 'endpoint-agent'
  | 'forensic-evidence'
  | 'malware-handling'
  | 'active-scan'
  | 'person-enrichment'
  | 'hardening-baseline'
  | 'cloud-credential'
  | 'container-scan'
  | 'supply-chain'
  | 'streaming-infra'
  | 'search-index'
  | 'graph-viz'
  | 'agent-orchestration'
  | 'public-api'
  | 'engineering-reference'

/**
 * The defensive-engineering priorities the user asked Atlasz to internalize.
 * Every entry's `engineeringLesson` should advance at least one of these.
 */
export const DEFENSIVE_ENGINEERING_PRIORITIES = [
  'defensive-security',
  'source-validation',
  'real-time-data',
  'evidence-trails',
  'observability',
  'entity-relationships',
  'reliable-engineering',
] as const

export type DefensiveCorpusEntry = {
  id: string
  label: string
  upstreamUrl: string
  domainId: DefensiveDomainId
  runtimePolicy: DefensiveRuntimePolicy
  riskTags: DefensiveRiskTag[]
  /** Defensive/architectural capabilities worth studying. */
  capabilities: string[]
  /** Uses that must never be silently enabled in Atlasz. */
  blockedUses: string[]
  /** One reusable engineering rule, written for the Atlasz trust model. */
  engineeringLesson: string
}

export const DEFENSIVE_SECURITY_CORPUS: DefensiveCorpusEntry[] = [
  // --- CTI platforms (auth-gated; intel is never verified by default) ---
  e('opencti', 'OpenCTI', 'https://github.com/OpenCTI-Platform/opencti', 'cti-platform', 'auth-required', ['cti-data', 'public-api'], ['STIX-native knowledge graph', 'connector-based ingestion', 'confidence + TLP on every object'], ['presenting imported intel as verified ground truth', 'pulling private CTI without credentials and operator approval'], 'Threat-intel platforms model typed, versioned, confidence-scored relationships; Atlasz should mirror confidence + TLP, never collapse intel into truth.'),
  e('misp', 'MISP', 'https://github.com/MISP/MISP', 'cti-platform', 'auth-required', ['cti-data'], ['IOC correlation', 'sharing groups + TLP enforcement', 'event/object/attribute model'], ['redistributing restricted-TLP indicators', 'auto-trusting community feeds'], 'Sharing models teach that provenance includes distribution scope: an indicator carries who may see it, not just what it is.'),
  e('yeti', 'Yeti', 'https://github.com/yeti-platform/yeti', 'cti-platform', 'auth-required', ['cti-data'], ['observable repository', 'linking TTPs to observables', 'enrichment pipelines'], ['auto-enriching observables against third-party services without review'], 'Linking observables to TTPs is graph work: keep edges typed, sourced, and decaying like Atlasz model-inferred edges.'),
  e('opentaxii', 'OpenTAXII', 'https://github.com/eclecticiq/OpenTAXII', 'cti-platform', 'auth-required', ['cti-data', 'public-api'], ['TAXII collections + polling', 'pull/subscribe intel sharing', 'server-side access control'], ['polling collections without authorization or rate discipline'], 'Sharing protocols teach pull-based, access-controlled, paginated intel exchange — a clean template for future auth-gated Atlasz adapters.'),

  // --- CTI data models (typed schemas; safe to study/use) ---
  e('cti-stix2-json-schemas', 'OASIS STIX 2 JSON Schemas', 'https://github.com/oasis-open/cti-stix2-json-schemas', 'cti-data-model', 'allowed-library', ['cti-data', 'engineering-reference'], ['typed threat objects', 'relationship + sighting modeling', 'object versioning'], ['treating schema validity as factual accuracy'], 'A validated schema proves shape, not truth; Atlasz records should validate structurally and still carry provenance + confidence.'),
  e('cti-python-stix2', 'OASIS cti-python-stix2', 'https://github.com/oasis-open/cti-python-stix2', 'cti-data-model', 'allowed-library', ['cti-data', 'engineering-reference'], ['STIX object construction/parsing', 'bundle validation', 'versioned references'], ['emitting STIX that drops source/confidence fields'], 'Producing well-formed intelligence objects forces explicit identity, created_by, and confidence — the same discipline Atlasz needs on every event.'),

  // --- Detection engineering (detection-as-code; needs telemetry validation) ---
  e('elastic-detection-rules', 'Elastic Detection Rules', 'https://github.com/elastic/detection-rules', 'detection-engineering', 'allowed-library', ['detection-rule', 'engineering-reference'], ['detection-as-code', 'rule schema + unit tests', 'ATT&CK mapping per rule'], ['shipping detections without test data or false-positive analysis'], 'Detections are versioned, tested code with ATT&CK mappings; the same rigor applies to Atlasz source-reliability and signal rules.'),
  e('splunk-security-content', 'Splunk Security Content', 'https://github.com/splunk/security_content', 'detection-engineering', 'allowed-library', ['detection-rule', 'engineering-reference'], ['analytic stories', 'detection content with data-source requirements', 'normalized data models'], ['claiming a detection fires without the required data source present'], 'Every detection declares the telemetry it needs; Atlasz signals should declare required inputs and degrade to DATA_UNAVAILABLE when absent.'),
  e('signature-base', 'Neo23x0 signature-base', 'https://github.com/Neo23x0/signature-base', 'detection-engineering', 'manual-review', ['detection-rule', 'malware-handling'], ['curated YARA/IOC signatures', 'false-positive notes', 'rule metadata discipline'], ['scanning untrusted samples without a sandbox policy'], 'High-quality signatures pair patterns with FP notes and references; rules without provenance and FP context are liabilities.'),
  e('threathunter-playbook', 'OTRF ThreatHunter Playbook', 'https://github.com/OTRF/ThreatHunter-Playbook', 'detection-engineering', 'study-only', ['detection-rule', 'engineering-reference'], ['hypothesis-driven hunting', 'data dictionaries', 'reproducible notebooks'], ['turning hunt hypotheses into automated unsupervised scans'], 'Hunting is hypothesis -> required data -> query -> validation; Atlasz analyst flows should make the hypothesis and its evidence explicit.'),
  e('security-datasets', 'OTRF Security Datasets', 'https://github.com/OTRF/Security-Datasets', 'detection-engineering', 'study-only', ['detection-rule', 'engineering-reference'], ['labeled telemetry for detection validation', 'reproducible test corpora'], ['treating sample datasets as live evidence'], 'Detections need labeled datasets to measure recall/precision; Atlasz signal logic deserves the same offline test corpora before trust.'),
  e('alerting-detection-strategy', 'Palantir ADS Framework', 'https://github.com/palantir/alerting-detection-strategy-framework', 'detection-engineering', 'study-only', ['detection-rule', 'engineering-reference'], ['structured detection docs: goal, strategy, blind spots, FP, validation', 'priority + response'], ['deploying alerts without documented blind spots and validation'], 'A detection is incomplete without its blind spots and false-positive story; Atlasz signals should ship with stated coverage gaps.'),

  // --- SOC / SIEM / endpoint telemetry (consent + authorization required) ---
  e('wazuh', 'Wazuh', 'https://github.com/wazuh/wazuh', 'soc-siem-endpoint', 'authorized-lab-only', ['defensive-sensor', 'endpoint-agent'], ['host IDS', 'file integrity monitoring', 'agent fleet + log analysis'], ['deploying agents on hosts without owner authorization'], 'Endpoint telemetry is high-trust, consent-bound collection; the architecture (agent -> normalize -> correlate -> alert) is a clean local-first ingestion model.'),
  e('osquery', 'osquery', 'https://github.com/osquery/osquery', 'soc-siem-endpoint', 'authorized-lab-only', ['defensive-sensor', 'endpoint-agent'], ['SQL over endpoint state', 'scheduled differential queries', 'host telemetry as tables'], ['querying endpoints without consent', 'treating snapshots as continuous truth'], 'Exposing system state as queryable tables with diffs is elegant; observability is most useful when state is addressable and change is first-class.'),
  e('velociraptor', 'Velociraptor', 'https://github.com/Velocidex/velociraptor', 'soc-siem-endpoint', 'authorized-lab-only', ['defensive-sensor', 'forensic-evidence', 'endpoint-agent'], ['fleet-wide visibility (VQL)', 'live DFIR collection', 'hunt orchestration'], ['live collection from endpoints without explicit authorization'], 'Scaling evidence collection demands consent, scope, and chain-of-custody; capability without authorization is the failure mode.'),

  // --- DFIR / forensics (lab-only; chain-of-custody) ---
  e('sleuthkit', 'The Sleuth Kit', 'https://github.com/sleuthkit/sleuthkit', 'dfir-forensics', 'authorized-lab-only', ['forensic-evidence'], ['file-system forensics', 'deleted-file recovery', 'timeline building'], ['analyzing disk images without authorization or custody records'], 'Forensic timelines are evidence; preserve original artifacts, hashes, and acquisition metadata before any derived analysis.'),
  e('plaso', 'Plaso / log2timeline', 'https://github.com/log2timeline/plaso', 'dfir-forensics', 'authorized-lab-only', ['forensic-evidence'], ['super-timeline construction', 'multi-source event normalization', 'parser plugins'], ['merging private artifacts without authorization'], 'Normalizing heterogeneous events into one ordered timeline (with source per event) is the core temporal-evidence pattern Atlasz should reuse.'),
  e('grr', 'GRR Rapid Response', 'https://github.com/google/grr', 'dfir-forensics', 'authorized-lab-only', ['forensic-evidence', 'endpoint-agent'], ['remote live forensics', 'fleet collection flows', 'artifact-driven acquisition'], ['remote acquisition without consent', 'storing PII without retention policy'], 'Remote acquisition frameworks teach explicit flows, approvals, and audit; the approval gate is part of the architecture, not a bolt-on.'),

  // --- Malware / reverse engineering (authorized lab only) ---
  e('ghidra', 'Ghidra', 'https://github.com/NationalSecurityAgency/ghidra', 'malware-reverse-engineering', 'authorized-lab-only', ['malware-handling'], ['disassembly + decompilation', 'program analysis', 'collaborative RE'], ['executing or analyzing untrusted binaries outside an isolated lab'], 'Static RE turns binaries into reviewable structure; sample handling still requires isolation and never runs in app runtime.'),
  e('radare2', 'radare2', 'https://github.com/radareorg/radare2', 'malware-reverse-engineering', 'authorized-lab-only', ['malware-handling'], ['binary analysis framework', 'scripting + automation of RE'], ['processing untrusted samples on non-isolated machines'], 'Scriptable RE shows the value of composable analysis primitives; containment is a precondition, not an option.'),
  e('retdec', 'RetDec', 'https://github.com/avast/retdec', 'malware-reverse-engineering', 'authorized-lab-only', ['malware-handling'], ['retargetable decompilation', 'machine-code to high-level reconstruction'], ['decompiling samples without sandboxing or rights review'], 'Decompiler output is an approximation requiring verification — a reminder that derived representations are hypotheses, not source truth.'),
  e('binwalk', 'binwalk', 'https://github.com/ReFirmLabs/binwalk', 'malware-reverse-engineering', 'authorized-lab-only', ['malware-handling'], ['firmware extraction', 'embedded-file carving', 'entropy analysis'], ['extracting/analyzing firmware without authorization'], 'Carving structure out of opaque blobs is powerful triage, but extraction is collection and stays inside an authorized lab.'),

  // --- Recon / discovery (auth + scope; active probing is never default) ---
  e('censys-python', 'Censys Python', 'https://github.com/censys/censys-python', 'recon-discovery', 'auth-required', ['public-api', 'active-scan'], ['internet-scan data via API', 'host/certificate search', 'attack-surface research'], ['bulk export beyond API terms', 'treating scan snapshots as current verified state'], 'Internet-measurement APIs are useful passive context, but they are auth/quota/ToS-bound and time-stamped, never live ground truth.'),

  // --- OSINT person tooling (blocked from default runtime) ---
  e('sherlock', 'Sherlock', 'https://github.com/sherlock-project/sherlock', 'osint-collection', 'blocked', ['person-enrichment'], ['username-enumeration boundary study'], ['default runtime execution', 'third-party identity enumeration'], 'Username enumeration is person-data collection and stays fully out of Atlasz runtime; study the boundary, not the action.'),
  e('holehe', 'holehe', 'https://github.com/megadose/holehe', 'osint-collection', 'blocked', ['person-enrichment'], ['email-to-account boundary study'], ['checking whether an email is registered on services', 'any person enrichment by default'], 'Email-to-account checking targets individuals; it is blocked regardless of how public the technique appears.'),
  e('toutatis', 'Toutatis', 'https://github.com/megadose/toutatis', 'osint-collection', 'blocked', ['person-enrichment'], ['account-metadata extraction boundary study'], ['extracting personal account metadata', 'identity targeting'], 'Pulling account metadata about people is privacy-sensitive and blocked; Atlasz studies the risk, never the collection.'),

  // --- OPSEC / hardening baselines (study/reference) ---
  e('owasp-asvs', 'OWASP ASVS', 'https://github.com/OWASP/ASVS', 'opsec-hardening', 'study-only', ['hardening-baseline', 'engineering-reference'], ['leveled security requirements', 'verification checklists', 'testable controls'], ['treating a checklist as a complete security program'], 'Security requirements should be explicit, leveled, and testable; ASVS is a prompt list for Atlasz secure-coding review, not proof.'),
  e('scubagear', 'CISA ScubaGear', 'https://github.com/cisagov/ScubaGear', 'opsec-hardening', 'study-only', ['hardening-baseline', 'cloud-credential'], ['M365 secure-config assessment', 'policy-as-baseline checks', 'read-only posture reports'], ['running assessments against tenants without authorization'], 'Config baselines as automated, read-only checks turn hardening into observable posture rather than a one-time audit.'),
  e('dev-sec-hardening', 'dev-sec hardening collection', 'https://github.com/dev-sec/ansible-collection-hardening', 'opsec-hardening', 'study-only', ['hardening-baseline', 'engineering-reference'], ['CIS-aligned hardening as code', 'idempotent baselines', 'documented controls'], ['applying baselines blindly without environment review'], 'Hardening-as-code makes secure defaults reproducible and reviewable, the same posture Atlasz takes with fail-closed connectors.'),
  e('konstruktoid-hardening', 'konstruktoid hardening', 'https://github.com/konstruktoid/hardening', 'opsec-hardening', 'study-only', ['hardening-baseline'], ['host hardening scripts', 'documented secure defaults'], ['running hardening scripts on systems you do not own'], 'Secure defaults are an engineering responsibility; the safest path should also be the default path.'),
  e('awesome-cybersecurity-blueteam', 'Awesome Cybersecurity Blue Team', 'https://github.com/fabacab/awesome-cybersecurity-blueteam', 'opsec-hardening', 'study-only', ['engineering-reference', 'defensive-sensor'], ['blue-team capability taxonomy', 'defensive tool landscape'], ['auto-installing listed defensive tools'], 'Defensive lists are maps of capability classes; selection still requires a threat model and per-tool review.'),

  // --- Cloud security posture (read-only credentials; offline analysis preferred) ---
  e('prowler', 'Prowler', 'https://github.com/prowler-cloud/prowler', 'cloud-security-posture', 'auth-required', ['cloud-credential'], ['multi-cloud posture assessment', 'check catalog with severities', 'read-only auditing'], ['scanning accounts without authorization', 'using write-capable credentials'], 'Posture tools assume least-privilege read-only access and produce evidence-linked findings; that evidence-per-finding model is exactly Atlasz source trails.'),
  e('scoutsuite', 'ScoutSuite', 'https://github.com/nccgroup/ScoutSuite', 'cloud-security-posture', 'auth-required', ['cloud-credential'], ['multi-cloud configuration auditing', 'risk reporting from API metadata'], ['auditing environments without explicit authorization'], 'Cloud audits derive findings from declared configuration, not probing; deriving signal from authoritative metadata beats active testing.'),
  e('cloudquery', 'CloudQuery', 'https://github.com/cloudquery/cloudquery', 'cloud-security-posture', 'auth-required', ['cloud-credential', 'engineering-reference'], ['cloud asset inventory to SQL', 'pluggable source/destination', 'queryable infrastructure state'], ['inventorying accounts without authorization'], 'Turning infrastructure state into queryable, normalized tables is a strong asset-graph pattern Atlasz can reuse for source/connector inventory.'),
  e('cloudmapper', 'CloudMapper', 'https://github.com/duo-labs/cloudmapper', 'cloud-security-posture', 'auth-required', ['cloud-credential', 'graph-viz'], ['AWS network/asset visualization', 'reachability analysis from config'], ['mapping environments without authorization'], 'Visualizing reachability from authoritative config shows that the best graphs are derived from declared relationships, not guessed ones.'),
  e('cloudsplaining', 'Cloudsplaining', 'https://github.com/salesforce/cloudsplaining', 'cloud-security-posture', 'allowed-library', ['engineering-reference'], ['offline IAM least-privilege analysis', 'policy JSON risk triage', 'exclusions/triage workflow'], ['treating findings as exploit confirmation'], 'Analyzing exported policy JSON offline (no live calls) is the safest posture pattern: reason over authoritative data without touching the target.'),

  // --- Container / Kubernetes / image security ---
  e('trivy', 'Trivy', 'https://github.com/aquasecurity/trivy', 'container-k8s-security', 'allowed-library', ['container-scan', 'supply-chain'], ['vuln/misconfig/secret scanning', 'SBOM input/output', 'IaC + image + repo targets'], ['treating a clean scan as proof of safety'], 'Scanners give evidence with versioned databases and timestamps; a finding (or its absence) is dated context, not a permanent guarantee.'),
  e('grype', 'Grype', 'https://github.com/anchore/grype', 'container-k8s-security', 'allowed-library', ['container-scan', 'supply-chain'], ['SBOM-driven vulnerability matching', 'fixed-version guidance', 'machine-readable output'], ['ignoring SBOM provenance when reporting findings'], 'Vulnerability matching is only as trustworthy as the SBOM and CVE DB behind it; always surface the source and freshness of the match.'),
  e('syft', 'Syft', 'https://github.com/anchore/syft', 'container-k8s-security', 'allowed-library', ['supply-chain', 'engineering-reference'], ['SBOM generation', 'dependency cataloging', 'multiple BOM formats'], ['publishing SBOMs that omit source/version provenance'], 'A bill of materials is a provenance artifact: it answers "what is actually inside" with evidence — the dependency analogue of Atlasz source trails.'),
  e('kube-bench', 'kube-bench', 'https://github.com/aquasecurity/kube-bench', 'container-k8s-security', 'allowed-library', ['hardening-baseline'], ['CIS Kubernetes benchmark checks', 'pass/fail/warn posture', 'remediation references'], ['running benchmarks against clusters without authorization'], 'Benchmark-as-code converts a standard into repeatable posture checks with explicit remediation, not opinion.'),
  e('kube-hunter', 'kube-hunter', 'https://github.com/aquasecurity/kube-hunter', 'container-k8s-security', 'authorized-lab-only', ['active-scan'], ['Kubernetes attack-surface discovery study'], ['active cluster probing outside an owned lab'], 'Active discovery against clusters is an authorized-lab operation, never a background default.'),
  e('polaris', 'Polaris', 'https://github.com/FairwindsOps/polaris', 'container-k8s-security', 'allowed-library', ['hardening-baseline', 'engineering-reference'], ['workload best-practice validation', 'admission + dashboard checks', 'policy-as-config'], ['enforcing policies without environment review'], 'Validating declarative config against best-practice policy is cheap, safe, and continuous — the opposite of one-off manual review.'),

  // --- Supply-chain integrity (provenance/attestation; safe to study/use) ---
  e('ossf-scorecard', 'OSSF Scorecard', 'https://github.com/ossf/scorecard', 'supply-chain-integrity', 'allowed-library', ['supply-chain', 'engineering-reference'], ['automated repo security-health checks', 'scored signals with rationale', 'dependency risk triage'], ['treating a score as a guarantee of safety'], 'Scorecard turns "is this dependency healthy" into evidence-backed signals; Atlasz should score its own connectors/sources the same way.'),
  e('ossf-allstar', 'OSSF Allstar', 'https://github.com/ossf/allstar', 'supply-chain-integrity', 'study-only', ['supply-chain', 'engineering-reference'], ['policy enforcement across repos', 'continuous compliance signals'], ['enforcing policy without owner buy-in'], 'Continuous policy enforcement beats periodic audits; encode the rule once and let it observe drift.'),
  e('ossf-package-analysis', 'OSSF Package Analysis', 'https://github.com/ossf/package-analysis', 'supply-chain-integrity', 'study-only', ['supply-chain', 'malware-handling'], ['sandboxed package behavior analysis', 'install/runtime behavior capture'], ['executing untrusted packages outside a sandbox'], 'Behavioral analysis of dependencies belongs in a sandbox; supply-chain trust requires watching what code does, not just what it claims.'),
  e('dependency-track', 'Dependency-Track', 'https://github.com/DependencyTrack/dependency-track', 'supply-chain-integrity', 'auth-required', ['supply-chain'], ['SBOM ingestion + component intelligence', 'continuous vuln monitoring', 'policy + audit trail'], ['exposing internal component inventories without access control'], 'Continuous SBOM monitoring shows component risk changes over time; provenance + freshness must be tracked, not assumed static.'),
  e('sigstore-cosign', 'Sigstore Cosign', 'https://github.com/sigstore/cosign', 'supply-chain-integrity', 'allowed-library', ['supply-chain', 'engineering-reference'], ['artifact signing + verification', 'transparency-log backing', 'attestation attachment'], ['trusting unsigned/unverified artifacts in a release path'], 'Signature verification is the mechanism that earns "verified": a label Atlasz reserves precisely because it requires cryptographic, auditable proof.'),
  e('in-toto', 'in-toto', 'https://github.com/in-toto/in-toto', 'supply-chain-integrity', 'allowed-library', ['supply-chain', 'engineering-reference'], ['supply-chain step attestation', 'end-to-end provenance', 'tamper-evident link metadata'], ['claiming provenance without signed attestation'], 'in-toto formalizes "who did what, in what order, verifiably" — the gold standard for the evidence trail Atlasz aspires to on data lineage.'),
  e('slsa', 'SLSA Framework', 'https://github.com/slsa-framework/slsa', 'supply-chain-integrity', 'study-only', ['supply-chain', 'engineering-reference'], ['leveled supply-chain integrity model', 'provenance requirements per level', 'threat-to-control mapping'], ['claiming a SLSA level without meeting its requirements'], 'A leveled integrity framework lets you state honestly where you are; Atlasz provenance tiers are the data-trust analogue of SLSA levels.'),

  // --- Streaming / eventing (real-time backbone references) ---
  e('redpanda', 'Redpanda', 'https://github.com/redpanda-data/redpanda', 'streaming-eventing', 'study-only', ['streaming-infra', 'engineering-reference'], ['Kafka-compatible streaming', 'simplified single-binary ops', 'low-latency log'], ['adding a broker before local queues/ring buffers are exhausted'], 'Event-log thinking (append, replay, ordered offsets) matters more than the broker; Atlasz already lives this with ring buffers and frame replay.'),
  e('nats', 'NATS Server', 'https://github.com/nats-io/nats-server', 'streaming-eventing', 'study-only', ['streaming-infra', 'engineering-reference'], ['subject-based messaging', 'JetStream persistence', 'lightweight pub/sub'], ['introducing a message bus where a function call suffices'], 'Lightweight subject-based messaging shows decoupling can be cheap; reach for it only when in-process delivery genuinely no longer fits.'),
  e('pulsar', 'Apache Pulsar', 'https://github.com/apache/pulsar', 'streaming-eventing', 'study-only', ['streaming-infra', 'engineering-reference'], ['multi-tenant messaging', 'tiered storage', 'separation of compute/storage'], ['over-engineering local-first pipelines with multi-tenant infra'], 'Separating serving from storage (and replay from live) is a durable pattern; Atlasz separates ingestion, ring buffers, and persistence for the same reason.'),

  // --- Search / retrieval (local-friendly, evidence-preserving) ---
  e('typesense', 'Typesense', 'https://github.com/typesense/typesense', 'search-retrieval', 'allowed-library', ['search-index', 'engineering-reference'], ['typo-tolerant instant search', 'lightweight local deployment', 'faceted retrieval'], ['indexing records without retaining source IDs', 'using the index as source of truth'], 'Fast local search is a strong local-first fit, but every indexed document must keep its source ID so results stay rebuildable and trail-backed.'),
  e('arangodb', 'ArangoDB', 'https://github.com/arangodb/arangodb', 'search-retrieval', 'study-only', ['graph-viz', 'search-index'], ['multi-model graph + document + search', 'AQL traversal', 'unified storage model'], ['treating graph reachability as causality'], 'Multi-model stores let one query span documents and relationships; useful, but reachability is still not causation and edges still need provenance.'),

  // --- Graph / visualization (Atlasz UI already uses xyflow/recharts) ---
  e('cytoscape-js', 'Cytoscape.js', 'https://github.com/cytoscape/cytoscape.js', 'graph-visualization', 'allowed-library', ['graph-viz', 'engineering-reference'], ['graph theory layouts + analysis', 'large network rendering', 'interactive exploration'], ['rendering inferred edges identically to verified ones'], 'Graph UIs must visually encode edge confidence and provenance; an inferred link should never look like a verified one.'),
  e('deck-gl', 'deck.gl', 'https://github.com/visgl/deck.gl', 'graph-visualization', 'study-only', ['graph-viz', 'engineering-reference'], ['WebGL large-scale data viz', 'geospatial + abstract layers', 'GPU-accelerated rendering'], ['implying precision the underlying data does not have'], 'High-performance viz can imply false precision; the rendering must not exceed the certainty of the data behind it.'),
  e('kepler-gl', 'kepler.gl', 'https://github.com/keplergl/kepler.gl', 'graph-visualization', 'study-only', ['graph-viz'], ['geospatial analysis UI', 'large dataset exploration', 'configurable layers'], ['exporting sensitive coordinates without precision controls'], 'Powerful geo UIs need coordinate-precision and sensitivity controls so visualization does not become uncontrolled disclosure.'),
  e('echarts', 'Apache ECharts', 'https://github.com/apache/echarts', 'graph-visualization', 'allowed-library', ['engineering-reference', 'graph-viz'], ['rich declarative charting', 'large-series rendering', 'interaction model'], ['charting data without labeling provenance/freshness'], 'A chart is an analytical instrument; axes, units, and source/freshness labels are part of correctness, not decoration.'),
  e('d3', 'D3', 'https://github.com/d3/d3', 'graph-visualization', 'allowed-library', ['engineering-reference', 'graph-viz'], ['data-driven document primitives', 'custom visual encodings', 'scales/axes'], ['encoding uncertain data as definitive visuals'], 'Custom visual encoding is powerful and dangerous; uncertainty must be encoded, not smoothed away.'),
  e('superset', 'Apache Superset', 'https://github.com/apache/superset', 'graph-visualization', 'study-only', ['engineering-reference'], ['BI dashboards', 'SQL-backed exploration', 'semantic layer'], ['dashboard sprawl without actionability'], 'Dashboards earn their place by answering analyst questions; pretty-but-unactionable panels are a known anti-pattern Atlasz must avoid.'),
  e('metabase', 'Metabase', 'https://github.com/metabase/metabase', 'graph-visualization', 'study-only', ['engineering-reference'], ['question-driven analytics', 'self-serve exploration', 'lightweight BI'], ['surfacing answers without source/recency context'], 'Question-first analytics is a good model: lead with the analyst question, then show evidence and recency.'),

  // --- Agent engineering (net-new; reference-only until tools are policy-bound) ---
  e('agno', 'Agno', 'https://github.com/agno-agi/agno', 'agent-engineering', 'study-only', ['agent-orchestration', 'engineering-reference'], ['lightweight agent runtime', 'typed tools + memory', 'multi-agent composition'], ['granting agents unbounded tool/network access'], 'Agent frameworks are study-only until every tool is typed, permissioned, audited, and fail-closed — the same bar Atlasz sets for any runtime source.'),
]

const corpusById = new Map(DEFENSIVE_SECURITY_CORPUS.map((item) => [item.id, item]))

export function lookupDefensiveCorpusEntry(id: string): DefensiveCorpusEntry | undefined {
  return corpusById.get(id)
}

export function entriesForDefensiveDomain(domainId: DefensiveDomainId): DefensiveCorpusEntry[] {
  return DEFENSIVE_SECURITY_CORPUS.filter((item) => item.domainId === domainId)
}

/** Only study-only and allowed-library entries may inform default Atlasz behavior. */
export function defensiveEntryPassesDefaultPolicy(item: DefensiveCorpusEntry): boolean {
  return item.runtimePolicy === 'allowed-library' || item.runtimePolicy === 'study-only'
}

export function defensiveEntriesByRiskTag(tag: DefensiveRiskTag): DefensiveCorpusEntry[] {
  return DEFENSIVE_SECURITY_CORPUS.filter((item) => item.riskTags.includes(tag))
}

export function summarizeDefensiveCorpus() {
  const byDomain = new Map<DefensiveDomainId, number>()
  const byPolicy = new Map<DefensiveRuntimePolicy, number>()
  for (const item of DEFENSIVE_SECURITY_CORPUS) {
    byDomain.set(item.domainId, (byDomain.get(item.domainId) ?? 0) + 1)
    byPolicy.set(item.runtimePolicy, (byPolicy.get(item.runtimePolicy) ?? 0) + 1)
  }
  return {
    entryCount: DEFENSIVE_SECURITY_CORPUS.length,
    defaultSafeCount: DEFENSIVE_SECURITY_CORPUS.filter(defensiveEntryPassesDefaultPolicy).length,
    byDomain: Object.fromEntries(byDomain),
    byPolicy: Object.fromEntries(byPolicy),
  }
}

function e(
  id: string,
  label: string,
  upstreamUrl: string,
  domainId: DefensiveDomainId,
  runtimePolicy: DefensiveRuntimePolicy,
  riskTags: DefensiveRiskTag[],
  capabilities: string[],
  blockedUses: string[],
  engineeringLesson: string,
): DefensiveCorpusEntry {
  return { id, label, upstreamUrl, domainId, runtimePolicy, riskTags, capabilities, blockedUses, engineeringLesson }
}
