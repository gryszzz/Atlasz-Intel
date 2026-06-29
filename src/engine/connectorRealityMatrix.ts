/*
 * Connector Reality Matrix.
 *
 * Derives a deterministic, honest connectivity matrix from the REAL registry
 * (CONNECTOR_AUDIT_DEFINITIONS). Every column is computed from catalog facts —
 * access model, requiredEnv, cadence, freshness window, unresolved-by-design — so
 * the matrix can never drift from the code. It prints env-var NAMES only, never
 * values. It does not claim a connector is online; runtime status comes from the
 * live audit. This is the structural truth a human can act on:
 *   - which connectors need a secret key (and exactly which env var),
 *   - which need an official configured URL,
 *   - which already run with no key,
 *   - and which key-gated connectors have a same-domain no-key sibling/mode.
 */
import {
  CONNECTOR_AUDIT_DEFINITIONS,
  type ConnectorAuditDefinition,
  type ConnectorRuntimeStatus,
} from './runtimeAudit'

const HOUR_MS = 60 * 60 * 1000

/** Classifies each required env var by suffix — no value is ever read. */
export type EnvClassification = {
  secretKeys: string[]
  configuredUrls: string[]
  userAgents: string[]
  otherConfig: string[]
}

export type MatrixDecision =
  | 'no-key public'
  | 'no-key public (config-required)'
  | 'key-gated'
  | 'configured-only'
  | 'deferred wiring'
  | 'not-wired'

export type ConnectorMatrixRow = {
  id: string
  label: string
  domain: string
  owner: string
  officialUrl: string
  /** Cold-start status with no source snapshot — mirrors runtimeAudit.connectorStatus(). */
  coldStartStatus: ConnectorRuntimeStatus
  /** True only when a secret API/secret key is required. */
  authRequired: boolean
  /** True when the connector needs no secret key (UA/URL/allowlist config may still apply). */
  noKeyMode: boolean
  configuredUrlRequired: boolean
  requiredEnv: string[]
  env: EnvClassification
  cadence: ConnectorAuditDefinition['cadence']
  trust: ConnectorAuditDefinition['trust']
  freshnessWindowHours: number
  unresolvedByDesign: boolean
  sourceTrailUi: string
  persistenceTables: string[]
  decision: MatrixDecision
  /** Human-readable blocker, or '—' when nothing is blocking a first fetch. */
  blocker: string
  /** Same-domain connectors that already run with no secret key. */
  noKeySiblingIds: string[]
}

export function classifyEnv(vars: string[]): EnvClassification {
  const secretKeys: string[] = []
  const configuredUrls: string[] = []
  const userAgents: string[] = []
  const otherConfig: string[] = []
  for (const name of vars) {
    if (/(_API_KEY|_SECRET_KEY|_TOKEN)$/.test(name)) secretKeys.push(name)
    else if (/_URL$/.test(name)) configuredUrls.push(name)
    else if (/_USER_AGENT$/.test(name)) userAgents.push(name)
    else otherConfig.push(name)
  }
  return { secretKeys, configuredUrls, userAgents, otherConfig }
}

/** Cold-start status (no source snapshot), mirroring runtimeAudit.connectorStatus(). */
function coldStartStatus(d: ConnectorAuditDefinition): ConnectorRuntimeStatus {
  if (!d.implemented) return 'not-wired'
  if (d.liveWiringDeferred) return 'deferred'
  if (d.requiredEnv.length > 0) return 'missing-key'
  return 'pending-first-fetch'
}

function decide(d: ConnectorAuditDefinition, env: EnvClassification): MatrixDecision {
  if (!d.implemented) return 'not-wired'
  if (d.liveWiringDeferred) return 'deferred wiring'
  if (env.secretKeys.length > 0) return 'key-gated'
  if (env.configuredUrls.length > 0) return 'configured-only'
  if (env.userAgents.length > 0 || env.otherConfig.length > 0) return 'no-key public (config-required)'
  return 'no-key public'
}

function blockerFor(d: ConnectorAuditDefinition, env: EnvClassification): string {
  if (!d.implemented) return 'No runtime adapter wired.'
  if (env.secretKeys.length > 0) return `Missing secret key: ${env.secretKeys.join(', ')}`
  if (env.configuredUrls.length > 0) return `Requires official URL: ${env.configuredUrls.join(', ')}`
  if (env.userAgents.length > 0) return `Requires contact User-Agent: ${env.userAgents.join(', ')}`
  if (env.otherConfig.length > 0) return `Requires config: ${env.otherConfig.join(', ')}`
  return '—'
}

export function buildConnectorMatrix(
  definitions: ConnectorAuditDefinition[] = CONNECTOR_AUDIT_DEFINITIONS,
): ConnectorMatrixRow[] {
  // No-key, implemented connectors grouped by domain, for sibling cross-reference.
  const noKeyByDomain = new Map<string, string[]>()
  for (const d of definitions) {
    const env = classifyEnv(d.requiredEnv)
    if (d.implemented && env.secretKeys.length === 0 && env.configuredUrls.length === 0) {
      const list = noKeyByDomain.get(d.domain) ?? []
      list.push(d.id)
      noKeyByDomain.set(d.domain, list)
    }
  }

  return definitions
    .map((d): ConnectorMatrixRow => {
      const env = classifyEnv(d.requiredEnv)
      const noKeyMode = env.secretKeys.length === 0
      const noKeySiblingIds = (noKeyByDomain.get(d.domain) ?? []).filter((id) => id !== d.id)
      return {
        id: d.id,
        label: d.label,
        domain: d.domain,
        owner: d.sourceIdentity,
        officialUrl: d.officialUrl,
        coldStartStatus: coldStartStatus(d),
        authRequired: env.secretKeys.length > 0,
        noKeyMode,
        configuredUrlRequired: env.configuredUrls.length > 0,
        requiredEnv: d.requiredEnv,
        env,
        cadence: d.cadence,
        trust: d.trust,
        freshnessWindowHours: Math.round((d.staleAfterMs ?? 30 * HOUR_MS) / HOUR_MS),
        unresolvedByDesign: Boolean(d.unresolvedByDesign),
        sourceTrailUi: d.sourceTrailUi,
        persistenceTables: d.persistenceTables,
        decision: decide(d, env),
        blocker: blockerFor(d, env),
        noKeySiblingIds,
      }
    })
    .sort((a, b) => a.domain.localeCompare(b.domain) || a.label.localeCompare(b.label))
}

export type MatrixSummary = {
  total: number
  byDecision: Record<MatrixDecision, number>
  keyGatedIds: string[]
  configuredOnlyIds: string[]
  noKeyPublicCount: number
}

const DECISION_ORDER: MatrixDecision[] = [
  'no-key public',
  'no-key public (config-required)',
  'key-gated',
  'configured-only',
  'deferred wiring',
  'not-wired',
]

export function summarizeMatrix(rows: ConnectorMatrixRow[] = buildConnectorMatrix()): MatrixSummary {
  const byDecision = Object.fromEntries(DECISION_ORDER.map((d) => [d, 0])) as Record<MatrixDecision, number>
  for (const r of rows) byDecision[r.decision] += 1
  return {
    total: rows.length,
    byDecision,
    keyGatedIds: rows.filter((r) => r.decision === 'key-gated').map((r) => r.id).sort(),
    configuredOnlyIds: rows.filter((r) => r.decision === 'configured-only').map((r) => r.id).sort(),
    noKeyPublicCount:
      byDecision['no-key public'] + byDecision['no-key public (config-required)'],
  }
}

export { DECISION_ORDER }
