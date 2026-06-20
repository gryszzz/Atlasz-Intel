---
name: data-pipeline-orchestration
description: >-
  Design reliable data pipelines / ELT — orchestration (Airflow/Dagster/Prefect),
  idempotency, incremental loads, scheduling, and data quality. Use for ingestion,
  transformation, and scheduled jobs. Triggers: "data pipeline", "ELT/ETL",
  "Airflow/Dagster/Prefect", "schedule a job", "incremental load", "data quality".
---

# Data pipeline orchestration

Move data from sources to a usable store, reliably and reproducibly. Match the
tool to the scale — a local app needs a scheduler + idempotent jobs, **not**
Airflow.

## Core properties (non-negotiable)

- **Idempotent** — re-running a step yields the same result (safe retries,
  backfills). Content-addressed records + upserts, not blind appends.
- **Incremental** — load only what changed (watermarks/cursors); full reloads are
  a last resort.
- **Observable** — every run logs status, counts, duration, last-success; failures
  are visible, not silent. See [[observability-sre]].
- **Provenance preserved** — source URL + timestamp + raw evidence on every
  record. See [[atlasz-source-wiring]].

## Orchestration

- **Airflow** — mature, cron-like DAGs, big ecosystem (heavy).
- **Dagster** — asset-centric, typed, strong local dev + testing.
- **Prefect** — Pythonic, dynamic flows.
- **Airbyte/Singer/Meltano** — pre-built EL connectors (extract+load).
- Right-sized for Atlasz: the **provider registry + discovery + poll loops + SQLite**
  *are* the pipeline. Don't add an orchestrator to a desktop app.

## Data quality

Validate schema/ranges on ingest; **dedup**; detect + label **stale** data
(`stale-cache`/`unavailable`), never fabricate gaps. Quarantine bad records;
alert on freshness SLO breaches. A pipeline that silently passes garbage is worse
than one that's down.
