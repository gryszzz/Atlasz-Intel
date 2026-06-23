/*
 * Headless runtime verification harness.
 *
 * Drives the SAME code paths the Connector Dashboard and Exposure Dashboard
 * render, but without a display:
 *   - connector state matrix via buildConnectorAudit (the dashboard's engine)
 *   - LIVE fetch of public, no-key official sources (USGS, CISA KEV)
 *   - sentinel key-redaction proof for the keyed USPTO adapter (no real key)
 *   - persistence round-trip across a simulated restart (close + reopen)
 *   - exposure activation (resolvable) vs honest non-resolution (unresolved)
 *
 * It NEVER invents API keys and NEVER fabricates a fetch result. Keyed
 * connectors with no key are reported honestly as missing-key. Run:
 *   npx tsx scripts/runtimeVerification.mts
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createPersistence } from '../electron/persistence'
import { fetchUsgsEarthquakes } from '../electron/osint/adapters/usgsQuakeAdapter'
import { fetchKevVulnerabilities } from '../electron/osint/adapters/cisaKevAdapter'
import {
  fetchUsptoPatents,
  normalizeUsptoPatents,
  parseUsptoPatents,
} from '../electron/osint/adapters/usptoPatentAdapter'
import {
  buildConnectorAudit,
  summarizeExposure,
  CONNECTOR_AUDIT_DEFINITIONS,
  type ConnectorRuntimeStatus,
} from '../src/engine/runtimeAudit'
import { eventStructuralExposure } from '../src/engine/entityResolver'
import type { OsintSourceSnapshot, WorldIntelEvent } from '../src/worldIntel'

const KEY_ENV_NAMES = [
  'ATLASZ_PATENTSVIEW_API_KEY',
  'ATLASZ_EIA_API_KEY',
  'ATLASZ_BEA_API_KEY',
  'ATLASZ_FRED_API_KEY',
  'ATLASZ_SEC_USER_AGENT',
  'GITHUB_TOKEN',
  'ATLASZ_GITHUB_TOKEN',
]

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

function eventRetrievedAt(e: WorldIntelEvent): number | undefined {
  const sub =
    e.earthquakeEvent ?? e.kevVulnerability ?? e.patentRecord ?? e.nvdCve ?? e.weatherAlert
  return (sub as { retrievedAt?: number } | undefined)?.retrievedAt
}

async function main() {
  console.log('\n=== Atlasz Runtime Verification (headless) ===\n')

  // 1. Env key presence (names only, never values).
  console.log('Env keys present (names only):')
  const present = KEY_ENV_NAMES.filter((k) => Boolean(process.env[k]))
  const missing = KEY_ENV_NAMES.filter((k) => !process.env[k])
  console.log('  present:', present.length ? present.join(', ') : '(none)')
  console.log('  missing:', missing.join(', '))
  console.log()

  // 2. Cold-start connector state matrix (no source snapshots yet) — this is the
  //    dashboard exactly as it renders before any fetch loop runs.
  console.log('Connector state matrix (cold start, real env):')
  const coldRows = buildConnectorAudit({ sources: [], events: [], now: Date.now() })
  const matrix: Record<string, ConnectorRuntimeStatus> = {}
  for (const row of coldRows) {
    matrix[row.id] = row.status
    console.log(`  ${row.label.padEnd(22)} ${row.status.padEnd(12)} ${row.missingReason ?? ''}`)
  }
  // Keyed connectors with no key must be missing-key; un-keyed implemented ones not-wired until fetched.
  const usptoCold = coldRows.find((r) => r.id === 'uspto')
  check('USPTO cold state is missing-key (no key present)', usptoCold?.status === 'missing-key', `status=${usptoCold?.status}`)
  const comtrade = coldRows.find((r) => r.id === 'un-comtrade')
  check('UN Comtrade implemented + key-gated -> missing-key without a key', comtrade?.status === 'missing-key', `status=${comtrade?.status}`)
  const publicCold = ['usgs-earthquakes', 'cisa-kev', 'nvd'].map((id) => coldRows.find((r) => r.id === id)?.status)
  check('public implemented connectors cold-start as pending-first-fetch (not not-wired)', publicCold.every((s) => s === 'pending-first-fetch'), `usgs/kev/nvd=${publicCold.join('/')}`)
  console.log()

  // 3. LIVE fetch of public, no-key official sources.
  console.log('Live fetch — public official sources (real network):')
  const liveEvents: WorldIntelEvent[] = []
  for (const [label, fetcher] of [
    ['USGS earthquakes', () => fetchUsgsEarthquakes(timeoutSignal(12_000))],
    ['CISA KEV', () => fetchKevVulnerabilities(timeoutSignal(12_000))],
  ] as const) {
    try {
      const events = await fetcher()
      liveEvents.push(...events)
      const sample = events[0]
      const hashOk = !sample || typeof sample.rawPayloadHash === 'string' && sample.rawPayloadHash.length > 0
      const retrOk = !sample || typeof eventRetrievedAt(sample) === 'number'
      const urlOk = !sample || /^https:\/\//.test(sample.sourceUrl)
      check(`${label} fetch honest (${events.length} records)`, true, events.length ? 'records normalized' : 'empty but no throw (honest)')
      if (sample) {
        check(`${label} payload hash + retrievedAt + https trail`, hashOk && retrOk && urlOk, `hash=${hashOk} retrievedAt=${retrOk} https=${urlOk}`)
      }
    } catch (err) {
      check(`${label} fetch`, false, `threw: ${(err as Error).message}`)
    }
  }
  console.log()

  // 4. Sentinel key-redaction proof for the keyed USPTO adapter (no real key, no leak).
  console.log('Key redaction — USPTO sentinel (header-only key, stubbed fetch):')
  const SENTINEL = 'SENTINEL_LEAK_CANARY_d8f3a91c'
  const realFetch = globalThis.fetch
  let capturedHeaderHadKey = false
  let capturedUrl = ''
  const FIXTURE = {
    patents: [
      {
        patent_id: '99999001',
        patent_title: 'Test interposer for AI accelerators',
        patent_date: '2026-05-20',
        patent_abstract: 'A test abstract.',
        assignees: [{ assignee_organization: 'NVIDIA Corporation' }],
        cpc_current: [{ cpc_group_id: 'H01L23/00' }, { cpc_group_id: 'G06N3/08' }],
      },
    ],
  }
  // @ts-expect-error test stub
  globalThis.fetch = async (url: string | URL, init?: { headers?: Record<string, string> }) => {
    capturedUrl = String(url)
    const hdrs = (init?.headers ?? {}) as Record<string, string>
    capturedHeaderHadKey = Object.values(hdrs).includes(SENTINEL)
    return { ok: true, status: 200, json: async () => FIXTURE } as unknown as Response
  }
  let usptoEvents: WorldIntelEvent[] = []
  try {
    usptoEvents = await fetchUsptoPatents(timeoutSignal(5_000), {
      apiBase: 'https://search.patentsview.org/api/v1/patent/',
      apiKey: SENTINEL,
      assignees: ['NVIDIA Corporation'],
      lookbackDays: 30,
      maxRecords: 5,
    })
  } finally {
    globalThis.fetch = realFetch
  }
  check('USPTO key travels in request header', capturedHeaderHadKey, 'sentinel found in outbound headers')
  check('USPTO key NOT in request URL', !capturedUrl.includes(SENTINEL), 'sentinel absent from URL query')
  const usptoJson = JSON.stringify(usptoEvents)
  check('USPTO key NOT in normalized event (sourceUrl/payload/record)', !usptoJson.includes(SENTINEL), `scanned ${usptoJson.length} bytes of normalized output`)

  // 5. Persistence round-trip across a SIMULATED RESTART (close + reopen same dir).
  console.log('\nPersistence round-trip across restart:')
  const dir = mkdtempSync(join(tmpdir(), 'atlasz-verify-'))
  try {
    const toPersist = [...liveEvents.slice(0, 5), ...usptoEvents]
    const a = createPersistence(dir)
    console.log(`  persistence mode: ${a.mode}`)
    for (const e of toPersist) a.saveWorldIntelEvent(e)
    a.audit({
      id: 'verify-audit-1',
      eventType: 'provider_discovered',
      connectorId: 'runtime-verification',
      severity: 'info',
      message: `persisted ${toPersist.length} events`,
      createdAt: Date.now(),
      metadata: {},
    })
    a.close() // simulate app shutdown

    const b = createPersistence(dir) // simulate restart
    const reloaded = b.listWorldIntelEvents(500)
    const reloadedIds = new Set(reloaded.map((e) => e.id))
    const survived = toPersist.filter((e) => reloadedIds.has(e.id)).length
    check('events survive restart', toPersist.length === 0 || survived === toPersist.length, `${survived}/${toPersist.length} reloaded`)
    const sentinelInDb = JSON.stringify(reloaded).includes(SENTINEL)
    check('no sentinel key in persisted DB after restart', !sentinelInDb, sentinelInDb ? 'LEAK' : 'clean')
    const usptoReloaded = reloaded.find((e) => e.sourceId === 'uspto_patentsview_public')
    if (usptoReloaded) {
      check('reloaded patent keeps payload hash + retrievedAt', Boolean(usptoReloaded.rawPayloadHash) && typeof eventRetrievedAt(usptoReloaded) === 'number', 'sub-record round-tripped')
    }
    b.close()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }

  // 6. Exposure: resolvable activates curated-reference; unresolved stays unresolved; never verified.
  console.log('\nExposure activation vs honest non-resolution:')
  const resolvablePatent = usptoEvents[0] // NVIDIA + H01L/G06N -> company + tech
  const exposed = resolvablePatent ? eventStructuralExposure(resolvablePatent) : []
  check('resolvable event activates curated exposure', exposed.length > 0, `${exposed.length} seed entities; all source=resolver-rule:${exposed.every((e) => e.resolution.source === 'resolver-rule')}`)
  const unresolved: WorldIntelEvent = { ...(liveEvents.find((e) => e.sourceId === 'usgs_significant_quakes') ?? resolvablePatent), id: 'unresolved-probe', affectedAssets: [], secFiling: undefined, patentRecord: undefined, eiaEnergyRecord: undefined } as WorldIntelEvent
  check('unresolved event stays unresolved (no inferred exposure)', eventStructuralExposure(unresolved).length === 0, 'no seed link forced')
  const exposureJson = JSON.stringify(exposed)
  check('curated-reference never shown as verified', !/"verified"/.test(exposureJson) && !exposureJson.includes('verified'), 'no "verified" token in exposure output')

  // Exposure summary (the Exposure Dashboard's engine) over today's live events.
  const summary = summarizeExposure({ events: [...liveEvents, ...usptoEvents], now: Date.now() })
  console.log(`  exposure summary: considered=${summary.consideredEventCount} resolved=${summary.resolvedEventCount} unresolved=${summary.unresolvedEventCount} curatedOnly=${summary.curatedReferenceOnlyCount}`)

  // Report
  const passed = checks.filter((c) => c.pass).length
  console.log(`\n=== ${passed}/${checks.length} checks passed ===`)
  const report = {
    generatedAt: new Date().toISOString(),
    persistenceLiveEvents: liveEvents.length,
    coldStartMatrix: matrix,
    connectorCount: CONNECTOR_AUDIT_DEFINITIONS.length,
    checks,
    exposureSummary: summary,
  }
  console.log('\n---JSON---')
  console.log(JSON.stringify(report, null, 2))
  process.exit(passed === checks.length ? 0 : 1)
}

main().catch((err) => {
  console.error('harness crashed:', err)
  process.exit(2)
})
