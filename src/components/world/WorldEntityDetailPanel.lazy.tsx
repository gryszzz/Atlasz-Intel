/*
 * Country + asset entity detail surfaces (lazy). Provenance badges preserved
 * on asset coverage. Presentational only.
 */
import { Globe2, Star, Zap } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import type { AssetIdentity, CountryIntelState, UserFavorite } from '../../worldIntel'
import { WorldPanelHeader } from './WorldPanelHeader'

export function WorldEntityDetailPanel({
  countries,
  assets,
  favoriteIds,
  onToggleFavorite,
  onSelectTicker,
}: {
  countries: CountryIntelState[]
  assets: AssetIdentity[]
  favoriteIds: Set<string>
  onToggleFavorite: (kind: UserFavorite['kind'], targetId: string, label: string) => Promise<void>
  onSelectTicker: (ticker: string) => void
}) {
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
              favorite={favoriteIds.has(asset.symbol)}
              key={asset.symbol}
              onFavorite={() => onToggleFavorite('asset', asset.symbol, asset.symbol)}
              onSelectTicker={onSelectTicker}
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
}: {
  country: CountryIntelState
  favorite: boolean
  onFavorite: () => Promise<void>
  onSelectTicker: (ticker: string) => void
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
  favorite,
  onFavorite,
  onSelectTicker,
}: {
  asset: AssetIdentity
  favorite: boolean
  onFavorite: () => Promise<void>
  onSelectTicker: (ticker: string) => void
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
      <p>{asset.dataAvailabilityStatus}</p>
      <div className="world-chip-row">
        {asset.provenanceCoverage.map((item) => (
          <ProvenanceBadge key={item} value={item} size="sm" />
        ))}
      </div>
    </article>
  )
}
