import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pnpmExecutable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const nodeExecutable = process.execPath
const extraArguments = process.argv.slice(2)

const DEFAULT_BFF_PORT = 8472
const DEFAULT_UI_PORT = 5173

function parseLoopbackPort(name, rawValue, defaultPort) {
  if (rawValue === undefined || rawValue.trim() === '') return defaultPort
  const value = rawValue.trim()
  if (!/^\d{1,5}$/u.test(value)) {
    throw new Error(`${name} must be an integer from 1 through 65535, received: ${rawValue}`)
  }
  const port = Number(value)
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${name} must be an integer from 1 through 65535, received: ${rawValue}`)
  }
  return port
}

let bffPort
let uiPort
let bffOrigin
try {
  bffPort = parseLoopbackPort('FKST_CONSOLE_PORT', process.env.FKST_CONSOLE_PORT, DEFAULT_BFF_PORT)
  uiPort = parseLoopbackPort('FKST_CONSOLE_UI_PORT', process.env.FKST_CONSOLE_UI_PORT, DEFAULT_UI_PORT)
  if (bffPort === uiPort) {
    throw new Error(`FKST_CONSOLE_PORT and FKST_CONSOLE_UI_PORT must differ, both were ${bffPort}.`)
  }
  for (const argument of extraArguments) {
    if (/^--(?:port|host)(?:=|$)/u.test(argument)) {
      throw new Error(
        `Refusing pass-through argument ${argument}: select ports with FKST_CONSOLE_PORT (BFF) and FKST_CONSOLE_UI_PORT (UI); the host is always 127.0.0.1.`,
      )
    }
  }
  bffOrigin = `http://127.0.0.1:${bffPort}`
  const externalTarget = process.env.VITE_BFF_TARGET?.trim()
  if (externalTarget && externalTarget !== bffOrigin && externalTarget !== `${bffOrigin}/`) {
    throw new Error(
      `VITE_BFF_TARGET (${externalTarget}) conflicts with the selected BFF origin ${bffOrigin}; unset it or set FKST_CONSOLE_PORT to match.`,
    )
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

function start(command, argv, environment = process.env) {
  return spawn(command, argv, {
    cwd: repositoryRoot,
    detached: process.platform !== 'win32',
    env: { ...environment, BROWSER: 'none' },
    shell: false,
    stdio: 'inherit',
  })
}

function terminate(child, signal = 'SIGTERM') {
  if (child.exitCode !== null || child.signalCode !== null) return
  try {
    if (process.platform === 'win32') child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error
  }
}

const serverEnvironment = { ...process.env }
delete serverEnvironment.FKST_CONSOLE_PORT
const server = start(
  nodeExecutable,
  ['scripts/start-server.mjs', '--port', String(bffPort)],
  serverEnvironment,
)
const app = start(
  pnpmExecutable,
  ['--filter', './app', 'run', 'dev', '--host', '127.0.0.1', '--port', String(uiPort), '--strictPort', ...extraArguments],
  { ...process.env, VITE_BFF_TARGET: bffOrigin },
)
const children = [server, app]

const stopAll = (signal = 'SIGTERM') => {
  for (const child of children) terminate(child, signal)
}

process.once('SIGINT', () => stopAll('SIGINT'))
process.once('SIGTERM', () => stopAll('SIGTERM'))

const outcomes = children.map((child, index) => once(child, 'exit').then(([code, signal]) => ({
  name: index === 0 ? 'server' : 'app',
  code,
  signal,
})))
const first = await Promise.race(outcomes)
stopAll()
await Promise.allSettled(outcomes)

if (first.code !== 0 && first.signal !== 'SIGINT' && first.signal !== 'SIGTERM') {
  console.error(`${first.name} development process exited with ${first.code ?? first.signal ?? 'unknown status'}`)
  process.exitCode = first.code ?? 1
}
