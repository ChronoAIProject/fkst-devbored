import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyObservationMode,
  unconfiguredRuntime,
  validateObserveLedger,
} from "../src/observe.ts";

function ledger(): Record<string, unknown> {
  return {
    schema_version: 1,
    generated_at_ms: 1_700_000_000_000,
    source: {
      durable_root: "/configured/test-root",
      database: "delivery.redb",
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

test("rejects has_current_subscriber null in offline output", () => {
  const invalid = ledger();
  (invalid.queues as Array<Record<string, unknown>>)[0]!.has_current_subscriber = null;
  assert.throws(() => validateObserveLedger(invalid, "/configured/test-root"), /must omit/);
});

test("unconfigured runtime is unavailable with null counts, never fabricated zero", () => {
  const runtime = unconfiguredRuntime() as Record<string, unknown>;
  assert.equal(runtime.availability, "unavailable");
  assert.equal(runtime.queues, null);
  assert.deepEqual(runtime.counts, { queue_depth: null, dead_letters: null });
});
