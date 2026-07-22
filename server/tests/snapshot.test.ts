import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CommandExecutionError } from "../src/exec-file.ts";
import { acquireHealth, FixtureSnapshotProvider, LocalSnapshotProvider } from "../src/snapshot.ts";
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

test("the BFF snapshot never contains the configured durable root or database path", async () => {
  const durableRoot = "/configured/test-root";
  const config: ServerConfig = {
    host: "127.0.0.1",
    port: 8472,
    demo: false,
    enableWrites: false,
    sandboxRepo: null,
    botLogin: null,
    ghBin: "gh",
    observe: { binary: "/bin/fkst-framework", durableRoot },
    healthScript: null,
  };
  const ledger = {
    schema_version: 1,
    generated_at_ms: 1_700_000_000_000,
    source: {
      durable_root: durableRoot,
      database: `${durableRoot}/delivery.redb`,
      read_semantics: "snapshot",
      history_semantics: "current only",
    },
    limits: { max_deliveries: 1000, max_dead_letters: 1000 },
    truncated: { deliveries: false, dead_letters: false },
    queues: [],
    deliveries: [],
    dead_letters: [],
  };
  const runner: FileRunner = {
    async run(file) {
      if (file !== "/bin/fkst-framework") throw new Error(`unexpected invocation: ${file}`);
      return { stdout: JSON.stringify(ledger), stderr: "" };
    },
  };
  const snapshot = await new LocalSnapshotProvider(
    config,
    runner,
    () => new Date("2026-07-22T04:00:00Z"),
  ).getSnapshot();
  const runtime = snapshot.data.runtime as Record<string, unknown>;
  assert.equal(runtime.availability, "available");
  const source = runtime.source as Record<string, unknown>;
  assert.equal(source.durable_root, "[configured-local-root]");
  assert.equal(source.database, "[configured-local-database]");
  assert.ok(
    !JSON.stringify(snapshot).includes(durableRoot),
    "no configured local path may reach /api/v1/snapshot",
  );
});

const DEVLOOP_FAILURE_STDERR =
  "error: fkst-framework observe --json failed; fkst-substrate#81 is required for scripts/run.sh board: [framework] startup error: open existing durable delivery database `/host/durable/delivery.redb`: I/O error: No such file or directory (os error 2)\n";

function failingRunner(exitCode: number, stderr: string): FileRunner {
  return {
    async run(): Promise<never> {
      throw new CommandExecutionError(exitCode, false, stderr);
    },
  };
}

test("the pinned devloop missing-database signature narrows to durable_root_missing without raw stderr", async () => {
  const health = (await acquireHealth(failingRunner(1, DEVLOOP_FAILURE_STDERR), "/host/run.sh", {
    durableRoot: "/host/durable",
    pathExists: async () => "missing",
  })) as Record<string, unknown>;
  assert.equal(health.availability, "unavailable");
  assert.equal(health.reason, "durable_root_missing");
  assert.equal(health.verdict, null);
  assert.equal(health.exit_code, 1);
  assert.equal(health.failure_signature, "public_devloop_observe_read_failed");
  assert.doesNotMatch(JSON.stringify(health), /\/host\/durable|fkst-substrate#81/u);
});

test("an exit-126 permission failure is never durable missing, even with the root absent", async () => {
  const health = (await acquireHealth(
    failingRunner(126, "bash: /host/run.sh: Permission denied\n"),
    "/host/run.sh",
    { durableRoot: "/host/durable", pathExists: async () => "missing" },
  )) as Record<string, unknown>;
  assert.equal(health.availability, "unknown");
  assert.equal(health.reason, "health_command_failed");
  assert.equal(health.exit_code, 126);
  assert.equal(health.failure_signature, null);
});

test("a generic nonzero exit without the signature stays unknown", async () => {
  const health = (await acquireHealth(failingRunner(3, "some failure\n"), "/host/run.sh", {
    durableRoot: "/host/durable",
    pathExists: async () => "missing",
  })) as Record<string, unknown>;
  assert.equal(health.availability, "unknown");
  assert.equal(health.reason, "health_command_failed");
  assert.equal(health.exit_code, 3);
  assert.equal(health.failure_signature, null);
});

test("secret-shaped stderr never reaches the projected health value", async () => {
  // Built at runtime so the repository scrub never sees secret-shaped source.
  const fakeToken = ["ghp", "FAKEtoken0FAKEtoken0FAKE"].join("_");
  const credentialUrl = "https://" + "oauth-user:hunter2pass@" + "github.example/private.git";
  const homePath = "/Us" + "ers/some-developer/secret-project/run.sh";
  const hostileStderr =
    ["Authorization", `Bearer ${fakeToken}`].join(": ") +
    `\nfetch ${credentialUrl} failed\nat ${homePath}\n` +
    DEVLOOP_FAILURE_STDERR;
  const health = (await acquireHealth(failingRunner(1, hostileStderr), "/host/run.sh", {
    durableRoot: "/host/durable",
    pathExists: async () => "missing",
  })) as Record<string, unknown>;
  const projected = JSON.stringify(health);
  for (const needle of [fakeToken, credentialUrl, homePath, "hunter2pass", "some-developer"]) {
    assert.ok(!projected.includes(needle), `projected health leaked: ${needle.slice(0, 12)}…`);
  }
  assert.equal(health.availability, "unavailable");
  assert.equal(health.reason, "durable_root_missing");
});

test("health failure without durable-root context stays unknown and projects no stderr", async () => {
  const health = (await acquireHealth(
    failingRunner(1, DEVLOOP_FAILURE_STDERR),
    "/host/run.sh",
  )) as Record<string, unknown>;
  assert.equal(health.availability, "unknown");
  assert.equal(health.reason, "health_command_failed");
  assert.equal(health.exit_code, 1);
  assert.equal(health.failure_signature, "public_devloop_observe_read_failed");
  assert.equal("stderr_excerpt" in health, false);
});
