---
name: osint-investigation-methodology
description: >-
  Lawful OSINT investigation workflow for entities, organizations, assets, and
  events using public records and open sources. Use to plan collection, pivot on
  public selectors, corroborate, and document with provenance. Triggers:
  "investigate", "OSINT workflow", "pivot on", "corroborate", "open-source check".
---

# OSINT investigation methodology (lawful)

Turn a question into corroborated, documented findings from **public** sources.
Scope: entities, companies, assets, infrastructure, events, public records,
public-figure official activity — **not** private individuals' personal data.

## Workflow

1. **Frame** — exact question, what would answer it, success criteria.
2. **Collection plan** — list candidate public sources by priority (official API
   → dataset → RSS → filing → permitted public page). See [[lawful-intel-acquisition]].
3. **Collect** — pull, **timestamp**, and **preserve the source URL + raw copy**
   for every item.
4. **Pivot** — move on *public* selectors (domains, tickers, filings, registry
   IDs, ASNs, public officials' offices), not personal identifiers.
5. **Corroborate** — a claim needs ≥2 independent sources; track which support
   vs contradict it.
6. **Assess** — source reliability + information credibility (admiralty-style);
   watch for deception, circular reporting (everyone citing one source), and
   recency.
7. **Conclude** — state findings with confidence + explicit knowledge gaps.

## Discipline

- **Provenance on everything** — no source → no claim; inferred ≠ verified.
- **Bias checks** — anchoring, confirmation, single-source over-trust.
- **Chain of evidence** — reproducible: another analyst can re-derive it.

## Boundaries

Public, lawful sources only. No login/paywall/auth bypass, no rate-limit evasion,
no targeting/profiling private individuals, no personal-data enumeration. If it
requires those, stop. Pairs with [[lawful-intel-acquisition]] and [[entity-resolution-graphs]].
