import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { parseSnapshotV1 } from './snapshot'

function parseLive(data: Record<string, unknown>) {
  return parseSnapshotV1({
    schema: 'fkst.console.snapshot.v1',
    data: {
      mode: 'live',
      posture: 'read-only',
      ...data,
    },
  })
}

describe('parseSnapshotV1', () => {
  it('adapts the nested recorded BFF fixture without flattening away provenance', () => {
    const fixtureUrl = new URL('../../../demo/fixtures/snapshot.v1.json', import.meta.url)
    const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf8')) as unknown

    const result = parseSnapshotV1(fixture, { nowMs: Date.parse('2026-07-21T14:10:00Z'), fallbackMode: 'fixture' })

    expect(result.ok).toBe(true)
    expect(result.snapshot?.capturedAt).toBe('2026-07-21T14:10:00Z')
    expect(result.snapshot?.issues).toHaveLength(2)
    expect(result.snapshot?.pullRequests).toHaveLength(1)
    expect(result.snapshot?.council?.seats).toHaveLength(3)
    expect(result.snapshot?.council?.round?.decision).toBe('approved')
    expect(result.snapshot?.council?.round?.dissent).toEqual(['quality-seat'])
    expect(result.snapshot?.githubSource.artifact).toBe('sanitized GitHub issue projection')
    expect(result.snapshot?.issues?.[0]?.evidence).toHaveLength(3)
    expect(result.snapshot?.issues?.[0]?.evidence.every((marker) => marker.trusted)).toBe(true)
  })

  it('never turns malformed GitHub issue or pull-request items into authoritative empty collections', () => {
    const result = parseLive({
      issues: {
        availability: 'available',
        partial: false,
        count: 1,
        items: [null],
      },
      pull_requests: {
        availability: 'available',
        partial: false,
        count: 1,
        items: [{ number: 'invalid', title: 'Damaged PR', state: 'OPEN' }],
      },
    })

    expect(result.ok).toBe(true)
    expect(result.snapshot?.issues).toBeNull()
    expect(result.snapshot?.pullRequests).toBeNull()
    expect(result.snapshot?.githubSource).toMatchObject({
      availability: 'unknown',
      partial: true,
    })
  })

  it('aggregates partial GitHub metadata across issues and pull requests', () => {
    const result = parseLive({
      issues: {
        availability: 'available',
        partial: false,
        count: 0,
        items: [],
      },
      pull_requests: {
        availability: 'available',
        partial: true,
        count: 0,
        items: [],
      },
    })

    expect(result.ok).toBe(true)
    expect(result.snapshot?.issues).toEqual([])
    expect(result.snapshot?.pullRequests).toBeNull()
    expect(result.snapshot?.githubSource).toMatchObject({
      availability: 'available',
      partial: true,
    })
  })

  it('withholds runtime arrays and exact dead-letter counts when results are truncated', () => {
    const result = parseLive({
      runtime: {
        availability: 'available',
        truncated: { deliveries: true, dead_letters: true },
        queues: [],
        deliveries: [],
        dead_letters: [],
      },
    })

    expect(result.ok).toBe(true)
    expect(result.snapshot?.runtime?.deliveries).toBeNull()
    expect(result.snapshot?.runtime?.deadLetterCount).toBeNull()
    expect(result.snapshot?.runtime?.source).toMatchObject({
      availability: 'available',
      partial: true,
    })
  })

  it('withholds runtime arrays and exact dead-letter counts when returned items are malformed', () => {
    const result = parseLive({
      runtime: {
        availability: 'available',
        truncated: { deliveries: false, dead_letters: false },
        queues: [],
        deliveries: [null],
        dead_letters: [null],
      },
    })

    expect(result.ok).toBe(true)
    expect(result.snapshot?.runtime?.deliveries).toBeNull()
    expect(result.snapshot?.runtime?.deadLetterCount).toBeNull()
    expect(result.snapshot?.runtime?.source).toMatchObject({
      availability: 'available',
      partial: true,
    })
  })
})
