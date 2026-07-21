import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { FixtureSnapshotProvider, LocalSnapshotProvider } from "../src/snapshot.ts";
import type { ServerConfig } from "../src/config.ts";
import type { FileRunner } from "../src/types.ts";

const fixturePath = fileURLToPath(
  new URL("../../demo/fixtures/snapshot.v1.json", import.meta.url),
);

test("fixture provider preserves the shared provenance-rich contract exactly", async () => {
  const raw = JSON.parse(await readFile(fixturePath, "utf8")) as unknown;
  const served = await new FixtureSnapshotProvider().getSnapshot();
  assert.deepEqual(served, raw);
  assert.equal(served.capture.captured_at, "2026-07-21T14:10:00Z");
  const capturedAt = Date.parse(served.capture.captured_at);
  const sanitizedAt = Date.parse(served.capture.sanitized_at ?? "");
  const auditClock = Date.parse("2026-07-21T20:34:00Z");
  assert.ok(Number.isFinite(capturedAt));
  assert.ok(Number.isFinite(sanitizedAt));
  assert.ok(sanitizedAt >= capturedAt);
  assert.ok(sanitizedAt <= auditClock);
  const data = served.data as unknown as Record<string, Record<string, unknown>>;
  assert.ok(Array.isArray(data.issues?.items));
  assert.ok(Array.isArray(data.pull_requests?.items));
  assert.equal(typeof data.council?.definition, "object");
  assert.equal(typeof data.council?.round, "object");
});

test("fixture contains no secret-shaped keys, real source identities, or absolute paths", async () => {
  const source = await readFile(fixturePath, "utf8");
  assert.doesNotMatch(source, /ChronoAI|fkst-packages-testing|\/Users\/|\/home\/|file:\/\//u);
  assert.doesNotMatch(source, /"(?:token|password|secret|authorization|cookie)"\s*:/iu);
});

test("local provider reports disconnected sources with null values", async () => {
  const config: ServerConfig = {
    host: "127.0.0.1",
    port: 8472,
    demo: false,
    enableWrites: false,
    sandboxRepo: null,
    botLogin: null,
    ghBin: "gh",
    observe: null,
    healthScript: null,
  };
  const runner: FileRunner = {
    async run(): Promise<never> {
      throw new Error("unconfigured sources must not execute");
    },
  };
  const snapshot = await new LocalSnapshotProvider(
    config,
    runner,
    () => new Date("2026-07-22T04:00:00Z"),
  ).getSnapshot();
  const issues = snapshot.data.issues as Record<string, unknown>;
  const runtime = snapshot.data.runtime as Record<string, unknown>;
  assert.equal(issues.availability, "unavailable");
  assert.equal(issues.count, null);
  assert.equal(issues.items, null);
  assert.equal(runtime.availability, "unavailable");
  assert.equal(runtime.queues, null);
});
