import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'

import {
  collectResponseBody,
  rawHttpRequest,
  readSseEvent,
  repositoryPath,
  reserveLoopbackPort,
  startBff,
  stopProcess,
  waitForHttp,
} from './lib/harness.mjs'

function assertHardenedLoopbackResponse(response) {
  assert.equal(response.headers.get('access-control-allow-origin'), null)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('x-frame-options'), 'DENY')
}

describe('S2 loopback BFF health, snapshot, and SSE', () => {
  let bff
  let origin

  before(async () => {
    const port = await reserveLoopbackPort()
    origin = `http://127.0.0.1:${port}`
    bff = startBff(port)
    await waitForHttp(`${origin}/api/v1/health`, { processHandle: bff })
  })

  after(async () => stopProcess(bff))

  test('health identifies the loopback BFF without pretending missing sources are healthy', async () => {
    const response = await fetch(`${origin}/api/v1/health`, { signal: AbortSignal.timeout(5_000) })
    assert.equal(response.status, 200)
    assertHardenedLoopbackResponse(response)
    const { json } = await collectResponseBody(response)
    assert.equal(json?.schema, 'fkst.console.health.v1')
    assert.equal(json?.bff?.status, 'ok')
    assert.match(json?.bff?.bind ?? '', /^127\.0\.0\.1:\d+$/)
    assert.equal(json?.source?.availability, 'unavailable')
    assert.equal(json?.source?.verdict, null)
  })

  test('unconfigured local snapshot preserves unknown collections and delivery facts as null', async () => {
    const response = await fetch(`${origin}/api/v1/snapshot`, { signal: AbortSignal.timeout(5_000) })
    assert.equal(response.status, 200)
    assertHardenedLoopbackResponse(response)
    const { json } = await collectResponseBody(response)
    assert.equal(json?.schema, 'fkst.console.snapshot.v1')
    assert.equal(json?.data?.mode, 'local')
    assert.equal(json?.data?.posture, 'read-only')
    assert.equal(json?.data?.issues?.availability, 'unavailable')
    assert.equal(json?.data?.issues?.count, null)
    assert.equal(json?.data?.issues?.items, null)
    assert.equal(json?.data?.runtime?.availability, 'unavailable')
    assert.equal(json?.data?.runtime?.queues, null)
    assert.equal(json?.data?.runtime?.counts?.queue_depth, null)
    assert.equal(json?.data?.runtime?.counts?.dead_letters, null)
    assert.equal(json?.data?.health?.verdict, null)
  })

  test('SSE immediately emits a complete snapshot event and no permissive CORS header', async () => {
    const event = await readSseEvent(`${origin}/api/v1/events`)
    assert.equal(event.response.status, 200)
    assert.match(event.response.headers.get('content-type') ?? '', /^text\/event-stream/i)
    assert.equal(event.response.headers.get('access-control-allow-origin'), null)
    assert.equal(event.eventName, 'snapshot')
    const snapshot = JSON.parse(event.data)
    assert.equal(snapshot.schema, 'fkst.console.snapshot.v1')
    assert.equal(snapshot.data.mode, 'local')
  })

  test('read endpoints are GET-only and reject foreign Host and Origin', async () => {
    const post = await fetch(`${origin}/api/v1/snapshot`, {
      method: 'POST',
      headers: { Origin: origin },
      signal: AbortSignal.timeout(5_000),
    })
    assert.equal(post.status, 405)
    assert.equal(post.headers.get('allow'), 'GET')

    const foreignOrigin = await fetch(`${origin}/api/v1/health`, {
      headers: { Origin: 'https://attacker.invalid' },
      signal: AbortSignal.timeout(5_000),
    })
    assert.equal(foreignOrigin.status, 403)
    assert.equal((await foreignOrigin.json()).error?.code, 'invalid_origin')

    const foreignHost = await rawHttpRequest(`${origin}/api/v1/health`, {
      headers: { Host: 'attacker.invalid' },
    })
    assert.equal(foreignHost.status, 403)
    assert.equal((await foreignHost.json()).error?.code, 'invalid_host')
  })
})

describe('S2 deterministic observe and opaque health projection', () => {
  let temporaryRoot
  let bff
  let origin
  let observeAudit
  let healthAudit

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'fkst-blackbox-bff-'))
    observeAudit = join(temporaryRoot, 'observe.jsonl')
    healthAudit = join(temporaryRoot, 'health.jsonl')
    const port = await reserveLoopbackPort()
    origin = `http://127.0.0.1:${port}`
    bff = startBff(
      port,
      [
        '--observe-bin',
        repositoryPath('test', 'bin', 'fkst-framework'),
        '--durable-root',
        '/recorded/demo/root',
        '--health-script',
        repositoryPath('test', 'bin', 'health'),
      ],
      {
        FKST_OBSERVE_TRIPWIRE_FIXTURE: repositoryPath('test', 'fixtures', 'observe-offline.v1.json'),
        FKST_OBSERVE_TRIPWIRE_AUDIT: observeAudit,
        FKST_HEALTH_TRIPWIRE_AUDIT: healthAudit,
        FKST_HEALTH_TRIPWIRE_VERDICT: '1 ANOMALIES NEEDING ATTENTION\n',
      },
    )
    await waitForHttp(`${origin}/api/v1/health`, { processHandle: bff })
  })

  after(async () => {
    await stopProcess(bff)
    if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true })
  })

  test('snapshot preserves observe casing, omission, offline honesty, and health text verbatim', async () => {
    const response = await fetch(`${origin}/api/v1/snapshot`, { signal: AbortSignal.timeout(5_000) })
    assert.equal(response.status, 200)
    const snapshot = await response.json()
    const runtime = snapshot.data.runtime
    assert.equal(runtime.availability, 'available')
    assert.equal(runtime.observation_mode, 'offline')
    assert.equal(runtime.queues[0].subscriber_status, 'unknown')
    assert.equal(Object.hasOwn(runtime.queues[0], 'has_current_subscriber'), false)
    assert.equal(runtime.deliveries[0].status, 'in-flight')
    assert.equal(runtime.deliveries[0].source.kind, 'Cron')
    assert.equal(snapshot.data.health.verdict, '1 ANOMALIES NEEDING ATTENTION')
    assert.equal(snapshot.data.health.raw, '1 ANOMALIES NEEDING ATTENTION\n')

    const observeCalls = (await readFile(observeAudit, 'utf8')).trim().split('\n').map(JSON.parse)
    assert.ok(observeCalls.length >= 1)
    for (const call of observeCalls) {
      assert.deepEqual(call.argv, [
        'observe',
        '--durable-root',
        '/recorded/demo/root',
        '--json',
        '--limit',
        '1000',
      ])
    }
    const healthCalls = (await readFile(healthAudit, 'utf8')).trim().split('\n').map(JSON.parse)
    assert.ok(healthCalls.length >= 1)
    for (const call of healthCalls) assert.deepEqual(call.argv, ['health'])
  })
})
