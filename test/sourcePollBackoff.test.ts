import { describe, expect, it } from 'vitest'
import { sourcePollCooldownMs, sourceRefreshDecision } from '../electron/osint/sourceRegistry'

const RATE = 60_000 // 1 minute base rate limit
const NOW = Date.parse('2026-06-29T00:00:00Z')

/**
 * A persistently-failing source must not be re-hammered every refresh: the poll
 * cooldown grows with consecutive failures (bounded), and resets on recovery.
 */
describe('sourcePollCooldownMs', () => {
  it('uses the plain rate limit when healthy (no failures)', () => {
    expect(sourcePollCooldownMs(RATE, 0)).toBe(RATE)
    expect(sourcePollCooldownMs(RATE, -1)).toBe(RATE)
  })

  it('respects the source freshness cadence when it is slower than the rate guard', () => {
    const hourlyCadence = 60 * 60_000
    expect(sourcePollCooldownMs(RATE, 0, 60 * 60_000, hourlyCadence)).toBe(hourlyCadence)
  })

  it('uses the cadence-aware base for failure backoff', () => {
    const dailyCadence = 24 * 60 * 60_000
    const twoDayCap = 2 * dailyCadence
    expect(sourcePollCooldownMs(RATE, 1, twoDayCap, dailyCadence)).toBe(twoDayCap)
  })

  it('extends the window exponentially with consecutive failures', () => {
    expect(sourcePollCooldownMs(RATE, 1)).toBe(RATE * 2)
    expect(sourcePollCooldownMs(RATE, 2)).toBe(RATE * 4)
    expect(sourcePollCooldownMs(RATE, 3)).toBe(RATE * 8)
  })

  it('caps the exponent so the multiplier never runs away', () => {
    // 2 ** min(failures, 6) => 64x at most. Use a small base so the 64x ceiling
    // is observable below the absolute cap.
    const small = 10_000
    expect(sourcePollCooldownMs(small, 6)).toBe(small * 64)
    expect(sourcePollCooldownMs(small, 50)).toBe(small * 64)
  })

  it('never exceeds the absolute cap', () => {
    expect(sourcePollCooldownMs(RATE, 50)).toBeLessThanOrEqual(60 * 60 * 1000)
    // A large base rate limit is clamped to the cap rather than multiplied past it.
    expect(sourcePollCooldownMs(30 * 60_000, 6, 60 * 60 * 1000)).toBe(60 * 60 * 1000)
  })

  it('returns to the base rate limit once failures reset to zero (recovery)', () => {
    expect(sourcePollCooldownMs(RATE, 0)).toBe(RATE)
  })

  it('classifies healthy connectors inside cadence as not-due, not rate-limited', () => {
    expect(sourceRefreshDecision({
      enabled: true,
      configured: true,
      status: 'online',
      pollIntervalMs: 60 * 60_000,
      rateLimitMs: RATE,
      lastAttemptAt: NOW - 5 * 60_000,
      lastSuccessAt: NOW - 5 * 60_000,
      consecutiveFailures: 0,
    }, NOW)).toMatchObject({ refreshState: 'not-due' })
  })

  it('classifies failed connectors inside the failure window as backed-off', () => {
    expect(sourceRefreshDecision({
      enabled: true,
      configured: true,
      status: 'failed',
      pollIntervalMs: RATE,
      rateLimitMs: RATE,
      lastAttemptAt: NOW - 30_000,
      lastSuccessAt: NOW - 10 * RATE,
      consecutiveFailures: 2,
    }, NOW)).toMatchObject({ refreshState: 'backed-off' })
  })

  it('classifies missing-key connectors as skipped fail-closed', () => {
    expect(sourceRefreshDecision({
      enabled: false,
      configured: false,
      configHint: 'missing ATLASZ_TEST_KEY',
      status: 'disabled',
      pollIntervalMs: RATE,
      rateLimitMs: RATE,
      consecutiveFailures: 0,
    }, NOW)).toMatchObject({ refreshState: 'missing-key', refreshReason: 'missing ATLASZ_TEST_KEY' })
  })

  it('surfaces stale and expired source freshness windows', () => {
    const stale = sourceRefreshDecision({
      enabled: true,
      configured: true,
      status: 'online',
      pollIntervalMs: RATE,
      rateLimitMs: RATE,
      lastAttemptAt: NOW - 2 * RATE,
      lastSuccessAt: NOW - 2 * RATE,
      consecutiveFailures: 0,
    }, NOW)
    const expired = sourceRefreshDecision({
      enabled: true,
      configured: true,
      status: 'online',
      pollIntervalMs: RATE,
      rateLimitMs: RATE,
      lastAttemptAt: NOW - 4 * RATE,
      lastSuccessAt: NOW - 4 * RATE,
      consecutiveFailures: 0,
    }, NOW)

    expect(stale.refreshState).toBe('stale')
    expect(expired.refreshState).toBe('expired')
  })
})
