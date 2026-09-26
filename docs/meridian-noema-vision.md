# Meridian + NOEMA: connected intelligence

Status: implementation roadmap, September 26, 2026. Capabilities below are targets
unless explicitly marked implemented. The repositories, databases, release cycles,
and execution permissions remain independent.

## Product promise

Explore a changing world in Meridian. Ask a precise question. Let NOEMA investigate
within a bounded scope. Inspect the evidence, competing explanations, missing
information, and eventual outcomes in the same workspace.

Meridian owns source ingestion, entity and relationship context, geographic
exploration, source health, and the human investigation workspace. Hermes collects;
Aegis evaluates trust; Worldwatch ranks relevance. NOEMA owns research tasks,
research memory, explicit hypotheses, supported forecasts, evaluation, and resource
budgets. A local versioned protocol connects them.

## The first complete workflow

1. Select an event, facility, company, or region in Meridian.
2. Ask a question with a scope, time horizon, and research budget.
3. Freeze the evidence available at submission time; retain original source IDs.
4. NOEMA validates the request, creates a durable task, and records a plan.
5. Authorized collectors retrieve primary evidence; unknowns remain unknown.
6. NOEMA returns cited findings, counterevidence, competing explanations, and next checks.
7. Meridian displays the result beside the selected system and its source trails.
8. Save the investigation; revisit it when new evidence arrives.
9. Where an independently supported forecasting model applies, record a separate
   immutable forecast and score it only against later outcomes.

A region-to-company connection must have documented ownership or exposure evidence.
Geographic proximity alone cannot establish operational or financial impact.

## Delivery sequence and acceptance gates

### 1. Evidence transfer and review — implemented in this change

Meridian exports one selected source excerpt and a user question. NOEMA validates
its version, bounds, timestamps, and transfer hash; stores a separate idempotent
review audit; returns a deterministic evidence checklist. Meridian imports only a
review tied to the exported request and labels it analysis.

Acceptance: TypeScript export -> Python CLI -> TypeScript import; Unicode hash
agreement; corrupted/mismatched packets rejected; media and stale-cache labels
preserved; no model calls, network requests, wallet access, or forecast writes.

This is a file handoff, not an autonomous investigation. The UI session must remain
open. The first review explicitly leaves the question unanswered by new collection.
See `meridian-noema-contract.md` for the transfer contract and limitations.

### 2. Durable research jobs

Add request submission, task status, cancellation, and result retrieval behind a
localhost authenticated service. Persist queued/running/blocked/completed/failed/
cancelled states, leases, retry budgets, and append-only task events. A restart
resumes safely without duplicate collection or budget charges. Support reconnecting
Meridian to an existing task, with export/import retained for offline operation.

Acceptance: process crash/restart, duplicate submissions, expired lease, cancelled
job, missing service, and protocol-version mismatch all have tested outcomes.
No public dashboard exposure is required. Remote deployment is a separate design.

### 3. A real investigation loop

Start with one narrow domain and explicit collector tools. Turn a question into
bounded checks, collect primary records, preserve observation/retrieval/availability
times, test alternative explanations, and produce a cited research result. Reuse
NOEMA's model budgets where optional reasoning adds value; the model cannot grant
itself tools or spending authority. Source content is untrusted data.

Acceptance: each factual claim cites admissible evidence; contradictions are shown;
unsupported claims are rejected; exhausted budgets return a partial result with
unknowns; no tool call follows instructions embedded in a source document.

### 4. One Meridian investigation workspace

Bring source trails, entity dossiers, connector activation, conflicts, and saved
investigations into the default globe shell. Implement working search/fly-to and
progressive layer selection/aggregation across semantic zoom levels. Show the
reason for empty coverage and stale evidence. Keep maps responsive through visible
entity budgets and progressive loading.

Acceptance: world -> event -> entity -> source -> research -> saved investigation is
usable without the legacy interface; keyboard navigation, narrow-screen layout,
loading, failure, empty, and stale states receive GUI smoke checks.

### 5. Prospective learning

Build on NOEMA's existing paper-research work (draft PR #21 at planning time).
Do not duplicate its settlement, fee, or paper-quote changes. Add independent domain
models only with timestamp-correct inputs, resolution-rule checks, versioned
features, same-snapshot baseline comparisons, and later resolved outcomes.

Acceptance: out-of-sample evaluation with event-level accounting, calibration,
costs, missing outcomes, and sample limitations visible. Imported Meridian excerpts
are ineligible for forecasts until their original availability and source integrity
are independently established. A present-day export cannot supply past knowledge.

### 6. Operational release

Package a repeatable local setup, connection diagnostics, backup/restore, retention,
resource limits, and visible health. Verify desktop GUI flows and deployment paths.
Update old Atlasz naming where it affects installation or routing. Establish a
sustained observation run with evidence of restart recovery and stable costs.

Acceptance: a fresh checkout can reproduce the workflow; tests and builds pass;
backups restore; disconnected components degrade honestly; operating costs and
unresolved source gaps are reported.

## Non-negotiable integration rules

- Preserve source provenance; NOEMA analysis never becomes a new corroborating source.
- Transfer hashes detect changes; they do not establish author identity or truth.
- Keep raw source hashes distinct from hashes of exported excerpts.
- Never infer retrieval time from export time or event time.
- Make confidence scales and freshness policy explicit before mapping them.
- Use stable identifiers; no fuzzy company matching across repositories.
- Keep credentials out of packets, logs, and model context.
- File transfer has no live execution or money movement capability.
- Keep both applications useful when the other is unavailable.

## What finished means

The first integrated release is finished when a real investigation can be submitted,
resumed, inspected, and revisited with complete evidence lineage and measured cost.
Broader autonomy is earned through demonstrated research quality and prospective
evaluation. Software completion does not establish profitability or self-funding.
