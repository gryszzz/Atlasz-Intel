import { lazy, Suspense } from 'react'
import WorldShell from './world/WorldShell'

const LegacyApp = lazy(() => import('./App.tsx'))

export default function Root() {
  const useLegacy = new URLSearchParams(window.location.search).get('legacy') === '1'

  if (useLegacy) {
    return (
      <Suspense fallback={<div style={{ padding: 24 }}>Loading Atlasz legacy interface…</div>}>
        <LegacyApp />
      </Suspense>
    )
  }

  return <WorldShell />
}
