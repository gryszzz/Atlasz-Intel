# YSZ // WORLDSTATE — Systems Architecture

## Mission

YSZ Worldstate is a private, evidence-first world-state engine for a small, technically sophisticated community.

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

Worldstate is not:
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

Worldstate ranks events using explainable components:

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

Worldstate models public institutional action, not partisan judgment.

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

Worldstate is temporal.

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

Worldstate may be incomplete.

Worldstate may not pretend.


---

# Maximum-Capacity Architecture

## 1. The system is a world graph, not a dashboard

YSZ Worldstate models the world as a temporal, spatial, multi-domain graph.

At time `t`, Worldstate maintains the best evidence-backed representation it can of:

- physical assets
- companies
- securities
- funds and owners
- governments and institutions
- policy actions
- trade relationships
- energy systems
- logistics systems
- public blockchains
- cyber/security events
- weather and natural hazards
- research and technological change
- observed market state

The core mental model is:

```text
OBSERVATIONS
    ↓
ENTITIES
    ↓
RELATIONSHIPS
    ↓
EVENTS
    ↓
FLOWS
    ↓
EXPOSURES
    ↓
REACTIONS
    ↓
STATE CHANGE
```

No UI feature should bypass this chain.

## 2. Every important object has four layers

Every entity, event, or flow can expose:

### Reality
What was directly observed.

### Structure
What durable relationships are known.

### Statistics
What is unusual relative to historical behavior.

### Interpretation
What a model or analyst infers.

These layers must never be collapsed together.

A vessel changing course is reality.

A refinery depending on that shipping lane is structure.

Traffic being 2.7 standard deviations below baseline is statistics.

A possible supply disruption is interpretation.

The user must always be able to tell which layer they are looking at.

## 3. World domains

Worldstate should support all major high-value world systems through one schema.

### Markets
- equities
- ETFs
- indices
- rates
- sovereign bonds
- credit
- FX
- commodities
- volatility
- options
- futures where sourced
- market breadth
- liquidity proxies

### Capital
- institutional ownership
- insider ownership
- sovereign wealth funds
- pension exposure
- fund/ETF concentration
- debt financing
- buybacks
- issuance
- mergers/acquisitions
- public capital raises
- large public ownership changes

### Policy
- legislation
- regulation
- sanctions
- tariffs
- export controls
- central-bank actions
- fiscal policy
- government contracts
- subsidies
- court decisions with material economic effect
- elections and established results

### Trade
- import/export flows
- ports
- chokepoints
- customs/trade records
- commodities
- containers
- route dependencies
- bilateral concentration
- trade restrictions

### Energy
- oil
- gas
- LNG
- nuclear
- electricity
- grid regions
- storage
- refineries
- pipelines
- generation
- uranium
- renewables
- fuel dependencies

### Industrial
- semiconductor fabs
- mining
- refining/processing
- chemicals
- manufacturing plants
- data centers
- critical materials
- specialized machinery
- strategic industrial capacity

### Maritime / logistics
- vessels
- routes
- ports
- terminals
- anchorage
- congestion
- draft
- deadweight tonnage
- cargo class where evidenced
- owner/operator
- route anomaly

### Public blockchains
- transactions
- wallets
- contracts
- bridges
- exchanges
- validators/miners
- treasury wallets
- stablecoins
- protocol flows
- dormant-wallet activation
- entity attribution with confidence

### Physical world
- earthquakes
- severe weather
- fires
- floods
- storms
- physical disruptions
- infrastructure intersections

### Cyber
- vulnerabilities
- exploitation
- advisories
- affected vendors
- critical-infrastructure exposure
- software dependency graph

### Research / technology
- papers
- patents
- model releases
- OSS releases
- technical breakthroughs
- company R&D signals

## 4. Relationship graph

The relationship layer is where Worldstate becomes more than a collection of feeds.

### Ownership edges
- owns
- controls
- holds
- subsidiary_of
- insider_of
- managed_by

### Supply edges
- supplies
- consumes
- depends_on
- processes
- transports
- stores

### Financial edges
- financed_by
- lends_to
- insured_by
- included_in
- correlated_with
- hedged_by

### Geographic edges
- located_in
- inside_jurisdiction
- near
- intersects
- connected_by_route

### Institutional edges
- regulated_by
- sanctioned_by
- contracted_by
- subsidized_by
- governed_by

### Blockchain edges
- sent_to
- received_from
- bridged_to
- controlled_by
- exchange_deposit_to
- exchange_withdrawal_from

