import {
  type BriefItem,
  type EvidenceNote,
  type RadarEvent,
  type RawSourceItem,
  type Severity,
  type Signal,
  type SourceTrailItem,
} from './data/intel'
import type { ProvenanceId } from './provenance'

export type WorldSourceTrust =
  | ProvenanceId
  | 'public unauthenticated'
  | 'local derived'
  | 'simulated'
  | 'verified'
  | 'stale'
  | 'failed'
  | 'unavailable'

export type WorldIntelStatus = 'disabled' | 'fetching' | 'ready' | 'stale' | 'failed'

export type PublicWorldHeadline = {
  id: string
  title: string
  source: string
  url: string
  sector: string
  impact: string
  observedAt: number
}

export type WorldIntelCategory =
  | 'geopolitics'
  | 'macro'
  | 'markets'
  | 'commodities'
  | 'infrastructure'
  | 'social-attention'
  | 'country'
  | 'other'

export type WorldIntelEvent = {
  id: string
  timestamp: number
  title: string
  summary: string
  countryCodes: string[]
  region: string
  lat?: number
  lon?: number
  category: WorldIntelCategory | string
  severity: Severity
  confidence: number
  sourceId: string
  sourceUrl?: string
  provenance: ProvenanceId
  affectedAssets: string[]
  affectedSectors: string[]
  affectedCommodities: string[]
  affectedCurrencies: string[]
  extractedEntities: string[]
  narrativeTags: string[]
  rawPayloadHash: string
  dedupeHash: string
  weatherAlert?: WeatherAlert
  secFiling?: SecCompanyFiling
  fredObservation?: FredMacroObservation
  treasuryFiscalRecord?: TreasuryFiscalRecord
  beaObservation?: BeaObservation
  blsObservation?: BlsObservation
  eiaEnergyRecord?: EiaEnergyRecord
  eiaFacility?: EiaPowerPlantFacility
  eiaRefinery?: EiaRefineryFacility
  lngTerminal?: LngTerminalFacility
  nuclearPlant?: NuclearPlantFacility
  nrcReactorStatus?: NrcReactorStatus
  gridRegion?: GridRegion
  unLocode?: UnLocode
  worldPort?: WorldPortIndexRecord
  mineralSite?: MineralSite
  kevVulnerability?: KevVulnerability
  nvdCve?: NvdCve
  ghsaAdvisory?: GhsaAdvisory
  osvVulnerability?: OsvVulnerability
  cisaAdvisory?: CisaAdvisory
  githubRelease?: GithubRelease
  earthquakeEvent?: EarthquakeEvent
  infrastructureSite?: InfrastructureSite
  patentRecord?: PatentRecord
  regulatoryDocument?: RegulatoryDocument
  ofacSanctionsRecord?: OfacSanctionsRecord
  congressBillAction?: CongressBillAction
  gdeltArticle?: GdeltArticle
  comtradeRecord?: ComtradeTradeRecord
  openAlexWork?: OpenAlexWork
  crossrefWork?: CrossrefWork
  marketIdentity?: MarketIdentity
  companyFact?: SecCompanyFact
  form4Transaction?: Form4Transaction
  form13fHolding?: Form13FHolding
  etfHolding?: EtfHolding
}

export type EtfHoldingChangeType = 'first_seen' | 'new_today' | 'updated' | 'unchanged'

/**
 * A single issuer-published ETF holding row. Source-backed basket membership only:
 * NOT a current-position guarantee, recommendation, ranking, price signal, or
 * prediction. Weight/shares/market value are present only when the same source
 * file provides them. Staleness is explicit via sourceDate/staleAt.
 */
