import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import { promisify } from 'node:util'

import { repositoryPath } from './lib/harness.mjs'

const execFileAsync = promisify(execFile)
const PREFLIGHT_SCRIPT = repositoryPath('scripts', 'preflight-live.mts')
const FAKE_GH = repositoryPath('test', 'bin', 'gh')
const FAKE_OBSERVE = repositoryPath('test', 'bin', 'fkst-framework')
const FAKE_HEALTH = repositoryPath('test', 'bin', 'health')
const OFFLINE_FIXTURE = repositoryPath('test', 'fixtures', 'observe-offline.v1.json')
const FIXTURE_DURABLE_ROOT = '/recorded/demo/root'

function scrubbedEnv(overrides) {
  const env = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('FKST_') || key.startsWith('GH_TRIPWIRE')) continue
    env[key] = value
  }
  return { ...env, ...overrides }
}

async function runPreflight(overrides) {
  const options = {
    env: scrubbedEnv(overrides),
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024,
  }
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      ['--experimental-strip-types', PREFLIGHT_SCRIPT, '--json'],
      options,
    )
    return { code: 0, report: JSON.parse(stdout) }
  } catch (error) {
    if (typeof error.code !== 'number') throw error
    return { code: error.code, report: JSON.parse(error.stdout) }
  }
}

function checkFor(report, integration) {
  const check = report.checks.find((candidate) => candidate.integration === integration)
  assert.ok(check, `report is missing the ${integration} check`)
  return check
}

async function auditRecords(path) {
  if (!existsSync(path)) return []
  const content = await readFile(path, 'utf8')
  return content.split('\n').filter(Boolean).map((line) => JSON.parse(line))
}

