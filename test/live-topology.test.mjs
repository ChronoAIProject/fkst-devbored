import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import { promisify } from 'node:util'

import {
  collectResponseBody,
  REPOSITORY_ROOT,
  reserveLoopbackPort,
  startApp,
  startBff,
  stopProcess,
  waitForHttp,
} from './lib/harness.mjs'

const execFileAsync = promisify(execFile)

function mutationRecords(records) {
  return records.filter((record) => record.mutation === true)
}

function assertBoundedRepositoryRead(argv) {
  assert.equal(argv.length, 8)
  assert.deepEqual(argv.slice(0, 3), ['api', 'graphql', '-f'])
  assert.equal(argv[4], '-F')
  assert.equal(argv[5], 'owner=demo-owner')
  assert.equal(argv[6], '-F')
  assert.equal(argv[7], 'name=demo-sandbox')
  assert.match(argv[3] ?? '', /^query=query FkstConsoleProjection\(/)
  assert.match(argv[3] ?? '', /issues\(first: 100, states: OPEN/)
  assert.match(argv[3] ?? '', /pullRequests\(first: 100, states: OPEN/)
  assert.match(argv[3] ?? '', /labels\(first: 100\) \{ pageInfo \{ hasNextPage \}/)
  assert.match(argv[3] ?? '', /comments\(first: 100\)/)
  assert.equal((argv[3]?.match(/first: 100/g) ?? []).length, 6)
  assert.equal((argv[3]?.match(/pageInfo \{ hasNextPage \}/g) ?? []).length, 6)
  assert.doesNotMatch(argv[3] ?? '', /\bmutation\b/i)
}

describe('S1/S2 live Vite-to-BFF same-origin topology', () => {
  let temporaryRoot
  let ghAuditPath
  let bff
  let app
  let appOrigin

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'fkst-blackbox-topology-'))
    ghAuditPath = join(temporaryRoot, 'gh.jsonl')
    const bffPort = await reserveLoopbackPort()
    const appPort = await reserveLoopbackPort()
    const bffOrigin = `http://127.0.0.1:${bffPort}`
    appOrigin = `http://127.0.0.1:${appPort}`
    bff = startBff(
      bffPort,
      ['--enable-writes', '--sandbox-repo', 'demo-owner/demo-sandbox', '--bot-login', 'loop-agent'],
      {
        GH_TRIPWIRE_ACTOR: 'human-tester',
        GH_TRIPWIRE_AUDIT: ghAuditPath,
        GH_TRIPWIRE_ALLOW_FAKE_MUTATION: '1',
      },
    )
    await waitForHttp(`${bffOrigin}/api/v1/health`, { processHandle: bff })

    app = startApp('live', appPort, {
      VITE_BFF_TARGET: bffOrigin,
      VITE_API_PROXY_TARGET: bffOrigin,
      FKST_BFF_ORIGIN: bffOrigin,
      BFF_ORIGIN: bffOrigin,
    })
    await waitForHttp(`${appOrigin}/`, { processHandle: app })
  })

  after(async () => {
    await stopProcess(app)
    await stopProcess(bff)
    if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true })
  })

  async function proxiedSession() {
    const response = await fetch(`${appOrigin}/api/v1/session`, {
      headers: { Origin: appOrigin },
      signal: AbortSignal.timeout(5_000),
    })
    const { json, text } = await collectResponseBody(response)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('access-control-allow-origin'), null)
    assert.match(response.headers.get('content-type') ?? '', /application\/json/i)
    assert.ok(json, `Expected proxied session JSON, received: ${text.slice(0, 240)}`)
    assert.equal(json.schema, 'fkst.console.session.v1')
    return { response, value: json }
  }

  test('session and issue endpoints are available through the browser origin without CORS', async () => {
    const { value: json } = await proxiedSession()
    assert.equal(json.schema, 'fkst.console.session.v1')
    assert.equal(json.posture, 'write-enabled')
    assert.equal(json.write?.available, true)
    assert.match(json.same_origin_token?.header ?? '', /^x-fkst-/)
    assert.equal(typeof json.same_origin_token?.token, 'string')
  })

  test('configured sandbox startup performs only the exact bounded synthetic GitHub read', async () => {
    const content = await readFile(ghAuditPath, 'utf8')
    const records = content.split('\n').filter(Boolean).map(JSON.parse)
    const reads = records.filter((record) => record.argv?.[0] === 'api' && record.argv?.[1] === 'graphql')
    assert.ok(reads.length >= 1, 'Configured sandbox+bot startup must exercise the GitHub read contract.')
    for (const read of reads) {
      assert.equal(read.mutation, false)
      assertBoundedRepositoryRead(read.argv)
    }
    assert.deepEqual(mutationRecords(records), [])
  })

  test('foreign Origin is rejected by the Vite proxy before rewrite without leaking the session token', async () => {
    const auditBefore = await readFile(ghAuditPath, 'utf8').catch(() => '')
    const auditStart = auditBefore.split('\n').filter(Boolean).length
    const response = await fetch(`${appOrigin}/api/v1/session`, {
      headers: { Origin: 'https://attacker.invalid' },
      signal: AbortSignal.timeout(5_000),
    })
    assert.equal(response.status, 403)
    assert.equal(response.headers.get('access-control-allow-origin'), null)
    const responseBody = await response.text()
    assert.doesNotMatch(
      responseBody,
      /same_origin_token|["']token["']\s*:/i,
      'A rejected cross-origin request must not receive any session-token material.',
    )
    const auditAfter = await readFile(ghAuditPath, 'utf8').catch(() => '')
    const newRecords = auditAfter.split('\n').filter(Boolean).slice(auditStart).map(JSON.parse)
    assert.deepEqual(mutationRecords(newRecords), [])
  })

  test('the session token obtained through the browser origin is required by the proxied POST', async () => {
    const { value: sessionValue } = await proxiedSession()
    const auditBefore = await readFile(ghAuditPath, 'utf8').catch(() => '')
    const auditStart = auditBefore.split('\n').filter(Boolean).length
    const response = await fetch(`${appOrigin}/api/v1/issues`, {
      method: 'POST',
      headers: {
        Origin: appOrigin,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Missing-token topology probe', body: 'Must be denied.' }),
      signal: AbortSignal.timeout(5_000),
    })
    assert.equal(response.status, 403)
    assert.equal((await response.json()).error?.code, 'invalid_session_token')
    const content = await readFile(ghAuditPath, 'utf8')
    assert.deepEqual(mutationRecords(content.split('\n').filter(Boolean).slice(auditStart).map(JSON.parse)), [])
    assert.ok(sessionValue.same_origin_token?.token)
  })

  test('valid same-origin POST receives a synthetic receipt and fake gh records the one exact mutation', async () => {
    const { value: sessionValue } = await proxiedSession()
    const auditBefore = await readFile(ghAuditPath, 'utf8').catch(() => '')
    const auditStart = auditBefore.split('\n').filter(Boolean).length
    const title = 'Admit deterministic black-box work'
    const body = 'Synthetic fake-gh request; no external write is permitted.'
    const response = await fetch(`${appOrigin}/api/v1/issues`, {
      method: 'POST',
      headers: {
        Origin: appOrigin,
        'Content-Type': 'application/json',
        [sessionValue.same_origin_token.header]: sessionValue.same_origin_token.token,
      },
      body: JSON.stringify({ title, body }),
      signal: AbortSignal.timeout(5_000),
    })
    assert.equal(response.status, 201)
    assert.equal(response.headers.get('access-control-allow-origin'), null)
    const successReceipt = await response.json()
    assert.equal(successReceipt.schema, 'fkst.console.issue-created.v1')
    assert.equal(successReceipt.actor?.login, 'human-tester')
    assert.equal(successReceipt.issue?.url, 'https://github.com/demo-owner/demo-sandbox/issues/123')

    const content = await readFile(ghAuditPath, 'utf8')
    const records = content.trim().split('\n').map(JSON.parse)
    assert.deepEqual(mutationRecords(records.slice(auditStart)).map((record) => record.argv), [[
      'issue',
      'create',
      '--repo',
      'demo-owner/demo-sandbox',
      '--title',
      title,
      '--body',
      body,
      '--label',
      'fkst-dev:enabled',
    ]])
  })

  test('the actual UI receipt parser consumes the BFF success shape', async () => {
    const { stdout } = await execFileAsync(
      'pnpm',
      ['--filter', './app', 'exec', 'vite-node', '../test/probes/ui-consumer.mts'],
      { cwd: REPOSITORY_ROOT, timeout: 15_000, maxBuffer: 1024 * 1024 },
    )
    const line = stdout.split('\n').find((candidate) => candidate.startsWith('UI_CONSUMER='))
    assert.ok(line, `UI consumer probe did not emit a result:\n${stdout}`)
    const probe = JSON.parse(line.slice('UI_CONSUMER='.length))
    assert.equal(probe.calls[0]?.url, '/api/v1/session', 'UI must acquire the per-launch token from the session endpoint.')
    const issueCall = probe.calls.find((call) => call.url === '/api/v1/issues')
    assert.ok(issueCall, 'UI did not issue its same-origin admission POST.')
    assert.equal(
      issueCall.headers?.['x-fkst-session-token'],
      'blackbox-session-token-1234567890',
      'UI POST must use the header name and token advertised by the session contract.',
    )
    assert.deepEqual(probe.result, {
      ok: true,
      url: 'https://github.com/demo-owner/demo-sandbox/issues/123',
      actor: 'human-tester',
      number: 123,
      repository: 'demo-owner/demo-sandbox',
    })
  })

  test('Vite rejects a non-loopback BFF proxy target before it can bind', async () => {
    const port = await reserveLoopbackPort()
    const invalidApp = startApp('live', port, { VITE_BFF_TARGET: 'https://attacker.invalid' })
    const timeout = new Promise((_, reject) => {
      const timer = setTimeout(() => reject(new Error(`Vite accepted an unsafe proxy target.\n${invalidApp.output()}`)), 5_000)
      timer.unref()
    })
    try {
      const [code] = await Promise.race([once(invalidApp.child, 'exit'), timeout])
      assert.notEqual(code, 0)
      assert.match(invalidApp.output(), /VITE_BFF_TARGET.*(?:loopback|127\.0\.0\.1)/i)
    } finally {
      await stopProcess(invalidApp)
    }
  })
})
