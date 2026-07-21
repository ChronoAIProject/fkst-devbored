import { spawn } from 'node:child_process'

const pnpmExecutable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const serverArguments = []

function appendValue(flag, environmentName) {
  const value = process.env[environmentName]?.trim()
  if (value) serverArguments.push(flag, value)
}

appendValue('--port', 'FKST_CONSOLE_PORT')
appendValue('--sandbox-repo', 'FKST_SANDBOX_REPO')
appendValue('--bot-login', 'FKST_BOT_LOGIN')
appendValue('--gh-bin', 'FKST_GH_BIN')
appendValue('--observe-bin', 'FKST_OBSERVE_BIN')
appendValue('--durable-root', 'FKST_DURABLE_ROOT')
appendValue('--health-script', 'FKST_HEALTH_SCRIPT')

const writesValue = process.env.FKST_ENABLE_WRITES?.trim()
if (writesValue && writesValue !== '0' && writesValue !== '1') {
  throw new Error('FKST_ENABLE_WRITES must be exactly 0, 1, or unset')
}
if (writesValue === '1') serverArguments.push('--enable-writes')

serverArguments.push(...process.argv.slice(2))

const child = spawn(
  pnpmExecutable,
  ['--filter', './server', 'run', 'start', ...serverArguments],
  { env: process.env, shell: false, stdio: 'inherit' },
)

child.once('error', (error) => {
  console.error(`failed to start local BFF: ${error.message}`)
  process.exitCode = 1
})

child.once('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exitCode = code ?? 1
})
