import { describe, expect, it } from 'vitest'
import {
  DEFENSIVE_ENGINEERING_PRIORITIES,
  DEFENSIVE_SECURITY_CORPUS,
  defensiveEntriesByRiskTag,
  defensiveEntryPassesDefaultPolicy,
  entriesForDefensiveDomain,
  lookupDefensiveCorpusEntry,
  summarizeDefensiveCorpus,
  type DefensiveDomainId,
} from '../src/defensiveSecurityCorpus'

const requiredDomains: DefensiveDomainId[] = [
  'cti-platform',
  'cti-data-model',
  'detection-engineering',
  'soc-siem-endpoint',
  'dfir-forensics',
  'malware-reverse-engineering',
  'recon-discovery',
  'osint-collection',
  'opsec-hardening',
  'cloud-security-posture',
  'container-k8s-security',
  'supply-chain-integrity',
  'streaming-eventing',
  'search-retrieval',
  'graph-visualization',
  'agent-engineering',
]

function entry(id: string) {
  const value = lookupDefensiveCorpusEntry(id)
  if (!value) throw new Error(`missing defensive corpus entry ${id}`)
  return value
}

describe('defensive security corpus', () => {
  it('covers every defensive-security, detection, DFIR, cloud, and supply-chain domain', () => {
    for (const domain of requiredDomains) {
      expect(entriesForDefensiveDomain(domain).length).toBeGreaterThan(0)
    }
    expect(DEFENSIVE_SECURITY_CORPUS.length).toBeGreaterThan(50)
  })

  it('keeps every entry source-trailed and policy-labeled', () => {
    const ids = new Set<string>()
    for (const item of DEFENSIVE_SECURITY_CORPUS) {
      expect(ids.has(item.id)).toBe(false)
      ids.add(item.id)
      expect(item.label.length).toBeGreaterThan(1)
      expect(item.upstreamUrl).toMatch(/^https:\/\//)
      expect(item.riskTags.length).toBeGreaterThan(0)
      expect(item.capabilities.length).toBeGreaterThan(0)
      expect(item.blockedUses.length).toBeGreaterThan(0)
      expect(item.engineeringLesson.length).toBeGreaterThan(20)
    }
  })

  it('encodes the requested defensive engineering priorities', () => {
    expect(DEFENSIVE_ENGINEERING_PRIORITIES).toEqual([
      'defensive-security',
      'source-validation',
      'real-time-data',
      'evidence-trails',
      'observability',
      'entity-relationships',
      'reliable-engineering',
    ])
  })

  it('keeps active scanning, endpoint agents, malware RE, and forensic acquisition out of default runtime', () => {
    for (const id of [
      'censys-python',
      'wazuh',
      'osquery',
      'velociraptor',
      'sleuthkit',
      'plaso',
      'grr',
      'ghidra',
      'radare2',
      'retdec',
      'binwalk',
      'kube-hunter',
    ]) {
      expect(defensiveEntryPassesDefaultPolicy(entry(id))).toBe(false)
      expect(entry(id).runtimePolicy).toMatch(/^(authorized-lab-only|auth-required|blocked)$/)
      expect(entry(id).blockedUses.length).toBeGreaterThan(0)
    }
  })

  it('blocks person-enrichment OSINT tooling from runtime entirely', () => {
    for (const id of ['sherlock', 'holehe', 'toutatis']) {
      expect(entry(id).runtimePolicy).toBe('blocked')
      expect(entry(id).riskTags).toContain('person-enrichment')
      expect(entry(id).blockedUses.join(' ')).toMatch(/person|identity|account|enrichment|email/i)
    }
    expect(defensiveEntriesByRiskTag('person-enrichment').every((item) => item.runtimePolicy === 'blocked')).toBe(true)
  })

  it('treats CTI platforms as auth-gated and never verified by default', () => {
    for (const id of ['opencti', 'misp', 'yeti', 'opentaxii', 'dependency-track']) {
      expect(entry(id).runtimePolicy).toBe('auth-required')
      expect(defensiveEntryPassesDefaultPolicy(entry(id))).toBe(false)
    }
    expect(entry('opencti').blockedUses.join(' ')).toMatch(/verified ground truth/i)
  })

  it('keeps supply-chain, detection, and SBOM references available as study material without upgrading them to truth', () => {
    for (const id of [
      'syft',
      'trivy',
      'grype',
      'sigstore-cosign',
      'in-toto',
      'slsa',
      'ossf-scorecard',
      'elastic-detection-rules',
      'splunk-security-content',
      'cloudsplaining',
    ]) {
      expect(defensiveEntryPassesDefaultPolicy(entry(id))).toBe(true)
      expect(entry(id).engineeringLesson).not.toMatch(/verified ground truth/i)
    }
    // "verified" is reserved for cryptographically/auditably proven pipelines.
    expect(entry('sigstore-cosign').engineeringLesson).toMatch(/verified/i)
    expect(entry('trivy').blockedUses.join(' ')).toMatch(/proof of safety/i)
  })

  it('summarizes posture so Data Core surfaces can show default-safe vs gated counts', () => {
    const summary = summarizeDefensiveCorpus()
    expect(summary.entryCount).toBe(DEFENSIVE_SECURITY_CORPUS.length)
    expect(summary.defaultSafeCount).toBeLessThan(summary.entryCount)
    expect(summary.defaultSafeCount).toBeGreaterThan(15)
    expect(summary.byPolicy['authorized-lab-only']).toBeGreaterThanOrEqual(8)
    expect(summary.byPolicy.blocked).toBeGreaterThanOrEqual(3)
    expect(summary.byPolicy['auth-required']).toBeGreaterThanOrEqual(5)
    expect(summary.byDomain['supply-chain-integrity']).toBeGreaterThanOrEqual(6)
    expect(summary.byDomain['detection-engineering']).toBeGreaterThanOrEqual(5)
  })
})
