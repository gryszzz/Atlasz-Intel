---
name: network-security-monitoring
description: >-
  Defensive network security monitoring (NSM) with Zeek, Suricata, Arkime, and
  Security Onion on networks you operate. Use for sensor placement, log/protocol
  analysis, IDS rules, and detection. Triggers: "network monitoring", "Zeek/
  Suricata", "IDS rule", "packet/flow analysis", "detect lateral movement".
---

# Network security monitoring (defensive)

Visibility into traffic on **networks you operate** to detect intrusions.

## The NSM stack

- **Zeek** — protocol-aware logging (conn, dns, http, ssl, files…). Turns packets
  into rich, queryable metadata; great for hunting + behavioral analytics.
- **Suricata** — signature + protocol IDS/IPS; runs ET/community rules, emits
  EVE JSON alerts; can extract files.
- **Arkime** — full-packet capture + indexed session search (the "DVR").
- **Security Onion** — distro that integrates Zeek + Suricata + Elastic +
  dashboards; fastest path to a working sensor.

## Deploy

Sensor at the **network boundary + key internal chokepoints** via SPAN/TAP.
Capture is read-only. Tune for the asset value vs storage you can afford
(full-pcap is expensive; Zeek logs are cheap and often enough).

## Detect

- **Signatures** (Suricata) for known-bad; **behavioral** (Zeek + analytics) for
  unknowns — beaconing (regular C2 intervals), DNS tunneling (entropy/volume),
  lateral movement, data staging/exfil (large egress to new dests).
- Map detections to ATT&CK; track coverage. See [[mitre-attack-detection]].
- Tune false positives relentlessly or analysts go blind.

## Boundaries

Monitor only networks you own/operate. No interception of others' traffic, no
deployment without authorization. Defensive use only.
