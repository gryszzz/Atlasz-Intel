/*
 * Pure proof gate for NRC reactor status source-trail rendering (Layer 2).
 *
 * Renders only with a unit name, an ISO report date, a 0-100 power percent, an
 * official nrc.gov source URL, payload hash, official-api provenance, retrievedAt,
 * staleAt, and confidence >= 90. No proof -> not rendered, never faked.
 */
import type { NrcReactorStatus, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableReactorStatus(events: WorldIntelEvent[], limit = 120): NrcReactorStatus[] {
  const out: NrcReactorStatus[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const status = event.nrcReactorStatus
    if (!status) continue
    const proof =
      Boolean(status.unitName) &&
      /^\d{4}-\d{2}-\d{2}$/.test(status.reportDate) &&
      Number.isFinite(status.powerPercent) &&
      status.powerPercent >= 0 &&
      status.powerPercent <= 100 &&
      isNrcUrl(status.sourceUrl) &&
      Boolean(status.rawPayloadHash) &&
      Number.isFinite(status.retrievedAt) &&
      Number.isFinite(status.staleAt) &&
      status.provenance === 'official-api' &&
      status.confidence >= 90
    if (!proof || seen.has(status.id)) continue
    seen.add(status.id)
    out.push(status)
  }
  return out.sort((a, b) => a.unitName.localeCompare(b.unitName)).slice(0, limit)
}

function isNrcUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && /(^|\.)nrc\.gov$/i.test(parsed.hostname)
  } catch {
    return false
  }
}
