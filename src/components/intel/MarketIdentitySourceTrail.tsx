/*
 * Market Reference Master source-trail cards.
 *
 * Renders only SEC company_tickers.json identities with complete proof fields.
 * This card is deliberately narrow: ticker, CIK, and legal title only. Exchange,
 * sector, and industry are shown as unavailable unless source-backed later.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { filterRenderableMarketIdentities, selectRenderableMarketIdentities } from './marketIdentityTrailSelect'
import type { MarketIdentity, WorldIntelEvent } from '../../worldIntel'
import './MarketIdentitySourceTrail.css'

export function MarketIdentitySourceTrail({
  events,
  identities: persistedIdentities,
  limit = 8,
  now,
}: {
  events: WorldIntelEvent[]
  identities?: MarketIdentity[]
  limit?: number
  now?: number
}) {
  const effectiveNow = now ?? 0
  const identities = persistedIdentities
    ? filterRenderableMarketIdentities(persistedIdentities, limit)
    : selectRenderableMarketIdentities(events, limit)
  return (
    <section className="market-identity-trail">
      <header className="market-identity-head">
        <span>Market Reference Master</span>
        <strong>{identities.length > 0 ? `${identities.length} identities` : 'DATA_UNAVAILABLE'}</strong>
      </header>
      <p className="market-identity-boundary">
        SEC company_tickers.json resolves ticker, CIK, and legal title only. Exchange, sector, industry, ETF
        weights, prices, and exposure are unavailable unless another source proves them.
      </p>

      {identities.length > 0 ? (
        <div className="market-identity-stack">
          {identities.map((identity) => {
            const stale = effectiveNow > identity.staleAt
            return (
              <article key={identity.id} className="market-identity-row">
                <div className="market-identity-row-head">
                  <strong>{identity.ticker}</strong>
                  <ProvenanceBadge value={identity.provenance} size="sm" />
                  <span className={stale ? 'identity-state stale' : 'identity-state fresh'}>
                    {stale ? 'stale-cache' : 'fresh reference'}
                  </span>
                  <span>{identity.confidence}%</span>
                </div>
                <p>{identity.legalName}</p>
                <dl className="market-identity-meta">
                  <div>
                    <dt>CIK</dt>
                    <dd>{identity.cik}</dd>
                  </div>
                  <div>
                    <dt>Padded CIK</dt>
                    <dd>{identity.cikPadded}</dd>
                  </div>
                  <div>
                    <dt>Exchange</dt>
                    <dd>{identity.exchange ?? 'DATA_UNAVAILABLE'}</dd>
                  </div>
                  <div>
                    <dt>Sector</dt>
                    <dd>{identity.sector ?? 'DATA_UNAVAILABLE'}</dd>
                  </div>
                  <div>
                    <dt>Retrieved</dt>
                    <dd>{new Date(identity.retrievedAt).toISOString().slice(0, 10)}</dd>
                  </div>
                  <div>
                    <dt>Payload hash</dt>
                    <dd>{identity.rawPayloadHash.slice(0, 12)}...</dd>
                  </div>
                </dl>
                <div className="market-identity-links">
                  <a href={identity.sourceUrl} target="_blank" rel="noreferrer">
                    <Link2 size={12} />
                    SEC company_tickers.json
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="market-identity-empty">
          <strong>DATA_UNAVAILABLE</strong>
          <p>No source-backed market identities are available in this window. Atlasz does not invent tickers.</p>
        </div>
      )}
    </section>
  )
}
