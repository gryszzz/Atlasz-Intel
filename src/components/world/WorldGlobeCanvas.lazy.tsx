/*
 * Live world map canvas (lazy). Isolated so any future heavy globe/WebGL
 * library added here loads only when the World Intelligence view is open.
 */
import { Globe2, WifiOff } from 'lucide-react'
import { PROVENANCE_LABEL } from '../../provenance'
import type { WorldIntelEvent } from '../../worldIntel'
import { WorldPanelHeader } from './WorldPanelHeader'

export type WorldWindow = { id: string; label: string; durationMs: number }

export function WorldGlobeCanvas({
  events,
  windows,
  windowId,
  onWindowChange,
  onSelectEvent,
}: {
  events: WorldIntelEvent[]
  windows: WorldWindow[]
  windowId: string
  onWindowChange: (id: string) => void
  onSelectEvent: (eventId: string) => void
}) {
  return (
    <article className="world-panel world-map-panel">
      <WorldPanelHeader icon={Globe2} label="Global Live Map" value={`${events.length} events`} />
      <div className="world-time-row">
        {windows.map((windowItem) => (
          <button
            className={windowItem.id === windowId ? 'active' : ''}
            key={windowItem.id}
            type="button"
            onClick={() => onWindowChange(windowItem.id)}
          >
            {windowItem.label}
          </button>
        ))}
      </div>
      <div className="atlasz-world-map" aria-label="World intelligence map">
        <span className="map-grid-line map-equator" />
        <span className="map-grid-line map-meridian" />
        <span className="map-region-label americas">Americas</span>
        <span className="map-region-label emea">EMEA</span>
        <span className="map-region-label apac">APAC</span>
        {events.map((event) => (
          <button
            className={`world-marker world-marker-${event.severity}`}
            key={event.id}
            style={markerPosition(event)}
            type="button"
            onClick={() => onSelectEvent(event.id)}
          >
            <span />
            <strong>{event.region}</strong>
            <em>{provenanceLabel(event.provenance)}</em>
          </button>
        ))}
        {events.length === 0 && (
          <div className="world-empty">
            <WifiOff size={20} />
            <p>No world events in this window from current public sources.</p>
          </div>
        )}
      </div>
    </article>
  )
}

function markerPosition(event: WorldIntelEvent): { left: string; top: string } {
  const lon = event.lon ?? 0
  const lat = event.lat ?? 10
  return {
    left: `${Math.min(94, Math.max(6, ((lon + 180) / 360) * 100))}%`,
    top: `${Math.min(88, Math.max(12, ((90 - lat) / 180) * 100))}%`,
  }
}

function provenanceLabel(value: string): string {
  return PROVENANCE_LABEL[value as keyof typeof PROVENANCE_LABEL] ?? value
}
