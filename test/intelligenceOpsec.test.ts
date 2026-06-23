import { describe, expect, it } from 'vitest'
import { lookupIntelligenceSource } from '../src/intelligenceSourceCatalog'
import { assessSourceOpsec, sourcePassesDefaultOpsec } from '../src/intelligenceOpsec'

function source(id: string) {
  const value = lookupIntelligenceSource(id)
  if (!value) throw new Error(`missing source ${id}`)
  return value
}

describe('intelligence OPSEC policy', () => {
  it('blocks identity-enrichment and social-profile sources from default runtime', () => {
    for (const id of ['linkedin', 'holehe', 'toutatis']) {
      const assessment = assessSourceOpsec(source(id))

      expect(assessment.level).toBe('blocked')
      expect(assessment.requiresHumanReview).toBe(true)
      expect(assessment.categories).toContain('personal-data')
      expect(sourcePassesDefaultOpsec(source(id))).toBe(false)
    }
  })

  it('flags submission-leakage sources for human review', () => {
    for (const id of ['urlscan', 'virustotal', 'malwarebazaar-client']) {
      const assessment = assessSourceOpsec(source(id))

      expect(assessment.level).toBe('high')
      expect(assessment.requiresHumanReview).toBe(true)
      expect(assessment.categories).toContain('submission-leakage')
    }
  })

  it('treats official public feeds as default-passable low or medium risk', () => {
    for (const id of ['weather-gov', 'usgs-earthquake', 'bls-public-data-api', 'treasury-fiscal-data']) {
      const assessment = assessSourceOpsec(source(id))

      expect(['low', 'medium']).toContain(assessment.level)
      expect(sourcePassesDefaultOpsec(source(id))).toBe(true)
    }
  })

  it('keeps commercial/licensed sources behind review', () => {
    for (const id of ['marinetraffic', 'reuters', 'bloomberg', 'planet']) {
      const assessment = assessSourceOpsec(source(id))

      expect(assessment.level).toBe('high')
      expect(assessment.requiresHumanReview).toBe(true)
      expect(sourcePassesDefaultOpsec(source(id))).toBe(false)
    }
  })
})
