import { freshnessLabel, isAttentionLabel, type FreshnessInput, type FreshnessLabel } from '../../engine/freshness'
import './FreshnessBadge.css'

/*
 * FreshnessBadge — the single canonical freshness chip for every rendered record.
 *
 * Driven by engine/freshness.freshnessLabel so a stale/expired/unavailable item
 * is visually impossible to mistake for fresh: only live/fresh read confident
 * (solid border, filled dot); every attention state (stale/expired/missing-key/
 * unavailable/rate-limited) gets a dashed border + hollow dot. Pure presentation.
 */

const LABEL_TEXT: Record<FreshnessLabel, string> = {
  live: 'live',
  fresh: 'fresh',
  cached: 'cached',
  stale: 'stale',
  expired: 'expired',
  'missing-key': 'missing key',
  unavailable: 'unavailable',
  'rate-limited': 'rate-limited',
}

const LABEL_TITLE: Record<FreshnessLabel, string> = {
  live: 'Live — realtime source, observed within the last minute',
  fresh: 'Fresh — retrieved recently, within the source cadence',
  cached: 'Cached — older than fresh but within its validity window',
  stale: 'Stale — past its expected refresh window (shown as cached, not current)',
  expired: 'Expired — past the source-declared validity time',
  'missing-key': 'Missing key — connector needs an API key; no live data',
  unavailable: 'Unavailable — no source data retrieved',
  'rate-limited': 'Rate-limited — source throttled; not refreshed (never faked)',
}

export function FreshnessBadge({
  size = 'md',
  ...input
}: FreshnessInput & { size?: 'sm' | 'md' }) {
  const label = freshnessLabel(input)
  const treatment = isAttentionLabel(label) ? 'attn' : 'ok'
  return (
    <span
      className={`fresh-badge fresh-${label} fresh-${treatment} fresh-size-${size}`}
      data-freshness={label}
      title={LABEL_TITLE[label]}
    >
      <i className="fresh-badge-dot" aria-hidden="true" />
      {LABEL_TEXT[label]}
    </span>
  )
}
