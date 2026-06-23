import type { IntelligenceSource } from './intelligenceSourceCatalog'

export type OpsecRiskLevel = 'low' | 'medium' | 'high' | 'blocked'

export type OpsecRiskCategory =
  | 'credentialed-source'
  | 'commercial-terms'
  | 'licensed-content'
  | 'personal-data'
  | 'submission-leakage'
  | 'internet-exposure'
  | 'malware-handling'
  | 'scraping-prohibited'
  | 'geospatial-sensitive'
  | 'reference-only'

export type SourceOpsecAssessment = {
  sourceId: string
  level: OpsecRiskLevel
  categories: OpsecRiskCategory[]
  requiresHumanReview: boolean
  reason: string
}

const personalDataSources = new Set(['linkedin', 'holehe', 'toutatis', 'theharvester', 'researchgate'])
const submissionLeakSources = new Set(['urlscan', 'virustotal', 'malwarebazaar-client'])
const internetExposureSources = new Set(['shodan', 'censys', 'bgp-he'])
const licensedContentSources = new Set(['reuters', 'associated-press', 'bloomberg', 'financial-times', 'wall-street-journal'])
const geospatialSensitiveSources = new Set(['planet', 'google-earth-engine', 'nasa-earthdata-geospatial', 'usgs-earth-explorer'])

export function assessSourceOpsec(source: IntelligenceSource): SourceOpsecAssessment {
  const categories = new Set<OpsecRiskCategory>()

  if (source.envKeysRequired.length > 0 || source.accessModel === 'auth-gated' || source.accessModel === 'public-requires-key') {
    categories.add('credentialed-source')
  }
  if (source.integrationMode === 'commercial-gated' || source.accessModel === 'commercial-gated') {
    categories.add('commercial-terms')
  }
  if (source.integrationMode === 'reference-only') {
    categories.add('reference-only')
  }
  if (source.feedTypes.includes('HTML') && source.integrationMode !== 'candidate-public-adapter') {
    categories.add('scraping-prohibited')
  }
  if (personalDataSources.has(source.sourceId)) {
    categories.add('personal-data')
  }
  if (submissionLeakSources.has(source.sourceId)) {
    categories.add('submission-leakage')
  }
  if (internetExposureSources.has(source.sourceId)) {
    categories.add('internet-exposure')
  }
  if (licensedContentSources.has(source.sourceId)) {
    categories.add('licensed-content')
  }
  if (source.sourceId === 'malwarebazaar-client') {
    categories.add('malware-handling')
  }
  if (geospatialSensitiveSources.has(source.sourceId)) {
    categories.add('geospatial-sensitive')
  }

  const level = riskLevelFor(source, categories)
  return {
    sourceId: source.sourceId,
    level,
    categories: [...categories].sort(),
    requiresHumanReview: level === 'high' || level === 'blocked',
    reason: reasonFor(level, [...categories]),
  }
}

export function sourcePassesDefaultOpsec(source: IntelligenceSource): boolean {
  const assessment = assessSourceOpsec(source)
  return assessment.level === 'low' || assessment.level === 'medium'
}

function riskLevelFor(source: IntelligenceSource, categories: Set<OpsecRiskCategory>): OpsecRiskLevel {
  if (source.integrationMode === 'blocked') {
    return 'blocked'
  }
  if (
    categories.has('personal-data') ||
    categories.has('submission-leakage') ||
    categories.has('malware-handling') ||
    categories.has('licensed-content') ||
    categories.has('commercial-terms')
  ) {
    return 'high'
  }
  if (
    categories.has('credentialed-source') ||
    categories.has('internet-exposure') ||
    categories.has('geospatial-sensitive') ||
    categories.has('scraping-prohibited')
  ) {
    return 'medium'
  }
  return 'low'
}

function reasonFor(level: OpsecRiskLevel, categories: OpsecRiskCategory[]): string {
  if (level === 'blocked') {
    return 'Blocked from default Atlasz runtime because it can create identity, authorization, or source-policy risk.'
  }
  if (level === 'high') {
    return `Requires human review before runtime use due to ${categories.join(', ')}.`
  }
  if (level === 'medium') {
    return `Allowed only through explicit adapter policy because it involves ${categories.join(', ')}.`
  }
  return 'Low OPSEC risk under normal public-source adapter rules.'
}
