import { AssetIdentityService } from './assetIdentityService'
import type { IntelPersistence, WorldHeadlineRecord } from './persistence'
import { OsintSourceRegistry } from './osint/sourceRegistry'
import {
  buildWorldIntelEventFromHeadline,
  deriveAssetIdentitiesFromEvents,
  deriveCountryIntelState,
  deriveWorldIntelSnapshot,
  type AssetIdentity,
  type CountryIntelState,
  type OsintSourceSnapshot,
  type PublicWorldHeadline,
  type UserFavorite,
  type WorldIntelEvent,
  type WorldIntelSnapshot,
} from '../src/worldIntel'

export class WorldIntelService {
  private readonly persistence: IntelPersistence
  private readonly registry = new OsintSourceRegistry()
  private readonly assetIdentity: AssetIdentityService
  private readonly enabled = process.env.ATLASZ_ENABLE_PUBLIC_WORLD !== '0'
  private status: WorldIntelSnapshot['status'] = this.enabled ? 'stale' : 'disabled'
  private lastError: string | undefined
  private updatedAt: number | undefined
  private inFlight: Promise<WorldIntelSnapshot> | null = null

  constructor(persistence: IntelPersistence) {
    this.persistence = persistence
    this.assetIdentity = new AssetIdentityService(persistence)
    this.persistSources(this.registry.snapshots())
  }

  snapshot(): WorldIntelSnapshot {
    return this.buildSnapshot()
  }

  refresh(): Promise<WorldIntelSnapshot> {
    if (!this.enabled) {
      this.status = 'disabled'
      return Promise.resolve(this.buildSnapshot())
    }
    if (this.inFlight) {
      return this.inFlight
    }
    this.status = 'fetching'
    this.inFlight = this.registry
      .pollEnabledSources()
      .then(({ events, sources }) => {
        this.persistSources(sources)
        for (const event of events) {
          this.persistWorldEvent(event)
        }
        const allEvents = this.persistence.listWorldIntelEvents(300)
        this.persistCountryState(deriveCountryIntelState(allEvents))
        this.assetIdentity.ensureForEvents(allEvents)
        this.status = events.length > 0 || allEvents.length > 0 ? 'ready' : 'stale'
        this.lastError = sources.find((source) => source.status === 'failed')?.lastError
        this.updatedAt = Date.now()
        const snapshot = this.buildSnapshot()
        if (snapshot.worldEvents.length > 0) {
          persistDailyBrief(this.persistence, snapshot)
        }
        return snapshot
      })
      .catch((error) => {
        this.lastError = error instanceof Error ? error.message : String(error)
        this.status = this.persistence.listWorldIntelEvents(1).length > 0 || this.persistence.listHeadlines(1).length > 0 ? 'stale' : 'failed'
        return this.buildSnapshot()
      })
      .finally(() => {
        this.inFlight = null
      })
    return this.inFlight
  }

  toggleFavorite(kind: UserFavorite['kind'], targetId: string, label: string): WorldIntelSnapshot {
    this.assetIdentity.toggleFavorite(kind, targetId, label)
    return this.buildSnapshot()
  }

  private buildSnapshot(): WorldIntelSnapshot {
    const headlines = this.persistence.listHeadlines(120).map(fromHeadlineRecord)
    const persistedEvents = this.persistence.listWorldIntelEvents(300)
    const persistedIds = new Set(persistedEvents.map((event) => event.id))
    const legacyEvents = headlines
      .filter((headline) => !persistedIds.has(headline.id))
      .map((headline) =>
        buildWorldIntelEventFromHeadline(headline, {
          sourceId: headline.source || 'legacy_world_headlines',
          provenance: this.status === 'stale' ? 'local-derived' : 'public-unauthenticated',
        }),
      )
    const worldEvents = [...persistedEvents, ...legacyEvents].sort((left, right) => right.timestamp - left.timestamp)
    const countries = this.mergeCountries(this.persistence.listCountryIntelState(), deriveCountryIntelState(worldEvents))
    const assets = this.mergeAssetIdentities(this.assetIdentity.list(), deriveAssetIdentitiesFromEvents(worldEvents))
    const sources = this.mergeSources(this.registry.snapshots(), this.persistence.listOsintSources())
    const secFilings = this.persistence.listSecCompanyFilings(undefined, 120)
    const fredObservations = this.persistence.listFredMacroObservations(undefined, 120)
    const treasuryFiscalRecords = this.persistence.listTreasuryFiscalRecords(undefined, 120)
    const beaObservations = this.persistence.listBeaObservations(undefined, 120)
    const eiaEnergyRecords = this.persistence.listEiaEnergyRecords(undefined, 120)

    return deriveWorldIntelSnapshot({
      enabled: this.enabled,
      status: this.status,
      sourceTrust: this.status === 'failed' ? 'failed' : this.status === 'stale' ? 'stale' : this.enabled ? 'public-unauthenticated' : 'unavailable',
      connectorId: this.enabled ? 'gdelt_doc_public' : 'unavailable',
      connectorLabel: this.enabled ? 'Atlasz OSINT source registry' : 'Public world connector unavailable',
      updatedAt: this.updatedAt,
      lastError: this.lastError,
      headlines,
      worldEvents,
      countries,
      assetIdentities: assets,
      secFilings,
      fredObservations,
      treasuryFiscalRecords,
      beaObservations,
      eiaEnergyRecords,
      favorites: this.persistence.listFavorites(),
      sources,
    })
  }