export type EtfHolding = {
  id: string
  fundTicker: string
  fundName: string
  issuer: string
  sourceDate: string
  sourceTimestamp: number
  holdingName: string
  /** Set only when the source row provides an equity-like ticker. */
  holdingTicker?: string
  cusip?: string
  isin?: string
  sedol?: string
  sector?: string
  assetClass?: string
  weight?: number
  weightSource?: 'source-provided' | 'calculated-from-source'
  shares?: number
  marketValue?: number
  currency?: string
  sourceUrl: string
  sourceName: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  changeType: EtfHoldingChangeType
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type Form13FChangeType = 'first_seen' | 'new_today' | 'updated' | 'unchanged'

/**
 * A single SEC Form 13F holding row (information table), attached to an institutional
 * filer identity and, when an EXACT CUSIP mapping exists, a canonical issuer ticker.
 * QUARTERLY DELAYED snapshot — NOT a current position. Never conviction, sentiment
 * (bullish/bearish), fund performance, valuation, or trading advice. Holder/issuer
 * data is source-bounded; no person enrichment.
 */
export type Form13FHolding = {
  id: string
  accessionNumber: string
  filingType: string
  isAmendment: boolean
  reportPeriod: string
  filingDate: string
  filerCik: string
  filerCikPadded: string
  filerName: string
  issuerName: string
  /** Set only when an exact curated CUSIP→ticker mapping exists. */
  issuerTicker?: string
  cusip: string
  classTitle: string
  /** Numeric value exactly as reported in the 13F information table. */
  value: number
  sharesOrPrincipal?: number
  sharesPrincipalType?: string
  putCall?: string
  investmentDiscretion?: string
  votingSole?: number
  votingShared?: number
  votingNone?: number
  sourceFilingUrl: string
  sourceInfoTableUrl: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  changeType: Form13FChangeType
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type Form4ChangeType = 'first_seen' | 'new_today' | 'updated' | 'unchanged'

/**
 * A single SEC Form 4 non-derivative ownership transaction, attached to a canonical
 * issuer CIK/ticker identity. Source-reported transaction EVIDENCE only — never
 * sentiment (no bullish/bearish), valuation, price prediction, or trading advice.
 * Reporting-owner data is limited to source-published name/title; no enrichment.
 */
export type Form4Transaction = {
  id: string
  issuerCik: string
  issuerCikPadded: string
  issuerTicker: string
  issuerName: string
  accessionNumber: string
  /** True when the filing is a Form 4/A amendment (surfaced honestly, never as an original). */
  isAmendment: boolean
  filingDate: string
  transactionDate: string
  ownerName: string
  ownerCik?: string
  /** Source-published relationship only (e.g. "Director", "Officer: General Counsel"). */
  ownerRelationship: string
  securityTitle: string
  transactionCode: string
  /** Neutral SEC definition of the code — descriptive, not sentiment. */
  transactionCodeLabel: string
  transactionShares?: number
  transactionPricePerShare?: number
  acquiredDisposedCode: string
  ownershipNature?: string
  sharesOwnedFollowing?: number
  sourceFilingUrl: string
  sourceXmlUrl: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  changeType: Form4ChangeType
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type SecCompanyFactChangeType = 'first_seen' | 'new_today' | 'updated' | 'unchanged'

/**
 * A single SEC-reported XBRL fact (companyfacts) attached to a canonical CIK/ticker
 * identity. HISTORICAL reported fact only — never an estimate, forecast, valuation,
 * or trading signal. The CIK comes from the Market Reference Master identity spine.
 */
export type SecCompanyFact = {
  id: string
  cik: string
  cikPadded: string
  ticker: string
  companyName: string
  taxonomy: string
  concept: string
  /** Canonical Atlasz concept label (e.g. "Net income"). */
  conceptLabel: string
  /** SEC-published label for the concept. */
  factLabel: string
  unit: string
  value: number
  periodStart?: string
  periodEnd: string
  fiscalYear?: number
  fiscalPeriod?: string
  form: string
  filedDate: string
  accessionNumber?: string
  frame?: string
  sourceUrl: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  changeType: SecCompanyFactChangeType
  rawPayloadHash: string
  rawPayloadJson?: string
}

/**
 * Canonical market identity record from a source-backed reference feed. The SEC
 * company_tickers.json feed provides CIK, ticker, and legal title only: exchange,
 * sector, and industry remain absent unless another official/public source
 * explicitly provides them. No fuzzy merge, no inferred ETF weights.
 */
export type MarketIdentity = {
  id: string
  ticker: string
  cik: string
  cikPadded: string
  legalName: string
  commonName?: string
  exchange?: string
  sector?: string
  industry?: string
  aliases: string[]
  sourceUrl: string
  sourceName: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

/**
 * A single Crossref DOI/work metadata record. DOI registry metadata only - not
 * full text, not validation of research claims, not citation quality, and not a
 * market signal.
 */
export type CrossrefWork = {
  id: string
  doi: string
  doiUrl: string
  title: string
  type: string
  publisher?: string
  containerTitle?: string
  issuedDate?: string
  publishedDate?: string
  url?: string
  licenseUrls: string[]
  funders: string[]
  subjects: string[]
  referenceCount?: number
  isReferencedByCount?: number
  queryBucket: string
  /** Crossref API URL with mailto stripped - safe to persist/display. */
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type OpenAlexChangeType = 'first_seen' | 'new_today' | 'updated' | 'unchanged'

/**
 * A single OpenAlex research work (metadata only). NOT a validation of any
 * technical claim, breakthrough, or market signal. Authors are kept minimal and
 * source-bounded - no person enrichment. citedByCount is metadata, not a quality
 * score.
 */
export type OpenAlexWork = {
  id: string
  openAlexWorkId: string
  doi?: string
  title: string
  publicationYear?: number
  publicationDate?: string
  type: string
  venue?: string
  institutions: string[]
  institutionCountries: string[]
  topics: string[]
  authors: string[]
  citedByCount?: number
  isRetracted: boolean
  landingPageUrl?: string
  doiUrl?: string
  openAlexUrl: string
  queryBucket: string
  /** API URL with the api_key stripped - safe to persist/display. */
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  changeType: OpenAlexChangeType
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type ComtradeChangeType = 'first_seen' | 'new_today' | 'updated' | 'unchanged'

/**
 * A single normalized UN Comtrade trade-flow observation: official country/partner/
 * commodity trade value for a period. Hard trade-flow evidence only — NEVER a
 * company-level claim or an inferred supply chain.
 */
export type ComtradeTradeRecord = {
  id: string
  /** Dataset identity, e.g. "C-A-HS" (type · frequency · classification). */
  datasetCode: string
  typeCode: string
  freqCode: string
  classification: string
  commodityCode: string
  commodityDescription: string
  reporterCode: string
  reporterDesc: string
  reporterIso3?: string
  partnerCode: string
  partnerDesc: string
  partnerIso3?: string
  flowCode: string
  flowDesc: string
  period: string
  refYear: number
  tradeValue: number
  quantity?: number
  quantityUnit?: string
  netWeight?: number
  sourceUrl: string
  /** API URL with the subscription key stripped — safe to persist/display. */
  sourceApiUrl: string
  sourceName: string
  /** Content hash of the commodity catalog snapshot that produced this query. */
  catalogHash?: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  changeType: ComtradeChangeType
  rawPayloadHash: string
  rawPayloadJson?: string
}

/**
 * A single GDELT DOC 2.0 article observation. This is media observation, NOT a
 * verified event: it records that an article matching a query bucket was seen,
 * with its title/domain/url/seendate/language/source-country exactly as published.
 * No coded events, themes, actors, tone, or inferred exposure are stored.
 */
export type GdeltArticle = {
  id: string
  title: string
  url: string
  domain: string
  language?: string
  sourceCountry?: string
  /** The Atlasz query bucket this fetch used (not a per-article topic inference). */
  queryBucket: string
  seenDate: string
  seenTimestamp: number
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type OfacSanctionsChangeStatus = 'new' | 'updated' | 'unchanged' | 'observed'

export type CongressBillChangeType = 'new' | 'updated' | 'unchanged' | 'observed'

export type CongressBillAction = {
  id: string
  congress: number
  billType: string
  billNumber: string
  title: string
  introducedDate?: string
  introducedTimestamp?: number
  latestActionDate: string
  latestActionTimestamp: number
  latestActionText: string
  policyArea?: string
  sponsors: string[]
  committees: string[]
  officialUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  changeType: CongressBillChangeType
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type OfacSanctionsRecord = {
  id: string
  uid: string
  listType: 'SDN'
  name: string
  entityType: string
  programs: string[]
  countries: string[]
  aliases: string[]
  publishDate: string
  publishTimestamp: number
  recordCount?: number
  sourceUrl: string
  sourceDataUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  changeStatus: OfacSanctionsChangeStatus
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type RegulatoryDocument = {
  id: string
  documentNumber: string
  title: string
  documentType: string
  agencies: string[]
  publicationDate: string
  publicationTimestamp: number
  effectiveDate?: string
  commentEndDate?: string
  abstract: string
  htmlUrl: string
  /** Official PDF rendition (govinfo / FR print) when present — legal edition. */
  pdfUrl?: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type PatentRecord = {
  id: string
  patentId: string
  title: string
  abstract: string
  patentDate: string
  grantTimestamp: number
  assignees: string[]
  cpcCodes: string[]
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type WeatherAlert = {
  id: string
  alertId: string
  event: string
  headline: string
  description: string
  severity: string
  urgency: string
  certainty: string
  areaDesc: string
  sameCodes: string[]
  ugcCodes: string[]
  effective: string
  effectiveTimestamp?: number
  onset: string
  onsetTimestamp?: number
  expires: string
  expiresTimestamp?: number
  observedTimestamp: number
  senderName: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type SecCompanyFiling = {
  id: string
  cik: string
  companyName: string
  ticker?: string
  formType: string
  accessionNumber: string
  filingDate: string
  reportDate?: string
  acceptedAt?: number
  observedAt: number
  primaryDocument?: string
  sourceUrl: string
  sourceJsonUrl: string
  sourceName: string
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type FredMacroObservation = {
  id: string
  seriesId: string
  title: string
  units: string
  frequency: string
  seasonalAdjustment: string
  observationDate: string
  observationTimestamp: number
  value: number
  rawValue: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type TreasuryFiscalRecord = {
  id: string
  datasetId: string
  datasetName: string
  tableId: string
  tableName: string
  recordDate: string
  recordTimestamp: number
  metricName: string
  metricValue: number
  rawValue: string
  units: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type BeaObservation = {
  id: string
  datasetName: string
  tableName: string
  lineNumber: string
  lineDescription: string
  seriesCode?: string
  timePeriod: string
  observationDate: string
  observationTimestamp: number
  metricName: string
  metricValue: number
  rawValue: string
  units: string
  unitMultiplier?: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type KevVulnerability = {
  id: string
  cveId: string
  vendorProject: string
  product: string
  vulnerabilityName: string
  dateAdded: string
  dateAddedTimestamp: number
  shortDescription: string
  requiredAction: string
  dueDate?: string
  knownRansomwareCampaignUse: boolean
  cwes: string[]
  catalogVersion: string
  sourceUrl: string
  sourceCatalogUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type NvdCvssMetric = {
  version: string
  vectorString?: string
  baseScore: number
  baseSeverity: string
  source?: string
  type?: string
}

export type NvdReference = {
  url: string
  source?: string
  tags: string[]
}

export type NvdCve = {
  id: string
  cveId: string
  sourceIdentifier: string
  published: string
  publishedTimestamp: number
  lastModified: string
  lastModifiedTimestamp: number
  vulnStatus: string
  description: string
  cvss?: NvdCvssMetric
  cweIds: string[]
  vendorProducts: string[]
  references: NvdReference[]
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  inKnownExploitedCatalog: boolean
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type GhsaPackageRef = {
  ecosystem: string
  name: string
  vulnerableRange?: string
  firstPatched?: string
}

export type GhsaAdvisory = {
  id: string
  ghsaId: string
  cveId?: string
  type: string
  summary: string
  severity: string
  packages: GhsaPackageRef[]
  cweIds: string[]
  references: string[]
  publishedAt: string
  publishedTimestamp: number
  updatedAt: string
  updatedTimestamp: number
  withdrawnAt?: string
  sourceUrl: string
  sourceApiUrl: string
  sourceIdentifier: string
  sourceName: string
  retrievedAt: number
  inKnownExploitedCatalog: boolean
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type OsvAffectedPackage = {
  ecosystem: string
  name: string
  fixed?: string
}

export type OsvVulnerability = {
  id: string
  osvId: string
  aliases: string[]
  relatedCveIds: string[]
  relatedGhsaIds: string[]
  summary: string
  details: string
  published: string
  publishedTimestamp?: number
  modified: string
  modifiedTimestamp?: number
  observedTimestamp: number
  severity: string
  ecosystem?: string
  affectedPackages: OsvAffectedPackage[]
  references: string[]
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type CisaAdvisory = {
  id: string
  advisoryId: string
  title: string
  summary: string
  relatedCveIds: string[]
  vendors: string[]
  products: string[]
  references: string[]
  published: string
  publishedTimestamp?: number
  updated: string
  updatedTimestamp?: number
  observedTimestamp: number
  sourceUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type GithubRelease = {
  id: string
  repoFullName: string
  releaseId: string
  tagName: string
  name: string
  isPrerelease: boolean
  publishedAt: string
  publishedTimestamp?: number
  createdAt: string
  createdTimestamp?: number
  observedTimestamp: number
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type BlsObservation = {
  id: string
  seriesId: string
  title: string
  period: string
  periodName: string
  year: string
  observationDate: string
  observationTimestamp: number
  value: number
  rawValue: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type EiaEnergyRecord = {
  id: string
  seriesId: string
  title: string
  energyCategory: string
  commodity: string
  region?: string
  countryCode?: string
  period: string
  observationDate: string
  observationTimestamp: number
  value: number
  rawValue: string
  units: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  staleAt?: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

/**
 * How precisely a facility's location is known. Coordinates are source-backed
 * only; when the official record omits lat/lon the facility is labeled
 * `region-only` (state/county known) or `unknown` — never guessed.
 */
export type GeospatialPrecision = 'exact' | 'approximate' | 'region-only' | 'unknown'

/**
 * A single electric power-generation facility (power plant) as published by the
 * official EIA generator inventory (EIA-860M, operating-generator-capacity).
 *
 * Real facility records only: location context, NOT an outage, disruption,
 * vulnerability, or attack-path claim. Operator is shown only as published by
 * EIA; an operator is linked to a market company ONLY when an exact curated
 * identity exists (never fuzzy-merged). Coordinates appear only when the source
 * provides them; otherwise geospatialPrecision is region-only/unknown.
 */
export type EiaPowerPlantFacility = {
  id: string
  facilityId: string
  facilityName: string
  facilityKind: 'power-plant'
  /** Operating entity name exactly as EIA publishes it (no inference). */
  operatorName?: string
  operatorId?: string
  /** Set ONLY when an exact curated market identity exists for the operator. */
  operatorTicker?: string
  /** EIA technology description (e.g. "Natural Gas Fired Combined Cycle"). */
  plantType?: string
  /** Human-readable primary fuel for the dominant generating unit. */
  primaryFuel?: string
  /** EIA energy-source code for the dominant unit (e.g. NG, SUN, WND). */
  energySource?: string
  /** Sum of source-reported nameplate capacity across the plant's units (MW). */
  capacityMw?: number
  /** Number of generator rows aggregated into this facility. */
  unitCount?: number
  /** Operating status; "mixed" when the plant's units differ. */
  status?: string
  state?: string
  stateName?: string
  county?: string
  balancingAuthority?: string
  latitude?: number
  longitude?: number
  geospatialPrecision: GeospatialPrecision
  sourceDataset: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  period?: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

/**
 * A single petroleum refinery as published by the official EIA U.S. Energy Atlas
 * (Petroleum Refineries layer / EIA-820 Refinery Capacity Report).
 *
 * Real refinery records only: location + capacity CONTEXT, NOT an outage,
 * disruption, vulnerability, or targeting claim. Operator/company shown exactly
 * as published; a market identity is linked ONLY on an exact curated match.
 * Coordinates appear only when source-backed; otherwise region-only/unknown.
 */
export type EiaRefineryFacility = {
  id: string
  facilityId: string
  facilityName: string
  facilityKind: 'refinery'
  /** Operating company name exactly as published (no inference). */
  operatorName?: string
  /** Parent corporation when the source distinguishes it from the operator. */
  companyName?: string
  operatorId?: string
  /** Set ONLY when an exact curated market identity exists for the operator. */
  operatorTicker?: string
  state?: string
  stateName?: string
  county?: string
  city?: string
  /** PADD region (structural petroleum-district context), when published. */
  padd?: string
  latitude?: number
  longitude?: number
  geospatialPrecision: GeospatialPrecision
  /** Atmospheric crude distillation capacity, exactly as the source reports it. */
  crudeCapacity?: number
  crudeCapacityUnit?: string
  /** Refined products, only when the source names them. */
  products?: string[]
  status?: string
  sourceDataset: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type LngTerminalType = 'import' | 'export' | 'liquefaction' | 'regasification'

/**
 * A single LNG (liquefied natural gas) import/export terminal as published by an
 * official source (EIA U.S. Energy Atlas LNG Import/Export Terminals layer, which
 * EIA builds from EIA + FERC information; or a FERC/DOE-FECM terminal source).
 *
 * Real terminal records only: location/capacity CONTEXT, NOT an outage,
 * disruption, export-flow, vulnerability, or targeting claim. terminalType and
 * capacity appear only when the source provides them. Operator/owner shown as
 * published; a market identity is linked ONLY on an exact curated match.
 */
export type LngTerminalFacility = {
  id: string
  facilityId: string
  facilityName: string
  facilityKind: 'lng-terminal'
  operatorName?: string
  ownerName?: string
  operatorId?: string
  /** Set ONLY when an exact curated market identity exists for the operator. */
  operatorTicker?: string
  state?: string
  stateName?: string
  county?: string
  city?: string
  latitude?: number
  longitude?: number
  geospatialPrecision: GeospatialPrecision
  /** Source-backed terminal role only; never inferred from the name. */
  terminalType?: LngTerminalType
  /** Capacity exactly as the source reports it (no flow inference). */
  capacity?: number
  capacityUnit?: string
  status?: string
  sourceDataset: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

/**
 * LAYER 1 (EIA, geospatial). A nuclear power plant as published by the official
 * EIA generator inventory (EIA-860M, operating-generator-capacity) filtered to
 * nuclear fuel. Facility/geospatial + generator-capacity context only — NOT a
 * safety, outage, emergency, or vulnerability claim. Reactor/regulatory fields
 * are optional NRC enrichment and stay undefined unless a source provides them.
 */
export type NuclearPlantFacility = {
  id: string
  facilityId: string
  facilityName: string
  facilityKind: 'nuclear-plant'
  operatorName?: string
  operatorId?: string
  ownerName?: string
  /** Set ONLY when an exact curated market identity exists for the operator. */
  operatorTicker?: string
  /** EIA plant id (same as facilityId for the EIA layer). */
  eiaPlantId?: string
  /** NRC enrichment, source-backed only (undefined from the EIA layer alone). */
  reactorName?: string
  reactorType?: string
  nrcDocket?: string
  nrcLicense?: string
  state?: string
  stateName?: string
  county?: string
  city?: string
  balancingAuthority?: string
  latitude?: number
  longitude?: number
  geospatialPrecision: GeospatialPrecision
  capacityMw?: number
  status?: string
  energySource?: string
  sourceDataset: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

/**
 * LAYER 2 (NRC, regulatory status). A single daily reactor power-status row as
 * published by the NRC Power Reactor Status Report. This is the operating power
 * level the regulator reports — NOT an Atlasz safety, outage, or disruption
 * assessment, and deliberately NOT auto-merged with the EIA facility layer.
 */
export type NrcReactorStatus = {
  id: string
  unitName: string
  reportDate: string
  reportTimestamp: number
  /** Reactor power level percent (0-100) exactly as NRC reports it. */
  powerPercent: number
  sourceDataset: string
  sourceUrl: string
  sourceName: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type GridRegionKind = 'balancing-authority' | 'grid-region'

/**
 * A grid operating region — a balancing authority (BA) or larger grid region —
 * as published by official EIA reference data (EIA v2 electricity/rto respondent
 * facet). Grid-context reference only: NOT an outage, grid-stress, reliability,
 * emergency, or vulnerability claim. No geometry from this source -> region-only.
 * NERC/FERC region and operator are included only when source-backed; operator
 * links to a market identity ONLY on an exact curated match.
 */
export type GridRegion = {
  id: string
  baCode: string
  baName: string
  regionKind: GridRegionKind
  country: string
  /** States served — source-backed only (e.g. derived from EIA plant records). */
  statesServed?: string[]
  nercRegion?: string
  fercRegion?: string
  operatorName?: string
  operatorTicker?: string
  geospatialPrecision: GeospatialPrecision
  sourceDataset: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

/** UN/LOCODE transport function flags (one per source classifier position). */
export type UnLocodeFunctions = {
  port: boolean
  rail: boolean
  road: boolean
  airport: boolean
  postal: boolean
  multimodal: boolean
  fixedTransport: boolean
  borderCrossing: boolean
}

export type UnLocodeKind = 'port' | 'airport' | 'rail-terminal' | 'logistics-location'

/**
 * A single UN/LOCODE entry — the official UNECE trade/transport location code
 * registry (Layer 1). This is a STANDARDIZED LOCATION CODE, not proof of live
 * port operations: no vessel traffic, congestion, or disruption is implied.
 * Coordinates appear only when the source row provides them (else region-only).
 * Physical port geometry/attributes are a later World Port Index enrichment.
 */
export type UnLocode = {
  id: string
  /** Full code, e.g. "USLAX" (country + location). */
  locode: string
  countryCode: string
  locationCode: string
  locationName: string
  subdivision?: string
  status?: string
  iata?: string
  functions: UnLocodeFunctions
  functionCode: string
  facilityKind: UnLocodeKind
  latitude?: number
  longitude?: number
  geospatialPrecision: GeospatialPrecision
  sourceDataset: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

/**
 * A physical port from the official NGA World Port Index (Pub 150) — Layer 2 of
 * the ports work: real port location + physical attributes. NOT live traffic,
 * congestion, trade volume, or disruption; no company exposure. Linked to a
 * UN/LOCODE ONLY on an exact code match from the WPI source field (never fuzzy);
 * otherwise it stands alone. Coordinates are source-backed decimal degrees.
 */
export type WorldPortIndexRecord = {
  id: string
  portNumber: string
  portName: string
  country?: string
  countryCode?: string
  subdivision?: string
  region?: string
  latitude?: number
  longitude?: number
  geospatialPrecision: GeospatialPrecision
  harborSize?: string
  harborType?: string
  shelter?: string
  /** Exact UN/LOCODE from the WPI source field, when present and valid. */
  linkedLocode?: string
  sourceDataset: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type MineralDatabase = 'USMIN' | 'MRDS'
export type MineralSiteKind = 'mine' | 'mineral-resource-site'

/**
 * A mineral site from official USGS Mineral Resources Online Spatial Data —
 * the materials reference layer. TWO-SOURCE-AWARE:
 *   - USMIN: the developing national-scale authoritative U.S. deposit database
 *   - MRDS:  the older global occurrence database — LEGACY, not systematically
 *            updated since 2011 (legacyNotMaintained = true)
 *
 * Reference data only: NOT current production, reserves, ownership, resource
 * size, or any investment/trading signal. Production/development status appear
 * ONLY when the source provides them. Operator links to a market identity ONLY
 * on an exact curated match. Coordinates source-backed only.
 */
export type MineralSite = {
  id: string
  siteId: string
  siteName: string
  facilityKind: MineralSiteKind
  database: MineralDatabase
  /** True for MRDS: legacy occurrence DB, not maintained since 2011. */
  legacyNotMaintained: boolean
  commodities: string[]
  depositType?: string
  /** Source-backed development status (e.g. Producer/Prospect/Occurrence). */
  developmentStatus?: string
  /** Source-backed production status, when a distinct field exists. */
  productionStatus?: string
  operatorName?: string
  /** Set ONLY when an exact curated market identity exists for the operator. */
  operatorTicker?: string
  country?: string
  countryCode?: string
  state?: string
  stateName?: string
  county?: string
  district?: string
  latitude?: number
  longitude?: number
  geospatialPrecision: GeospatialPrecision
  sourceDataset: string
  sourceUrl: string
  sourceApiUrl: string
  sourceName: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type InfrastructureSite = {
  id: string
  name: string
  /** The company/agency that operates (owns) the facility — from the source. */
  operator?: string
  /** Fuel/source type, e.g. hydro, nuclear, gas, coal, solar, wind. */
  energySource?: string
  capacity?: string
  lat: number
  lon: number
  countryCode?: string
  region?: string
  sourceName: string
  sourceUrl: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
}

export type EarthquakeEvent = {
  id: string
  eventId: string
  magnitude: number
  place: string
  title: string
  time: number
  depthKm?: number
  lat: number
  lon: number
  region?: string
  countryCode?: string
  alert?: string
  tsunami: boolean
  significance?: number
  status: string
  sourceUrl: string
  sourceFeedUrl: string
  sourceName: string
  retrievedAt: number
  provenance: ProvenanceId
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

export type MacroSnapshot = {
  inflation?: number
  policyRate?: number
  gdpGrowth?: number
  unemployment?: number
  note: string
  provenance: ProvenanceId
}

export type CountryIntelState = {
  countryCode: string
  countryName: string
  flag: string
  currentEventCount: number
  macroSnapshot: MacroSnapshot
  currency: string
  equityProxies: string[]
  majorCommodities: string[]
  riskScore: number
  narrativeAcceleration: number
  topCurrentHeadlines: string[]
  affectedTickers: string[]
  lastUpdated: number
  provenanceBreakdown: Record<ProvenanceId, number>
}

export type AssetIdentityType = 'equity' | 'ETF' | 'crypto' | 'FX' | 'commodity' | 'index' | 'country' | 'sector'

export type AssetIdentity = {
  symbol: string
  name: string
  type: AssetIdentityType
  exchangeOrSource: string
  iconUrl?: string
  fallbackIcon: string
  favorite: boolean
  watchlistTags: string[]
  aliases: string[]
  relatedCountries: string[]
  relatedSectors: string[]
  dataAvailabilityStatus: string
  provenanceCoverage: ProvenanceId[]
}

export type UserFavorite = {
  id: string
  kind: 'asset' | 'country' | 'event' | 'narrative'
  targetId: string
  label: string
  createdAt: number
}

export type SourceRefreshState =
  | 'due-now'
  | 'not-due'
  | 'backed-off'
  | 'stale'
  | 'expired'
  | 'missing-key'
  | 'disabled'

export type OsintSourceSnapshot = {
  sourceId: string
  sourceName: string
  sourceType: string
  endpointType: 'rest' | 'rss' | 'websocket' | 'local' | 'placeholder'
  endpoint: string
  pollIntervalMs: number
  rateLimitMs: number
  timeoutMs: number
  enabled: boolean
  status: 'idle' | 'online' | 'offline' | 'rate-limited' | 'failed' | 'disabled'
  provenance: ProvenanceId
  lastAttemptAt?: number
  lastSuccessAt?: number
  lastErrorAt?: number
  lastError?: string
  nextAttemptAt?: number
  staleAt?: number
  expiresAt?: number
  refreshState?: SourceRefreshState
  refreshReason?: string
  itemCount: number
  sourceReliabilityScore: number
  legalSafetyNote: string
  parserAdapter: string
  // Provider-config metadata (optional; populated by the provider-driven registry).
  category?: string
  authType?: 'none' | 'api-key' | 'bearer-token' | 'env'
  configured?: boolean
  configHint?: string
}

export type WorldRefreshControlSnapshot = {
  autoRefreshEnabled: boolean
  autoRefreshPaused: boolean
  cadenceMs: number
  nextScheduledRefreshAt?: number
  lastRefreshStartedAt?: number
  lastRefreshCompletedAt?: number
}

export type WorldIntelConnectorSnapshot = {
  enabled: boolean
  status: WorldIntelStatus
  sourceTrust: WorldSourceTrust
  connectorId: 'gdelt_doc_public' | 'unavailable'
  connectorLabel: string
  updatedAt?: number
  lastError?: string
  headlines: PublicWorldHeadline[]
  worldEvents: WorldIntelEvent[]
  countries: CountryIntelState[]
  assetIdentities: AssetIdentity[]
  marketIdentities: MarketIdentity[]
  secFilings: SecCompanyFiling[]
  fredObservations: FredMacroObservation[]
  treasuryFiscalRecords: TreasuryFiscalRecord[]
  beaObservations: BeaObservation[]
  eiaEnergyRecords: EiaEnergyRecord[]
  favorites: UserFavorite[]
  sources: OsintSourceSnapshot[]
  refreshControl: WorldRefreshControlSnapshot
}

export type DerivedWorldIntel = {
  events: RadarEvent[]
  signals: Signal[]
  dailyBrief: BriefItem[]
  rawSourceItems: RawSourceItem[]
}

export type WorldIntelSnapshot = WorldIntelConnectorSnapshot & DerivedWorldIntel

type TopicRule = {
  id: string
  label: string
  category: string
  region: string
  severity: Severity
  keywords: string[]
  entities: string[]
  markets: string[]
  riskChannels: string[]
  narrative: string
  uncertainty: string
  watchNext: string[]
}

type ClassifiedHeadline = PublicWorldHeadline & {
  topic: TopicRule
  matchedKeywords: string[]
}

const topicRules: TopicRule[] = [
  {
    id: 'red-sea',
    label: 'Shipping and Red Sea route risk',
    category: 'Trade route',
    region: 'Middle East',
    severity: 'elevated',
    keywords: ['red sea', 'suez', 'houthi', 'shipping', 'freight', 'tanker', 'route', 'vessel'],
    entities: ['Red Sea', 'Shipping Risk', 'WTI Crude', 'Freight', 'Airlines'],
    markets: ['CL', 'XLE', 'GLD', 'DAL', 'UAL'],
    riskChannels: ['Freight cost', 'Oil premium', 'Inflation risk', 'Airline margins'],
    narrative: 'Public coverage is clustering around shipping route friction and energy-sensitive exposure.',
    uncertainty: 'Public unauthenticated news coverage is not direct proof of supply disruption or market causality.',
    watchNext: ['Primary shipping notices', 'Freight and insurance language', 'WTI/XLE breadth'],
  },
  {
    id: 'taiwan',
    label: 'Taiwan and semiconductor concentration',
    category: 'Geopolitics',
    region: 'Asia Pacific',
    severity: 'critical',
    keywords: ['taiwan', 'tsmc', 'semiconductor', 'chip', 'chips', 'export control', 'advanced node'],
    entities: ['Taiwan', 'TSMC', 'Semiconductors', 'Nvidia', 'Apple', 'Nasdaq 100'],
    markets: ['TSM', 'SOXX', 'NVDA', 'AAPL', 'QQQ'],
    riskChannels: ['Supply-chain concentration', 'Export controls', 'AI hardware availability'],
    narrative: 'Fresh public coverage maps into semiconductor concentration and advanced-node supply-chain exposure.',
    uncertainty: 'Coverage can reflect commentary or positioning without confirming a new policy or security event.',
    watchNext: ['Primary policy language', 'SOXX breadth', 'TSMC/Nvidia supplier mentions'],
  },
  {
    id: 'rare-earths',
    label: 'Rare earth and strategic input policy',
    category: 'Industrial policy',
    region: 'China',
    severity: 'elevated',
    keywords: ['rare earth', 'rare earths', 'lithium', 'battery', 'magnet', 'ev supply', 'critical minerals'],
    entities: ['China', 'Rare Earths', 'Lithium', 'EV Supply Chain', 'Defense Electronics'],
    markets: ['TSLA', 'LIT', 'XAR', 'GM'],
    riskChannels: ['Input scarcity', 'Policy retaliation', 'Strategic inventory rebuild'],
    narrative: 'Public coverage is touching strategic inputs that can flow into EV, battery, and defense supply chains.',
    uncertainty: 'The connector only observes public article metadata; formal rule text or primary filings still need verification.',
    watchNext: ['Policy documents', 'Battery material pricing', 'Defense electronics language'],
  },
  {
    id: 'central-bank',
    label: 'Rates, inflation, and central bank language',
    category: 'Macro',
    region: 'Global Macro',
    severity: 'watch',
    keywords: ['central bank', 'federal reserve', 'fed', 'inflation', 'rates', 'rate cut', 'bond yield', 'real yield'],
    entities: ['Federal Reserve', 'Inflation', 'Real Yields', 'Gold', 'Bitcoin', 'Nasdaq 100'],
    markets: ['QQQ', 'TLT', 'GLD', 'BTC'],
    riskChannels: ['Discount rates', 'Liquidity expectations', 'Dollar pressure'],
    narrative: 'Coverage is touching rate-sensitive assets through inflation, real-yield, and liquidity language.',
    uncertainty: 'Macro headlines are often indirect and should not be read as a single-cause market signal.',
    watchNext: ['Central bank transcripts', 'Real yields', 'Dollar and gold confirmation'],
  },
  {
    id: 'trade-policy',
    label: 'Tariffs, sanctions, and trade policy',
    category: 'Trade policy',
    region: 'Global',
    severity: 'elevated',
    keywords: ['tariff', 'tariffs', 'sanction', 'sanctions', 'export ban', 'trade restriction', 'trade war'],
    entities: ['Tariffs', 'Sanctions', 'Trade Policy', 'Supply Chains', 'China', 'United States'],
    markets: ['QQQ', 'AAPL', 'SOXX', 'XLI'],
    riskChannels: ['Margin pressure', 'Supply-chain rerouting', 'Policy retaliation'],
    narrative: 'Public coverage is clustering around trade-policy restrictions and supply-chain exposure.',
    uncertainty: 'Article metadata alone does not confirm implementation details, exemptions, or timing.',
    watchNext: ['Official notices', 'Affected sector lists', 'Company guidance language'],
  },
  {
    id: 'europe-energy',
    label: 'European energy security',
    category: 'Energy security',
    region: 'Europe',
    severity: 'watch',
    keywords: ['europe gas', 'natural gas', 'lng', 'pipeline', 'gas storage', 'energy security', 'ukraine energy'],
    entities: ['Europe', 'Natural Gas', 'LNG', 'Industrial Margins', 'Chemicals'],
    markets: ['UNG', 'VGK', 'XLB'],
    riskChannels: ['Energy cost', 'Manufacturing margin', 'Weather volatility'],
    narrative: 'Coverage maps into European energy buffers, industrial costs, and weather or pipeline sensitivity.',
    uncertainty: 'Storage and weather context require primary data confirmation before assigning stronger severity.',
    watchNext: ['Storage data', 'Pipeline notices', 'Industrial margin commentary'],
  },
]

export function buildSeedWorldIntelSnapshot(): WorldIntelSnapshot {
  return {
    enabled: false,
    status: 'disabled',
    sourceTrust: 'unavailable',
    connectorId: 'unavailable',
    connectorLabel: 'Public world connector unavailable',
    updatedAt: undefined,
    lastError: undefined,
    headlines: [],
    worldEvents: [],
    countries: [],
    assetIdentities: [],
    marketIdentities: [],
    secFilings: [],
    fredObservations: [],
    treasuryFiscalRecords: [],
    beaObservations: [],
    eiaEnergyRecords: [],
    favorites: [],
    sources: [],
    refreshControl: {
      autoRefreshEnabled: false,
      autoRefreshPaused: true,
      cadenceMs: 0,
    },
    events: [],
    signals: [],
    dailyBrief: [],
    rawSourceItems: [],
  }
}

export function deriveWorldIntelSnapshot(connector: WorldIntelConnectorSnapshot): WorldIntelSnapshot {
  const worldEvents =
    connector.worldEvents.length > 0
      ? connector.worldEvents
      : connector.headlines.map((headline) =>
          buildWorldIntelEventFromHeadline(headline, {
            sourceId: connector.connectorId,
            provenance: sourceTrustToProvenance(connector.sourceTrust),
          }),
        )
  const derived = deriveWorldIntelFromEvents(worldEvents, connector.sourceTrust)
  return {
    ...connector,
    worldEvents,
    countries: connector.countries.length > 0 ? connector.countries : deriveCountryIntelState(worldEvents),
    assetIdentities:
      connector.assetIdentities.length > 0 ? connector.assetIdentities : deriveAssetIdentitiesFromEvents(worldEvents),
    ...derived,
  }
}

export function deriveWorldIntel(
  headlines: PublicWorldHeadline[],
  sourceTrust: WorldSourceTrust,
): DerivedWorldIntel {
  const classified = headlines
    .map((headline) => classifyWorldHeadline(headline))
    .filter((item): item is ClassifiedHeadline => item !== null)

  if (classified.length === 0) {
    return emptyDerivedWorldIntel()
  }

  const groups = groupBy(classified, (item) => item.topic.id)
  const dynamicEvents = [...groups.values()].map((items) => buildRadarEvent(items, sourceTrust))
  const dynamicSignals = dynamicEvents.map((event) => buildSignal(event, sourceTrust))
  const dynamicBrief = dynamicEvents.slice(0, 4).map((event) => buildBriefItem(event, sourceTrust))
  const dynamicRaw = classified.slice(0, 25).map((item) => buildRawSourceItem(item))

  return {
    events: dynamicEvents,
    signals: dynamicSignals,
    dailyBrief: dynamicBrief,
    rawSourceItems: dynamicRaw,
  }
}

function emptyDerivedWorldIntel(): DerivedWorldIntel {
  return {
    events: [],
    signals: [],
    dailyBrief: [],
    rawSourceItems: [],
  }
}

export function deriveWorldIntelFromEvents(
  worldEvents: WorldIntelEvent[],
  sourceTrust: WorldSourceTrust,
): DerivedWorldIntel {
  const headlines = worldEvents.map((event): PublicWorldHeadline => ({
    id: event.id,
    title: event.title,
    source: event.sourceId,
    url: event.sourceUrl ?? '',
    sector: String(event.category),
    impact: `${event.summary} ${event.extractedEntities.join(' ')} ${event.narrativeTags.join(' ')}`,
    observedAt: event.timestamp,
  }))
  return deriveWorldIntel(headlines, sourceTrust)
}

export function classifyWorldHeadline(headline: PublicWorldHeadline): ClassifiedHeadline | null {
  const haystack = `${headline.title} ${headline.sector} ${headline.impact}`.toLowerCase()
  let best: { topic: TopicRule; matchedKeywords: string[] } | null = null

  for (const topic of topicRules) {
    const matchedKeywords = topic.keywords.filter((keyword) => haystack.includes(keyword))
    if (matchedKeywords.length === 0) {
      continue
    }
    if (!best || matchedKeywords.length > best.matchedKeywords.length) {
      best = { topic, matchedKeywords }
    }
  }

  return best ? { ...headline, topic: best.topic, matchedKeywords: best.matchedKeywords } : null
}

export function classifyHeadlineText(title: string): { sector: string; impact: string } {
  const headline: PublicWorldHeadline = {
    id: 'classification-probe',
    title,
    source: 'classification',
    url: '',
    sector: '',
    impact: '',
    observedAt: Date.now(),
  }
  const classified = classifyWorldHeadline(headline)
  if (!classified) {
    return {
      sector: 'World news',
      impact: 'Public headline retained without a strong Atlasz keyword/entity mapping.',
    }
  }
  return {
    sector: classified.topic.category,
    impact: `${classified.topic.label}; matched ${classified.matchedKeywords.join(', ')}`,
  }
}

export function buildWorldIntelEventFromHeadline(
  headline: PublicWorldHeadline,
  options: { sourceId?: string; provenance?: ProvenanceId } = {},
): WorldIntelEvent {
  const classified = classifyWorldHeadline(headline)
  const topic = classified?.topic
  const matchedKeywords = classified?.matchedKeywords ?? []
  const text = `${headline.title} ${headline.sector} ${headline.impact}`
  const countryCodes = inferCountryCodes(text, topic?.region)
  const region = topic?.region ?? regionFromCountryCodes(countryCodes)
  const coordinates = coordinatesForCountryCodes(countryCodes, region)
  const category = categoryFor(topic?.category ?? headline.sector)
  const affectedAssets = unique([...(topic?.markets ?? []), ...extractTickerLikeSymbols(text)]).slice(0, 16)
  const affectedCommodities = inferCommodities(text, topic?.entities ?? [])
  const affectedCurrencies = inferCurrencies(countryCodes, text)
  const extractedEntities = unique([...(topic?.entities ?? []), ...matchedKeywords.map(titleCase)]).slice(0, 18)
  const narrativeTags = unique([
    topic?.label ?? (headline.sector || 'World news'),
    ...(topic?.riskChannels ?? []),
    ...matchedKeywords.map(titleCase),
  ]).slice(0, 12)
  const rawPayloadHash = stableId(`${headline.title}|${headline.source}|${headline.url}|${headline.observedAt}`)

  return {
    id: headline.id,
    timestamp: headline.observedAt,
    title: headline.title,
    summary: headline.impact || topic?.narrative || 'Public world event retained without a stronger local mapping.',
    countryCodes,
    region,
    lat: coordinates?.lat,
    lon: coordinates?.lon,
    category,
    severity: topic?.severity ?? severityFromText(text),
    confidence: confidenceFor(Math.max(1, matchedKeywords.length), options.provenance ?? 'public-unauthenticated'),
    sourceId: options.sourceId ?? normalizeSourceId(headline.source),
    sourceUrl: headline.url,
    provenance: options.provenance ?? 'public-unauthenticated',
    affectedAssets,
    affectedSectors: inferSectors(text, topic?.category),
    affectedCommodities,
    affectedCurrencies,
    extractedEntities,
    narrativeTags,
    rawPayloadHash,
    dedupeHash: stableId(`${headline.title.toLowerCase()}|${countryCodes.join(',')}|${category}`),
  }
}

export function deriveCountryIntelState(events: WorldIntelEvent[]): CountryIntelState[] {
  const byCountry = new Map<string, WorldIntelEvent[]>()
  for (const event of events) {
    for (const code of event.countryCodes.length > 0 ? event.countryCodes : ['GLOBAL']) {
      byCountry.set(code, [...(byCountry.get(code) ?? []), event])
    }
  }

  return [...byCountry.entries()]
    .map(([code, countryEvents]) => {
      const meta = countryCatalog[code] ?? countryCatalog.GLOBAL
      const latest = Math.max(...countryEvents.map((event) => event.timestamp))
      const severityPressure = countryEvents.reduce((total, event) => total + severityWeight(event.severity), 0)
      const affectedTickers = unique(countryEvents.flatMap((event) => event.affectedAssets)).slice(0, 12)
      const provenanceBreakdown = emptyProvenanceBreakdown()
      for (const event of countryEvents) {
        provenanceBreakdown[event.provenance] = (provenanceBreakdown[event.provenance] ?? 0) + 1
      }

      return {
        countryCode: code,
        countryName: meta.name,
        flag: meta.flag,
        currentEventCount: countryEvents.length,
        macroSnapshot: {
          note: 'Macro series not available from current public sources in Phase 1.',
          provenance: 'local-derived' as const,
        },
        currency: meta.currency,
        equityProxies: meta.equityProxies,
        majorCommodities: unique([...meta.commodities, ...countryEvents.flatMap((event) => event.affectedCommodities)]).slice(0, 8),
        riskScore: Math.min(100, Math.round(18 + severityPressure * 10 + countryEvents.length * 4)),
        narrativeAcceleration: Math.min(100, Math.round(countryEvents.length * 12 + severityPressure * 4)),
        topCurrentHeadlines: countryEvents
          .sort((left, right) => right.timestamp - left.timestamp)
          .slice(0, 4)
          .map((event) => event.title),
        affectedTickers,
        lastUpdated: latest,
        provenanceBreakdown,
      }
    })
    .sort((left, right) => right.riskScore - left.riskScore)
}

export function deriveAssetIdentitiesFromEvents(events: WorldIntelEvent[]): AssetIdentity[] {
  return unique(events.flatMap((event) => event.affectedAssets))
    .slice(0, 80)
    .map((symbol) => buildAssetIdentity(symbol, {
      relatedCountries: unique(events.filter((event) => event.affectedAssets.includes(symbol)).flatMap((event) => event.countryCodes)),
      relatedSectors: unique(events.filter((event) => event.affectedAssets.includes(symbol)).flatMap((event) => event.affectedSectors)),
      provenanceCoverage: unique(events.filter((event) => event.affectedAssets.includes(symbol)).map((event) => event.provenance)),
    }))
}

export function buildAssetIdentity(
  symbol: string,
  options: Partial<Pick<AssetIdentity, 'relatedCountries' | 'relatedSectors' | 'provenanceCoverage' | 'favorite'>> = {},
): AssetIdentity {
  const normalized = symbol.toUpperCase()
  const catalog = assetCatalog[normalized]
  const type = catalog?.type ?? inferAssetIdentityType(normalized)
  return {
    symbol: normalized,
    name: catalog?.name ?? `${normalized} watchlist asset`,
    type,
    exchangeOrSource: catalog?.exchangeOrSource ?? (type === 'crypto' ? 'public crypto mapping' : 'configured universe identity'),
    iconUrl: catalog?.iconUrl,
    fallbackIcon: catalog?.fallbackIcon ?? fallbackIconFor(normalized, type),
    favorite: options.favorite ?? false,
    watchlistTags: catalog?.watchlistTags ?? [type.toLowerCase()],
    aliases: unique([normalized, ...(catalog?.aliases ?? [])]),
    relatedCountries: options.relatedCountries ?? catalog?.relatedCountries ?? [],
    relatedSectors: options.relatedSectors ?? catalog?.relatedSectors ?? [],
    dataAvailabilityStatus: catalog?.dataAvailabilityStatus ?? 'not available from current public sources; DATA_UNAVAILABLE until a real provider is configured',
    provenanceCoverage: options.provenanceCoverage ?? catalog?.provenanceCoverage ?? ['local-derived'],
  }
}

function sourceTrustToProvenance(sourceTrust: WorldSourceTrust): ProvenanceId {
  if (sourceTrust === 'public unauthenticated') return 'public-unauthenticated'
  if (sourceTrust === 'local derived') return 'local-derived'
  if (sourceTrust === 'stale' || sourceTrust === 'failed' || sourceTrust === 'unavailable') return 'local-derived'
  return sourceTrust
}

function buildRadarEvent(items: ClassifiedHeadline[], sourceTrust: WorldSourceTrust): RadarEvent {
  const topic = items[0].topic
  const observedAt = Math.max(...items.map((item) => item.observedAt))
  const sourceTrail = items.slice(0, 5).map((item) => buildSourceTrail(item, sourceTrust))
  const evidenceNotes = buildEvidenceNotes(topic, items.length, sourceTrust)

  return {
    id: topic.id,
    time: formatEventTime(observedAt),
    category: topic.category,
    region: topic.region,
    severity: topic.severity,
    confidence: confidenceFor(items.length, sourceTrust),
    sourceCount: items.length,
    title: `${topic.label} appears in public coverage`,
    summary: `${topic.narrative} Latest matched headline: ${items[0].title}`,
    relationshipReason: `Keyword/entity evidence matched ${unique(items.flatMap((item) => item.matchedKeywords)).join(', ')} and maps to ${topic.markets.join(', ')}.`,
    uncertainty: topic.uncertainty,
    detectedEntities: topic.entities,
    linkedMarkets: topic.markets,
    riskChannels: topic.riskChannels,
    evidenceNotes,
    sourceTrail,
  }
}

function buildSignal(event: RadarEvent, sourceTrust: WorldSourceTrust): Signal {
  return {
    id: `world-${event.id}`,
    title: `${event.title} · source-backed watch`,
    explanation:
      `${event.relationshipReason} This is local derived routing from public unauthenticated headline metadata, not a prediction or recommendation.`,
    status: event.severity,
    confidence: Math.max(45, event.confidence - 4),
    timeframe: 'Today',
    chain: `${event.region} -> ${event.category} -> ${event.riskChannels[0] ?? 'Risk channel'} -> ${event.linkedMarkets[0] ?? 'Watchlist'}`,
    linkedEventIds: [event.id],
    linkedEntities: event.detectedEntities,
    linkedMarkets: event.linkedMarkets,
    repeatedThemes: event.riskChannels,
    relationshipStrength: Math.min(88, 42 + event.sourceCount * 8),
    sourceCount: event.sourceCount,
    recencyScore: 76,
    uncertainty: sourceTrust === 'public unauthenticated' ? event.uncertainty : 'Derived from cached or local world context.',
    evidenceTrail: event.evidenceNotes,
    sourceTrail: event.sourceTrail,
  }
}

function buildBriefItem(event: RadarEvent, sourceTrust: WorldSourceTrust): BriefItem {
  return {
    id: `brief-${event.id}`,
    headline: event.title,
    whyItMatters: event.relationshipReason,
    severity: event.severity,
    relatedEntities: event.detectedEntities,
    relatedMarkets: event.linkedMarkets,
    confidence: event.confidence,
    sourceCount: event.sourceCount,
    uncertainty:
      sourceTrust === 'public unauthenticated'
        ? 'Public unauthenticated article metadata can be stale, duplicated, or incomplete; verify with primary sources.'
        : event.uncertainty,
    watchNext: [
      'Confirm through primary or official sources',
      'Watch whether coverage broadens across independent outlets',
      ...event.riskChannels.slice(0, 2),
    ],
    evidenceTrail: event.evidenceNotes,
    sourceTrail: event.sourceTrail,
  }
}

function buildSourceTrail(item: ClassifiedHeadline, sourceTrust: WorldSourceTrust): SourceTrailItem {
  return {
    id: `src-${item.id}`,
    sourceName: item.source,
    sourceType: 'news',
    sourceUrl: item.url,
    title: item.title,
    observedAt: new Date(item.observedAt).toISOString(),
    publishedAt: new Date(item.observedAt).toISOString(),
    note: `${sourceTrust}; matched ${item.matchedKeywords.join(', ')} for ${item.topic.label}.`,
  }
}

function buildEvidenceNotes(topic: TopicRule, sourceCount: number, sourceTrust: WorldSourceTrust): EvidenceNote[] {
  return [
    {
      id: `ev-${topic.id}-public-source-count`,
      note: `${sourceCount} public headline${sourceCount === 1 ? '' : 's'} matched the ${topic.label} routing rule.`,
      supports: 'Recency and source-count relevance',
      confidenceImpact: sourceCount > 1 ? 'raises' : 'neutral',
    },
    {
      id: `ev-${topic.id}-keyword-map`,
      note: `Matched keywords are routed locally into ${topic.entities.slice(0, 4).join(', ')} and ${topic.markets.join(', ')}.`,
      supports: 'Entity, sector, and market linkage',
      confidenceImpact: 'neutral',
    },
    {
      id: `ev-${topic.id}-trust-boundary`,
      note:
        sourceTrust === 'public unauthenticated'
          ? 'GDELT article metadata is public and unauthenticated inside Atlasz; it is evidence of coverage, not verification of claims.'
          : `Source trust is ${sourceTrust}.`,
      supports: 'Uncertainty and source-trust boundary',
      confidenceImpact: 'limits',
    },
  ]
}

function buildRawSourceItem(item: ClassifiedHeadline): RawSourceItem {
  return {
    id: `raw-${item.id}`,
    connector: 'gdelt-doc-public',
    sourceName: item.source,
    sourceUrl: item.url,
    rawTitle: item.title,
    rawExcerpt: `${item.topic.label}; matched ${item.matchedKeywords.join(', ')}`,
    ingestedAt: new Date(Date.now()).toISOString(),
    publishedAt: new Date(item.observedAt).toISOString(),
    normalizedEventId: item.topic.id,
  }
}

function confidenceFor(sourceCount: number, sourceTrust: WorldSourceTrust): number {
  const trustPenalty =
    sourceTrust === 'verified'
      ? 0
      : sourceTrust === 'official-api'
        ? 4
        : sourceTrust === 'public unauthenticated' || sourceTrust === 'public-unauthenticated' || sourceTrust === 'rss-public'
          ? 8
          : sourceTrust === 'stale'
            ? 18
            : 12
  return Math.min(72, Math.max(48, 45 + sourceCount * 7 - trustPenalty))
}

function formatEventTime(observedAt: number): string {
  return new Date(observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function groupBy<T>(items: T[], keyFor: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFor(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return groups
}

function unique<T extends string>(items: T[]): T[] {
  return [...new Set(items)]
}

function stableId(input: string): string {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return `world-${hash.toString(36)}`
}

type CountryMeta = {
  name: string
  flag: string
  region: string
  currency: string
  lat: number
  lon: number
  equityProxies: string[]
  commodities: string[]
  keywords: string[]
}

const countryCatalog: Record<string, CountryMeta> = {
  GLOBAL: {
    name: 'Global',
    flag: 'GL',
    region: 'Global',
    currency: 'DXY',
    lat: 10,
    lon: 0,
    equityProxies: ['SPY', 'QQQ', 'ACWI'],
    commodities: ['Oil', 'Gold'],
    keywords: ['global', 'world', 'central bank', 'inflation'],
  },
  US: {
    name: 'United States',
    flag: 'US',
    region: 'North America',
    currency: 'USD',
    lat: 38,
    lon: -97,
    equityProxies: ['SPY', 'QQQ', 'IWM'],
    commodities: ['Oil', 'Natural Gas'],
    keywords: ['united states', 'u.s.', 'us ', 'america', 'federal reserve', 'fed'],
  },
  CN: {
    name: 'China',
    flag: 'CN',
    region: 'Asia Pacific',
    currency: 'CNY',
    lat: 35,
    lon: 103,
    equityProxies: ['FXI', 'MCHI'],
    commodities: ['Copper', 'Rare Earths', 'Oil'],
    keywords: ['china', 'beijing', 'chinese', 'tariff', 'rare earth'],
  },
  TW: {
    name: 'Taiwan',
    flag: 'TW',
    region: 'Asia Pacific',
    currency: 'TWD',
    lat: 23.7,
    lon: 121,
    equityProxies: ['EWT', 'TSM', 'SOXX'],
    commodities: ['Semiconductors'],
    keywords: ['taiwan', 'taipei', 'tsmc'],
  },
  JP: {
    name: 'Japan',
    flag: 'JP',
    region: 'Asia Pacific',
    currency: 'JPY',
    lat: 36,
    lon: 138,
    equityProxies: ['EWJ', 'DXJ'],
    commodities: ['LNG'],
    keywords: ['japan', 'tokyo', 'yen', 'boj', 'bank of japan'],
  },
  EU: {
    name: 'European Union',
    flag: 'EU',
    region: 'Europe',
    currency: 'EUR',
    lat: 50,
    lon: 10,
    equityProxies: ['VGK', 'FEZ'],
    commodities: ['Natural Gas', 'Power'],
    keywords: ['europe', 'european union', 'ecb', 'eurozone', 'brussels'],
  },
  DE: {
    name: 'Germany',
    flag: 'DE',
    region: 'Europe',
    currency: 'EUR',
    lat: 51,
    lon: 10,
    equityProxies: ['EWG'],
    commodities: ['Natural Gas', 'Industrial Power'],
    keywords: ['germany', 'berlin', 'german'],
  },
  GB: {
    name: 'United Kingdom',
    flag: 'GB',
    region: 'Europe',
    currency: 'GBP',
    lat: 54,
    lon: -2,
    equityProxies: ['EWU'],
    commodities: ['Natural Gas'],
    keywords: ['united kingdom', 'uk ', 'britain', 'london', 'boe'],
  },
  RU: {
    name: 'Russia',
    flag: 'RU',
    region: 'Europe',
    currency: 'RUB',
    lat: 60,
    lon: 90,
    equityProxies: ['Energy proxies'],
    commodities: ['Oil', 'Natural Gas', 'Uranium'],
    keywords: ['russia', 'moscow', 'russian', 'ukraine'],
  },
  UA: {
    name: 'Ukraine',
    flag: 'UA',
    region: 'Europe',
    currency: 'UAH',
    lat: 49,
    lon: 32,
    equityProxies: ['Wheat', 'Europe risk'],
    commodities: ['Wheat', 'Natural Gas'],
    keywords: ['ukraine', 'kyiv', 'black sea'],
  },
  SA: {
    name: 'Saudi Arabia',
    flag: 'SA',
    region: 'Middle East',
    currency: 'SAR',
    lat: 24,
    lon: 45,
    equityProxies: ['Oil proxies'],
    commodities: ['Oil'],
    keywords: ['saudi', 'riyadh', 'opec'],
  },
  IR: {
    name: 'Iran',
    flag: 'IR',
    region: 'Middle East',
    currency: 'IRR',
    lat: 32,
    lon: 53,
    equityProxies: ['Oil risk'],
    commodities: ['Oil'],
    keywords: ['iran', 'tehran', 'hormuz'],
  },
  YE: {
    name: 'Yemen / Red Sea corridor',
    flag: 'YE',
    region: 'Middle East',
    currency: 'Route risk',
    lat: 15,
    lon: 43,
    equityProxies: ['XLE', 'ZIM', 'DAL'],
    commodities: ['Oil', 'Freight'],
    keywords: ['red sea', 'suez', 'houthi', 'yemen'],
  },
  BR: {
    name: 'Brazil',
    flag: 'BR',
    region: 'Latin America',
    currency: 'BRL',
    lat: -10,
    lon: -55,
    equityProxies: ['EWZ'],
    commodities: ['Iron Ore', 'Soybeans', 'Oil'],
    keywords: ['brazil', 'brasilia', 'real '],
  },
  CA: {
    name: 'Canada',
    flag: 'CA',
    region: 'North America',
    currency: 'CAD',
    lat: 56,
    lon: -106,
    equityProxies: ['EWC'],
    commodities: ['Oil', 'Uranium', 'Gold'],
    keywords: ['canada', 'ottawa', 'canadian', 'bank of canada'],
  },
  NO: {
    name: 'Norway',
    flag: 'NO',
    region: 'Europe',
    currency: 'NOK',
    lat: 61,
    lon: 8,
    equityProxies: ['Energy proxies'],
    commodities: ['Oil', 'Natural Gas'],
    keywords: ['norway', 'norwegian', 'norges bank'],
  },
}

const assetCatalog: Record<string, Partial<AssetIdentity> & Pick<AssetIdentity, 'name' | 'type'>> = {
  BTC: {
    name: 'Bitcoin',
    type: 'crypto',
    exchangeOrSource: 'CoinGecko/CoinCap/Coinbase public capable',
    fallbackIcon: 'BTC',
    watchlistTags: ['crypto', 'liquidity'],
    aliases: ['Bitcoin', 'XBT'],
    dataAvailabilityStatus: 'public unauthenticated crypto feeds when a real connector returns data; no fallback price',
    provenanceCoverage: ['public-unauthenticated'],
  },
  ETH: {
    name: 'Ethereum',
    type: 'crypto',
    exchangeOrSource: 'CoinGecko/CoinCap/Coinbase public capable',
    fallbackIcon: 'ETH',
    watchlistTags: ['crypto'],
    aliases: ['Ethereum'],
    dataAvailabilityStatus: 'public unauthenticated crypto feeds when a real connector returns data; no fallback price',
    provenanceCoverage: ['public-unauthenticated'],
  },
  KAS: {
    name: 'Kaspa',
    type: 'crypto',
    exchangeOrSource: 'CoinGecko public REST mapping; CoinCap/Coinbase product-dependent',
    fallbackIcon: 'KAS',
    watchlistTags: ['crypto', 'watchlist'],
    aliases: ['Kaspa', 'KASUSDT', 'KAS-USD', 'KAS/USD', 'KAS/USDT'],
    dataAvailabilityStatus: 'public unauthenticated crypto mapping; PRICE_UNAVAILABLE until a configured provider returns KAS data',
    provenanceCoverage: ['public-unauthenticated'],
  },
  SPY: { name: 'SPDR S&P 500 ETF', type: 'ETF', exchangeOrSource: 'NYSE Arca', fallbackIcon: 'SPY' },
  QQQ: { name: 'Invesco QQQ Trust', type: 'ETF', exchangeOrSource: 'Nasdaq', fallbackIcon: 'QQQ' },
  SOXX: { name: 'iShares Semiconductor ETF', type: 'ETF', exchangeOrSource: 'Nasdaq', fallbackIcon: 'SOX' },
  SMH: { name: 'VanEck Semiconductor ETF', type: 'ETF', exchangeOrSource: 'Nasdaq', fallbackIcon: 'SMH' },
  XLE: { name: 'Energy Select Sector SPDR', type: 'ETF', exchangeOrSource: 'NYSE Arca', fallbackIcon: 'XLE' },
  XLK: { name: 'Technology Select Sector SPDR', type: 'sector', exchangeOrSource: 'NYSE Arca', fallbackIcon: 'XLK' },
  GLD: { name: 'SPDR Gold Shares', type: 'commodity', exchangeOrSource: 'NYSE Arca', fallbackIcon: 'Au' },
  CL: { name: 'WTI Crude proxy', type: 'commodity', exchangeOrSource: 'local commodity proxy', fallbackIcon: 'WTI' },
  USO: { name: 'United States Oil Fund', type: 'commodity', exchangeOrSource: 'NYSE Arca', fallbackIcon: 'USO' },
  DXY: { name: 'US Dollar Index', type: 'index', exchangeOrSource: 'local macro proxy', fallbackIcon: 'DXY' },
  NVDA: { name: 'Nvidia', type: 'equity', exchangeOrSource: 'Nasdaq', fallbackIcon: 'NV' },
  AMD: { name: 'Advanced Micro Devices', type: 'equity', exchangeOrSource: 'Nasdaq', fallbackIcon: 'AMD' },
  TSM: { name: 'Taiwan Semiconductor Manufacturing', type: 'equity', exchangeOrSource: 'NYSE ADR', fallbackIcon: 'TSM' },
  AAPL: { name: 'Apple', type: 'equity', exchangeOrSource: 'Nasdaq', fallbackIcon: 'APL' },
  TSLA: { name: 'Tesla', type: 'equity', exchangeOrSource: 'Nasdaq', fallbackIcon: 'TSL' },
  ZIM: { name: 'ZIM Integrated Shipping', type: 'equity', exchangeOrSource: 'NYSE', fallbackIcon: 'ZIM' },
  VLO: { name: 'Valero Energy', type: 'equity', exchangeOrSource: 'NYSE', fallbackIcon: 'VLO' },
  MP: { name: 'MP Materials', type: 'equity', exchangeOrSource: 'NYSE', fallbackIcon: 'MP' },
  REMX: { name: 'VanEck Rare Earth/Strategic Metals ETF', type: 'ETF', exchangeOrSource: 'NYSE Arca', fallbackIcon: 'RE' },
}

function inferCountryCodes(text: string, region?: string): string[] {
  const haystack = ` ${text.toLowerCase()} `
  const matches = Object.entries(countryCatalog)
    .filter(([code]) => code !== 'GLOBAL')
    .filter(([, meta]) => meta.keywords.some((keyword) => haystack.includes(` ${keyword.toLowerCase()} `) || haystack.includes(keyword.toLowerCase())))
    .map(([code]) => code)
  if (matches.length > 0) {
    return unique(matches).slice(0, 4)
  }
  if (region === 'Global' || region === 'Global Macro') {
    return ['GLOBAL']
  }
  return ['GLOBAL']
}

function regionFromCountryCodes(countryCodes: string[]): string {
  const first = countryCatalog[countryCodes[0] ?? 'GLOBAL']
  return first?.region ?? 'Global'
}

function coordinatesForCountryCodes(countryCodes: string[], region: string): { lat: number; lon: number } | null {
  const meta = countryCatalog[countryCodes[0] ?? 'GLOBAL']
  if (meta) {
    return { lat: meta.lat, lon: meta.lon }
  }
  const fallback: Record<string, { lat: number; lon: number }> = {
    'Asia Pacific': { lat: 25, lon: 120 },
    Europe: { lat: 50, lon: 10 },
    'Middle East': { lat: 25, lon: 45 },
    'North America': { lat: 39, lon: -98 },
    Global: { lat: 10, lon: 0 },
  }
  return fallback[region] ?? null
}

function categoryFor(value: string): WorldIntelCategory {
  const normalized = value.toLowerCase()
  if (normalized.includes('trade') || normalized.includes('geopolitic') || normalized.includes('policy')) return 'geopolitics'
  if (normalized.includes('macro') || normalized.includes('rate') || normalized.includes('inflation')) return 'macro'
  if (normalized.includes('energy') || normalized.includes('commodity')) return 'commodities'
  if (normalized.includes('shipping') || normalized.includes('route') || normalized.includes('infrastructure')) return 'infrastructure'
  if (normalized.includes('market')) return 'markets'
  return 'other'
}

function severityFromText(text: string): Severity {
  const normalized = text.toLowerCase()
  if (/(war|attack|missile|invasion|emergency|shutdown|crisis)/.test(normalized)) return 'critical'
  if (/(sanction|tariff|shortage|delay|strike|ban|restriction|disruption)/.test(normalized)) return 'elevated'
  if (/(watch|monitor|could|may|risk|concern)/.test(normalized)) return 'watch'
  return 'watch'
}

function inferSectors(text: string, fallback?: string): string[] {
  const normalized = text.toLowerCase()
  const sectors: string[] = []
  if (/(semiconductor|chip|gpu|ai|data center)/.test(normalized)) sectors.push('Semiconductors', 'Technology')
  if (/(oil|gas|lng|pipeline|energy|opec)/.test(normalized)) sectors.push('Energy')
  if (/(shipping|freight|port|suez|red sea)/.test(normalized)) sectors.push('Shipping', 'Transportation')
  if (/(tariff|trade|export|import)/.test(normalized)) sectors.push('Industrials', 'Consumer goods')
  if (/(rare earth|lithium|battery|copper|uranium)/.test(normalized)) sectors.push('Materials', 'Defense')
  if (fallback) sectors.push(fallback)
  return unique(sectors).slice(0, 8)
}

function inferCommodities(text: string, entities: string[]): string[] {
  const normalized = `${text} ${entities.join(' ')}`.toLowerCase()
  const commodities: string[] = []
  if (/(oil|crude|wti|brent|opec)/.test(normalized)) commodities.push('Oil')
  if (/(natural gas|lng|pipeline|gas storage)/.test(normalized)) commodities.push('Natural Gas')
  if (/(gold|real yield)/.test(normalized)) commodities.push('Gold')
  if (/(copper|power grid|data center)/.test(normalized)) commodities.push('Copper')
  if (/(rare earth|magnet|critical mineral)/.test(normalized)) commodities.push('Rare Earths')
  if (/(lithium|battery)/.test(normalized)) commodities.push('Lithium')
  if (/(uranium|nuclear)/.test(normalized)) commodities.push('Uranium')
  return unique(commodities)
}

function inferCurrencies(countryCodes: string[], text: string): string[] {
  const currencies = countryCodes.map((code) => countryCatalog[code]?.currency).filter((currency): currency is string => Boolean(currency))
  const normalized = text.toLowerCase()
  if (/(dollar|fed|federal reserve|dxy)/.test(normalized)) currencies.push('USD', 'DXY')
  if (/(euro|ecb|eurozone)/.test(normalized)) currencies.push('EUR')
  if (/(yen|boj|japan)/.test(normalized)) currencies.push('JPY')
  return unique(currencies).slice(0, 6)
}

function extractTickerLikeSymbols(text: string): string[] {
  const matches = text.match(/\b[A-Z]{2,5}\b/g) ?? []
  return matches.filter((value) => !['THE', 'AND', 'FOR', 'WITH', 'FROM', 'THIS'].includes(value)).slice(0, 10)
}

function inferAssetIdentityType(symbol: string): AssetIdentityType {
  if (['BTC', 'ETH', 'SOL', 'KAS', 'AVAX', 'LINK'].includes(symbol)) return 'crypto'
  if (['EUR/USD', 'USD/JPY', 'GBP/USD', 'DXY'].includes(symbol)) return 'FX'
  if (['CL', 'WTI', 'USO', 'GLD', 'XAUUSD', 'COPPER', 'UNG'].includes(symbol)) return 'commodity'
  if (['SPX', 'NDX', 'DJI', 'RUT', 'VIX', 'DXY'].includes(symbol)) return 'index'
  if (symbol.startsWith('XL')) return 'sector'
  if (['SPY', 'QQQ', 'SOXX', 'SMH', 'FXI', 'REMX', 'LIT', 'XAR', 'TLT', 'VGK'].includes(symbol)) return 'ETF'
  return 'equity'
}

function fallbackIconFor(symbol: string, type: AssetIdentityType): string {
  if (type === 'country') return symbol.slice(0, 2)
  if (type === 'crypto') return symbol.slice(0, 4)
  return symbol.replace(/[^A-Z]/g, '').slice(0, 3) || type.slice(0, 2).toUpperCase()
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function normalizeSourceId(source: string): string {
  return source.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'public_world_source'
}

function severityWeight(severity: Severity): number {
  if (severity === 'critical') return 4
  if (severity === 'elevated') return 2.4
  if (severity === 'watch') return 1.2
  return 0.4
}

function emptyProvenanceBreakdown(): Record<ProvenanceId, number> {
  return {
    live: 0,
    delayed: 0,
    'stale-cache': 0,
    'offline-cache': 0,
    unavailable: 0,
    'public-unauthenticated': 0,
    'public-disclosure': 0,
    'official-api': 0,
    'media-observation': 0,
    'rss-public': 0,
    'local-derived': 0,
    'local-computed': 0,
    'math-derived': 0,
    'local-model': 0,
    'model-inferred': 0,
    'auth-gated': 0,
    verified: 0,
    simulated: 0,
  }
}
