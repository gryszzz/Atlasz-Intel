/*
 * Pure proof-gate for NVD CVE source-trail rendering. Kept separate from the
 * component so it stays unit-testable and fast-refresh clean.
 *
 * A CVE earns the right to render only with a complete source trail: valid CVE
 * ID, official NVD URL, source identity, retrieval timestamp, raw provenance
 * hash, and high confidence. Anything short of that is dropped, never repaired.
 */
import type { NvdCve, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableNvdCves(events: WorldIntelEvent[], limit = 6): NvdCve[] {
  const out: NvdCve[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const cve = event.nvdCve
    if (!cve) {
      continue
    }
    const earnsRender =
      /^CVE-\d{4}-\d{4,}$/.test(cve.cveId) &&
      /^https:\/\/nvd\.nist\.gov\/vuln\/detail\//.test(cve.sourceUrl) &&
      Boolean(cve.sourceIdentifier) &&
      Number.isFinite(cve.retrievedAt) &&
      Boolean(cve.rawPayloadHash) &&
      cve.confidence >= 90
    if (!earnsRender || seen.has(cve.cveId)) {
      continue
    }
    seen.add(cve.cveId)
    out.push(cve)
  }
  return out.sort((a, b) => b.lastModifiedTimestamp - a.lastModifiedTimestamp).slice(0, limit)
}
