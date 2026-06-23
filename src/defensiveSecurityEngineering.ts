export type DefensiveSecurityDomainId =
  | 'cybersecurity-master-lists'
  | 'threat-intelligence-cti'
  | 'detection-engineering'
  | 'soc-siem-security-monitoring'
  | 'dfir-forensics'
  | 'malware-reverse-engineering'
  | 'internet-mapping-authorized-recon'
  | 'osint-collection'
  | 'opsec-privacy-hardening'
  | 'cloud-security'
  | 'container-kubernetes-security'
  | 'supply-chain-security'
  | 'software-engineering-system-design'
  | 'production-systems'
  | 'data-engineering-realtime'
  | 'search-retrieval-vector'
  | 'knowledge-graph-entity-resolution'
  | 'intelligence-ui-dashboards'
  | 'agent-engineering'

export type DefensiveSecurityPolicy =
  | 'study-only'
  | 'candidate-library'
  | 'auth-gated-adapter'
  | 'authorized-lab-only'
  | 'reference-only'
  | 'blocked'

export type DefensiveSecurityRiskTag =
  | 'active-recon'
  | 'agent-tooling'
  | 'auth-required'
  | 'cloud-permissions'
  | 'commercial-terms'
  | 'container-runtime'
  | 'cti-graph'
  | 'defensive-detection'
  | 'defensive-sensor'
  | 'dfir-chain-of-custody'
  | 'evidence-trail'
  | 'graph-inference'
  | 'internet-exposure'
  | 'malware-handling'
  | 'opsec'
  | 'personal-data'
  | 'public-reference'
  | 'realtime-stream'
  | 'supply-chain'
  | 'ui-evidence'

export type DefensiveSecurityStudy = {
  id: string
  label: string
  domainId: DefensiveSecurityDomainId
  upstreamUrls: string[]
  policy: DefensiveSecurityPolicy
  riskTags: DefensiveSecurityRiskTag[]
  architectures: string[]
  workflows: string[]
  dataModels: string[]
  securityModels: string[]
  detectionLogic: string[]
  ingestionPatterns: string[]
  uiPatterns: string[]
  graphStructures: string[]
  reliabilityPatterns: string[]
  failureModes: string[]
  testingMethods: string[]
  antiPatterns: string[]
  implementationLessons: string[]
  atlaszImprovementPlan: string[]
}

export type DefensiveEngineeringRule = {
  id: string
  sourceDomainIds: DefensiveSecurityDomainId[]
  rule: string
  rationale: string
  implementationNote: string
  regressionTests: string[]
}

export type AtlaszDefensiveImprovement = {
  id: string
  priority: 'near-term' | 'mid-term' | 'later'
  sourceDomainIds: DefensiveSecurityDomainId[]
  title: string
  implementationNotes: string[]
  validationTests: string[]
}

