import { describe, expect, it } from 'vitest'
import { worldAutoRefreshIntervalMs } from '../electron/worldIntelService'

describe('World Intel auto-refresh cadence', () => {
  it('defaults to a ten-minute background cadence', () => {
    expect(worldAutoRefreshIntervalMs({})).toBe(10 * 60_000)
  })

  it('clamps too-fast refresh requests to avoid hammering sources', () => {
    expect(worldAutoRefreshIntervalMs({ ATLASZ_WORLD_REFRESH_MS: '1000' })).toBe(60_000)
  })

  it('clamps too-slow refresh requests so daily sources are still checked daily', () => {
    expect(worldAutoRefreshIntervalMs({ ATLASZ_WORLD_REFRESH_MS: String(7 * 24 * 60 * 60_000) })).toBe(24 * 60 * 60_000)
  })
})
