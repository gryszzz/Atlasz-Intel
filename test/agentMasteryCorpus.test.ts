import { describe, expect, it } from 'vitest'
import {
  AGENT_MASTERY_CORPUS,
  ANALYST_MENTAL_MODEL_DIMENSIONS,
  entriesForMasteryDomain,
  lookupMasteryCorpusEntry,
  masteryEntryPassesDefaultCorpusPolicy,
  summarizeMasteryCorpus,
  type MasteryDomainId,
} from '../src/agentMasteryCorpus'

const requiredDomains: MasteryDomainId[] = [
  'opsec-privacy',
  'threat-intelligence',
  'network-intelligence',
  'internet-mapping',
  'malware-analysis',
  'engineering-architecture',
  'engineering-judgment',
  'ai-agent-engineering',
  'intelligence-analysis',
  'decision-analysis',
  'intelligence-tradecraft',
  'computer-science-systems',
  'distributed-systems-databases',
  'linux-operating-systems',
  'networking-infrastructure',
  'security-engineering',
  'cryptography',
  'infrastructure-reliability',
  'ai-systems-engineering',
  'scraping-crawling',
  'web-data-extraction',
  'api-automation',
  'data-pipelines',
  'search-indexing',
  'knowledge-graph-entity-resolution',
  'documents-ocr',
  'market-financial-data',
  'economics-incentives',
  'historical-reference',
  'geospatial-satellite-maps',
  'monitoring-alerts',
]

function entry(id: string) {
  const value = lookupMasteryCorpusEntry(id)
  if (!value) throw new Error(`missing mastery corpus entry ${id}`)
  return value
}

describe('agent mastery corpus', () => {
  it('covers the requested acquisition, security, systems, and intelligence domains', () => {
    for (const domain of requiredDomains) {
      expect(entriesForMasteryDomain(domain).length).toBeGreaterThan(0)
    }

    expect(AGENT_MASTERY_CORPUS.length).toBeGreaterThan(120)
  })

  it('keeps every entry source-trailed and policy-labeled', () => {
    const ids = new Set<string>()

    for (const corpusEntry of AGENT_MASTERY_CORPUS) {
      expect(ids.has(corpusEntry.id)).toBe(false)
      ids.add(corpusEntry.id)
      expect(corpusEntry.label.length).toBeGreaterThan(1)
      expect(corpusEntry.upstreamUrl).toMatch(/^https:\/\//)
      expect(corpusEntry.capabilities.length).toBeGreaterThan(0)
      expect(corpusEntry.blockedUses.length).toBeGreaterThan(0)
      expect(corpusEntry.engineeringLesson.length).toBeGreaterThan(20)
    }
  })

  it('captures the lawful data-acquisition stack without making it default automation', () => {
    for (const id of ['crawl4ai', 'playwright', 'airbyte', 'openbb', 'changedetection']) {
      expect(entry(id).runtimePolicy).toMatch(/^(manual-review|study-only)$/)
      expect(masteryEntryPassesDefaultCorpusPolicy(entry(id))).toBe(id === 'airbyte' || id === 'openbb')
      expect(entry(id).blockedUses.join(' ')).toMatch(/without|bypass|policy|private|paywall|permission|terms/)
    }

    for (const id of ['trafilatura', 'unstructured', 'qdrant', 'neo4j', 'ccxt', 'geopandas']) {
      expect(entry(id)).toBeDefined()
    }

    expect(entry('ccxt')).toMatchObject({
      runtimePolicy: 'auth-required',
      riskTags: expect.arrayContaining(['credentialed-api', 'market-data']),
    })
  })

  it('keeps active recon, malware handling, and person-enrichment tools out of default runtime', () => {
    for (const id of [
      'maigret',
      'amass',
      'subfinder',
      'httpx',
      'naabu',
      'nuclei',
      'katana',
      'dnsx',
      'atomic-red-team',
      'capa',
      'floss',
      'remnux',
      'volatility3',
      'fuzzilli',
      'payloads-all-the-things',
    ]) {
      expect(masteryEntryPassesDefaultCorpusPolicy(entry(id))).toBe(false)
      expect(entry(id).runtimePolicy).toMatch(/^(authorized-lab-only|blocked)$/)
      expect(entry(id).blockedUses.length).toBeGreaterThan(0)
    }
  })

  it('keeps defensive references available as study material without upgrading them to truth', () => {
    for (const id of ['mitre-cti', 'attack-stix-data', 'sigma-rules', 'zeek', 'suricata', 'security-onion']) {
      expect(masteryEntryPassesDefaultCorpusPolicy(entry(id))).toBe(true)
      expect(entry(id).engineeringLesson).not.toMatch(/verified ground truth/i)
    }

    expect(entry('mitre-cti').blockedUses.join(' ')).toContain('verified ground truth')
    expect(entry('sigma-rules').blockedUses.join(' ')).toContain('without telemetry validation')
  })

  it('captures mental models and source domains beyond tools', () => {
    expect(ANALYST_MENTAL_MODEL_DIMENSIONS).toEqual([
      'systems',
      'networks',
      'incentives',
      'evidence',
      'relationships',
      'history',
      'security',
      'data pipelines',
    ])

    for (const id of [
      'decision-making',
      'strategy',
      'thinking',
      'cia-csi-books',
      'dni-ncsc-how-we-work',
      'mitre-org',
      'awesome-sre',
      'google-sre',
      'school-of-sre',
      'awesome-public-datasets',
      'apache-spark',
      'apache-kafka',
      'memgraph',
      'archive-org',
      'library-of-congress',
      'national-archives-uk',
      'fred-economic-data',
      'imf-data',
      'world-bank-data',
      'netflix-tech-blog',
      'cloudflare-blog',
      'stripe-engineering-blog',
    ]) {
      expect(entry(id).runtimePolicy).toBe('study-only')
      expect(masteryEntryPassesDefaultCorpusPolicy(entry(id))).toBe(true)
      expect(entry(id).engineeringLesson).toMatch(/teach|reason|thinking|context|systems|data|tradeoffs|history|incentives|evidence|failure|operations|relationships|analysts|compare|analogy/i)
    }
  })

  it('summarizes corpus posture for future Data Core surfaces', () => {
    const summary = summarizeMasteryCorpus()

    expect(summary.entryCount).toBe(AGENT_MASTERY_CORPUS.length)
    expect(summary.defaultSafeCount).toBeLessThan(summary.entryCount)
    expect(summary.byDomain['scraping-crawling']).toBeGreaterThan(5)
    expect(summary.byDomain['security-engineering']).toBeGreaterThan(5)
    expect(summary.byDomain['decision-analysis']).toBe(3)
    expect(summary.byDomain['intelligence-tradecraft']).toBe(3)
    expect(summary.byDomain['economics-incentives']).toBe(3)
    expect(summary.byDomain['historical-reference']).toBe(3)
    expect(summary.byPolicy['authorized-lab-only']).toBeGreaterThan(10)
    expect(summary.byPolicy.blocked).toBeGreaterThanOrEqual(2)
  })
})