export const DEFENSIVE_SECURITY_STUDIES: DefensiveSecurityStudy[] = [
  study({
    id: 'cybersecurity-master-lists',
    label: 'Cybersecurity master lists',
    domainId: 'cybersecurity-master-lists',
    upstreamUrls: [
      'https://github.com/sbilly/awesome-security',
      'https://github.com/hslatman/awesome-threat-intelligence',
      'https://github.com/0x4D31/awesome-threat-detection',
      'https://github.com/meirwah/awesome-incident-response',
      'https://github.com/fabacab/awesome-cybersecurity-blueteam',
      'https://github.com/enaqx/awesome-pentest',
      'https://github.com/swisskyrepo/PayloadsAllTheThings',
      'https://github.com/trimstray/the-book-of-secret-knowledge',
    ],
    policy: 'study-only',
    riskTags: ['public-reference', 'opsec'],
    architectures: ['taxonomy-first knowledge base', 'curated link graph', 'domain map for security disciplines'],
    workflows: ['source discovery', 'gap mapping', 'manual triage before adoption'],
    dataModels: ['category -> project -> capability -> risk boundary'],
    securityModels: ['reference-only by default', 'human review before runtime use'],
    detectionLogic: ['none directly; use as discovery map for defensive references'],
    ingestionPatterns: ['manual curation with source URL, category, and policy metadata'],
    uiPatterns: ['domain matrix', 'coverage map', 'blocked/runtime-safe badges'],
    graphStructures: ['resource taxonomy graph', 'capability-to-risk edge map'],
    reliabilityPatterns: ['deduplicate links', 'track stale/deprecated projects', 'do not equate popularity with quality'],
    failureModes: ['tool-list sprawl', 'unsafe tool adoption', 'stale lists', 'context without provenance'],
    testingMethods: ['entry uniqueness', 'URL validity shape', 'policy label coverage'],
    antiPatterns: ['auto-installing from awesome lists', 'treating curated lists as verified source truth'],
    implementationLessons: ['Use master lists as maps of domains and failure modes, not as Atlasz runtime connectors.'],
    atlaszImprovementPlan: ['Keep these as corpus entries that guide taxonomy and missing-domain discovery.'],
  }),
  study({
    id: 'threat-intelligence-cti',
    label: 'Threat intelligence and CTI platforms',
    domainId: 'threat-intelligence-cti',
    upstreamUrls: [
      'https://github.com/OpenCTI-Platform/opencti',
      'https://github.com/MISP/MISP',
      'https://github.com/yeti-platform/yeti',
      'https://github.com/mitre/cti',
      'https://github.com/mitre-attack/attack-stix-data',
      'https://github.com/oasis-open/cti-stix2-json-schemas',
      'https://github.com/oasis-open/cti-python-stix2',
      'https://github.com/eclecticiq/OpenTAXII',
    ],
    policy: 'auth-gated-adapter',
    riskTags: ['cti-graph', 'auth-required', 'evidence-trail'],
    architectures: ['STIX object graph', 'TAXII transport boundary', 'entity-observable-relationship model'],
    workflows: ['indicator ingest', 'relationship enrichment', 'sighting correlation', 'confidence scoring'],
    dataModels: ['indicator, malware, tool, campaign, threat actor, report, relationship, marking definition'],
    securityModels: ['source marking', 'TLP-like sharing boundaries', 'operator-owned endpoint and token'],
    detectionLogic: ['CTI becomes detection context only after telemetry mapping and validation'],
    ingestionPatterns: ['pull by collection/version', 'preserve object IDs', 'track modified timestamps'],
    uiPatterns: ['source trail drawer', 'relationship graph with confidence and marking labels'],
    graphStructures: ['observable -> indicator -> malware/tool -> campaign -> report'],
    reliabilityPatterns: ['version CTI objects', 'deduplicate by STIX ID', 'keep revocations and updates'],
    failureModes: ['treating CTI as verified truth', 'indicator aging', 'feed duplication', 'lost sharing markings'],
    testingMethods: ['schema validation', 'revoked-object handling', 'duplicate STIX ID merge tests'],
    antiPatterns: ['auto-promoting external CTI into verified Atlasz events'],
    implementationLessons: ['CTI platforms teach typed graph provenance and confidence, not automatic truth.'],
    atlaszImprovementPlan: ['Add future OpenCTI/MISP adapters only for configured endpoints with source markings and fail-closed auth.'],
  }),
  study({
    id: 'detection-engineering',
    label: 'Detection engineering',
    domainId: 'detection-engineering',
    upstreamUrls: [
      'https://github.com/SigmaHQ/sigma',
      'https://github.com/Yara-Rules/rules',
      'https://github.com/Neo23x0/signature-base',
      'https://github.com/elastic/detection-rules',
      'https://github.com/splunk/security_content',
      'https://github.com/palantir/alerting-detection-strategy-framework',
      'https://github.com/OTRF/ThreatHunter-Playbook',
      'https://github.com/OTRF/Security-Datasets',
    ],
    policy: 'candidate-library',
    riskTags: ['defensive-detection', 'evidence-trail'],
    architectures: ['rule-as-code repositories', 'portable detection schema', 'test dataset library'],
    workflows: ['hypothesis -> required telemetry -> detection rule -> test dataset -> alert triage'],
    dataModels: ['rule metadata, log source, detection condition, false positive notes, ATT&CK mapping'],
    securityModels: ['defensive telemetry only', 'data-source-specific validation required'],
    detectionLogic: ['Sigma conditions', 'YARA string/byte patterns', 'EQL/SPL/KQL translations', 'threshold and sequence rules'],
    ingestionPatterns: ['import rule metadata without executing scans by default'],
    uiPatterns: ['rule detail, telemetry coverage, false-positive notes, evidence examples'],
    graphStructures: ['technique -> data source -> rule -> evidence -> alert'],
    reliabilityPatterns: ['unit-test rules against known datasets', 'track rule version and data source assumptions'],
    failureModes: ['rule fires on wrong telemetry', 'false positive storm', 'stale ATT&CK mapping', 'missing fields'],
    testingMethods: ['fixture logs', 'negative cases', 'schema tests', 'coverage tests for required data fields'],
    antiPatterns: ['declaring compromise from a rule hit without supporting telemetry'],
    implementationLessons: ['Good detections are testable hypotheses with explicit telemetry requirements.'],
    atlaszImprovementPlan: ['Use detection-rule patterns to design Atlasz signal definitions with evidence fixtures and false-positive notes.'],
  }),
  study({
    id: 'soc-siem-security-monitoring',
    label: 'SOC, SIEM, and security monitoring',
    domainId: 'soc-siem-security-monitoring',
    upstreamUrls: [
      'https://github.com/Security-Onion-Solutions/securityonion',
      'https://github.com/wazuh/wazuh',
      'https://github.com/zeek/zeek',
      'https://github.com/OISF/suricata',
      'https://github.com/arkime/arkime',
      'https://github.com/osquery/osquery',
      'https://github.com/Velocidex/velociraptor',
    ],
    policy: 'authorized-lab-only',
    riskTags: ['defensive-sensor', 'dfir-chain-of-custody', 'evidence-trail'],
    architectures: ['sensor -> parser -> normalized event -> search/index -> alert -> case workflow'],
    workflows: ['collect telemetry', 'normalize events', 'hunt', 'triage', 'preserve packet/endpoint evidence'],
    dataModels: ['network session, packet metadata, endpoint fact, alert, case, observable'],
    securityModels: ['monitor only owned/authorized systems', 'least privilege sensors', 'privacy-aware retention'],
    detectionLogic: ['IDS signatures', 'behavior queries', 'endpoint facts', 'network metadata correlations'],
    ingestionPatterns: ['stream logs, batch endpoint queries, indexed packet/session metadata'],
    uiPatterns: ['alert queue', 'hunt query surface', 'case timeline', 'source drilldown'],
    graphStructures: ['host -> process -> connection -> domain -> alert -> case'],
    reliabilityPatterns: ['sensor health, dropped packet counters, parser error metrics, retention alerts'],
    failureModes: ['blind spots', 'packet loss', 'clock drift', 'privacy overcollection', 'alert fatigue'],
    testingMethods: ['sensor health tests', 'synthetic events', 'parser regression fixtures', 'clock skew checks'],
    antiPatterns: ['monitoring networks without authorization', 'alert-only UI without raw evidence'],
    implementationLessons: ['SOC systems are evidence pipelines; health and gaps are as important as alerts.'],
    atlaszImprovementPlan: ['Mirror the SOC pattern in Data Core: source health, dropped packets, parser errors, evidence drilldown.'],
  }),
  study({
    id: 'dfir-forensics',
    label: 'DFIR and forensics',
    domainId: 'dfir-forensics',
    upstreamUrls: [
      'https://github.com/volatilityfoundation/volatility3',
      'https://github.com/sleuthkit/sleuthkit',
      'https://github.com/log2timeline/plaso',
      'https://github.com/Velocidex/velociraptor',
      'https://github.com/google/grr',
      'https://github.com/mandiant/capa',
      'https://github.com/mandiant/flare-floss',
    ],
    policy: 'authorized-lab-only',
    riskTags: ['dfir-chain-of-custody', 'malware-handling', 'evidence-trail'],
    architectures: ['acquisition -> preservation -> parsing -> timeline -> analysis -> report'],
    workflows: ['collect authorized evidence', 'hash artifacts', 'extract timelines', 'triage capabilities'],
    dataModels: ['artifact, hash, source device, timeline event, parser, chain-of-custody record'],
    securityModels: ['privacy-sensitive evidence handling', 'isolated analysis environment', 'chain of custody'],
    detectionLogic: ['artifact rules, memory object analysis, capability signatures'],
    ingestionPatterns: ['offline evidence ingestion with immutable hashes and parser version'],
    uiPatterns: ['timeline explorer', 'artifact provenance, parser confidence and errors'],
    graphStructures: ['artifact -> parser -> event -> actor/process/file/network relation'],
    reliabilityPatterns: ['hash verification', 'parser versioning', 'immutable source preservation'],
    failureModes: ['tampered evidence', 'parser bugs', 'timezone errors', 'privacy leakage'],
    testingMethods: ['golden forensic images', 'hash round-trip tests', 'timezone timeline tests'],
    antiPatterns: ['processing private evidence without authority', 'editing original artifacts'],
    implementationLessons: ['Forensics teaches Atlasz to preserve raw evidence and make timelines auditable.'],
    atlaszImprovementPlan: ['Adopt immutable evidence hashes and parser-version fields for world/news/source records.'],
  }),
  study({
    id: 'malware-reverse-engineering',
    label: 'Malware and reverse engineering',
    domainId: 'malware-reverse-engineering',
    upstreamUrls: [
      'https://github.com/radareorg/radare2',
      'https://github.com/NationalSecurityAgency/ghidra',
      'https://github.com/avast/retdec',
      'https://github.com/ReFirmLabs/binwalk',
      'https://github.com/REMnux/remnux',
      'https://github.com/VirusTotal/yara',
    ],
    policy: 'authorized-lab-only',
    riskTags: ['malware-handling', 'defensive-detection'],
    architectures: ['static analysis toolchain', 'sandbox/lab boundary', 'rule extraction workflow'],
    workflows: ['identify file type', 'extract strings/capabilities', 'disassemble/decompile', 'write defensive indicators'],
    dataModels: ['sample hash, file metadata, extracted string, capability, function, signature'],
    securityModels: ['isolated lab only', 'no sample execution on production systems'],
    detectionLogic: ['YARA patterns', 'capability signatures', 'binary feature extraction'],
    ingestionPatterns: ['metadata-only in Atlasz default; samples remain out of runtime'],
    uiPatterns: ['sample metadata card, capability matrix, rule provenance'],
    graphStructures: ['sample -> capability -> family label -> report -> indicator'],
    reliabilityPatterns: ['toolchain isolation', 'hash every artifact', 'separate labels from verified family'],
    failureModes: ['unsafe sample handling', 'false family attribution', 'signature overfit'],
    testingMethods: ['known sample fixtures in isolated lab', 'YARA false-positive tests'],
    antiPatterns: ['downloading or executing malware in Atlasz default runtime'],
    implementationLessons: ['Reverse engineering patterns are useful for capability extraction, but runtime sample handling is blocked.'],
    atlaszImprovementPlan: ['Keep malware projects reference-only unless a separate isolated lab mode is explicitly built.'],
  }),
  study({
    id: 'internet-mapping-authorized-recon',
    label: 'Internet mapping and authorized recon',
    domainId: 'internet-mapping-authorized-recon',
    upstreamUrls: [
      'https://github.com/projectdiscovery',
      'https://github.com/projectdiscovery/nuclei',
      'https://github.com/projectdiscovery/subfinder',
      'https://github.com/projectdiscovery/httpx',
      'https://github.com/projectdiscovery/naabu',
      'https://github.com/projectdiscovery/dnsx',
      'https://github.com/projectdiscovery/asnmap',
      'https://github.com/projectdiscovery/mapcidr',
      'https://github.com/projectdiscovery/katana',
      'https://github.com/owasp-amass/amass',
      'https://github.com/censys/censys-python',
    ],
    policy: 'authorized-lab-only',
    riskTags: ['active-recon', 'internet-exposure', 'opsec'],
    architectures: ['scope -> discovery -> probe -> enrich -> validate -> report'],
    workflows: ['authorized target scoping', 'rate-limited probes', 'template validation', 'asset graphing'],
    dataModels: ['asset, domain, ASN, IP, service, finding, template, scope proof'],
    securityModels: ['operator-provided authorization, rate limits, audit logs'],
    detectionLogic: ['template matchers and fingerprints are findings, not proof until reviewed'],
    ingestionPatterns: ['no default ingestion; future lab mode only with explicit scope'],
    uiPatterns: ['scope confirmation screen, rate/delay controls, audit log, stop button'],
    graphStructures: ['organization -> domain -> subdomain -> IP -> service -> finding'],
    reliabilityPatterns: ['scope filters, retries, backoff, dedupe, poison-template quarantine'],
    failureModes: ['out-of-scope probing', 'rate-limit harm', 'false positives', 'OPSEC leakage'],
    testingMethods: ['local mock targets', 'scope enforcement tests', 'rate-limit tests'],
    antiPatterns: ['unsupervised internet probing', 'using recon tools for market/world context'],
    implementationLessons: ['Recon tooling teaches modular pipelines and scope enforcement; it is not Atlasz default behavior.'],
    atlaszImprovementPlan: ['If ever added, build an authorized-lab mode with target scope proofs and no background execution.'],
  }),
  study({
    id: 'osint-collection',
    label: 'OSINT collection',
    domainId: 'osint-collection',
    upstreamUrls: [
      'https://github.com/jivoi/awesome-osint',
      'https://github.com/lockfale/OSINT-Framework',
      'https://github.com/OpenOSINT/OpenOSINT',
      'https://github.com/smicallef/spiderfoot',
      'https://github.com/laramies/theHarvester',
      'https://github.com/soxoj/maigret',
      'https://github.com/sherlock-project/sherlock',
      'https://github.com/megadose/holehe',
      'https://github.com/megadose/toutatis',
    ],
    policy: 'reference-only',
    riskTags: ['personal-data', 'opsec', 'public-reference'],
    architectures: ['source catalog', 'module registry', 'collection workflow map'],
    workflows: ['manual source review', 'scope definition', 'lawful collection', 'provenance preservation'],
    dataModels: ['source, query, result, subject, provenance, legal boundary'],
    securityModels: ['no person enrichment by default', 'no login bypass', 'no private data collection'],
    detectionLogic: ['none directly; collection supports evidence discovery only'],
    ingestionPatterns: ['only official/public adapters with policy review; identity tools blocked'],
    uiPatterns: ['source eligibility badge, OPSEC warning, unavailable state'],
    graphStructures: ['source -> claim -> entity, never person-enrichment graph by default'],
    reliabilityPatterns: ['terms review, rate limits, provenance, stale-state labels'],
    failureModes: ['privacy violation', 'account enumeration', 'misattribution', 'source-policy breach'],
    testingMethods: ['blocked-source tests', 'no-default-runtime tests', 'provenance-required tests'],
    antiPatterns: ['automating username/email/account enumeration'],
    implementationLessons: ['OSINT is an evidence discipline before it is a tooling discipline.'],
    atlaszImprovementPlan: ['Keep OSINT collection governed by explicit source policy and blocked person-enrichment defaults.'],
  }),
  study({
    id: 'opsec-privacy-hardening',
    label: 'OPSEC, privacy, and hardening',
    domainId: 'opsec-privacy-hardening',
    upstreamUrls: [
      'https://github.com/pluja/awesome-privacy',
      'https://github.com/privacyguides/privacyguides.org',
      'https://github.com/OWASP/CheatSheetSeries',
      'https://github.com/OWASP/ASVS',
      'https://github.com/cisagov/ScubaGear',
      'https://github.com/dev-sec/ansible-collection-hardening',
      'https://github.com/konstruktoid/hardening',
    ],
    policy: 'study-only',
    riskTags: ['opsec', 'public-reference'],
    architectures: ['threat model -> control baseline -> verification -> drift detection'],
    workflows: ['data minimization', 'secret scanning', 'hardening checks', 'privacy review'],
    dataModels: ['asset, control, finding, severity, exception, evidence'],
    securityModels: ['least privilege', 'defense in depth', 'privacy-by-default'],
    detectionLogic: ['config compliance checks and ASVS-style verification'],
    ingestionPatterns: ['local policy checks and reference catalogs; no private telemetry submission'],
    uiPatterns: ['risk category badge, control status, exception rationale'],
    graphStructures: ['asset -> control -> finding -> mitigation -> evidence'],
    reliabilityPatterns: ['repeatable checks', 'versioned baselines', 'exception expiry'],
    failureModes: ['security theater', 'overcollection', 'secret leakage, stale hardening guidance'],
    testingMethods: ['policy unit tests', 'secret redaction tests', 'config fixture checks'],
    antiPatterns: ['claiming privacy/security without a threat model'],
    implementationLessons: ['OPSEC must be encoded into source admission, logging, and UI labels.'],
    atlaszImprovementPlan: ['Extend source-review screens with OPSEC category and submission-leakage warnings.'],
  }),
  study({
    id: 'cloud-security',
    label: 'Cloud security',
    domainId: 'cloud-security',
    upstreamUrls: [
      'https://github.com/toniblyx/my-arsenal-of-aws-security-tools',
      'https://github.com/aquasecurity/cloudsplaining',
      'https://github.com/prowler-cloud/prowler',
      'https://github.com/nccgroup/ScoutSuite',
      'https://github.com/cloudquery/cloudquery',
      'https://github.com/duo-labs/cloudmapper',
      'https://github.com/salesforce/cloudsplaining',
    ],
    policy: 'auth-gated-adapter',
    riskTags: ['auth-required', 'cloud-permissions', 'evidence-trail'],
    architectures: ['read-only collector -> policy engine -> finding graph -> remediation plan'],
    workflows: ['assume least-privilege role', 'inventory', 'evaluate controls', 'report drift'],
    dataModels: ['account, resource, IAM principal, policy, finding, control, evidence'],
    securityModels: ['read-only scopes', 'no credential logging', 'account-owner authorization'],
    detectionLogic: ['misconfiguration rules, IAM privilege analysis, network exposure graph'],
    ingestionPatterns: ['configured credentials only; no default cloud scanning'],
    uiPatterns: ['cloud account selector, permission boundary, control/finding view'],
    graphStructures: ['principal -> permission -> resource -> exposure -> control'],
    reliabilityPatterns: ['pagination, retry, rate limit, partial inventory marking'],
    failureModes: ['overbroad credentials', 'partial inventory hidden as complete', 'cross-account leakage'],
    testingMethods: ['mock cloud fixtures', 'least-privilege tests', 'partial-failure tests'],
    antiPatterns: ['running cloud audits without account-owner approval'],
    implementationLessons: ['Cloud security tools teach inventory lineage and least-privilege collection.'],
    atlaszImprovementPlan: ['Study cloud inventory graph patterns for future configured enterprise mode, not desktop default.'],
  }),
  study({
    id: 'container-kubernetes-security',
    label: 'Container and Kubernetes security',
    domainId: 'container-kubernetes-security',
    upstreamUrls: [
      'https://github.com/aquasecurity/trivy',
      'https://github.com/aquasecurity/kube-bench',
      'https://github.com/aquasecurity/kube-hunter',
      'https://github.com/FairwindsOps/polaris',
      'https://github.com/kubernetes-sigs/security-profiles-operator',
      'https://github.com/anchore/syft',
      'https://github.com/anchore/grype',
    ],
    policy: 'authorized-lab-only',
    riskTags: ['container-runtime', 'supply-chain', 'defensive-detection'],
    architectures: ['image SBOM -> vulnerability scan -> config audit -> runtime profile'],
    workflows: ['scan image', 'audit cluster config', 'validate policies', 'generate remediation'],
    dataModels: ['image, package, CVE, config control, pod, namespace, profile, finding'],
    securityModels: ['owned cluster/image only', 'least privilege kube access', 'no intrusive tests by default'],
    detectionLogic: ['CVE matching, CIS benchmark checks, policy violations, runtime profile drift'],
    ingestionPatterns: ['metadata-only study unless user provides authorized image/cluster scope'],
    uiPatterns: ['image risk panel, namespace policy matrix, SBOM drilldown'],
    graphStructures: ['image -> package -> vulnerability -> workload -> namespace -> cluster'],
    reliabilityPatterns: ['scanner DB freshness, false-positive suppression, severity normalization'],
    failureModes: ['stale CVE DB', 'scanner overreach, intrusive cluster probing, noisy severity'],
    testingMethods: ['fixture SBOMs', 'stale DB tests', 'policy fixture tests'],
    antiPatterns: ['scanning clusters without explicit owner authorization'],
    implementationLessons: ['Container security reinforces SBOM-first evidence and policy-as-code validation.'],
    atlaszImprovementPlan: ['Reuse SBOM/vulnerability graph ideas for Atlasz source-package transparency.'],
  }),
  study({
    id: 'supply-chain-security',
    label: 'Supply chain security',
    domainId: 'supply-chain-security',
    upstreamUrls: [
      'https://github.com/ossf/scorecard',
      'https://github.com/ossf/allstar',
      'https://github.com/ossf/package-analysis',
      'https://github.com/DependencyTrack/dependency-track',
      'https://github.com/sigstore/cosign',
      'https://github.com/in-toto/in-toto',
      'https://github.com/slsa-framework/slsa',
      'https://github.com/anchore/syft',
      'https://github.com/anchore/grype',
    ],
    policy: 'candidate-library',
    riskTags: ['supply-chain', 'evidence-trail'],
    architectures: ['provenance -> SBOM -> signing -> policy -> continuous monitoring'],
    workflows: ['generate SBOM', 'verify signature/provenance', 'score project, monitor dependency risk'],
    dataModels: ['package, artifact, build step, attestation, signature, vulnerability, policy'],
    securityModels: ['SLSA/in-toto provenance', 'Sigstore verification', 'policy-as-code'],
    detectionLogic: ['dependency risk, malicious package heuristics, vulnerable component matching'],
    ingestionPatterns: ['local dependency metadata and public advisory feeds with source trails'],
    uiPatterns: ['dependency graph, attestation status, policy exception list'],
    graphStructures: ['source repo -> build -> artifact -> package -> dependency -> advisory'],
    reliabilityPatterns: ['reproducible metadata, signed attestations, advisory DB freshness'],
    failureModes: ['unsigned artifacts, dependency confusion, stale advisories, trust-on-first-use mistakes'],
    testingMethods: ['fixture SBOMs', 'signature verification tests', 'policy denial tests'],
    antiPatterns: ['shipping artifacts with unknown provenance'],
    implementationLessons: ['Supply-chain security should become part of Atlasz release readiness.'],
    atlaszImprovementPlan: ['Add release checklist for SBOM generation, dependency audit, and signed artifact plan.'],
  }),
  study({
    id: 'software-engineering-system-design',
    label: 'Software engineering and system design',
    domainId: 'software-engineering-system-design',
    upstreamUrls: [
      'https://github.com/donnemartin/system-design-primer',
      'https://github.com/ashishps1/awesome-system-design-resources',
      'https://github.com/mehdihadeli/awesome-software-architecture',
      'https://github.com/binhnguyennus/awesome-scalability',
      'https://github.com/theanalyst/awesome-distributed-systems',
      'https://github.com/papers-we-love/papers-we-love',
      'https://github.com/codecrafters-io/build-your-own-x',
      'https://github.com/google/eng-practices',
    ],
    policy: 'study-only',
    riskTags: ['public-reference'],
    architectures: ['bounded context, event log, CQRS, backpressure, observability, graceful degradation'],
    workflows: ['requirements -> constraints -> architecture decision -> tests -> operational runbook'],
    dataModels: ['decision record, invariant, failure mode, test fixture, runbook'],
    securityModels: ['secure-by-design review and least-privilege boundaries'],
    detectionLogic: ['operational anomaly and invariant violation detection'],
    ingestionPatterns: ['architecture references as study material only'],
    uiPatterns: ['decision trace, health state, runbook link, failure explanation'],
    graphStructures: ['component -> dependency -> failure mode -> control -> test'],
    reliabilityPatterns: ['small interfaces, typed contracts, replay, load shedding, observability'],
    failureModes: ['cargo-cult architecture, premature distribution, hidden coupling'],
    testingMethods: ['contract tests, load tests, failure injection, migration tests'],
    antiPatterns: ['copying hyperscale patterns into local-first desktop without need'],
    implementationLessons: ['Architecture is constraints plus failure handling, not diagrams.'],
    atlaszImprovementPlan: ['Keep Atlasz local-first and typed; add ADR-style notes for major ingestion changes.'],
  }),
  study({
    id: 'production-systems',
    label: 'Real production systems',
    domainId: 'production-systems',
    upstreamUrls: [
      'https://github.com/kubernetes/kubernetes',
      'https://github.com/torvalds/linux',
      'https://github.com/postgres/postgres',
      'https://github.com/apache/kafka',
      'https://github.com/envoyproxy/envoy',
      'https://github.com/etcd-io/etcd',
      'https://github.com/prometheus/prometheus',
      'https://github.com/grafana/grafana',
      'https://github.com/hashicorp/terraform',
      'https://github.com/hashicorp/consul',
    ],
    policy: 'study-only',
    riskTags: ['public-reference', 'realtime-stream'],
    architectures: ['control plane/data plane split', 'WAL/event log', 'consensus', 'metrics pipeline', 'declarative state'],
    workflows: ['observe state', 'reconcile desired/current, persist events, recover from failure'],
    dataModels: ['resource spec/status, log segment, metric sample, config state, consensus entry'],
    securityModels: ['principled interfaces, compatibility, privilege boundaries, audit logs'],
    detectionLogic: ['SLO burn, invariant violation, health checks, reconciliation drift'],
    ingestionPatterns: ['append-only logs, watch APIs, pull metrics, scrape targets, config state snapshots'],
    uiPatterns: ['status dashboards, query explorer, resource detail, history/replay'],
    graphStructures: ['service -> dependency -> status -> metric -> alert'],
    reliabilityPatterns: ['compatibility, replay, idempotency, checkpointing, backpressure'],
    failureModes: ['split brain, thundering herd, unbounded cardinality, config drift, migration pain'],
    testingMethods: ['soak tests, conformance tests, compatibility tests, chaos/fault tests'],
    antiPatterns: ['importing production-scale complexity without the operating model'],
    implementationLessons: ['Mature systems make state, history, and health explicit.'],
    atlaszImprovementPlan: ['Use production-system patterns for Data Core health, replay, and state reconciliation.'],
  }),
  study({
    id: 'data-engineering-realtime',
    label: 'Data engineering and real-time systems',
    domainId: 'data-engineering-realtime',
    upstreamUrls: [
      'https://github.com/igorbarinov/awesome-data-engineering',
      'https://github.com/apache/spark',
      'https://github.com/apache/airflow',
      'https://github.com/apache/flink',
      'https://github.com/apache/beam',
      'https://github.com/apache/kafka',
      'https://github.com/redpanda-data/redpanda',
      'https://github.com/nats-io/nats-server',
      'https://github.com/apache/pulsar',
      'https://github.com/dagster-io/dagster',
      'https://github.com/PrefectHQ/prefect',
    ],
    policy: 'study-only',
    riskTags: ['realtime-stream', 'evidence-trail'],
    architectures: ['connector -> queue/log -> parser -> validator -> store -> projection'],
    workflows: ['batch, stream, retry, checkpoint, replay, backfill, dead-letter'],
    dataModels: ['event, offset, watermark, checkpoint, schema version, data asset'],
    securityModels: ['source authorization, secret handling, pipeline audit, retention policy'],
    detectionLogic: ['pipeline anomaly, freshness violation, schema drift, late data'],
    ingestionPatterns: ['bounded queues, backpressure, idempotent writes, schema validation'],
    uiPatterns: ['pipeline DAG, source health, lag, retry/failure drilldown'],
    graphStructures: ['source -> job -> dataset -> projection -> consumer'],
    reliabilityPatterns: ['exactly-once as design goal, idempotency as practical requirement'],
    failureModes: ['duplicate events, late data, poison messages, silent schema drift'],
    testingMethods: ['fixture streams, replay tests, checkpoint recovery, malformed-message tests'],
    antiPatterns: ['feeding raw high-rate packets directly to UI state'],
    implementationLessons: ['Atlasz should keep streaming hot paths buffered, validated, and replayable.'],
    atlaszImprovementPlan: ['Add source freshness and schema-drift checks to Data Core health.'],
  }),
  study({
    id: 'search-retrieval-vector',
    label: 'Search, retrieval, and vector intelligence',
    domainId: 'search-retrieval-vector',
    upstreamUrls: [
      'https://github.com/elastic/elasticsearch',
      'https://github.com/opensearch-project/OpenSearch',
      'https://github.com/meilisearch/meilisearch',
      'https://github.com/typesense/typesense',
      'https://github.com/qdrant/qdrant',
      'https://github.com/weaviate/weaviate',
      'https://github.com/milvus-io/milvus',
      'https://github.com/facebookresearch/faiss',
    ],
    policy: 'candidate-library',
    riskTags: ['evidence-trail'],
    architectures: ['document index', 'inverted index', 'vector index', 'hybrid retrieval', 'metadata filters'],
    workflows: ['ingest evidence', 'chunk, embed/index, retrieve, rank, cite, refresh'],
    dataModels: ['document, chunk, vector, metadata, source ID, confidence, freshness'],
    securityModels: ['local/private indexes by default, access policy, source retention'],
    detectionLogic: ['retrieval quality metrics, stale index detection, source-missing checks'],
    ingestionPatterns: ['index normalized evidence with source IDs and raw-source pointers'],
    uiPatterns: ['search result with citation, trust label, timestamp, highlighted evidence'],
    graphStructures: ['query -> retrieved chunk -> source -> claim -> entity'],
    reliabilityPatterns: ['rebuildable indexes, embedding versioning, citation enforcement'],
    failureModes: ['semantic match without evidence, stale embeddings, private data leakage'],
    testingMethods: ['golden query tests, citation-required tests, stale-index tests'],
    antiPatterns: ['letting vector similarity become truth confidence'],
    implementationLessons: ['Retrieval needs citations, filters, and provenance to be intelligence-grade.'],
    atlaszImprovementPlan: ['Future local RAG must require source IDs and trust labels for every returned chunk.'],
  }),
  study({
    id: 'knowledge-graph-entity-resolution',
    label: 'Knowledge graphs and entity resolution',
    domainId: 'knowledge-graph-entity-resolution',
    upstreamUrls: [
      'https://github.com/neo4j/neo4j',
      'https://github.com/memgraph/memgraph',
      'https://github.com/arangodb/arangodb',
      'https://github.com/dedupeio/dedupe',
      'https://github.com/explosion/spaCy',
      'https://github.com/networkx/networkx',
    ],
    policy: 'candidate-library',
    riskTags: ['graph-inference', 'evidence-trail'],
    architectures: ['typed graph, entity resolution pipeline, graph analytics projection'],
    workflows: ['extract entity, resolve identity, attach evidence, traverse relationships, decay weak edges'],
    dataModels: ['entity, alias, identifier, edge, evidence, confidence, valid time'],
    securityModels: ['reversible merges, no person-enrichment defaults, provenance on every edge'],
    detectionLogic: ['graph anomaly, centrality changes, conflicting identity claims'],
    ingestionPatterns: ['deterministic matches first, model matches as reviewable hypotheses'],
    uiPatterns: ['edge evidence panel, confidence badge, merge review, stale edge label'],
    graphStructures: ['entity -> alias -> source evidence; event -> sector -> asset exposure'],
    reliabilityPatterns: ['edge confidence decay, merge audit, conflict preservation'],
    failureModes: ['wrong entity merge, co-mention treated as relationship, stale inferred edges'],
    testingMethods: ['duplicate entity fixtures, conflict tests, edge decay tests'],
    antiPatterns: ['promoting model-predicted links to verified facts'],
    implementationLessons: ['Graph power comes from typed edges, evidence, and reversible resolution decisions.'],
    atlaszImprovementPlan: ['Add graph edge evidence drilldown and merge/conflict audit surfaces.'],
  }),
  study({
    id: 'intelligence-ui-dashboards',
    label: 'Intelligence dashboards and analyst UI',
    domainId: 'intelligence-ui-dashboards',
    upstreamUrls: [
      'https://github.com/grafana/grafana',
      'https://github.com/apache/superset',
      'https://github.com/metabase/metabase',
      'https://github.com/getredash/redash',
      'https://github.com/apache/echarts',
      'https://github.com/d3/d3',
      'https://github.com/xyflow/xyflow',
      'https://github.com/cytoscape/cytoscape.js',
      'https://github.com/visgl/deck.gl',
      'https://github.com/keplergl/kepler.gl',
    ],
    policy: 'candidate-library',
    riskTags: ['ui-evidence', 'graph-inference'],
    architectures: ['query-driven panels, drilldown, alert state, graph/map/timeline visualization'],
    workflows: ['overview -> anomaly -> evidence -> graph path -> source -> decision note'],
    dataModels: ['panel, query, visualization, alert, annotation, source trail'],
    securityModels: ['do not expose secrets in dashboards, scoped data views'],
    detectionLogic: ['visual anomaly highlighting, alert-state aggregation'],
    ingestionPatterns: ['frontends consume projections, not raw streams'],
    uiPatterns: ['dense status panels, time range controls, graph explorer, source lineage drawer'],
    graphStructures: ['node-link graph, flow map, timeline, heat map, table drilldown'],
    reliabilityPatterns: ['loading/error/empty states, stale badges, query failure isolation'],
    failureModes: ['dashboard theater, hidden missing data, overloaded charts, unsourced claims'],
    testingMethods: ['empty-state tests, stale-state tests, visual smoke checks, source-link tests'],
    antiPatterns: ['beautiful panels without evidence or data coverage labels'],
    implementationLessons: ['Analyst UI must answer what changed, why it matters, and what evidence supports it.'],
    atlaszImprovementPlan: ['Add source lineage drawer and graph-path explanation to Atlasz event/signal panels.'],
  }),
  study({
    id: 'agent-engineering',
    label: 'Agent engineering',
    domainId: 'agent-engineering',
    upstreamUrls: [
      'https://github.com/langchain-ai/langgraph',
      'https://github.com/langchain-ai/langchain',
      'https://github.com/microsoft/autogen',
      'https://github.com/ag2ai/ag2',
      'https://github.com/crewAIInc/crewAI',
      'https://github.com/agno-agi/agno',
      'https://github.com/All-Hands-AI/OpenHands',
      'https://github.com/openai/openai-agents-python',
      'https://github.com/pydantic/pydantic-ai',
    ],
    policy: 'study-only',
    riskTags: ['agent-tooling', 'opsec'],
    architectures: ['state machine, tool registry, planner/executor, memory, guardrails, traces'],
    workflows: ['plan, call approved tool, validate output, persist trace, ask for human review'],
    dataModels: ['task, state, tool call, observation, trace, policy decision, memory'],
    securityModels: ['tool allowlist, scoped credentials, human approval for risky actions'],
    detectionLogic: ['policy violation detection, hallucination checks, missing citation checks'],
    ingestionPatterns: ['agents can propose sources, but adapters own ingestion'],
    uiPatterns: ['trace viewer, tool-call approval, evidence checklist, rollback/retry'],
    graphStructures: ['task -> tool call -> source -> claim -> decision'],
    reliabilityPatterns: ['typed outputs, validation, retries, cancellation, deterministic checkpoints'],
    failureModes: ['autonomous source expansion, prompt injection, tool misuse, untraceable claims'],
    testingMethods: ['tool-policy tests, citation-required tests, prompt-injection fixtures'],
    antiPatterns: ['letting an agent browse or execute without source policy'],
    implementationLessons: ['Agent frameworks are safest when reduced to typed state machines with audited tools.'],
    atlaszImprovementPlan: ['Future Atlasz agent mode needs a visible trace, allowlisted tools, and source-policy checks.'],
  }),
]

