import { describe, expect, it } from 'vitest'
import {
  OSINT_ENGINEERING_REFERENCES,
  isOsintReferenceAutoWireable,
  lookupOsintReference,
  osintReferencesForDefaultRuntime,
  osintReferencesRequiringAuthorization,
  summarizeOsintGovernance,
} from '../electron/osint/osintGovernance'
import { isCanonicalProvenance } from '../src/provenance'

describe('OSINT engineering governance', () => {
  it('catalogs the referenced OSINT ecosystem with explicit safety metadata', () => {
    const ids = OSINT_ENGINEERING_REFERENCES.map((reference) => reference.id)

    expect(ids).toEqual(
      expect.arrayContaining([
        'awesome-osint',
        'openosint',
        'osint-framework',
        'langgraph',
        'crewai',
        'ag2',
        'opencti',
        'spiderfoot',
        'theharvester',
        'maryam',
        'photon',
        'github-osint-search',
      ]),
    )

    for (const reference of OSINT_ENGINEERING_REFERENCES) {
      expect(reference.upstreamUrl).toMatch(/^https:\/\/github\.com\//)
      expect(isCanonicalProvenance(reference.defaultProvenance)).toBe(true)
      expect(reference.allowedUses.length).toBeGreaterThan(0)
      expect(reference.blockedUses.length).toBeGreaterThan(0)
      expect(reference.legalSafetyNote.length).toBeGreaterThan(20)
    }
  })

  it('keeps recon and identity-enrichment tools out of default auto-wiring', () => {
    for (const id of ['spiderfoot', 'theharvester', 'maryam', 'photon', 'openosint']) {
      const reference = lookupOsintReference(id)

      expect(reference).toBeDefined()
      expect(reference?.requiresExplicitAuthorization).toBe(true)
      expect(isOsintReferenceAutoWireable(reference!)).toBe(false)
    }

    expect(osintReferencesForDefaultRuntime()).toEqual([])
  })

  it('allows threat-intel platform integration only through auth-gated boundaries', () => {
    const opencti = lookupOsintReference('opencti')

    expect(opencti).toMatchObject({
      integrationMode: 'auth-gated-adapter',
      defaultProvenance: 'auth-gated',
      requiresExplicitAuthorization: true,
    })
  })

  it('summarizes governance posture for future source-health surfaces', () => {
    const summary = summarizeOsintGovernance()

    expect(summary.referenceCount).toBe(OSINT_ENGINEERING_REFERENCES.length)
    expect(summary.autoWireableCount).toBe(0)
    expect(summary.authorizationGatedCount).toBeGreaterThanOrEqual(5)
    expect(osintReferencesRequiringAuthorization().map((reference) => reference.id)).toContain('spiderfoot')
  })
})
