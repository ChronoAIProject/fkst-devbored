import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import http from "node:http";
import { pathToFileURL } from "node:url";

const HOST = "127.0.0.1";
const PORT = 8472;
const ENGINE_ROUTE = "/api/v1/connections/local/engine";
const AUTHORITY = "substrate-delivery-only";
const ARTIFACT = "fkst.delivery.observe.v1";
const EXEC_TIMEOUT_MS = 5_000;
const EXEC_OUTPUT_CAP_BYTES = 1024 * 1024;

// This closed allowlist is intentionally not configurable through argv or the
// environment. Expanding it is a server-code change and therefore reviewable.
const SERVER_START_ALLOWLIST = Object.freeze({
  [ENGINE_ROUTE]: Object.freeze({
    binary:
      "/Users/chronoai/Desktop/aelf-frontend-work/FKST/substrate/target/release/fkst-framework",
    durableRoot: "/tmp/fkst-bff-sandbox",
    argv: Object.freeze([
      "observe",
      "--durable-root",
      "/tmp/fkst-bff-sandbox",
      "--json",
      "--limit",
      "1000",
    ]),
  }),
});

const ALLOWED_ORIGINS = new Set([
  "http://127.0.0.1:8471",
  "http://localhost:8471",
  "http://[::1]:8471",
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function requireCondition(condition, path, expectation) {
  if (!condition) {
    throw new Error(`${path} must be ${expectation}`);
  }
}

function validateOptionalString(value, path) {
  requireCondition(value === undefined || typeof value === "string", path, "a string when present");
}

function validateOptionalNullableInteger(value, path) {
  requireCondition(
    value === undefined || value === null || isNonNegativeInteger(value),
    path,
    "a non-negative integer or null when present",
  );
}

function validateDeliverySource(source, path) {
  if (source === undefined || source === null) return;

  requireCondition(isRecord(source), path, "an object when present");
  requireCondition(
    ["File", "Cron", "Git", "External"].includes(source.kind),
    `${path}.kind`,
    "one of File, Cron, Git, or External (case-sensitive)",
  );
}

function validatePayload(payload, path) {
  requireCondition(isRecord(payload), path, "an object");
  validateOptionalString(payload.schema, `${path}.schema`);
  validateOptionalString(payload.dedup_key, `${path}.dedup_key`);
  requireCondition(typeof payload.digest === "string", `${path}.digest`, "a string");
  requireCondition(isNonNegativeInteger(payload.bytes), `${path}.bytes`, "a non-negative integer");
}

function validateQueue(queue, index) {
  const path = `queues[${index}]`;
  requireCondition(isRecord(queue), path, "an object");
  requireCondition(typeof queue.queue === "string", `${path}.queue`, "a string");

  for (const field of ["depth", "pending", "in_flight", "retrying"]) {
    requireCondition(isNonNegativeInteger(queue[field]), `${path}.${field}`, "a non-negative integer");
  }

  validateOptionalNullableInteger(queue.oldest_pending_age_ms, `${path}.oldest_pending_age_ms`);
  requireCondition(
    ["current", "absent", "unknown"].includes(queue.subscriber_status),
    `${path}.subscriber_status`,
    "one of current, absent, or unknown",
  );

  const hasSubscriberField = Object.hasOwn(queue, "has_current_subscriber");
  if (queue.subscriber_status === "current") {
    requireCondition(
      hasSubscriberField && queue.has_current_subscriber === true,
      `${path}.has_current_subscriber`,
      "present and true when subscriber_status is current",
    );
  } else if (queue.subscriber_status === "absent") {
    requireCondition(
      hasSubscriberField && queue.has_current_subscriber === false,
      `${path}.has_current_subscriber`,
      "present and false when subscriber_status is absent",
    );
  } else {
    requireCondition(
      !hasSubscriberField,
      `${path}.has_current_subscriber`,
      "omitted when subscriber_status is unknown",
    );
  }
}

export function classifyObservationMode(queues) {
  requireCondition(Array.isArray(queues), "ledger.queues", "an array");
  if (queues.length === 0) return "indeterminate";

  const statuses = new Set(queues.map((queue) => queue.subscriber_status));
  if (statuses.size === 1 && statuses.has("unknown")) return "offline";
  if (!statuses.has("unknown")) return "live";

  throw new Error(
    "ledger.queues subscriber projection must not mix unknown with current or absent statuses",
  );
}

function validateDelivery(delivery, index) {
  const path = `deliveries[${index}]`;
  requireCondition(isRecord(delivery), path, "an object");

  for (const field of ["delivery_id", "queue", "dept", "fence_token"]) {
    requireCondition(typeof delivery[field] === "string", `${path}.${field}`, "a string");
  }

  requireCondition(
    ["pending", "in-flight", "retrying"].includes(delivery.status),
    `${path}.status`,
    "pending, in-flight, or retrying (case-sensitive)",
  );

  for (const field of [
    "observed_at_ms",
    "not_before_ms",
    "attempt",
    "redrive_count",
    "lease_generation",
  ]) {
    requireCondition(isNonNegativeInteger(delivery[field]), `${path}.${field}`, "a non-negative integer");
  }

  validateOptionalNullableInteger(delivery.lease_until_ms, `${path}.lease_until_ms`);
  validateOptionalNullableInteger(
    delivery.subscriber_absent_since_ms,
    `${path}.subscriber_absent_since_ms`,
  );
  validateOptionalString(delivery.last_error_excerpt, `${path}.last_error_excerpt`);
  validateDeliverySource(delivery.source, `${path}.source`);
  validatePayload(delivery.payload, `${path}.payload`);
}

function validateDeadLetter(deadLetter, index) {
  const path = `dead_letters[${index}]`;
  requireCondition(isRecord(deadLetter), path, "an object");

  for (const field of ["delivery_id", "queue", "dept", "fence_token"]) {
    requireCondition(typeof deadLetter[field] === "string", `${path}.${field}`, "a string");
  }

  for (const field of ["dead_at_ms", "attempts", "redrive_count", "lease_generation"]) {
    requireCondition(isNonNegativeInteger(deadLetter[field]), `${path}.${field}`, "a non-negative integer");
  }

  requireCondition(typeof deadLetter.replayable === "boolean", `${path}.replayable`, "a boolean");
  requireCondition(typeof deadLetter.permanent === "boolean", `${path}.permanent`, "a boolean");
  validateOptionalString(deadLetter.error_excerpt, `${path}.error_excerpt`);
  validateDeliverySource(deadLetter.source, `${path}.source`);
  validatePayload(deadLetter.payload, `${path}.payload`);
}

export function validateObserveLedger(value, expectedDurableRoot) {
  requireCondition(isRecord(value), "ledger", "an object");
  requireCondition(value.schema_version === 1, "ledger.schema_version", "exactly 1");
  requireCondition(
    isNonNegativeInteger(value.generated_at_ms) && value.generated_at_ms <= 8_640_000_000_000_000,
    "ledger.generated_at_ms",
    "a valid non-negative millisecond timestamp",
  );

  requireCondition(isRecord(value.source), "ledger.source", "an object");
  requireCondition(
    value.source.durable_root === expectedDurableRoot,
    "ledger.source.durable_root",
    `the allowlisted root ${expectedDurableRoot}`,
  );
  for (const field of ["database", "read_semantics", "history_semantics"]) {
    requireCondition(typeof value.source[field] === "string", `ledger.source.${field}`, "a string");
  }

  requireCondition(isRecord(value.limits), "ledger.limits", "an object");
  for (const field of ["max_deliveries", "max_dead_letters"]) {
    requireCondition(isNonNegativeInteger(value.limits[field]), `ledger.limits.${field}`, "a non-negative integer");
  }

  requireCondition(isRecord(value.truncated), "ledger.truncated", "an object");
  for (const field of ["deliveries", "dead_letters"]) {
    requireCondition(typeof value.truncated[field] === "boolean", `ledger.truncated.${field}`, "a boolean");
  }

  for (const field of ["queues", "deliveries", "dead_letters"]) {
    requireCondition(Array.isArray(value[field]), `ledger.${field}`, "an array");
  }

  value.queues.forEach(validateQueue);
  value.deliveries.forEach(validateDelivery);
  value.dead_letters.forEach(validateDeadLetter);
  classifyObservationMode(value.queues);
  return value;
}

function publicError(code, message) {
  return { code, message };
}

export function makeEnvelope(
  availability,
  observationMode,
  ledger,
  acquiredAtMs = Date.now(),
  error = null,
) {
  const generatedAtMs = availability === "available" ? ledger.generated_at_ms : null;

  return {
    authority: AUTHORITY,
    artifact: ARTIFACT,
    generated_at: generatedAtMs === null ? null : new Date(generatedAtMs).toISOString(),
    acquired_at: new Date(acquiredAtMs).toISOString(),
    snapshot_age_ms: generatedAtMs === null ? null : Math.max(0, acquiredAtMs - generatedAtMs),
    availability,
    observation_mode: observationMode,
    ledger,
    error,
  };
}

export function envelopeForLedgerCandidate(value, expectedDurableRoot, acquiredAtMs = Date.now()) {
  try {
    const ledger = validateObserveLedger(value, expectedDurableRoot);
    const observationMode = classifyObservationMode(ledger.queues);
    return {
      statusCode: 200,
      envelope: makeEnvelope("available", observationMode, ledger, acquiredAtMs),
      validationError: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      statusCode: 502,
      envelope: makeEnvelope(
        "unknown",
        "indeterminate",
        null,
        acquiredAtMs,
        publicError("invalid_ledger", `Observe output failed ledger validation: ${message}`),
      ),
      validationError: message,
    };
  }
}

function runObserve(config) {
  return new Promise((resolve) => {
    execFile(
      config.binary,
      [...config.argv],
      {
        encoding: "utf8",
        timeout: EXEC_TIMEOUT_MS,
        maxBuffer: EXEC_OUTPUT_CAP_BYTES,
        killSignal: "SIGKILL",
        windowsHide: true,
      },
      (error, stdout) => resolve({ error, stdout }),
    );
  });
}

function setCommonHeaders(response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
}

function sendJson(response, statusCode, body) {
  setCommonHeaders(response);
  response.statusCode = statusCode;
  response.end(`${JSON.stringify(body)}\n`);
}

function applyCors(request, response) {
  const origin = request.headers.origin;
  if (origin === undefined) return true;
  if (!ALLOWED_ORIGINS.has(origin)) return false;

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "GET");
  response.setHeader("Vary", "Origin");
  return true;
}

async function handleEngineLedger(response) {
  const config = SERVER_START_ALLOWLIST[ENGINE_ROUTE];
  const { error, stdout } = await runObserve(config);
  const acquiredAtMs = Date.now();

  if (error && Number(error.code) === 2) {
    sendJson(
      response,
      200,
      makeEnvelope("unavailable", "indeterminate", null, acquiredAtMs),
    );
    return;
  }

  if (error) {
    console.error(`observe failed within the local read boundary: ${error.message}`);
    sendJson(
      response,
      502,
      makeEnvelope(
        "unknown",
        "indeterminate",
        null,
        acquiredAtMs,
        publicError(
          "observe_failed",
          "The allowlisted observe command failed before a ledger snapshot was available.",
        ),
      ),
    );
    return;
  }

  try {
    const parsed = JSON.parse(stdout);
    const result = envelopeForLedgerCandidate(parsed, config.durableRoot, acquiredAtMs);
    if (result.validationError) {
      console.error(`observe returned an invalid schema: ${result.validationError}`);
    }
    sendJson(response, result.statusCode, result.envelope);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`observe returned invalid JSON: ${message}`);
    sendJson(
      response,
      502,
      makeEnvelope(
        "unknown",
        "indeterminate",
        null,
        acquiredAtMs,
        publicError("invalid_json", "Observe output was not valid JSON."),
      ),
    );
  }
}