export const DEFENSIVE_ENGINEERING_RULES: DefensiveEngineeringRule[] = [
  {
    id: 'provenance-before-analysis',
    sourceDomainIds: ['threat-intelligence-cti', 'dfir-forensics', 'data-engineering-realtime'],
    rule: 'Attach provenance and schema version before any parser, model, graph, or signal consumes a record.',
    rationale: 'CTI, DFIR, and pipeline systems fail when evidence is detached from origin and transformation history.',
    implementationNote: 'Require source ID, source URL when available, retrieval time, parser version, trust label, and validation state.',
    regressionTests: ['malformed records fail closed', 'signals require evidence IDs', 'parser version persists with stored events'],
  },
  {
    id: 'telemetry-coverage-is-a-first-class-state',
    sourceDomainIds: ['detection-engineering', 'soc-siem-security-monitoring', 'intelligence-ui-dashboards'],
    rule: 'Show missing telemetry, stale feeds, dropped packets, and unsupported fields as explicit UI states.',
    rationale: 'Detection engineering and SOC tooling treat visibility gaps as operational facts.',
    implementationNote: 'Extend Data Core and signal panels with data coverage labels and unavailable reasons.',
    regressionTests: ['empty source renders intentional empty state', 'stale source downgrades confidence', 'dropped packet counter is visible'],
  },
  {
    id: 'authorized-scope-for-active-tools',
    sourceDomainIds: ['internet-mapping-authorized-recon', 'cloud-security', 'container-kubernetes-security'],
    rule: 'Active scanners, cloud audits, cluster probes, and recon tools require explicit operator scope and audit logs.',
    rationale: 'These tools can touch third-party systems or sensitive account inventory.',
    implementationNote: 'Default Atlasz runtime must keep them reference-only or authorized-lab-only.',
    regressionTests: ['active-recon domains are not runtime wireable', 'authorized-lab policies fail default runtime checks'],
  },
  {
    id: 'graph-edges-need-evidence-and-time',
    sourceDomainIds: ['knowledge-graph-entity-resolution', 'threat-intelligence-cti', 'osint-collection'],
    rule: 'Every graph edge needs evidence, confidence, provenance, and valid-time metadata.',
    rationale: 'Graph reachability without evidence creates false relationships.',
    implementationNote: 'Keep deterministic, local-model, and model-inferred edges visually distinct and decay weak inferred links.',
    regressionTests: ['model-inferred edges decay', 'verified edges do not decay', 'graph paths expose evidence IDs'],
  },
  {
    id: 'retrieval-is-not-truth',
    sourceDomainIds: ['search-retrieval-vector', 'intelligence-ui-dashboards', 'agent-engineering'],
    rule: 'Search/vector retrieval can suggest candidate evidence but cannot upgrade claim confidence by itself.',
    rationale: 'Similarity and ranking are relevance signals, not verification.',
    implementationNote: 'Require retrieved chunks to carry source IDs and trust labels; confidence comes from corroboration and source quality.',
    regressionTests: ['retrieved result without source ID is rejected', 'semantic match remains local-derived until corroborated'],
  },
  {
    id: 'runtime-from-projections-not-raw-firehose',
    sourceDomainIds: ['data-engineering-realtime', 'production-systems', 'soc-siem-security-monitoring'],
    rule: 'High-rate feeds should publish bounded projections to UI, not raw packets or raw events.',
    rationale: 'Production streaming systems isolate ingestion, validation, buffering, and display.',
    implementationNote: 'Keep worker-owned ingestion, backpressure counters, replay logs, and 100ms-style UI frame delivery.',
    regressionTests: ['raw packet handler does not call React state', 'backpressure increments dropped or delayed counters'],
  },
]

