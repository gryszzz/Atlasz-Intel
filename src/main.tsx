import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WorldShell from './world/WorldShell'

const LegacyApp = lazy(() => import('./App.tsx'))

function Root() {
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
