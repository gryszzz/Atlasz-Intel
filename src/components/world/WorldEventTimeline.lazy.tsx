/*
 * Event stream / timeline (lazy). Provenance badges preserved per event.
 */
import { Link2, Radar, Star } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import type { UserFavorite, WorldIntelEvent } from '../../worldIntel'
import { WorldPanelHeader } from './WorldPanelHeader'

export function WorldEventTimeline({
  events,
  favoriteIds,
  now,
  sourceTrust,
  onToggleFavorite,
  onSelectEvent,
  onSelectTicker,
}: {
  events: WorldIntelEvent[]
  favoriteIds: Set<string>
  now: number
  sourceTrust: string
  onToggleFavorite: (kind: UserFavorite['kind'], targetId: string, label: string) => Promise<void>
  onSelectEvent: (eventId: string) => void
  onSelectTicker: (ticker: string) => void
}) {
  return (
    <article className="world-panel world-events-panel">
      <WorldPanelHeader icon={Radar} label="Event Stream" value={sourceTrust} />
      <div className="world-event-stack">
        {events.map((event) => (
          <WorldEventCard
            event={event}
            favorite={favoriteIds.has(event.id)}
            key={event.id}
            now={now}
            onFavorite={() => onToggleFavorite('event', event.id, event.title)}
            onSelectEvent={onSelectEvent}
            onSelectTicker={onSelectTicker}
          />
        ))}
        {events.length === 0 && (
          <div className="world-empty inline-empty">
            <p>Not available from current public sources. Atlasz is not substituting seeded world events.</p>
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
  onFavorite,
  onSelectEvent,
  onSelectTicker,
}: {
  event: WorldIntelEvent
  favorite: boolean
  now: number
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
        <button className={favorite ? 'favorite-button active' : 'favorite-button'} type="button" onClick={() => void onFavorite()}>
          <Star size={13} />
        </button>
      </header>
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
