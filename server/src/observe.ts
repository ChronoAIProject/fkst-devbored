import { stat } from "node:fs/promises";
import { join } from "node:path";
import { CommandExecutionError } from "./exec-file.ts";
import type { FileRunner, JsonValue } from "./types.ts";

const OBSERVE_LIMITS = Object.freeze({ timeoutMs: 5_000, maxOutputBytes: 1024 * 1024 });
const DELIVERY_STATUSES = new Set(["pending", "in-flight", "retrying"]);
const SOURCE_KINDS = new Set(["File", "Cron", "Git", "External"]);
const SUBSCRIBER_STATUSES = new Set(["current", "absent", "unknown"]);

type UnknownRecord = Record<string, unknown>;

export interface ObserveConfig {
  binary: string;
  durableRoot: string;
}

export type PathKind = "directory" | "file" | "other" | "missing" | "inaccessible";
export type PathProbe = (path: string) => Promise<PathKind>;

export async function defaultPathProbe(path: string): Promise<PathKind> {
  try {
    const info = await stat(path);
    if (info.isDirectory()) return "directory";
    if (info.isFile()) return "file";
    return "other";
  } catch (error) {
    // Only ENOENT proves absence. EACCES/EPERM/ENOTDIR/any other I/O error
    // means the probe could not see the path, which must never be reported
    // as missing durable state.
    return (error as NodeJS.ErrnoException).code === "ENOENT" ? "missing" : "inaccessible";
  }
}

export type DurableStateReason =
  | "durable_root_missing"
  | "observe_database_missing"
  | "durable_root_invalid"
  | "observe_database_invalid";

export const MISSING_DURABLE_REASONS: ReadonlySet<string> = new Set([
  "durable_root_missing",
  "observe_database_missing",
]);
export const INVALID_DURABLE_REASONS: ReadonlySet<string> = new Set([
  "durable_root_invalid",
  "observe_database_invalid",
]);

