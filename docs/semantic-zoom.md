# YSZ Worldstate — Semantic Zoom & Active Visualization

YSZ should behave less like a dashboard and more like a world-scale spatial operating system.

The core interaction principle is **semantic zoom**:

> As the camera gets closer, the meaning and resolution of the data changes.

The user should not see the same dots getting larger.

They should see a different level of the world model.

## Planet

At global altitude, show only things that can materially affect systems:

- high-materiality world events
- global capital gravity
- major trade corridors
- major energy flows
- large weather systems
- high-level policy pressure
- major market reactions

No facility clutter.

No vessel dots.

No local noise.

## Region

As the user zooms toward a region:

- major ports
- regional policy actions
- shipping corridors
- energy networks
- market reactions
- trade concentration
- country-level ownership exposure

The system should begin explaining *why this region is active*.

## Country

At country scale, reveal:

- ports
- power plants
- refineries
- LNG terminals
- nuclear plants
- grid regions
- mines
- fabs
- data centers
- major companies
- government / regulator relationships
- trade dependencies
- institutional ownership exposure

The UI should support a country dossier without leaving the map.

## Metro / Industrial Cluster

At city or industrial-cluster scale:

- specific facilities
- terminal locations
- infrastructure operators
- nearby hazards
- supply-chain links
- transport connections
- live local events
- ownership / operator relationships

A semiconductor region, refinery complex, port cluster, or financial center should become explorable like a neighborhood in a mapping app.

## Local / Asset

At close zoom:

- individual facilities
- vessel tracks where sourced
- port calls
- facility state
- operator / owner
- capacity
- current alerts
- evidence trails
- nearby dependent assets
- market-linked entities

The user can tap an object and move from physical reality to financial structure.

Example:

```text
refinery
→ operator
→ parent company
→ listed security
→ ETFs
→ institutional holders
→ commodity exposure
→ current market structure
```

## Active visualization

The map should animate only real state.

Examples:

- a vessel track progresses through real timestamped AIS positions
- a weather polygon moves through forecast/observation time
- a trade arc thickens because sourced flow volume increased
- a capital relationship changes after a new filing
- a blockchain arc appears after an observed transfer
- a facility changes state after an official status update
- an event pulse occurs once when a new material state change is detected

Animation is not decoration.

Animation means **time, direction, magnitude, or state change**.

## Multi-resolution storage

Google Maps works because it never tries to render the entire world at street-level detail simultaneously.

YSZ should follow the same principle.

Conceptually:

```text
raw observations
      ↓
asset / facility records
      ↓
local spatial cells
      ↓
regional aggregates
      ↓
country aggregates
      ↓
global materiality state
```

The rendering layer asks for only what the camera can meaningfully display.

## Tile / cell architecture

Long-term target:

- PostGIS for authoritative geometry and spatial relationships
- H3 for hierarchical world-cell aggregation
- vector tiles for dense static / semi-static layers
- WebGL / deck.gl for large dynamic point, path, arc, polygon layers
- globe.gl / Three.js for cinematic global view
- MapLibre for operational map interaction and map-native zoom
- 3D Tiles / Cesium only when real 3D geometry adds analytical value

## Google-Maps-style exploration

The interface should support:

- smooth zoom from planet → country → city → facility
- search and fly-to
- contextual labels
- layer decluttering
- clustering
- hover / tap dossiers
- local context lens
- route tracing
- time playback
- saved investigations
- linked graph exploration

The differentiator is that the map is not just geographic.

It also reveals:

- ownership
- capital
- policy
- trade
- energy
- blockchain
- market structure
- evidence

## Context Lens

Long-press or select an area.

YSZ computes:

- material events inside
- facilities inside
- routes intersecting
- companies operating there
- commodities connected
- market assets structurally exposed
- policy jurisdictions
- weather / hazard intersections
- unresolved unknowns

This is a spatial query, not an AI hallucination.

## Entity Lens

Select an entity and repaint the world around it.

For a company:

- owned / operated facilities
- major suppliers
- major customers where documented
- geographic revenue / exposure where sourced
- policy jurisdictions
- institutional owners
- ETFs
- relevant commodities
- current events

For a commodity:

- mines / production
- processors
- ports
- shipping
- storage
- consuming regions
- related securities

For a blockchain asset:

- public-chain flows
- exchange-associated entities
- bridges
- protocol treasuries
- validator/miner context where sourced
- market structure
- relevant world events

## Time as a map dimension

Every layer should eventually support time.

The user can scrub:

- 1H
- 24H
- 7D
- 30D
- 1Y
- custom

At each time, YSZ reconstructs the best-known world state from immutable observations and derived snapshots.

## Visual quality

The target is not “more UI.”

The target is:

- high frame rate
- smooth camera interpolation
- anti-aliased geometry
- restrained atmospheric lighting
- depth-aware labels
- intelligent decluttering
- high-resolution vector geometry
- crisp type
- subtle shadows / glow only where useful
- GPU aggregation
- progressive loading
- graceful mobile fallbacks

## All-knowing, but honest

YSZ should *feel* all-knowing because the world graph is deeply connected.

It should never pretend to know what it cannot prove.

At every zoom level, absent or uncertain information remains:

- unavailable
- unknown
- stale
- inferred
- conflicted

The magic comes from connecting reality, not inventing it.