async function handleRequest(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "method_not_allowed" });
    return;
  }

  if (!applyCors(request, response)) {
    sendJson(response, 403, { error: "forbidden_origin" });
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url, `http://${HOST}:${PORT}`).pathname;
  } catch {
    sendJson(response, 400, { error: "invalid_request_target" });
    return;
  }

  if (pathname !== ENGINE_ROUTE) {
    sendJson(response, 404, { error: "not_found" });
    return;
  }

  await handleEngineLedger(response);
}

async function startServer() {
  const startConfig = SERVER_START_ALLOWLIST[ENGINE_ROUTE];
  await mkdir(startConfig.durableRoot, { recursive: true });

  const server = http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      console.error(`request failed: ${error.message}`);
      if (!response.headersSent) {
        sendJson(
          response,
          500,
          makeEnvelope(
            "unknown",
            "indeterminate",
            null,
            Date.now(),
            publicError("internal_error", "The local BFF could not complete the read."),
          ),
        );
      } else {
        response.destroy();
      }
    });
  });

  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      console.error(`FKST local BFF could not start: ${HOST}:${PORT} is already in use.`);
    } else {
      console.error(`FKST local BFF could not start: ${error?.message || String(error)}`);
    }
    process.exitCode = 1;
  });

  server.listen(PORT, HOST, () => {
    console.log(`FKST local BFF listening on http://${HOST}:${PORT}`);
  });

  function stopServer(signal) {
    server.close((error) => {
      if (error) {
        console.error(`failed to stop after ${signal}: ${error.message}`);
        process.exitCode = 1;
      }
    });
  }

  process.once("SIGINT", () => stopServer("SIGINT"));
  process.once("SIGTERM", () => stopServer("SIGTERM"));
}

