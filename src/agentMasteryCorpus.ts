export type MasteryDomainId =
  | 'opsec-privacy'
  | 'threat-intelligence'
  | 'network-intelligence'
  | 'internet-mapping'
  | 'malware-analysis'
  | 'engineering-architecture'
  | 'engineering-judgment'
  | 'ai-agent-engineering'
  | 'intelligence-analysis'
  | 'decision-analysis'
  | 'intelligence-tradecraft'
  | 'computer-science-systems'
  | 'distributed-systems-databases'
  | 'linux-operating-systems'
  | 'networking-infrastructure'
  | 'security-engineering'
  | 'cryptography'
  | 'infrastructure-reliability'
  | 'ai-systems-engineering'
  | 'scraping-crawling'
  | 'web-data-extraction'
  | 'api-automation'
  | 'data-pipelines'
  | 'search-indexing'
  | 'knowledge-graph-entity-resolution'
  | 'documents-ocr'
  | 'market-financial-data'
  | 'economics-incentives'
  | 'historical-reference'
  | 'geospatial-satellite-maps'
  | 'monitoring-alerts'

export type MasteryRuntimePolicy =
  | 'study-only'
  | 'allowed-library'
  | 'manual-review'
  | 'auth-required'
  | 'commercial-terms'
  | 'authorized-lab-only'
  | 'blocked'

export type MasteryRiskTag =
  | 'active-scan'
  | 'analytical-method'
  | 'browser-automation'
  | 'credentialed-api'
  | 'data-pipeline'
  | 'defensive-sensor'
  | 'document-processing'
  | 'engineering-reference'
  | 'entity-resolution'
  | 'geospatial'
  | 'historical-reference'
  | 'indexing'
  | 'licensed-content'
  | 'malware-handling'
  | 'market-data'
  | 'economic-data'
  | 'opsec'
  | 'personal-data'
  | 'privacy'
  | 'public-api'
  | 'scraping'
  | 'security-reference'
  | 'storage'

export const ANALYST_MENTAL_MODEL_DIMENSIONS = [
  'systems',
  'networks',
  'incentives',
  'evidence',
  'relationships',
  'history',
  'security',
  'data pipelines',
] as const

export type MasteryCorpusEntry = {
  id: string
  label: string
  upstreamUrl: string
  domainId: MasteryDomainId
  runtimePolicy: MasteryRuntimePolicy
  riskTags: MasteryRiskTag[]
  capabilities: string[]
  blockedUses: string[]
  engineeringLesson: string
}

