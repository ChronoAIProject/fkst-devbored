import assert from 'node:assert/strict'
import { once } from 'node:events'
import { connect } from 'node:net'
import { after, before, describe, test } from 'node:test'

import {
  collectResponseBody,
  repositoryPath,
  reserveLoopbackPort,
  startProcess,
  stopProcess,
  waitForHttp,
} from './lib/harness.mjs'

const STARTUP_TIMEOUT_MS = 60_000

function devEnvironment(overrides = {}) {
  return {
    BROWSER: 'none',
    NO_PROXY: '127.0.0.1,localhost',
    no_proxy: '127.0.0.1,localhost',
    HTTP_PROXY: 'http://127.0.0.1:1',
    HTTPS_PROXY: 'http://127.0.0.1:1',
    ALL_PROXY: 'http://127.0.0.1:1',
    GH_HOST: 'github.invalid',
    GH_TOKEN: 'fkst-blackbox-invalid-token',
    GITHUB_TOKEN: 'fkst-blackbox-invalid-token',
    FKST_GH_BIN: repositoryPath('test', 'bin', 'gh'),
    FKST_CONSOLE_PORT: undefined,
    FKST_CONSOLE_UI_PORT: undefined,
    FKST_SANDBOX_REPO: undefined,
    FKST_BOT_LOGIN: undefined,
    FKST_ENABLE_WRITES: undefined,
    FKST_OBSERVE_BIN: undefined,
    FKST_DURABLE_ROOT: undefined,
    FKST_HEALTH_SCRIPT: undefined,
    VITE_BFF_TARGET: undefined,
    ...overrides,
  }
}

function startDev(environmentOverrides = {}, extraArguments = []) {
  return startProcess(
    process.execPath,
    [repositoryPath('scripts', 'dev.mjs'), ...extraArguments],
    { env: devEnvironment(environmentOverrides) },
  )
}

function probeLoopbackPort(port) {
  return new Promise((resolveProbe, rejectProbe) => {
    const socket = connect({ host: '127.0.0.1', port })
    socket.setTimeout(1_000)
    socket.once('connect', () => {
      socket.destroy()
      resolveProbe('open')
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolveProbe('open')
    })
    socket.once('error', (error) => {
      if (error?.code === 'ECONNREFUSED') resolveProbe('closed')
      else rejectProbe(error)
    })
  })
}

async function waitForPortClosed(port, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await probeLoopbackPort(port) === 'closed') return
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100))
  }
  throw new Error(`Port 127.0.0.1:${port} was still accepting connections after shutdown.`)
}

async function expectStartupRejection(environmentOverrides, expectedMessage, extraArguments = []) {
  const dev = startDev(environmentOverrides, extraArguments)
  const timeout = new Promise((_, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`dev.mjs did not reject invalid startup input.\n${dev.output()}`)),
      10_000,
    )
    timer.unref()
  })
  try {
    const [code] = await Promise.race([once(dev.child, 'exit'), timeout])
    assert.equal(code, 1, `dev.mjs must fail fast, output:\n${dev.output()}`)
    assert.match(dev.output(), expectedMessage)
    assert.doesNotMatch(dev.output(), /listening|Local:/iu, 'Invalid input must be rejected before anything binds.')
  } finally {
    await stopProcess(dev)
  }
}

