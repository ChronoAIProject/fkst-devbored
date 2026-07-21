import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'

import {
  reserveLoopbackPort,
  rawHttpRequest,
  startBff,
  stopProcess,
  waitForHttp,
} from './lib/harness.mjs'

async function auditRecords(path) {
  try {
    const content = await readFile(path, 'utf8')
    return content.split('\n').filter(Boolean).map((line) => JSON.parse(line))
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}

async function assertNoGithubMutation(auditPath, startIndex = 0) {
  const records = (await auditRecords(auditPath)).slice(startIndex)
  const mutations = records.filter((record) => record.mutation === true)
  assert.deepEqual(
    mutations,
    [],
    `A request crossed a mutation guard and attempted GitHub argv: ${JSON.stringify(mutations)}`,
  )
}

async function session(origin) {
  const response = await fetch(`${origin}/api/v1/session`, { signal: AbortSignal.timeout(5_000) })
  assert.equal(response.status, 200)
  const value = await response.json()
  assert.equal(value.schema, 'fkst.console.session.v1')
  assert.match(value.same_origin_token?.header ?? '', /^x-fkst-/)
  assert.equal(typeof value.same_origin_token?.token, 'string')
  assert.ok(value.same_origin_token.token.length >= 32)
  return value
}

function issueRequest(origin, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.origin === false ? {} : { Origin: options.origin ?? origin }),
    ...(options.tokenHeader && options.token
      ? { [options.tokenHeader]: options.token }
      : {}),
    ...options.headers,
  }
  return fetch(`${origin}/api/v1/issues`, {
    method: options.method ?? 'POST',
    headers,
    body: ['GET', 'HEAD'].includes(options.method) ? undefined : JSON.stringify(
      options.body ?? { title: 'Black-box guard probe', body: 'This must never reach a real GitHub write.' },
    ),
    signal: AbortSignal.timeout(5_000),
  })
}

async function assertGuardResponse(response, status, code) {
  assert.equal(response.status, status)
  assert.equal(response.headers.get('access-control-allow-origin'), null)
  const body = await response.json()
  assert.equal(body.error?.code, code)
}

describe('S4 default read-only and HTTP method guards', () => {
  let temporaryRoot
  let auditPath
  let bff
  let origin

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'fkst-blackbox-readonly-'))
    auditPath = join(temporaryRoot, 'gh.jsonl')
    const port = await reserveLoopbackPort()
    origin = `http://127.0.0.1:${port}`
    bff = startBff(port, [], { GH_TRIPWIRE_AUDIT: auditPath })
    await waitForHttp(`${origin}/api/v1/health`, { processHandle: bff })
  })

  after(async () => {
    await stopProcess(bff)
    await assertNoGithubMutation(auditPath)
    if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true })
  })

  test('missing --enable-writes denies issue creation before actor resolution', async () => {
    const auditStart = (await auditRecords(auditPath)).length
    await assertGuardResponse(await issueRequest(origin), 403, 'writes_disabled')
    assert.deepEqual(
      (await auditRecords(auditPath)).slice(auditStart),
      [],
      'Read-only denial must not even resolve a GitHub actor.',
    )
  })

  test('every non-POST mutation method is denied', async () => {
    const auditStart = (await auditRecords(auditPath)).length
    for (const method of ['GET', 'PUT', 'PATCH', 'DELETE']) {
      const response = await issueRequest(origin, { method })
      await assertGuardResponse(response, 405, 'method_not_allowed')
      assert.equal(response.headers.get('allow'), 'POST')
    }
    await assertNoGithubMutation(auditPath, auditStart)
  })
})

