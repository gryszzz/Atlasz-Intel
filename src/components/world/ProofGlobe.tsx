/*
 * ProofGlobe — real WebGL globe (globe.gl on three.js), mounted ONLY behind the
 * lazy boundary (globe.gl requires `window`; never import it at the app shell or
 * in tests). This is the honest `webgl-3d` render mode: a textured NASA
 * Blue-Marble-night Earth. It renders ONLY proof-backed points/arcs passed in —
 * no synthetic markers, no filler. With no data it shows an empty luminous Earth.
 */
import { useEffect, useRef } from 'react'
import Globe from 'globe.gl'

export type GlobePoint = {
  id: string
  lat: number
  lng: number
  label: string
  color: string
  size: number
  eventId: string
}

export type GlobeArc = {
  id: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string
}

export function ProofGlobe({
  points,
  arcs,
  onSelectPoint,
}: {
  points: GlobePoint[]
  arcs: GlobeArc[]
  onSelectPoint?: (eventId: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  const onSelectRef = useRef(onSelectPoint)
  useEffect(() => {
    onSelectRef.current = onSelectPoint
  }, [onSelectPoint])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const world = new Globe(el, { animateIn: true })
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl('textures/earth-night.jpg')
      .bumpImageUrl('textures/earth-topology.png')
      .showAtmosphere(true)
      .atmosphereColor('#38bdf8')
      .atmosphereAltitude(0.2)
      .pointsMerge(false)
      .pointAltitude(0.012)
      .pointRadius('size')
      .pointColor('color')
      .pointLabel('label')
      .onPointClick((p: object) => {
        const point = p as GlobePoint
        onSelectRef.current?.(point.eventId)
      })
      .arcColor('color')
      .arcAltitudeAutoScale(0.4)
      .arcStroke(0.45)
      .arcDashLength(0.5)
      .arcDashGap(0.22)
      .arcDashAnimateTime(2400)

    world.controls().autoRotate = true
    world.controls().autoRotateSpeed = 0.42
    world.controls().enableZoom = true
    world.pointOfView({ lat: 20, lng: 12, altitude: 2.4 })
    globeRef.current = world

    const resize = () => {
      world.width(el.clientWidth)
      world.height(el.clientHeight)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(el)

    return () => {
      observer.disconnect()
      world._destructor?.()
      el.replaceChildren()
      globeRef.current = null
    }
  }, [])

  useEffect(() => {
    globeRef.current?.pointsData(points)
  }, [points])

  useEffect(() => {
    globeRef.current?.arcsData(arcs)
  }, [arcs])

  return <div className="proof-globe-canvas" ref={containerRef} aria-hidden="true" />
}