// The engine reports one identical exit-2 startup failure whether the root
// directory or only the database file inside it is absent, so the distinction
// must come from these probes. They stat path shapes only: nothing is created,
// and the database contents are never read. An inaccessible path or a database
// file that does exist yields null — the failure stays unclassified.
export async function classifyMissingDurableState(
  durableRoot: string,
  probe: PathProbe,
): Promise<DurableStateReason | null> {
  const root = await probe(durableRoot);
  if (root === "missing") return "durable_root_missing";
  if (root === "file" || root === "other") return "durable_root_invalid";
  if (root !== "directory") return null;
  const database = await probe(join(durableRoot, "delivery.redb"));
  if (database === "missing") return "observe_database_missing";
  if (database === "directory" || database === "other") return "observe_database_invalid";
  return null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireCondition(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function validateSource(value: unknown, path: string): void {
  if (value === undefined || value === null) return;
  requireCondition(isRecord(value), `${path} must be an object`);
  requireCondition(SOURCE_KINDS.has(String(value.kind)), `${path}.kind has invalid casing or value`);
}

function validatePayload(value: unknown, path: string): void {
  requireCondition(isRecord(value), `${path} must be an object`);
  requireCondition(typeof value.digest === "string", `${path}.digest must be a string`);
  requireCondition(isNonNegativeInteger(value.bytes), `${path}.bytes must be non-negative`);
}

function validateQueue(value: unknown, index: number): asserts value is UnknownRecord {
  const path = `queues[${index}]`;
  requireCondition(isRecord(value), `${path} must be an object`);
  requireCondition(typeof value.queue === "string", `${path}.queue must be a string`);
  for (const field of ["depth", "pending", "in_flight", "retrying"]) {
    requireCondition(isNonNegativeInteger(value[field]), `${path}.${field} must be non-negative`);
  }
  requireCondition(
    SUBSCRIBER_STATUSES.has(String(value.subscriber_status)),
    `${path}.subscriber_status is invalid`,
  );
  const hasField = Object.hasOwn(value, "has_current_subscriber");
  if (value.subscriber_status === "current") {
    requireCondition(hasField && value.has_current_subscriber === true, `${path} current invariant failed`);
  } else if (value.subscriber_status === "absent") {
    requireCondition(hasField && value.has_current_subscriber === false, `${path} absent invariant failed`);
  } else {
    requireCondition(!hasField, `${path} unknown must omit has_current_subscriber`);
  }
}

function validateDelivery(value: unknown, index: number): asserts value is UnknownRecord {
  const path = `deliveries[${index}]`;
  requireCondition(isRecord(value), `${path} must be an object`);
  requireCondition(DELIVERY_STATUSES.has(String(value.status)), `${path}.status is invalid`);
  validateSource(value.source, `${path}.source`);
  validatePayload(value.payload, `${path}.payload`);
}

export function classifyObservationMode(
  queues: readonly UnknownRecord[],
): "live" | "offline" | "indeterminate" {
  if (queues.length === 0) return "indeterminate";
  const statuses = new Set(queues.map((queue) => queue.subscriber_status));
  if (statuses.size === 1 && statuses.has("unknown")) return "offline";
  if (!statuses.has("unknown")) return "live";
  throw new Error("queue subscriber projection mixes offline and live semantics");
}

export function validateObserveLedger(value: unknown, expectedDurableRoot: string): UnknownRecord {
  requireCondition(isRecord(value), "observe output must be an object");
  requireCondition(value.schema_version === 1, "schema_version must be exactly 1");
  requireCondition(isNonNegativeInteger(value.generated_at_ms), "generated_at_ms must be non-negative");
  requireCondition(isRecord(value.source), "source must be an object");
  requireCondition(value.source.durable_root === expectedDurableRoot, "durable_root is not allowlisted");
  requireCondition(
    value.source.database === join(expectedDurableRoot, "delivery.redb"),
    "database path is not the configured delivery database",
  );
  requireCondition(Array.isArray(value.queues), "queues must be an array");
  requireCondition(Array.isArray(value.deliveries), "deliveries must be an array");
  requireCondition(Array.isArray(value.dead_letters), "dead_letters must be an array");
  value.queues.forEach(validateQueue);
  value.deliveries.forEach(validateDelivery);
  classifyObservationMode(value.queues as UnknownRecord[]);
  return value;
}

function unavailableRuntime(reason: string, availability: "unavailable" | "unknown"): JsonValue {
  return {
    availability,
    artifact: "fkst.delivery.observe.v1",
    observation_mode: "indeterminate",
    generated_at: null,
    snapshot_age_ms: null,
    queues: null,
    deliveries: null,
    dead_letters: null,
    counts: { queue_depth: null, dead_letters: null },
    reason,
  };
}

export function unconfiguredRuntime(): JsonValue {
  return unavailableRuntime("observe_not_configured", "unavailable");
}

function projectLedger(ledger: UnknownRecord, acquiredAtMs: number): JsonValue {
  const generatedAtMs = ledger.generated_at_ms as number;
  const queues = ledger.queues as UnknownRecord[];
  const source = ledger.source as UnknownRecord;
  return {
    availability: "available",
    artifact: "fkst.delivery.observe.v1",
    observation_mode: classifyObservationMode(queues),
    generated_at: new Date(generatedAtMs).toISOString(),
    snapshot_age_ms: Math.max(0, acquiredAtMs - generatedAtMs),
    source: {
      durable_root: "[configured-local-root]",
      // Validated above to be exactly the configured root's delivery.redb;
      // projected only as a sentinel so no local path reaches the snapshot.
      database: "[configured-local-database]",
      read_semantics: typeof source.read_semantics === "string" ? source.read_semantics : null,
      history_semantics:
        typeof source.history_semantics === "string" ? source.history_semantics : null,
    },
    limits: ledger.limits as JsonValue,
    truncated: ledger.truncated as JsonValue,
    queues: ledger.queues as JsonValue,
    deliveries: ledger.deliveries as JsonValue,
    dead_letters: ledger.dead_letters as JsonValue,
  };
}

export async function acquireObserveRuntime(
  runner: FileRunner,
  config: ObserveConfig,
  now: () => number = Date.now,
  pathExists: PathProbe = defaultPathProbe,
): Promise<JsonValue> {
  try {
    const result = await runner.run(
      config.binary,
      ["observe", "--durable-root", config.durableRoot, "--json", "--limit", "1000"],
      OBSERVE_LIMITS,
    );
    const ledger = validateObserveLedger(JSON.parse(result.stdout) as unknown, config.durableRoot);
    return projectLedger(ledger, now());
  } catch (error) {
    if (error instanceof CommandExecutionError && error.exitCode === 2) {
      const reason = await classifyMissingDurableState(config.durableRoot, pathExists);
      if (reason !== null && MISSING_DURABLE_REASONS.has(reason)) {
        return unavailableRuntime(reason, "unavailable");
      }
      if (reason !== null) return unavailableRuntime(reason, "unknown");
      return unavailableRuntime("observe_failed", "unknown");
    }
    if (error instanceof SyntaxError) {
      return unavailableRuntime("observe_invalid_json", "unknown");
    }
    return unavailableRuntime("observe_failed", "unknown");
  }
}
