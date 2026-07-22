import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { CommandExecutionError } from "../src/exec-file.ts";
import {
  acquireObserveRuntime,
  classifyObservationMode,
  defaultPathProbe,
  unconfiguredRuntime,
  validateObserveLedger,
  type PathKind,
  type PathProbe,
} from "../src/observe.ts";
import type { FileRunner } from "../src/types.ts";

function ledger(): Record<string, unknown> {
  return {
    schema_version: 1,
    generated_at_ms: 1_700_000_000_000,
    source: {
      durable_root: "/configured/test-root",
      database: "/configured/test-root/delivery.redb",
      read_semantics: "snapshot",
      history_semantics: "current only",
    },
    limits: { max_deliveries: 1000, max_dead_letters: 1000 },
    truncated: { deliveries: false, dead_letters: false },
    queues: [
      {
        queue: "review",
        depth: 1,
        pending: 0,
        in_flight: 1,
        retrying: 0,
        oldest_pending_age_ms: null,
        subscriber_status: "unknown",
      },
    ],
    deliveries: [
      {
        delivery_id: "delivery-1",
        queue: "review",
        dept: "review",
        source: { kind: "Cron" },
        status: "in-flight",
        payload: { digest: "digest-1", bytes: 10 },
      },
    ],
    dead_letters: [],
  };
}

test("preserves observe naming traps and offline omitted-key semantics", () => {
  const parsed = validateObserveLedger(ledger(), "/configured/test-root");
  const queues = parsed.queues as Array<Record<string, unknown>>;
  assert.equal(classifyObservationMode(queues), "offline");
  assert.equal(Object.hasOwn(queues[0] ?? {}, "has_current_subscriber"), false);
  const deliveries = parsed.deliveries as Array<Record<string, unknown>>;
  assert.equal(deliveries[0]?.status, "in-flight");
  assert.deepEqual(deliveries[0]?.source, { kind: "Cron" });
});

test("rejects underscore delivery status and lowercase source kind", () => {
  const wrongStatus = ledger();
  (wrongStatus.deliveries as Array<Record<string, unknown>>)[0]!.status = "in_flight";
  assert.throws(() => validateObserveLedger(wrongStatus, "/configured/test-root"), /status/);

  const wrongKind = ledger();
  (wrongKind.deliveries as Array<Record<string, unknown>>)[0]!.source = { kind: "cron" };
  assert.throws(() => validateObserveLedger(wrongKind, "/configured/test-root"), /kind/);
});

test("rejects a database path that is not the configured root's delivery.redb", () => {
  const arbitrary = ledger();
  (arbitrary.source as Record<string, unknown>).database = "/tmp/evil-root/delivery.redb";
  assert.throws(
    () => validateObserveLedger(arbitrary, "/configured/test-root"),
    /database path/u,
  );

  const bare = ledger();
  (bare.source as Record<string, unknown>).database = "delivery.redb";
  assert.throws(() => validateObserveLedger(bare, "/configured/test-root"), /database path/u);

  const missing = ledger();
  delete (missing.source as Record<string, unknown>).database;
  assert.throws(() => validateObserveLedger(missing, "/configured/test-root"), /database path/u);
});

test("a successful projection redacts both the root and the derived database path", async () => {
  const runner: FileRunner = {
    async run() {
      return { stdout: JSON.stringify(ledger()), stderr: "" };
    },
  };
  const runtime = (await acquireObserveRuntime(
    runner,
    { binary: "/bin/fkst-framework", durableRoot: "/configured/test-root" },
    () => 1_700_000_000_500,
  )) as Record<string, unknown>;
  assert.equal(runtime.availability, "available");
  const source = runtime.source as Record<string, unknown>;
  assert.equal(source.durable_root, "[configured-local-root]");
  assert.equal(source.database, "[configured-local-database]");
  assert.ok(!JSON.stringify(runtime).includes("/configured/test-root"));
});

