---
name: distributed-systems-design
description: >-
  Design reliable, data-intensive, distributed systems from first principles
  (DDIA / system-design canon). Use when designing services, pipelines, storage,
  or reasoning about consistency/availability/scaling/failure tradeoffs.
  Triggers: "system design", "consistency model", "scale this", "replication/
  consensus", "CAP", "make it reliable", "data pipeline architecture".
---

# Distributed systems design

First-principles toolkit for building systems that stay correct and available
under partial failure, load, and concurrency. Bias toward **simplicity**: the
best distributed system is often a smaller non-distributed one.

## The three hard problems

1. **Replication** — copies for availability/latency.
   - Single-leader (simple, linearizable-ish, failover risk), multi-leader
     (write-anywhere, conflicts), leaderless/quorum (R+W>N tunable).
2. **Partitioning (sharding)** — split data for scale; watch hot keys and
   rebalancing; secondary indexes are the hard part.
3. **Consensus** — agree under failure: **Raft**/Paxos for leader election +
   replicated log (etcd, Consul). Use a library/system; don't hand-roll.

## Consistency spectrum (pick the weakest that's correct)

Linearizable → sequential → causal → read-your-writes → eventual.
Stronger = more coordination = higher latency/lower availability. **CAP** under
partition: choose C or A. **PACELC**: even without partitions, latency vs
consistency. Most systems should default to causal/RYW and reserve linearizable
for the few invariants that need it (balances, locks).

## Reliability primitives

- **Idempotency keys** — make retries safe; "exactly-once" is an illusion built
  from at-least-once delivery + idempotent handlers + dedup.
- **Backpressure + bounded queues** — never unbounded buffering; shed/queue.
- **Timeouts, retries with jittered backoff, circuit breakers** — fail fast,
  recover gracefully.
- **Idempotent, replayable pipelines** — content-addressed records, watermarks
  for late/stale data.

## Operability

Define **SLOs** + error budgets. Instrument first (metrics/traces/logs;
Prometheus/Grafana/OpenTelemetry). Design for the failure modes you'll actually
see: slow nodes (worse than dead), network partitions, clock skew, thundering
herds, cascading failure, poison messages.

## Design workflow

1. State the invariants + SLOs. 2. Estimate scale (QPS, data, growth).
3. Start with the simplest design that holds the invariants. 4. Add replication/
partitioning only where numbers force it. 5. Name every failure mode + its
mitigation. 6. Make it observable. 7. Write down the tradeoffs you chose and why.

Canon: DDIA (Kleppmann), system-design-primer, papers-we-love. Apply, don't cite.
