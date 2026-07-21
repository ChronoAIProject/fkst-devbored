import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pnpmExecutable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const nodeExecutable = process.execPath
const extraArguments = process.argv.slice(2)

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
  ['scripts/start-server.mjs', '--port', '8472'],
  serverEnvironment,
)
const app = start(
  pnpmExecutable,
  ['--filter', './app', 'run', 'dev', '--host', '127.0.0.1', '--port', '5173', '--strictPort', ...extraArguments],
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
