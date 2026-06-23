/*
 * OSINT engineering governance for Atlasz.
 *
 * This catalog records how well-known OSINT/agent projects influence Atlasz
 * without auto-installing or auto-running invasive recon tooling. It gives us a
 * concrete contract for future integrations: public/official feeds can become
 * adapters; target-enrichment and scanning tools remain reference-only or
 * explicitly auth/authorization gated.
 */
import type { ProvenanceId } from '../../src/provenance'

export type OsintCapabilityDomain =
  | 'catalog'
  | 'agent-orchestration'
  | 'public-ingestion'
  | 'threat-intel-platform'
  | 'authorized-recon'
  | 'local-analysis'

export type OsintIntegrationMode =
  | 'reference-only'
  | 'safe-public-adapter'
  | 'auth-gated-adapter'
  | 'local-service'
  | 'blocked'

export type OsintEngineeringReference = {
  id: string
  label: string
  upstreamUrl: string
  domain: OsintCapabilityDomain
  integrationMode: OsintIntegrationMode
  defaultProvenance: ProvenanceId
  requiresExplicitAuthorization: boolean
  allowedUses: string[]
  blockedUses: string[]
  engineeringLesson: string
  legalSafetyNote: string
}

export const OSINT_ENGINEERING_REFERENCES: OsintEngineeringReference[] = [
  {
    id: 'awesome-osint',
    label: 'Awesome OSINT',
    upstreamUrl: 'https://github.com/jivoi/awesome-osint',
    domain: 'catalog',
    integrationMode: 'reference-only',
    defaultProvenance: 'local-derived',
    requiresExplicitAuthorization: false,
    allowedUses: ['tool taxonomy', 'source discovery research', 'manual operator reference'],
    blockedUses: ['automatic bulk scraping', 'blindly trusting listed sources', 'auto-installing third-party tools'],
    engineeringLesson: 'Treat broad OSINT lists as catalog input, not runtime authority.',
    legalSafetyNote: 'Reference catalog only; every candidate source still needs its own safety, provenance, and rate-limit review.',
  },
  {
    id: 'openosint',
    label: 'OpenOSINT',
    upstreamUrl: 'https://github.com/OpenOSINT/OpenOSINT',
    domain: 'agent-orchestration',
    integrationMode: 'reference-only',
    defaultProvenance: 'local-model',
    requiresExplicitAuthorization: true,
    allowedUses: ['agent interface pattern research', 'MCP-style tool boundary inspiration'],
    blockedUses: ['unsupervised target investigation', 'account enumeration by default', 'private or credentialed lookups without config'],
    engineeringLesson: 'Agentic OSINT needs tool permissions, audit trails, and fail-closed target boundaries.',
    legalSafetyNote: 'Do not route personal-target enrichment or breach-style checks without explicit authorization and source terms review.',
  },
  {
    id: 'osint-framework',
    label: 'OSINT Framework',
    upstreamUrl: 'https://github.com/lockfale/OSINT-Framework',
    domain: 'catalog',
    integrationMode: 'reference-only',
    defaultProvenance: 'local-derived',
    requiresExplicitAuthorization: false,
    allowedUses: ['capability taxonomy', 'manual source triage', 'coverage-gap analysis'],
    blockedUses: ['treating all listed tools as safe defaults', 'login/paywall/CAPTCHA bypass'],
    engineeringLesson: 'The framework is valuable as a map; Atlasz still needs provider-level safety contracts.',
    legalSafetyNote: 'Reference-only catalog; tools requiring registration, payment, or authentication must stay explicit and gated.',
  },
  {
    id: 'langgraph',
    label: 'LangGraph',
    upstreamUrl: 'https://github.com/langchain-ai/langgraph',
    domain: 'agent-orchestration',
    integrationMode: 'reference-only',
    defaultProvenance: 'local-model',
    requiresExplicitAuthorization: false,
    allowedUses: ['state-machine design inspiration', 'recoverable workflow planning', 'human-in-the-loop agent boundaries'],
    blockedUses: ['unbounded web crawling', 'autonomous source expansion outside approved providers'],
    engineeringLesson: 'Stateful agents should plan through typed states and policy guards, not free-form network behavior.',
    legalSafetyNote: 'Future agent workflows must execute only approved Atlasz adapters and preserve provenance on every output.',
  },
  {
    id: 'crewai',
    label: 'CrewAI',
    upstreamUrl: 'https://github.com/crewAIInc/crewAI',
    domain: 'agent-orchestration',
    integrationMode: 'reference-only',
    defaultProvenance: 'local-model',
    requiresExplicitAuthorization: false,
    allowedUses: ['role separation pattern research', 'reviewer/collector/analyst workflow design'],
    blockedUses: ['delegating unrestricted tools to autonomous agents', 'presenting agent conclusions as verified'],
    engineeringLesson: 'Crew-style roles are useful only when each role has bounded tools and auditable outputs.',
    legalSafetyNote: 'Agent output remains local-model/model-inferred unless independently verified.',
  },
  {
    id: 'ag2',
    label: 'AG2',
    upstreamUrl: 'https://github.com/ag2ai/ag2',
    domain: 'agent-orchestration',
    integrationMode: 'reference-only',
    defaultProvenance: 'local-model',
    requiresExplicitAuthorization: false,
    allowedUses: ['multi-agent coordination research', 'tool-call policy design'],
    blockedUses: ['self-directed recon against arbitrary targets', 'silent tool installation'],
    engineeringLesson: 'Multi-agent systems need capability allowlists and interruption points before network actions.',
    legalSafetyNote: 'Any future AG2-like workflow must run under Atlasz adapter policy and user-visible audit logs.',
  },
  {
    id: 'opencti',
    label: 'OpenCTI',
    upstreamUrl: 'https://github.com/OpenCTI-Platform/opencti',
    domain: 'threat-intel-platform',
    integrationMode: 'auth-gated-adapter',
    defaultProvenance: 'auth-gated',
    requiresExplicitAuthorization: true,
    allowedUses: ['future STIX/TAXII style import from a configured instance', 'local threat-intel graph federation'],
    blockedUses: ['claiming external intel is verified by default', 'pulling private CTI without credentials and operator approval'],
    engineeringLesson: 'Threat-intel platforms fit Atlasz as authenticated graph sources with strict source labels.',
    legalSafetyNote: 'No OpenCTI connection is active by default; future use requires an explicit endpoint and credential boundary.',
  },
  {
    id: 'spiderfoot',
    label: 'SpiderFoot',
    upstreamUrl: 'https://github.com/smicallef/spiderfoot',
    domain: 'authorized-recon',
    integrationMode: 'reference-only',
    defaultProvenance: 'auth-gated',
    requiresExplicitAuthorization: true,
    allowedUses: ['architecture study for module registries', 'authorized asset inventory research'],
    blockedUses: ['background scans', 'target enrichment without authorization', 'attack-surface probing from Atlasz defaults'],
    engineeringLesson: 'Large recon module systems need target authorization, rate limits, and explicit operator scope.',
    legalSafetyNote: 'Recon/scanning workflows are not auto-wired into Atlasz and must remain explicit, authorized, and disabled by default.',
  },
  {
    id: 'theharvester',
    label: 'theHarvester',
    upstreamUrl: 'https://github.com/laramies/theHarvester',
    domain: 'authorized-recon',
    integrationMode: 'reference-only',
    defaultProvenance: 'auth-gated',
    requiresExplicitAuthorization: true,
    allowedUses: ['authorized domain exposure research', 'data-source taxonomy study'],
    blockedUses: ['email/person harvesting against third parties by default', 'bulk identity enrichment'],
    engineeringLesson: 'Contact and domain discovery tools belong behind authorization gates, not market-intel defaults.',
    legalSafetyNote: 'No email/person harvesting adapter is enabled or planned as a default Atlasz source.',
  },
  {
    id: 'maryam',
    label: 'Maryam',
    upstreamUrl: 'https://github.com/saeeddhqan/Maryam',
    domain: 'authorized-recon',
    integrationMode: 'reference-only',
    defaultProvenance: 'auth-gated',
    requiresExplicitAuthorization: true,
    allowedUses: ['modular CLI design study', 'authorized OSINT workflow research'],
    blockedUses: ['identity targeting', 'unreviewed third-party module execution'],
    engineeringLesson: 'A modular OSINT framework still needs per-module provenance, permissions, and audit records.',
    legalSafetyNote: 'Atlasz does not execute Maryam modules; this is a reference for modularity only.',
  },
  {
    id: 'photon',
    label: 'Photon',
    upstreamUrl: 'https://github.com/s0md3v/Photon',
    domain: 'authorized-recon',
    integrationMode: 'reference-only',
    defaultProvenance: 'auth-gated',
    requiresExplicitAuthorization: true,
    allowedUses: ['crawler boundary design research', 'authorized site inventory concepts'],
    blockedUses: ['unbounded crawling', 'scraping private/login/paywall pages', 'default Atlasz background collection'],
    engineeringLesson: 'Crawlers must be scoped, rate-limited, and kept out of Atlasz default intelligence loops.',
    legalSafetyNote: 'No crawler is auto-wired; public event/news connectors use known endpoints only.',
  },
  {
    id: 'github-osint-search',
    label: 'GitHub OSINT repository search',
    upstreamUrl: 'https://github.com/search?q=osint&type=repositories&s=stars&o=desc',
    domain: 'catalog',
    integrationMode: 'reference-only',
    defaultProvenance: 'local-derived',
    requiresExplicitAuthorization: false,
    allowedUses: ['periodic manual landscape review', 'candidate connector research'],
    blockedUses: ['auto-installing popular repos', 'treating star count as source reliability'],
    engineeringLesson: 'Popularity is a discovery signal, not an engineering trust signal.',
    legalSafetyNote: 'Every repository still needs license, safety, maintenance, and source-contract review.',
  },
]

