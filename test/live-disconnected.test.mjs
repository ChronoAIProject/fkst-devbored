import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'

import { dumpRenderedDom } from './lib/browser.mjs'
import {
  reserveLoopbackPort,
  startApp,
  stopProcess,
  waitForHttp,
} from './lib/harness.mjs'

describe('S1 live-disconnected honesty', () => {
  let liveApp
  let liveOrigin

  before(async () => {
    const livePort = await reserveLoopbackPort()
    liveOrigin = `http://127.0.0.1:${livePort}`
    liveApp = startApp('live', livePort)
    await waitForHttp(`${liveOrigin}/`, { processHandle: liveApp })
  })

  after(async () => stopProcess(liveApp))

  test('live mode without a BFF renders disconnected and unknown, never a fabricated healthy zero', async () => {
    const result = await dumpRenderedDom(`${liveOrigin}/`, { virtualTimeBudgetMs: 4_000 })
    assert.match(result.dom, /disconnected/i)
    assert.match(result.dom, /unknown|unavailable|unreachable/i)
    assert.doesNotMatch(result.dom, /Recorded demo data/i)
    assert.doesNotMatch(result.dom, /HEALTHY/i, 'An unreachable live BFF must not be rendered as healthy.')
    assert.doesNotMatch(
      result.dom,
      /(?:queue depth|dead letters?|dlq)[^<]{0,80}>?\s*0(?:\s|<)/i,
      'Unreachable delivery facts must remain unknown rather than zero.',
    )
  })
})
