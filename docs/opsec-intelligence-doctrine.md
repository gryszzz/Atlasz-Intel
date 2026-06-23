# Atlasz OPSEC Intelligence Doctrine

Atlasz is an intelligence terminal, not an unrestricted investigation bot. The
goal is to connect public, official, local, and configured data sources while
preserving operational security, source legality, and analytical honesty.

The reusable policy contract lives in `src/intelligenceOpsec.ts`.

## First Principles

- Do not collect what is not needed.
- Do not submit sensitive observables to third-party services by default.
- Do not scrape login, paywall, CAPTCHA, private, or anti-bot-protected surfaces.
- Do not run recon, account-enumeration, or person-enrichment tools in default
  runtime.
- Do not present public unauthenticated data as verified truth.
- Do not let agent frameworks choose new network tools without policy review.
- Prefer official APIs, public metadata endpoints, local computation, and typed
  source trails.

## Risk Categories

| Category | Meaning |
| --- | --- |
| `credentialed-source` | Requires API keys, tokens, user-agent, or configured endpoints. |
| `commercial-terms` | Vendor/API terms gate runtime use. |
| `licensed-content` | News/data licensing controls collection and redistribution. |
| `personal-data` | Can expose or enrich people, accounts, profiles, or identities. |
| `submission-leakage` | Queries/submissions can reveal sensitive URLs, files, hashes, or infrastructure. |
| `internet-exposure` | Finds hosts, services, certificates, or attack-surface context. |
| `malware-handling` | Can touch malware samples or malware metadata. |
| `scraping-prohibited` | Useful web surface, but not a runtime scraping target. |
| `geospatial-sensitive` | Can reveal physical infrastructure, movement, or facility context. |
| `reference-only` | Use for manual research or design learning, not automated runtime. |

## Default Runtime Rules

Allowed by default:

- official public feeds
- public no-auth APIs with documented usage
- local deterministic computation
- local SQLite/vector/model services when explicitly enabled

Requires human review:

- commercial data sources
- licensed news wires
- internet exposure tools
- file/URL/hash submission services
- malware intelligence services
- geospatial sources with physical-infrastructure sensitivity

Blocked from default runtime:

- LinkedIn/profile scraping
- account enumeration
- person enrichment
- login/paywall/CAPTCHA bypass
- arbitrary crawling
- autonomous agent source expansion

## Agent Boundary

Agent frameworks can help Atlasz only when they operate inside typed workflows:

1. approved tool allowlist
2. source capability checks
3. OPSEC assessment
4. user-visible audit log
5. human review before high-risk actions
6. provenance on every output

Agent output is `local-model` or `model-inferred`; it is never automatically
`verified`.

## Review Questions Before Adding a Source

- What exact source URL/API is used?
- Is the endpoint official, public, configured, commercial, or auth-gated?
- Does the adapter send any user observables to a third party?
- Could a query reveal investigative intent?
- Could data include personal information?
- Is the result reproducible with a source trail?
- What is the failure state?
- How is rate limiting enforced?
- What provenance label is attached?

If the answer is unclear, the source stays unavailable or reference-only.
