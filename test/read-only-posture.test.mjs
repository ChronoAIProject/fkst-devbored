import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { after, before, describe, test } from 'node:test'
import { promisify } from 'node:util'

import {
  REPOSITORY_ROOT,
  reserveLoopbackPort,
  startBff,
  stopProcess,
  waitForHttp,
} from './lib/harness.mjs'

const execFileAsync = promisify(execFile)

describe('S1 read-only BFF posture reaches New Work availability honestly', () => {
  let bff
  let snapshot

  before(async () => {
    const port = await reserveLoopbackPort()
    const origin = `http://127.0.0.1:${port}`
    bff = startBff(port)
    await waitForHttp(`${origin}/api/v1/health`, { processHandle: bff })
    const response = await fetch(`${origin}/api/v1/snapshot`, { signal: AbortSignal.timeout(5_000) })
    assert.equal(response.status, 200)
    snapshot = await response.json()
    assert.equal(snapshot.data?.posture, 'read-only', 'The probe requires the default BFF posture.')
  })

  after(async () => stopProcess(bff))

  test('the BFF string posture disables both write gates and New Work availability', async () => {
    const { stdout } = await execFileAsync(
      'pnpm',
      ['--filter', './app', 'exec', 'vite-node', '../test/probes/read-only-posture.mts'],
      {
        cwd: REPOSITORY_ROOT,
        env: { ...process.env, FKST_READ_ONLY_SNAPSHOT: JSON.stringify(snapshot) },
        timeout: 15_000,
        maxBuffer: 1024 * 1024,
      },
    )
    const line = stdout.split('\n').find((candidate) => candidate.startsWith('READ_ONLY_POSTURE='))
    assert.ok(line, `Read-only posture probe did not emit a result:\n${stdout}`)
    const result = JSON.parse(line.slice('READ_ONLY_POSTURE='.length))

    assert.equal(result.mode, 'live')
    assert.equal(result.posture.label, 'READ-ONLY')
    assert.equal(result.posture.writesEnabled, false)
    assert.equal(result.posture.issueCreationEnabled, false)
    assert.deepEqual(result.availability, {
      state: 'unavailable',
      allowed: false,
      headline: 'Unavailable for this launch',
      reason: 'The validated deployment posture explicitly disables issue creation.',
    })
  })
})
