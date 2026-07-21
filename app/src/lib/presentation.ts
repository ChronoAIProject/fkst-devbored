import type { TransportState } from '../hooks/useSnapshot'
import type { SnapshotMode, WritePosture } from '../types/snapshot'

export type SourceStatus = 'loading' | 'disconnected' | 'stale' | 'connected' | 'recorded'

export interface SourceStatusPresentation {
  state: SourceStatus
  label: string
}

export function resolveSourceStatus(
  transport: TransportState,
  stale: boolean,
  mode: SnapshotMode,
): SourceStatusPresentation {
  if (transport === 'loading') return { state: 'loading', label: 'Loading' }
  if (transport === 'disconnected') return { state: 'disconnected', label: 'Disconnected' }
  if (stale) return { state: 'stale', label: 'Stale' }
  return mode === 'fixture'
    ? { state: 'recorded', label: 'Recorded' }
    : { state: 'connected', label: 'Connected' }
}

export type NewWorkAvailabilityState = 'available' | 'unavailable' | 'server-resolved'

export interface NewWorkAvailability {
  state: NewWorkAvailabilityState
  allowed: boolean
  headline: string
  reason: string
}

export function resolveNewWorkAvailability(
  mode: SnapshotMode,
  posture: WritePosture,
): NewWorkAvailability {
  if (mode === 'fixture') {
    return {
      state: 'unavailable',
      allowed: false,
      headline: 'Unavailable in recorded mode',
      reason: 'The fixture is provenance-bound demo data. No session or write request will be sent.',
    }
  }

  if (posture.writesEnabled === false || posture.issueCreationEnabled === false) {
    return {
      state: 'unavailable',
      allowed: false,
      headline: 'Unavailable for this launch',
      reason: posture.reason ?? 'The validated deployment posture explicitly disables issue creation.',
    }
  }

  if (posture.writesEnabled === true && posture.issueCreationEnabled === true) {
    return {
      state: 'available',
      allowed: true,
      headline: 'Available through the guarded live session',
      reason: posture.reason ?? 'The server still verifies origin, session token, actor, repository, mode, and label in one guarded operation.',
    }
  }

  return {
    state: 'server-resolved',
    allowed: true,
    headline: 'Availability is resolved by the server',
    reason: posture.reason ?? 'The snapshot does not declare every write gate. A same-origin session request will resolve the live path, and the server remains authoritative.',
  }
}
