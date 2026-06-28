# Atlasz Worldwatch Globe Pass

Atlasz uses WorldWideView as architecture/UI inspiration only. Do not copy its
assets, branding, trade dress, or code without a separate license review.

WorldWideView is a plugin-driven geospatial globe. Atlasz Worldwatch is a
proof-first economic, market, infrastructure, and world intelligence terminal.

## Architecture

```text
Hermes   -> source connectors, proof trails, persistence, runtime verification
Aegis    -> trust, freshness, corroboration, conflicts, unknowns, non-claims
Worldwatch -> layer registry, relevance, map selection, source-backed dossiers
```

The current Worldwatch Globe implementation is intentionally original:

- `WorldwatchLayerRegistry` turns existing `WorldIntelEvent` records into map
  layers only after proof checks pass.
- `WorldwatchLayerDefinition` describes source IDs, visual behavior, layer caps,
  and non-claims.
- `WorldwatchEntityRenderer` projects proof-backed entities for the fallback map.
- `WorldwatchDataBus` provides typed in-app events.
- `WorldwatchSelectionStore` keeps the selected entity/dossier local.
- `WorldwatchAgentBus` is local only; it opens no sockets and makes no MCP claim.

## Rendering

The World Intelligence view lazy-loads the map shell. The current renderer is the
honest high-performance 2D fallback. A Cesium/Resium renderer can be added behind
the same lazy boundary after dependency, license, bundle-size, and desktop smoke
review.

Render modes must be labeled honestly:

- `cesium-3d` only when a real 3D renderer is present.
- `webgl-unavailable-fallback` when WebGL cannot initialize.
- `atlasz-2d-fallback` when WebGL exists but Atlasz is using the lightweight map.

## Layer Rules

- No fake markers.
- No simulated production data.
- No marker or context row without a source URL, retrieval timestamp, payload
  hash, nonzero confidence, and non-simulated provenance.
- Stale/expired entities render as stale; they are not styled fresh.
- Media observations stay low-trust and never count as official evidence.
- Curated/derived exposure is structural context only, never verified live impact.
- Configured-only or key-gated connectors show inactive/missing config.
- No outage, damage, disruption, safety, exploitation, trading, or price claim
  unless a source record actually proves that claim.

## Map Semantics

- Facilities are fixed assets and context.
- Weather and earthquakes are live hazard context.
- Sanctions and policy are jurisdiction/event overlays.
- Companies and ETFs are exposure context, not map facts.
- Trade flows are country/commodity arcs only.
- Curated exposure paths are structural/dashed context.
- Conflicts and unknowns must be surfaced, not hidden.

## Tests

`test/worldwatchLayerRegistry.test.ts` covers:

- proof-gated entity materialization
- stale entity state
- missing-key layer disabling
- media observations staying low-trust
- structural exposure not being labeled verified
- facility selection opening source proof + non-claims
- company selection opening exposure context
- unavailable layers avoiding blank panels
- WebGL-unavailable fallback labeling