export const ATLASZ_DEFENSIVE_IMPROVEMENTS: AtlaszDefensiveImprovement[] = [
  {
    id: 'source-lineage-drawer',
    priority: 'near-term',
    sourceDomainIds: ['intelligence-ui-dashboards', 'data-engineering-realtime', 'dfir-forensics'],
    title: 'Add a source lineage drawer to World Radar and Signal panels',
    implementationNotes: [
      'Show raw source, parser, normalized event, graph mutation, and signal evidence in order.',
      'Include timestamps, source trust, parser version, and failed/stale states.',
    ],
    validationTests: ['signal without evidence IDs is rejected', 'source drawer renders unavailable/stale states'],
  },
  {
    id: 'detection-rule-style-signals',
    priority: 'near-term',
    sourceDomainIds: ['detection-engineering', 'soc-siem-security-monitoring'],
    title: 'Make Atlasz signals rule-like and fixture-tested',
    implementationNotes: [
      'Represent each signal with required inputs, condition, false-positive notes, and evidence IDs.',
      'Store negative fixtures so unusual conditions do not become noisy alerts.',
    ],
    validationTests: ['signal fixtures include positive and negative cases', 'missing required telemetry suppresses signal'],
  },
  {
    id: 'cti-graph-adapter-boundary',
    priority: 'mid-term',
    sourceDomainIds: ['threat-intelligence-cti', 'knowledge-graph-entity-resolution'],
    title: 'Prepare auth-gated OpenCTI/MISP graph adapter contracts',
    implementationNotes: [
      'Define STIX-like object mapping without enabling default runtime integration.',
      'Keep external CTI confidence separate from Atlasz verification.',
    ],
    validationTests: ['auth-gated adapter fails closed without config', 'revoked CTI objects are not displayed as active'],
  },
  {
    id: 'authorized-lab-mode-design',
    priority: 'later',
    sourceDomainIds: ['internet-mapping-authorized-recon', 'cloud-security', 'container-kubernetes-security'],
    title: 'Design but do not enable an authorized defensive lab mode',
    implementationNotes: [
      'Require scope proof, rate limits, target inventory, tool allowlist, and explicit user confirmation.',
      'Keep lab results local and excluded from default Atlasz world intelligence.',
    ],
    validationTests: ['lab tools cannot run without scope', 'out-of-scope targets are rejected before execution'],
  },
  {
    id: 'local-evidence-retrieval',
    priority: 'mid-term',
    sourceDomainIds: ['search-retrieval-vector', 'agent-engineering', 'osint-collection'],
    title: 'Build local evidence retrieval with mandatory citations',
    implementationNotes: [
      'Index only lawful, source-trailed evidence.',
      'Return snippets with source IDs, timestamps, and trust labels.',
    ],
    validationTests: ['retrieval result without citation is invalid', 'private/auth-gated evidence is filtered by policy'],
  },
]

