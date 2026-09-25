import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import type { WorldIntelEvent } from '../worldIntel'

type GlobeEvent = Pick<
  WorldIntelEvent,
  'id' | 'title' | 'lat' | 'lon' | 'severity' | 'confidence' | 'region' | 'category'
>

type WorldGlobeProps = {
  events: GlobeEvent[]
  selectedEventId?: string
  onSelectEvent: (id: string) => void
}

type ViewState = {
  lon: number
  lat: number
  zoom: number
}

type DragState = {
  pointerId: number
  x: number
  y: number
  lon: number
  lat: number
}

const DEG = Math.PI / 180

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function severityRadius(severity: GlobeEvent['severity']) {
  if (severity === 'critical') return 5.6
  if (severity === 'elevated') return 4.6
  if (severity === 'watch') return 3.8
  return 3.2
}

function project(
  lat: number,
  lon: number,
  view: ViewState,
  cx: number,
  cy: number,
  radius: number,
) {
  const phi = lat * DEG
  const lambda = (lon - view.lon) * DEG
  const viewLat = view.lat * DEG

  const cosPhi = Math.cos(phi)
  const x = radius * cosPhi * Math.sin(lambda)
  const y =
    -radius *
    (Math.sin(phi) * Math.cos(viewLat) -
      cosPhi * Math.cos(lambda) * Math.sin(viewLat))
  const z =
    Math.sin(phi) * Math.sin(viewLat) +
    cosPhi * Math.cos(lambda) * Math.cos(viewLat)

  return { x: cx + x, y: cy + y, visible: z > 0, depth: z }
}

