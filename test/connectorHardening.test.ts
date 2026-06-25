import { describe, expect, it } from 'vitest'
import { buildConnectorHardening, summarizeHardening } from '../src/engine/connectorHardening'
import { buildConnectorAudit, CONNECTOR_AUDIT_DEFINITIONS } from '../src/engine/runtimeAudit'

describe('connector hardening audit', () => {
  const reports = buildConnectorHardening()
  const byId = new Map(reports.map((r) => [r.id, r]))

  it('scores every registry connector within 0..100, sorted weakest-first', () => {
    expect(reports.length).toBe(CONNECTOR_AUDIT_DEFINITIONS.length)
    for (const r of reports) {
      expect(r.hardeningScore).toBeGreaterThanOrEqual(0)
      expect(r.hardeningScore).toBeLessThanOrEqual(100)
    }
    for (let i = 1; i < reports.length; i += 1) {
      expect(reports[i].hardeningScore).toBeGreaterThanOrEqual(reports[i - 1].hardeningScore)
    }
  })

  it('does not flag unresolved-by-design connectors as a resolver gap', () => {
    for (const id of ['gdelt-doc', 'un-comtrade', 'un-locode', 'world-port-index', 'crossref-works']) {
      const r = byId.get(id)
      expect(r).toBeDefined()
      expect(r!.knownGaps.some((g) => g.startsWith('No resolver/exposure'))).toBe(false)
    }
  })

  it('a fully-wired resolver connector has no gaps and a top score', () => {
    const sec = byId.get('sec-edgar')!
    expect(sec.knownGaps).toEqual([])
    expect(sec.hardeningScore).toBe(100)
  })

  it('options is honestly flagged as live-wiring deferred', () => {
    const opt = byId.get('options-oi')!
    expect(opt.liveWiringDeferred).toBe(true)
    expect(opt.knownGaps.some((g) => /deferred/i.test(g))).toBe(true)
  })

  it('the fleet is strongly hardened on average', () => {
    const summary = summarizeHardening(reports)
    expect(summary.total).toBe(CONNECTOR_AUDIT_DEFINITIONS.length)
    expect(summary.averageScore).toBeGreaterThanOrEqual(90)
  })

  it('connector audit reports deferred status for deferred connectors', () => {
    const rows = buildConnectorAudit({ sources: [], events: [], now: Date.parse('2026-06-18T12:00:00Z') })
    expect(rows.find((row) => row.id === 'options-oi')?.status).toBe('deferred')
  })
})
