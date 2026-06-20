---
name: networking-fundamentals
description: >-
  Reason about networks from first principles — TCP/IP, DNS, TLS, HTTP, routing/
  BGP, and packet/flow analysis (Wireshark). Use to debug connectivity, latency,
  and protocol behavior. Triggers: "network debug", "DNS/TLS issue", "packet
  capture", "why is this slow", "BGP/routing", "Wireshark".
---

# Networking fundamentals

Mental model for how bytes actually move — for debugging and design.

## The stack (what to check, in order)

1. **Link/IP** — reachability, MTU, IP/subnet, NAT.
2. **Transport** — TCP (handshake, retransmits, window, Nagle) vs UDP; ports.
3. **DNS** — resolution path, records, TTL/caching, propagation (often the real
   bug). CoreDNS in clusters.
4. **TLS** — handshake, cert chain/SNI/validity, version/cipher (frequent
   failure point).
5. **HTTP** — methods, status, headers, keep-alive, redirects, proxies (Envoy).
6. **Routing/BGP** — ASN paths, peering, anycast (bgp.he.net, Cloudflare Radar
   for internet-wide views).

## Debugging method

Work the stack bottom-up or bisect: can you resolve? connect? TLS-handshake?
get a response? `ping`/`traceroute`/`dig`/`curl -v`/`openssl s_client`, then
**Wireshark/tcpdump** to see the actual packets. Latency = propagation + queuing
+ processing; find which.

## Design implications

Timeouts < user patience; retries with jittered backoff; connection pooling;
DNS TTLs for failover; TLS everywhere; understand where caching/CDN sits. See
[[distributed-systems-design]], [[observability-sre]].

## Boundaries

Analyze networks/traffic you own or are authorized to. Capture is read-only and
scoped.
