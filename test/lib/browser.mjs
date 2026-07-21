import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

async function executableChrome() {
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

export async function dumpRenderedDom(url, options = {}) {
  const chrome = await executableChrome()
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'fkst-blackbox-chrome-'))
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
    `--log-net-log=${networkLog}`,
    '--net-log-capture-mode=Everything',
    `--virtual-time-budget=${options.virtualTimeBudgetMs ?? 3_000}`,
    '--dump-dom',
    url,
  ]
  try {
    const { stdout, stderr } = await execFileAsync(chrome, args, {
      maxBuffer: 12 * 1024 * 1024,
      timeout: options.timeoutMs ?? 10_000,
    })
    let networkUrls = []
    try {
      const log = JSON.parse(await readFile(networkLog, 'utf8'))
      networkUrls = [...collectUrls(log)]
    } catch {
      // Chrome can omit the net log on an early renderer failure; DOM assertions
      // still expose that failure and must remain the primary smoke signal.
    }
    return { dom: stdout, diagnostics: stderr, networkUrls }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}
