import { describe, expect, it } from 'vitest'

import type { WritePosture } from '../types/snapshot'
import { resolveNewWorkAvailability, resolveSourceStatus } from './presentation'

const UNKNOWN_POSTURE: WritePosture = {
  label: 'READ-ONLY',
  writesEnabled: null,
  issueCreationEnabled: null,
  actor: null,
  repository: null,
  reason: null,
}

describe('resolveSourceStatus', () => {
  it('uses loading, disconnected, stale, then connected priority', () => {
    expect(resolveSourceStatus('loading', true, 'live')).toEqual({ state: 'loading', label: 'Loading' })
    expect(resolveSourceStatus('disconnected', true, 'live')).toEqual({ state: 'disconnected', label: 'Disconnected' })
    expect(resolveSourceStatus('connected', true, 'live')).toEqual({ state: 'stale', label: 'Stale' })
    expect(resolveSourceStatus('connected', false, 'live')).toEqual({ state: 'connected', label: 'Connected' })
    expect(resolveSourceStatus('connected', false, 'fixture')).toEqual({ state: 'recorded', label: 'Recorded' })
  })
})

describe('resolveNewWorkAvailability', () => {
  it('keeps an unknown live posture on the guarded server-resolved path', () => {
    expect(resolveNewWorkAvailability('live', UNKNOWN_POSTURE)).toMatchObject({
      state: 'server-resolved',
      allowed: true,
    })
  })

  it('disables an explicitly unavailable live posture and preserves its reason', () => {
    expect(resolveNewWorkAvailability('live', {
      ...UNKNOWN_POSTURE,
      writesEnabled: false,
      reason: 'Writes are disabled for this launch.',
    })).toEqual({
      state: 'unavailable',
      allowed: false,
      headline: 'Unavailable for this launch',
      reason: 'Writes are disabled for this launch.',
    })
  })
})
