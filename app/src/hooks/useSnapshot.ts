import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchSnapshot, parseSnapshotEvent } from '../api'
import type { SnapshotMode, SnapshotV1 } from '../types/snapshot'

export type TransportState = 'loading' | 'connected' | 'disconnected'

export interface SnapshotState {
  mode: SnapshotMode
  snapshot: SnapshotV1 | null
  transport: TransportState
  error: string | null
  nowMs: number
  refresh: () => void
}

function configuredMode(): SnapshotMode {
  if (import.meta.env.VITE_DATA_MODE === 'fixture' || import.meta.env.MODE === 'demo') return 'fixture'
  return 'live'
}

export function useSnapshot(): SnapshotState {
  const mode = useMemo(configuredMode, [])
  const [snapshot, setSnapshot] = useState<SnapshotV1 | null>(null)
  const [transport, setTransport] = useState<TransportState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const refresh = useCallback(() => setRefreshVersion((version) => version + 1), [])

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    if (!snapshot) setTransport('loading')
    void fetchSnapshot(mode, controller.signal)
      .then(({ snapshot: nextSnapshot }) => {
        setSnapshot(nextSnapshot)
        setTransport('connected')
        setError(null)
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return
        setTransport('disconnected')
        setError(caught instanceof Error ? caught.message : 'Snapshot source is unavailable.')
      })
    return () => controller.abort()
  }, [mode, refreshVersion])

  useEffect(() => {
    if (mode === 'fixture') return undefined
    const eventSource = new EventSource('/api/v1/events', { withCredentials: true })
    eventSource.onopen = () => {
      setTransport('connected')
      setError(null)
    }
    const acceptEvent = (event: MessageEvent<string>) => {
      const nextSnapshot = parseSnapshotEvent(event.data)
      if (!nextSnapshot) return
      setSnapshot(nextSnapshot)
      setTransport('connected')
      setError(null)
    }
    eventSource.onmessage = acceptEvent
    eventSource.addEventListener('snapshot', acceptEvent as EventListener)
    eventSource.onerror = () => {
      setTransport('disconnected')
      setError('Live event stream disconnected; the last snapshot is retained with its original age.')
    }
    return () => eventSource.close()
  }, [mode])

  return { mode, snapshot, transport, error, nowMs, refresh }
}
