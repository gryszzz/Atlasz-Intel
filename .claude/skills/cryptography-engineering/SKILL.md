---
name: cryptography-engineering
description: >-
  Use cryptography correctly — pick vetted primitives/libraries, manage keys, and
  avoid the classic footguns. Use for encryption, signing, hashing, TLS, and
  secrets handling. Triggers: "encrypt", "sign/verify", "hashing", "key
  management", "TLS", "crypto library", "secure storage".
---

# Cryptography engineering

The first rule: **don't roll your own crypto.** Use vetted libraries and standard
constructions; the danger is almost always in the engineering around them.

## Use vetted building blocks

- **libsodium** (NaCl) — safe, high-level defaults (secretbox, box, sign). First
  choice.
- **OpenSSL/BoringSSL** — TLS + lower-level primitives (more footguns).
- AEAD (AES-GCM, ChaCha20-Poly1305) for confidentiality+integrity; Argon2/scrypt/
  bcrypt for passwords; Ed25519 for signatures; SHA-256/BLAKE2 for hashing.

## Footguns to avoid

- Nonce/IV reuse (catastrophic for GCM); use random/counter correctly.
- ECB mode, MD5/SHA-1 for security, custom "encryption", encrypt-without-auth.
- Non-constant-time comparison of secrets/MACs (timing leaks).
- Weak/biased randomness — use the OS CSPRNG.
- Confusing **encryption** (confidentiality) with **signing/MAC** (integrity/
  authenticity) — you usually need both.

## Key & secret management

Generate with a CSPRNG; store in a secrets manager/keychain, **never in code or
git**; rotate; separate keys per purpose; least-privilege access. Atlasz rule:
credentials come from env only, never through the model/UI.

## TLS / transport

Verify certificates (don't disable), modern versions/ciphers, HSTS. For crypto
*assets* (e.g. bitcoin/secp256k1) the same applies — use audited libs, guard the
keys. See [[secure-coding-appsec]].
