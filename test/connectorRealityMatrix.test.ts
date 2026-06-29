import { describe, expect, it } from 'vitest'
import {
  buildConnectorMatrix,
  summarizeMatrix,
  classifyEnv,
} from '../src/engine/connectorRealityMatrix'
import { CONNECTOR_AUDIT_DEFINITIONS } from '../src/engine/runtimeAudit'

describe('connector reality matrix', () => {
  const rows = buildConnectorMatrix()
  const byId = new Map(rows.map((r) => [r.id, r]))

  it('covers every registry connector exactly once', () => {
    expect(rows.length).toBe(CONNECTOR_AUDIT_DEFINITIONS.length)
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length)
  })

  it('classifies env vars by suffix without reading values', () => {
    const c = classifyEnv(['ATLASZ_EIA_API_KEY', 'ATLASZ_LNG_TERMINALS_URL', 'ATLASZ_SEC_USER_AGENT', 'ATLASZ_OPTIONS_UNDERLYINGS'])
    expect(c.secretKeys).toEqual(['ATLASZ_EIA_API_KEY'])
    expect(c.configuredUrls).toEqual(['ATLASZ_LNG_TERMINALS_URL'])
    expect(c.userAgents).toEqual(['ATLASZ_SEC_USER_AGENT'])
    expect(c.otherConfig).toEqual(['ATLASZ_OPTIONS_UNDERLYINGS'])
  })

  it('marks secret-keyed connectors key-gated with a missing-key cold start', () => {
    const eia = byId.get('eia')
    expect(eia?.decision).toBe('key-gated')
    expect(eia?.authRequired).toBe(true)
    expect(eia?.noKeyMode).toBe(false)
    expect(eia?.coldStartStatus).toBe('missing-key')
    expect(eia?.blocker).toContain('ATLASZ_EIA_API_KEY')
  })

  it('marks URL-only connectors configured-only, not key-gated', () => {
    const lng = byId.get('lng-terminals')
    expect(lng?.decision).toBe('configured-only')
    expect(lng?.authRequired).toBe(false)
    expect(lng?.configuredUrlRequired).toBe(true)
    expect(lng?.blocker).toContain('ATLASZ_LNG_TERMINALS_URL')
  })

  it('treats SEC user-agent connectors as no-key (config-required), not key-gated', () => {
    const edgar = byId.get('sec-edgar')
    expect(edgar?.authRequired).toBe(false)
    expect(edgar?.noKeyMode).toBe(true)
    expect(edgar?.decision).toBe('no-key public (config-required)')
  })

  it('cross-references same-domain no-key siblings for locked connectors', () => {
    // eia (key-gated) shares the "energy and commodities" domain with eia-bulk-public (no-key).
    expect(byId.get('eia')?.noKeySiblingIds).toContain('eia-bulk-public')
    expect(byId.get('eia-bulk-public')?.noKeyMode).toBe(true)
  })

  it('never emits a secret value — only env var names appear', () => {
    for (const r of rows) {
      for (const name of r.requiredEnv) {
        expect(name).toMatch(/^[A-Z0-9_]+$/)
      }
    }
  })

  it('summary decision counts add up to the connector total', () => {
    const summary = summarizeMatrix(rows)
    const sum = Object.values(summary.byDecision).reduce((a, b) => a + b, 0)
    expect(sum).toBe(summary.total)
    expect(summary.total).toBe(CONNECTOR_AUDIT_DEFINITIONS.length)
  })
})
