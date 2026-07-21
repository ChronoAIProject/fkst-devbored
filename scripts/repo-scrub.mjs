import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const selfPath = 'scripts/repo-scrub.mjs'
const knownActorPattern = new RegExp(
  `\\b(?:${'wanghuan' + '-520'}|${'ctkm' + '-aelf'})\\b`,
  'iu',
)

const sensitivePatterns = [
  ['private-key material', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/u],
  ['GitHub token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/u],
  ['OpenAI-style secret', /\bsk-[A-Za-z0-9_-]{20,}\b/u],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/u],
  ['credential-bearing URL', /https?:\/\/[^\s/:@]+:[^\s/@]+@/u],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._~+/=-]{12,}/iu],
  ['unsanitized known actor identity', knownActorPattern],
]

const localPathPatterns = [
  new RegExp(`/${'Users'}/[^/\\s]+/`, 'u'),
  new RegExp(`/${'home'}/[^/\\s]+/`, 'u'),
  /[A-Za-z]:\\Users\\[^\\\s]+\\/u,
]

const binaryExtensions = new Set([
  '.gif', '.gz', '.ico', '.jpeg', '.jpg', '.pdf', '.png', '.ttf', '.woff', '.woff2', '.zip',
])

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length
}

function inspectFile(path, content) {
  const findings = []
  if (path !== selfPath) {
    for (const [description, pattern] of sensitivePatterns) {
      const match = pattern.exec(content)
      if (match) findings.push(`${path}:${lineNumber(content, match.index)} ${description}`)
    }
    for (const pattern of localPathPatterns) {
      const match = pattern.exec(content)
      if (match) findings.push(`${path}:${lineNumber(content, match.index)} absolute developer-home path`)
    }
  }
  return findings
}

const { stdout } = await execFileAsync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { cwd: repositoryRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
)
const paths = stdout.split('\0').filter(Boolean).sort()
const findings = []

for (const path of paths) {
  if (binaryExtensions.has(extname(path).toLowerCase())) continue
  let content
  try {
    content = await readFile(resolve(repositoryRoot, path), 'utf8')
  } catch (error) {
    findings.push(`${path}: unable to inspect (${error.code ?? 'read error'})`)
    continue
  }
  if (content.includes('\0')) continue
  findings.push(...inspectFile(path, content))
}

const { stdout: history } = await execFileAsync(
  'git',
  ['log', 'HEAD', '--format=commit %H', '-p', '--no-ext-diff', '--no-textconv'],
  { cwd: repositoryRoot, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
)
for (const [description, pattern] of sensitivePatterns) {
  if (pattern.test(history)) findings.push(`current branch history: ${description}`)
}

if (findings.length > 0) {
  console.error('repository scrub failed:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exitCode = 1
} else {
  console.log(`repository scrub passed (${paths.length} non-ignored files plus current branch history examined)`)
}
