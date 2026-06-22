# Atlasz Intel Redesign Checkpoint

## Intent

Atlasz is being redesigned as a local, evidence-based intelligence operating
system. The shell should answer four questions on every major surface:

- What is happening?
- Why does it matter?
- What evidence supports it?
- What should be inspected next?

## UI Changes In This Pass

- Renamed the main navigation around analyst workflow:
  - Global Overview
  - World Intel
  - Intelligence Graph
  - Event Timelines
  - Market / Infra
  - Cyber / OPSEC
  - Source Trails
  - Quant Context
  - Attention Pulse
  - Analysis Desk
  - Daily Brief
  - Decision Journal
- Reworked the overview into an evidence-first control board:
  - source trust badges
  - verified-event count that fails closed when no verified source exists
  - latest source-backed event
  - confidence-weighted alerts
  - watchlist movement
  - entity graph state
  - realtime frame freshness
  - stale/failed source debt
- Added explicit source lineage text:
  - connector
  - headlines
  - normalized events
  - generated signals
- Added a defensive Cyber / OPSEC panel backed by a compact UI-local reference
  set. It displays reference controls, gated capabilities, blocked capabilities,
  and unavailable live feeds without inventing alerts.
- Upgraded the graph inspector into an entity profile:
  - type
  - source count
  - confidence
  - freshness
  - direct relationships
  - downstream traversal
  - adjacent entities
- Reframed the market view as intelligence/context, not trading.
- Reframed the old AI surface as an evidence-constrained Analysis Desk.
- Forced the top-level Attention Pulse to show `DATA_UNAVAILABLE` until a real
  external social/attention connector exists.

## Source Boundaries

- `verified` is only shown when the current source trust is actually verified.
- `public-unauthenticated` is not promoted to verified.
- local graph/corpus/reference material is labeled `local-derived`.
- unavailable world, market, social, CVE, CTI, and infrastructure data must show
  unavailable clearly.
- No scanning, malware handling, endpoint collection, person enrichment, or
  threat-intel pulling runs by default.

## Next Design Target

The next highest-leverage UI improvement is a true entity route/detail view that
can be opened directly from command palette search and source trails. It should
reuse the entity profile contract created in this pass, then add timeline,
filings/news/data links, market exposure, infrastructure exposure, and confidence
history.
