import { describe, expect, it } from 'vitest'
import {
  HttpError,
  assertOk,
  backoffDelay,
  fetchWithRetry,
  isRetryableStatus,
  parseRetryAfter,
} from '../electron/osint/fetchPolicy'

function res(ok: boolean, status: number, headers: Record<string, string> = {}) {
  return {
    ok,
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  }
}

describe('fetch policy', () => {
  it('assertOk throws a typed HttpError carrying status and Retry-After', () => {
    expect(() => assertOk(res(true, 200), 'X')).not.toThrow()
    const now = Date.parse('2026-06-22T12:00:00Z')
    try {
      assertOk(res(false, 429, { 'retry-after': '5' }), 'NVD', now)
      throw new Error('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError)
      expect((error as HttpError).status).toBe(429)
      expect((error as HttpError).retryAfterMs).toBe(5000)
      expect((error as HttpError).message).toBe('NVD HTTP 429')
    }
  })

  it('parses Retry-After as delta-seconds or HTTP-date', () => {
    const now = Date.parse('2026-06-22T12:00:00Z')
    expect(parseRetryAfter('10', now)).toBe(10_000)
    expect(parseRetryAfter('  3 ', now)).toBe(3_000)
    expect(parseRetryAfter('Mon, 22 Jun 2026 12:00:30 GMT', now)).toBe(30_000)
    expect(parseRetryAfter(null, now)).toBeUndefined()
    expect(parseRetryAfter('garbage', now)).toBeUndefined()
  })

  it('classifies retryable statuses and computes bounded exponential backoff', () => {
    expect(isRetryableStatus(429)).toBe(true)
    expect(isRetryableStatus(503)).toBe(true)
    expect(isRetryableStatus(404)).toBe(false)
    expect(isRetryableStatus(undefined)).toBe(false)
    expect(backoffDelay(1000, 0)).toBe(1000)
    expect(backoffDelay(1000, 1)).toBe(2000)
    expect(backoffDelay(1000, 2)).toBe(4000)
    expect(backoffDelay(1000, 20)).toBe(60_000) // capped
  })

  it('retries retryable failures with backoff, then succeeds', async () => {
    const waits: number[] = []
    let calls = 0
    const result = await fetchWithRetry(
      async () => {
        calls += 1
        if (calls < 3) throw new HttpError('NVD HTTP 503', 503)
        return ['ok']
      },
      { maxRetries: 3, backoffMs: 1000, timeoutMs: 0 },
      { sleep: async (ms) => void waits.push(ms) },
    )
    expect(result).toEqual(['ok'])
    expect(calls).toBe(3)
    expect(waits).toEqual([1000, 2000]) // exponential backoff between attempts
  })

  it('honors Retry-After over computed backoff', async () => {
    const waits: number[] = []
    let calls = 0
    await fetchWithRetry(
      async () => {
        calls += 1
        if (calls < 2) throw new HttpError('NVD HTTP 429', 429, 7500)
        return ['ok']
      },
      { maxRetries: 2, backoffMs: 1000, timeoutMs: 0 },
      { sleep: async (ms) => void waits.push(ms) },
    )
    expect(waits).toEqual([7500])
  })

  it('surfaces long Retry-After values instead of blocking beyond the retry budget', async () => {
    const waits: number[] = []
    let calls = 0
    await expect(
      fetchWithRetry(
        async () => {
          calls += 1
          throw new HttpError('Congress.gov HTTP 429', 429, 30_000)
        },
        { maxRetries: 1, backoffMs: 1000, timeoutMs: 10_000 },
        { sleep: async (ms) => void waits.push(ms) },
      ),
    ).rejects.toMatchObject({ status: 429, retryAfterMs: 30_000 })
    expect(calls).toBe(1)
    expect(waits).toEqual([])
  })

  it('does not retry non-retryable errors (fail closed)', async () => {
    let calls = 0
    await expect(
      fetchWithRetry(
        async () => {
          calls += 1
          throw new HttpError('NVD HTTP 404', 404)
        },
        { maxRetries: 3, backoffMs: 1000, timeoutMs: 0 },
        { sleep: async () => {} },
      ),
    ).rejects.toBeInstanceOf(HttpError)
    expect(calls).toBe(1)
  })

  it('propagates the error after exhausting retries', async () => {
    let calls = 0
    await expect(
      fetchWithRetry(
        async () => {
          calls += 1
          throw new HttpError('NVD HTTP 429', 429)
        },
        { maxRetries: 2, backoffMs: 1, timeoutMs: 0 },
        { sleep: async () => {} },
      ),
    ).rejects.toMatchObject({ status: 429 })
    expect(calls).toBe(3) // initial + 2 retries
  })
})