### Event edges
- affected_by
- exposed_to
- corroborates
- contradicts
- preceded
- followed
- coincides_with

Every relationship should support:
- direction
- weight
- confidence
- provenance
- valid_from
- valid_to
- observation ids
- relationship basis

## 5. Exposure engine

A core query becomes:

`Exposure(event → entity)`

Exposure is not causation.

It should be decomposed into:

- physical exposure
- geographic exposure
- supply-chain exposure
- ownership exposure
- financial exposure
- regulatory exposure
- commodity exposure
- route/logistics exposure
- blockchain/liquidity exposure
- counterparty exposure

The system should be able to trace paths such as:

```text
policy action
→ semiconductor equipment
→ company
→ fab
→ country
→ supplier
→ ETF
→ institutional holders
```

or:

```text
storm
→ LNG terminal
→ export capacity
→ shipping route
→ importing region
→ gas benchmark
→ exposed utilities
```

or:

```text
wallet transfer
→ exchange-associated address
→ exchange inflow regime
→ asset liquidity context
→ observed market reaction
```

Each hop must retain its basis and confidence.

## 6. Market reaction engine

Worldstate should measure what markets actually did after important events.

For each event timestamp `t0`, where data exists:

- 5 minute return
- 30 minute return
- 1 hour return
- session return
- 1 day return
- volume change
- volatility change
- options open-interest change
- skew change
- sector-relative move
- factor-relative move
- FX/rates/commodity reaction

Reaction is descriptive.

The UI must say:

**Observed market reaction after event**

not:

**Event caused market move**

unless causation is explicitly established by source evidence.

## 7. Quant layer

Worldstate should compute statistical context deterministically.

For relevant metrics:

- rolling mean
- rolling median
- rolling standard deviation
- percentile
- z-score
- rate of change
- acceleration
- rolling correlation
- rolling beta
- change-point detection
- regime state
- seasonality
- historical event distribution

Important principle:

A number becomes more useful when Worldstate can answer:

> Is this normal?

instead of merely displaying the number.

## 8. Capital topology

Capital Mode should model economically meaningful control and exposure.

A capital node may be:

- asset manager
- fund
- ETF
- pension
- sovereign wealth fund
- bank
- company
- insider
- government
- public-chain treasury

Potential capital-weight dimensions:

- assets under management
- position market value
- ownership percentage
- voting power
- concentration
- change over time
- network centrality
- systemic relevance

Tiny ownership links should remain queryable but visually suppressed unless relevant.

## 9. Blockchain intelligence model

A blockchain transfer is not automatically a trade.

Every transfer should preserve:

- chain
- block
- transaction hash
- timestamp
- sender
- receiver
- asset
- amount
- event-time reference value
- fee
- contract calls
- exchange/bridge/protocol classification
- attribution source
- attribution confidence

### Whale significance

A meaningful transfer score can include:

- amount percentile
- percent of observed wallet balance
- wallet age
- dormancy
- historical rarity
- destination relevance
- exchange proximity
- bridge mechanics
- internal-transfer probability
- market context

The system should downgrade known internal exchange reshuffles.

The product must say:

**Transferred to exchange-associated address**

unless a sale is independently evidenced.

## 10. Geospatial engine

Geospatial intelligence is not a background map.

It is a core computation layer.

Worldstate should support:

- point queries
- radius queries
- polygon intersection
- corridor intersection
- point-in-jurisdiction
- route overlap
- nearest critical asset
- facility density
- regional event density
- spatial clustering
- spatial anomaly detection
- geofenced watch conditions
- hierarchical global cells
- uncertainty polygons

### Future production spatial stack

Recommended target:

```text
Postgres + PostGIS
        │
        ├── geometry / geography
        ├── temporal records
        └── spatial indexes
               │
               ▼
              H3
     hierarchical world cells
               │
               ▼
   MapLibre / deck.gl / WebGL
```

The existing globe.gl/Three.js renderer can remain a cinematic globe surface where it performs well.

MapLibre/deck.gl should handle high-volume vector layers, routes, polygons, clustering, and flat/globe operational views.

Cesium/3D Tiles can be introduced selectively for dense terrain/building/facility scenes where real 3D improves understanding.

## 11. Geospatial visual grammar

Graphics must encode meaning consistently.

- **point** = entity/facility/event
- **arc** = directional flow
- **line** = network/infrastructure
- **track** = moving object history
- **polygon** = jurisdiction/impact area
- **halo** = uncertainty
- **cell** = spatial aggregation
- **height** = real magnitude only
- **size** = systemic gravity
- **opacity** = freshness/confidence
- **thickness** = flow magnitude
- **motion** = direction or time progression
- **pulse** = new state change

