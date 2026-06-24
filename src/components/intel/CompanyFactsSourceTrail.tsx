/*
 * SEC Company Facts source-trail card + dossier "Reported Facts" view.
 *
 * Renders SEC-reported XBRL facts (events carrying a `companyFact`), grouped by
 * company identity. Each fact shows concept, value+unit, period, form, filed date,
 * accession, change status, payload hash, and a stale flag. Historical reported
 * facts only — never an estimate or valuation. Empty input shows DATA_UNAVAILABLE.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { groupCompanyFactsByTicker, isCompanyFactStale } from './companyFactsTrailSelect'
import type { SecCompanyFact, WorldIntelEvent } from '../../worldIntel'
import './CompanyFactsSourceTrail.css'

const FACTS_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function CompanyFactsSourceTrail({ events, limit = 24, now }: { events: WorldIntelEvent[]; limit?: number; now: number }) {
  const grouped = groupCompanyFactsByTicker(events, limit)
  const companies = [...grouped.entries()]
  return (
    <section className="cf-trail">
      <header className="cf-trail-head">
        <span>SEC Company Facts · Reported Facts</span>
        <strong>{companies.length > 0 ? `${companies.length} companies` : FACTS_UNAVAILABLE}</strong>
      </header>
      <p className="cf-trail-note">Historical SEC-reported fact, not estimate or valuation.</p>
      {companies.length > 0 ? (
        <div className="cf-trail-stack">
          {companies.map(([ticker, facts]) => (
            <article key={ticker} className="cf-company">
              <div className="cf-company-head">
                <strong>{ticker}</strong>
                <span>{facts[0]?.companyName}</span>
                <ProvenanceBadge value={facts[0]?.provenance ?? 'public-disclosure'} size="sm" />
                <code>CIK {facts[0]?.cikPadded}</code>
                <span className="cf-retrieved">retrieved {new Date(facts[0]?.retrievedAt ?? now).toISOString().slice(0, 10)}</span>
              </div>
              <table className="cf-facts">
                <thead>
                  <tr>
                    <th scope="col">Concept</th>
                    <th scope="col">Value</th>
                    <th scope="col">Period</th>
                    <th scope="col">Form</th>
                    <th scope="col">Filed</th>
                    <th scope="col">Status</th>
                    <th scope="col">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {facts.map((fact) => (
                    <tr key={fact.id} className={isCompanyFactStale(fact, now) ? 'cf-stale' : undefined}>
                      <th scope="row">{fact.conceptLabel} <span className="cf-unit">({fact.unit})</span></th>
                      <td className="cf-value">{formatValue(fact.value, fact.unit)}</td>
                      <td>{fact.periodEnd}{fact.frame ? ` · ${fact.frame}` : ''}</td>
                      <td>{fact.form}{fact.fiscalYear ? ` · ${fact.fiscalPeriod ?? ''} FY${fact.fiscalYear}` : ''}</td>
                      <td>{fact.filedDate}</td>
                      <td className="cf-change">{fact.changeType.replace('_', ' ')}{isCompanyFactStale(fact, now) ? ' · stale' : ''}</td>
                      <td className="cf-hash">{fact.rawPayloadHash.slice(0, 10)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="cf-links">
                <a href={facts[0]?.sourceUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  SEC companyfacts (XBRL)
                </a>
                {facts[0]?.accessionNumber && <span className="cf-accn">accn {facts[0].accessionNumber}</span>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="cf-trail-empty">
          <strong>{FACTS_UNAVAILABLE}</strong>
          <p>No SEC Company Facts available. The companyfacts API is missing its User-Agent, returned nothing, failed, or hit rate limits. Nothing is fabricated.</p>
        </div>
      )}
    </section>
  )
}

function formatValue(value: number, unit: string): string {
  if (unit === 'USD') {
    const abs = Math.abs(value)
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return `$${value.toLocaleString('en-US')}`
  }
  if (unit === 'shares') return `${(value / 1e9).toFixed(2)}B sh`
  return `${value.toLocaleString('en-US')} ${unit}`
}

export type { SecCompanyFact }
