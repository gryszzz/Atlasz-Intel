import { describe, expect, it } from 'vitest'
import {
  ATLASZ_DEFENSIVE_IMPROVEMENTS,
  DEFENSIVE_ENGINEERING_RULES,
  DEFENSIVE_SECURITY_STUDIES,
  defensiveStudyIsDefaultRuntimeEligible,
  defensiveStudyRequiresHumanReview,
  lookupDefensiveSecurityStudy,
  studiesForDefensiveDomain,
  summarizeDefensiveSecurityEngineering,
  type DefensiveSecurityDomainId,
} from '../src/defensiveSecurityEngineering'

const requiredDomains: DefensiveSecurityDomainId[] = [
  'cybersecurity-master-lists',
  'threat-intelligence-cti',
  'detection-engineering',
  'soc-siem-security-monitoring',
  'dfir-forensics',
  'malware-reverse-engineering',
  'internet-mapping-authorized-recon',
  'osint-collection',
  'opsec-privacy-hardening',
  'cloud-security',
  'container-kubernetes-security',
  'supply-chain-security',
  'software-engineering-system-design',
  'production-systems',
  'data-engineering-realtime',
  'search-retrieval-vector',
  'knowledge-graph-entity-resolution',
  'intelligence-ui-dashboards',
  'agent-engineering',
]

function study(id: string) {
  const value = lookupDefensiveSecurityStudy(id)
  if (!value) throw new Error(`missing defensive security study ${id}`)
  return value
}

describe('defensive security engineering corpus', () => {
  it('covers the attached repository families with source trails and study depth', () => {
    for (const domain of requiredDomains) {
      expect(studiesForDefensiveDomain(domain).length).toBeGreaterThan(0)
    }

    for (const item of DEFENSIVE_SECURITY_STUDIES) {
      expect(item.upstreamUrls.length).toBeGreaterThan(0)
      for (const url of item.upstreamUrls) {
        expect(url).toMatch(/^https:\/\//)
      }
      expect(item.architectures.length).toBeGreaterThan(0)
      expect(item.workflows.length).toBeGreaterThan(0)
      expect(item.dataModels.length).toBeGreaterThan(0)
      expect(item.securityModels.length).toBeGreaterThan(0)
      expect(item.failureModes.length).toBeGreaterThan(0)
      expect(item.testingMethods.length).toBeGreaterThan(0)
      expect(item.antiPatterns.length).toBeGreaterThan(0)
      expect(item.atlaszImprovementPlan.length).toBeGreaterThan(0)
    }
  })

  it('keeps active recon, malware, and person-enrichment out of default runtime', () => {
    for (const id of ['internet-mapping-authorized-recon', 'malware-reverse-engineering', 'osint-collection']) {
      expect(defensiveStudyIsDefaultRuntimeEligible(study(id))).toBe(false)
    }

    expect(study('internet-mapping-authorized-recon')).toMatchObject({
      policy: 'authorized-lab-only',
      riskTags: expect.arrayContaining(['active-recon']),
    })
    expect(study('malware-reverse-engineering')).toMatchObject({
      policy: 'authorized-lab-only',
      riskTags: expect.arrayContaining(['malware-handling']),
    })
    expect(study('osint-collection')).toMatchObject({
      policy: 'reference-only',
      riskTags: expect.arrayContaining(['personal-data']),
    })
  })

  it('requires human review for auth-gated and authorized-lab families', () => {
    for (const id of ['threat-intelligence-cti', 'cloud-security', 'container-kubernetes-security', 'dfir-forensics']) {
      expect(defensiveStudyRequiresHumanReview(study(id))).toBe(true)
    }

    expect(defensiveStudyRequiresHumanReview(study('detection-engineering'))).toBe(false)
  })

  it('codifies reusable engineering rules with concrete tests', () => {
    expect(DEFENSIVE_ENGINEERING_RULES.length).toBeGreaterThanOrEqual(5)

    for (const rule of DEFENSIVE_ENGINEERING_RULES) {
      expect(rule.rule.length).toBeGreaterThan(20)
      expect(rule.rationale.length).toBeGreaterThan(20)
      expect(rule.implementationNote.length).toBeGreaterThan(20)
      expect(rule.regressionTests.length).toBeGreaterThan(0)
    }

    expect(DEFENSIVE_ENGINEERING_RULES.map((rule) => rule.id)).toEqual(
      expect.arrayContaining(['provenance-before-analysis', 'authorized-scope-for-active-tools', 'retrieval-is-not-truth']),
    )
  })

  it('defines Atlasz-specific improvement plans without enabling unsafe features', () => {
    expect(ATLASZ_DEFENSIVE_IMPROVEMENTS.length).toBeGreaterThanOrEqual(5)

    for (const improvement of ATLASZ_DEFENSIVE_IMPROVEMENTS) {
      expect(improvement.title.length).toBeGreaterThan(10)
      expect(improvement.implementationNotes.length).toBeGreaterThan(0)
      expect(improvement.validationTests.length).toBeGreaterThan(0)
    }

    expect(ATLASZ_DEFENSIVE_IMPROVEMENTS.find((item) => item.id === 'authorized-lab-mode-design')).toMatchObject({
      priority: 'later',
      sourceDomainIds: expect.arrayContaining(['internet-mapping-authorized-recon']),
    })
  })

  it('summarizes defensive posture for future Data Core and governance panels', () => {
    const summary = summarizeDefensiveSecurityEngineering()

    expect(summary.studyCount).toBe(DEFENSIVE_SECURITY_STUDIES.length)
    expect(summary.ruleCount).toBe(DEFENSIVE_ENGINEERING_RULES.length)
    expect(summary.improvementCount).toBe(ATLASZ_DEFENSIVE_IMPROVEMENTS.length)
    expect(summary.defaultRuntimeEligibleCount).toBeLessThan(summary.studyCount)
    expect(summary.humanReviewCount).toBeGreaterThan(5)
    expect(summary.byPolicy['authorized-lab-only']).toBeGreaterThanOrEqual(5)
    expect(summary.byDomain['detection-engineering']).toBe(1)
  })
})
