# Atlasz World — Rebuild Contract

## Mission

Atlasz World is a private, evidence-first world-state engine for a small, technically sophisticated community.

It combines geospatial intelligence, quant/market context, capital ownership and flow, policy/regulatory change, trade/logistics, energy/infrastructure, cyber, weather, and public-chain activity into one coherent world model.

The product must know substantially more than it shows.

The UI should feel like a serious geospatial operating system: calm, spatial, responsive, cinematic only when motion communicates state, and free of decorative "cyber" noise.

## Product questions

Every primary surface must answer:

1. What changed?
2. Where did it happen?
3. Why is it materially relevant?
4. What real entities and systems does it touch?
5. What evidence proves each claim?
6. What is inferred rather than observed?
7. What remains unknown?
8. What should be inspected next?

## Non-goals

Atlasz is not:
- a news feed
- a trading bot
- a prediction engine
- a partisan political product
- a whale-alert spam feed
- a dashboard of decorative metrics
- a military-style fake HUD
- a system that turns media repetition into confidence

## Core ontology

### Observation
Immutable source-backed fact entering the system.

Fields include source, observed/published/retrieved times, raw and normalized values, units, location, source URL, payload hash, freshness, source reliability, verification state, corroboration, and conflicts.

### Entity
A durable node in the world graph.

Initial classes:
- country
- government
- agency
- policy
- company
- fund
- ETF
- security
- commodity
- currency
- bond
- wallet
- protocol
- blockchain
- vessel
- port
- terminal
- refinery
- power_plant
- grid_region
- pipeline
- mine
- fab
- data_center
- airport
- rail_corridor
- weather_system
- cyber_vulnerability
- research_work
- event

### Relationship
Typed edge with provenance and confidence.

Examples:
- owns
- operates
- supplies
- depends_on
- imports_from
- exports_to
- located_in
- regulated_by
- sanctioned_by
- financed_by
- holds
- contains
- sent_to
- received_from
- exposed_to
- affected_by
- corroborates
- contradicts

Every edge must state whether it is:
- observed
- curated-reference
- derived
- inferred

### Event
A deduplicated change in world state composed from one or more observations.

### Flow
A movement between entities.

Domains:
- capital
- trade
- energy
- shipping
- blockchain
- policy pressure
- information/attention

A flow must never imply more than the underlying evidence proves.

## Materiality

Raw event volume is not relevance.

Atlasz ranks events using explainable components:

- impact
- confidence
- novelty
- exposure
- velocity
- persistence
- network centrality
- geographic relevance
- profile relevance

Scores must retain their component breakdown.

No single score may erase uncertainty. Conflicted or stale evidence must remain visible.

## Market intelligence

Market surfaces are contextual rather than recommendation-driven.

Useful fields include:
- price and return
- volume relative to baseline
- realized/implied volatility where available
- options open interest/volume/skew where available
- institutional ownership and changes
- ETF membership and concentration
- insider transactions
- short interest where sourced
- debt/refinancing context
- sector and factor relationships
- observed reaction to world events

Price movement alone must never be labeled as capital inflow.

## Capital graph

Model economically meaningful ownership and financing relationships.

Prioritize:
- large institutional managers
- sovereign wealth funds
- pensions
- hedge funds where public filings support positions
- strategic corporate owners
- insiders
- ETFs/funds
- banks/lenders where public evidence exists

Suppress tiny ownership relationships unless they are relevant to a specific query.

## Blockchain intelligence

Normalize public-chain events into evidence-backed transfer records.

Important dimensions:
- chain
- transaction hash
- block/height
- timestamp
- sender
- recipient
- asset
- amount
- event-time reference value if sourced
- fee
- decoded contract activity
- entity attribution source
- attribution confidence

Whale significance should consider:
- transfer size percentile
- percent of observed wallet balance
- historical rarity
- dormancy
- destination relevance
- exchange/bridge classification
- whether sender and receiver are likely controlled by the same entity
- market context

Do not say "sold" when the chain only proves "transferred to an exchange-associated address."

## Politics and policy

Atlasz models public institutional action, not partisan judgment.

