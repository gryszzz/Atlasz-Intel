/*
 * Country + asset entity detail surfaces (lazy). Provenance badges preserved
 * on asset coverage. Presentational only.
 */
import { Globe2, Link2, Plus, Star, Zap } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import type { WatchedEntity } from '../../engine/worldwatchProfiles'
import type { AssetIdentity, CountryIntelState, SecCompanyFiling, UserFavorite } from '../../worldIntel'
import { WorldPanelHeader } from './WorldPanelHeader'

export function WorldEntityDetailPanel({
  countries,
  assets,
  secFilings,
  favoriteIds,
  onToggleFavorite,
  onSelectTicker,
  onAddToWatchlist,
  watchlistEnabled = true,
}: {
  countries: CountryIntelState[]
  assets: AssetIdentity[]
  secFilings?: SecCompanyFiling[]
  favoriteIds: Set<string>
  onToggleFavorite: (kind: UserFavorite['kind'], targetId: string, label: string) => Promise<void>
  onSelectTicker: (ticker: string) => void
  onAddToWatchlist?: (entity: WatchedEntity) => void
  watchlistEnabled?: boolean
}) {
  const filingsByTicker = groupFilingsByTicker(secFilings ?? [])
  return (
    <>
      <article className="world-panel">
        <WorldPanelHeader icon={Globe2} label="Country Intelligence" value={`${countries.length} cards`} />
        <div className="country-card-grid">
          {countries.map((country) => (
            <CountryIntelCard
              country={country}
              favorite={favoriteIds.has(country.countryCode)}
              key={country.countryCode}
              onFavorite={() => onToggleFavorite('country', country.countryCode, country.countryName)}
              onSelectTicker={onSelectTicker}
              onAddToWatchlist={onAddToWatchlist}
              watchlistEnabled={watchlistEnabled}
            />
          ))}
        </div>
      </article>

      <article className="world-panel">
        <WorldPanelHeader icon={Zap} label="Asset Identity" value={`${assets.length} cards`} />
        <div className="asset-identity-grid">
          {assets.map((asset) => (
            <AssetIdentityCard
              asset={asset}
              latestFilings={filingsByTicker.get(asset.symbol) ?? []}
              favorite={favoriteIds.has(asset.symbol)}
              key={asset.symbol}
              onFavorite={() => onToggleFavorite('asset', asset.symbol, asset.symbol)}
              onSelectTicker={onSelectTicker}
              onAddToWatchlist={onAddToWatchlist}
              watchlistEnabled={watchlistEnabled}
            />
          ))}
        </div>
      </article>
    </>
  )
}

function CountryIntelCard({
  country,
  favorite,
  onFavorite,
  onSelectTicker,
  onAddToWatchlist,
  watchlistEnabled,
}: {
  country: CountryIntelState
  favorite: boolean
  onFavorite: () => Promise<void>
  onSelectTicker: (ticker: string) => void
  onAddToWatchlist?: (entity: WatchedEntity) => void
  watchlistEnabled: boolean
}) {
  return (
    <article className="country-intel-card">
      <header>
        <span>{country.flag}</span>
        <div>
          <strong>{country.countryName}</strong>
          <em>{country.currency}</em>
        </div>
        <button className={favorite ? 'favorite-button active' : 'favorite-button'} type="button" onClick={() => void onFavorite()}>
          <Star size={13} />
        </button>
      </header>
      {onAddToWatchlist ? (
        <button
          className="world-add-watch"
          type="button"
          disabled={!watchlistEnabled}
          onClick={() => onAddToWatchlist({ kind: 'country', value: country.countryCode, label: country.countryName })}
        >
          <Plus size={12} />
          Add to watchlist
        </button>
      ) : null}
      <div className="country-risk-meter">
        <span style={{ width: `${country.riskScore}%` }} />
      </div>
      <div className="country-metrics">
        <div>
          <span>Risk</span>
          <strong>{country.riskScore}</strong>
        </div>
        <div>
          <span>Events</span>
          <strong>{country.currentEventCount}</strong>
        </div>
        <div>
          <span>Narrative</span>
          <strong>{country.narrativeAcceleration}</strong>
        </div>
      </div>
      <p>{country.macroSnapshot.note}</p>
      <div className="world-market-row">
        {country.affectedTickers.slice(0, 6).map((ticker) => (
          <button key={ticker} type="button" onClick={() => onSelectTicker(ticker)}>
            {ticker}
          </button>
        ))}
      </div>
    </article>
  )
}

