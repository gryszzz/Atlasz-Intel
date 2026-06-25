import { describe, expect, it } from 'vitest'
import { freshnessLabel, isAttentionLabel } from '../src/engine/freshness'
import { eligibleForToday } from '../src/engine/materialityEngine'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

describe('canonical freshness model', () => {
  it('connector status overrides time-based freshness', () => {
    expect(freshnessLabel({ now: NOW, retrievedAt: NOW, status: 'missing-key' })).toBe('missing-key')
    expect(freshnessLabel({ now: NOW, retrievedAt: NOW, status: 'rate-limited' })).toBe('rate-limited')
    expect(freshnessLabel({ now: NOW, retrievedAt: NOW, status: 'failed' })).toBe('unavailable')
    expect(freshnessLabel({ now: NOW, retrievedAt: NOW, status: 'deferred' })).toBe('unavailable')
  })

  it('no retrieval => unavailable; past staleAt => expired', () => {
    expect(freshnessLabel({ now: NOW })).toBe('unavailable')
    expect(freshnessLabel({ now: NOW, retrievedAt: NOW - DAY, staleAt: NOW - 1 })).toBe('expired')
  })

  it('age + cadence map to live / fresh / cached / stale', () => {
    expect(freshnessLabel({ now: NOW, retrievedAt: NOW - 10_000, cadence: 'near-realtime' })).toBe('live')
    expect(freshnessLabel({ now: NOW, retrievedAt: NOW - 2 * HOUR })).toBe('fresh')
    expect(freshnessLabel({ now: NOW, retrievedAt: NOW - 2 * DAY, staleAt: NOW + DAY })).toBe('cached') // within validity window
    expect(freshnessLabel({ now: NOW, retrievedAt: NOW - 30 * DAY })).toBe('stale')
  })

  it('flags attention labels correctly', () => {
    for (const l of ['stale', 'expired', 'missing-key', 'unavailable', 'rate-limited'] as const) expect(isAttentionLabel(l)).toBe(true)
    for (const l of ['live', 'fresh', 'cached'] as const) expect(isAttentionLabel(l)).toBe(false)
  })
})

function ev(partial: Partial<WorldIntelEvent> & { id: string; sourceId: string }): WorldIntelEvent {
  return {
    timestamp: NOW - HOUR,
    title: 'e',
    summary: '',
    countryCodes: [],
    region: 'Global',
    category: 'world',
    severity: 'stable',
    confidence: 95,
    sourceId: partial.sourceId,
    provenance: 'official-api',
    affectedAssets: [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
    rawPayloadHash: 'h',
    dedupeHash: 'dh',
    ...partial,
  }
}

describe('what-changed-today eligibility', () => {
  it('recent source-backed events are eligible', () => {
    expect(eligibleForToday(ev({ id: 'a', sourceId: 'sec_edgar_public' }), NOW)).toBe(true)
    expect(eligibleForToday(ev({ id: 'n', sourceId: 'noaa_alerts_public' }), NOW)).toBe(true)
  })

  it('events outside the window are not eligible', () => {
    expect(eligibleForToday(ev({ id: 'old', sourceId: 'sec_edgar_public', timestamp: NOW - 3 * DAY }), NOW)).toBe(false)
  })

  it('static/annual reference re-fetched today does NOT count as changed today', () => {
    // timestamp = retrievedAt (now) but the underlying data is static reference.
    expect(eligibleForToday(ev({ id: 'wpi', sourceId: 'world_port_index_public', timestamp: NOW }), NOW)).toBe(false)
    expect(eligibleForToday(ev({ id: 'loc', sourceId: 'un_locode_public', timestamp: NOW }), NOW)).toBe(false)
    expect(eligibleForToday(ev({ id: 'min', sourceId: 'usgs_minerals_public', timestamp: NOW }), NOW)).toBe(false)
  })
})
