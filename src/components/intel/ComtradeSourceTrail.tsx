/*
 * UN Comtrade trade-flow source-trail cards.
 *
 * Renders normalized trade records (events carrying a `comtradeRecord`): reporter,
 * partner, commodity, flow, period, trade value, change status, payload hash, and
 * the key-free API URL. Country/partner/commodity trade-flow evidence only — never
 * a company-level claim. Empty input shows DATA_UNAVAILABLE; nothing is fabricated.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableComtradeRecords } from './comtradeTrailSelect'
import type { WorldIntelEvent } from '../../worldIntel'
import './ComtradeSourceTrail.css'

const COMTRADE_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function ComtradeSourceTrail({ events, limit = 8 }: { events: WorldIntelEvent[]; limit?: number }) {
  const records = selectRenderableComtradeRecords(events, limit)
  return (
    <section className="comtrade-trail">
      <header className="comtrade-trail-head">
        <span>UN Comtrade</span>
        <strong>{records.length > 0 ? `${records.length} trade flows` : COMTRADE_UNAVAILABLE}</strong>
      </header>
      <p className="comtrade-trail-note">Country/commodity trade-flow evidence, not company-level supply-chain proof.</p>
      {records.length > 0 && <CoverageStrip records={records} />}
      {records.length > 0 ? (
        <div className="comtrade-trail-stack">
          {records.map((record) => (
            <article key={record.id} className="comtrade-row">
              <div className="comtrade-row-head">
                <strong>{record.flowDesc}</strong>
                <ProvenanceBadge value={record.provenance} size="sm" />
                <span className="comtrade-change">{record.changeType.replace('_', ' ')}</span>
                <span>{record.confidence}%</span>
              </div>
              <p className="comtrade-title">
                {record.reporterDesc} → {record.partnerDesc} · {record.commodityCode} {record.commodityDescription}
              </p>
              <dl className="comtrade-meta">
                <div>
                  <dt>Value</dt>
                  <dd>{formatUsd(record.tradeValue)}</dd>
                </div>
                {record.quantity !== undefined && record.quantityUnit && (
                  <div>
                    <dt>Quantity</dt>
                    <dd>{record.quantity} {record.quantityUnit}</dd>
                  </div>
                )}
                <div>
                  <dt>Period</dt>
                  <dd>{record.period}</dd>
                </div>
                <div>
                  <dt>Classification</dt>
                  <dd>{record.classification}</dd>
                </div>
                <div>
                  <dt>Dataset</dt>
                  <dd>{record.datasetCode}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{record.sourceName}</dd>
                </div>
                <div>
                  <dt>Retrieved</dt>
                  <dd>{new Date(record.retrievedAt).toISOString().slice(0, 10)}</dd>
                </div>
                <div>
                  <dt>Payload hash</dt>
                  <dd>{record.rawPayloadHash.slice(0, 12)}…</dd>
                </div>
                {record.catalogHash && (
                  <div>
                    <dt>Catalog hash</dt>
                    <dd>{record.catalogHash.slice(0, 12)}…</dd>
                  </div>
                )}
              </dl>
              <div className="comtrade-links">
                <a href={record.sourceUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  UN Comtrade
                </a>
                <a href={record.sourceApiUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  API query (key-free)
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="comtrade-trail-empty">
          <strong>{COMTRADE_UNAVAILABLE}</strong>
          <p>No UN Comtrade trade flows available. The official API is missing its key, returned nothing, failed, or hit quota/rate limits. Nothing is fabricated.</p>
        </div>
      )}
    </section>
  )
}

/** Catalog-coverage / query-scope summary derived from the records actually pulled. */
function CoverageStrip({ records }: { records: ComtradeRecordList }) {
  const reporters = new Set(records.map((r) => r.reporterDesc))
  const partners = new Set(records.map((r) => r.partnerDesc))
  const commodities = new Set(records.map((r) => r.commodityCode))
  const periods = new Set(records.map((r) => r.period))
  const classifications = new Set(records.map((r) => r.classification))
  return (
    <dl className="comtrade-coverage" aria-label="Query scope and catalog coverage">
      <div><dt>Reporters</dt><dd>{reporters.size}</dd></div>
      <div><dt>Partners</dt><dd>{partners.size}</dd></div>
      <div><dt>Commodities</dt><dd>{commodities.size}</dd></div>
      <div><dt>Periods</dt><dd>{[...periods].sort().join(', ')}</dd></div>
      <div><dt>Classification</dt><dd>{[...classifications].join(', ')}</dd></div>
    </dl>
  )
}

type ComtradeRecordList = ReturnType<typeof selectRenderableComtradeRecords>

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}
