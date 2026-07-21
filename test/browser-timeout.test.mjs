import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { after, before, describe, test } from 'node:test'

import { dumpRenderedDom, runChromeBounded } from './lib/browser.mjs'

// Scope cleanup assertions to this test process. Independent test runs may use
// the same system temporary directory concurrently without becoming failures.
const PROFILE_PREFIX = `fkst-blackbox-chrome-${process.pid}-`

async function chromeProfiles() {
  return new Set((await readdir(tmpdir())).filter((entry) => entry.startsWith(PROFILE_PREFIX)))
}

describe('S4 Chrome black-box timeout cleanup', () => {
  let server
  let sockets
  let completeUrl

  before(async () => {
    sockets = new Set()
    server = createServer((request, response) => {
      if (request.url === '/complete') {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        response.end('<!doctype html><html><body>Complete harness document</body></html>')
        return
      }
      response.writeHead(404)
      response.end()
    })
    server.on('connection', (socket) => {
      sockets.add(socket)
      socket.once('close', () => sockets.delete(socket))
    })
    await new Promise((resolveListen, rejectListen) => {
      server.once('error', rejectListen)
      server.listen(0, '127.0.0.1', resolveListen)
    })
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    completeUrl = `http://127.0.0.1:${address.port}/complete`
  })

  after(async () => {
    for (const socket of sockets) socket.destroy()
    await new Promise((resolveClose) => server.close(resolveClose))
  })

  test('a hung browser subprocess group is bounded and reaped exactly', async () => {
    const syntheticBrowser = [
      "const { spawn } = require('node:child_process')",
      "const descendant = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })",
      "process.stdout.write(JSON.stringify({ leader: process.pid, descendant: descendant.pid }) + '\\n')",
      'setInterval(() => {}, 1000)',
    ].join(';')
    const startedAt = Date.now()
    let failure
    try {
      await runChromeBounded(process.execPath, ['-e', syntheticBrowser], { timeoutMs: 750 })
    } catch (error) {
      failure = error
    }
    assert.match(failure?.message ?? '', /Chrome timed out after 750 ms/)
    const identity = JSON.parse(String(failure?.stdout ?? '').trim())
    assert.ok(Number.isSafeInteger(identity.leader) && identity.leader > 0)
    assert.ok(Number.isSafeInteger(identity.descendant) && identity.descendant > 0)

    const deadline = Date.now() + 1_000
    for (const pid of [identity.leader, identity.descendant]) {
      while (Date.now() < deadline) {
        try {
          process.kill(pid, 0)
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 25))
        } catch (error) {
          if (error?.code === 'ESRCH') break
          throw error
        }
      }
      assert.throws(
        () => process.kill(pid, 0),
        (error) => error?.code === 'ESRCH',
        `Synthetic browser process ${pid} survived exact group cleanup.`,
      )
    }
    const elapsedMs = Date.now() - startedAt
    assert.ok(elapsedMs < 4_000, `Chrome timeout cleanup took ${elapsedMs} ms.`)
  })

  test('a complete DOM returns with usable network telemetry before process-group cleanup', async () => {
    const profilesBefore = await chromeProfiles()
    const result = await dumpRenderedDom(completeUrl, {
      virtualTimeBudgetMs: 3_000,
    })
    assert.match(result.dom, /Complete harness document/)
    assert.ok(
      result.networkUrls.includes(completeUrl),
      `Completed DOM did not preserve its request in the netlog: ${result.networkUrls.join(', ')}`,
    )
    assert.equal(typeof result.diagnostics, 'string')
    assert.deepEqual(await chromeProfiles(), profilesBefore)
  })
})
