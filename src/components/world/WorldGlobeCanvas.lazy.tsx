/*
 * Worldwatch map shell (lazy). Heavy globe engines can mount behind this same
 * boundary later; today's renderer is the honest high-performance 2D fallback.
 */
import { useMemo, useState } from 'react'
import { Globe2, Link2, MapPinned, ShieldAlert, WifiOff } from 'lucide-react'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import {
  WorldwatchEntityRenderer,
  buildWorldwatchSelectionDossier,
  resolveWorldwatchRenderMode,
  type WorldwatchEntity,
  type WorldwatchLayerId,
  type WorldwatchLayerSnapshot,
  type WorldwatchProjectedEntity,
  type WorldwatchRenderMode,
  type WorldwatchSelectionDossier,
} from '../../engine/worldwatchLayerRegistry'
import { WorldPanelHeader } from './WorldPanelHeader'

export type WorldWindow = { id: string; label: string; durationMs: number }

export function WorldGlobeCanvas({
  activeLayerIds,
  layerSnapshot,
  windows,
  windowId,
  now,
  onToggleLayer,
  onWindowChange,
  onSelectEvent,
}: {
  activeLayerIds: WorldwatchLayerId[]
  layerSnapshot: WorldwatchLayerSnapshot
  windows: WorldWindow[]
  windowId: string
  now: number
  onToggleLayer: (layerId: WorldwatchLayerId) => void
  onWindowChange: (id: string) => void
  onSelectEvent: (eventId: string) => void
}) {
  const [webglAvailable] = useState(() => browserSupportsWebGL())
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

  const activeLayerSet = useMemo(() => new Set(activeLayerIds), [activeLayerIds])
  const visibleEntities = useMemo(
    () => layerSnapshot.entities.filter((entity) => activeLayerSet.has(entity.layerId)),
    [activeLayerSet, layerSnapshot.entities],
  )
  const projectedPoints = useMemo(
    () =>
      visibleEntities
        .filter((entity) => entity.geometry === 'point')
        .map((entity) => WorldwatchEntityRenderer.project(entity)),
    [visibleEntities],
  )
  const nonPointEntities = visibleEntities.filter((entity) => entity.geometry !== 'point').slice(0, 12)
  const selectedEntity = visibleEntities.find((entity) => entity.id === selectedEntityId) ?? visibleEntities[0]
  const selectedDossier = selectedEntity ? buildWorldwatchSelectionDossier(selectedEntity) : null
  const renderMode = resolveWorldwatchRenderMode({ webglAvailable })
  const onlineLayers = layerSnapshot.layers.filter((layer) => layer.status === 'online').length
  const attentionLayers = layerSnapshot.layers.filter((layer) => layer.status !== 'online').length

  const selectEntity = (entity: WorldwatchEntity) => {
    setSelectedEntityId(entity.id)
    onSelectEvent(entity.eventId)
  }

  return (
    <article className="world-panel world-map-panel worldwatch-globe-shell">
      <WorldPanelHeader icon={Globe2} label="Worldwatch Globe" value={`${visibleEntities.length} proof-backed`} />

      <div className="worldwatch-globe-toolbar">
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
        <div className={`worldwatch-render-mode render-${renderMode}`}>
          <MapPinned size={13} />
          <span>{renderModeLabel(renderMode)}</span>
        </div>
      </div>

      <div className="worldwatch-source-strip">
        <span>{onlineLayers} layers online</span>
        <span>{attentionLayers} attention</span>
        <span>{projectedPoints.length} map markers</span>
        <span>{nonPointEntities.length} context rows</span>
      </div>

      <div className="worldwatch-globe-layout">
        <aside className="worldwatch-layer-rail" aria-label="Worldwatch layer controls">
          {layerSnapshot.layers.map((layer) => {
            const active = activeLayerSet.has(layer.id)
            const disabled = layer.status === 'missing-config'
            return (
              <button
                className={`worldwatch-layer-toggle ${active ? 'active' : ''} layer-status-${layer.status}`}
                disabled={disabled}
                key={layer.id}
                title={layer.disabledReason ?? layer.description}
                type="button"
                onClick={() => onToggleLayer(layer.id)}
              >
                <span>{layer.label}</span>
                <strong>{layer.entityCount}</strong>
                <em>{layer.status} | {layer.cadence}</em>
                <small className={`worldwatch-layer-heat heat-${layer.freshnessHeat}`}>
                  {layer.freshnessHeat === 'empty' ? 'no records' : `${layer.freshnessHeat} freshness`}
                </small>
                <small>{layer.sourceTrailHandler}</small>
              </button>
            )
          })}
        </aside>

        <div className="atlasz-world-map worldwatch-proof-map" aria-label="Atlasz proof-gated worldwatch map">
          <span className="map-grid-line map-equator" />
          <span className="map-grid-line map-meridian" />
          <span className="map-region-label americas">Americas</span>
          <span className="map-region-label emea">EMEA</span>
          <span className="map-region-label apac">APAC</span>
          <span className="worldwatch-globe-orbit orbit-a" />
          <span className="worldwatch-globe-orbit orbit-b" />

          {projectedPoints.map((entity) => (
            <ProjectedMarker
              entity={entity}
              key={entity.id}
              selected={selectedEntity?.id === entity.id}
              onSelect={() => selectEntity(entity)}
            />
          ))}

          {nonPointEntities.length > 0 && (
            <div className="worldwatch-context-band">
              {nonPointEntities.map((entity) => (
                <button
                  className={`worldwatch-context-row trust-${entity.visualTrust}${entity.stale ? ' stale' : ''}`}
                  key={entity.id}
                  type="button"
                  onClick={() => selectEntity(entity)}
                >
                  <span>{entity.geometry}</span>
                  <strong>{entity.label}</strong>
                  <em>{entity.region}</em>
                </button>
              ))}
            </div>
          )}

          {visibleEntities.length === 0 && (
            <div className="world-empty">
              <WifiOff size={20} />
              <p>No proof-backed entities in this profile/window/layer set. Atlasz is not rendering fake markers.</p>
            </div>
          )}
        </div>

        <WorldwatchEntityDrawer dossier={selectedDossier} now={now} />
      </div>
    </article>
  )
}

