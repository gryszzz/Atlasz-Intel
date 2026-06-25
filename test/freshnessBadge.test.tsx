import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FreshnessBadge } from '../src/components/ui/FreshnessBadge'

const NOW = Date.parse('2026-06-24T12:00:00Z')
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/**
 * The canonical freshness chip must render the honest label for each state, and
 * every attention state (stale/expired/missing-key/unavailable/rate-limited)
 * must carry the dashed-treatment class so it can never read as fresh.
 */
describe('FreshnessBadge', () => {
  it('reads "fresh" for a recently retrieved record (confident treatment)', () => {
    const html = renderToStaticMarkup(<FreshnessBadge now={NOW} retrievedAt={NOW - HOUR} staleAt={NOW + DAY} />)
    expect(html).toContain('data-freshness="fresh"')
    expect(html).toContain('fresh-ok')
    expect(html).not.toContain('fresh-attn')
  })

  it('reads "live" for a realtime sub-minute record', () => {
    const html = renderToStaticMarkup(
      <FreshnessBadge now={NOW} retrievedAt={NOW - 5_000} observedAt={NOW - 5_000} cadence="realtime" />,
    )
    expect(html).toContain('data-freshness="live"')
    expect(html).toContain('fresh-ok')
  })

  it('reads "cached" within the validity window but past fresh', () => {
    const html = renderToStaticMarkup(<FreshnessBadge now={NOW} retrievedAt={NOW - 2 * DAY} staleAt={NOW + DAY} />)
    expect(html).toContain('data-freshness="cached"')
  })

  it('reads "stale" past the cache window (attention treatment)', () => {
    const html = renderToStaticMarkup(<FreshnessBadge now={NOW} retrievedAt={NOW - 30 * DAY} />)
    expect(html).toContain('data-freshness="stale"')
    expect(html).toContain('fresh-attn')
    expect(html).not.toContain('fresh-ok')
  })

  it('reads "expired" once past the source staleAt (attention)', () => {
    const html = renderToStaticMarkup(<FreshnessBadge now={NOW} retrievedAt={NOW - HOUR} staleAt={NOW - 60_000} />)
    expect(html).toContain('data-freshness="expired"')
    expect(html).toContain('fresh-attn')
  })

  it('reads "missing key" for a key-gated connector with no key (attention)', () => {
    const html = renderToStaticMarkup(<FreshnessBadge now={NOW} status="missing-key" />)
    expect(html).toContain('data-freshness="missing-key"')
    expect(html).toContain('missing key')
    expect(html).toContain('fresh-attn')
  })

  it('reads "rate-limited" when the source throttled (attention)', () => {
    const html = renderToStaticMarkup(<FreshnessBadge now={NOW} status="rate-limited" />)
    expect(html).toContain('data-freshness="rate-limited"')
    expect(html).toContain('fresh-attn')
  })

  it('reads "unavailable" with no retrievedAt and for deferred connectors (attention)', () => {
    expect(renderToStaticMarkup(<FreshnessBadge now={NOW} />)).toContain('data-freshness="unavailable"')
    const deferred = renderToStaticMarkup(<FreshnessBadge now={NOW} status="deferred" />)
    expect(deferred).toContain('data-freshness="unavailable"')
    expect(deferred).toContain('fresh-attn')
  })
})
