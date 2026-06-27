# Agent Instructions

## Package Manager
Use **npm**: `npm install`, `npm run web:dev`, `npm run test`.

## Architecture
- Atlasz Intel is one repo: Hermes source runtime -> Aegis trust engine -> Worldwatch relevance terminal.
- Read `docs/agent-operating-contract.md` before source or UI work.
- Product architecture: `docs/aegis-worldwatch.md`.
- Local key setup: `docs/local-api-setup.md`.
- Release gate: `docs/release-readiness.md`.

## Real Data Contract
- No fake data, simulated production data, invented exposure, fuzzy company merge, or source trail without proof.
- Media observation is not verified fact.
- Curated-reference is structural context only, never live evidence.
- Watchlists affect relevance only; they never create evidence or raise truth confidence.
- No trading advice, price prediction, buy/sell wording, or fake urgency.
- Stale/expired data must render stale/expired.
- Private agent skills are builder knowledge only; never commit them or treat them as product truth.

## File-Scoped Commands
| Task | Command |
| --- | --- |
| Test one file | `npm run test -- test/name.test.ts` |
| Typecheck | `npx tsc -b --pretty false` |
| Runtime config | `npx tsx scripts/checkRuntimeConfig.mts` |
| Runtime verification | `npx tsx scripts/runtimeVerification.mts` |

## Green Checkpoint
Run before commit/push:
```bash
npm run lint
npm run build
npm test
git diff --check
npx tsx scripts/checkRuntimeConfig.mts
npx tsx scripts/runtimeVerification.mts
```

## Wiring Claims
Before claiming a connector is wired, verify:
- provider config
- adapter registry
- normalization
- persistence
- source trail
- Evidence Graph
- dashboard/runtime audit
- tests
- runtime verification

## Release Rule
- Commit and push only after green gates.
- Never publish v0.2.0 until Mac GUI smoke passes.

## Commit Attribution
AI commits MUST include:
```text
Co-Authored-By: (the agent model's name and attribution byline)
```
