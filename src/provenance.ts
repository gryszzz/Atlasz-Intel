export const PROVENANCE_VALUES = [
  'simulated',
  'public-unauthenticated',
  'public-disclosure',
  'official-api',
  'rss-public',
  'local-derived',
  'local-computed',
  'math-derived',
  'local-model',
  'model-inferred',
  'auth-gated',
  'verified',
] as const

export type ProvenanceId = (typeof PROVENANCE_VALUES)[number]

export const PROVENANCE_LABEL: Record<ProvenanceId, string> = {
  simulated: 'simulated',
  'public-unauthenticated': 'public unauthenticated',
  'public-disclosure': 'public disclosure',
  'official-api': 'official API',
  'rss-public': 'RSS public',
  'local-derived': 'local derived',
  'local-computed': 'local computed',
  'math-derived': 'math derived',
  'local-model': 'local model',
  'model-inferred': 'model inferred',
  'auth-gated': 'auth gated',
  verified: 'verified',
}

const legacyProvenanceMap: Record<string, ProvenanceId> = {
  simulated: 'simulated',
  simulator: 'simulated',
  'public unauthenticated': 'public-unauthenticated',
  public_unauthenticated: 'public-unauthenticated',
  'public-unauthenticated': 'public-unauthenticated',
  'public disclosure': 'public-disclosure',
  public_disclosure: 'public-disclosure',
  'public-disclosure': 'public-disclosure',
  'official api': 'official-api',
  official_api: 'official-api',
  'official-api': 'official-api',
  'rss public': 'rss-public',
  rss_public: 'rss-public',
  'rss-public': 'rss-public',
  'local derived': 'local-derived',
  local_derived: 'local-derived',
  'local-derived': 'local-derived',
  'local computed': 'local-computed',
  local_computed: 'local-computed',
  'local-computed': 'local-computed',
  'math derived': 'math-derived',
  math_derived: 'math-derived',
  'math-derived': 'math-derived',
  'local model': 'local-model',
  local_model: 'local-model',
  'local-model': 'local-model',
  'model inferred': 'model-inferred',
  model_inferred: 'model-inferred',
  'model-inferred': 'model-inferred',
  authenticated: 'auth-gated',
  'auth gated': 'auth-gated',
  auth_gated: 'auth-gated',
  'auth-gated': 'auth-gated',
  verified: 'verified',
}

export function normalizeProvenance(value: unknown): ProvenanceId {
  if (typeof value !== 'string') {
    return 'local-derived'
  }
  return legacyProvenanceMap[value.trim().toLowerCase()] ?? 'local-derived'
}

export function isCanonicalProvenance(value: unknown): value is ProvenanceId {
  return typeof value === 'string' && (PROVENANCE_VALUES as readonly string[]).includes(value)
}