export function WorldGlobe({ events, selectedEventId, onSelectEvent }: WorldGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const [view, setView] = useState<ViewState>({ lon: -18, lat: 18, zoom: 1 })
  const [hoveredEventId, setHoveredEventId] = useState<string | undefined>()

  const geocodedEvents = useMemo(
    () => events.filter((event): event is GlobeEvent & { lat: number; lon: number } =>
      Number.isFinite(event.lat) && Number.isFinite(event.lon),
    ),
    [events],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const parent = canvas.parentElement
    if (!parent) return

    let frame = 0

    const draw = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      const rect = parent.getBoundingClientRect()
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)

      const cx = width * 0.5
      const cy = height * (width < 720 ? 0.46 : 0.5)
      const radius = Math.min(width * 0.43, height * 0.47) * view.zoom

      const halo = context.createRadialGradient(cx, cy, radius * 0.78, cx, cy, radius * 1.22)
      halo.addColorStop(0, 'rgba(69, 128, 119, 0.08)')
      halo.addColorStop(0.8, 'rgba(62, 119, 111, 0.025)')
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = halo
      context.beginPath()
      context.arc(cx, cy, radius * 1.24, 0, Math.PI * 2)
      context.fill()

      const earth = context.createRadialGradient(
        cx - radius * 0.34,
        cy - radius * 0.32,
        radius * 0.06,
        cx,
        cy,
        radius,
      )
      earth.addColorStop(0, '#182421')
      earth.addColorStop(0.56, '#0b1211')
      earth.addColorStop(0.93, '#060909')
      earth.addColorStop(1, '#020404')
      context.fillStyle = earth
      context.strokeStyle = 'rgba(164, 207, 197, 0.2)'
      context.lineWidth = 1
      context.beginPath()
      context.arc(cx, cy, radius, 0, Math.PI * 2)
      context.fill()
      context.stroke()

      context.save()
      context.beginPath()
      context.arc(cx, cy, radius - 0.5, 0, Math.PI * 2)
      context.clip()

      context.lineWidth = 0.7
      context.strokeStyle = 'rgba(144, 181, 173, 0.1)'

      for (let lat = -60; lat <= 60; lat += 30) {
        let started = false
        context.beginPath()
        for (let lon = -180; lon <= 180; lon += 3) {
          const p = project(lat, lon, view, cx, cy, radius)
          if (!p.visible) {
            started = false
            continue
          }
          if (!started) {
            context.moveTo(p.x, p.y)
            started = true
          } else {
            context.lineTo(p.x, p.y)
          }
        }
        context.stroke()
      }

      for (let lon = -180; lon < 180; lon += 30) {
        let started = false
        context.beginPath()
        for (let lat = -90; lat <= 90; lat += 3) {
          const p = project(lat, lon, view, cx, cy, radius)
          if (!p.visible) {
            started = false
            continue
          }
          if (!started) {
            context.moveTo(p.x, p.y)
            started = true
          } else {
            context.lineTo(p.x, p.y)
          }
        }
        context.stroke()
      }

      for (const event of geocodedEvents) {
        const point = project(event.lat, event.lon, view, cx, cy, radius)
        if (!point.visible) continue

        const selected = selectedEventId === event.id
        const hovered = hoveredEventId === event.id
        const baseRadius = severityRadius(event.severity)
        const markerRadius = (selected ? baseRadius + 2.5 : hovered ? baseRadius + 1.4 : baseRadius) *
          (0.76 + point.depth * 0.24)

        context.fillStyle = selected
          ? 'rgba(239, 250, 247, 0.98)'
          : event.severity === 'critical'
            ? 'rgba(238, 117, 104, 0.95)'
            : event.severity === 'elevated'
              ? 'rgba(226, 185, 103, 0.94)'
              : 'rgba(105, 209, 188, 0.88)'

        context.shadowColor = context.fillStyle
        context.shadowBlur = selected ? 20 : 10
        context.beginPath()
        context.arc(point.x, point.y, markerRadius, 0, Math.PI * 2)
        context.fill()
        context.shadowBlur = 0

        if (selected || hovered) {
          context.strokeStyle = 'rgba(226, 246, 240, 0.48)'
          context.lineWidth = 1
          context.beginPath()
          context.arc(point.x, point.y, markerRadius + 6, 0, Math.PI * 2)
          context.stroke()
        }
      }

      context.restore()

      const rim = context.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
      rim.addColorStop(0, 'rgba(176, 221, 210, 0.23)')
      rim.addColorStop(0.48, 'rgba(86, 145, 135, 0.06)')
      rim.addColorStop(1, 'rgba(255, 255, 255, 0.015)')
      context.strokeStyle = rim
      context.lineWidth = 1.5
      context.beginPath()
      context.arc(cx, cy, radius + 0.4, 0, Math.PI * 2)
      context.stroke()
    }

    const render = () => {
      draw()
      frame = window.requestAnimationFrame(render)
    }

    frame = window.requestAnimationFrame(render)
    return () => window.cancelAnimationFrame(frame)
  }, [geocodedEvents, hoveredEventId, selectedEventId, view])

  function eventAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const cx = width * 0.5
    const cy = height * (width < 720 ? 0.46 : 0.5)
    const radius = Math.min(width * 0.43, height * 0.47) * view.zoom
    const x = clientX - rect.left
    const y = clientY - rect.top

    let nearest: { id: string; distance: number } | undefined
    for (const event of geocodedEvents) {
      const p = project(event.lat, event.lon, view, cx, cy, radius)
      if (!p.visible) continue
      const distance = Math.hypot(p.x - x, p.y - y)
      if (distance <= 16 && (!nearest || distance < nearest.distance)) {
        nearest = { id: event.id, distance }
      }
    }
    return nearest?.id
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lon: view.lon,
      lat: view.lat,
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      setHoveredEventId(eventAt(event.clientX, event.clientY))
      return
    }

    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    setView((current) => ({
      ...current,
      lon: drag.lon - dx * 0.28,
      lat: clamp(drag.lat + dy * 0.22, -72, 72),
    }))
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    const moved = Math.hypot(event.clientX - drag.x, event.clientY - drag.y)
    if (moved < 7) {
      const id = eventAt(event.clientX, event.clientY)
      if (id) onSelectEvent(id)
    }
  }

  function handleWheel(event: ReactWheelEvent<HTMLCanvasElement>) {
    event.preventDefault()
    setView((current) => ({
      ...current,
      zoom: clamp(current.zoom + (event.deltaY < 0 ? 0.08 : -0.08), 0.8, 1.32),
    }))
  }

  return (
    <canvas
      ref={canvasRef}
      className="atlasz-world-globe"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        dragRef.current = null
      }}
      onPointerLeave={() => setHoveredEventId(undefined)}
      onWheel={handleWheel}
      aria-label="Interactive Atlasz world globe"
    />
  )
}
