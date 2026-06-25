/*
 * Options source-trail card (key-gated options chain / open interest).
 *
 * Renders ONLY real, source-backed option contracts (proof-gated): last trade/
 * quote, IV, and open interest WHEN the source provides it. No "flow"/"unusual
 * activity" inference, no trading advice, prediction, or signal score. Missing/
 * unconfigured -> OPTION_DATA_UNAVAILABLE (never a fabricated chain).
 */
import { useState } from 'react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { isOptionStale, isRenderableOption, OPTION_DATA_UNAVAILABLE, type OptionsContract } from '../../optionsData'
import './EiaFacilitySourceTrail.css'

export function OptionsSourceTrail({ contracts = [], now }: { contracts?: OptionsContract[]; now?: number }) {
  const [fallbackNow] = useState(() => Date.now())
  const renderNow = now ?? fallbackNow
  const renderable = contracts.filter(isRenderableOption).slice(0, 50)
  const first = renderable[0]
  return (
    <section className="eia-fac-trail world-panel">
      <header className="eia-fac-head">
        <span>Options · Key-Gated Chain / Open Interest Source Trail</span>
        <strong>{renderable.length > 0 ? `${renderable.length} contracts` : OPTION_DATA_UNAVAILABLE}</strong>
      </header>
      <p className="eia-fac-note">
        Real key-gated option contracts only (Alpaca). Open interest shown only when the source provides it. No flow /
        unusual-activity inference, not trading advice, a prediction, or a signal score.
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
                <th scope="col">Contract</th>
                <th scope="col">Type</th>
                <th scope="col">Strike</th>
                <th scope="col">Expiry</th>
                <th scope="col">Last</th>
                <th scope="col">OI</th>
                <th scope="col">IV</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              {renderable.map((c) => (
                <tr key={c.id}>
                  <th scope="row">{c.underlying}</th>
                  <td>{c.optionType}</td>
                  <td className="eia-num">{c.strike}</td>
                  <td>{c.expiration}</td>
                  <td className="eia-num">{c.lastPrice !== undefined ? c.lastPrice : '—'}</td>
                  <td className="eia-num">{c.openInterest !== undefined ? c.openInterest.toLocaleString('en-US') : 'unavailable'}</td>
                  <td className="eia-num">{c.impliedVolatility !== undefined ? c.impliedVolatility.toFixed(3) : '—'}</td>
                  <td><span className={isOptionStale(c, renderNow) ? 'eia-stale' : 'eia-fresh'}>{isOptionStale(c, renderNow) ? 'stale' : 'fresh'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ) : (
        <div className="eia-fac-empty">
          <strong>{OPTION_DATA_UNAVAILABLE}</strong>
          <p>
            No real options data is available. This provider is key-gated and fail-closed: configure
            ATLASZ_ALPACA_API_KEY + ATLASZ_ALPACA_SECRET_KEY and ATLASZ_OPTIONS_UNDERLYINGS. Atlasz never shows a
            fabricated options chain, open interest, or flow.
          </p>
        </div>
      )}
    </section>
  )
}
