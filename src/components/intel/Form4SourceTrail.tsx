/*
 * SEC Form 4 source-trail card + dossier "Insider Transactions" view.
 *
 * Renders SEC Form 4 non-derivative transactions (events carrying a
 * `form4Transaction`), grouped by issuer identity. Each row shows owner + relationship,
 * transaction code (with its neutral SEC definition), shares, price, acquired/disposed,
 * ownership nature, post-transaction holdings, dates, and payload hash. Source-reported
 * transaction evidence only — never sentiment, valuation, or trading advice.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { groupForm4ByIssuer } from './form4TrailSelect'
import type { WorldIntelEvent } from '../../worldIntel'
import './Form4SourceTrail.css'

const FORM4_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function Form4SourceTrail({ events, limit = 24 }: { events: WorldIntelEvent[]; limit?: number }) {
  const grouped = groupForm4ByIssuer(events, limit)
  const issuers = [...grouped.entries()]
  return (
    <section className="f4-trail">
      <header className="f4-trail-head">
        <span>SEC Form 4 · Insider Transactions</span>
        <strong>{issuers.length > 0 ? `${issuers.length} issuers` : FORM4_UNAVAILABLE}</strong>
      </header>
      <p className="f4-trail-note">Source-reported SEC ownership transaction; not sentiment, valuation, or trading advice.</p>
      {issuers.length > 0 ? (
        <div className="f4-trail-stack">
          {issuers.map(([ticker, txns]) => (
            <article key={ticker} className="f4-issuer">
              <div className="f4-issuer-head">
                <strong>{ticker}</strong>
                <span>{txns[0]?.issuerName}</span>
                <ProvenanceBadge value={txns[0]?.provenance ?? 'public-disclosure'} size="sm" />
                <code>CIK {txns[0]?.issuerCikPadded}</code>
              </div>
              <table className="f4-txns">
                <thead>
                  <tr>
                    <th scope="col">Owner</th>
                    <th scope="col">Code</th>
                    <th scope="col">Shares</th>
                    <th scope="col">Price</th>
                    <th scope="col">A/D</th>
                    <th scope="col">Nature</th>
                    <th scope="col">Txn date</th>
                    <th scope="col">Filed</th>
                    <th scope="col">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((txn) => (
                    <tr key={txn.id}>
                      <th scope="row">
                        {txn.ownerName}
                        {txn.ownerRelationship && <span className="f4-rel"> · {txn.ownerRelationship}</span>}
                      </th>
                      <td title={txn.transactionCodeLabel}>{txn.transactionCode}</td>
                      <td className="f4-num">{txn.transactionShares?.toLocaleString('en-US') ?? '—'}</td>
                      <td className="f4-num">{txn.transactionPricePerShare !== undefined ? `$${txn.transactionPricePerShare}` : '—'}</td>
                      <td>{txn.acquiredDisposedCode || '—'}</td>
                      <td>{txn.ownershipNature || '—'}</td>
                      <td>{txn.transactionDate}</td>
                      <td>{txn.filingDate}</td>
                      <td className="f4-hash">{txn.rawPayloadHash.slice(0, 10)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="f4-links">
                <a href={txns[0]?.sourceFilingUrl || txns[0]?.sourceXmlUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  SEC Form 4 filing
                </a>
                {txns[0]?.accessionNumber && <span className="f4-accn">accn {txns[0].accessionNumber}</span>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="f4-trail-empty">
          <strong>{FORM4_UNAVAILABLE}</strong>
          <p>No SEC Form 4 transactions available. The filings API is missing its User-Agent, returned nothing, failed, or hit rate limits. Nothing is fabricated.</p>
        </div>
      )}
    </section>
  )
}
