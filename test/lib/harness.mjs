import { spawn } from 'node:child_process'
import { once } from 'node:events'
import http from 'node:http'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { delimiter } from 'node:path'
import { fileURLToPath } from 'node:url'

export const TEST_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const REPOSITORY_ROOT = resolve(TEST_ROOT, '..')

export function repositoryPath(...parts) {
  return resolve(REPOSITORY_ROOT, ...parts)
}

export async function reserveLoopbackPort() {
  const server = createServer()
  server.unref()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') {
    server.close()
    throw new Error('Could not reserve a loopback TCP port.')
  }
  const { port } = address
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => error ? rejectClose(error) : resolveClose())
  })
  return port
}

export function startProcess(command, args, options = {}) {
  const detached = options.detached ?? process.platform !== 'win32'
  const child = spawn(command, args, {
    cwd: options.cwd ?? REPOSITORY_ROOT,
    env: { ...process.env, ...options.env },
    detached,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const stdout = []
  const stderr = []
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => stdout.push(chunk))
  child.stderr.on('data', (chunk) => stderr.push(chunk))
  return {
    child,
    detached,
    output() {
      return `${stdout.join('')}${stderr.join('')}`
    },
  }
}

export async function stopProcess(processHandle) {
  const child = processHandle?.child
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  try {
    if (process.platform === 'win32' || !processHandle.detached) child.kill('SIGTERM')
    else process.kill(-child.pid, 'SIGTERM')
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error
  }
  const exited = once(child, 'exit')
  const forced = new Promise((resolveForce) => {
    const timer = setTimeout(() => {
      try {
        if (process.platform === 'win32' || !processHandle.detached) child.kill('SIGKILL')
        else process.kill(-child.pid, 'SIGKILL')
      } catch (error) {
        if (error?.code !== 'ESRCH') throw error
      }
      resolveForce()
    }, 2_000)
    timer.unref()
  })
  await Promise.race([exited, forced])
}

export async function waitForHttp(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 15_000
  const deadline = Date.now() + timeoutMs
  let lastError = null
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: options.headers,
        signal: AbortSignal.timeout(1_000),
      })
      if (options.accept?.(response) ?? response.status < 500) return response
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 75))
  }
  const detail = options.processHandle?.output()
  throw new Error(
    `Timed out waiting for ${url}: ${lastError?.message ?? 'no response'}`
      + (detail ? `\nProcess output:\n${detail}` : ''),
  )
}

export async function collectResponseBody(response) {
  const text = await response.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    // Some negative-path responses intentionally have no JSON body.
  }
  return { text, json }
}

export function rawHttpRequest(url, options = {}) {
  return new Promise((resolveRequest, rejectRequest) => {
    const body = options.body === undefined
      ? null
      : Buffer.isBuffer(options.body)
        ? options.body
        : Buffer.from(String(options.body), 'utf8')
    const headers = { ...options.headers }
    if (body !== null && headers['Content-Length'] === undefined && headers['content-length'] === undefined) {
      headers['Content-Length'] = String(body.byteLength)
    }
    const request = http.request(url, {
      method: options.method ?? 'GET',
      headers,
      agent: false,
    }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      response.once('error', rejectRequest)
      response.once('end', () => {
        resolveRequest(new Response(Buffer.concat(chunks), {
          status: response.statusCode ?? 500,
          headers: response.headers,
        }))
      })
    })
    request.once('error', rejectRequest)
    request.setTimeout(options.timeoutMs ?? 5_000, () => {
      request.destroy(new Error(`Raw HTTP request to ${url} timed out.`))
    })
    if (body !== null) request.write(body)
    request.end()
  })
}

export function startApp(mode, port, extraEnv = {}) {
  const modeName = mode === 'fixture' ? 'demo' : 'development'
  return startProcess(
    process.execPath,
    [
      repositoryPath('app', 'node_modules', 'vite', 'bin', 'vite.js'),
      '--mode',
      modeName,
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    {
      cwd: repositoryPath('app'),
      detached: process.platform !== 'win32',
      env: {
        BROWSER: 'none',
        NO_PROXY: '127.0.0.1,localhost',
        no_proxy: '127.0.0.1,localhost',
        ...extraEnv,
      },
    },
  )
}

export function startBff(port, args = [], extraEnv = {}) {
  const tripwireBin = repositoryPath('test', 'bin')
  return startProcess(
    process.execPath,
    [
      '--experimental-strip-types',
      repositoryPath('server', 'src', 'main.ts'),
      '--port',
      String(port),
      '--gh-bin',
      repositoryPath('test', 'bin', 'gh'),
      ...args,
    ],
    {
      cwd: repositoryPath('server'),
      detached: process.platform !== 'win32',
      env: {
        PATH: `${tripwireBin}${delimiter}${process.env.PATH ?? ''}`,
        GH_HOST: 'github.invalid',
        GH_TOKEN: 'fkst-blackbox-invalid-token',
        GITHUB_TOKEN: 'fkst-blackbox-invalid-token',
        HTTP_PROXY: 'http://127.0.0.1:1',
        HTTPS_PROXY: 'http://127.0.0.1:1',
        ALL_PROXY: 'http://127.0.0.1:1',
        NO_PROXY: '127.0.0.1,localhost',
        no_proxy: '127.0.0.1,localhost',
        ...extraEnv,
      },
    },
  )
}

export async function readSseEvent(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5_000)
  timeout.unref()
  try {
    const response = await fetch(url, {
      headers: options.headers,
      signal: controller.signal,
    })
    const reader = response.body?.getReader()
    if (!reader) throw new Error('SSE response has no readable body.')
    const decoder = new TextDecoder()
    let body = ''
    while (!body.includes('\n\n')) {
      const { done, value } = await reader.read()
      if (done) break
      body += decoder.decode(value, { stream: true })
    }
    await reader.cancel()
    const event = body.split('\n\n', 1)[0] ?? ''
    const eventName = event.match(/^event:\s*(.+)$/mu)?.[1]?.trim() ?? 'message'
    const data = event
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n')
    return { response, eventName, data, raw: event }
  } finally {
    clearTimeout(timeout)
    controller.abort()
  }
}