const referencesById = new Map(OSINT_ENGINEERING_REFERENCES.map((reference) => [reference.id, reference]))

export function lookupOsintReference(id: string): OsintEngineeringReference | undefined {
  return referencesById.get(id)
}

export function isOsintReferenceAutoWireable(reference: OsintEngineeringReference): boolean {
  return reference.integrationMode === 'safe-public-adapter' || reference.integrationMode === 'local-service'
}

export function osintReferencesForDefaultRuntime(): OsintEngineeringReference[] {
  return OSINT_ENGINEERING_REFERENCES.filter(isOsintReferenceAutoWireable)
}

export function osintReferencesRequiringAuthorization(): OsintEngineeringReference[] {
  return OSINT_ENGINEERING_REFERENCES.filter((reference) => reference.requiresExplicitAuthorization)
}

export function summarizeOsintGovernance() {
  const byMode = new Map<OsintIntegrationMode, number>()
  const byDomain = new Map<OsintCapabilityDomain, number>()
  for (const reference of OSINT_ENGINEERING_REFERENCES) {
    byMode.set(reference.integrationMode, (byMode.get(reference.integrationMode) ?? 0) + 1)
    byDomain.set(reference.domain, (byDomain.get(reference.domain) ?? 0) + 1)
  }
  return {
    referenceCount: OSINT_ENGINEERING_REFERENCES.length,
    autoWireableCount: osintReferencesForDefaultRuntime().length,
    authorizationGatedCount: osintReferencesRequiringAuthorization().length,
    byMode: Object.fromEntries(byMode),
    byDomain: Object.fromEntries(byDomain),
  }
}
