import { beforeEach, describe, expect, it, vi } from 'vitest'

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('createNewWork', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('obtains the per-launch session token and parses the structured creation receipt', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, {
        schema: 'fkst.console.session.v1',
        same_origin_token: { header: 'x-fkst-session-token', token: 'session-token-123' },
      }))
      .mockResolvedValueOnce(jsonResponse(201, {
        schema: 'fkst.console.issue-created.v1',
        actor: { login: 'human-operator', normalized: 'human-operator' },
        issue: {
          number: 73,
          url: 'https://github.com/demo/sandbox/issues/73',
          repo: 'demo/sandbox',
          label: 'fkst-dev:enabled',
        },
      }))
    vi.stubGlobal('fetch', fetchMock)
    const { createNewWork } = await import('./api')

    const result = await createNewWork({ title: 'Bound execution inputs', body: 'Acceptance evidence.' })

    expect(result).toEqual({
      ok: true,
      actor: 'human-operator',
      number: 73,
      repository: 'demo/sandbox',
      url: 'https://github.com/demo/sandbox/issues/73',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/session')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/v1/issues')
    const postOptions = fetchMock.mock.calls[1]?.[1] as RequestInit
    expect(postOptions.method).toBe('POST')
    expect(postOptions.headers).toMatchObject({ 'x-fkst-session-token': 'session-token-123' })
  })

  it('surfaces a server guard denial without retrying the write', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, {
        schema: 'fkst.console.session.v1',
        same_origin_token: { header: 'x-fkst-session-token', token: 'read-only-session' },
      }))
      .mockResolvedValueOnce(jsonResponse(403, {
        error: { code: 'writes_disabled', message: 'Writes are disabled for this launch.' },
      }))
    vi.stubGlobal('fetch', fetchMock)
    const { createNewWork } = await import('./api')

    const result = await createNewWork({ title: 'A guarded request', body: '' })

    expect(result).toEqual({
      ok: false,
      status: 403,
      code: 'writes_disabled',
      message: 'Writes are disabled for this launch.',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