function AssetIdentityCard({
  asset,
  latestFilings,
  favorite,
  onFavorite,
  onSelectTicker,
  onAddToWatchlist,
  watchlistEnabled,
}: {
  asset: AssetIdentity
  latestFilings: SecCompanyFiling[]
  favorite: boolean
  onFavorite: () => Promise<void>
  onSelectTicker: (ticker: string) => void
  onAddToWatchlist?: (entity: WatchedEntity) => void
  watchlistEnabled: boolean
}) {
  return (
    <article className="asset-identity-card">
      <button className="asset-icon" type="button" onClick={() => onSelectTicker(asset.symbol)}>
        {asset.iconUrl ? <img src={asset.iconUrl} alt="" onError={(event) => event.currentTarget.remove()} /> : asset.fallbackIcon}
      </button>
      <div>
        <strong>{asset.symbol}</strong>
        <span>{asset.name}</span>
        <em>
          {asset.type} / {asset.exchangeOrSource}
        </em>
      </div>
      <button className={favorite ? 'favorite-button active' : 'favorite-button'} type="button" onClick={() => void onFavorite()}>
        <Star size={13} />
      </button>
      {onAddToWatchlist ? (
        <button
          className="world-add-watch"
          type="button"
          disabled={!watchlistEnabled}
          onClick={() => onAddToWatchlist(assetWatchEntity(asset))}
        >
          <Plus size={12} />
          Add to watchlist
        </button>
      ) : null}
      <p>{asset.dataAvailabilityStatus}</p>
      <div className="world-chip-row">
        {asset.provenanceCoverage.map((item) => (
          <ProvenanceBadge key={item} value={item} size="sm" />
        ))}
      </div>
      <SecFilingSourceTrail filings={latestFilings} />
    </article>
  )
}

function assetWatchEntity(asset: AssetIdentity): WatchedEntity {
  if (asset.type === 'ETF') return { kind: 'etf', value: asset.symbol, label: asset.name, aliases: asset.aliases }
  if (asset.type === 'commodity') return { kind: 'commodity', value: asset.symbol, label: asset.name, aliases: asset.aliases }
  return { kind: 'ticker', value: asset.symbol, label: asset.name, aliases: asset.aliases }
}

function SecFilingSourceTrail({ filings }: { filings: SecCompanyFiling[] }) {
  return (
    <section className="sec-filing-trail">
      <header>
        <span>Latest SEC Filings</span>
        <strong>{filings.length > 0 ? `${filings.length} official` : 'DATA_UNAVAILABLE'}</strong>
      </header>
      {filings.length > 0 ? (
        <div className="sec-filing-stack">
          {filings.slice(0, 3).map((filing) => (
            <article key={filing.id} className="sec-filing-row">
              <div>
                <strong>{filing.formType}</strong>
                <span>{filing.filingDate}</span>
                <em>{formatFilingAge(filing.acceptedAt ?? filing.observedAt)} fresh</em>
              </div>
              <div className="sec-filing-meta">
                <ProvenanceBadge value={filing.provenance} size="sm" />
                <span>{filing.confidence}% confidence</span>
              </div>
              <a href={filing.sourceUrl} target="_blank" rel="noreferrer">
                <Link2 size={12} />
                SEC source trail
              </a>
              <small>
                {filing.sourceName} · accession {filing.accessionNumber}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <div className="sec-filing-empty">
          <p>SEC filings unavailable for this entity until the EDGAR connector returns official records.</p>
        </div>
      )}
    </section>
  )
}

function groupFilingsByTicker(filings: SecCompanyFiling[]): Map<string, SecCompanyFiling[]> {
  const groups = new Map<string, SecCompanyFiling[]>()
  for (const filing of filings) {
    if (!filing.ticker) {
      continue
    }
    const ticker = filing.ticker.toUpperCase()
    groups.set(ticker, [...(groups.get(ticker) ?? []), filing])
  }
  for (const [ticker, items] of groups.entries()) {
    groups.set(ticker, [...items].sort((left, right) => right.observedAt - left.observedAt))
  }
  return groups
}

function formatFilingAge(timestamp: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000))
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.round(minutes / 60)
  if (hours < 48) {
    return `${hours}h`
  }
  return `${Math.round(hours / 24)}d`
}
