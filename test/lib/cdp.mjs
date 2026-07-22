import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { executableChrome } from './browser.mjs'

// The --dump-dom + --virtual-time-budget path deadlocks on pages that hold a
// long-lived connection open (the live console's /api/v1/events stream), and
// the bounded kill that follows surfaces as "Abnormal renderer termination".
// This harness drives the same headless Chrome over the DevTools protocol
// instead: no virtual time, an explicit application-level readiness wait, and
// in-band network telemetry, so an open EventSource can never hang the run.
export const CDP_PROFILE_PREFIX = `fkst-blackbox-cdp-${process.pid}-`

const LAUNCH_TIMEOUT_MS = 15_000
const COMMAND_TIMEOUT_MS = 10_000
const TERMINATION_GRACE_MS = 500

function signalExactGroup(child, signal) {
  if (!child.pid) return
  try {
    if (process.platform === 'win32') child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error
  }
}

async function readDevToolsEndpoint(profile) {
  const activePortPath = join(profile, 'DevToolsActivePort')
  const deadline = Date.now() + LAUNCH_TIMEOUT_MS
  while (Date.now() < deadline) {
    try {
      const activePort = await readFile(activePortPath, 'utf8')
      const [port, browserPath] = activePort.trim().split('\n')
      if (/^\d+$/.test(port ?? '') && browserPath?.startsWith('/devtools/browser/')) {
        return `ws://127.0.0.1:${port}${browserPath}`
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 50))
  }
  throw new Error('Chrome did not publish a DevToolsActivePort endpoint in time.')
}

export class CdpBrowser {
  constructor() {
    this.child = null
    this.temporaryRoot = null
    this.socket = null
    this.sessionId = null
    this.nextCommandId = 1
    this.pendingCommands = new Map()
    this.stderrTail = ''
    /** Every request the page issued: { url, method }. */
    this.requests = []
    /** Every response the page received: { url, status }. */
    this.responses = []
    /** Uncaught page exceptions, as CDP exception descriptions. */
    this.pageExceptions = []
  }

  async launch() {
    const chrome = await executableChrome()
    this.temporaryRoot = await mkdtemp(join(tmpdir(), CDP_PROFILE_PREFIX))
    const profile = join(this.temporaryRoot, 'profile')
    this.child = spawn(chrome, [
      '--headless=new',
      '--disable-background-networking',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-domain-reliability',
      '--disable-features=MediaRouter,OptimizationHints,Translate',
      '--disable-gpu',
      '--disable-sync',
      '--metrics-recording-only',
      '--no-default-browser-check',
      '--no-first-run',
      '--password-store=basic',
      '--use-mock-keychain',
      `--user-data-dir=${profile}`,
      '--remote-debugging-port=0',
      'about:blank',
    ], {
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    this.child.stderr.setEncoding('utf8')
    this.child.stderr.on('data', (chunk) => {
      this.stderrTail = `${this.stderrTail}${chunk}`.slice(-16_384)
    })

    const endpoint = await readDevToolsEndpoint(profile)
    this.socket = new WebSocket(endpoint)
    await new Promise((resolveOpen, rejectOpen) => {
      this.socket.addEventListener('open', () => resolveOpen(), { once: true })
      this.socket.addEventListener('error', () => rejectOpen(new Error('Could not connect to the Chrome DevTools endpoint.')), { once: true })
    })
    this.socket.addEventListener('message', (event) => this.dispatch(String(event.data)))

    const { targetId } = await this.command('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await this.command('Target.attachToTarget', { targetId, flatten: true })
    this.sessionId = sessionId
    await this.command('Page.enable', {}, sessionId)
    await this.command('Runtime.enable', {}, sessionId)
    await this.command('Network.enable', {}, sessionId)
  }

  dispatch(data) {
    let message
    try {
      message = JSON.parse(data)
    } catch {
      return
    }
    if (message.id !== undefined && this.pendingCommands.has(message.id)) {
      const pending = this.pendingCommands.get(message.id)
      this.pendingCommands.delete(message.id)
      clearTimeout(pending.timer)
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`))
      else pending.resolve(message.result ?? {})
      return
    }
    if (message.method === 'Network.requestWillBeSent') {
      const request = message.params?.request
      if (request?.url) this.requests.push({ url: request.url, method: request.method ?? 'GET' })
    } else if (message.method === 'Network.responseReceived') {
      const response = message.params?.response
      if (response?.url) this.responses.push({ url: response.url, status: response.status })
    } else if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params?.exceptionDetails
      this.pageExceptions.push(
        details?.exception?.description ?? details?.text ?? 'Unknown page exception',
      )
    }
  }

  command(method, params = {}, sessionId = undefined, timeoutMs = COMMAND_TIMEOUT_MS) {
    const id = this.nextCommandId++
    return new Promise((resolveCommand, rejectCommand) => {
      const timer = setTimeout(() => {
        this.pendingCommands.delete(id)
        rejectCommand(new Error(`${method} timed out after ${timeoutMs} ms.\nChrome stderr tail:\n${this.stderrTail.slice(-2_000)}`))
      }, timeoutMs)
      this.pendingCommands.set(id, { method, resolve: resolveCommand, reject: rejectCommand, timer })
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    })
  }

  async navigate(url) {
    const result = await this.command('Page.navigate', { url }, this.sessionId)
    if (result.errorText) throw new Error(`Navigation to ${url} failed: ${result.errorText}`)
  }

  async evaluate(expression) {
    const result = await this.command('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }, this.sessionId)
    if (result.exceptionDetails) {
      throw new Error(`Page evaluation failed: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`)
    }
    return result.result?.value
  }

  async waitForExpression(expression, options = {}) {
    const timeoutMs = options.timeoutMs ?? 15_000
    const deadline = Date.now() + timeoutMs
    let lastValue
    while (Date.now() < deadline) {
      lastValue = await this.evaluate(expression)
      if (lastValue) return lastValue
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 100))
    }
    throw new Error(
      `Timed out after ${timeoutMs} ms waiting for: ${expression}\nLast value: ${JSON.stringify(lastValue)}`
      + `\nChrome stderr tail:\n${this.stderrTail.slice(-2_000)}`,
    )
  }

  async screenshot(path) {
    const { data } = await this.command('Page.captureScreenshot', { format: 'png' }, this.sessionId, 20_000)
    await writeFile(path, Buffer.from(data, 'base64'))
  }

  async close() {
    try {
      if (this.socket?.readyState === WebSocket.OPEN && this.child?.exitCode === null) {
        await this.command('Browser.close', {}).catch(() => {})
        const exited = once(this.child, 'exit')
        const grace = new Promise((resolveGrace) => {
          const timer = setTimeout(resolveGrace, TERMINATION_GRACE_MS * 4)
          timer.unref()
        })
        await Promise.race([exited, grace])
      }
    } finally {
      for (const pending of this.pendingCommands.values()) {
        clearTimeout(pending.timer)
        pending.reject(new Error('Browser session closed.'))
      }
      this.pendingCommands.clear()
      try {
        this.socket?.close()
      } catch {
        // The exact process-group fallback below remains authoritative.
      }
      if (this.child && this.child.exitCode === null && this.child.signalCode === null) {
        signalExactGroup(this.child, 'SIGTERM')
        await new Promise((resolveDelay) => setTimeout(resolveDelay, TERMINATION_GRACE_MS))
        signalExactGroup(this.child, 'SIGKILL')
      }
      if (this.temporaryRoot) await rm(this.temporaryRoot, { recursive: true, force: true })
    }
  }
}
