import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { describe, test } from 'node:test'

import { repositoryPath } from './lib/harness.mjs'

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return extname(entry.name) === '.ts' || extname(entry.name) === '.tsx' ? [path] : []
  }))
  return nested.flat()
}

async function joinedSource(directory) {
  const files = await sourceFiles(directory)
  const bodies = await Promise.all(files.map(async (file) => `\n/* ${file} */\n${await readFile(file, 'utf8')}`))
  return bodies.join('')
}

describe('S2 write boundary source-independent invariants', () => {
  test('server defaults to loopback and read-only', () => {
    return Promise.all([
      readFile(repositoryPath('server', 'src', 'config.ts'), 'utf8'),
      readFile(repositoryPath('server', 'package.json'), 'utf8'),
    ]).then(([configSource, packageSource]) => {
      assert.match(configSource, /LOOPBACK_HOST\s*=\s*["']127\.0\.0\.1["']/)
      assert.match(configSource, /let\s+enableWrites\s*=\s*false/)
      assert.match(configSource, /let\s+demo\s*=\s*false/)
      assert.match(configSource, /let\s+sandboxRepo[^=]*=\s*null/)
      assert.match(JSON.parse(packageSource).scripts.start, /127\.0\.0\.1|src\/main\.ts|dist\/main\.js/)
    })
  })

  test('the sole admitted mutation is one argv-only issue creation with the enable label', async () => {
    const source = await readFile(repositoryPath('server', 'src', 'gh-adapter.ts'), 'utf8')
    const compact = source.replace(/\s+/gu, ' ')
    assert.match(
      compact,
      /return \[ ["']issue["'], ["']create["'], ["']--repo["'], repo, ["']--title["'], title, ["']--body["'], body, ["']--label["'], ["']fkst-dev:enabled["'],? \]/,
      'Issue admission must be one argv invocation carrying fkst-dev:enabled in the same operation.',
    )
  })

  test('server does not introduce shell execution, direct GitHub HTTP writes, CORS, or ledger/socket access', async () => {
    const source = await joinedSource(repositoryPath('server', 'src'))
    assert.doesNotMatch(source, /\bexec\s*\(/, 'Use execFile/argv only; shell-string exec is prohibited.')
    assert.doesNotMatch(source, /\bshell\s*:\s*true\b/, 'Child processes must never enable a shell.')
    assert.doesNotMatch(source, /https?:\/\/(?:api\.)?github\.com/i, 'GitHub access belongs behind the gh argv adapter.')
    assert.doesNotMatch(source, /FKST_GITHUB_WRITE/, 'The console must not activate devloop mutation posture.')
    assert.doesNotMatch(source, /fkst-observe-.*\.sock/, 'The console must never touch the engine-owned observe socket.')
    assert.doesNotMatch(source, /(?:open|readFile|writeFile)[^\n]{0,120}delivery\.redb/i, 'The console must shell the observe CLI rather than open redb.')
    assert.doesNotMatch(source, /access-control-allow-origin/i, 'The loopback BFF must not enable CORS.')
  })

  test('browser code contains no direct GitHub API or substrate process surface', async () => {
    const source = await joinedSource(repositoryPath('app', 'src'))
    assert.doesNotMatch(source, /api\.github\.com|uploads\.github\.com/i)
    assert.doesNotMatch(source, /fkst-framework\s+observe|node:child_process|Deno\.Command/i)
  })
})