describe('S-preflight deterministic live-read preflight', () => {
  let scratch

  before(async () => {
    scratch = await mkdtemp(join(tmpdir(), 'fkst-preflight-'))
  })

  after(async () => rm(scratch, { recursive: true, force: true }))

  test('unconfigured integrations report UNAVAILABLE, never PASS', async () => {
    const { code, report } = await runPreflight({ FKST_GH_BIN: FAKE_GH })
    assert.equal(code, 0)
    assert.equal(report.schema, 'fkst.console.live-preflight.v1')
    assert.equal(report.posture, 'read-only')

    const github = checkFor(report, 'github')
    assert.equal(github.status, 'UNAVAILABLE')
    assert.equal(github.reason, 'sandbox_repo_not_configured')
    const actorStep = github.steps.find((step) => step.id === 'gh_actor_read')
    assert.equal(actorStep?.status, 'PASS')

    assert.equal(checkFor(report, 'observe').reason, 'observe_not_configured')
    assert.equal(checkFor(report, 'health').reason, 'health_not_configured')
    assert.equal(report.summary.live_read_possible, false)
  })

  test('missing gh binary is UNAVAILABLE, not PASS or FAIL', async () => {
    const { code, report } = await runPreflight({
      FKST_GH_BIN: join(scratch, 'missing-gh'),
    })
    assert.equal(code, 0)
    const github = checkFor(report, 'github')
    assert.equal(github.status, 'UNAVAILABLE')
    assert.equal(github.reason, 'gh_binary_unavailable')
  })

  test('fully configured fakes PASS with exactly the reviewed read argv and no mutations', async () => {
    const ghAudit = join(scratch, 'gh-audit.jsonl')
    const observeAudit = join(scratch, 'observe-audit.jsonl')
    const healthAudit = join(scratch, 'health-audit.jsonl')
    const { code, report } = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_SANDBOX_REPO: 'octo-org/octo-repo',
      FKST_BOT_LOGIN: 'trusted-loop-agent',
      FKST_OBSERVE_BIN: FAKE_OBSERVE,
      FKST_DURABLE_ROOT: FIXTURE_DURABLE_ROOT,
      FKST_HEALTH_SCRIPT: FAKE_HEALTH,
      GH_TRIPWIRE_AUDIT: ghAudit,
      FKST_OBSERVE_TRIPWIRE_AUDIT: observeAudit,
      FKST_OBSERVE_TRIPWIRE_FIXTURE: OFFLINE_FIXTURE,
      FKST_HEALTH_TRIPWIRE_AUDIT: healthAudit,
    })
    assert.equal(code, 0)
    for (const integration of ['github', 'observe', 'health']) {
      assert.equal(checkFor(report, integration).status, 'PASS', integration)
    }
    assert.equal(report.summary.live_read_possible, true)
    assert.equal(report.summary.all_integrations_ready, true)

    const observeStep = checkFor(report, 'observe').steps
      .find((step) => step.id === 'observe_snapshot_read')
    assert.equal(observeStep?.evidence.observation_mode, 'offline')
    const healthStep = checkFor(report, 'health').steps
      .find((step) => step.id === 'health_verdict_read')
    assert.equal(healthStep?.evidence.verdict, 'HEALTHY')

    const ghRecords = await auditRecords(ghAudit)
    assert.equal(ghRecords.length, 2, 'the preflight must issue exactly two gh reads')
    assert.ok(ghRecords.every((record) => record.mutation === false), 'no gh mutation is permitted')
    assert.deepEqual(ghRecords[0].argv, ['api', 'user', '--jq', '.login'])
    assert.equal(ghRecords[1].argv[0], 'api')
    assert.equal(ghRecords[1].argv[1], 'graphql')
    assert.equal(ghRecords[1].argv.length, 8)
    assert.equal(ghRecords[1].argv[5], 'owner=octo-org')
    assert.equal(ghRecords[1].argv[7], 'name=octo-repo')

    const observeRecords = await auditRecords(observeAudit)
    assert.equal(observeRecords.length, 1)
    assert.deepEqual(observeRecords[0].argv, [
      'observe',
      '--durable-root',
      FIXTURE_DURABLE_ROOT,
      '--json',
      '--limit',
      '1000',
    ])

    const healthRecords = await auditRecords(healthAudit)
    assert.equal(healthRecords.length, 1)
    assert.deepEqual(healthRecords[0].argv, ['health'])

    assert.ok(
      !JSON.stringify(report).includes(FIXTURE_DURABLE_ROOT),
      'the configured durable root (and its derived database path) must not appear in the report',
    )
  })

  test('an incomplete observe pair FAILs without invoking the binary', async () => {
    const observeAudit = join(scratch, 'observe-pair-audit.jsonl')
    const { code, report } = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_OBSERVE_BIN: FAKE_OBSERVE,
      FKST_OBSERVE_TRIPWIRE_AUDIT: observeAudit,
    })
    assert.equal(code, 1)
    const observe = checkFor(report, 'observe')
    assert.equal(observe.status, 'FAIL')
    assert.equal(observe.reason, 'observe_pair_incomplete')
    assert.equal((await auditRecords(observeAudit)).length, 0)
  })

  test('malformed observe output is FAIL or UNKNOWN, never PASS', async () => {
    const invalidJson = join(scratch, 'observe-invalid.json')
    await writeFile(invalidJson, 'this is not json\n', 'utf8')
    const invalid = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_OBSERVE_BIN: FAKE_OBSERVE,
      FKST_DURABLE_ROOT: FIXTURE_DURABLE_ROOT,
      FKST_OBSERVE_TRIPWIRE_FIXTURE: invalidJson,
    })
    assert.equal(invalid.code, 1)
    assert.equal(checkFor(invalid.report, 'observe').status, 'FAIL')
    assert.equal(checkFor(invalid.report, 'observe').reason, 'observe_invalid_json')

    const mismatchedRoot = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_OBSERVE_BIN: FAKE_OBSERVE,
      FKST_DURABLE_ROOT: '/recorded/other-root',
      FKST_OBSERVE_TRIPWIRE_FIXTURE: OFFLINE_FIXTURE,
    })
    assert.equal(checkFor(mismatchedRoot.report, 'observe').status, 'UNKNOWN')
    assert.equal(checkFor(mismatchedRoot.report, 'observe').reason, 'observe_failed')
  })

  test('a configured pair with an absent durable root is UNAVAILABLE(durable_root_missing)', async () => {
    const missingRoot = join(scratch, 'missing-durable-root')
    const { code, report } = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_OBSERVE_BIN: FAKE_OBSERVE,
      FKST_DURABLE_ROOT: missingRoot,
      FKST_OBSERVE_TRIPWIRE_STARTUP_ERROR: '1',
    })
    assert.equal(code, 0, 'a missing durable root is a valid read-only posture, not FAIL')
    const observe = checkFor(report, 'observe')
    assert.equal(observe.status, 'UNAVAILABLE')
    assert.equal(observe.reason, 'durable_root_missing')
    assert.equal(existsSync(missingRoot), false, 'the preflight must not initialize the root')
  })

  test('an existing root without delivery.redb is UNAVAILABLE(observe_database_missing)', async () => {
    const emptyRoot = join(scratch, 'empty-durable-root')
    await mkdir(emptyRoot, { recursive: true })
    const { code, report } = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_OBSERVE_BIN: FAKE_OBSERVE,
      FKST_DURABLE_ROOT: emptyRoot,
      FKST_OBSERVE_TRIPWIRE_STARTUP_ERROR: '1',
    })
    assert.equal(code, 0)
    const observe = checkFor(report, 'observe')
    assert.equal(observe.status, 'UNAVAILABLE')
    assert.equal(observe.reason, 'observe_database_missing')
    assert.equal(existsSync(join(emptyRoot, 'delivery.redb')), false, 'no database may be created')
  })

  test('a plain file configured as the durable root is FAIL(durable_root_invalid), not missing', async () => {
    const fileRoot = join(scratch, 'file-as-root')
    await writeFile(fileRoot, 'not a directory\n', 'utf8')
    const { code, report } = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_OBSERVE_BIN: FAKE_OBSERVE,
      FKST_DURABLE_ROOT: fileRoot,
      FKST_OBSERVE_TRIPWIRE_STARTUP_ERROR: '1',
    })
    assert.equal(code, 1, 'a malformed root shape is a configuration failure')
    const observe = checkFor(report, 'observe')
    assert.equal(observe.status, 'FAIL')
    assert.equal(observe.reason, 'durable_root_invalid')
  })

  test('an existing delivery.redb leaves an exit-2 engine failure UNKNOWN, never missing', async () => {
    const populatedRoot = join(scratch, 'populated-durable-root')
    await mkdir(populatedRoot, { recursive: true })
    await writeFile(join(populatedRoot, 'delivery.redb'), 'stand-in database bytes', 'utf8')
    const { report } = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_OBSERVE_BIN: FAKE_OBSERVE,
      FKST_DURABLE_ROOT: populatedRoot,
      FKST_OBSERVE_TRIPWIRE_STARTUP_ERROR: '1',
    })
    const observe = checkFor(report, 'observe')
    assert.equal(observe.status, 'UNKNOWN')
    assert.equal(observe.reason, 'observe_failed')
  })

  test('health failure with the devloop signature over an absent root is UNAVAILABLE(durable_root_missing)', async () => {
    const missingRoot = join(scratch, 'missing-health-root')
    const stderrLine =
      'error: fkst-framework observe --json failed; [framework] startup error: open existing durable delivery database\n'
    const { code, report } = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_OBSERVE_BIN: FAKE_OBSERVE,
      FKST_OBSERVE_TRIPWIRE_STARTUP_ERROR: '1',
      FKST_DURABLE_ROOT: missingRoot,
      FKST_HEALTH_SCRIPT: FAKE_HEALTH,
      FKST_HEALTH_TRIPWIRE_EXIT: '1',
      FKST_HEALTH_TRIPWIRE_STDERR: stderrLine,
    })
    assert.equal(code, 0, 'missing durable state must not be reported as FAIL')
    const health = checkFor(report, 'health')
    assert.equal(health.status, 'UNAVAILABLE')
    assert.equal(health.reason, 'durable_root_missing')
    const verdictStep = health.steps.find((step) => step.id === 'health_verdict_read')
    assert.equal(verdictStep?.evidence.exit_code, 1)
    assert.equal(verdictStep?.evidence.failure_signature, 'public_devloop_observe_read_failed')
    assert.equal(existsSync(missingRoot), false, 'the preflight must not initialize the root')
  })

  test('an exit-126 permission failure is UNKNOWN even when the durable root is absent', async () => {
    const { code, report } = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_OBSERVE_BIN: FAKE_OBSERVE,
      FKST_OBSERVE_TRIPWIRE_STARTUP_ERROR: '1',
      FKST_DURABLE_ROOT: join(scratch, 'missing-permission-root'),
      FKST_HEALTH_SCRIPT: FAKE_HEALTH,
      FKST_HEALTH_TRIPWIRE_EXIT: '126',
      FKST_HEALTH_TRIPWIRE_STDERR: 'run.sh: Permission denied\n',
    })
    assert.equal(code, 0)
    const health = checkFor(report, 'health')
    assert.equal(health.status, 'UNKNOWN')
    assert.equal(health.reason, 'health_command_failed')
    const verdictStep = health.steps.find((step) => step.id === 'health_verdict_read')
    assert.equal(verdictStep?.evidence.exit_code, 126)
    assert.equal(verdictStep?.evidence.failure_signature, null)
  })

  test('secret-shaped health stderr never appears anywhere in the preflight report', async () => {
    const missingRoot = join(scratch, 'missing-secret-root')
    // Built at runtime so the repository scrub never sees secret-shaped source.
    const fakeToken = ['ghp', 'FAKEtoken0FAKEtoken0FAKE'].join('_')
    const credentialUrl = 'https://' + 'oauth-user:hunter2pass@' + 'github.example/private.git'
    const homePath = '/Us' + 'ers/some-developer/secret-project/run.sh'
    const hostileStderr =
      ['Authorization', `Bearer ${fakeToken}`].join(': ') +
      `\nfetch ${credentialUrl} failed\nat ${homePath}\n` +
      'error: fkst-framework observe --json failed; [framework] startup error: open existing durable delivery database\n'
    const { report } = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_OBSERVE_BIN: FAKE_OBSERVE,
      FKST_OBSERVE_TRIPWIRE_STARTUP_ERROR: '1',
      FKST_DURABLE_ROOT: missingRoot,
      FKST_HEALTH_SCRIPT: FAKE_HEALTH,
      FKST_HEALTH_TRIPWIRE_EXIT: '1',
      FKST_HEALTH_TRIPWIRE_STDERR: hostileStderr,
    })
    const serialized = JSON.stringify(report)
    for (const needle of [fakeToken, credentialUrl, homePath, 'hunter2pass', 'some-developer']) {
      assert.ok(!serialized.includes(needle), `preflight report leaked: ${needle.slice(0, 12)}…`)
    }
    assert.ok(!serialized.includes(missingRoot), 'the configured root path must not be projected')
    const health = checkFor(report, 'health')
    assert.equal(health.status, 'UNAVAILABLE')
    assert.equal(health.reason, 'durable_root_missing')
  })

  test('an unclassifiable health failure stays UNKNOWN and keeps its exit evidence', async () => {
    const { code, report } = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_HEALTH_SCRIPT: FAKE_HEALTH,
      FKST_HEALTH_TRIPWIRE_EXIT: '3',
    })
    assert.equal(code, 0)
    const health = checkFor(report, 'health')
    assert.equal(health.status, 'UNKNOWN')
    assert.equal(health.reason, 'health_command_failed')
    const verdictStep = health.steps.find((step) => step.id === 'health_verdict_read')
    assert.equal(verdictStep?.evidence.exit_code, 3)
    assert.equal(verdictStep?.evidence.failure_signature, null)
  })

  test('an unrecognized health verdict is FAIL, never PASS', async () => {
    const { code, report } = await runPreflight({
      FKST_GH_BIN: FAKE_GH,
      FKST_HEALTH_SCRIPT: FAKE_HEALTH,
      FKST_HEALTH_TRIPWIRE_VERDICT: 'definitely not a verdict\n',
    })
    assert.equal(code, 1)
    const health = checkFor(report, 'health')
    assert.equal(health.status, 'FAIL')
    assert.equal(health.reason, 'unrecognized_health_verdict')
  })
})
