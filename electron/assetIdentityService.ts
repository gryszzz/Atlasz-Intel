import { buildAssetIdentity, type AssetIdentity, type UserFavorite, type WorldIntelEvent } from '../src/worldIntel'
import type { IntelPersistence } from './persistence'

export class AssetIdentityService {
  private readonly persistence: IntelPersistence

  constructor(persistence: IntelPersistence) {
    this.persistence = persistence
  }

  list(): AssetIdentity[] {
    const favorites = new Set(this.persistence.listFavorites().map((favorite) => favorite.targetId))
    return this.persistence
      .listAssetIdentities()
      .map((identity) => ({ ...identity, favorite: favorites.has(identity.symbol) || identity.favorite }))
  }

  ensureForEvents(events: WorldIntelEvent[]): AssetIdentity[] {
    const existing = new Map(this.list().map((identity) => [identity.symbol, identity]))
    const symbols = [...new Set(events.flatMap((event) => event.affectedAssets))]
    const next: AssetIdentity[] = []
    for (const symbol of symbols) {
      const relatedEvents = events.filter((event) => event.affectedAssets.includes(symbol))
      const identity =
        existing.get(symbol) ??
        buildAssetIdentity(symbol, {
          relatedCountries: [...new Set(relatedEvents.flatMap((event) => event.countryCodes))],
          relatedSectors: [...new Set(relatedEvents.flatMap((event) => event.affectedSectors))],
          provenanceCoverage: [...new Set(relatedEvents.map((event) => event.provenance))],
        })
      this.persistence.saveAssetIdentity(identity)
      next.push(identity)
    }
    return this.list().length > 0 ? this.list() : next
  }

  toggleFavorite(kind: UserFavorite['kind'], targetId: string, label: string): UserFavorite[] {
    const id = `${kind}:${targetId}`
    const existing = this.persistence.listFavorites().find((favorite) => favorite.id === id)
    if (existing) {
      this.persistence.deleteFavorite(id)
      return this.persistence.listFavorites()
    }
    this.persistence.saveFavorite({
      id,
      kind,
      targetId,
      label,
      createdAt: Date.now(),
    })
    return this.persistence.listFavorites()
  }
}
