---
name: ai-agent-architecture
description: >-
  Design production AI agents and multi-agent systems (LangGraph / CrewAI / AG2 /
  Agno patterns). Use when building an agent loop, tool use, memory, planning,
  orchestration, or evals. Triggers: "build an agent", "agent loop", "tool use",
  "multi-agent", "LangGraph/CrewAI", "agent memory", "agent evals".
---

# AI agent architecture

An agent = **LLM (brain) + tools (hands) + state (memory) + a control loop**.
Most "agent" failures are engineering failures: bad tool contracts, no state,
no evals, no failure handling.

## Control loop

Reactive (ReAct: think→act→observe→repeat) is enough for most tasks. Use an
explicit **stateful graph** (LangGraph) when you need branching, retries,
human-in-the-loop, or resumable long runs. Keep the loop bounded (max steps,
budget) and make every step inspectable.

## Tool design (where the leverage is)

- One clear job per tool; precise typed schema; descriptive name + description
  (the model routes on these).
- **Errors as data** — return structured failures the model can reason about,
  don't throw.
- **Idempotent + side-effect-aware** — confirm before irreversible/outward
  actions; pass auth out-of-band, never via the model.
- Return *small, relevant* output; summarize big payloads before they hit context.

## Memory

- Short-term = the running transcript (manage the window; summarize/compact).
- Long-term = a store (vector/SQL/graph) the agent queries as a tool. Tag every
  memory with source + timestamp; recall is retrieval, not training.

## Multi-agent (only when it earns its keep)

A "crew" = specialized roles (researcher → analyst → verifier) with explicit
handoffs and a shared artifact. More agents = more coordination cost + failure
surface; prefer one good agent with good tools until you can't.

## Evaluation + reliability

- **Trace everything** (inputs, tool calls, outputs, cost, latency).
- Build an **eval set** of real tasks; measure success/regression — vibes don't
  scale.
- Guardrails: input/output validation, retries w/ backoff, fallbacks, timeouts,
  cost caps, and a hard "I don't know" path.

## Honesty (carry the Atlasz contract into agents)

Cite sources for every claim; no source → no claim. Label inferred vs verified.
Fail closed on missing/contradictory data. See [[lawful-intel-acquisition]].
