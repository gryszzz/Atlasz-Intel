/*
 * Shared HTTP fetch policy for connectors: typed errors that surface HTTP status
 * and Retry-After, retryable-status detection, exponential backoff, and a retry
 * wrapper used by the source registry.
 *
 * Hardening goals:
 *  - Honor HTTP 429 / 503 with the server's Retry-After when present.
 *  - Bounded exponential backoff (maxRetries / backoffMs are real, not dead config).
 *  - Per-attempt timeout via AbortController.
 *  - Fail-closed: non-retryable errors and exhausted retries propagate unchanged.
 */

export class HttpError extends Error {
  readonly status: number
  readonly retryAfterMs?: number

  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

type MinimalResponse = {
  ok: boolean
  status: number
  headers: { get(name: string): string | null }
}

/** Throw a typed HttpError (carrying Retry-After) when a response is not ok. */
export function assertOk(response: MinimalResponse, label: string, now = Date.now()): void {
  if (response.ok) return
  const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'), now)
  throw new HttpError(`${label} HTTP ${response.status}`, response.status, retryAfterMs)
}

/** Parse a Retry-After header (delta-seconds or HTTP-date) into ms from now. */
export function parseRetryAfter(value: string | null | undefined, now = Date.now()): number | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (/^\d+$/.test(trimmed)) {
    return Math.max(0, Number(trimmed) * 1000)
  }
  const dateMs = Date.parse(trimmed)
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - now)
  }
  return undefined
}

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])

export function isRetryableStatus(status: number | undefined): boolean {
  return status !== undefined && RETRYABLE_STATUSES.has(status)
}

/** Bounded exponential backoff: base * 2^attempt, capped. */
export function backoffDelay(baseMs: number, attempt: number, capMs = 60_000): number {
  if (baseMs <= 0) return 0
  return Math.min(capMs, baseMs * 2 ** attempt)
}

export type RetryPolicy = {
  maxRetries: number
  backoffMs: number
  timeoutMs: number
  /**
   * Retry-After values longer than this are surfaced as the original HTTP error.
   * That keeps Source Ops honest without blocking the whole refresh loop on a
   * provider-imposed cooldown.
   */
  maxRetryWaitMs?: number
}

export type RetryDeps = {
  sleep?: (ms: number) => Promise<void>
  onRetry?: (info: { attempt: number; waitMs: number; status?: number }) => void
}

/**
 * Run a fetcher with a per-attempt timeout and bounded retry/backoff. Retries only
 * on retryable HTTP statuses; honors Retry-After over computed backoff. Non-retryable
 * errors and exhausted retries propagate unchanged (fail-closed).
 */
export async function fetchWithRetry<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  policy: RetryPolicy,
  deps: RetryDeps = {},
): Promise<T> {
  const sleep = deps.sleep ?? defaultSleep
  const maxRetryWaitMs = policy.maxRetryWaitMs ?? (policy.timeoutMs > 0 ? policy.timeoutMs : 60_000)
  let attempt = 0
  for (;;) {
    const controller = new AbortController()
    const timeout = policy.timeoutMs > 0 ? setTimeout(() => controller.abort(), policy.timeoutMs) : undefined
    try {
      return await fetcher(controller.signal)
    } catch (error) {
      const status = error instanceof HttpError ? error.status : undefined
      if (attempt >= policy.maxRetries || !isRetryableStatus(status)) {
        throw error
      }
      const retryAfterMs = error instanceof HttpError ? error.retryAfterMs : undefined
      if (retryAfterMs !== undefined && retryAfterMs > maxRetryWaitMs) {
        throw error
      }
      const waitMs = retryAfterMs ?? backoffDelay(policy.backoffMs, attempt)
      deps.onRetry?.({ attempt, waitMs, status })
      attempt += 1
      await sleep(waitMs)
    } finally {
      if (timeout) clearTimeout(timeout)
    }
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, Math.max(0, ms))
    timer.unref?.()
  })
}
