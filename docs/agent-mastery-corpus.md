# Atlasz Agent Mastery Corpus

Atlasz can study a very wide engineering and intelligence stack without turning
every tool into a live runtime action. The corpus contract lives in
`src/agentMasteryCorpus.ts`.

The goal is to make the agent stronger at source discovery, parsing, OPSEC,
reliability, systems design, and evidence handling while keeping risky actions
behind explicit policy.

## Domains Covered

- OPSEC and privacy
- threat intelligence and detection engineering
- network intelligence and defensive sensors
- internet mapping and authorized recon architecture
- malware analysis and forensics lab design
- engineering architecture, distributed systems, operating systems, networking,
  cryptography, and reliability
- AI agent engineering and AI systems engineering
- lawful scraping/crawling, web extraction, API automation, and data pipelines
- search, vector indexes, knowledge graphs, entity resolution, documents, OCR,
  market data, geospatial analysis, and monitoring
- decision analysis, intelligence tradecraft, history, economics, incentives,
  and engineering judgment

## Runtime Policy

| Policy | Meaning |
| --- | --- |
| `study-only` | Use as learning/reference material only. |
| `allowed-library` | Safe to consider as a local library dependency when a feature explicitly needs it. |
| `manual-review` | Requires source-policy, terms, robots/rate-limit, and privacy review. |
| `auth-required` | Requires credentials, least-privilege scopes, and explicit operator setup. |
| `commercial-terms` | Vendor/license terms decide whether use is allowed. |
| `authorized-lab-only` | Only for owned/authorized defensive labs, never default Atlasz runtime. |
| `blocked` | Not available to Atlasz runtime by default. |

## Hard Boundaries

- Active recon tools are architecture references unless an authorized lab mode
  is built later.
- Malware-analysis tools require isolated lab handling.
- Person/account-enrichment tools are blocked from default workflows.
- Browser automation is not a bypass mechanism.
- Vector search and graph inference must preserve source trails and confidence.
- Financial libraries cannot turn Atlasz into a trading or execution system.

## High-Leverage Stack

The practical "overpowered" but still lawful stack is:

- Crawl4AI and Playwright for permitted automation
- Trafilatura and Unstructured for extraction
- Airbyte for connector architecture study
- Qdrant and FAISS for local evidence-preserving retrieval
- Neo4j-style graph thinking for relationship modeling
- OpenBB, CCXT, and Cryptofeed as finance data architecture references
- GeoPandas, H3, and Folium for spatial analysis
- changedetection.io, Sentry, and Healthchecks for observability and alerts

These are corpus entries, not automatic live behavior.

## Mental Models

Atlasz also trains on how systems, networks, incentives, evidence,
relationships, history, security, and data pipelines interact. This layer is
not about adding more tools; it is about improving explanation quality.

See `docs/analyst-mental-models-doctrine.md` and the
`ANALYST_MENTAL_MODEL_DIMENSIONS` export in `src/agentMasteryCorpus.ts`.
