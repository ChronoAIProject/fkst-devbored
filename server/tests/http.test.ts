import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import type { ServerConfig } from "../src/config.ts";
import { createBffServer, type BffServer } from "../src/http-server.ts";
import { FixtureSnapshotProvider } from "../src/snapshot.ts";

function config(): ServerConfig {
  return {
    host: "127.0.0.1",
    port: 0,
    demo: true,
    enableWrites: false,
    sandboxRepo: null,
    botLogin: null,
    ghBin: "gh",
    observe: null,
    healthScript: null,
  };
}

async function listen(bff: BffServer): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    bff.server.once("error", reject);
    bff.server.listen(0, "127.0.0.1", resolve);
  });
  const address = bff.server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

test("serves health/session and the exact shared snapshot without CORS", async (context) => {
  let writeCalls = 0;
  const snapshots = new FixtureSnapshotProvider();
  const bff = createBffServer({
    config: config(),
    snapshots,
    gh: {
      async resolveActor(): Promise<string> {
        throw new Error("read-only mode must not resolve an actor");
      },
      async createEnabledIssue(): Promise<string> {
        writeCalls += 1;
        throw new Error("write adapter must not be invoked in tests");
      },
    },
    sessionToken: "test-session-token",
  });
  const base = await listen(bff);
  context.after(() => bff.close());

  const snapshotResponse = await fetch(`${base}/api/v1/snapshot`);
  assert.equal(snapshotResponse.status, 200);
  assert.equal(snapshotResponse.headers.get("access-control-allow-origin"), null);
  assert.deepEqual(await snapshotResponse.json(), await snapshots.getSnapshot());

  const healthResponse = await fetch(`${base}/api/v1/health`);
  assert.equal(healthResponse.status, 200);
  const health = (await healthResponse.json()) as Record<string, unknown>;
  assert.equal((health.bff as Record<string, unknown>).status, "ok");

  const sessionResponse = await fetch(`${base}/api/v1/session`);
  const session = (await sessionResponse.json()) as Record<string, unknown>;
  assert.equal(session.posture, "recorded-read-only");
  assert.deepEqual(session.same_origin_token, {
    header: "x-fkst-session-token",
    token: "test-session-token",
  });

  const denial = await fetch(`${base}/api/v1/issues`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "must not write", body: "denied" }),
  });
  assert.equal(denial.status, 403);
  assert.equal(((await denial.json()) as { error: { code: string } }).error.code, "writes_disabled");
  assert.equal(writeCalls, 0);
});

test("returns 405 for known wrong methods and 404 for unknown routes", async (context) => {
  const bff = createBffServer({
    config: config(),
    snapshots: new FixtureSnapshotProvider(),
    gh: {
      async resolveActor(): Promise<string> {
        throw new Error("not called");
      },
      async createEnabledIssue(): Promise<string> {
        throw new Error("not called");
      },
    },
  });
  const base = await listen(bff);
  context.after(() => bff.close());

  const wrongMethod = await fetch(`${base}/api/v1/health`, { method: "POST" });
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("allow"), "GET");
  const missing = await fetch(`${base}/api/v1/not-a-route`);
  assert.equal(missing.status, 404);
});

test("rejects an oversized issue body before actor resolution or issue creation", async (context) => {
  let actorCalls = 0;
  let writeCalls = 0;
  const writeConfig: ServerConfig = {
    ...config(),
    demo: false,
    enableWrites: true,
    sandboxRepo: "demo-owner/sandbox-repo",
    botLogin: "loop-agent",
  };
  const bff = createBffServer({
    config: writeConfig,
    snapshots: new FixtureSnapshotProvider(),
    gh: {
      async resolveActor(): Promise<string> {
        actorCalls += 1;
        return "verified-human";
      },
      async createEnabledIssue(): Promise<string> {
        writeCalls += 1;
        throw new Error("write adapter must not be invoked by body-bound tests");
      },
    },
    sessionToken: "bounded-body-token",
  });
  const base = await listen(bff);
  context.after(() => bff.close());

  const response = await fetch(`${base}/api/v1/issues`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: base,
      "x-fkst-session-token": "bounded-body-token",
    },
    body: JSON.stringify({ title: "bounded", body: "x".repeat(17_000) }),
  });
  assert.equal(response.status, 413);
  assert.equal(((await response.json()) as { error: { code: string } }).error.code, "body_too_large");
  assert.equal(actorCalls, 0);
  assert.equal(writeCalls, 0);
});

test("SSE sends an initial snapshot and heartbeat while bounding clients", async (context) => {
  const bff = createBffServer({
    config: config(),
    snapshots: new FixtureSnapshotProvider(),
    gh: {
      async resolveActor(): Promise<string> {
        throw new Error("not called");
      },
      async createEnabledIssue(): Promise<string> {
        throw new Error("not called");
      },
    },
    maxSseClients: 1,
    sseHeartbeatMs: 15,
  });
  const base = await listen(bff);
  context.after(() => bff.close());

  const first = await fetch(`${base}/api/v1/events`);
  assert.equal(first.status, 200);
  assert.match(first.headers.get("content-type") ?? "", /^text\/event-stream/u);
  const second = await fetch(`${base}/api/v1/events`);
  assert.equal(second.status, 503);
  assert.equal(((await second.json()) as { error: { code: string } }).error.code, "sse_capacity");

  const reader = first.body?.getReader();
  assert.ok(reader);
  const decoder = new TextDecoder();
  let received = "";
  for (let index = 0; index < 10 && !received.includes(": heartbeat"); index += 1) {
    const chunk = await reader.read();
    if (chunk.done) break;
    received += decoder.decode(chunk.value, { stream: true });
  }
  assert.match(received, /event: snapshot\ndata: .*fkst\.console\.snapshot\.v1/u);
  assert.match(received, /: heartbeat/u);
  await reader.cancel();
});
