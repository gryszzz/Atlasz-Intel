import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPersistence } from '../electron/persistence'
import { WorldIntelService, worldAutoRefreshIntervalMs } from '../electron/worldIntelService'

afterEach(() => {
  vi.unstubAllEnvs()
})

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

  it('pauses and resumes the background refresh loop without running a manual fetch', () => {
    vi.stubEnv('ATLASZ_ENABLE_PUBLIC_WORLD', '1')
    vi.stubEnv('ATLASZ_WORLD_REFRESH_MS', '60000')
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-world-refresh-'))
    const persistence = createPersistence(dir)
    const service = new WorldIntelService(persistence)

    try {
      const paused = service.pauseAutoRefresh()
      expect(paused.refreshControl).toMatchObject({
        autoRefreshEnabled: true,
        autoRefreshPaused: true,
        cadenceMs: 60_000,
      })

      const resumed = service.resumeAutoRefresh()
      expect(resumed.refreshControl.autoRefreshPaused).toBe(false)
      expect(resumed.refreshControl.nextScheduledRefreshAt).toBeGreaterThan(Date.now())
    } finally {
      service.stopAutoRefresh()
      persistence.close()
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
