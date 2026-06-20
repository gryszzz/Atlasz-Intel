---
name: mitre-attack-detection
description: >-
  Defensive threat intelligence + detection engineering. Use to map adversary
  behavior to MITRE ATT&CK, assess detection coverage, and write/triage Sigma
  and YARA rules. Triggers: "ATT&CK technique", "map this TTP", "write a Sigma
  rule", "detection engineering", "threat intel", "coverage gap", "YARA".
---

# MITRE ATT&CK + detection engineering (defensive)

Purpose: turn observed/reported adversary behavior into mapped techniques and
durable detections. Defensive use only.

## ATT&CK data model

- **Tactics** = adversary goals (Initial Access, Execution, Persistence,
  Defense Evasion, C2, Exfiltration, Impact, …). The "why".
- **Techniques / sub-techniques** = the "how" (e.g. T1059.001 PowerShell).
- Each technique lists data sources, detections, mitigations, procedure examples.
- Machine-readable as **STIX 2.1** (mitre/cti, mitre-attack/attack-stix-data);
  visualize coverage with **ATT&CK Navigator** layers.

## Workflow: behavior → detection

1. **Observe** a behavior (log line, report, malware capability).
2. **Map** to the most specific technique/sub-technique. Map *behavior*, not
   tools (the tool changes; the technique persists — pyramid of pain).
3. **Find the data source** ATT&CK says reveals it (process creation, command
   line, network, registry, auth logs).
4. **Assess coverage** — do we collect that data source? Do we detect it?
5. **Write a detection** and rank by quality.

## Sigma (generic detection)

Vendor-neutral YAML → compiles to SIEM queries. Anatomy:
`title`, `status`, `logsource` (category/product/service), `detection`
(`selection` maps + `condition`), `falsepositives`, `level`, `tags:
[attack.t1059.001]`. Write the `condition` to match the *behavior*, keep
`selection` tight enough to limit FPs, and list real false positives honestly.

## YARA (file/memory signatures)

`rule Name { meta: … strings: $a = "…" $b = { 6A 40 68 } condition: $a and $b }`.
Prefer robust artifacts (code constructs, structural bytes) over brittle strings
(paths, hashes) so the rule survives recompilation.

## Detection quality

- **FP cost vs FN cost** — tune to the environment; a noisy rule gets muted.
- **Evasion-robustness** — would a trivial change bypass it? Detect the
  invariant, not the literal.
- **Provenance** — cite the technique ID + data source; track coverage as a
  Navigator layer so gaps are visible.

## Boundaries

Defensive only: detection, threat modeling, CTI analysis, hunting in environments
you operate. Not for building offensive payloads or evading others' defenses.
Pairs with [[lawful-intel-acquisition]] for public CTI feeds (MISP/OpenCTI).
