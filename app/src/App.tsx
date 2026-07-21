import { useCallback, useEffect, useMemo, useState } from 'react'

import { Chrome, type ViewName } from './components/Chrome'
import { NewWorkModal } from './components/NewWorkModal'
import { useSnapshot } from './hooks/useSnapshot'
import { effectiveAgeMs, isSnapshotStale } from './lib/snapshot'
import { Council } from './screens/Council'
import { Overview } from './screens/Overview'
import { Runtime } from './screens/Runtime'
import type { WritePosture } from './types/snapshot'

const FALLBACK_POSTURE: WritePosture = {
  label: 'READ-ONLY',
  writesEnabled: null,
  issueCreationEnabled: null,
  actor: null,
  repository: null,
  reason: 'No validated deployment posture is available.',
}

function viewFromHash(): ViewName {
  const candidate = window.location.hash.replace(/^#\/?/, '')
  return candidate === 'council' || candidate === 'runtime' ? candidate : 'overview'
}

export default function App() {
  const snapshotState = useSnapshot()
  const [view, setView] = useState<ViewName>(viewFromHash)
  const [newWorkOpen, setNewWorkOpen] = useState(false)

  useEffect(() => {
    const handleHashChange = () => setView(viewFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = useCallback((nextView: ViewName) => {
    setView(nextView)
    const nextHash = nextView === 'overview' ? '#/' : `#/${nextView}`
    if (window.location.hash !== nextHash) window.history.pushState(null, '', nextHash)
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [])

  const snapshot = snapshotState.snapshot
  const posture = snapshot?.posture ?? FALLBACK_POSTURE
  const snapshotAge = useMemo(
    () => snapshot ? effectiveAgeMs(snapshot.githubSource, snapshot, snapshotState.nowMs) : null,
    [snapshot, snapshotState.nowMs],
  )
  const stale = snapshot ? isSnapshotStale(snapshot, snapshotState.nowMs) : false

  return (
    <Chrome
      view={view}
      mode={snapshotState.mode}
      transport={snapshotState.transport}
      posture={posture}
      ageMs={snapshotAge}
      stale={stale}
      onNavigate={navigate}
      onNewWork={() => setNewWorkOpen(true)}
    >
      {view === 'overview' && <Overview snapshot={snapshot} transport={snapshotState.transport} error={snapshotState.error} nowMs={snapshotState.nowMs} onRetry={snapshotState.refresh} />}
      {view === 'council' && <Council snapshot={snapshot} transport={snapshotState.transport} error={snapshotState.error} nowMs={snapshotState.nowMs} onRetry={snapshotState.refresh} />}
      {view === 'runtime' && <Runtime snapshot={snapshot} transport={snapshotState.transport} error={snapshotState.error} nowMs={snapshotState.nowMs} onRetry={snapshotState.refresh} />}
      {newWorkOpen && <NewWorkModal mode={snapshotState.mode} posture={posture} onClose={() => setNewWorkOpen(false)} />}
    </Chrome>
  )
}