const studyById = new Map(DEFENSIVE_SECURITY_STUDIES.map((studyItem) => [studyItem.id, studyItem]))

export function lookupDefensiveSecurityStudy(id: string): DefensiveSecurityStudy | undefined {
  return studyById.get(id)
}

export function studiesForDefensiveDomain(domainId: DefensiveSecurityDomainId): DefensiveSecurityStudy[] {
  return DEFENSIVE_SECURITY_STUDIES.filter((studyItem) => studyItem.domainId === domainId)
}

export function defensiveStudyIsDefaultRuntimeEligible(studyItem: DefensiveSecurityStudy): boolean {
  return studyItem.policy === 'candidate-library' && !studyItem.riskTags.some((tag) => tag === 'active-recon' || tag === 'malware-handling' || tag === 'personal-data')
}

export function defensiveStudyRequiresHumanReview(studyItem: DefensiveSecurityStudy): boolean {
  return (
    studyItem.policy === 'auth-gated-adapter' ||
    studyItem.policy === 'authorized-lab-only' ||
    studyItem.policy === 'blocked' ||
    studyItem.riskTags.some((tag) => tag === 'active-recon' || tag === 'malware-handling' || tag === 'personal-data' || tag === 'auth-required')
  )
}

export function summarizeDefensiveSecurityEngineering() {
  const byPolicy = countBy(DEFENSIVE_SECURITY_STUDIES, (studyItem) => studyItem.policy)
  const byDomain = countBy(DEFENSIVE_SECURITY_STUDIES, (studyItem) => studyItem.domainId)
  return {
    studyCount: DEFENSIVE_SECURITY_STUDIES.length,
    ruleCount: DEFENSIVE_ENGINEERING_RULES.length,
    improvementCount: ATLASZ_DEFENSIVE_IMPROVEMENTS.length,
    defaultRuntimeEligibleCount: DEFENSIVE_SECURITY_STUDIES.filter(defensiveStudyIsDefaultRuntimeEligible).length,
    humanReviewCount: DEFENSIVE_SECURITY_STUDIES.filter(defensiveStudyRequiresHumanReview).length,
    byPolicy,
    byDomain,
  }
}

function study(definition: DefensiveSecurityStudy): DefensiveSecurityStudy {
  return definition
}

function countBy<T, K extends string>(items: T[], getKey: (item: T) => K): Record<K, number> {
  return items.reduce(
    (counts, item) => {
      const key = getKey(item)
      counts[key] = (counts[key] ?? 0) + 1
      return counts
    },
    {} as Record<K, number>,
  )
}