3D should never exist merely to look futuristic.

## 12. Rendering quality target

The UI should target:

- smooth 60fps interaction on modern phones where possible
- GPU-based point/arc rendering
- level-of-detail management
- tile/cell aggregation
- progressive layer loading
- background worker processing
- minimal DOM overlays
- spatial decluttering
- deterministic camera transitions
- temporal animation tied to real timestamps
- reduced-motion support
- mobile thermal/battery safeguards

The product should feel closer to a high-end simulation engine than an analytics admin page.

## 13. World Gravity

Every entity can have multiple explainable gravity dimensions:

- financial gravity
- physical gravity
- trade gravity
- ownership gravity
- supply-chain gravity
- policy gravity
- energy gravity
- network gravity

Gravity determines visual prominence at different zoom levels.

It is not a subjective importance score.

It must be computed from measurable graph properties and sourced magnitude fields where possible.

## 14. Event propagation model

Worldstate should model propagation without pretending it predicts the future.

```text
ORIGIN EVENT
   ↓
directly affected entities
   ↓
structural dependencies
   ↓
exposed markets / infrastructure
   ↓
observed reactions
   ↓
new corroborating or conflicting evidence
```

The graph can show potential structural pathways.

Observed downstream changes remain separate from possible pathways.

## 15. Cross-domain convergence

A high-value signal often occurs when independent systems move together.

Examples:

- policy + market
- weather + infrastructure
- shipping + commodity
- filing + ownership
- blockchain + liquidity
- sanctions + trade
- cyber + critical infrastructure

Convergence score should consider:

- number of independent source lineages
- number of domains
- resolved shared entities
- geographic overlap
- temporal overlap
- underlying evidence confidence

Convergence never upgrades an unverified claim into fact.

## 16. Source lineage

Ten websites repeating the same wire story should not count as ten independent confirmations.

Every observation should eventually support:

- original publisher
- upstream source
- syndication lineage
- primary/secondary classification
- independence group

Corroboration operates on independent lineages, not article count.

## 17. Temporal world model

Worldstate should be event-sourced.

Original observations are immutable.

Derived interpretations can change.

The architecture should support:

- historical replay
- world-state snapshots
- comparison between two times
- belief revision
- event evolution
- source correction history
- claim invalidation
- changes in confidence

A user should eventually be able to ask:

> What changed in the world between 09:00 and 15:00?

and receive structural changes, not a news transcript.

## 18. Claim ledger

Any important synthesized sentence should be traceable.

A claim record can include:

- claim id
- text
- basis
- observation ids
- relationship ids
- model/version
- prompt hash
- created_at
- last_reviewed_at
- critic result
- current support state

Possible support states:

- supported
- strengthened
- weakened
- conflicted
- disproven
- expired

## 19. Unknowns are first-class

The system must explicitly model missing information.

Examples:

- cargo unknown
- beneficial owner unknown
- policy implementation date unknown
- wallet attribution uncertain
- outage extent unknown
- market causation unknown

Unknowns can have priority.

A high-value unknown can become a watch condition.

## 20. Watch conditions

Watchlists are not enough.

Worldstate should support evidence-seeking questions:

- Has this vessel entered the chokepoint?
- Has this refinery resumed operations?
- Has this policy taken effect?
- Has this wallet interacted with a known exchange?
- Has traffic normalized?
- Has a second independent source confirmed the event?
- Has the market reaction persisted?

These conditions can be evaluated by deterministic workers and escalated only when state changes.

## 21. World Brief

The main screen should not show the most recent events.

It should show the most material state changes.

World Brief selection should combine:

- materiality
- independent evidence
- cross-domain convergence
- novelty
- persistence
- exposure
- user profile relevance

The output should remain compact:

- 3–7 meaningful changes
- why each is elevated
- domains touched
- evidence quality
- key unknowns

## 22. User profiles

Relevance profiles should alter ranking without altering truth.

Examples:

### Global Macro
- rates
- FX
- commodities
- policy
- sovereign risk
- shipping

### Semiconductor
- fabs
- equipment
- power
- water
- critical materials
- export controls
- Taiwan/Korea/Japan/US/Europe

### Crypto Liquidity
- stablecoins
- exchange flows
- public-chain activity
- rates
- dollar liquidity
- risk assets

### Energy
- oil
- gas
- LNG
- nuclear
- grid
- shipping
- weather