High-value political events include:
- legislation
- executive action
- sanctions
- tariffs
- export controls
- regulatory enforcement
- major court decisions with material economic effects
- central-bank decisions
- budgets/fiscal actions
- government contracts/subsidies
- elections and established results
- consequential diplomatic/security developments

Each event should connect to documented industries, entities, commodities, regions, or infrastructure where evidence supports the relationship.

## Geospatial intelligence

The map is the primary navigation system.

World modes:
- WORLD
- CAPITAL
- TRADE
- ENERGY
- POLICY
- CHAIN
- RISK

Spatial objects can include:
- point
- line/route
- polygon
- H3 cell
- track
- corridor
- uncertainty region

3D is used only when it communicates a real dimension:
- terrain
- facility geometry
- route altitude/depth separation
- weather volume
- infrastructure corridor
- global curvature
- temporal change

No decorative holograms, random particles, fake telemetry, or meaningless glowing objects.

## Progressive disclosure

The phone surface remains quiet.

Opening state:
- 3D/2.5D Earth
- current mode
- meaningful-change count
- small number of elevated systems
- freshness indicator
- draggable intelligence sheet

The system stores deep detail but reveals it only after selection.

Entity sheet hierarchy:
1. current state
2. why now
3. connected systems
4. material exposures
5. recent changes
6. graph
7. timeline
8. evidence
9. unknowns

## Evidence language

Every claim is one of:
- OBSERVED
- CORROBORATED
- STRUCTURAL
- INFERRED
- CONFLICTED
- UNKNOWN

These labels are product primitives, not optional metadata.

## Time

Atlasz is temporal.

Users should be able to compare world state across:
- 24h
- 7d
- 30d
- 1y
- arbitrary interval

The system should preserve event-time observations so it can answer:
"What changed between these two states?"

## Agent architecture

Initial agents/services:

### Hermes
Collection and normalization.

### Gaia
Geospatial resolution and spatial relationships.

### Aegis
Evidence trust, freshness, corroboration, and conflict.

### Argus
Change detection, anomaly detection, and watch conditions.

### Mercury
Market/capital context without trade recommendations.

### Atlas
Graph traversal and system exposure analysis.

### Chronos
Temporal comparison and change-point context.

### Oracle
Briefing and compression.

### Skeptic
Independent review of high-impact synthesized claims.

Agents may interpret evidence. They may not manufacture evidence.

## Model routing

Routine extraction/classification should use the cheapest model that reliably passes evals.

Hard cross-domain synthesis and architecture can escalate to stronger reasoning models.

High-impact synthesis should be independently reviewed.

Model identity, prompt version, tool calls, latency, cost, and evaluation outcome should be logged per run.

## UI doctrine

Visual goals:
- dark earth / charcoal environment
- restrained accent colors
- strong typography
- spatial hierarchy
- high-quality depth and motion
- large interactive map area
- minimal chrome
- progressive detail
- mobile-first gestures
- desktop expands density rather than changing mental model

Avoid:
- permanent metric grids
- tiny monospace everywhere
- constant animation
- red/green financial noise
- generic admin-dashboard components as the primary visual language
- decorative "AI" elements

## Implementation direction

Preserve and extend:
- source runtime
- Evidence Graph
- entity resolver
- materiality engine
- freshness model
- conflict detection
- connector reality audits
- fail-closed behavior

New code should be isolated under `src/world/` until the new shell is ready to become the default experience.

The current monolithic `App.tsx` and `WorldIntelligenceView.tsx` should not receive major new product logic.

## First milestones

### M0 — contracts
- world ontology
- relevance/materiality vector
- view-state contract
- evidence labels
- world mode contract

### M1 — world shell
- phone-first full-viewport world canvas
- mode rail
- intelligence sheet
- event cluster surface
- entity sheet
- evidence/unknowns sections

### M2 — geospatial engine
- vector globe/map
- clustering
- routes/arcs
- facilities
- spatial filtering
- time slider

### M3 — flows
- trade
- shipping
- energy
- capital
- blockchain

### M4 — agent synthesis
- event clustering
- cross-domain graph traversal
- independent critic
- briefing

### M5 — evaluation
- ranking evals
- source/provenance regression suite
- mobile performance budgets
- visual regression
- runtime telemetry

## Release principle

Atlasz may be incomplete.

Atlasz may not pretend.
