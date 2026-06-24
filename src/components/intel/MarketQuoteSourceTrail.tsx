/*
 * Market Quote source-trail card (key-gated equity/ETF prices).
 *
 * Renders ONLY real, source-backed quotes (full proof fields), with a stale
 * badge when stale. With no configured provider / no real quote it shows
 * PRICE_UNAVAILABLE — never a seeded, default, or random-walk price. No trading
 * advice, prediction, or signal score.
 */
import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { isQuoteStale, isRenderableQuote, quotePriceLabel, PRICE_UNAVAILABLE, type MarketQuote } from '../../marketQuote'
import './EiaFacilitySourceTrail.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'

export function MarketQuoteSourceTrail({ quotes = [], now }: { quotes?: MarketQuote[]; now?: number }) {
  const [fallbackNow] = useState(() => Date.now())
  const renderNow = now ?? fallbackNow
  const renderable = quotes.filter(isRenderableQuote)
  const first = renderable[0]
  return (
    <section className="eia-fac-trail world-panel">
      <header className="eia-fac-head">
        <span>Market Quotes · Key-Gated Price Source Trail</span>
        <strong>{renderable.length > 0 ? `${renderable.length} quotes` : UNAVAILABLE}</strong>
      </header>
      <p className="eia-fac-note">
        Real key-gated equity/ETF quotes only (Alpaca IEX). No seeded, default, or random-walk prices — missing/
        unconfigured shows {PRICE_UNAVAILABLE}. Not trading advice, a prediction, or a signal score.
      </p>
      {renderable.length > 0 ? (
        <article className="eia-fac">
          <div className="eia-fac-row-head">
            {first ? <ProvenanceBadge value={first.provenance} size="sm" /> : null}
            <span className="eia-ticker">key-gated market data</span>
          </div>
          <table className="eia-status-table">
            <thead>
              <tr>
                <th scope="col">Ticker</th>
                <th scope="col">Price</th>
                <th scope="col">Bid/Ask</th>
                <th scope="col">As of</th>
                <th scope="col">State</th>
                <th scope="col">Hash</th>
              </tr>
            </thead>
            <tbody>
              {renderable.map((quote) => {
                const stale = isQuoteStale(quote, renderNow)
                return (
                  <tr key={quote.id}>
                    <th scope="row">{quote.ticker}{quote.assetType ? ` · ${quote.assetType}` : ''}</th>
                    <td className="eia-num">{quotePriceLabel(quote)}</td>
                    <td className="eia-num">{quote.bid !== undefined && quote.ask !== undefined ? `${quote.bid} / ${quote.ask}` : '—'}</td>
                    <td>{new Date(quote.marketTimestamp).toISOString()}</td>
                    <td><span className={stale ? 'eia-stale' : 'eia-fresh'}>{stale ? 'stale' : 'fresh'}</span></td>
                    <td className="eia-hash">{quote.rawPayloadHash.slice(0, 10)}…</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {first ? (
            <div className="eia-links">
              <a href={first.sourceUrl} target="_blank" rel="noreferrer">
                <Link2 size={12} /> {first.sourceName}
              </a>
              <span className="eia-api">{first.sourceApiUrl}</span>
            </div>
          ) : null}
        </article>
      ) : (
        <div className="eia-fac-empty">
          <strong>{PRICE_UNAVAILABLE}</strong>
          <p>
            No real equity/ETF quote provider is returning data. This provider is key-gated and fail-closed: configure
            ATLASZ_EQUITY_QUOTE_PROVIDER=alpaca with ATLASZ_ALPACA_API_KEY + ATLASZ_ALPACA_SECRET_KEY. Atlasz never shows
            a seeded, default, or simulated price in place of a real quote.
          </p>
        </div>
      )}
    </section>
  )
}
