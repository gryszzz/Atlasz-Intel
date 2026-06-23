/*
 * Rule-based CPC -> curated technology mapping.
 *
 * Maps a patent's CPC classification (by subclass, e.g. "H01L") to a curated seed
 * entity id, so a real patent can activate the patents/tech exposure chain. This
 * is deliberately CONSERVATIVE and RULE-BASED: only a handful of subclasses with a
 * defensible 1:1 mapping are included. It is NOT verification of the curated seed
 * relationships — it only says "this patent's classification corresponds to this
 * technology area." Unmapped subclasses stay unmapped (never guessed).
 */

type CpcRule = { entityId: string; label: string; note: string }

// CPC subclass (section+class+subclass, e.g. "H01L") -> seed entity id.
const CPC_SUBCLASS_MAP: Record<string, CpcRule> = {
  // Semiconductor devices -> semiconductors sector.
  H01L: { entityId: 'sector:semiconductors', label: 'Semiconductors', note: 'CPC H01L (semiconductor devices) corresponds to the semiconductor sector.' },
  // Computing based on specific computational models (neural networks) -> AI accelerators.
  G06N: { entityId: 'technology:ai-accelerators', label: 'AI accelerators', note: 'CPC G06N (computing based on specific models, incl. neural networks) corresponds to AI accelerator technology.' },
  // Power conversion (inverters/converters) -> power semiconductors / power electronics.
  H02M: { entityId: 'technology:power-semiconductors', label: 'Power semiconductors', note: 'CPC H02M (power conversion) corresponds to power-electronics / power-semiconductor technology.' },
  // Grid energy storage / battery systems -> grid storage.
  H02J: { entityId: 'technology:grid-storage', label: 'Grid storage', note: 'CPC H02J (power supply/distribution incl. battery/grid systems) corresponds to grid-storage technology.' },
  // Liquefaction of gases -> LNG liquefaction technology.
  F25J: { entityId: 'technology:lng-liquefaction-technology', label: 'LNG liquefaction technology', note: 'CPC F25J (liquefaction of gases) corresponds to LNG liquefaction technology.' },
}

/** Extract the CPC subclass (e.g. "G06F12/00" -> "G06F"); empty if unrecognizable. */
export function cpcSubclass(cpc: string): string {
  const match = cpc.toUpperCase().replace(/\s+/g, '').match(/^([A-HY]\d{2}[A-Z])/)
  return match ? match[1] : ''
}

export type CpcMapping = { cpc: string; subclass: string; entityId: string; label: string; note: string }

export function cpcToSeedEntity(cpc: string): CpcMapping | undefined {
  const subclass = cpcSubclass(cpc)
  const rule = CPC_SUBCLASS_MAP[subclass]
  return rule ? { cpc, subclass, ...rule } : undefined
}

/** Map a list of CPC codes to curated seed entities, deduped by entity id. */
export function mapCpcCodes(codes: string[]): CpcMapping[] {
  const seen = new Set<string>()
  const out: CpcMapping[] = []
  for (const cpc of codes) {
    const mapping = cpcToSeedEntity(cpc)
    if (mapping && !seen.has(mapping.entityId)) {
      seen.add(mapping.entityId)
      out.push(mapping)
    }
  }
  return out
}