describe('S4 token, Host, Origin, and repository guards under write-requested launch', () => {
  let temporaryRoot
  let auditPath
  let bff
  let origin
  let sessionValue

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'fkst-blackbox-boundary-'))
    auditPath = join(temporaryRoot, 'gh.jsonl')
    const port = await reserveLoopbackPort()
    origin = `http://127.0.0.1:${port}`
    bff = startBff(
      port,
      ['--enable-writes', '--sandbox-repo', 'demo-owner/demo-sandbox', '--bot-login', 'loop-agent'],
      { GH_TRIPWIRE_AUDIT: auditPath, GH_TRIPWIRE_ACTOR: 'human-tester' },
    )
    await waitForHttp(`${origin}/api/v1/health`, { processHandle: bff })
    sessionValue = await session(origin)
  })

  after(async () => {
    await stopProcess(bff)
    await assertNoGithubMutation(auditPath)
    if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true })
  })

  test('missing and invalid session tokens are denied', async () => {
    const auditStart = (await auditRecords(auditPath)).length
    await assertGuardResponse(await issueRequest(origin), 403, 'invalid_session_token')
    await assertGuardResponse(
      await issueRequest(origin, {
        tokenHeader: sessionValue.same_origin_token.header,
        token: 'definitely-not-the-launch-token',
      }),
      403,
      'invalid_session_token',
    )
    await assertNoGithubMutation(auditPath, auditStart)
  })

  test('missing and foreign Origin are denied', async () => {
    const auditStart = (await auditRecords(auditPath)).length
    const tokenOptions = {
      tokenHeader: sessionValue.same_origin_token.header,
      token: sessionValue.same_origin_token.token,
    }
    await assertGuardResponse(await issueRequest(origin, { ...tokenOptions, origin: false }), 403, 'invalid_origin')
    await assertGuardResponse(
      await issueRequest(origin, { ...tokenOptions, origin: 'https://attacker.invalid' }),
      403,
      'invalid_origin',
    )
    await assertNoGithubMutation(auditPath, auditStart)
  })

  test('foreign Host is denied', async () => {
    const auditStart = (await auditRecords(auditPath)).length
    const requestBody = JSON.stringify({
      title: 'Foreign-Host guard probe',
      body: 'This must be rejected before GitHub.',
    })
    await assertGuardResponse(
      await rawHttpRequest(`${origin}/api/v1/issues`, {
        method: 'POST',
        headers: {
          Host: 'attacker.invalid',
          Origin: origin,
          'Content-Type': 'application/json',
          [sessionValue.same_origin_token.header]: sessionValue.same_origin_token.token,
        },
        body: requestBody,
      }),
      403,
      'invalid_host',
    )
    await assertNoGithubMutation(auditPath, auditStart)
  })

  test('callers cannot select a second repository in the mutation body', async () => {
    const auditStart = (await auditRecords(auditPath)).length
    await assertGuardResponse(
      await issueRequest(origin, {
        tokenHeader: sessionValue.same_origin_token.header,
        token: sessionValue.same_origin_token.token,
        body: {
          title: 'Repository escape probe',
          body: 'This must be rejected before GitHub.',
          repository: 'forbidden-owner/packages',
        },
      }),
      422,
      'invalid_body_fields',
    )
    await assertNoGithubMutation(auditPath, auditStart)
  })
})

describe('S4 actor and demo-mode guards', () => {
  async function actorScenario(actor, expectedStatus, expectedCode) {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'fkst-blackbox-actor-'))
    const auditPath = join(temporaryRoot, 'gh.jsonl')
    const port = await reserveLoopbackPort()
    const origin = `http://127.0.0.1:${port}`
    const bff = startBff(
      port,
      ['--enable-writes', '--sandbox-repo', 'demo-owner/demo-sandbox', '--bot-login', 'loop-agent'],
      { GH_TRIPWIRE_AUDIT: auditPath, GH_TRIPWIRE_ACTOR: actor },
    )
    try {
      await waitForHttp(`${origin}/api/v1/health`, { processHandle: bff })
      const sessionValue = await session(origin)
      const response = await issueRequest(origin, {
        tokenHeader: sessionValue.same_origin_token.header,
        token: sessionValue.same_origin_token.token,
      })
      await assertGuardResponse(response, expectedStatus, expectedCode)
      await assertNoGithubMutation(auditPath)
    } finally {
      await stopProcess(bff)
      await assertNoGithubMutation(auditPath)
      await rm(temporaryRoot, { recursive: true, force: true })
    }
  }

  test('normalized actor equal to the bot is denied', async () => {
    await actorScenario(' LoOp-Agent[BOT] ', 403, 'actor_is_bot')
  })

  test('unresolvable actor is denied', async () => {
    await actorScenario('', 503, 'actor_unavailable')
  })

  test('demo mode denies mutation and performs no GitHub resolution or write', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'fkst-blackbox-demo-'))
    const auditPath = join(temporaryRoot, 'gh.jsonl')
    const port = await reserveLoopbackPort()
    const origin = `http://127.0.0.1:${port}`
    const bff = startBff(port, ['--demo'], { GH_TRIPWIRE_AUDIT: auditPath })
    try {
      await waitForHttp(`${origin}/api/v1/health`, { processHandle: bff })
      await assertGuardResponse(await issueRequest(origin), 403, 'writes_disabled')
      assert.deepEqual(await auditRecords(auditPath), [])
    } finally {
      await stopProcess(bff)
      await assertNoGithubMutation(auditPath)
      await rm(temporaryRoot, { recursive: true, force: true })
    }
  })
})

describe('S4 impossible write-enabled launch combinations', () => {
  async function assertLaunchRejected(args, pattern) {
    const port = await reserveLoopbackPort()
    const bff = startBff(port, args)
    const exit = once(bff.child, 'exit')
    const timeout = new Promise((_, reject) => {
      const timer = setTimeout(() => reject(new Error(`Invalid launch did not exit. Output:\n${bff.output()}`)), 5_000)
      timer.unref()
    })
    try {
      const [code] = await Promise.race([exit, timeout])
      assert.notEqual(code, 0)
      assert.match(bff.output(), pattern)
    } finally {
      await stopProcess(bff)
    }
  }

  test('write-enabled launch without the one repository allowlist is rejected', async () => {
    await assertLaunchRejected(
      ['--enable-writes', '--bot-login', 'loop-agent'],
      /--enable-writes requires exactly one --sandbox-repo and one --bot-login/,
    )
  })

  test('write-enabled demo launch is rejected', async () => {
    await assertLaunchRejected(
      ['--demo', '--enable-writes', '--sandbox-repo', 'demo-owner/demo-sandbox', '--bot-login', 'loop-agent'],
      /writes cannot be enabled in demo mode/,
    )
  })
})
