# Lawful Data Acquisition Doctrine

Atlasz should become excellent at turning public, lawful information into clean,
structured, reviewable intelligence. That means it must prefer permitted access
paths and preserve evidence before it tries to be clever.

## Acquisition Order

1. Official APIs, filings, datasets, documentation, and RSS feeds.
2. Public no-auth endpoints with clear usage boundaries.
3. Credentialed APIs with least-privilege scopes and visible configuration.
4. Scraping only when allowed by terms, robots policy, rate limits, and source
   sensitivity.
5. Manual review when the access boundary is unclear.
6. `DATA_UNAVAILABLE` when the source is blocked, stale, failed, or not allowed.

## Required Evidence Contract

Every acquired record should keep:

- source URL
- source ID
- source trust/provenance label
- retrieval timestamp
- observed publication timestamp when available
- raw or reversible evidence pointer
- parser/extractor version
- deduplication key
- freshness/staleness status
- confidence and uncertainty notes

## Engineering Skills To Build

- discover sources
- extract clean text
- parse tables
- parse PDFs and OCR output
- normalize entities
- deduplicate records
- timestamp everything
- preserve source URLs
- store raw evidence
- build searchable indexes
- build knowledge graphs
- detect stale data
- verify claims across multiple sources

## Do Not Do

- Do not collect private data.
- Do not bypass authentication, paywalls, CAPTCHA, or access controls.
- Do not evade rate limits.
- Do not scrape login-only or anti-bot-protected surfaces.
- Do not submit sensitive observables to third-party services by default.
- Do not treat local-model, semantic, or graph-inferred output as verified fact.

When in doubt, the correct Atlasz behavior is a visible unavailable or review
state, not a hallucinated signal.