describe('S1/S2 integrated dev startup on caller-selected loopback ports', () => {
  let bffPort
  let uiPort
  let uiOrigin
  let bffOrigin
  let dev

  before(async () => {
    bffPort = await reserveLoopbackPort()
    uiPort = await reserveLoopbackPort()
    bffOrigin = `http://127.0.0.1:${bffPort}`
    uiOrigin = `http://127.0.0.1:${uiPort}`
    dev = startDev({
      FKST_CONSOLE_PORT: String(bffPort),
      FKST_CONSOLE_UI_PORT: String(uiPort),
    })
    await waitForHttp(`${uiOrigin}/api/v1/health`, {
      accept: (response) => response.ok,
      processHandle: dev,
      timeoutMs: STARTUP_TIMEOUT_MS,
    })
  })

  after(async () => {
    await stopProcess(dev)
  })

  test('health through the browser origin identifies this repository BFF on the selected port, not fixture mode', async () => {
    const response = await fetch(`${uiOrigin}/api/v1/health`, {
      headers: { Origin: uiOrigin },
      signal: AbortSignal.timeout(5_000),
    })
    const { json, text } = await collectResponseBody(response)
    assert.equal(response.status, 200)
    assert.ok(json, `Expected health JSON through the proxy, received: ${text.slice(0, 240)}`)
    assert.equal(json.schema, 'fkst.console.health.v1')
    assert.equal(json.bff?.bind, `127.0.0.1:${bffPort}`, 'The proxied BFF must be bound to the caller-selected loopback port.')
    assert.equal(json.bff?.mode, 'local', 'Integrated dev must run the live BFF, never the recorded demo mode.')
  })

  test('snapshot through the browser origin is live local data, not the recorded fixture', async () => {
    const response = await fetch(`${uiOrigin}/api/v1/snapshot`, {
      headers: { Origin: uiOrigin },
      signal: AbortSignal.timeout(5_000),
    })
    const { json, text } = await collectResponseBody(response)
    assert.equal(response.status, 200)
    assert.ok(json, `Expected snapshot JSON through the proxy, received: ${text.slice(0, 240)}`)
    assert.equal(json.schema, 'fkst.console.snapshot.v1')
    assert.equal(json.data?.mode, 'local', 'The proxied snapshot must come from the live BFF, not demo replay.')
    assert.notEqual(json.data?.posture, 'recorded-read-only')
    assert.notEqual(json.capture?.kind, 'sanitized-recorded-replay', 'The snapshot must not be the shipped fixture replay.')
  })

  test('the proxied origin and the direct BFF origin serve the same per-launch session instance', async () => {
    const proxied = await fetch(`${uiOrigin}/api/v1/session`, {
      headers: { Origin: uiOrigin },
      signal: AbortSignal.timeout(5_000),
    })
    const direct = await fetch(`${bffOrigin}/api/v1/session`, {
      signal: AbortSignal.timeout(5_000),
    })
    assert.equal(proxied.status, 200)
    assert.equal(direct.status, 200)
    const proxiedSession = await proxied.json()
    const directSession = await direct.json()
    assert.equal(proxiedSession.schema, 'fkst.console.session.v1')
    assert.equal(typeof directSession.same_origin_token?.token, 'string')
    assert.equal(
      proxiedSession.same_origin_token?.token,
      directSession.same_origin_token?.token,
      'The Vite proxy must reach the exact BFF process this launch started, not another listener.',
    )
  })

  test('terminating the dev supervisor releases both selected ports', async () => {
    await stopProcess(dev)
    await waitForPortClosed(uiPort)
    await waitForPortClosed(bffPort)
  })
})

describe('S1 integrated dev startup rejects invalid selections before binding', () => {
  test('a non-numeric BFF port is rejected', async () => {
    await expectStartupRejection(
      { FKST_CONSOLE_PORT: 'not-a-port' },
      /FKST_CONSOLE_PORT must be an integer from 1 through 65535/u,
    )
  })

  test('an out-of-range BFF port is rejected', async () => {
    await expectStartupRejection(
      { FKST_CONSOLE_PORT: '70000' },
      /FKST_CONSOLE_PORT must be an integer from 1 through 65535/u,
    )
  })

  test('a zero UI port is rejected', async () => {
    await expectStartupRejection(
      { FKST_CONSOLE_UI_PORT: '0' },
      /FKST_CONSOLE_UI_PORT must be an integer from 1 through 65535/u,
    )
  })

  test('identical BFF and UI ports are rejected', async () => {
    await expectStartupRejection(
      { FKST_CONSOLE_PORT: '18472', FKST_CONSOLE_UI_PORT: '18472' },
      /must differ/u,
    )
  })

  test('a conflicting VITE_BFF_TARGET is rejected instead of silently splitting the proxy', async () => {
    await expectStartupRejection(
      { FKST_CONSOLE_PORT: '18472', VITE_BFF_TARGET: 'http://127.0.0.1:9999' },
      /VITE_BFF_TARGET .*conflicts with the selected BFF origin/u,
    )
  })

  test('pass-through --port and --host arguments are rejected so selection stays validated and loopback-only', async () => {
    await expectStartupRejection({}, /Refusing pass-through argument --port/u, ['--port', '4321'])
    await expectStartupRejection({}, /Refusing pass-through argument --host/u, ['--host=0.0.0.0'])
  })
})
