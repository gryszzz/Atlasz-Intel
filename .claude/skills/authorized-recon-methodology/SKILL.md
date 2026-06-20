---
name: authorized-recon-methodology
description: >-
  Attack-surface mapping and external recon for AUTHORIZED security work only —
  assets you own or a signed, in-scope engagement. Use for passive/active recon
  with ProjectDiscovery (subfinder/dnsx/httpx/naabu/nuclei) and Amass within
  authorization. Triggers: "attack surface", "recon", "subdomain enum",
  "authorized pentest", "know my exposure".
---

# Authorized recon methodology

Purpose: understand the external attack surface of systems **you own or are
explicitly authorized to test**, so you can reduce exposure.

## Authorization gate (first, always)

Before any active step, confirm: written authorization, exact in-scope assets
(domains/IPs/ASNs), out-of-scope exclusions, rules of engagement, rate limits,
and a point of contact. **No authorization → passive public data only, and never
against assets you don't control.** This skill is not for targeting third parties.

## Passive first (no packets at the target)

- Certificate transparency logs, public DNS, ASN/WHOIS, public datasets.
- `amass enum -passive`, public sources. Low-noise, no ToS issues.
- Build the asset inventory before touching anything.

## Active (only inside scope, rate-limited)

Pipeline: `subfinder` (subdomains) → `dnsx` (resolve) → `httpx` (live hosts,
titles, tech) → `naabu` (ports, conservative rate) → `nuclei` (known-CVE/
misconfig templates). Respect the engagement's rate limits and timing windows;
log every action with timestamps for the report.

## Evidence + reporting

Timestamp and store raw output; preserve the exact commands. Report = inventory,
findings ranked by real risk, reproduction steps, and remediation. The deliverable
is **reduced exposure**, not a trophy list.

## Hard stops

No unauthorized targets, no people-targeting/personal-data enumeration, no
evasion of others' controls, no exploitation beyond agreed scope, no DoS. If a
request drifts outside written authorization, stop and re-scope. Defensive intent
governs; see [[lawful-intel-acquisition]] for the public-data boundary.
