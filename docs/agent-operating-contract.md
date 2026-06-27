# Agent Operating Contract

## Real Data First

- Prefer official API -> public dataset -> RSS/Atom -> official filing.
- No private, paywalled, logged-in, CAPTCHA, or undocumented endpoint access.
- Missing key means `missing-key`.
- Configured but failing means `unavailable`, `rate-limited`, or `failed`.
- Dead sources fail closed; never substitute fake data.

## Source Wiring Checklist

Before saying a connector is wired:
- provider config exists
- adapter registry resolves it
- parser/normalizer emits `WorldIntelEvent`
- persistence round-trips the sub-record
- source trail renders proof-backed records
- Evidence Graph sees the entity shape when applicable
- Connector Dashboard/runtime audit reports it
- tests cover proof, redaction, invalid input, and fail-closed behavior
- `scripts/runtimeVerification.mts` exercises the runtime path

## Trust Boundaries

- Verified/live evidence stays separate from local-derived ranking.
- Media observation never counts as corroboration.
- Curated-reference never becomes live impact.
- Freshness weighting can reduce visibility, not erase evidence.
- Conflict detection lowers ranking and surfaces uncertainty.
- Unknowns are product output, not a failure to hide.

## Secrets

- Keys live only in local `.env` or process env.
- Never paste keys into chat.
- Never commit `.env`.
- Never log, persist, or render secret values.
- Source URLs and raw payloads must strip keys.

## Agent Boundaries

- Private skills can guide implementation but are not product facts.
- Repo docs are the shared contract for Codex, Claude, Fable, and future agents.
- Do not add private skill files to the repo.
- Do not claim live capability from docs alone; verify runtime paths.

## Required Green Gates

```bash
npm run lint
npm run build
npm test
git diff --check
npx tsx scripts/checkRuntimeConfig.mts
npx tsx scripts/runtimeVerification.mts
```
