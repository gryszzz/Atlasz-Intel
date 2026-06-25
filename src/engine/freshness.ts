/*
 * Canonical freshness model — one honest label for every rendered record.
 *
 * Maps (retrievedAt / staleAt / observedAt / cadence + connector status) to a
 * single label so a stale item is never styled fresh and an unconfigured/limited
 * connector reads honestly. Pure + deterministic.
 */
export type FreshnessLabel =
  | 'live'
  | 'fresh'
  | 'cached'
  | 'stale'
  | 'expired'
  | 'missing-key'
  | 'unavailable'
  | 'rate-limited'

export type FreshnessInput = {
  now: number
  /** When Atlasz fetched it. Missing => unavailable. */
  retrievedAt?: number
  /** When the record goes stale (source-provided). Past it => expired. */
  staleAt?: number
  /** Source/observation time, if the source provides it (preferred for age). */
  observedAt?: number
  /** Declared cadence; only realtime/near-realtime can read "live". */
  cadence?: string
  /** Connector runtime state that overrides time-based freshness. */
  status?: 'online' | 'missing-key' | 'rate-limited' | 'unavailable' | 'failed' | 'stale' | 'deferred'
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const LIVE_MS = 60_000
const FRESH_MS = 6 * HOUR
const CACHED_MS = 7 * DAY

export function freshnessLabel(input: FreshnessInput): FreshnessLabel {
  // Connector status overrides any time-based reasoning.
  if (input.status === 'missing-key' || input.status === 'deferred') return input.status === 'deferred' ? 'unavailable' : 'missing-key'
  if (input.status === 'rate-limited') return 'rate-limited'
  if (input.status === 'unavailable' || input.status === 'failed') return 'unavailable'

  if (input.retrievedAt === undefined || !Number.isFinite(input.retrievedAt)) return 'unavailable'
  if (input.staleAt !== undefined && Number.isFinite(input.staleAt) && input.now > input.staleAt) return 'expired'

  const ts = input.observedAt !== undefined && Number.isFinite(input.observedAt) ? input.observedAt : input.retrievedAt
  const age = input.now - ts
  const realtime = input.cadence === 'realtime' || input.cadence === 'near-realtime'

  if (age < 0) return realtime ? 'live' : 'fresh'
  if (realtime && age <= LIVE_MS) return 'live'
  if (age <= FRESH_MS) return 'fresh'
  // Within a source-declared validity window but older than "fresh" => cached.
  if (input.staleAt !== undefined && Number.isFinite(input.staleAt) && input.now <= input.staleAt) return 'cached'
  if (age <= CACHED_MS) return 'cached'
  return 'stale'
}

/** Whether a label should render with a "needs attention" treatment. */
export function isAttentionLabel(label: FreshnessLabel): boolean {
  return label === 'stale' || label === 'expired' || label === 'missing-key' || label === 'unavailable' || label === 'rate-limited'
}

/**
 * Evidence weight for a freshness label, in [0,1]. Fresh evidence weighs more
 * than stale/expired evidence WITHOUT hiding it (expired still has weight 0.2,
 * remains visible, just lower confidence).
 *
 * `undefined` means UNKNOWN, not zero: a missing-key / unavailable / rate-limited
 * source has no freshness signal at all, so it must be treated as an open unknown
 * (uncertainty to resolve) rather than as fresh, stale, or "no risk".
 */
export function freshnessWeight(label: FreshnessLabel): number | undefined {
  switch (label) {
    case 'live':
      return 1.0
    case 'fresh':
      return 0.9
    case 'cached':
      return 0.65
    case 'stale':
      return 0.4
    case 'expired':
      return 0.2
    case 'missing-key':
    case 'unavailable':
    case 'rate-limited':
      return undefined
  }
}

/** True when a label carries no freshness signal and must be treated as unknown. */
export function isUnknownFreshness(label: FreshnessLabel): boolean {
  return freshnessWeight(label) === undefined
}