function ProjectedMarker({
  entity,
  selected,
  onSelect,
}: {
  entity: WorldwatchProjectedEntity
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      aria-label={`Inspect ${entity.label}`}
      className={`world-marker worldwatch-marker marker-${entity.kind} trust-${entity.visualTrust}${entity.stale ? ' stale' : ''}${selected ? ' active' : ''}`}
      style={{ left: `${entity.x}%`, top: `${entity.y}%` }}
      type="button"
      onClick={onSelect}
    >
      <span />
      <strong>{entity.label}</strong>
      <em>{entity.region}</em>
    </button>
  )
}

function WorldwatchEntityDrawer({ dossier, now }: { dossier: WorldwatchSelectionDossier | null; now: number }) {
  if (!dossier) {
    return (
      <aside className="worldwatch-entity-drawer">
        <ShieldAlert size={17} />
        <h4>No selected entity</h4>
        <p>Enable a proof-backed layer or refresh public sources. Empty map space is intentional.</p>
      </aside>
    )
  }

  return (
    <aside className={`worldwatch-entity-drawer trust-${dossier.entity.visualTrust}`}>
      <header>
        <span>{dossier.entity.layerId}</span>
        <h4>{dossier.title}</h4>
      </header>
      <p>{dossier.entity.summary}</p>
      <div className="worldwatch-proof-row">
        <ProvenanceBadge value={dossier.sourceTrail.provenance} size="sm" />
        <FreshnessBadge
          now={now}
          retrievedAt={dossier.sourceTrail.retrievedAt}
          staleAt={dossier.sourceTrail.staleAt}
          size="sm"
        />
        <span>{Math.round(dossier.sourceTrail.confidence)} confidence</span>
      </div>
      {dossier.exposureContext.length > 0 && (
        <div className="worldwatch-drawer-section">
          <span>Exposure context</span>
          <div className="world-chip-row">
            {dossier.exposureContext.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      )}
      <div className="worldwatch-drawer-section">
        <span>Unknowns</span>
        {dossier.unknowns.map((unknown) => (
          <p key={unknown}>{unknown}</p>
        ))}
      </div>
      <div className="worldwatch-drawer-section">
        <span>Does not prove</span>
        {dossier.nonClaims.map((claim) => (
          <p key={claim}>{claim}</p>
        ))}
      </div>
      <div className="worldwatch-drawer-section">
        <span>Source handler</span>
        <p>{dossier.entity.layerId} uses the layer registry source-trail handler for proof expansion.</p>
      </div>
      <a href={dossier.sourceTrail.sourceUrl} target="_blank" rel="noreferrer">
        <Link2 size={12} />
        Open source proof
      </a>
    </aside>
  )
}

function browserSupportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

function renderModeLabel(mode: WorldwatchRenderMode): string {
  if (mode === 'cesium-3d') return 'Cesium 3D'
  if (mode === 'webgl-unavailable-fallback') return '2D fallback: WebGL unavailable'
  return '2D fallback: Cesium not installed'
}
