import { execFile, spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const DEFAULT_MAX_BUFFER = 12 * 1024 * 1024
const DEFAULT_TIMEOUT_MS = 30_000
const TERMINATION_GRACE_MS = 500
const EXIT_DRAIN_MS = 75
const DEVTOOLS_CLOSE_TIMEOUT_MS = 1_000
const CHROME_PROFILE_PREFIX = `fkst-blackbox-chrome-${process.pid}-`

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

export async function executableChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await execFileAsync(candidate, ['--version'], { timeout: 5_000 })
      return candidate
    } catch {
      // Try the next standard installation path.
    }
  }
  throw new Error(`Headless Chrome is required for black-box UI smoke tests. Tried: ${CHROME_CANDIDATES.join(', ')}`)
}

function signalExactChromeGroup(child, signal) {
  if (!child.pid) return
  try {
    if (process.platform === 'win32') child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error
  }
}

export function runChromeBounded(chrome, args, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxBuffer = options.maxBuffer ?? DEFAULT_MAX_BUFFER

  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(chrome, args, {
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const stdoutChunks = []
    const stderrChunks = []
    let stdoutTail = ''
    let capturedBytes = 0
    let settled = false
    let timedOut = false
    let domComplete = false
    let bufferError = null
    let forceTimer = null
    let hardStopTimer = null

    function capturedOutput() {
      return {
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
      }
    }

    function settle(error, code = child.exitCode, signal = child.signalCode) {
      if (settled) return
      settled = true
      clearTimeout(timeoutTimer)
      clearTimeout(forceTimer)
      clearTimeout(hardStopTimer)
      // Chrome helpers can inherit the stdout/stderr pipes after the browser
      // process exits. Reap only this launch's process group, then destroy our
      // pipe handles so callback completion cannot depend on those descendants.
      signalExactChromeGroup(child, 'SIGKILL')
      child.stdout.destroy()
      child.stderr.destroy()
      const output = capturedOutput()
      if (error) {
        error.stdout = output.stdout
        error.stderr = output.stderr
        rejectRun(error)
      } else if (code !== 0) {
        const exitError = new Error(`Chrome exited with ${signal ? `signal ${signal}` : `code ${code}`}.`)
        exitError.stdout = output.stdout
        exitError.stderr = output.stderr
        rejectRun(exitError)
      } else {
        resolveRun(output)
      }
    }

    function terminate(error) {
      if (settled) return
      signalExactChromeGroup(child, 'SIGTERM')
      forceTimer = setTimeout(() => signalExactChromeGroup(child, 'SIGKILL'), TERMINATION_GRACE_MS)
      hardStopTimer = setTimeout(() => settle(error), TERMINATION_GRACE_MS * 2)
    }

    function finishCompletedDom() {
      if (settled || domComplete) return
      domComplete = true
      clearTimeout(timeoutTimer)
      // Ask Chrome to shut down through its browser endpoint first so the
      // netlog is finalized. Exact-PGID TERM/KILL remains the bounded fallback.
      void Promise.resolve(options.gracefulClose?.()).catch(() => false).finally(() => {
        if (settled) return
        forceTimer = setTimeout(() => signalExactChromeGroup(child, 'SIGTERM'), TERMINATION_GRACE_MS)
        hardStopTimer = setTimeout(() => {
          signalExactChromeGroup(child, 'SIGKILL')
          settle(null, 0, null)
        }, TERMINATION_GRACE_MS * 2)
      })
    }

    function capture(chunks, chunk, isStdout = false) {
      if (settled || bufferError) return
      const value = Buffer.from(chunk)
      capturedBytes += value.byteLength
      if (capturedBytes > maxBuffer) {
        bufferError = new Error(`Chrome output exceeded ${maxBuffer} bytes.`)
        terminate(bufferError)
        return
      }
      chunks.push(value)
      if (isStdout) {
        stdoutTail = `${stdoutTail}${value.toString('utf8')}`.slice(-64)
        if (stdoutTail.trimEnd().toLowerCase().endsWith('</html>')) finishCompletedDom()
      }
    }

    child.stdout.on('data', (chunk) => capture(stdoutChunks, chunk, true))
    child.stderr.on('data', (chunk) => capture(stderrChunks, chunk))
    child.once('error', (error) => settle(error))
    child.once('exit', (code, signal) => {
      // Give already-buffered pipe data one event-loop turn to drain, without
      // waiting for the `close` event that inherited Chrome pipes can hold.
      setTimeout(() => {
        if (domComplete) settle(null, 0, signal)
        else if (timedOut) settle(new Error(`Chrome timed out after ${timeoutMs} ms.`), code, signal)
        else if (bufferError) settle(bufferError, code, signal)
        else settle(null, code, signal)
      }, EXIT_DRAIN_MS)
    })

    const timeoutTimer = setTimeout(() => {
      timedOut = true
      terminate(new Error(`Chrome timed out after ${timeoutMs} ms.`))
    }, timeoutMs)
  })
}

