import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const previewPort = 4174
const previewOrigin = `http://127.0.0.1:${previewPort}`
const pnpmExecutable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

function run(command, argv) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, argv, {
      cwd: repositoryRoot,
      env: { ...process.env, BROWSER: 'none' },
      shell: false,
      stdio: 'inherit',
    })
    child.once('error', rejectRun)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolveRun()
        return
      }
      rejectRun(new Error(`${command} exited with ${code ?? signal ?? 'unknown status'}`))
    })
  })
}

async function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  try {
    if (process.platform === 'win32') child.kill('SIGTERM')
    else process.kill(-child.pid, 'SIGTERM')
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error
  }
  const exitPromise = once(child, 'exit')
  const timeoutPromise = new Promise((resolveTimeout) => {
    const timer = setTimeout(resolveTimeout, 2_000)
    timer.unref()
  })
  await Promise.race([exitPromise, timeoutPromise])
}

async function waitForPreview(child) {
  const deadline = Date.now() + 15_000
  let lastError = null
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`fixture preview exited with status ${child.exitCode}`)
    try {
      const response = await fetch(previewOrigin, { signal: AbortSignal.timeout(1_000) })
      if (response.ok) return
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100))
  }
  throw new Error(`fixture preview did not start: ${lastError?.message ?? 'unknown error'}`)
}

async function findBuiltJavaScript(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const paths = await Promise.all(entries.map(async (entry) => {
    const entryPath = join(directory, entry.name)
    if (entry.isDirectory()) return findBuiltJavaScript(entryPath)
    return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : []
  }))
  return paths.flat()
}

async function verifyFixtureArtifacts() {
  const fixtureResponse = await fetch(`${previewOrigin}/fixtures/snapshot.v1.json`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5_000),
  })
  if (!fixtureResponse.ok) throw new Error(`fixture endpoint returned HTTP ${fixtureResponse.status}`)
  const fixture = await fixtureResponse.json()
  if (fixture?.schema !== 'fkst.console.snapshot.v1') {
    throw new Error('fixture schema is not fkst.console.snapshot.v1')
  }
  if (fixture?.data?.mode !== 'demo') throw new Error('fixture is not explicitly marked as demo data')

  const htmlResponse = await fetch(previewOrigin, { signal: AbortSignal.timeout(5_000) })
  const html = await htmlResponse.text()
  if (!htmlResponse.ok || !html.includes('id="root"')) throw new Error('fixture HTML shell is unavailable')

  const scripts = await findBuiltJavaScript(resolve(repositoryRoot, 'app', 'dist'))
  const scriptBodies = await Promise.all(scripts.map((path) => readFile(path, 'utf8')))
  if (!scriptBodies.some((body) => /Recorded demo data/i.test(body))) {
    throw new Error('built fixture UI does not contain the required recorded-data disclosure')
  }
}

await run(pnpmExecutable, ['run', 'build:demo'])

const preview = spawn(
  pnpmExecutable,
  ['--filter', './app', 'exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'],
  {
    cwd: repositoryRoot,
    detached: process.platform !== 'win32',
    env: { ...process.env, BROWSER: 'none' },
    shell: false,
    stdio: 'inherit',
  },
)

try {
  await waitForPreview(preview)
  await verifyFixtureArtifacts()
  console.log(`fixture smoke passed at ${previewOrigin}`)
} finally {
  await stopProcess(preview)
}
