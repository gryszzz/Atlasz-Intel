import { lazy, Suspense, useMemo } from 'react'
import type { WorldIntelEvent } from '../worldIntel'
import { WorldGlobe } from './WorldGlobe'

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
  const points = useMemo(
    () =>
      events
        .filter(
          (event): event is WorldIntelEvent & { lat: number; lon: number } =>
            Number.isFinite(event.lat) && Number.isFinite(event.lon),
        )
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
    [events, selectedEventId],
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
        <ProofGlobe points={points} arcs={[]} onSelectPoint={onSelectEvent} />
      </div>
    </Suspense>
  )
}
