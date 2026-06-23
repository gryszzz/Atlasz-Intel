/*
 * Resolved Structural Context — the bridge between a live event and the curated
 * exposure graph.
 *
 * For a selected/opened live event, this shows whether Atlasz resolved any of the
 * event's identifiers (ticker / CIK / name / source id) to a canonical seed
 * entity, with the matchType + confidence + reason, then renders the curated
 * structural exposure chains from that seed entity.
 *
 * Honesty boundaries (all enforced visually):
 *  - The live event keeps its own provenance elsewhere; this panel never restates
 *    it and never claims verification.
 *  - The resolver is a rule (`resolver-rule`), not evidence.
 *  - The exposure is `curated-reference`, not verified, not live.
 *  - Unresolved events stay visibly unresolved — no seed exposure is inferred.
 */
import { useMemo } from 'react'
import { eventCandidateIdentifiers, eventStructuralExposure } from '../../engine/entityResolver'
import { SEED_TRUST } from '../../engine/relationshipSeed'
import { ExposureChainList } from './ExposureChainList'
import type { WorldIntelEvent } from '../../worldIntel'
import './EventResolutionPanel.css'

export function EventResolutionPanel({
  event,
  hideWhenUnresolved = false,
}: {
  event: WorldIntelEvent
  /** Inline mode: render nothing when the event resolves to no seed entity. */
  hideWhenUnresolved?: boolean
}) {
  const exposed = useMemo(() => eventStructuralExposure(event), [event])

  if (hideWhenUnresolved && exposed.length === 0) {
    return null
  }

  return (
    <section className="event-resolution">
      <header className="event-resolution-head">
        <span className="event-resolution-label">Resolved Structural Context</span>
        <span className="event-resolution-trust" title="Resolver rule + curated structure — not live evidence, not verified">
          resolver-rule · {SEED_TRUST}
        </span>
      </header>

      {exposed.length > 0 ? (
        exposed.map(({ resolution, exposure }) => (
          <div className="resolved-block" key={resolution.canonicalSeedEntityId}>
            <div className="resolution-trail">
              <div className="resolution-headline">
                <span className="resolution-label">Resolved:</span>
                <span className="resolution-source">{resolution.sourceEntityId}</span>
                <span className="resolution-arrow">→</span>
                <code className="resolution-canonical">{resolution.canonicalSeedEntityId}</code>
              </div>
              <div className="resolution-meta">
                <span>Matched by: {resolution.matchType} {resolution.sourceEntityId}</span>
                <span>{Math.round(resolution.confidence * 100)}% confidence</span>
                <span>Source: {resolution.source}</span>
              </div>
              <small className="resolution-reason">{resolution.reason}</small>
            </div>
            <ExposureChainList exposure={exposure} />
          </div>
        ))
      ) : null}

      {exposed.some(({ resolution }) => resolution.matchType === 'classification') && (
        <small className="resolution-classification-note">
          Technology mapping is rule-based from CPC classification; not verification of curated seed relationships.
        </small>
      )}

      {exposed.length === 0 && (
        <div className="event-resolution-empty">
          <strong>No curated structural match for this live event.</strong>
          <p>Live evidence is still shown, but no seed exposure is inferred.</p>
          <Attempts event={event} />
        </div>
      )}
    </section>
  )
}

/** Transparent resolver trail for the unresolved case: what official ids were checked. */
function Attempts({ event }: { event: WorldIntelEvent }) {
  const identifiers = eventCandidateIdentifiers(event)
  if (identifiers.length === 0) {
    return <small className="resolution-attempts">No official identifiers on this event to resolve.</small>
  }
  return (
    <small className="resolution-attempts">
      Checked: {identifiers.map((id) => `${id.type} ${id.value}`).join(' · ')} — no curated alias rule matched.
    </small>
  )
}
