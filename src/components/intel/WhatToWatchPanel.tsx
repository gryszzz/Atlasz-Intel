/*
 * "What To Watch Next" panel — the forward end of the intelligence chain.
 *
 * For recent real changes, shows: what changed -> what proves it -> entities
 * touched -> systems connected (curated) -> what to watch for confirmation ->
 * unknowns -> what it does NOT prove. Every watch item is a labeled inference-
 * rule (confirmation-seeking), never a prediction. No real change -> empty state.
 */
import { useMemo } from 'react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { synthesizeBriefs, type IntelligenceBrief } from '../../engine/watchSynthesis'
import type { WorldIntelEvent } from '../../worldIntel'
import './MarketCoverageDashboard.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'

export function WhatToWatchPanel({ events, now, limit = 10 }: { events: WorldIntelEvent[]; now?: number; limit?: number }) {
  const briefs = useMemo(
    () => synthesizeBriefs(events, { now, limit: limit * 3 }).filter((b) => b.watchNext.length > 0 || b.systemsConnected.length > 0).slice(0, limit),
    [events, now, limit],
  )
  return (
    <section className="cov-dash world-panel">
      <header className="cov-head">
        <div>
          <span className="cov-eyebrow">Intelligence Synthesis</span>
          <h2>What To Watch Next</h2>
        </div>
        <p className="cov-sub">Confirmation-seeking, not prediction. Every watch item is a labeled rule that traces to evidence, structure, or the unknown.</p>
      </header>
      {briefs.length > 0 ? (
        <div className="cov-sections">
          {briefs.map((brief) => (
            <BriefCard key={brief.eventId} brief={brief} />
          ))}
        </div>
      ) : (
        <div className="cov-section cov-tone-static">
          <div className="cov-section-head">
            <strong>{UNAVAILABLE}</strong>
            <span>0</span>
          </div>
          <p className="cov-sub" style={{ padding: '8px 10px' }}>
            No recent source-backed change has resolvable entities or confirmation cues yet. Atlasz does not invent
            next-effects.
          </p>
        </div>
      )}
    </section>
  )
}

function BriefCard({ brief }: { brief: IntelligenceBrief }) {
  return (
    <div className="cov-section cov-tone-periodic">
      <div className="cov-section-head">
        <strong>{brief.whatChanged.slice(0, 140)}</strong>
        <span>{brief.proof.source}</span>
      </div>
      <div className="cov-row">
        <div className="cov-row-main">
          <ProvenanceBadge value={brief.proof.provenance} size="sm" />
          <span className="cov-cadence">{brief.proof.freshness}</span>
          {brief.proof.sourceBacked ? <span className="cov-rel cov-rel-low">source-backed</span> : <span className="cov-rel cov-rel-high">unconfirmed</span>}
          {brief.proof.payloadHash ? <span className="cov-conn">#{brief.proof.payloadHash.slice(0, 8)}</span> : null}
        </div>

        {brief.entitiesTouched.length > 0 && (
          <div className="cov-row-detail">
            <span className="cov-note">touches: {brief.entitiesTouched.slice(0, 8).map((e) => e.label).join(', ')}</span>
          </div>
        )}
        {brief.systemsConnected.length > 0 && (
          <div className="cov-row-detail">
            <span className="cov-note">connects (curated): {brief.systemsConnected.slice(0, 8).map((e) => e.label).join(', ')}</span>
          </div>
        )}

        <ul className="cov-list" style={{ marginTop: 4 }}>
          {brief.watchNext.map((w) => (
            <li className="cov-row" key={w.id}>
              <div className="cov-row-main">
                <span className="cov-row-label">→ {w.label}</span>
                <span className="cov-cadence">{w.basis}</span>
              </div>
              <div className="cov-row-detail">
                <span className="cov-note">{w.rationale}</span>
              </div>
            </li>
          ))}
        </ul>

        {brief.unknowns.length > 0 && (
          <div className="cov-row-detail">
            <em className="cov-missing">unknown: {brief.unknowns.slice(0, 5).join('; ')}</em>
          </div>
        )}
        <div className="cov-row-detail">
          <span className="cov-note">does not prove: {brief.doesNotProve.join(' · ')}</span>
        </div>
      </div>
    </div>
  )
}
