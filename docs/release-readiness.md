# Release Readiness

## v0.2.0 Gate

Do not publish until all gates are green:

```bash
npm run lint
npm run build
npm test
git diff --check
npx tsx scripts/checkRuntimeConfig.mts
npx tsx scripts/runtimeVerification.mts
```

## Runtime Readiness

- Public connectors fetch or fail honestly.
- Key-gated connectors with no keys report `missing-key`.
- Key-gated connectors with keys fetch live or report honest failure.
- Configured-only endpoints validate official hosts.
- No key value appears in output, persisted JSON, source trails, logs, or raw payloads.
- Static reference data does not appear in "What Changed Today" unless change-tracked.
- Stale/expired records render stale/expired.

## UI Smoke

Mac GUI smoke must pass before publishing:
- Worldwatch Command
- Sources / Connector Dashboard
- API Activation Panel
- Market Coverage Dashboard
- What Changed Today
- What To Watch Next
- Entity Dossier
- Vulnerability Dossier
- Facility panels
- Source trails
- Missing-key, stale, failed, unavailable, and rate-limited states

## Release Notes

Refresh `CHANGELOG.md` and README for:
- Aegis Worldwatch profiles
- CVE unified vulnerability dossier
- canonical FreshnessBadge rollout
- source-freshness weighting
- corroboration and conflict detection
- What To Watch intelligence briefs
- connector hardening audit
- geospatial / physical-world map
- market data reality enforcement

## Commit Rule

Commit and push only after green gates. Include model co-author attribution.
