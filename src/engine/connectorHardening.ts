/*
 * Connector Super-Hardening audit.
 *
 * Scores every connector from the REAL registry (CONNECTOR_AUDIT_DEFINITIONS) on
 * objective, catalog-knowable hardening attributes — source, source-trail UI,
 * persistence, fetch hardening, resolver/exposure, trust — and surfaces concrete
 * gaps + a next action. This is a metadata-based hardening score (not a line-by-
 * line code audit); it is deterministic and drives docs/connector-hardening-audit.md.
 */
import { CONNECTOR_AUDIT_DEFINITIONS, type ConnectorAuditDefinition } from './runtimeAudit'

export type HardeningReport = {
  id: string
  label: string
  domain: string
  source: string
  officialUrl: string
  cadence: ConnectorAuditDefinition['cadence']
  trust: ConnectorAuditDefinition['trust']
  keyRequired: boolean
  requiredEnv: string[]
  /** Realtime market data persists nothing by design (not a gap). */
  persistenceExpected: boolean
  persistenceTables: string[]
  sourceTrailUi: string
  resolverSupport: ConnectorAuditDefinition['resolverSupport']
  exposureSupport: ConnectorAuditDefinition['exposureSupport']
  liveWiringDeferred: boolean
  knownGaps: string[]
  hardeningScore: number
  nextAction: string
}

export function buildConnectorHardening(
  definitions: ConnectorAuditDefinition[] = CONNECTOR_AUDIT_DEFINITIONS,
): HardeningReport[] {
  return definitions
    .map((definition) => scoreConnector(definition))
    .sort((a, b) => a.hardeningScore - b.hardeningScore || a.id.localeCompare(b.id))
}

function scoreConnector(d: ConnectorAuditDefinition): HardeningReport {
  // Realtime key-gated market data (equities/options) persists nothing by design.
  const persistenceExpected = !(d.cadence === 'realtime' && d.requiredEnv.length > 0)
  const liveWiringDeferred = Boolean(d.liveWiringDeferred)
  const hasSourceTrail = d.sourceTrailUi.trim().length > 0
  const hasPersistence = d.persistenceTables.length > 0
  const hasResolverOrExposure = d.resolverSupport !== 'no' && d.resolverSupport !== 'not-wired'
    ? true
    : d.exposureSupport !== 'none'
  // Unresolved-by-design (media/registry/metadata/status/market-data) is correct, not a gap.
  const resolverOk = hasResolverOrExposure || Boolean(d.unresolvedByDesign)
  const trustKnown = d.trust !== 'catalog-only'

  const gaps: string[] = []
  if (!d.implemented) gaps.push('Not wired (no runtime adapter).')
  if (!hasSourceTrail) gaps.push('No source-trail UI.')
  if (persistenceExpected && !hasPersistence) gaps.push('No persistence/round-trip.')
  if (!resolverOk) gaps.push('No resolver/exposure and not marked unresolved-by-design.')
  if (!d.officialUrl.startsWith('https://')) gaps.push('Source URL not https/official.')
  if (!trustKnown) gaps.push('Trust tier not set.')
  if (liveWiringDeferred) gaps.push('Live runtime wiring deferred (built + tested, not yet flowing).')

  // Score: objective catalog attributes.
  let score = 0
  if (d.implemented) score += 25
  if (d.officialUrl.startsWith('https://')) score += 15
  if (hasSourceTrail) score += 15
  if (!persistenceExpected || hasPersistence) score += 15 // persistence present or intentionally N/A
  if (d.implemented) score += 15 // fail-closed fetch is the house pattern for wired connectors
  if (resolverOk) score += 10 // has resolver/exposure OR correctly unresolved-by-design
  if (trustKnown) score += 5
  if (liveWiringDeferred) score -= 10 // honest penalty until flowing

  const nextAction = gaps.length === 0 ? 'None — fully hardened per catalog attributes.' : remedyFor(gaps[0])

  return {
    id: d.id,
    label: d.label,
    domain: d.domain,
    source: d.sourceIdentity,
    officialUrl: d.officialUrl,
    cadence: d.cadence,
    trust: d.trust,
    keyRequired: d.requiredEnv.length > 0,
    requiredEnv: d.requiredEnv,
    persistenceExpected,
    persistenceTables: d.persistenceTables,
    sourceTrailUi: d.sourceTrailUi,
    resolverSupport: d.resolverSupport,
    exposureSupport: d.exposureSupport,
    liveWiringDeferred,
    knownGaps: gaps,
    hardeningScore: Math.max(0, Math.min(100, score)),
    nextAction,
  }
}

function remedyFor(gap: string): string {
  if (gap.startsWith('Not wired')) return 'Wire a runtime adapter + persistence + source-trail UI.'
  if (gap.startsWith('No source-trail')) return 'Add a proof-gated source-trail card.'
  if (gap.startsWith('No persistence')) return 'Add persistence + a round-trip test.'
  if (gap.startsWith('No resolver')) return 'Confirm unresolved-by-design, or add exact-identity resolver/exposure.'
  if (gap.startsWith('Live runtime wiring')) return 'Wire the live fetch -> renderer store when prioritized.'
  return 'Review and address the listed gap.'
}

export type HardeningSummary = {
  total: number
  averageScore: number
  fullyHardened: number
  withGaps: number
  weakest: HardeningReport[]
}

export function summarizeHardening(reports: HardeningReport[] = buildConnectorHardening()): HardeningSummary {
  const total = reports.length
  const averageScore = total === 0 ? 0 : Math.round(reports.reduce((sum, r) => sum + r.hardeningScore, 0) / total)
  return {
    total,
    averageScore,
    fullyHardened: reports.filter((r) => r.knownGaps.length === 0).length,
    withGaps: reports.filter((r) => r.knownGaps.length > 0).length,
    weakest: reports.slice(0, 5),
  }
}
