/*
 * Generates docs/connector-hardening-audit.md from the real connector registry.
 * Deterministic; prints no secrets. Run: npx tsx scripts/connectorHardeningAudit.mts
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildConnectorHardening, summarizeHardening } from '../src/engine/connectorHardening'

const reports = buildConnectorHardening()
const summary = summarizeHardening(reports)
const generatedAt = new Date().toISOString()

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

const lines: string[] = []
lines.push('# Connector Super-Hardening Audit')
lines.push('')
lines.push(`Generated ${generatedAt} from the live connector registry (CONNECTOR_AUDIT_DEFINITIONS).`)
lines.push('Metadata-based hardening score (catalog attributes), not a line-by-line code audit. No secrets printed.')
lines.push('')
lines.push(`- Connectors: **${summary.total}**`)
lines.push(`- Average hardening score: **${summary.averageScore}/100**`)
lines.push(`- Fully hardened (no catalog gaps): **${summary.fullyHardened}**`)
lines.push(`- With gaps: **${summary.withGaps}**`)
lines.push('')
lines.push('## Coverage table')
lines.push('')
lines.push('| Connector | Domain | Cadence | Trust | Key | Source trail | Persistence | Resolver/Exposure | Score | Next action |')
lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
for (const r of [...reports].sort((a, b) => a.domain.localeCompare(b.domain) || a.label.localeCompare(b.label))) {
  const persistence = r.persistenceExpected ? (r.persistenceTables.length > 0 ? 'yes' : 'MISSING') : 'n/a (realtime)'
  const resolver = `${r.resolverSupport}/${r.exposureSupport}`
  lines.push(
    `| ${cell(r.label)} | ${cell(r.domain)} | ${r.cadence} | ${r.trust} | ${r.keyRequired ? 'yes' : 'no'} | ${cell(r.sourceTrailUi ? 'yes' : 'no')} | ${persistence} | ${cell(resolver)} | ${r.hardeningScore} | ${cell(r.nextAction)} |`,
  )
}
lines.push('')
lines.push('## Weakest connectors (lowest score first)')
lines.push('')
for (const r of summary.weakest) {
  lines.push(`### ${r.label} — ${r.hardeningScore}/100`)
  lines.push(`- Source: ${r.source} (${r.officialUrl})`)
  lines.push(`- Key required: ${r.keyRequired ? r.requiredEnv.join(', ') : 'no'}`)
  lines.push(`- Gaps: ${r.knownGaps.length > 0 ? r.knownGaps.join('; ') : 'none'}`)
  lines.push(`- Next action: ${r.nextAction}`)
  lines.push('')
}

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'connector-hardening-audit.md')
writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8')
console.log(`Wrote ${outPath} — ${summary.total} connectors, avg ${summary.averageScore}/100, ${summary.withGaps} with gaps`)
