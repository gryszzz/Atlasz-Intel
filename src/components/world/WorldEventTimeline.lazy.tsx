/*
 * Event stream / timeline (lazy). Provenance badges preserved per event.
 */
import { useMemo, useState } from 'react'
import { Link2, Radar, Star } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { EventResolutionPanel } from '../intel/EventResolutionPanel'
import { filterEventsByResolution, isEventResolvable, type ResolutionFilterMode } from '../../engine/entityResolver'
import {
  explainTopMatches,
  relevanceChipLabel,
  type RankedWorldwatchEvent,
  type WorldwatchProfile,
} from '../../engine/worldwatchProfiles'
import type { UserFavorite, WorldIntelEvent } from '../../worldIntel'
import { WorldPanelHeader } from './WorldPanelHeader'

export function WorldEventTimeline({
  events,
  favoriteIds,
  now,
  sourceTrust,
  activeProfile,
  relevanceByEvent,
  onToggleFavorite,
  onSelectEvent,
  onSelectTicker,
}: {
  events: WorldIntelEvent[]
  favoriteIds: Set<string>
  now: number
  sourceTrust: string
  activeProfile?: WorldwatchProfile
  relevanceByEvent?: Map<string, RankedWorldwatchEvent>
  onToggleFavorite: (kind: UserFavorite['kind'], targetId: string, label: string) => Promise<void>
  onSelectEvent: (eventId: string) => void
  onSelectTicker: (ticker: string) => void
}) {
  const [resolutionFilter, setResolutionFilter] = useState<ResolutionFilterMode>('all')
  const visibleEvents = useMemo(() => filterEventsByResolution(events, resolutionFilter), [events, resolutionFilter])

  return (
    <article className="world-panel world-events-panel">
      <WorldPanelHeader icon={Radar} label="Event Stream" value={sourceTrust} />
      <div className="event-resolution-filter">
        {(['all', 'linked', 'unlinked'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={resolutionFilter === mode ? 'event-filter-btn active' : 'event-filter-btn'}
            onClick={() => setResolutionFilter(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="world-event-stack">
        {visibleEvents.map((event) => (
          <WorldEventCard
            event={event}
            favorite={favoriteIds.has(event.id)}
            key={event.id}
            now={now}
            profile={activeProfile}
            relevance={relevanceByEvent?.get(event.id)}
            onFavorite={() => onToggleFavorite('event', event.id, event.title)}
            onSelectEvent={onSelectEvent}
            onSelectTicker={onSelectTicker}
          />
        ))}
        {visibleEvents.length === 0 && (
          <div className="world-empty inline-empty">
            <p>
              {events.length === 0
                ? 'Not available from current public sources. Atlasz is not substituting seeded world events.'
                : 'No events match this resolution filter.'}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}

function WorldEventCard({
  event,
  favorite,
  now,
  profile,
  relevance,
  onFavorite,
  onSelectEvent,
  onSelectTicker,
}: {
  event: WorldIntelEvent
  favorite: boolean
  now: number
  profile?: WorldwatchProfile
  relevance?: RankedWorldwatchEvent
  onFavorite: () => Promise<void>
  onSelectEvent: (eventId: string) => void
  onSelectTicker: (ticker: string) => void
}) {
  return (
    <article className={`world-event-card world-severity-${event.severity}`}>
      <header>
        <span>{event.severity}</span>
        <time>{formatAge(event.timestamp, now)}</time>
        <ProvenanceBadge value={event.provenance} size="sm" />
        {isEventResolvable(event) && (
          <span className="event-linked-chip" title="Resolves to a curated seed entity (structural exposure available)">
            linked
          </span>
        )}
        <button className={favorite ? 'favorite-button active' : 'favorite-button'} type="button" onClick={() => void onFavorite()}>
          <Star size={13} />
        </button>
      </header>
      {profile && relevance && (
        <div className="world-relevance-row" title={explainTopMatches(relevance.matches, 4)}>
          <span>Relevant to your watchlist</span>
          <strong>{profile.name}</strong>
          <em>{relevanceChipLabel(relevance)}</em>
        </div>
      )}
      {profile && relevance && relevance.matches.length > 0 && (
        <div className="world-relevance-explain">
          {relevance.matches.slice(0, 2).map((match) => (
            <span key={`${match.kind}:${match.label}`}>{match.explanation}</span>
          ))}
        </div>
      )}
      <button className="world-event-title" type="button" onClick={() => onSelectEvent(event.id)}>
        {event.title}
      </button>
      <p>{event.summary}</p>
      <div className="world-chip-row">
        {event.countryCodes.map((code) => (
          <span key={code}>{code}</span>
        ))}
        {event.narrativeTags.slice(0, 4).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="world-market-row">
        {event.affectedAssets.slice(0, 8).map((asset) => (
          <button key={asset} type="button" onClick={() => onSelectTicker(asset)}>
            {asset}
          </button>
        ))}
      </div>
      {event.sourceUrl && (
        <a href={event.sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} />
          source trail
        </a>
      )}
      {/* Live provenance (badge above) vs. curated structural exposure (below),
          with the resolver explaining the bridge. Only shows when it resolves. */}
      <EventResolutionPanel event={event} hideWhenUnresolved />
    </article>
  )
}

function formatAge(timestamp: number, now: number): string {
  const minutes = Math.max(0, Math.round((now - timestamp) / 60_000))
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.round(minutes / 60)
  if (hours < 48) {
    return `${hours}h`
  }
  return `${Math.round(hours / 24)}d`
}