function collectUrls(value, urls = new Set()) {
  if (typeof value === 'string') {
    if (/^https?:\/\//i.test(value)) urls.add(value)
    return urls
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, urls)
    return urls
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) collectUrls(nested, urls)
  }
  return urls
}

async function closeChromeViaDevTools(profile) {
  const activePortPath = join(profile, 'DevToolsActivePort')
  const deadline = Date.now() + DEVTOOLS_CLOSE_TIMEOUT_MS
  let activePort = null
  while (Date.now() < deadline) {
    try {
      activePort = await readFile(activePortPath, 'utf8')
      break
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 25))
    }
  }
  if (!activePort) return false
  const [port, browserPath] = activePort.trim().split('\n')
  if (!/^\d+$/.test(port ?? '') || !browserPath?.startsWith('/devtools/browser/')) return false

  return new Promise((resolveClose) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}${browserPath}`)
    let acknowledged = false
    let resolved = false

    const finish = (closedGracefully) => {
      if (resolved) return
      resolved = true
      clearTimeout(timeout)
      try {
        if (socket.readyState === WebSocket.OPEN) socket.close()
      } catch {
        // The exact process-group fallback remains authoritative.
      }
      resolveClose(closedGracefully)
    }

    const timeout = setTimeout(() => {
      finish(false)
    }, DEVTOOLS_CLOSE_TIMEOUT_MS)
    socket.addEventListener('open', () => {
      try {
        socket.send(JSON.stringify({ id: 1, method: 'Browser.close' }))
      } catch {
        finish(false)
      }
    }, { once: true })
    socket.addEventListener('message', (event) => {
      let message
      try {
        message = JSON.parse(String(event.data))
      } catch {
        return
      }
      if (message.id !== 1) return
      acknowledged = !message.error
      finish(acknowledged)
    })
    socket.addEventListener('close', () => {
      finish(acknowledged)
    }, { once: true })
    socket.addEventListener('error', () => {
      finish(false)
    }, { once: true })
  })
}

export async function dumpRenderedDom(url, options = {}) {
  const chrome = await executableChrome()
  const temporaryRoot = await mkdtemp(join(tmpdir(), CHROME_PROFILE_PREFIX))
  const profile = join(temporaryRoot, 'profile')
  const networkLog = join(temporaryRoot, 'netlog.json')
  const args = [
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
    '--host-resolver-rules=MAP * 127.0.0.1, EXCLUDE localhost, EXCLUDE 127.0.0.1',
    `--user-data-dir=${profile}`,
    '--remote-debugging-port=0',
    `--log-net-log=${networkLog}`,
    '--net-log-capture-mode=Everything',
    `--virtual-time-budget=${options.virtualTimeBudgetMs ?? 3_000}`,
    '--dump-dom',
    url,
  ]
  try {
    const { stdout, stderr } = await runChromeBounded(chrome, args, {
      gracefulClose: () => closeChromeViaDevTools(profile),
      maxBuffer: DEFAULT_MAX_BUFFER,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    })
    let networkUrls
    try {
      const log = JSON.parse(await readFile(networkLog, 'utf8'))
      networkUrls = [...collectUrls(log)]
    } catch (error) {
      throw new Error('Chrome completed the rendered document but did not produce a readable network log.', {
        cause: error,
      })
    }
    return { dom: stdout, diagnostics: stderr, networkUrls }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}