function testLedger(queues) {
  return {
    schema_version: 1,
    generated_at_ms: 1_700_000_000_000,
    source: {
      durable_root: "/tmp/fkst-bff-sandbox",
      database: "delivery.redb",
      read_semantics: "snapshot",
      history_semantics: "current only",
    },
    limits: { max_deliveries: 1000, max_dead_letters: 1000 },
    truncated: { deliveries: false, dead_letters: false },
    queues,
    deliveries: [],
    dead_letters: [],
  };
}

async function runContractTests() {
  const { strict: assert } = await import("node:assert");
  const root = "/tmp/fkst-bff-sandbox";
  const queue = (subscriberStatus, hasCurrentSubscriber) => {
    const value = {
      queue: `queue-${subscriberStatus}`,
      depth: 1,
      pending: 1,
      in_flight: 0,
      retrying: 0,
      oldest_pending_age_ms: 10,
      subscriber_status: subscriberStatus,
    };
    if (hasCurrentSubscriber !== undefined) {
      value.has_current_subscriber = hasCurrentSubscriber;
    }
    return value;
  };

  const live = envelopeForLedgerCandidate(
    testLedger([queue("current", true), queue("absent", false)]),
    root,
  );
  assert.equal(live.envelope.availability, "available");
  assert.equal(live.envelope.observation_mode, "live");
  console.log("PASS X-01 live: current/absent projection is available + live");

  const offline = envelopeForLedgerCandidate(testLedger([queue("unknown")]), root);
  assert.equal(offline.envelope.availability, "available");
  assert.equal(offline.envelope.observation_mode, "offline");
  console.log("PASS X-01 offline: all-unknown projection is available + offline");

  const indeterminate = envelopeForLedgerCandidate(testLedger([]), root);
  assert.equal(indeterminate.envelope.availability, "available");
  assert.equal(indeterminate.envelope.observation_mode, "indeterminate");
  console.log("PASS X-01 indeterminate: empty projection is available + indeterminate");

  const violation = envelopeForLedgerCandidate(testLedger([queue("current", false)]), root);
  assert.equal(violation.statusCode, 502);
  assert.equal(violation.envelope.availability, "unknown");
  assert.equal(violation.envelope.observation_mode, "indeterminate");
  assert.equal(violation.envelope.error.code, "invalid_ledger");
  assert.match(violation.envelope.error.message, /present and true/);
  console.log("PASS X-01 invariant violation: availability is unknown with an honest error");
}

const isDirectExecution = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (isDirectExecution) {
  if (process.argv.includes("--contract-test")) {
    await runContractTests();
  } else {
    await startServer();
  }
}
