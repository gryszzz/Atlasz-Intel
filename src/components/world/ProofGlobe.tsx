/*
 * ProofGlobe — real WebGL globe (globe.gl on three.js), mounted ONLY behind the
 * lazy boundary (globe.gl requires `window`; never import it at the app shell or
 * in tests). It renders ONLY proof-backed points/arcs passed in — no synthetic
 * markers or filler. With no data it shows an empty luminous Earth.
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

export type GlobeViewState = {
  lat: number
  lng: number
  altitude: number
}

export function ProofGlobe({
  points,
  arcs,
  onSelectPoint,
  onViewChange,
}: {
  points: GlobePoint[]
  arcs: GlobeArc[]
  onSelectPoint?: (eventId: string) => void
  onViewChange?: (view: GlobeViewState) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  const onSelectRef = useRef(onSelectPoint)
  const onViewChangeRef = useRef(onViewChange)

  useEffect(() => {
    onSelectRef.current = onSelectPoint
  }, [onSelectPoint])

  useEffect(() => {
    onViewChangeRef.current = onViewChange
  }, [onViewChange])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const world = new Globe(el, { animateIn: false })
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl('textures/earth-night.jpg')
      .bumpImageUrl('textures/earth-topology.png')
      .showAtmosphere(true)
      .atmosphereColor('#5f9d91')
      .atmosphereAltitude(0.14)
      .pointsMerge(false)
      .pointAltitude(0.02)
      .pointRadius('size')
      .pointResolution(14)
      .pointColor('color')
      .pointLabel('label')
      .onPointClick((p: object) => {
        const point = p as GlobePoint
        onSelectRef.current?.(point.eventId)
      })
      .onPointHover((point: object | null) => {
        const controlElement = (world.controls() as { domElement?: HTMLElement }).domElement
        if (controlElement) controlElement.style.cursor = point ? 'pointer' : 'grab'
      })
      .arcColor('color')
      .arcAltitudeAutoScale(0.4)
      .arcStroke(0.45)
      .arcDashLength(0.5)
      .arcDashGap(0.22)
      .arcDashAnimateTime(2400)

    const controls = world.controls() as {
      autoRotate: boolean
      autoRotateSpeed: number
      enableZoom: boolean
      enablePan: boolean
      enableDamping: boolean
      dampingFactor: number
      rotateSpeed: number
      minDistance: number
      maxDistance: number
      addEventListener?: (type: string, listener: () => void) => void
      removeEventListener?: (type: string, listener: () => void) => void
    }

    controls.autoRotate = false
    controls.autoRotateSpeed = 0
    controls.enableZoom = true
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.rotateSpeed = 0.72
    controls.minDistance = 145
    controls.maxDistance = 760

    world.pointOfView({ lat: 12, lng: 0, altitude: 2.85 })

    const emitView = () => {
      const pointOfView = world.pointOfView() as GlobeViewState
      if (
        Number.isFinite(pointOfView.lat) &&
        Number.isFinite(pointOfView.lng) &&
        Number.isFinite(pointOfView.altitude)
      ) {
        onViewChangeRef.current?.(pointOfView)
      }
    }

    controls.addEventListener?.('change', emitView)
    emitView()
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
      controls.removeEventListener?.('change', emitView)
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