Profiles may stack.

## 23. Agent/service architecture

Not every component should be an LLM.

### Deterministic services
- geometry
- graph traversal
- z-scores
- correlations
- event timestamps
- hashing
- source freshness
- deduplication
- thresholding
- routing
- storage

### Model-assisted services

**Hermes**
Collection interpretation and normalization.

**Gaia**
Ambiguous geospatial resolution.

**Aegis**
Evidence quality and contradiction reasoning.

**Argus**
Anomaly triage.

**Mercury**
Market/capital synthesis.

**Ledger**
Blockchain interpretation.

**Nomos**
Policy/regulatory extraction.

**Nautilus**
Shipping/logistics interpretation.

**Helios**
Energy-system synthesis.

**Forge**
Industrial/supply-chain context.

**Chronos**
Temporal comparisons.

**Atlas**
Graph/system reasoning.

**Oracle**
Brief compression.

**Skeptic**
Independent adversarial review.

High-impact model synthesis should pass Skeptic before being promoted.

## 24. Model escalation

Suggested routing:

```text
parsing / classification
        ↓
small inexpensive model

ambiguity / entity resolution
        ↓
strong general model

cross-domain reasoning
        ↓
top reasoning model

high-impact conclusion
        ↓
independent critic
```

The system records model identity, prompt hash, tool inputs, output, latency, cost, and eval status.

## 25. Governance

The system must prevent agents from silently changing evidence or acting beyond scope.

Use capability boundaries:

- read sources
- enrich entity
- write derived analysis
- modify code
- deploy
- send outbound message
- spend money

Actions with external impact require explicit permission.

OpenThymos-style policy enforcement can become the governance kernel for agent actions.

## 26. Storage architecture

Recommended conceptual layers:

```text
raw_source_record
      ↓
observation
      ↓
entity
relationship
      ↓
event
flow
      ↓
cluster
exposure
reaction
      ↓
brief
claim
snapshot
```

Storage targets can evolve toward:

- Postgres/Neon/Supabase
- PostGIS
- object storage for raw snapshots
- SQLite/local cache for offline-first behavior

## 27. Event-sourced world state

Never overwrite the past.

Store change events.

Build current state as a projection.

Use periodic snapshots for performance.

This enables:

- replay
- audit
- historical comparison
- model reprocessing
- corrected interpretations
- time travel

## 28. Search/query engine

Natural-language queries should compile into structured world queries.

Examples:

> Show semiconductor facilities within regions affected by today's severe weather.

> Show institutional ownership exposure to nuclear-energy companies affected by recent policy changes.

> Show significant exchange-associated blockchain inflows alongside abnormal volatility.

> Show trade chokepoints with abnormal vessel throughput.

The LLM plans the query.

The databases and deterministic engines answer it.

The LLM explains the result.

## 29. Scenario analysis

Worldstate may support hypothetical structural scenarios.

Example:

> If this shipping corridor became unavailable, show directly exposed systems.

The system traverses existing relationships.

It must clearly label scenario output as hypothetical and never present it as a prediction.

## 30. Political neutrality

Policy intelligence should describe:

- documented institutional actions
- affected jurisdictions
- affected sectors
- documented economic relationships
- observed market reactions
- competing sourced interpretations where relevant

Worldstate should not endorse candidates, parties, or political outcomes and should not convert uncertain political developments into unsupported market predictions.

## 31. UI information architecture

### Layer 1 — World
Earth + meaningful changes.

### Layer 2 — Event
What happened, where, evidence, materiality.

### Layer 3 — Entity
Current state, ownership, physical assets, dependencies, flows.

### Layer 4 — Graph
Relationships and exposure paths.

### Layer 5 — Timeline
How evidence and state changed.

### Layer 6 — Proof
Raw source trails, hashes, timestamps, conflicts.

The UI stays simple because the depth is nested.

## 32. Target interaction language

On phone:

- tap = inspect
- drag = rotate/pan
- pinch = zoom
- two-finger tilt = perspective
- bottom-sheet drag = intelligence depth
- timeline scrub = state time
- long press = local context lens
- mode switch = reinterpret world
- entity select = exposure lens

The map must remain visually present during investigation whenever practical.

## 33. Final design principle

YSZ Worldstate should look visually expensive because the information architecture is disciplined, not because it is overloaded.

The surface should feel calm.

The internals should be obsessive.

The product should be able to know millions of relationships while showing the user five things worth caring about.

## Release principle

**Worldstate may be incomplete. Worldstate may not pretend.**
