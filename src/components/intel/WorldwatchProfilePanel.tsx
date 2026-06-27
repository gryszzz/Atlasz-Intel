import { useMemo, useState, type FormEvent } from 'react'
import { Plus, ShieldCheck } from 'lucide-react'
import type {
  WatchedEntity,
  WatchableEntityKind,
  WorldwatchProfile,
} from '../../engine/worldwatchProfiles'

const ENTITY_KIND_OPTIONS: Array<{ value: WatchableEntityKind; label: string }> = [
  { value: 'ticker', label: 'ticker' },
  { value: 'company', label: 'company' },
  { value: 'cik', label: 'CIK' },
  { value: 'etf', label: 'ETF' },
  { value: 'commodity', label: 'commodity' },
  { value: 'country', label: 'country' },
  { value: 'region', label: 'region' },
  { value: 'facility', label: 'facility' },
  { value: 'port', label: 'port' },
  { value: 'grid-region', label: 'grid region' },
  { value: 'balancing-authority', label: 'BA' },
  { value: 'mineral', label: 'mineral' },
  { value: 'cyber-technology', label: 'cyber tech' },
  { value: 'cve', label: 'CVE' },
]

export function WorldwatchProfilePanel({
  activeProfile,
  activeProfileId,
  profiles,
  relevantEventCount,
  totalEventCount,
  onActiveProfileChange,
  onAddEntity,
}: {
  activeProfile?: WorldwatchProfile
  activeProfileId: string
  profiles: WorldwatchProfile[]
  relevantEventCount: number
  totalEventCount: number
  onActiveProfileChange: (profileId: string) => void
  onAddEntity: (entity: WatchedEntity) => void
}) {
  const [draftKind, setDraftKind] = useState<WatchableEntityKind>('ticker')
  const [draftValue, setDraftValue] = useState('')
  const profileUpdatedAt = useMemo(
    () => (activeProfile ? new Date(activeProfile.updatedAt).toLocaleDateString() : 'all evidence'),
    [activeProfile],
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = normalizeDraftValue(draftKind, draftValue)
    if (!value || !activeProfile) return
    onAddEntity({ kind: draftKind, value, label: value })
    setDraftValue('')
  }

  return (
    <article className="world-panel worldwatch-profile-panel">
      <header className="worldwatch-head">
        <div>
          <span>Aegis Worldwatch</span>
          <h3>Relevance Profiles</h3>
        </div>
        <strong>{activeProfile ? `${relevantEventCount}/${totalEventCount} relevant` : `${totalEventCount} events`}</strong>
      </header>

      <div className="worldwatch-profile-tabs" aria-label="Worldwatch profile filter">
        <button
          type="button"
          className={activeProfileId === 'all' ? 'active' : ''}
          onClick={() => onActiveProfileChange('all')}
        >
          All evidence
        </button>
        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            className={profile.id === activeProfileId ? 'active' : ''}
            onClick={() => onActiveProfileChange(profile.id)}
          >
            {profile.name}
          </button>
        ))}
      </div>

      {activeProfile ? (
        <>
          <div className="worldwatch-rule">
            <ShieldCheck size={14} />
            <span>Hermes delivers evidence. Aegis scores trust. Worldwatch only ranks relevance.</span>
          </div>
          <div className="worldwatch-chip-grid" aria-label="Profile contents">
            {activeProfile.watchedEntities.slice(0, 18).map((entity) => (
              <span key={`${entity.kind}:${entity.value}`}>{entity.label ?? entity.value}</span>
            ))}
            {activeProfile.watchedThemes.map((theme) => (
              <span key={theme}>{theme.replace(/-/g, ' ')}</span>
            ))}
            {activeProfile.watchedRegions.map((region) => (
              <span key={region}>{region}</span>
            ))}
          </div>
          <form className="worldwatch-add-form" onSubmit={submit}>
            <select
              aria-label="Watchlist entity kind"
              value={draftKind}
              onChange={(event) => setDraftKind(event.target.value as WatchableEntityKind)}
            >
              {ENTITY_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <input
              aria-label="Entity to add"
              placeholder="Add entity, region, CVE, commodity..."
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
            />
            <button type="submit" disabled={!draftValue.trim()}>
              <Plus size={13} />
              Add
            </button>
          </form>
          <p className="worldwatch-foot">Profile updated {profileUpdatedAt}. Relevance does not change proof, freshness, or confidence.</p>
        </>
      ) : (
        <div className="worldwatch-empty">
          <strong>All source-backed items visible</strong>
          <p>Select a profile to rank the terminal by the systems you care about.</p>
        </div>
      )}
    </article>
  )
}

function normalizeDraftValue(kind: WatchableEntityKind, value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return kind === 'ticker' || kind === 'etf' || kind === 'cik' || kind === 'cve'
    ? trimmed.toUpperCase()
    : trimmed
}
