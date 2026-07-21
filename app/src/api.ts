import { parseSnapshotV1 } from './lib/snapshot'
import type { SnapshotMode, SnapshotV1 } from './types/snapshot'

export interface SnapshotFetchResult {
  snapshot: SnapshotV1
}

export const MAX_TITLE_BYTES = 200
export const MAX_BODY_BYTES = 8_000

let sessionTokenPromise: Promise<string> | null = null

export type NewWorkResult =
  | {
      ok: true
      url: string
      actor: string
      number: number | null
      repository: string | null
    }
  | {
      ok: false
      status: number
      code: string
      message: string
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

async function requestSessionToken(): Promise<string> {
  const response = await fetch('/api/v1/session', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error(`/api/v1/session returned HTTP ${response.status}.`)
  const payload: unknown = await response.json()
  if (!isRecord(payload) || payload.schema !== 'fkst.console.session.v1') {
    throw new Error('The local server returned an unsupported session envelope.')
  }
  const sameOriginToken = isRecord(payload.same_origin_token) ? payload.same_origin_token : null
  const token = sameOriginToken?.token
  if (typeof token !== 'string' || token.length < 1 || token.length > 512) {
    throw new Error('The local server session did not include a valid same-origin token.')
  }
  return token
}

async function getSessionToken(): Promise<string> {
  if (!sessionTokenPromise) {
    sessionTokenPromise = requestSessionToken().catch((error: unknown) => {
      sessionTokenPromise = null
      throw error
    })
  }
  return sessionTokenPromise
}

function stringValue(record: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function numberValue(record: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value
  }
  return null
}

export async function fetchSnapshot(mode: SnapshotMode, signal?: AbortSignal): Promise<SnapshotFetchResult> {
  const endpoint = mode === 'fixture' ? '/fixtures/snapshot.v1.json' : '/api/v1/snapshot'
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    credentials: 'same-origin',
    signal,
  })
  if (!response.ok) throw new Error(`${endpoint} returned HTTP ${response.status}.`)
  const body: unknown = await response.json()
  const parsed = parseSnapshotV1(body, { fallbackMode: mode })
  if (!parsed.ok || !parsed.snapshot) throw new Error(parsed.error ?? 'Snapshot validation failed.')
  return { snapshot: parsed.snapshot }
}

export function parseSnapshotEvent(data: string): SnapshotV1 | null {
  let body: unknown
  try {
    body = JSON.parse(data) as unknown
  } catch {
    return null
  }
  if (isRecord(body) && typeof body.type === 'string' && body.type === 'heartbeat') return null
  const parsed = parseSnapshotV1(body, { fallbackMode: 'live' })
  return parsed.ok ? parsed.snapshot : null
}

export async function createNewWork(input: { title: string; body: string }): Promise<NewWorkResult> {
  if (!input.title.trim() || utf8ByteLength(input.title) > MAX_TITLE_BYTES || utf8ByteLength(input.body) > MAX_BODY_BYTES) {
    return {
      ok: false,
      status: 422,
      code: 'client_validation',
      message: `Title must be 1–${MAX_TITLE_BYTES} UTF-8 bytes and description at most ${MAX_BODY_BYTES} UTF-8 bytes.`,
    }
  }
  const sessionToken = await getSessionToken()
  const response = await fetch('/api/v1/issues', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-FKST-Request-Id': crypto.randomUUID(),
      'x-fkst-session-token': sessionToken,
    },
    credentials: 'same-origin',
    body: JSON.stringify(input),
  })

  let payload: unknown
  try {
    payload = await response.json() as unknown
  } catch {
    payload = null
  }
  const root = isRecord(payload) ? payload : {}
  const data = isRecord(root.data) ? root.data : root
  const error = isRecord(root.error) ? root.error : isRecord(data.error) ? data.error : root

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      code: stringValue(error, ['code', 'error_code']) ?? `http_${response.status}`,
      message: stringValue(error, ['message', 'error']) ?? 'The server rejected the issue creation request.',
    }
  }

  const actorReceipt = isRecord(root.actor) ? root.actor : null
  const issueReceipt = isRecord(root.issue) ? root.issue : null
  const url = issueReceipt ? stringValue(issueReceipt, ['url']) : null
  const actor = actorReceipt ? stringValue(actorReceipt, ['login']) : null
  if (root.schema !== 'fkst.console.issue-created.v1') {
    return {
      ok: false,
      status: response.status,
      code: 'invalid_receipt',
      message: 'The server returned success with an unsupported issue receipt schema.',
    }
  }
  if (!url || !actor) {
    return {
      ok: false,
      status: response.status,
      code: 'invalid_receipt',
      message: 'The server returned success without both a resulting issue URL and resolved actor.',
    }
  }
  return {
    ok: true,
    url,
    actor,
    number: issueReceipt ? numberValue(issueReceipt, ['number']) : null,
    repository: issueReceipt ? stringValue(issueReceipt, ['repo']) : null,
  }
}
