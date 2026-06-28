# Aegis Worldwatch

Atlasz Intel is the product. Aegis Worldwatch is the named intelligence layer
inside it, not a separate app.

```text
Atlasz Intel
  Hermes     connectors, fetchers, source trails, persistence, runtime verification
  Aegis      trust, freshness, corroboration, conflicts, unknowns, non-claims
  Worldwatch watchlists, relevance profiles, what changed, what to watch next
```

## Product Shape

- Hermes delivers source-backed events and proof trails.
- Aegis evaluates trust boundaries without hiding uncertainty.
- Worldwatch ranks what matters to the user's watched systems.
- Curated seeds are structural context only.
- Private agent skills are builder knowledge only, never product truth.

The Worldwatch Globe architecture lives in
[`docs/worldwatch-globe-pass.md`](worldwatch-globe-pass.md). It is inspired by
plugin-driven geospatial systems such as WorldWideView, but Atlasz remains an
original proof-first market/economic/world intelligence terminal.

## Worldwatch Profiles

Profiles can watch:
- tickers, companies, CIKs, ETFs
- commodities, minerals, countries, regions
- facilities, ports, grid regions, balancing authorities
- cyber technologies and CVEs
- connectors and themes

Relevance score:

```text
sourceTrust
x freshnessWeight
x entityMatch
x themeMatch
x geoMatch
x exposurePathConfidence
x corroborationBoost
x conflictPenalty
```

Watchlists affect ranking, chips, and filters only. They do not create evidence,
raise confidence, predict prices, or direct market action.

## UI Contract

Worldwatch surfaces should answer:
- What changed?
- Why is this relevant to my profile?
- Which source proves it?
- How fresh is the evidence?
- What corroborates or conflicts?
- What is unknown?
- What does this not prove?

Every surfaced item still needs source proof, freshness, unknowns, and non-claims.

## Layer Boundaries

- Media observation remains low trust.
- Curated-reference remains structural only.
- Static reference data is excluded from "What Changed Today" unless change-tracked.
- No fuzzy company merge.
- No invented company exposure.
- No blank "smart" panel that fills itself with unsourced claims.
