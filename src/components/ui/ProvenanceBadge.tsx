import { PROVENANCE_LABEL, normalizeProvenance, type ProvenanceId } from '../../provenance'
import './ProvenanceBadge.css'

/**
 * Trust tier per provenance class. Tiers drive the badge's visual treatment so
 * derived / inferred / simulated data is visually impossible to mistake for
 * verified data (requirement: never make inferred/local data look verified).
 */
type TrustTier = 'verified' | 'trusted' | 'public' | 'observed' | 'derived' | 'inferred' | 'unavailable' | 'simulated'

const TRUST_TIER: Record<ProvenanceId, TrustTier> = {
  live: 'public',
  delayed: 'public',
  'stale-cache': 'derived',
  'offline-cache': 'derived',
  unavailable: 'unavailable',
  verified: 'verified',
  'official-api': 'trusted',
  'auth-gated': 'trusted',
  'public-disclosure': 'public',
  'rss-public': 'public',
  'public-unauthenticated': 'public',
  'media-observation': 'observed',
  'local-derived': 'derived',
  'local-computed': 'derived',
  'math-derived': 'derived',
  'local-model': 'derived',
  'model-inferred': 'inferred',
  simulated: 'simulated',
}

const TIER_DESCRIPTION: Record<TrustTier, string> = {
  verified: 'Verified — confirmed by a trusted source',
  trusted: 'Trusted — first-party or authenticated API',
  public: 'Public source — unverified',
  observed: 'Observed in media — not a verified event',
  derived: 'Derived locally — computed, not externally confirmed',
  inferred: 'Model inferred — uncertain, not confirmed',
  unavailable: 'Unavailable — no source data',
  simulated: 'Simulated — not real-world data',
}

export function ProvenanceBadge({
  value,
  size = 'md',
}: {
  value: string
  size?: 'sm' | 'md'
}) {
  const id = normalizeProvenance(value)
  const tier = TRUST_TIER[id]
  return (
    <span
      className={`prov-badge prov-${id} prov-tier-${tier} prov-size-${size}`}
      data-provenance={id}
      title={`${PROVENANCE_LABEL[id]} · ${TIER_DESCRIPTION[tier]}`}
    >
      <i className="prov-badge-dot" aria-hidden="true" />
      {PROVENANCE_LABEL[id]}
    </span>
  )
}
