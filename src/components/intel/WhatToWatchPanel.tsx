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
import type { BriefConfidence, CorroborationSummary } from '../../engine/watchSynthesis'
import {
  explainTopMatches,
  relevanceChipLabel,
  relevantEventsForProfile,
  type RankedWorldwatchEvent,
  type WorldwatchProfile,
} from '../../engine/worldwatchProfiles'
import type { WorldIntelEvent } from '../../worldIntel'
import './MarketCoverageDashboard.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'

export function WhatToWatchPanel({
  events,
  now,
  limit = 10,
  profile,
  relevanceByEvent,
}: {
  events: WorldIntelEvent[]
  now?: number
  limit?: number
  profile?: WorldwatchProfile
  relevanceByEvent?: Map<string, RankedWorldwatchEvent>
}) {
  const rankedEvents = useMemo(
    () => (profile ? relevantEventsForProfile(events, profile, { now, limit: events.length }) : []),
    [events, now, profile],
  )
  const profileEvents = profile ? rankedEvents.map((ranked) => ranked.event) : events
  const localRelevanceByEvent = useMemo(
    () => relevanceByEvent ?? new Map(rankedEvents.map((ranked) => [ranked.event.id, ranked] as const)),
    [rankedEvents, relevanceByEvent],
  )
  const briefs = useMemo(
    () => synthesizeBriefs(profileEvents, { now, limit: limit * 3 }).filter((b) => b.watchNext.length > 0 || b.systemsConnected.length > 0).slice(0, limit),
    [profileEvents, now, limit],
  )
  return (
    <section className="cov-dash world-panel">
      <header className="cov-head">
        <div>
          <span className="cov-eyebrow">Intelligence Synthesis</span>
          <h2>What To Watch Next</h2>
        </div>
        <p className="cov-sub">
          {profile
            ? `Filtered by ${profile.name}. Confirmation-seeking, not prediction; proof and confidence stay source-bound.`
            : 'Confirmation-seeking, not prediction. Every watch item traces to evidence, structure, or the unknown.'}
        </p>
      </header>
      {briefs.length > 0 ? (
        <div className="cov-sections">
          {briefs.map((brief) => (
            <BriefCard
              key={brief.eventId}
              brief={brief}
              profile={profile}
              relevance={localRelevanceByEvent.get(brief.eventId)}
            />
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

function corroborationLabel(brief: IntelligenceBrief): string {
  const c = brief.corroboration
  if (c.independentSourceCount >= 2) return `corroborated ×${c.independentSourceCount}`
  if (c.independentSourceCount === 1 && c.mediaSourceCount > 0) return 'single source + media'
  if (c.independentSourceCount === 1) return 'single source'
  if (c.mediaSourceCount > 0) return 'media-only'
  return 'uncorroborated'
}

function corroborationTone(effect: CorroborationSummary['confidenceEffect']): string {
  if (effect === 'raises') return 'cov-rel cov-rel-low'
  if (effect === 'limits') return 'cov-rel cov-rel-high'
  return 'cov-rel cov-rel-medium'
}

/** Freshness-weighted confidence chip: high weight reads positive, low reads attention, no signal reads unknown. */
function ConfidenceChip({ confidence }: { confidence: BriefConfidence }) {
  const pct = confidence.weight === undefined ? 'unknown' : `${Math.round(confidence.weight * 100)}%`
  const tone = confidence.weight === undefined ? 'cov-rel-medium' : confidence.weight >= 0.65 ? 'cov-rel-low' : 'cov-rel-high'
  return (
    <span className={`cov-rel ${tone}`} title={confidence.note}>
      conf {pct} · {confidence.freshness}
    </span>
  )
}

function BriefCard({
  brief,
  profile,
  relevance,
}: {
  brief: IntelligenceBrief
  profile?: WorldwatchProfile
  relevance?: RankedWorldwatchEvent
}) {
  return (
    <div className="cov-section cov-tone-periodic">
      <div className="cov-section-head">
        <strong>{brief.whatChanged.slice(0, 140)}</strong>
        <span>{brief.proof.source}</span>
      </div>
      <div className="cov-row">
        <div className="cov-row-main">
          <ProvenanceBadge value={brief.proof.provenance} size="sm" />
          <ConfidenceChip confidence={brief.confidence} />
          {brief.proof.sourceBacked ? <span className="cov-rel cov-rel-low">source-backed</span> : <span className="cov-rel cov-rel-high">unconfirmed</span>}
          {brief.proof.payloadHash ? <span className="cov-conn">#{brief.proof.payloadHash.slice(0, 8)}</span> : null}
          <span className={corroborationTone(brief.corroboration.confidenceEffect)}>{corroborationLabel(brief)}</span>
          {profile && relevance ? (
            <span className="cov-rel cov-rel-low" title={explainTopMatches(relevance.matches, 4)}>
              Relevant to your watchlist · {relevanceChipLabel(relevance)}
            </span>
          ) : null}
        </div>

        <div className="cov-row-detail">
          <span className="cov-note">{brief.corroboration.caveat}</span>
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

        {brief.conflicts.length > 0 && (
          <div className="cov-row-detail">
            <em className="cov-missing">
              conflicts: {brief.conflicts.map((c) => `${c.subject} [${c.severity} · ${c.resolutionBehavior}]`).join(' · ')}
            </em>
          </div>
        )}

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
