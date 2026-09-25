import { lazy, Suspense, useMemo, useState } from 'react'
import type { WorldIntelEvent } from '../worldIntel'
import { WorldGlobe } from './WorldGlobe'
import { semanticZoomForAltitude } from './semanticZoom'

const ProofGlobe = lazy(() =>
  import('../components/world/ProofGlobe').then((module) => ({
    default: module.ProofGlobe,
  })),
)

type WorldRendererProps = {
  events: WorldIntelEvent[]
  selectedEventId?: string
  onSelectEvent: (id: string) => void
}

function pointColor(event: WorldIntelEvent) {
  if (event.id === 'selected') return '#edf7f3'
  if (event.severity === 'critical') return '#e37a6c'
  if (event.severity === 'elevated') return '#deb66a'
  if (event.severity === 'watch') return '#75d4be'
  return '#71837d'
}

function pointSize(event: WorldIntelEvent) {
  if (event.severity === 'critical') return 0.38
  if (event.severity === 'elevated') return 0.29
  if (event.severity === 'watch') return 0.23
  return 0.18
}

export function WorldRenderer({
  events,
  selectedEventId,
  onSelectEvent,
}: WorldRendererProps) {
  const [altitude, setAltitude] = useState(2.85)
  const semanticZoom = semanticZoomForAltitude(altitude)

  const points = useMemo(
    () =>
      events
        .filter(
          (event): event is WorldIntelEvent & { lat: number; lon: number } =>
            Number.isFinite(event.lat) && Number.isFinite(event.lon),
        )
        .sort((left, right) => {
          const severity = { critical: 4, elevated: 3, watch: 2, stable: 1 }
          const severityDelta = severity[right.severity] - severity[left.severity]
          if (severityDelta !== 0) return severityDelta
          return right.confidence - left.confidence
        })
        .slice(0, semanticZoom.maxVisibleEntities)
        .map((event) => ({
          id: event.id,
          lat: event.lat,
          lng: event.lon,
          label: [
            event.title,
            event.region,
            event.provenance,
            event.confidence + '% confidence',
          ]
            .filter(Boolean)
            .join(' · '),
          color: event.id === selectedEventId ? '#edf7f3' : pointColor(event),
          size: event.id === selectedEventId ? pointSize(event) * 1.4 : pointSize(event),
          eventId: event.id,
        })),
    [events, selectedEventId, semanticZoom.maxVisibleEntities],
  )

  return (
    <Suspense
      fallback={
        <WorldGlobe
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={onSelectEvent}
        />
      }
    >
      <div className="ysz-world-webgl">
        <ProofGlobe
          points={points}
          arcs={[]}
          onSelectPoint={onSelectEvent}
          onViewChange={(view) => setAltitude(view.altitude)}
        />
        <div className="ysz-semantic-zoom-indicator">
          <span>{semanticZoom.level}</span>
          <small>{semanticZoom.aggregation} · {points.length} visible</small>
        </div>
      </div>
    </Suspense>
  )
}
