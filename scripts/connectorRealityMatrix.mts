/*
 * Generates docs/data-connectivity-matrix.md from the real connector registry
 * (CONNECTOR_AUDIT_DEFINITIONS). Deterministic; prints env-var NAMES only, never
 * values. Run: npx tsx scripts/connectorRealityMatrix.mts
 *
 * This matrix is derived structural truth (what each connector needs to run). It
 * never claims a connector is "online" — live runtime status comes from the audit
 * (scripts/runtimeVerification.mts). Regenerate after editing the registry.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  buildConnectorMatrix,
  summarizeMatrix,
  DECISION_ORDER,
  type ConnectorMatrixRow,
} from '../src/engine/connectorRealityMatrix'

const rows = buildConnectorMatrix()
const summary = summarizeMatrix(rows)
const generatedAt = new Date().toISOString()

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function yn(value: boolean): string {
  return value ? 'yes' : 'no'
}

function envList(row: ConnectorMatrixRow): string {
  return row.requiredEnv.length > 0 ? row.requiredEnv.join(', ') : '—'
}

const lines: string[] = []
lines.push('# Connector Reality Matrix')
lines.push('')
lines.push('<!-- GENERATED FILE — do not edit by hand.')
lines.push('     Source: src/engine/connectorRealityMatrix.ts (CONNECTOR_AUDIT_DEFINITIONS).')
lines.push('     Regenerate: npx tsx scripts/connectorRealityMatrix.mts -->')
lines.push('')
lines.push(`Generated ${generatedAt} from the live connector registry.`)
lines.push('Structural truth only — what each connector needs to run. Env-var NAMES only,')
lines.push('never values. "Online" is never claimed here; live status comes from the runtime')
lines.push('audit (`npx tsx scripts/runtimeVerification.mts`).')
lines.push('')
lines.push(`- Connectors: **${summary.total}**`)
for (const decision of DECISION_ORDER) {
  lines.push(`- ${decision}: **${summary.byDecision[decision]}**`)
}
lines.push('')
lines.push('## Matrix')
lines.push('')
lines.push(
  '| Connector | Domain | Official owner | Cold-start status | Auth (secret key) | No-key mode | Configured URL | Required env | Cadence | Trust | Freshness window | Source trail / persistence | Decision | Blocker |',
)
lines.push(
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
)
for (const r of rows) {
  const trail = [r.sourceTrailUi, r.persistenceTables.length > 0 ? `tables: ${r.persistenceTables.join(', ')}` : 'no persistence']
    .filter(Boolean)
    .join(' — ')
  const freshness = `${r.freshnessWindowHours}h${r.unresolvedByDesign ? ' (unresolved-by-design)' : ''}`
  lines.push(
    `| ${cell(r.label)} | ${cell(r.domain)} | ${cell(r.owner)} | ${r.coldStartStatus} | ${yn(r.authRequired)} | ${yn(r.noKeyMode)} | ${yn(r.configuredUrlRequired)} | ${cell(envList(r))} | ${r.cadence} | ${r.trust} | ${cell(freshness)} | ${cell(trail)} | ${cell(r.decision)} | ${cell(r.blocker)} |`,
  )
}
lines.push('')

// Locked connectors: exactly what is blocking each one + any no-key path.
const locked = rows.filter((r) => r.decision === 'key-gated' || r.decision === 'configured-only')
lines.push('## Locked connectors — blocker and no-key options')
lines.push('')
if (locked.length === 0) {
  lines.push('_None — every connector runs with no secret key or configured URL._')
} else {
  lines.push('Each row below cannot complete a first fetch until its blocker is resolved.')
  lines.push('A same-domain no-key sibling means partial coverage already exists without a key.')
  lines.push('')
  lines.push('| Connector | Decision | Blocker | Official docs | Same-domain no-key sibling |')
  lines.push('| --- | --- | --- | --- | --- |')
  for (const r of locked) {
    const siblings = r.noKeySiblingIds.length > 0 ? r.noKeySiblingIds.join(', ') : '— (none)'
    lines.push(
      `| ${cell(r.label)} (\`${r.id}\`) | ${r.decision} | ${cell(r.blocker)} | ${cell(r.officialUrl)} | ${cell(siblings)} |`,
    )
  }
}
lines.push('')
lines.push('## How to read "Decision"')
lines.push('')
lines.push('- **no-key public** — runs with no key and no extra config.')
lines.push('- **no-key public (config-required)** — no secret key, but needs a contact User-Agent or an allowlist/config value.')
lines.push('- **key-gated** — requires a secret API key (named in Required env). Fails closed until configured.')
lines.push('- **configured-only** — requires an official source URL to be pinned (named in Required env). No stale default.')
lines.push('- **deferred wiring** — built and tested, live runtime wiring intentionally deferred.')
lines.push('- **not-wired** — no runtime adapter yet.')

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'data-connectivity-matrix.md')
writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8')
console.log(
  `Wrote ${outPath} — ${summary.total} connectors: ${summary.noKeyPublicCount} no-key, ` +
    `${summary.byDecision['key-gated']} key-gated, ${summary.byDecision['configured-only']} configured-only`,
)
