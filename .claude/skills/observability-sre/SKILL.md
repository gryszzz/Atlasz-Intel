---
name: observability-sre
description: >-
  Make systems observable and reliable — metrics, traces, logs, SLOs, alerting,
  and change monitoring (Prometheus, Grafana, OpenTelemetry, Sentry). Use for
  monitoring, incident readiness, and reliability. Triggers: "observability",
  "metrics/tracing", "SLO", "alerting", "monitor this", "incident".
---

# Observability & SRE

You can't improve (or trust) what you can't measure.

## Three signals

- **Metrics** (Prometheus) — cheap aggregates; rates/latencies/saturation. Use
  the **RED** (Rate/Errors/Duration) + **USE** (Utilization/Saturation/Errors)
  methods.
- **Traces** (OpenTelemetry) — request paths across services; find the slow hop.
- **Logs** (structured) — the detail for diagnosis. Sample high-volume.
Errors/crashes → Sentry. Dashboards → Grafana.

## SLOs + alerting

Define **SLIs** (what users feel: availability, latency) → **SLOs** (targets) →
**error budgets** (how much failure is OK). Alert on **symptoms / SLO burn**, not
every cause — page on user-visible pain, ticket the rest. Every alert must be
actionable + have a runbook, or it's noise that trains people to ignore alerts.

## Reliability practices

Health checks + heartbeats (changedetection.io/Healthchecks for external
state), graceful degradation, timeouts/retries/circuit breakers, and
**fail-closed honesty** (show `unavailable`, never fake data). Postmortems are
blameless and produce concrete fixes.

## For Atlasz

Source Health already does this for connectors (status/last-error/last-success).
Extend the same honest-status discipline to any new subsystem. See
[[distributed-systems-design]].
