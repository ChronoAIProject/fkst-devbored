import { createNewWork } from '../../app/src/api.ts'

const session = {
  schema: 'fkst.console.session.v1',
  posture: 'write-enabled',
  write: {
    available: true,
    sandbox_repo: 'demo-owner/demo-sandbox',
  },
  same_origin_token: {
    header: 'x-fkst-session-token',
    token: 'blackbox-session-token-1234567890',
  },
}

const receipt = {
  schema: 'fkst.console.issue-created.v1',
  actor: {
    login: 'human-tester',
    normalized: 'human-tester',
  },
  issue: {
    number: 123,
    url: 'https://github.com/demo-owner/demo-sandbox/issues/123',
    repo: 'demo-owner/demo-sandbox',
    label: 'fkst-dev:enabled',
  },
}

const calls: Array<{ url: string; headers: Record<string, string> }> = []

Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: { querySelector: () => null },
})

globalThis.fetch = (async (input: RequestInfo | URL, options: RequestInit = {}) => {
  const url = String(input)
  calls.push({ url, headers: Object.fromEntries(new Headers(options.headers).entries()) })
  if (url.endsWith('/api/v1/session')) {
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (url.endsWith('/api/v1/issues')) {
    return new Response(JSON.stringify(receipt), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  throw new Error(`Unexpected UI fetch: ${url}`)
}) as typeof fetch

const result = await createNewWork({ title: 'Consumer probe', body: '' })
process.stdout.write(`UI_CONSUMER=${JSON.stringify({ calls, result })}\n`)
