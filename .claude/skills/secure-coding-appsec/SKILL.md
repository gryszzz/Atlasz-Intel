---
name: secure-coding-appsec
description: >-
  Build and review applications securely — OWASP Top 10, input/output handling,
  authn/z, secrets, dependencies, and threat modeling. Use when writing or
  reviewing code that handles untrusted input, auth, or data. Triggers: "security
  review", "is this safe", "OWASP", "injection/XSS", "auth", "threat model".
---

# Secure coding & AppSec

Defensive engineering: ship code that resists abuse.

## OWASP Top 10 reflexes

- **Injection** (SQL/command/LDAP) — parameterized queries; never concatenate
  untrusted input into a query/command.
- **XSS** — context-aware output encoding; CSP; treat all rendered data as
  untrusted.
- **Broken access control** — enforce authz server-side on every request; deny by
  default; no trusting the client.
- **Auth failures** — strong hashing (Argon2/bcrypt), MFA, session hardening.
- **SSRF / path traversal** — allowlist + validate URLs/paths.
- **Crypto failures** — see [[cryptography-engineering]].
- **Vulnerable dependencies** — pin + scan (SCA); patch.
- **Security misconfig / logging gaps** — secure defaults, audit logging.

## Practices

- **Validate input, encode output**, at trust boundaries. Fail closed.
- **Least privilege** everywhere (tokens, DB users, file access).
- **Secrets** from env/secret-manager, never in code/git; rotate.
- **Threat model** early: what's the trust boundary, what can an attacker
  control, what's the worst case (STRIDE).

## Review workflow

Diff the untrusted-input paths first; check authz on every new endpoint; verify
no secrets/PII in logs; confirm errors fail closed and don't leak internals.
Reference OWASP Cheat Sheet Series + Top Ten. Defensive use only.
