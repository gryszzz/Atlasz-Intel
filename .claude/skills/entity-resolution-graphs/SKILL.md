---
name: entity-resolution-graphs
description: >-
  Normalize, deduplicate, and link entities into a knowledge graph — canonical
  IDs, NER, record linkage, relationship edges. Use to connect events/records
  across sources. Triggers: "entity resolution", "deduplicate records", "knowledge
  graph", "link entities", "NER", "canonical ID".
---

# Entity resolution & knowledge graphs

Turn scattered mentions into canonical entities + relationships — the backbone of
cross-source correlation.

## Entity resolution

1. **Extract** entities (NER: spaCy/flair; or LLM) — companies, tickers,
   countries, commodities, people-as-public-officials.
2. **Normalize** to canonical IDs (ticker maps, ISO country codes, registry IDs).
   Never invent identifiers from prose.
3. **Blocking** — candidate pairs by cheap keys (avoid O(n²)).
4. **Match** — similarity (string + embedding + structured features); calibrate a
   threshold (dedupe/record-linkage). Keep human-reviewable evidence per merge.
5. **Dedup** — content-addressed hashes; merge with provenance retained.

## Knowledge graph

Nodes = canonical entities; edges = typed, **timestamped, provenance-tagged**
relationships (event→asset, company→sector, country→commodity). Use a graph
(Neo4j) at scale, or an in-memory graph for a local app — Atlasz uses the latter
with **half-life edge decay** so inferred edges fade unless reinforced.

## Correlation (the payoff)

Connect events sharing entities/sector/geography within a time window →
clusters. That's the difference between a feed reader and a terminal. Carry
confidence + dissenting evidence (ACH); inferred links labeled, never verified.

## Honesty

Every node/edge cites its source records. Model-inferred edges are tagged and
decay. See [[ai-agent-architecture]], [[retrieval-and-vector-search]].