export const AGENT_MASTERY_CORPUS: MasteryCorpusEntry[] = [
  entry('awesome-privacy', 'Awesome Privacy', 'https://github.com/pluja/awesome-privacy', 'opsec-privacy', 'study-only', ['privacy', 'opsec'], ['privacy tooling taxonomy', 'privacy threat-model references'], ['auto-installing tools', 'claiming privacy without threat model'], 'Privacy lists teach threat models and defensive hygiene; they are not runtime guarantees.'),
  entry('privacy-guides', 'Privacy Guides', 'https://github.com/privacyguides/privacyguides.org', 'opsec-privacy', 'study-only', ['privacy', 'opsec'], ['privacy guidance', 'source review discipline'], ['blindly applying recommendations', 'collecting personal data'], 'Privacy engineering starts with data minimization, explicit threat models, and source credibility.'),
  entry('inteltechniques-tools', 'IntelTechniques OSINT Tools', 'https://inteltechniques.com/tools/', 'opsec-privacy', 'manual-review', ['opsec', 'personal-data'], ['manual OSINT workflow study', 'privacy-aware investigation patterns'], ['automated person enrichment', 'login or account automation'], 'Investigation tooling must be scoped, lawful, and reviewed because many workflows touch people.'),
  entry('maigret', 'Maigret', 'https://github.com/soxoj/maigret', 'opsec-privacy', 'blocked', ['personal-data', 'opsec'], ['username-enumeration boundary study'], ['default runtime execution', 'third-party person/account enumeration'], 'Username enumeration is high-risk person data work and stays blocked from default Atlasz runtime.'),

  entry('decision-making', 'Decision Making', 'https://github.com/joelparkerhenderson/decision-making', 'decision-analysis', 'study-only', ['analytical-method'], ['decision frameworks', 'uncertainty handling', 'second-order effects'], ['treating frameworks as automatic answers'], 'Decision frameworks teach how to reason under uncertainty, compare options, and surface tradeoffs.'),
  entry('strategy', 'Strategy', 'https://github.com/joelparkerhenderson/strategy', 'decision-analysis', 'study-only', ['analytical-method'], ['strategy patterns', 'incentive structures', 'competitive dynamics'], ['making strategic claims without evidence'], 'Strategy study helps Atlasz reason about incentives, positioning, constraints, and downstream effects.'),
  entry('thinking', 'Thinking', 'https://github.com/joelparkerhenderson/thinking', 'decision-analysis', 'study-only', ['analytical-method'], ['first principles', 'cognitive tools', 'bias checks'], ['performative reasoning without testable claims'], 'Thinking references sharpen first-principles reasoning, bias detection, and clarity under ambiguity.'),
  entry('cia-csi-books', 'CIA Center for the Study of Intelligence books', 'https://www.cia.gov/resources/csi/books-monographs/', 'intelligence-tradecraft', 'study-only', ['analytical-method', 'security-reference'], ['structured analysis', 'analytic tradecraft', 'cognitive bias study'], ['treating historical/tradecraft texts as operational instruction'], 'Tradecraft sources teach evidence weighting, competing hypotheses, confidence, and analytic humility.'),
  entry('dni-ncsc-how-we-work', 'NCSC How We Work', 'https://www.dni.gov/index.php/ncsc-how-we-work', 'intelligence-tradecraft', 'study-only', ['analytical-method', 'security-reference'], ['counterintelligence posture', 'risk awareness', 'information protection'], ['using public guidance as proof of a specific threat'], 'NCSC guidance reinforces defensive information protection and attribution-risk thinking.'),
  entry('mitre-org', 'MITRE', 'https://www.mitre.org', 'intelligence-tradecraft', 'study-only', ['analytical-method', 'security-reference'], ['systems thinking', 'public-interest R&D', 'risk frameworks'], ['treating frameworks as verified event evidence'], 'MITRE is valuable for structured frameworks, systems thinking, and defensive analytic vocabulary.'),

  entry('mitre-cti', 'MITRE CTI', 'https://github.com/mitre/cti', 'threat-intelligence', 'allowed-library', ['security-reference', 'public-api'], ['STIX object modeling', 'threat relationship graphs'], ['presenting CTI as verified ground truth'], 'STIX-style CTI teaches typed threat graphs and versioned relationships.'),
  entry('attack-stix-data', 'ATT&CK STIX Data', 'https://github.com/mitre-attack/attack-stix-data', 'threat-intelligence', 'allowed-library', ['security-reference', 'public-api'], ['ATT&CK technique graph', 'defensive mapping'], ['operational attack guidance'], 'ATT&CK is most useful as defensive taxonomy, not as instructions.'),
  entry('sigma-rules', 'Sigma Rules', 'https://github.com/SigmaHQ/sigma', 'threat-intelligence', 'allowed-library', ['security-reference'], ['portable detection rules', 'detection engineering patterns'], ['claiming rule hits without telemetry validation'], 'Sigma teaches portable detection logic and the need for data-source-specific validation.'),
  entry('yara-rules', 'YARA Rules', 'https://github.com/Yara-Rules/rules', 'threat-intelligence', 'manual-review', ['security-reference', 'malware-handling'], ['malware detection rules', 'static signature design'], ['scanning untrusted samples without sandbox policy'], 'YARA rules teach pattern matching and false-positive control; sample handling still needs a lab.'),
  entry('atomic-red-team', 'Atomic Red Team', 'https://github.com/redcanaryco/atomic-red-team', 'threat-intelligence', 'authorized-lab-only', ['security-reference', 'active-scan'], ['control validation', 'ATT&CK-mapped tests'], ['running tests outside owned lab environments'], 'Atomic tests are powerful validation primitives, but execution belongs only in authorized labs.'),
  entry('awesome-threat-intelligence', 'Awesome Threat Intelligence', 'https://github.com/hslatman/awesome-threat-intelligence', 'intelligence-analysis', 'study-only', ['security-reference'], ['CTI source taxonomy', 'feed landscape review'], ['auto-trusting feeds by list inclusion'], 'Threat-intel lists are discovery maps; each feed still needs provenance, freshness, and quality scoring.'),
  entry('awesome-threat-detection', 'Awesome Threat Detection', 'https://github.com/0x4D31/awesome-threat-detection', 'intelligence-analysis', 'study-only', ['security-reference'], ['detection engineering taxonomy', 'threat hunting references'], ['turning references into unsupervised scans'], 'Detection engineering is about telemetry, hypotheses, validation, and false-positive control.'),
  entry('awesome-security', 'Awesome Security', 'https://github.com/sbilly/awesome-security', 'intelligence-analysis', 'study-only', ['security-reference'], ['security domain map', 'tool discovery'], ['auto-installing security tools'], 'Broad security lists teach categories; runtime requires explicit policy.'),

  entry('zeek', 'Zeek', 'https://github.com/zeek/zeek', 'network-intelligence', 'allowed-library', ['defensive-sensor'], ['network metadata logging', 'protocol analysis'], ['monitoring networks without authorization'], 'Zeek teaches evented network telemetry and protocol-aware logging.'),
  entry('suricata', 'Suricata', 'https://github.com/OISF/suricata', 'network-intelligence', 'allowed-library', ['defensive-sensor'], ['IDS/IPS telemetry', 'packet inspection', 'rule evaluation'], ['inline blocking without explicit operator config'], 'Suricata teaches high-throughput packet inspection and detection rule tradeoffs.'),
  entry('arkime', 'Arkime', 'https://github.com/arkime/arkime', 'network-intelligence', 'allowed-library', ['defensive-sensor', 'storage'], ['packet capture indexing', 'session search'], ['collecting traffic without lawful authorization'], 'Arkime shows how packet evidence becomes searchable operational telemetry.'),
  entry('security-onion', 'Security Onion', 'https://github.com/Security-Onion-Solutions/securityonion', 'network-intelligence', 'allowed-library', ['defensive-sensor', 'data-pipeline'], ['SOC stack architecture', 'Zeek/Suricata/Elastic integration'], ['deploying monitoring without owner consent'], 'Security Onion teaches integrated defensive monitoring, hunting, alerting, and case workflows.'),

  entry('amass', 'OWASP Amass', 'https://github.com/owasp-amass/amass', 'internet-mapping', 'authorized-lab-only', ['active-scan', 'opsec'], ['attack-surface mapping design', 'asset-discovery architecture'], ['scanning third parties by default'], 'Amass is valuable architecture for authorized asset mapping, not default background collection.'),
  entry('projectdiscovery', 'ProjectDiscovery ecosystem', 'https://github.com/projectdiscovery', 'internet-mapping', 'authorized-lab-only', ['active-scan', 'opsec'], ['modular recon pipeline design', 'tool composition'], ['unsupervised internet probing'], 'ProjectDiscovery tools teach composable pipelines; Atlasz must require scope and audit before execution.'),
  entry('subfinder', 'Subfinder', 'https://github.com/projectdiscovery/subfinder', 'internet-mapping', 'authorized-lab-only', ['active-scan'], ['subdomain discovery pattern study'], ['enumerating non-owned domains by default'], 'Subdomain enumeration requires authorized scope and source provenance.'),
  entry('httpx', 'httpx', 'https://github.com/projectdiscovery/httpx', 'internet-mapping', 'authorized-lab-only', ['active-scan'], ['HTTP probing architecture', 'service fingerprinting'], ['probing targets without authorization'], 'HTTP probing can create traffic toward targets and must stay scoped.'),
  entry('naabu', 'Naabu', 'https://github.com/projectdiscovery/naabu', 'internet-mapping', 'authorized-lab-only', ['active-scan'], ['port discovery design', 'scan rate tradeoffs'], ['port scanning outside authorized ranges'], 'Port scanning is an active operation and never a default Atlasz action.'),
  entry('nuclei', 'Nuclei', 'https://github.com/projectdiscovery/nuclei', 'internet-mapping', 'authorized-lab-only', ['active-scan'], ['template-driven validation', 'vulnerability-check architecture'], ['vulnerability scanning without explicit scope'], 'Template-driven scanners need strict scope, rate control, and operator approval.'),
  entry('katana', 'Katana', 'https://github.com/projectdiscovery/katana', 'internet-mapping', 'authorized-lab-only', ['active-scan', 'scraping'], ['crawler architecture', 'link discovery'], ['unbounded crawling or bypass behavior'], 'Crawlers need robots/terms review, rate limits, and scope boundaries.'),
  entry('dnsx', 'dnsx', 'https://github.com/projectdiscovery/dnsx', 'internet-mapping', 'authorized-lab-only', ['active-scan'], ['DNS resolution pipelines', 'asset validation'], ['high-volume DNS probing without scope'], 'DNS tooling teaches resolution pipelines but still creates observable queries.'),

  entry('capa', 'capa', 'https://github.com/mandiant/capa', 'malware-analysis', 'authorized-lab-only', ['malware-handling', 'security-reference'], ['capability extraction', 'malware triage'], ['running untrusted binaries outside a lab'], 'capa teaches capability-based malware triage and rule engineering.'),
  entry('floss', 'FLOSS', 'https://github.com/mandiant/flare-floss', 'malware-analysis', 'authorized-lab-only', ['malware-handling'], ['string deobfuscation', 'static analysis'], ['processing untrusted samples without containment'], 'FLOSS shows how static extraction improves triage, but samples require containment.'),
  entry('remnux', 'REMnux', 'https://github.com/REMnux/remnux', 'malware-analysis', 'authorized-lab-only', ['malware-handling'], ['malware analysis lab design', 'toolchain packaging'], ['handling samples on production machines'], 'REMnux is a model for isolated malware-analysis environments.'),
  entry('volatility3', 'Volatility 3', 'https://github.com/volatilityfoundation/volatility3', 'malware-analysis', 'authorized-lab-only', ['malware-handling'], ['memory forensics', 'incident analysis'], ['processing private memory images without authorization'], 'Memory forensics needs chain-of-custody and privacy handling.'),

  entry('system-design-primer', 'System Design Primer', 'https://github.com/donnemartin/system-design-primer', 'engineering-architecture', 'study-only', ['engineering-reference'], ['system design patterns', 'scaling tradeoffs'], ['cargo-culting architectures'], 'System design mastery is understanding tradeoffs, not memorizing diagrams.'),
  entry('awesome-scalability', 'Awesome Scalability', 'https://github.com/binhnguyennus/awesome-scalability', 'engineering-architecture', 'study-only', ['engineering-reference'], ['scalability case studies', 'distributed systems lessons'], ['assuming scale patterns apply everywhere'], 'Scalability references teach constraints, bottlenecks, and operational tradeoffs.'),
  entry('awesome-distributed-systems', 'Awesome Distributed Systems', 'https://github.com/theanalyst/awesome-distributed-systems', 'engineering-architecture', 'study-only', ['engineering-reference'], ['distributed systems taxonomy', 'consensus/fault tolerance references'], ['adding distributed complexity too early'], 'Distributed systems are about failure, ordering, consensus, and observability.'),
  entry('ossu-computer-science', 'OSSU Computer Science', 'https://github.com/ossu/computer-science', 'computer-science-systems', 'study-only', ['engineering-reference'], ['CS curriculum', 'first principles'], ['credential theater'], 'CS foundations help reason from fundamentals instead of recipes.'),
  entry('developer-roadmap', 'Developer Roadmap', 'https://github.com/kamranahmedse/developer-roadmap', 'computer-science-systems', 'study-only', ['engineering-reference'], ['skill maps', 'learning paths'], ['treating roadmaps as mastery'], 'Roadmaps help sequence learning; real mastery needs implementation and review.'),
  entry('build-your-own-x', 'Build Your Own X', 'https://github.com/codecrafters-io/build-your-own-x', 'computer-science-systems', 'study-only', ['engineering-reference'], ['from-scratch implementation practice'], ['shipping toy implementations as production systems'], 'Building simplified systems teaches internal mechanics and failure modes.'),
  entry('papers-we-love', 'Papers We Love', 'https://github.com/papers-we-love/papers-we-love', 'distributed-systems-databases', 'study-only', ['engineering-reference'], ['classic papers', 'design rationale'], ['quoting papers without applying constraints'], 'Good papers teach why systems are built the way they are.'),
  entry('system-design-101', 'System Design 101', 'https://github.com/ByteByteGoHq/system-design-101', 'engineering-architecture', 'study-only', ['engineering-reference'], ['visual system-design patterns', 'tradeoff summaries'], ['replacing source docs with diagrams'], 'Visual summaries help, but implementation details still matter.'),
  entry('ddia', 'Designing Data-Intensive Applications', 'https://github.com/ddia/ddia', 'distributed-systems-databases', 'study-only', ['engineering-reference'], ['data systems principles', 'distributed tradeoffs'], ['using book references as runtime dependencies'], 'DDIA is a core mental model source for storage, streams, consistency, and reliability.'),
  entry('ddia-references', 'DDIA References', 'https://github.com/ept/ddia-references', 'distributed-systems-databases', 'study-only', ['engineering-reference'], ['data systems papers', 'source bibliography'], ['citation stuffing'], 'References matter because good systems are built on accumulated hard lessons.'),
  entry('tidb', 'TiDB', 'https://github.com/pingcap/tidb', 'distributed-systems-databases', 'study-only', ['engineering-reference', 'storage'], ['distributed SQL architecture', 'transactions', 'raft-backed storage'], ['copying database architecture without operational need'], 'TiDB is useful for studying real distributed database engineering.'),
  entry('etcd', 'etcd', 'https://github.com/etcd-io/etcd', 'distributed-systems-databases', 'study-only', ['engineering-reference', 'storage'], ['consensus-backed key-value stores', 'coordination systems'], ['using consensus casually'], 'etcd teaches operational consensus, leases, watch APIs, and failure handling.'),
  entry('hashicorp-raft', 'HashiCorp Raft', 'https://github.com/hashicorp/raft', 'distributed-systems-databases', 'study-only', ['engineering-reference'], ['consensus implementation', 'log replication'], ['building consensus without testing failures'], 'Consensus code is a lesson in explicit state machines and fault cases.'),

  entry('linux', 'Linux kernel', 'https://github.com/torvalds/linux', 'linux-operating-systems', 'study-only', ['engineering-reference'], ['kernel architecture', 'network/storage subsystems'], ['modifying kernel assumptions casually'], 'Linux teaches systems engineering at scale: interfaces, compatibility, and performance.'),
  entry('systemd', 'systemd', 'https://github.com/systemd/systemd', 'linux-operating-systems', 'study-only', ['engineering-reference'], ['service management', 'boot/session architecture'], ['assuming init behavior across platforms'], 'Service lifecycle engineering is critical for resilient local-first apps.'),
  entry('freebsd-src', 'FreeBSD source', 'https://github.com/freebsd/freebsd-src', 'linux-operating-systems', 'study-only', ['engineering-reference'], ['OS architecture', 'network stack design'], ['porting assumptions blindly'], 'FreeBSD offers a contrasting systems design lineage.'),
  entry('glibc', 'glibc', 'https://github.com/bminor/glibc', 'linux-operating-systems', 'study-only', ['engineering-reference'], ['C runtime behavior', 'syscall interfaces'], ['depending on libc quirks unknowingly'], 'Runtime libraries shape every systems program in subtle ways.'),
  entry('wireshark', 'Wireshark', 'https://github.com/wireshark/wireshark', 'networking-infrastructure', 'study-only', ['engineering-reference', 'defensive-sensor'], ['packet dissection', 'protocol analysis'], ['capturing unauthorized traffic'], 'Wireshark teaches protocol truth from packets upward.'),
  entry('awesome-network-analysis', 'Awesome Network Analysis', 'https://github.com/bkrem/awesome-network-analysis', 'networking-infrastructure', 'study-only', ['engineering-reference', 'defensive-sensor'], ['network-analysis taxonomy', 'tool landscape'], ['auto-running capture tools'], 'Network-analysis lists help build the map before choosing tools.'),
  entry('cloudflare-org', 'Cloudflare GitHub', 'https://github.com/cloudflare', 'networking-infrastructure', 'study-only', ['engineering-reference'], ['edge/network engineering patterns', 'internet reliability'], ['assuming provider-specific patterns are universal'], 'Large edge systems teach real-world reliability and traffic-management constraints.'),
  entry('envoy', 'Envoy', 'https://github.com/envoyproxy/envoy', 'networking-infrastructure', 'study-only', ['engineering-reference'], ['proxy architecture', 'service mesh data plane'], ['adding proxy complexity without need'], 'Envoy teaches production traffic management, filters, and observability.'),
  entry('coredns', 'CoreDNS', 'https://github.com/coredns/coredns', 'networking-infrastructure', 'study-only', ['engineering-reference'], ['DNS plugin architecture', 'service discovery'], ['treating DNS as simple string lookup'], 'DNS is infrastructure glue; CoreDNS shows extensible resolver design.'),
  entry('kubernetes', 'Kubernetes', 'https://github.com/kubernetes/kubernetes', 'networking-infrastructure', 'study-only', ['engineering-reference'], ['control planes', 'scheduling', 'declarative reconciliation'], ['using orchestration before operational need'], 'Kubernetes is a masterclass in reconciliation, APIs, and distributed controllers.'),
  entry('containerd', 'containerd', 'https://github.com/containerd/containerd', 'networking-infrastructure', 'study-only', ['engineering-reference'], ['container runtime architecture', 'image/content stores'], ['confusing containers with security boundaries'], 'Container runtimes teach isolation primitives and operational packaging.'),

  entry('google-security-research', 'Google Security Research', 'https://github.com/google/security-research', 'security-engineering', 'study-only', ['security-reference'], ['vulnerability research patterns', 'defensive learnings'], ['weaponizing research'], 'Security research should improve defensive understanding and patch quality.'),
  entry('fuzzilli', 'Fuzzilli', 'https://github.com/googleprojectzero/fuzzilli', 'security-engineering', 'authorized-lab-only', ['security-reference'], ['fuzzing architecture', 'JS engine testing'], ['running exploit research outside a lab'], 'Fuzzing teaches automated bug discovery and corpus minimization.'),
  entry('trailofbits-publications', 'Trail of Bits publications', 'https://github.com/trailofbits/publications', 'security-engineering', 'study-only', ['security-reference'], ['audit methodology', 'security engineering papers'], ['treating audits as universal proof'], 'High-quality security writing teaches methodology, threat modeling, and precise claims.'),
  entry('trailofbits', 'Trail of Bits GitHub', 'https://github.com/trailofbits', 'security-engineering', 'study-only', ['security-reference'], ['security tools', 'audit patterns'], ['auto-running tools without scope'], 'Security tooling should support review, not replace reasoning.'),
  entry('payloads-all-the-things', 'PayloadsAllTheThings', 'https://github.com/swisskyrepo/PayloadsAllTheThings', 'security-engineering', 'blocked', ['security-reference', 'active-scan'], ['defensive awareness of exploit classes'], ['payload generation or exploitation from Atlasz'], 'Payload references are blocked from runtime; keep them as defensive awareness only.'),
  entry('owasp-cheat-sheet-series', 'OWASP Cheat Sheet Series', 'https://github.com/OWASP/CheatSheetSeries', 'security-engineering', 'study-only', ['security-reference'], ['secure design guidance', 'appsec controls'], ['treating checklists as complete security'], 'OWASP cheat sheets teach practical control design and review prompts.'),
  entry('owasp-top-ten', 'OWASP Top Ten', 'https://owasp.org/www-project-top-ten/', 'security-engineering', 'study-only', ['security-reference'], ['risk taxonomy', 'appsec prioritization'], ['reducing security to one list'], 'The Top Ten is a prioritization lens, not a full security program.'),

  entry('libsodium', 'libsodium', 'https://github.com/jedisct1/libsodium', 'cryptography', 'study-only', ['engineering-reference'], ['safe crypto APIs', 'modern primitives'], ['inventing crypto protocols'], 'Good crypto engineering is choosing safe primitives and misuse-resistant APIs.'),
  entry('openssl', 'OpenSSL', 'https://github.com/openssl/openssl', 'cryptography', 'study-only', ['engineering-reference'], ['TLS/crypto implementation', 'compatibility engineering'], ['assuming crypto code is easy to modify safely'], 'OpenSSL teaches both power and risk in widely deployed cryptographic libraries.'),
  entry('bitcoin-core', 'Bitcoin Core', 'https://github.com/bitcoin/bitcoin', 'cryptography', 'study-only', ['engineering-reference', 'storage'], ['peer-to-peer systems', 'consensus rules', 'wallet/network architecture'], ['financial advice or transaction automation'], 'Bitcoin Core is a deep systems corpus for consensus, networking, and adversarial environments.'),
  entry('secp256k1', 'libsecp256k1', 'https://github.com/bitcoin-core/secp256k1', 'cryptography', 'study-only', ['engineering-reference'], ['constant-time crypto', 'elliptic curve implementation'], ['rewriting crypto primitives casually'], 'secp256k1 teaches careful performance/security tradeoffs in cryptographic code.'),

  entry('prometheus', 'Prometheus', 'https://github.com/prometheus/prometheus', 'infrastructure-reliability', 'allowed-library', ['engineering-reference'], ['metrics architecture', 'alerting model'], ['alerting without SLOs'], 'Prometheus teaches pull-based metrics, labels, cardinality, and alert design.'),
  entry('grafana', 'Grafana', 'https://github.com/grafana/grafana', 'infrastructure-reliability', 'allowed-library', ['engineering-reference'], ['dashboards', 'observability UX'], ['dashboard sprawl without actionability'], 'Grafana teaches visual observability and the risk of pretty-but-useless panels.'),
  entry('awesome-sre', 'Awesome SRE', 'https://github.com/dastergon/awesome-sre', 'infrastructure-reliability', 'study-only', ['engineering-reference'], ['SRE reference map', 'reliability practices', 'incident thinking'], ['collecting reliability links without SLOs'], 'SRE references teach how systems fail, how teams measure reliability, and how operations shape design.'),
  entry('google-sre', 'Google SRE', 'https://sre.google', 'infrastructure-reliability', 'study-only', ['engineering-reference'], ['SLOs', 'error budgets', 'incident response', 'reliability culture'], ['copying Google-scale process into small systems blindly'], 'Google SRE material teaches reliability as a product constraint, not an afterthought.'),
  entry('school-of-sre', 'LinkedIn School of SRE', 'https://github.com/linkedin/school-of-sre', 'infrastructure-reliability', 'study-only', ['engineering-reference'], ['SRE curriculum', 'Linux/networking/observability foundations'], ['treating curriculum completion as operational maturity'], 'School of SRE links fundamentals to production operations and failure analysis.'),
  entry('opentelemetry-spec', 'OpenTelemetry Specification', 'https://github.com/opentelemetry/opentelemetry-specification', 'infrastructure-reliability', 'study-only', ['engineering-reference'], ['tracing/metrics/logs contracts', 'telemetry semantics'], ['instrumentation without sampling/privacy policy'], 'Telemetry needs schemas, context propagation, sampling, and privacy boundaries.'),
  entry('elasticsearch', 'Elasticsearch', 'https://github.com/elastic/elasticsearch', 'search-indexing', 'allowed-library', ['indexing', 'storage'], ['search architecture', 'distributed indexing'], ['using search as source of truth'], 'Search systems teach indexing, relevance, shards, and operational cost.'),

  entry('vllm', 'vLLM', 'https://github.com/vllm-project/vllm', 'ai-systems-engineering', 'study-only', ['engineering-reference'], ['LLM serving', 'KV-cache efficiency', 'scheduler design'], ['assuming local inference is free'], 'LLM serving is a systems problem: batching, memory, latency, and throughput.'),
  entry('transformers', 'Transformers', 'https://github.com/huggingface/transformers', 'ai-systems-engineering', 'allowed-library', ['engineering-reference'], ['model loading', 'tokenization', 'inference APIs'], ['treating model output as verified'], 'Transformers teaches model plumbing, but output still needs evidence.'),
  entry('text-generation-inference', 'Text Generation Inference', 'https://github.com/huggingface/text-generation-inference', 'ai-systems-engineering', 'study-only', ['engineering-reference'], ['production inference serving', 'batching', 'streaming'], ['deploying without resource and abuse controls'], 'Inference servers need queueing, safety, telemetry, and resource controls.'),
  entry('ollama', 'Ollama', 'https://github.com/ollama/ollama', 'ai-systems-engineering', 'allowed-library', ['engineering-reference'], ['local model runtime', 'model packaging'], ['promoting local output to verified truth'], 'Local models are useful but must remain provenance-labeled.'),
  entry('langgraph', 'LangGraph', 'https://github.com/langchain-ai/langgraph', 'ai-agent-engineering', 'study-only', ['engineering-reference'], ['stateful workflows', 'agent control flow'], ['unbounded tool access'], 'State graphs teach recoverable agent workflows and explicit transitions.'),
  entry('openhands', 'OpenHands', 'https://github.com/All-Hands-AI/OpenHands', 'ai-agent-engineering', 'study-only', ['engineering-reference'], ['software-agent architecture', 'sandboxing patterns'], ['letting agents mutate systems without review'], 'Coding agents need sandboxes, tests, permissions, and audit trails.'),
  entry('autogen', 'AutoGen', 'https://github.com/microsoft/autogen', 'ai-agent-engineering', 'study-only', ['engineering-reference'], ['multi-agent orchestration', 'human-in-the-loop patterns'], ['browser/local-control trust-boundary mistakes'], 'Agent frameworks teach why local control planes need auth, isolation, and tool policy.'),
  entry('langchain', 'LangChain', 'https://github.com/langchain-ai/langchain', 'ai-agent-engineering', 'study-only', ['engineering-reference'], ['LLM app composition', 'retrieval/tool abstractions'], ['framework sprawl over simple code'], 'LangChain is useful for patterns, but production systems need minimal explicit boundaries.'),
  entry('pydantic-ai', 'PydanticAI', 'https://github.com/pydantic/pydantic-ai', 'ai-agent-engineering', 'study-only', ['engineering-reference'], ['typed agent outputs', 'validation-first design'], ['trusting structured output without evidence'], 'Typed outputs reduce ambiguity but do not prove truth.'),
  entry('openai-agents-python', 'OpenAI Agents SDK', 'https://github.com/openai/openai-agents-python', 'ai-agent-engineering', 'study-only', ['engineering-reference'], ['agent orchestration', 'tool policies', 'handoffs'], ['unreviewed high-risk tool calls'], 'Agent SDKs should be studied through permissions, traces, and typed tool boundaries.'),
  entry('awesome-llm', 'Awesome LLM', 'https://github.com/Hannibal046/Awesome-LLM', 'ai-systems-engineering', 'study-only', ['engineering-reference'], ['LLM research map', 'paper/tool taxonomy'], ['treating lists as truth'], 'LLM lists help orientation, not verification.'),
  entry('awesome-datascience', 'Awesome Data Science', 'https://github.com/academic/awesome-datascience', 'engineering-architecture', 'study-only', ['engineering-reference'], ['data science taxonomy', 'tool discovery'], ['stack sprawl'], 'Data tooling should be chosen from workflow needs, not list length.'),
  entry('awesome-deep-learning', 'Awesome Deep Learning', 'https://github.com/academic/awesome-deep-learning', 'ai-systems-engineering', 'study-only', ['engineering-reference'], ['deep learning taxonomy', 'learning resources'], ['assuming popularity equals reliability'], 'Deep learning resources need grounding in experiments and benchmarks.'),
  entry('google-eng-practices', 'Google Engineering Practices', 'https://github.com/google/eng-practices', 'engineering-architecture', 'study-only', ['engineering-reference'], ['code review discipline', 'engineering culture'], ['copying process without team context'], 'Elite engineering is reviewable, tested, simple, and explicit.'),
  entry('netflix-tech-blog', 'Netflix Tech Blog', 'https://netflixtechblog.com', 'engineering-judgment', 'study-only', ['engineering-reference'], ['distributed systems case studies', 'resilience patterns', 'engineering tradeoffs'], ['copying hyperscale patterns without constraints'], 'Netflix engineering writing teaches real tradeoffs in availability, experimentation, and operational learning.'),
  entry('cloudflare-blog', 'Cloudflare Blog', 'https://blog.cloudflare.com', 'engineering-judgment', 'study-only', ['engineering-reference'], ['internet infrastructure case studies', 'incident writeups', 'edge systems'], ['assuming provider-specific designs are universal'], 'Cloudflare writing is useful for understanding how internet systems fail, recover, and scale.'),
  entry('stripe-engineering-blog', 'Stripe Engineering Blog', 'https://stripe.com/blog/engineering', 'engineering-judgment', 'study-only', ['engineering-reference'], ['payments infrastructure', 'API design', 'reliability engineering'], ['copying process without product risk context'], 'Stripe engineering material teaches careful API design, correctness, reliability, and operational discipline.'),
  entry('teachyourselfcs', 'Teach Yourself CS', 'https://teachyourselfcs.com/', 'computer-science-systems', 'study-only', ['engineering-reference'], ['CS foundations', 'learning sequence'], ['mistaking reading for mastery'], 'First-principles CS improves judgment across every codebase.'),
  entry('github-system-design-collection', 'GitHub System Design Collection', 'https://github.com/collections/system-design', 'engineering-architecture', 'study-only', ['engineering-reference'], ['system-design landscape', 'case study discovery'], ['auto-adopting architectures'], 'Collections are maps; engineering decisions still need constraints.'),

  entry('scrapy', 'Scrapy', 'https://github.com/scrapy/scrapy', 'scraping-crawling', 'manual-review', ['scraping', 'data-pipeline'], ['crawler framework design', 'structured extraction'], ['scraping disallowed/private/paywalled sites'], 'Scrapy is powerful only when paired with robots, terms, rate limits, and source policy.'),
  entry('requests', 'Requests', 'https://github.com/psf/requests', 'scraping-crawling', 'allowed-library', ['public-api'], ['HTTP clients', 'API access'], ['hammering endpoints or ignoring errors'], 'HTTP clients need retries, timeouts, backoff, and clear user-agent policy.'),
  entry('requests-html', 'Requests-HTML', 'https://github.com/psf/requests-html', 'scraping-crawling', 'manual-review', ['scraping'], ['HTML fetching/rendering study'], ['bypassing dynamic-site controls'], 'HTML rendering is a sensitive boundary; prefer APIs/RSS first.'),
  entry('beautifulsoup4', 'Beautiful Soup 4', 'https://github.com/beautifulsoup/beautifulsoup4', 'scraping-crawling', 'allowed-library', ['scraping'], ['HTML parsing', 'DOM extraction'], ['parsing pages that should not be collected'], 'Parsing is not permission; source policy comes first.'),
  entry('pyppeteer', 'Pyppeteer', 'https://github.com/pyppeteer/pyppeteer', 'scraping-crawling', 'manual-review', ['browser-automation', 'scraping'], ['browser automation study'], ['anti-bot bypass or login automation'], 'Headless browsers require explicit allowed-use boundaries.'),
  entry('playwright', 'Playwright', 'https://github.com/microsoft/playwright', 'scraping-crawling', 'manual-review', ['browser-automation', 'scraping'], ['browser testing', 'permitted page automation'], ['login/paywall/CAPTCHA bypass'], 'Playwright is excellent for tests and permitted automation, not stealth scraping.'),
  entry('selenium', 'Selenium', 'https://github.com/SeleniumHQ/selenium', 'scraping-crawling', 'manual-review', ['browser-automation'], ['browser automation', 'testing'], ['anti-bot evasion'], 'Browser automation needs consent, scope, and rate limits.'),
  entry('browserless', 'browserless', 'https://github.com/browserless/browserless', 'scraping-crawling', 'manual-review', ['browser-automation'], ['browser automation infrastructure'], ['centralized scraping without policy'], 'Browser automation infrastructure can amplify mistakes; guard it heavily.'),
  entry('crawlee-python', 'Crawlee Python', 'https://github.com/apify/crawlee-python', 'scraping-crawling', 'manual-review', ['scraping', 'data-pipeline'], ['crawler pipelines', 'queue/retry design'], ['collecting private or disallowed content'], 'Crawler queues and retries need lawful source contracts.'),
  entry('crawlee', 'Crawlee', 'https://github.com/apify/crawlee', 'scraping-crawling', 'manual-review', ['scraping', 'data-pipeline'], ['crawler architecture', 'dataset pipelines'], ['stealth collection'], 'Crawlee teaches robust crawling, but Atlasz must prefer APIs/RSS first.'),
  entry('apify-sdk-python', 'Apify SDK Python', 'https://github.com/apify/apify-sdk-python', 'scraping-crawling', 'manual-review', ['scraping', 'data-pipeline'], ['actor pattern study', 'dataset storage'], ['running third-party actors blindly'], 'Actor ecosystems need source-policy and supply-chain review.'),
  entry('crawl4ai', 'Crawl4AI', 'https://github.com/unclecode/crawl4ai', 'scraping-crawling', 'manual-review', ['scraping', 'browser-automation'], ['LLM-ready crawling', 'markdown extraction'], ['using AI extraction to bypass source policy'], 'LLM-ready crawling still starts with lawful access.'),
  entry('gpt-crawler', 'GPT Crawler', 'https://github.com/BuilderIO/gpt-crawler', 'scraping-crawling', 'manual-review', ['scraping'], ['site-to-knowledge-base pipelines'], ['crawling without permission or attribution'], 'Knowledge-base crawling requires scope, attribution, and stale-data policy.'),

  entry('trafilatura', 'Trafilatura', 'https://github.com/adbar/trafilatura', 'web-data-extraction', 'allowed-library', ['document-processing'], ['main-text extraction', 'metadata extraction'], ['discarding source URLs or timestamps'], 'Clean extraction must preserve evidence and provenance.'),
  entry('goose3', 'Goose3', 'https://github.com/goose3/goose3', 'web-data-extraction', 'allowed-library', ['document-processing'], ['article extraction', 'metadata parsing'], ['claiming extraction equals verification'], 'Article extraction is normalization, not validation.'),
  entry('python-readability', 'python-readability', 'https://github.com/buriy/python-readability', 'web-data-extraction', 'allowed-library', ['document-processing'], ['readability extraction', 'HTML cleanup'], ['losing context needed for evidence'], 'Readable text should retain original source pointers.'),
  entry('sumy', 'Sumy', 'https://github.com/miso-belica/sumy', 'web-data-extraction', 'allowed-library', ['document-processing'], ['extractive summarization', 'baseline NLP'], ['summarizing away uncertainty'], 'Summaries must preserve uncertainty and source trails.'),
  entry('unstructured', 'Unstructured', 'https://github.com/Unstructured-IO/unstructured', 'web-data-extraction', 'allowed-library', ['document-processing'], ['document parsing', 'chunking', 'RAG ingestion'], ['ingesting documents without source rights'], 'Document pipelines need source rights, raw evidence retention, and chunk provenance.'),
  entry('haystack', 'Haystack', 'https://github.com/deepset-ai/haystack', 'web-data-extraction', 'study-only', ['indexing', 'document-processing'], ['RAG pipelines', 'retrieval architecture'], ['retrieval without citation/evidence'], 'RAG systems are only useful when retrieval evidence is visible and testable.'),

  entry('public-apis', 'public-apis', 'https://github.com/public-apis/public-apis', 'api-automation', 'study-only', ['public-api'], ['API discovery', 'source candidate research'], ['trusting APIs by list inclusion'], 'API lists are source discovery maps; each API needs terms, freshness, and reliability checks.'),
  entry('python-api-wrappers', 'Python API wrappers', 'https://github.com/realpython/list-of-python-api-wrappers', 'api-automation', 'study-only', ['public-api'], ['wrapper discovery', 'integration research'], ['using wrappers without source/API review'], 'Wrappers reduce plumbing, not source-policy obligations.'),
  entry('discord-py', 'discord.py', 'https://github.com/Rapptz/discord.py', 'api-automation', 'auth-required', ['credentialed-api'], ['bot API patterns', 'event ingestion'], ['collecting private communities without consent'], 'Community APIs require bot permissions, privacy review, and clear scope.'),
  entry('tweepy', 'Tweepy', 'https://github.com/tweepy/tweepy', 'api-automation', 'auth-required', ['credentialed-api', 'personal-data'], ['X/Twitter API client patterns'], ['bypassing official API limits or scraping accounts'], 'Social APIs are auth/terms gated and may touch personal data.'),
  entry('praw', 'PRAW', 'https://github.com/praw-dev/praw', 'api-automation', 'auth-required', ['credentialed-api', 'personal-data'], ['Reddit API client patterns'], ['collecting private/deleted/user-targeted data'], 'Forum APIs need user/content privacy and terms review.'),
  entry('yt-dlp', 'yt-dlp', 'https://github.com/yt-dlp/yt-dlp', 'api-automation', 'manual-review', ['licensed-content'], ['media metadata extraction study'], ['downloading restricted/copyrighted content'], 'Media extraction has strong rights and terms boundaries.'),
  entry('google-api-python-client', 'Google API Python Client', 'https://github.com/googleapis/google-api-python-client', 'api-automation', 'auth-required', ['credentialed-api'], ['Google API integration patterns'], ['using broad scopes or private data without need'], 'Google APIs require least-privilege scopes and explicit user/project consent.'),

  entry('airflow', 'Apache Airflow', 'https://github.com/apache/airflow', 'data-pipelines', 'study-only', ['data-pipeline'], ['scheduled workflows', 'DAG orchestration'], ['overbuilding simple local jobs'], 'Airflow teaches orchestration, retries, scheduling, and operational metadata.'),
  entry('awesome-public-datasets', 'Awesome Public Datasets', 'https://github.com/awesomedata/awesome-public-datasets', 'data-pipelines', 'study-only', ['data-pipeline', 'public-api'], ['public dataset discovery', 'source taxonomy', 'coverage mapping'], ['trusting datasets by list inclusion'], 'Public dataset catalogs are maps for source discovery, not substitutes for provenance and freshness review.'),
  entry('apache-spark', 'Apache Spark', 'https://github.com/apache/spark', 'data-pipelines', 'study-only', ['data-pipeline'], ['distributed data processing', 'batch analytics', 'large-scale transforms'], ['adding distributed compute to local-first workflows without need'], 'Spark teaches large-scale data processing tradeoffs and the cost of distributed execution.'),
  entry('apache-kafka', 'Apache Kafka', 'https://github.com/apache/kafka', 'data-pipelines', 'study-only', ['data-pipeline'], ['event logs', 'stream processing', 'consumer groups'], ['using heavy streaming infrastructure before local queues are exhausted'], 'Kafka teaches event-log thinking, replayability, ordering, and backpressure.'),
  entry('dagster', 'Dagster', 'https://github.com/dagster-io/dagster', 'data-pipelines', 'study-only', ['data-pipeline'], ['asset-oriented pipelines', 'lineage'], ['pipeline abstractions before data contracts'], 'Dagster emphasizes data assets, observability, and testable transformations.'),
  entry('prefect', 'Prefect', 'https://github.com/PrefectHQ/prefect', 'data-pipelines', 'study-only', ['data-pipeline'], ['workflow orchestration', 'state/retry patterns'], ['hiding failures behind orchestration'], 'Good orchestration makes state and failure visible.'),
  entry('nifi', 'Apache NiFi', 'https://github.com/apache/nifi', 'data-pipelines', 'study-only', ['data-pipeline'], ['flow-based ingestion', 'backpressure'], ['opaque drag-and-drop pipelines without tests'], 'NiFi teaches flow control, provenance, and backpressure.'),
  entry('meltano', 'Meltano', 'https://github.com/meltano/meltano', 'data-pipelines', 'study-only', ['data-pipeline'], ['ELT project structure', 'Singer taps/targets'], ['unvalidated connector sprawl'], 'ELT needs schema contracts and source freshness checks.'),
  entry('singer', 'Singer getting started', 'https://github.com/singer-io/getting-started', 'data-pipelines', 'study-only', ['data-pipeline'], ['tap/target protocol', 'extract-load contracts'], ['treating sync success as data quality'], 'Singer-style protocols teach decoupled extraction and loading.'),
  entry('airbyte', 'Airbyte', 'https://github.com/airbytehq/airbyte', 'data-pipelines', 'study-only', ['data-pipeline'], ['connector architecture', 'schema sync'], ['running connectors without source policy'], 'Airbyte is a major connector architecture reference for lawful ingestion.'),

  entry('opensearch', 'OpenSearch', 'https://github.com/opensearch-project/OpenSearch', 'search-indexing', 'allowed-library', ['indexing', 'storage'], ['search clusters', 'logs/search'], ['using search as authoritative storage'], 'Search indexes need rebuildability and source-of-truth discipline.'),
  entry('meilisearch', 'Meilisearch', 'https://github.com/meilisearch/meilisearch', 'search-indexing', 'allowed-library', ['indexing'], ['fast local search UX', 'document indexing'], ['indexing data without retention policy'], 'Lightweight search is a strong local-first fit when source IDs are preserved.'),
  entry('qdrant', 'Qdrant', 'https://github.com/qdrant/qdrant', 'search-indexing', 'allowed-library', ['indexing', 'storage'], ['vector search', 'semantic retrieval'], ['semantic matches without evidence trails'], 'Vector search must return source trails and confidence, not vibes.'),
  entry('weaviate', 'Weaviate', 'https://github.com/weaviate/weaviate', 'search-indexing', 'study-only', ['indexing', 'storage'], ['vector database architecture', 'hybrid search'], ['centralizing private data without policy'], 'Vector DBs are retrieval infrastructure, not truth engines.'),
  entry('milvus', 'Milvus', 'https://github.com/milvus-io/milvus', 'search-indexing', 'study-only', ['indexing', 'storage'], ['large-scale vector search', 'ANN architecture'], ['using distributed vector DBs before needed'], 'Milvus teaches large-scale similarity infrastructure tradeoffs.'),
  entry('faiss', 'FAISS', 'https://github.com/facebookresearch/faiss', 'search-indexing', 'allowed-library', ['indexing'], ['local ANN search', 'embedding indexes'], ['forgetting metadata/provenance alongside vectors'], 'FAISS is useful locally if every vector keeps evidence metadata.'),

  entry('neo4j', 'Neo4j', 'https://github.com/neo4j/neo4j', 'knowledge-graph-entity-resolution', 'study-only', ['entity-resolution', 'storage'], ['graph databases', 'relationship traversal'], ['treating inferred edges as verified'], 'Graph stores need provenance, decay, and edge confidence.'),
  entry('memgraph', 'Memgraph', 'https://github.com/memgraph/memgraph', 'knowledge-graph-entity-resolution', 'study-only', ['entity-resolution', 'storage'], ['graph database architecture', 'streaming graph analytics', 'Cypher patterns'], ['treating graph reachability as causality'], 'Memgraph reinforces graph-native thinking for dynamic relationships and fast traversal.'),
  entry('pykeen', 'PyKEEN', 'https://github.com/pykeen/pykeen', 'knowledge-graph-entity-resolution', 'study-only', ['entity-resolution'], ['knowledge graph embeddings', 'link prediction'], ['promoting predicted links to facts'], 'Graph embeddings are hypothesis generators, not evidence.'),
  entry('dedupe', 'dedupe', 'https://github.com/dedupeio/dedupe', 'knowledge-graph-entity-resolution', 'allowed-library', ['entity-resolution'], ['entity resolution', 'record linkage'], ['merging entities without audit trail'], 'Entity resolution needs reversible decisions and confidence.'),
  entry('deepmatcher', 'DeepMatcher', 'https://github.com/anhaidgroup/deepmatcher', 'knowledge-graph-entity-resolution', 'study-only', ['entity-resolution'], ['deep entity matching', 'schema/record linkage'], ['opaque matching without review'], 'Model-based matching needs evaluation against deterministic baselines.'),
  entry('spacy', 'spaCy', 'https://github.com/explosion/spaCy', 'knowledge-graph-entity-resolution', 'allowed-library', ['entity-resolution'], ['NER', 'NLP pipelines'], ['assuming named entities are correct'], 'NER is extraction, not verification.'),
  entry('flair', 'Flair', 'https://github.com/flairNLP/flair', 'knowledge-graph-entity-resolution', 'study-only', ['entity-resolution'], ['sequence labeling', 'embeddings'], ['using NLP outputs without confidence'], 'NLP outputs must be confidence-labeled and reviewable.'),

  entry('pdfminer-six', 'pdfminer.six', 'https://github.com/pdfminer/pdfminer.six', 'documents-ocr', 'allowed-library', ['document-processing'], ['PDF text extraction'], ['losing page/source coordinates'], 'PDF extraction needs page anchors and raw evidence retention.'),
  entry('pymupdf', 'PyMuPDF', 'https://github.com/pymupdf/PyMuPDF', 'documents-ocr', 'allowed-library', ['document-processing'], ['PDF parsing/rendering', 'document metadata'], ['extracting restricted documents'], 'Document parsing must preserve file provenance and permissions.'),
  entry('pdfplumber', 'pdfplumber', 'https://github.com/jsvine/pdfplumber', 'documents-ocr', 'allowed-library', ['document-processing'], ['PDF table extraction', 'layout analysis'], ['using extracted tables without validation'], 'Table extraction requires schema checks and source/page references.'),
  entry('tesseract', 'Tesseract OCR', 'https://github.com/tesseract-ocr/tesseract', 'documents-ocr', 'allowed-library', ['document-processing'], ['OCR', 'image text extraction'], ['treating OCR as exact text'], 'OCR needs confidence, cleanup, and original image retention.'),
  entry('paddleocr', 'PaddleOCR', 'https://github.com/PaddlePaddle/PaddleOCR', 'documents-ocr', 'study-only', ['document-processing'], ['OCR models', 'document AI'], ['OCR without language/layout validation'], 'OCR models are useful but must expose confidence and error states.'),
  entry('docling', 'Docling', 'https://github.com/docling-project/docling', 'documents-ocr', 'study-only', ['document-processing'], ['document conversion', 'structured extraction'], ['ingesting restricted documents'], 'Document conversion belongs behind source-rights and provenance checks.'),

  entry('yfinance', 'yfinance', 'https://github.com/ranaroussi/yfinance', 'market-financial-data', 'manual-review', ['market-data'], ['public market data client patterns'], ['presenting unofficial data as verified exchange feed'], 'Unofficial market data clients need honesty labels and fail-closed behavior.'),
  entry('ta-lib-python', 'TA-Lib Python', 'https://github.com/TA-Lib/ta-lib-python', 'market-financial-data', 'allowed-library', ['market-data'], ['technical indicators', 'signal math'], ['financial advice or predictions'], 'Indicator math is local-derived context, not a recommendation.'),
  entry('vectorbt', 'vectorbt', 'https://github.com/polakowo/vectorbt', 'market-financial-data', 'study-only', ['market-data'], ['backtesting architecture', 'vectorized analysis'], ['overfitting or advice generation'], 'Backtests need data-quality, survivorship, and overfit warnings.'),
  entry('backtrader', 'Backtrader', 'https://github.com/mementum/backtrader', 'market-financial-data', 'study-only', ['market-data'], ['backtesting engine design'], ['automated trading behavior'], 'Backtesting libraries are research context, not execution systems.'),
  entry('openbb', 'OpenBB', 'https://github.com/OpenBB-finance/OpenBB', 'market-financial-data', 'study-only', ['market-data'], ['finance terminal architecture', 'provider abstraction'], ['copying providers without terms review'], 'OpenBB is a useful reference for provider/plugin boundaries.'),
  entry('ccxt', 'CCXT', 'https://github.com/ccxt/ccxt', 'market-financial-data', 'auth-required', ['market-data', 'credentialed-api'], ['exchange API abstraction', 'market metadata'], ['placing trades or handling user keys in Atlasz'], 'Exchange libraries must never imply Atlasz is an execution system.'),
  entry('cryptofeed', 'Cryptofeed', 'https://github.com/bmoscon/cryptofeed', 'market-financial-data', 'study-only', ['market-data'], ['market data websocket architecture', 'exchange normalization'], ['raw feed overload without throttling'], 'Market feed systems teach normalization, buffering, and backpressure.'),

  entry('fred-economic-data', 'FRED Economic Data', 'https://fred.stlouisfed.org', 'economics-incentives', 'study-only', ['economic-data', 'public-api'], ['macro time series', 'economic context', 'incentive signals'], ['treating macro series as predictions'], 'Economic data grounds market narratives in incentives, constraints, and historical regimes.'),
  entry('imf-data', 'IMF Data', 'https://www.imf.org/en/Data', 'economics-incentives', 'study-only', ['economic-data', 'public-api'], ['country-level macro data', 'global indicators', 'financial stability context'], ['flattening country data into single-cause explanations'], 'IMF data helps connect countries, policy, debt, growth, and systemic macro conditions.'),
  entry('world-bank-data', 'World Bank Data', 'https://data.worldbank.org', 'economics-incentives', 'study-only', ['economic-data', 'public-api'], ['development indicators', 'country profiles', 'long-run trends'], ['overstating stale or lagged indicators'], 'World Bank data is useful for structural context, not minute-by-minute signal.'),

  entry('archive-org', 'Internet Archive', 'https://archive.org', 'historical-reference', 'study-only', ['historical-reference'], ['historical web/public media access', 'archival research', 'precedent discovery'], ['assuming archived pages prove current truth'], 'Archives give temporal context and precedent; they must be labeled by date and source.'),
  entry('library-of-congress', 'Library of Congress', 'https://www.loc.gov', 'historical-reference', 'study-only', ['historical-reference'], ['primary sources', 'historical collections', 'public records'], ['using historical analogy without evidence fit'], 'Historical collections teach pattern recognition while forcing source/date discipline.'),
  entry('national-archives-uk', 'The National Archives UK', 'https://www.nationalarchives.gov.uk', 'historical-reference', 'study-only', ['historical-reference'], ['government archives', 'historical records', 'policy precedent'], ['claiming patterns repeat exactly'], 'Historical records help analysts compare today to prior regimes without overfitting analogy.'),

  entry('geopandas', 'GeoPandas', 'https://github.com/geopandas/geopandas', 'geospatial-satellite-maps', 'allowed-library', ['geospatial'], ['geospatial dataframes', 'spatial joins'], ['handling sensitive facility data carelessly'], 'Geospatial analysis needs coordinate precision, CRS discipline, and sensitivity review.'),
  entry('rasterio', 'Rasterio', 'https://github.com/rasterio/rasterio', 'geospatial-satellite-maps', 'study-only', ['geospatial'], ['raster IO', 'satellite imagery processing'], ['processing licensed imagery without rights'], 'Raster processing needs metadata, CRS, and licensing awareness.'),
  entry('gdal', 'GDAL', 'https://github.com/OSGeo/gdal', 'geospatial-satellite-maps', 'study-only', ['geospatial'], ['geospatial formats', 'raster/vector conversion'], ['silent CRS/format mistakes'], 'GDAL is foundational, and geospatial bugs often hide in metadata.'),
  entry('cartopy', 'Cartopy', 'https://github.com/SciTools/cartopy', 'geospatial-satellite-maps', 'study-only', ['geospatial'], ['map projections', 'visualization'], ['misleading map projections'], 'Maps are analytical instruments and can mislead if projections are wrong.'),
  entry('h3', 'H3', 'https://github.com/uber/h3', 'geospatial-satellite-maps', 'allowed-library', ['geospatial'], ['hex indexing', 'spatial aggregation'], ['over-precise location exposure'], 'Spatial indexing helps aggregate signals while controlling precision.'),
  entry('folium', 'Folium', 'https://github.com/python-visualization/folium', 'geospatial-satellite-maps', 'allowed-library', ['geospatial'], ['leaflet map rendering', 'geospatial UI'], ['leaking sensitive coordinates in exports'], 'Map UI needs privacy controls and coordinate precision policy.'),
  entry('earthengine-api', 'Google Earth Engine API', 'https://github.com/google/earthengine-api', 'geospatial-satellite-maps', 'auth-required', ['geospatial', 'credentialed-api'], ['Earth Engine client patterns', 'remote geospatial computation'], ['using broad credentials or exceeding quotas'], 'Earth Engine is powerful but auth, quotas, and dataset terms matter.'),

  entry('changedetection', 'changedetection.io', 'https://github.com/changedetection-io/changedetection.io', 'monitoring-alerts', 'manual-review', ['scraping'], ['change monitoring', 'diff workflows'], ['monitoring private/paywalled pages'], 'Change detection should prefer public/allowed pages and preserve diff evidence.'),
  entry('sentry', 'Sentry', 'https://github.com/getsentry/sentry', 'monitoring-alerts', 'allowed-library', ['engineering-reference'], ['error monitoring', 'release health'], ['sending sensitive payloads without scrubbing'], 'Error telemetry needs PII scrubbing and retention controls.'),
  entry('healthchecks', 'Healthchecks', 'https://github.com/Healthchecks/healthchecks', 'monitoring-alerts', 'allowed-library', ['engineering-reference'], ['cron/job health checks', 'heartbeat monitoring'], ['alerting without ownership/runbooks'], 'Health checks turn silent failures into visible operational states.'),
]

