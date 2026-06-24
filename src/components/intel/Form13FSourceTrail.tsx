/*
 * SEC Form 13F source-trail card + institutional holdings dossier surface.
 *
 * Shows source-reported quarterly holding snapshots from official SEC 13F-HR /
 * 13F-HR/A information tables. The wording is deliberately neutral: a 13F row
 * is delayed disclosure evidence, not a current position, conviction signal,
 * fund-performance claim, valuation, forecast, or trading advice.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { groupForm13FByFiler } from './form13FTrailSelect'
import type { Form13FHolding, WorldIntelEvent } from '../../worldIntel'
import './Form13FSourceTrail.css'

const FORM13F_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function Form13FSourceTrail({ events, limit = 24 }: { events: WorldIntelEvent[]; limit?: number }) {
  const grouped = groupForm13FByFiler(events, limit)
  const filers = [...grouped.entries()]
  return (
    <section className="f13f-trail">
      <header className="f13f-trail-head">
        <span>SEC Form 13F · Institutional Holdings</span>
        <strong>{filers.length > 0 ? `${filers.length} filers` : FORM13F_UNAVAILABLE}</strong>
      </header>
      <p className="f13f-trail-note">
        Quarterly SEC-reported holding snapshot; not current position, conviction, performance, or trading advice.
      </p>
      {filers.length > 0 ? (
        <div className="f13f-trail-stack">
          {filers.map(([key, holdings]) => (
            <FilerHoldings key={key} holdings={holdings} />
          ))}
        </div>
      ) : (
        <div className="f13f-trail-empty">
          <strong>{FORM13F_UNAVAILABLE}</strong>
          <p>
            No SEC Form 13F rows available. The connector is missing its User-Agent, returned no recent information
            table rows, failed, or hit rate limits. Atlasz does not fabricate institutional holdings.
          </p>
        </div>
      )}
    </section>
  )
}

function FilerHoldings({ holdings }: { holdings: Form13FHolding[] }) {
  const first = holdings[0]
  if (!first) return null
  return (
    <article className="f13f-filer">
      <div className="f13f-filer-head">
        <strong>{first.filerName}</strong>
        <ProvenanceBadge value={first.provenance} size="sm" />
        <code>CIK {first.filerCikPadded}</code>
        <span>{first.isAmendment ? '13F-HR/A amendment' : '13F-HR'}</span>
        <span>period {first.reportPeriod || 'DATA_UNAVAILABLE'}</span>
        <span>filed {first.filingDate}</span>
        <span>retrieved {new Date(first.retrievedAt).toISOString().slice(0, 10)}</span>
      </div>
      <table className="f13f-holdings">
        <thead>
          <tr>
            <th scope="col">Issuer</th>
            <th scope="col">CUSIP</th>
            <th scope="col">Class</th>
            <th scope="col">Value</th>
            <th scope="col">Amount</th>
            <th scope="col">Type</th>
            <th scope="col">Put/Call</th>
            <th scope="col">Discretion</th>
            <th scope="col">Voting</th>
            <th scope="col">Hash</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <tr key={holding.id}>
              <th scope="row">
                {holding.issuerName}
                {holding.issuerTicker && <span className="f13f-ticker"> · {holding.issuerTicker}</span>}
                {holding.isAmendment && <span className="f13f-amend"> · amendment</span>}
              </th>
              <td>{holding.cusip}</td>
              <td>{holding.classTitle || '—'}</td>
              <td className="f13f-num">{holding.value.toLocaleString('en-US')}</td>
              <td className="f13f-num">{holding.sharesOrPrincipal?.toLocaleString('en-US') ?? '—'}</td>
              <td>{holding.sharesPrincipalType || '—'}</td>
              <td>{holding.putCall || '—'}</td>
              <td>{holding.investmentDiscretion || '—'}</td>
              <td className="f13f-num">{formatVoting(holding)}</td>
              <td className="f13f-hash">{holding.rawPayloadHash.slice(0, 10)}…</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="f13f-links">
        <a href={first.sourceFilingUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} />
          SEC filing detail
        </a>
        <a href={first.sourceInfoTableUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} />
          information table XML
        </a>
        <span className="f13f-accn">accn {first.accessionNumber}</span>
      </div>
    </article>
  )
}

function formatVoting(holding: Form13FHolding): string {
  const parts = [
    holding.votingSole !== undefined ? `sole ${holding.votingSole.toLocaleString('en-US')}` : '',
    holding.votingShared !== undefined ? `shared ${holding.votingShared.toLocaleString('en-US')}` : '',
    holding.votingNone !== undefined ? `none ${holding.votingNone.toLocaleString('en-US')}` : '',
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : '—'
}
