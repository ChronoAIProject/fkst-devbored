import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'

import { CdpBrowser, CDP_PROFILE_PREFIX } from './lib/cdp.mjs'
import {
  collectResponseBody,
  repositoryPath,
  reserveLoopbackPort,
  startApp,
  startBff,
  stopProcess,
  waitForHttp,
} from './lib/harness.mjs'

// S5: a real browser must render the live read-only topology — populated
// Workflow issue and PR cards from the controlled fake GitHub projection,
// visible read-only posture, visible Council/Runtime unavailability — with
// every API request on the app origin and zero fixture-snapshot selection.
// The GitHub source is the repository-local fake gh projection fixture, so
// this proves browser-rendered live *topology*, not a real GitHub read.
describe('S5 browser-rendered live read-only topology', () => {
  let temporaryRoot
  let ghAuditPath
  let bff
  let app
  let appOrigin
  let bffOrigin
  let browser
  let expectedIssueCount
  let expectedPullRequestCount

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'fkst-blackbox-browser-dom-'))
    ghAuditPath = join(temporaryRoot, 'gh.jsonl')
    const bffPort = await reserveLoopbackPort()
    const appPort = await reserveLoopbackPort()
    bffOrigin = `http://127.0.0.1:${bffPort}`
    appOrigin = `http://127.0.0.1:${appPort}`
    bff = startBff(
      bffPort,
      ['--sandbox-repo', 'demo-owner/demo-sandbox', '--bot-login', 'loop-agent'],
      {
        GH_TRIPWIRE_AUDIT: ghAuditPath,
        GH_TRIPWIRE_PROJECTION_FIXTURE: repositoryPath(
          'test', 'fixtures', 'github-projection.populated.v1.json',
        ),
      },
    )
    await waitForHttp(`${bffOrigin}/api/v1/health`, { processHandle: bff })
    app = startApp('live', appPort, { VITE_BFF_TARGET: bffOrigin })
    await waitForHttp(`${appOrigin}/`, { processHandle: app })

    // Same-run expected counts come from the live proxied snapshot, never
    // from hardcoded fixture knowledge.
    const snapshotResponse = await fetch(`${appOrigin}/api/v1/snapshot`, {
      headers: { Origin: appOrigin },
      signal: AbortSignal.timeout(10_000),
    })
    const { json } = await collectResponseBody(snapshotResponse)
    assert.equal(snapshotResponse.status, 200)
    assert.equal(json?.data?.mode, 'local')
    assert.equal(json?.data?.posture, 'read-only')
    expectedIssueCount = json?.data?.issues?.count
    expectedPullRequestCount = json?.data?.pull_requests?.count
    assert.ok(Number.isSafeInteger(expectedIssueCount) && expectedIssueCount >= 1)
    assert.ok(Number.isSafeInteger(expectedPullRequestCount) && expectedPullRequestCount >= 1)

    browser = new CdpBrowser()
    await browser.launch()
    await browser.navigate(`${appOrigin}/`)
  })

  after(async () => {
    if (browser) await browser.close()
    await stopProcess(app)
    await stopProcess(bff)
    if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true })
  })

  test('the rendered Workflow leaves loading and shows the populated issue and PR from the live snapshot', async () => {
    await browser.waitForExpression(
      "document.querySelector('.work-card') !== null && document.querySelector('.pr-row') !== null",
    )
    const rendered = await browser.evaluate(`JSON.stringify({
      issueCards: document.querySelectorAll('.work-card').length,
      pullRequestRows: document.querySelectorAll('.pr-row').length,
      loadingSurfaces: document.querySelectorAll('.status-surface--loading').length,
      body: document.body.innerText,
    })`)
    const page = JSON.parse(rendered)
    assert.equal(page.loadingSurfaces, 0, 'The rendered board must have left every loading state.')
    assert.equal(page.issueCards, expectedIssueCount, 'DOM issue cards must equal the same-run snapshot count.')
    assert.equal(page.pullRequestRows, expectedPullRequestCount, 'DOM PR rows must equal the same-run snapshot count.')
    assert.match(page.body, /Prove the browser-rendered live console/)
    assert.match(page.body, /Implement the live DOM proof/)
    assert.match(page.body, /Live local/, 'The console must visibly label live local data.')
    assert.match(page.body, /READ-ONLY/, 'The console must visibly label the read-only posture.')
    assert.doesNotMatch(page.body, /Recorded demo data/)
  })

  test('Council and Runtime visibly render unavailable, never fabricated values', async () => {
    await browser.evaluate("window.location.hash = '#/council'")
    await browser.waitForExpression("document.body.innerText.includes('Seat roster unknown')")
    await browser.evaluate("window.location.hash = '#/runtime'")
    await browser.waitForExpression("document.body.innerText.includes('Delivery rows unknown')")
    const runtimeText = await browser.evaluate('document.body.innerText')
    assert.match(runtimeText, /No verbatim health output was included\. Health is unknown\./)
    assert.doesNotMatch(runtimeText, /HEALTHY/, 'Unconfigured runtime must never fabricate a healthy verdict.')
  })

  test('the in-page session read reports read-only with writes neither requested nor available', async () => {
    const session = await browser.evaluate(
      "fetch('/api/v1/session', { cache: 'no-store' }).then((r) => r.json())",
    )
    assert.equal(session.schema, 'fkst.console.session.v1')
    assert.equal(session.posture, 'read-only')
    assert.equal(session.write?.requested, false)
    assert.equal(session.write?.available, false)
  })

  test('network telemetry proves app-origin API usage and no fixture snapshot selection', async () => {
    const urls = browser.requests.map((request) => request.url)
    const status = (suffix) => browser.responses.find((response) => response.url === `${appOrigin}${suffix}`)?.status
    assert.equal(status('/api/v1/snapshot'), 200, `Snapshot must be served 200 through the app origin. Saw: ${urls.join(', ')}`)
    assert.equal(status('/api/v1/session'), 200, 'Session must be served 200 through the app origin.')
    assert.ok(urls.includes(`${appOrigin}/api/v1/events`), 'The live event stream must be requested through the app origin.')
    assert.deepEqual(urls.filter((url) => url.includes('/fixtures/')), [], 'The recorded fixture snapshot must never be selected in live mode.')
    assert.deepEqual(urls.filter((url) => url.startsWith(bffOrigin)), [], 'The browser must never bypass the app origin to reach the BFF directly.')
    const external = urls.filter((url) => /^https?:\/\//.test(url) && !url.startsWith(appOrigin))
    assert.deepEqual(external, [], 'The rendered live console must not contact any non-app origin.')
  })

  test('a timestamped screenshot is captured and no uncaught application error occurred', async () => {
    const screenshotPath = join(temporaryRoot, `live-dom-${Date.now()}.png`)
    await browser.screenshot(screenshotPath)
    const screenshot = await stat(screenshotPath)
    assert.ok(screenshot.size > 4_096, 'The screenshot must be a non-trivial rendered capture.')
    assert.deepEqual(browser.pageExceptions, [], 'The rendered console must not throw uncaught exceptions.')
  })

  test('the run performed no GitHub mutation and reaps only its own browser profile', async () => {
    const audit = await readFile(ghAuditPath, 'utf8')
    const records = audit.split('\n').filter(Boolean).map(JSON.parse)
    assert.ok(records.length >= 1, 'The BFF must have exercised the fake gh read path.')
    assert.deepEqual(records.filter((record) => record.mutation === true), [])

    await browser.close()
    browser = null
    const leaked = (await readdir(tmpdir())).filter((entry) => entry.startsWith(CDP_PROFILE_PREFIX))
    assert.deepEqual(leaked, [], 'The CDP browser must remove its own temporary profile exactly.')
  })
})
