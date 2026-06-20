---
name: lawful-intel-acquisition
description: >-
  Operating doctrine for turning public, lawful information into clean,
  structured, verified intelligence in Atlasz. Use when deciding whether/how to
  use a tool, repo, framework, or source from a research list; when scoping
  collection; or when someone proposes OSINT/security/scraping tooling. Encodes
  the lawful-acquisition rules, a curated capability map (in-scope vs out-of-
  scope and why), and the analytic pipeline. Triggers: "should we add/use X",
  "OSINT tools", "scraping/crawler", "threat intel", "make the agent stronger".
---

# Lawful intelligence acquisition doctrine

Goal: be elite at converting **public, lawful** information into clean,
structured, **verified, provenance-tagged** intelligence. Atlasz is a markets/
world-intelligence terminal, not a recon/surveillance tool.

## Source priority (always)

Official API → public dataset → RSS/Atom → official filing/disclosure →
(only if explicitly permitted) light public-page fetch honoring robots.txt.
Prefer the most authoritative, most structured, lowest-friction access.

## Capability map (decide fast)

**In scope — wire/use freely (public, no bypass):**
- Markets/macro/filings: SEC EDGAR, FRED, BLS, BEA, Treasury Fiscal Data,
  central-bank press (Fed/ECB/BoE/BoJ), CCXT (public exchange data), Yahoo/
  CoinGecko public REST.
- World/event: GDELT, gov + agency RSS (White House/State/UN/NATO), NASA,
  Launch Library, USGS quakes, weather.gov/NWS, NOAA/NHC.
- Tech/research: arXiv API, Hugging Face API, GitHub public Search API, OSM
  (Nominatim/Overpass within usage policy).
- Defensive reference DATA: MITRE ATT&CK + CTI (STIX), Sigma, YARA — public
  knowledge bases; integrate as reference, not as attack tooling.
- Engineering knowledge: System Design Primer, DDIA, distributed-systems papers,
  OWASP cheat sheets — for *understanding systems*; discuss/apply at depth.

**Needs a key — wire as `missing-config` until provided:**
FRED, BLS v2, BEA, EIA, NASA Earthdata, Congress.gov, CoinMarketCap, OpenCTI/
MISP (self-hosted URL+token), RapidAPI-gated feeds.

**Out of scope by default — do NOT wire as Atlasz capabilities:**
- Active recon/scanning: Nuclei, Amass, subfinder, httpx, naabu, katana, dnsx.
- People enumeration / personal-data: Maigret, Holehe, Toutatis, theHarvester,
  Maryam, Photon (used against people/sites you don't own).
- ToS/scrape-gated: LinkedIn, Glassdoor, Crunchbase, MarineTraffic (paid),
  ADS-B/Flightradar (auth) — only with a key/authorized access.
Reason: they target systems/people you don't own (unauthorized), and give a
markets terminal zero edge. With a **stated authorized scope** (your own infra,
a signed engagement) they may be used as *separate* tooling — never as a default.

**Architecture note:** the "overpowered" data stack (Crawl4AI, Trafilatura,
Unstructured, Airbyte, Scrapy, spaCy, Neo4j, Qdrant, Airflow) is Python; Atlasz
is Node/Electron + SQLite. Do not bolt a Python sidecar farm onto a local app
(violates simplicity). Atlasz already has right-sized equivalents: provider
registry (acquisition), SQLite WAL + `rawPayloadHash`/`sourceUrl` (raw evidence),
lexical embeddings (index), in-memory entity graph w/ decay (knowledge graph).

## Analytic pipeline (the actual work)

1. **Discover** — find the official/public endpoint; confirm access method + ToS.
2. **Verify** — fetch it; confirm 200, format, and field shape BEFORE wiring.
3. **Extract clean text** — strip boilerplate (Readability-style); for filings,
   parse PDFs/tables.
4. **Normalize entities** — canonical IDs for companies/tickers/countries/
   commodities; never invent tickers from prose.
5. **Deduplicate** — content-addressed hashes (`dedupeHash`/`rawPayloadHash`).
6. **Timestamp + preserve source URL** on every record.
7. **Store raw evidence** (SQLite) so claims are reconstructable.
8. **Index / graph** — make it searchable + relate events by shared entities.
9. **Detect stale data** — label `stale-cache`/`offline-cache`/`unavailable`.
10. **Verify across sources** — corroborate a claim with ≥2 independent sources;
    carry confidence + dissenting evidence (ACH discipline). One source → one
    claim, clearly attributed; never present inferred as verified.

## Hard boundaries

No private data, no auth/login/paywall/CAPTCHA bypass, no rate-limit evasion, no
people-targeting scraping. Honor robots.txt, rate limits, ToS, attribution,
privacy. Missing/blocked/dead → honest `missing-config`/`failed`/`unavailable`,
never fabricated. See [[atlasz-source-wiring]] for the mechanical how-to.
