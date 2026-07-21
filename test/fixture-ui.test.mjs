import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'

import { dumpRenderedDom } from './lib/browser.mjs'
import {
  collectResponseBody,
  reserveLoopbackPort,
  startApp,
  stopProcess,
  waitForHttp,
} from './lib/harness.mjs'

describe('S1 fixture and live-disconnected black-box smoke', () => {
  let fixtureApp
  let fixtureOrigin

  before(async () => {
    const port = await reserveLoopbackPort()
    fixtureOrigin = `http://127.0.0.1:${port}`
    fixtureApp = startApp('fixture', port)
    await waitForHttp(`${fixtureOrigin}/`, { processHandle: fixtureApp })
  })

  after(async () => {
    await stopProcess(fixtureApp)
  })

  test('fixture endpoint exposes a useful, coherent snapshot.v1 contract', async () => {
    const response = await fetch(`${fixtureOrigin}/fixtures/snapshot.v1.json`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5_000),
    })
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type') ?? '', /application\/json/i)
    const { json, text } = await collectResponseBody(response)
    assert.ok(json && typeof json === 'object', `Expected JSON fixture, received: ${text.slice(0, 240)}`)
    assert.match(String(json.schema ?? json.schema_version), /snapshot\.v1|^1$/)
    const payload = json.data && typeof json.data === 'object' ? json.data : json
    assert.match(String(payload.mode ?? payload.data_mode), /fixture|demo|recorded/)
    const issues = Array.isArray(payload.issues) ? payload.issues : payload.issues?.items
    const pullRequests = Array.isArray(payload.pull_requests ?? payload.pullRequests ?? payload.prs)
      ? payload.pull_requests ?? payload.pullRequests ?? payload.prs
      : (payload.pull_requests ?? payload.pullRequests ?? payload.prs)?.items
    assert.ok(Array.isArray(issues) && issues.length > 0, 'Fixture needs non-empty Workflow issues.')
    assert.ok(
      Array.isArray(pullRequests) && pullRequests.length > 0,
      'Fixture needs a non-empty pull-request lane.',
    )
    assert.ok(payload.council && typeof payload.council === 'object', 'Fixture needs Council evidence.')
    assert.match(String(payload.posture), /read[-_ ]?only/i, 'Fixture needs an explicit read-only posture.')

    const runtimeQueue = payload.runtime?.queues?.[0]
    const runtimeDelivery = payload.runtime?.deliveries?.[0]
    assert.equal(runtimeQueue?.subscriber_status, 'unknown')
    assert.equal(
      Object.hasOwn(runtimeQueue ?? {}, 'has_current_subscriber'),
      false,
      'Offline observe fixtures must omit has_current_subscriber rather than serialize null.',
    )
    assert.equal(runtimeDelivery?.status, 'in-flight')
    assert.equal(runtimeDelivery?.source?.kind, 'Cron')

    const markerProjection = payload.markers?.projected
    assert.ok(markerProjection?.state_count > 0)
    assert.ok(markerProjection?.review_result_count > 0)
    assert.ok(markerProjection?.merge_ready_count > 0)
    assert.ok(markerProjection?.ignored_untrusted_comment_count > 0)
  })

  test('fixture mode boots in a real browser with persistent recorded-data honesty', async () => {
    const result = await dumpRenderedDom(`${fixtureOrigin}/`)
    assert.match(result.dom, /Recorded demo data/i)
    assert.match(result.dom, /Workflow/i)
    assert.match(result.dom, /Council/i)
    assert.match(result.dom, /read[- ]only/i)
    assert.doesNotMatch(result.dom, /Snapshot validation failed|returned HTTP 404|Unexpected Application Error/i)

    const directGithubRequests = result.networkUrls.filter((url) => /api\.github\.com|uploads\.github\.com/i.test(url))
    assert.deepEqual(directGithubRequests, [], `Fixture mode attempted direct GitHub access: ${directGithubRequests.join(', ')}`)
  })

})
