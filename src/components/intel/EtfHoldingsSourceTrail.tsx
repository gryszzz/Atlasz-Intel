/*
 * ETF holdings source-trail card.
 *
 * Shows dated issuer-published ETF holdings snapshots from official public files.
 * It never presents holdings as live/current positions and never recommends,
 * ranks, predicts, or infers weights.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import { groupEtfHoldingsByFund } from './etfHoldingTrailSelect'
import type { EtfHolding, WorldIntelEvent } from '../../worldIntel'
import './EtfHoldingsSourceTrail.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'

export function EtfHoldingsSourceTrail({
  events,
  limit = 24,
  now,
}: {
  events: WorldIntelEvent[]
  limit?: number
  now: number
}) {
  const grouped = groupEtfHoldingsByFund(events, limit, now)
  const funds = [...grouped.entries()]
  return (
    <section className="etf-trail">
      <header className="etf-trail-head">
        <span>ETF Holdings · Basket Exposure</span>
        <strong>{funds.length > 0 ? `${funds.length} snapshots` : UNAVAILABLE}</strong>
      </header>
      <p className="etf-trail-note">
        Issuer-published holdings snapshots. As-of dates and stale state are explicit; weight is shown only when
        source-provided. Not a current-position guarantee, recommendation, price signal, or trading advice.
      </p>
      {funds.length > 0 ? (
        <div className="etf-trail-stack">
          {funds.map(([key, holdings]) => (
            <FundHoldings key={key} holdings={holdings} now={now} />
          ))}
        </div>
      ) : (
        <div className="etf-trail-empty">
          <strong>{UNAVAILABLE}</strong>
          <p>
            No official issuer ETF holdings rows are available. The connector may be disabled, source files may be
            unavailable/rate-limited, or rows may be missing required proof fields. Atlasz does not fabricate ETF
            constituents or weights.
          </p>
        </div>
      )}
    </section>
  )
}

function FundHoldings({ holdings, now }: { holdings: EtfHolding[]; now: number }) {
  const first = holdings[0]
  if (!first) return null
  return (
    <article className="etf-fund">
      <div className="etf-fund-head">
        <strong>{first.fundTicker}</strong>
        <span>{first.fundName}</span>
        <ProvenanceBadge value={first.provenance} size="sm" />
        <code>{first.issuer}</code>
        <span>as of {first.sourceDate}</span>
        <FreshnessBadge size="sm" now={now} retrievedAt={first.retrievedAt} staleAt={first.staleAt} />
        <span>stale after {formatIso(first.staleAt)}</span>
        <span>retrievedAt {formatIso(first.retrievedAt)}</span>
      </div>
      <table className="etf-holdings">
        <thead>
          <tr>
            <th scope="col">Holding</th>
            <th scope="col">Ticker</th>
            <th scope="col">Identifier</th>
            <th scope="col">Weight</th>
            <th scope="col">Shares</th>
            <th scope="col">Market Value</th>
            <th scope="col">Currency</th>
            <th scope="col">Hash</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <tr key={holding.id}>
              <th scope="row">
                {holding.holdingName}
                {holding.assetClass && <span className="etf-asset-class"> · {holding.assetClass}</span>}
              </th>
              <td>{holding.holdingTicker || 'unresolved'}</td>
              <td>{formatIdentifiers(holding)}</td>
              <td className="etf-num">{holding.weight !== undefined ? `${holding.weight.toFixed(3)}%` : '—'}</td>
              <td className="etf-num">{holding.shares !== undefined ? holding.shares.toLocaleString('en-US') : '—'}</td>
              <td className="etf-num">{holding.marketValue !== undefined ? formatMarketValue(holding.marketValue, holding.currency) : '—'}</td>
              <td>{holding.currency || '—'}</td>
              <td className="etf-hash">{holding.rawPayloadHash.slice(0, 10)}…</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="etf-links">
        <a href={first.sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} />
          issuer holdings file
        </a>
        <span>{first.sourceName}</span>
      </div>
    </article>
  )
}

function formatIdentifiers(holding: EtfHolding): string {
  const parts = [
    holding.cusip ? `CUSIP: ${holding.cusip}` : '',
    holding.isin ? `ISIN: ${holding.isin}` : '',
    holding.sedol ? `SEDOL: ${holding.sedol}` : '',
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '—'
}

function formatIso(value: number): string {
  return Number.isFinite(value) ? new Date(value).toISOString() : 'unavailable'
}

function formatMarketValue(value: number, currency?: string): string {
  const suffix = currency ? ` ${currency}` : ''
  if (currency === 'USD') return `${formatCompactMoney(value, '$')}${suffix}`
  return `${formatCompactMoney(value)}${suffix}`
}

function formatCompactMoney(value: number, symbol = ''): string {
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${symbol}${(value / 1e3).toFixed(1)}K`
  return `${symbol}${value.toLocaleString('en-US')}`
}
