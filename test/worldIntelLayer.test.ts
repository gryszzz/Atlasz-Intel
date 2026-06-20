import { afterEach, describe, expect, it, vi } from 'vitest'
import { OsintSourceRegistry } from '../electron/osint/sourceRegistry'
import { buildAssetIdentity, buildWorldIntelEventFromHeadline } from '../src/worldIntel'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('world intelligence terminal layer', () => {
  it('normalizes public headlines into WorldIntelEvent with honest provenance', () => {
    const event = buildWorldIntelEventFromHeadline(
      {
        id: 'headline-1',
        title: 'Taiwan semiconductor supply chain faces new export control pressure',
        source: 'GDELT public source',
        url: 'https://example.test/taiwan-semiconductors',
        sector: 'Geopolitics',
        impact: 'Semiconductor supply concentration',
        observedAt: 1_725_000_000_000,
      },
      { sourceId: 'gdelt_doc_public', provenance: 'public-unauthenticated' },
    )

    expect(event.provenance).toBe('public-unauthenticated')
    expect(event.sourceId).toBe('gdelt_doc_public')
    expect(event.countryCodes).toContain('TW')
    expect(event.affectedAssets).toEqual(expect.arrayContaining(['TSM', 'NVDA', 'SOXX']))
    expect(event.dedupeHash).toMatch(/^world-/)
  })

  it('exposes a fail-closed source registry with legal/safety metadata', async () => {
    vi.stubEnv('ATLASZ_ENABLE_PUBLIC_WORLD', '0')
    const registry = new OsintSourceRegistry()
    const result = await registry.pollEnabledSources()
    const sources = registry.snapshots()
    const gdelt = sources.find((source) => source.sourceId === 'gdelt_doc_public')
    const xPlaceholder = sources.find((source) => source.sourceId === 'x_explore_placeholder')

    expect(result.events).toHaveLength(0)
    expect(gdelt?.enabled).toBe(false)
    expect(gdelt?.status).toBe('disabled')
    expect(gdelt?.legalSafetyNote).toContain('public')
    expect(xPlaceholder?.enabled).toBe(false)
    expect(xPlaceholder?.provenance).toBe('auth-gated')
  })

  it('builds stable asset identity cards with fallback icons', () => {
    const identity = buildAssetIdentity('KAS')

    expect(identity.symbol).toBe('KAS')
    expect(identity.type).toBe('crypto')
    expect(identity.fallbackIcon).toBe('KAS')
    expect(identity.dataAvailabilityStatus).toContain('simulator')
  })
})