  private persistSources(sources: OsintSourceSnapshot[]): void {
    for (const source of sources) {
      this.safePersist(() => this.persistence.saveOsintSource(source))
    }
  }

  private persistWorldEvent(event: WorldIntelEvent): void {
    if (event.secFiling) {
      this.safePersist(() => this.persistence.saveSecCompanyFiling(event.secFiling as NonNullable<WorldIntelEvent['secFiling']>))
    }
    if (event.fredObservation) {
      this.safePersist(() => this.persistence.saveFredMacroObservation(event.fredObservation as NonNullable<WorldIntelEvent['fredObservation']>))
    }
    if (event.treasuryFiscalRecord) {
      this.safePersist(() =>
        this.persistence.saveTreasuryFiscalRecord(event.treasuryFiscalRecord as NonNullable<WorldIntelEvent['treasuryFiscalRecord']>),
      )
    }
    if (event.beaObservation) {
      this.safePersist(() => this.persistence.saveBeaObservation(event.beaObservation as NonNullable<WorldIntelEvent['beaObservation']>))
    }
    if (event.eiaEnergyRecord) {
      this.safePersist(() => this.persistence.saveEiaEnergyRecord(event.eiaEnergyRecord as NonNullable<WorldIntelEvent['eiaEnergyRecord']>))
    }
    this.safePersist(() => this.persistence.saveWorldIntelEvent(event))
    this.safePersist(() => this.persistence.saveHeadline(toHeadlineRecord(event)))
    for (const asset of event.affectedAssets) {
      this.safePersist(() =>
        this.persistence.saveEventAssetLink({
          id: `world-event:${event.id}:${asset}`,
          eventId: event.id,
          assetSymbol: asset,
          relation: event.narrativeTags[0] ?? event.category,
          confidence: event.confidence / 100,
          createdAt: event.timestamp,
        }),
      )
    }
  }

  private persistCountryState(countries: CountryIntelState[]): void {
    for (const country of countries) {
      this.safePersist(() => this.persistence.saveCountryIntelState(country))
    }
  }

  private mergeSources(primary: OsintSourceSnapshot[], persisted: OsintSourceSnapshot[]): OsintSourceSnapshot[] {
    return [...new Map([...persisted, ...primary].map((source) => [source.sourceId, source])).values()]
  }

  private mergeCountries(primary: CountryIntelState[], derived: CountryIntelState[]): CountryIntelState[] {
    return [...new Map([...derived, ...primary].map((country) => [country.countryCode, country])).values()].sort(
      (left, right) => right.riskScore - left.riskScore,
    )
  }

  private mergeAssetIdentities(primary: AssetIdentity[], derived: AssetIdentity[]): AssetIdentity[] {
    const favorites = new Set(this.persistence.listFavorites().map((favorite) => favorite.targetId))
    return [...new Map([...derived, ...primary].map((asset) => [asset.symbol, asset])).values()]
      .map((asset) => ({ ...asset, favorite: favorites.has(asset.symbol) || asset.favorite }))
      .sort((left, right) => left.symbol.localeCompare(right.symbol))
  }

  private safePersist(operation: () => void): void {
    try {
      operation()
    } catch (error) {
      try {
        this.persistence.audit({
          id: `audit-world-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          eventType: 'persistence_failed',
          connectorId: 'world_intel_service',
          severity: 'error',
          message: error instanceof Error ? error.message : String(error),
          createdAt: Date.now(),
          metadata: {},
        })
      } catch {
        // Persistence failures must not crash the local intelligence layer.
      }
    }
  }
}

function persistDailyBrief(persistence: IntelPersistence, snapshot: WorldIntelSnapshot): void {
  const createdAt = snapshot.updatedAt ?? Date.now()
  const date = new Date(createdAt).toISOString().slice(0, 10)
  for (const item of snapshot.dailyBrief.slice(0, 5)) {
    persistence.saveBrief({
      id: `world-${date}-${item.id}`,
      date,
      headline: item.headline,
      body: [
        item.whyItMatters,
        `Trust: ${snapshot.sourceTrust}`,
        `Markets: ${item.relatedMarkets.join(', ')}`,
        `Uncertainty: ${item.uncertainty}`,
      ].join('\n'),
      severity: item.severity,
      confidence: item.confidence,
      createdAt,
    })
  }
}

function toHeadlineRecord(event: WorldIntelEvent): WorldHeadlineRecord {
  return {
    id: event.id,
    title: event.title,
    source: event.sourceId,
    url: event.sourceUrl ?? '',
    sector: String(event.category),
    impact: `${event.summary} Provenance: ${event.provenance}.`,
    observedAt: event.timestamp,
  }
}

function fromHeadlineRecord(record: WorldHeadlineRecord): PublicWorldHeadline {
  return {
    id: record.id,
    title: record.title,
    source: record.source,
    url: record.url,
    sector: record.sector,
    impact: record.impact,
    observedAt: record.observedAt,
  }
}