test("rejects has_current_subscriber null in offline output", () => {
  const invalid = ledger();
  (invalid.queues as Array<Record<string, unknown>>)[0]!.has_current_subscriber = null;
  assert.throws(() => validateObserveLedger(invalid, "/configured/test-root"), /must omit/);
});

const STARTUP_ERROR_STDERR =
  "[framework] startup error: open existing durable delivery database `/probe/root/delivery.redb`: I/O error: No such file or directory (os error 2)\n";

function exitTwoRunner(): FileRunner {
  return {
    async run(): Promise<never> {
      throw new CommandExecutionError(2, false, STARTUP_ERROR_STDERR);
    },
  };
}

function probeOf(shapes: Readonly<Record<string, PathKind>>): PathProbe {
  return async (path: string): Promise<PathKind> => shapes[path] ?? "missing";
}

async function classifyWith(shapes: Readonly<Record<string, PathKind>>) {
  const runtime = (await acquireObserveRuntime(
    exitTwoRunner(),
    { binary: "/bin/fkst-framework", durableRoot: "/probe/root" },
    () => 0,
    probeOf(shapes),
  )) as Record<string, unknown>;
  return runtime;
}

test("exit-2 with an absent root is unavailable durable_root_missing", async () => {
  const runtime = await classifyWith({});
  assert.equal(runtime.availability, "unavailable");
  assert.equal(runtime.reason, "durable_root_missing");
});

test("exit-2 with an empty directory root is unavailable observe_database_missing", async () => {
  const runtime = await classifyWith({ "/probe/root": "directory" });
  assert.equal(runtime.availability, "unavailable");
  assert.equal(runtime.reason, "observe_database_missing");
});

test("exit-2 with a plain file as root is invalid, not missing", async () => {
  const runtime = await classifyWith({ "/probe/root": "file" });
  assert.equal(runtime.availability, "unknown");
  assert.equal(runtime.reason, "durable_root_invalid");
});

test("exit-2 with a directory where the database should be is invalid, not missing", async () => {
  const runtime = await classifyWith({
    "/probe/root": "directory",
    "/probe/root/delivery.redb": "directory",
  });
  assert.equal(runtime.availability, "unknown");
  assert.equal(runtime.reason, "observe_database_invalid");
});

test("exit-2 with an inaccessible root stays unclassified unknown, never missing", async () => {
  const runtime = await classifyWith({ "/probe/root": "inaccessible" });
  assert.equal(runtime.availability, "unknown");
  assert.equal(runtime.reason, "observe_failed");
});

test("exit-2 with root and database both present cannot be classified and stays unknown", async () => {
  const runtime = await classifyWith({
    "/probe/root": "directory",
    "/probe/root/delivery.redb": "file",
  });
  assert.equal(runtime.availability, "unknown");
  assert.equal(runtime.reason, "observe_failed");
});

test("default probe types real paths and treats only ENOENT as missing", async (t) => {
  const scratch = await mkdtemp(join(tmpdir(), "fkst-probe-"));
  t.after(async () => {
    await chmod(join(scratch, "locked"), 0o700).catch(() => {});
    await rm(scratch, { recursive: true, force: true });
  });
  await writeFile(join(scratch, "plain-file"), "not a root\n", "utf8");
  await mkdir(join(scratch, "locked"), { mode: 0o000 });

  assert.equal(await defaultPathProbe(scratch), "directory");
  assert.equal(await defaultPathProbe(join(scratch, "plain-file")), "file");
  assert.equal(await defaultPathProbe(join(scratch, "absent")), "missing");
  if (typeof process.getuid !== "function" || process.getuid() !== 0) {
    assert.equal(
      await defaultPathProbe(join(scratch, "locked", "child")),
      "inaccessible",
      "a permission error must not be reported as missing durable state",
    );
  }
});

test("unconfigured runtime is unavailable with null counts, never fabricated zero", () => {
  const runtime = unconfiguredRuntime() as Record<string, unknown>;
  assert.equal(runtime.availability, "unavailable");
  assert.equal(runtime.queues, null);
  assert.deepEqual(runtime.counts, { queue_depth: null, dead_letters: null });
});
