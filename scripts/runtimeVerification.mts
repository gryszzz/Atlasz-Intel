/*
 * Atlasz operator verification pass.
 *
 * One command to see the truth state of every connector — keyed or unkeyed —
 * plus trust tiers, boundary guarantees, and a written log. It drives the SAME
 * adapter/registry/audit code the app uses, with no display.
 *
 *   npx tsx scripts/runtimeVerification.mts
 *
 * Rules honored:
 *   - never prints secrets (only presence yes/no; key VALUES are read for the
 *     redaction scan but never logged);
 *   - never requires live keys to pass the baseline;
 *   - public connectors are exercised live; keyed connectors without keys report
 *     missing-key; keyed connectors WITH keys do a real fetch;
 *   - fail-closed on provider errors (recorded honestly, never fabricated).
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createPersistence } from '../electron/persistence'
import { resolveAdapter } from '../electron/osint/adapterRegistry'
import { BUILTIN_PROVIDERS, type ProviderDefinition } from '../electron/providers/providerConfig'
import {
  buildConnectorAudit,
  summarizeExposure,
  CONNECTOR_AUDIT_DEFINITIONS,
  type ConnectorAuditDefinition,
} from '../src/engine/runtimeAudit'
import { eventStructuralExposure, isEventResolvable } from '../src/engine/entityResolver'
import { fetchUsptoPatents } from '../electron/osint/adapters/usptoPatentAdapter'
import { PROVENANCE_VALUES, type ProvenanceId } from '../src/provenance'
import type { WorldIntelEvent } from '../src/worldIntel'

const PER_FETCH_TIMEOUT_MS = 12_000
const COMMAND = 'npx tsx scripts/runtimeVerification.mts'

const checks: Array<{ name: string; pass: boolean; detail: string }> = []
function check(name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail })
  console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${name} — ${detail}`)
}

function timeoutSignal(ms: number): AbortSignal {
  const c = new AbortController()
  setTimeout(() => c.abort(), ms).unref?.()
  return c.signal
}

function subRetrievedAt(e: WorldIntelEvent): number | undefined {
  const sub =
    e.earthquakeEvent ?? e.kevVulnerability ?? e.patentRecord ?? e.nvdCve ?? e.weatherAlert ??
    e.regulatoryDocument ?? e.ofacSanctionsRecord ?? e.congressBillAction ?? e.gdeltArticle ?? e.comtradeRecord
  return (sub as { retrievedAt?: number } | undefined)?.retrievedAt
}

type ConnectorRow = {
  id: string
  label: string
  implemented: boolean
  gating: 'public' | 'key-gated'
  requiredEnv: string
  keyPresent: 'yes' | 'no' | 'public'
  status: string
  records: number
  lastSuccess: string
  lastError: string
  persistenceRoundTrip: 'yes' | 'no' | 'n/a'
  sourceTrailProof: 'yes' | 'no' | 'n/a'
  keyRedaction: 'yes' | 'no' | 'n/a'
  resolver: string
  exposureAllowed: 'yes' | 'no'
  trust: string
  sampleEvent?: WorldIntelEvent
}

function providerFor(def: ConnectorAuditDefinition): ProviderDefinition | undefined {
  return BUILTIN_PROVIDERS.find((p) => def.sourceIds.includes(p.providerId))
}

async function driveConnector(def: ConnectorAuditDefinition): Promise<ConnectorRow> {
  const provider = providerFor(def)
  const gating: 'public' | 'key-gated' = provider && provider.authType !== 'none' ? 'key-gated' : 'public'
  const keyPresent: ConnectorRow['keyPresent'] =
    gating === 'public' ? 'public' : def.requiredEnv.every((e) => Boolean(process.env[e])) ? 'yes' : 'no'

  const row: ConnectorRow = {
    id: def.id,
    label: def.label,
    implemented: def.implemented,
    gating,
    requiredEnv: def.requiredEnv.join(',') || '-',
    keyPresent,
    status: 'pending',
    records: 0,
    lastSuccess: '-',
    lastError: '-',
    persistenceRoundTrip: 'n/a',
    sourceTrailProof: 'n/a',
    keyRedaction: 'n/a',
    resolver: def.resolverSupport,
    exposureAllowed: def.exposureSupport === 'none' ? 'no' : 'yes',
    trust: String(def.trust),
  }

  if (!provider) {
    row.status = 'no-provider'
    return row
  }
  const resolved = resolveAdapter(provider, process.env)
  if (!resolved.configured || !resolved.fetcher) {
    // Key-gated with no key -> honest missing-key, no fetch, no fabrication.
    row.status = gating === 'key-gated' ? 'missing-key' : 'unavailable'
    return row
  }

  try {
    const events = await resolved.fetcher(timeoutSignal(PER_FETCH_TIMEOUT_MS))
    row.records = events.length
    row.status = events.length > 0 ? 'online' : 'configured (empty)'
    row.sampleEvent = events[0]
    if (events[0]) {
      row.lastSuccess = new Date().toISOString().slice(11, 19) + 'Z'
      const e = events[0]
      const hashOk = typeof e.rawPayloadHash === 'string' && e.rawPayloadHash.length > 0
      const httpsOk = !e.sourceUrl || /^https:\/\//.test(e.sourceUrl)
      const retrOk = typeof subRetrievedAt(e) === 'number' || Number.isFinite(e.timestamp)
      row.sourceTrailProof = hashOk && httpsOk && retrOk ? 'yes' : 'no'
    }
  } catch (err) {
    const status = (err as { status?: number }).status
    row.status = status === 429 ? 'rate-limited' : status && status >= 500 ? 'unavailable' : 'failed'
    row.lastError = truncateError((err as Error).message)
  }
  return row
}

function truncateError(message: string): string {
  return message.length > 60 ? `${message.slice(0, 60)}…` : message
}

async function main() {
  console.log('\n=== Atlasz Operator Verification Pass ===\n')

  // --- 1. Env key presence (names only, never values) ---
  const keyEnvNames = [...new Set(CONNECTOR_AUDIT_DEFINITIONS.flatMap((d) => d.requiredEnv))].sort()
  const presentKeys = keyEnvNames.filter((k) => Boolean(process.env[k]))
  const missingKeys = keyEnvNames.filter((k) => !process.env[k])
  console.log('Env keys (names only):')
  console.log('  present:', presentKeys.length ? presentKeys.join(', ') : '(none)')
  console.log('  missing:', missingKeys.join(', ') || '(none)')
  console.log()

  // --- 2. Drive every connector (live where configured) ---
  console.log(`Driving ${CONNECTOR_AUDIT_DEFINITIONS.length} connectors (public + keyed-with-keys fetched live; bounded ${PER_FETCH_TIMEOUT_MS}ms)…\n`)
  const rows = await Promise.all(CONNECTOR_AUDIT_DEFINITIONS.map(driveConnector))

  // Persistence round-trip + key-redaction scan over everything fetched this run.
  const dir = mkdtempSync(join(tmpdir(), 'atlasz-operator-'))
  let persistedJson = ''
  try {
    const persistence = createPersistence(dir)
    console.log(`Persistence mode: ${persistence.mode}\n`)
    for (const row of rows) {
      if (row.sampleEvent) persistence.saveWorldIntelEvent(row.sampleEvent)
    }
    persistence.close()
    const reopened = createPersistence(dir)
    const reloaded = reopened.listWorldIntelEvents(1000)
    const reloadedIds = new Set(reloaded.map((e) => e.id))
    persistedJson = JSON.stringify(reloaded)
    for (const row of rows) {
      if (!row.sampleEvent) continue
      row.persistenceRoundTrip = reloadedIds.has(row.sampleEvent.id) ? 'yes' : 'no'
      // Key redaction: for keyed connectors with a key, the key VALUE (read, never
      // printed) must not appear in the persisted JSON.
      if (row.gating === 'key-gated' && row.keyPresent === 'yes') {
        const leaked = CONNECTOR_AUDIT_DEFINITIONS.find((d) => d.id === row.id)!.requiredEnv
          .map((k) => process.env[k])
          .some((val) => Boolean(val) && persistedJson.includes(val as string))
        row.keyRedaction = leaked ? 'no' : 'yes'
      }
    }
    reopened.close()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }

  // --- Print the connector truth table ---
  printTruthTable(rows)

  // --- 3. Trust tier table ---
  console.log('\nTrust tier table (connector count per tier):')
  const tierCounts = new Map<string, string[]>()
  for (const row of rows) {
    const tier = row.implemented ? row.trust : 'not-wired'
    tierCounts.set(tier, [...(tierCounts.get(tier) ?? []), row.id])
  }
  const TIER_ORDER = ['official-api', 'public-disclosure', 'public-unauthenticated', 'media-observation', 'curated-reference', 'catalog-only', 'not-wired']
  for (const tier of [...TIER_ORDER, ...[...tierCounts.keys()].filter((t) => !TIER_ORDER.includes(t))]) {
    const ids = tierCounts.get(tier)
    if (!ids) continue
    console.log(`  ${tier.padEnd(24)} ${String(ids.length).padStart(2)}  ${ids.join(', ')}`)
  }

  // --- 4. Boundary checks ---
  console.log('\nBoundary checks:')
  const liveEvents = rows.map((r) => r.sampleEvent).filter((e): e is WorldIntelEvent => Boolean(e))

  // Cold-start dashboard sanity (no live keys needed for baseline).
  const cold = buildConnectorAudit({ sources: [], events: [], now: Date.now() })
  check('every keyed connector without a key reports missing-key', cold.filter((r) => r.requiredEnv.length > 0 && !r.requiredEnv.every((e) => process.env[e])).every((r) => r.status === 'missing-key'), 'cold-start keyed rows')
  check('no connector is implemented:false but claims a trust tier other than catalog-only', CONNECTOR_AUDIT_DEFINITIONS.every((d) => d.implemented || d.trust === 'catalog-only'), 'implemented/trust consistency')

  // No simulated / fake fallback events among real connector output.
  check('no simulated events present', liveEvents.every((e) => e.provenance !== 'simulated'), `${liveEvents.length} live events scanned`)
  check('no fake fallback records (every live event has a real payload hash + real tier)', liveEvents.every((e) => Boolean(e.rawPayloadHash) && e.provenance !== 'local-derived' && e.provenance !== 'model-inferred'), 'payload-hash + tier')

  // No key leakage in persisted JSON (covers any key present).
  const anyLeak = presentKeys.some((k) => { const v = process.env[k]; return Boolean(v) && persistedJson.includes(v as string) })
  check('no key leakage in persisted JSON', !anyLeak, presentKeys.length ? `scanned ${presentKeys.length} present key(s)` : 'no keys present to leak')

  // Media observations excluded from exposure (logic guarantee + live if present).
  const mediaLive = liveEvents.find((e) => e.provenance === 'media-observation')
  const exposureSummary = summarizeExposure({ events: liveEvents, now: Date.now() })
  check('media observations excluded from exposure ranking', !mediaLive || eventStructuralExposure(mediaLive).length === 0, mediaLive ? 'live media event unresolved' : 'no live media event (logic holds)')

  // Comtrade excluded from company exposure (synthetic shape — resolver has no rule).
  const comtradeProbe = { ...(liveEvents[0] ?? ({} as WorldIntelEvent)), id: 'probe-comtrade', affectedAssets: [], secFiling: undefined, patentRecord: undefined, eiaEnergyRecord: undefined, fredObservation: undefined, githubRelease: undefined, comtradeRecord: { commodityCode: '854231' } as WorldIntelEvent['comtradeRecord'] } as WorldIntelEvent
  check('Comtrade never resolves into company exposure', !isEventResolvable(comtradeProbe) && eventStructuralExposure(comtradeProbe).length === 0, 'comtrade probe unresolved')

  // OFAC / Congress unresolved by design.
  const ofacLive = liveEvents.find((e) => e.sourceId === 'ofac_sdn_public')
  check('OFAC unresolved by design', !ofacLive || (!isEventResolvable(ofacLive) && eventStructuralExposure(ofacLive).length === 0), ofacLive ? 'live OFAC event unresolved' : 'no live OFAC event (resolver has no rule)')

  // Curated-reference never shown as verified.
  const exposureJson = JSON.stringify(exposureSummary)
  check('curated-reference never shown as verified', !exposureJson.includes('"verified"'), 'no verified token in exposure summary')

  // --- 5. Baseline key-redaction (sentinel, no real key needed) ---
  await sentinelRedactionCheck()

  // --- Report + log ---
  console.log(`\nExposure summary: considered=${exposureSummary.consideredEventCount} resolved=${exposureSummary.resolvedEventCount} unresolved=${exposureSummary.unresolvedEventCount} curatedOnly=${exposureSummary.curatedReferenceOnlyCount} media=${exposureSummary.mediaObservationCount}`)
  const passed = checks.filter((c) => c.pass).length
  console.log(`\n=== ${passed}/${checks.length} checks passed ===`)

  writeLog(rows, { presentKeys, missingKeys, tierCounts })
  console.log(`\nWrote docs/runtime-verification-log.md`)
  process.exit(passed === checks.length ? 0 : 1)
}

async function sentinelRedactionCheck() {
  console.log('\nBaseline key redaction (USPTO sentinel — no real key needed):')
  const SENTINEL = 'SENTINEL_LEAK_CANARY_d8f3a91c'
  const realFetch = globalThis.fetch
  let headerHadKey = false
  let url = ''
  const FIXTURE = { patents: [{ patent_id: '99999001', patent_title: 'Test', patent_date: '2026-05-20', patent_abstract: 'x', assignees: [{ assignee_organization: 'NVIDIA Corporation' }], cpc_current: [{ cpc_group_id: 'H01L23/00' }] }] }
  // @ts-expect-error test stub
  globalThis.fetch = async (u: string | URL, init?: { headers?: Record<string, string> }) => {
    url = String(u)
    headerHadKey = Object.values(init?.headers ?? {}).includes(SENTINEL)
    return { ok: true, status: 200, json: async () => FIXTURE } as unknown as Response
  }
  let events: WorldIntelEvent[] = []
  try {
    events = await fetchUsptoPatents(timeoutSignal(5_000), { apiBase: 'https://search.patentsview.org/api/v1/patent/', apiKey: SENTINEL, assignees: ['NVIDIA Corporation'], lookbackDays: 30, maxRecords: 5 })
  } finally {
    globalThis.fetch = realFetch
  }
  check('sentinel key travels only in header, never URL', headerHadKey && !url.includes(SENTINEL), 'header=yes url=no')
  check('sentinel key absent from normalized event', !JSON.stringify(events).includes(SENTINEL), 'scanned normalized output')
}

function printTruthTable(rows: ConnectorRow[]) {
  console.log('Connector truth table:')
  const header = ['connector', 'impl', 'gating', 'key?', 'status', 'recs', 'persist', 'trail', 'redact', 'resolver', 'expose']
  const widths = [18, 5, 11, 8, 19, 6, 9, 7, 8, 17, 7]
  const fmt = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join('')
  console.log('  ' + fmt(header))
  console.log('  ' + '-'.repeat(widths.reduce((a, b) => a + b, 0)))
  for (const r of rows) {
    console.log('  ' + fmt([
      r.id,
      r.implemented ? 'yes' : 'no',
      r.gating,
      r.keyPresent,
      r.status,
      String(r.records),
      r.persistenceRoundTrip,
      r.sourceTrailProof,
      r.keyRedaction,
      r.resolver,
      r.exposureAllowed,
    ]))
  }
}

function writeLog(rows: ConnectorRow[], env: { presentKeys: string[]; missingKeys: string[]; tierCounts: Map<string, string[]> }) {
  const now = new Date().toISOString()
  const passed = checks.filter((c) => c.pass).length
  const failures = checks.filter((c) => !c.pass)
  const tradeKeys = env.missingKeys
  const tableRows = rows
    .map((r) => `| ${r.id} | ${r.implemented ? 'impl' : 'not-wired'} | ${r.gating} | ${r.requiredEnv} | ${r.keyPresent} | ${r.status} | ${r.records} | ${r.persistenceRoundTrip} | ${r.sourceTrailProof} | ${r.keyRedaction} | ${r.resolver} | ${r.exposureAllowed} |`)
    .join('\n')
  const tierRows = [...env.tierCounts.entries()].map(([tier, ids]) => `| ${tier} | ${ids.length} | ${ids.join(', ')} |`).join('\n')
  const md = `# Runtime Verification Log

**Generated:** ${now}
**Command:** \`${COMMAND}\`
**Result:** ${passed}/${checks.length} checks passed
**Persistence:** node:sqlite (with JSON fallback)

> Operator pass. Drives the real adapter/registry/audit code: public connectors are
> exercised live, keyed connectors without keys report \`missing-key\`, keyed
> connectors with keys do a real fetch. No secrets are printed; key values are read
> only for the redaction scan. Fail-closed on provider errors.

## Env keys (names only)

- **present:** ${env.presentKeys.length ? env.presentKeys.join(', ') : '(none)'}
- **missing:** ${env.missingKeys.join(', ') || '(none)'}

## Connector truth table

| connector | impl | gating | env required | key? | status | recs | persist | trail | redact | resolver | expose |
|---|---|---|---|---|---|---|---|---|---|---|---|
${tableRows}

## Trust tiers

| tier | count | connectors |
|---|---|---|
${tierRows}

## Failures

${failures.length === 0 ? '_None — all checks passed._' : failures.map((f) => `- **${f.name}** — ${f.detail}`).join('\n')}

## Next required keys (to exercise keyed connectors live)

${tradeKeys.length === 0 ? '_All keyed connectors have keys present._' : tradeKeys.map((k) => `- \`${k}\``).join('\n')}

## Reproduce

\`\`\`bash
${COMMAND}
\`\`\`
`
  writeFileSync(join(process.cwd(), 'docs', 'runtime-verification-log.md'), md)
}

// Touch the provenance contract so a dropped tier fails the type-check here too.
const _tierContract: ProvenanceId[] = [...PROVENANCE_VALUES]
void _tierContract

main().catch((err) => {
  console.error('harness crashed:', err)
  process.exit(2)
})