const corpusById = new Map(AGENT_MASTERY_CORPUS.map((entryItem) => [entryItem.id, entryItem]))

export function lookupMasteryCorpusEntry(id: string): MasteryCorpusEntry | undefined {
  return corpusById.get(id)
}

export function entriesForMasteryDomain(domainId: MasteryDomainId): MasteryCorpusEntry[] {
  return AGENT_MASTERY_CORPUS.filter((entryItem) => entryItem.domainId === domainId)
}

export function masteryEntryPassesDefaultCorpusPolicy(entryItem: MasteryCorpusEntry): boolean {
  return entryItem.runtimePolicy === 'allowed-library' || entryItem.runtimePolicy === 'study-only'
}

export function summarizeMasteryCorpus() {
  const byDomain = new Map<MasteryDomainId, number>()
  const byPolicy = new Map<MasteryRuntimePolicy, number>()
  for (const entryItem of AGENT_MASTERY_CORPUS) {
    byDomain.set(entryItem.domainId, (byDomain.get(entryItem.domainId) ?? 0) + 1)
    byPolicy.set(entryItem.runtimePolicy, (byPolicy.get(entryItem.runtimePolicy) ?? 0) + 1)
  }
  return {
    entryCount: AGENT_MASTERY_CORPUS.length,
    defaultSafeCount: AGENT_MASTERY_CORPUS.filter(masteryEntryPassesDefaultCorpusPolicy).length,
    byDomain: Object.fromEntries(byDomain),
    byPolicy: Object.fromEntries(byPolicy),
  }
}

function entry(
  id: string,
  label: string,
  upstreamUrl: string,
  domainId: MasteryDomainId,
  runtimePolicy: MasteryRuntimePolicy,
  riskTags: MasteryRiskTag[],
  capabilities: string[],
  blockedUses: string[],
  engineeringLesson: string,
): MasteryCorpusEntry {
  return {
    id,
    label,
    upstreamUrl,
    domainId,
    runtimePolicy,
    riskTags,
    capabilities,
    blockedUses,
    engineeringLesson,
  }
}
