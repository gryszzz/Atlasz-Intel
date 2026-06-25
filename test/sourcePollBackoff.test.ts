import { describe, expect, it } from 'vitest'
import { sourcePollCooldownMs } from '../electron/osint/sourceRegistry'

const RATE = 60_000 // 1 minute base rate limit

/**
 * A persistently-failing source must not be re-hammered every refresh: the poll
 * cooldown grows with consecutive failures (bounded), and resets on recovery.
 */
describe('sourcePollCooldownMs', () => {
  it('uses the plain rate limit when healthy (no failures)', () => {
    expect(sourcePollCooldownMs(RATE, 0)).toBe(RATE)
    expect(sourcePollCooldownMs(RATE, -1)).toBe(RATE)
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
})
