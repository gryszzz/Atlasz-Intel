import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addEntityToProfile,
  loadWorldwatchProfiles,
  saveWorldwatchProfiles,
  type WatchedEntity,
} from './engine/worldwatchProfiles'

const DEFAULT_ACTIVE_PROFILE_KEY = 'atlasz.worldwatch.activeProfile.v1'

function browserStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage
}

export function useWorldwatchProfiles() {
  const [profiles, setProfiles] = useState(() => loadWorldwatchProfiles(browserStorage()))
  const [activeProfileId, setActiveProfileId] = useState(() => {
    if (typeof window === 'undefined') return profiles[0]?.id ?? ''
    return window.localStorage.getItem(DEFAULT_ACTIVE_PROFILE_KEY) ?? profiles[0]?.id ?? ''
  })
  const effectiveActiveProfileId = useMemo(() => {
    if (activeProfileId === 'all' || profiles.some((profile) => profile.id === activeProfileId)) return activeProfileId
    return profiles[0]?.id ?? 'all'
  }, [activeProfileId, profiles])

  useEffect(() => {
    saveWorldwatchProfiles(browserStorage(), profiles)
  }, [profiles])

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(DEFAULT_ACTIVE_PROFILE_KEY, effectiveActiveProfileId)
  }, [effectiveActiveProfileId])

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === effectiveActiveProfileId),
    [effectiveActiveProfileId, profiles],
  )

  const addEntityToActiveProfile = useCallback(
    (entity: WatchedEntity) => {
      if (!effectiveActiveProfileId || effectiveActiveProfileId === 'all') return
      setProfiles((current) =>
        current.map((profile) =>
          profile.id === effectiveActiveProfileId ? addEntityToProfile(profile, entity) : profile,
        ),
      )
    },
    [effectiveActiveProfileId],
  )

  return {
    profiles,
    activeProfile,
    activeProfileId: effectiveActiveProfileId,
    setActiveProfileId,
    addEntityToActiveProfile,
  }
}
