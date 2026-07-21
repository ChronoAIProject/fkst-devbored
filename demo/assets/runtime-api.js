const ENGINE_LEDGER_URL = "http://127.0.0.1:8472/api/v1/connections/local/engine";
const REQUEST_TIMEOUT_MS = 1_500;
const VALID_AVAILABILITY = new Set(["available", "unavailable", "unknown"]);
const VALID_OBSERVATION_MODES = new Set(["live", "offline", "indeterminate"]);
const PROJECTION_CONFIG = Object.freeze({
  deliveries: Object.freeze({ limit: "max_deliveries" }),
  dead_letters: Object.freeze({ limit: "max_dead_letters" }),
});

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function assertQueueCoupling(queue, index) {
  if (!isRecord(queue)) throw new Error(`Queue ${index} is not an object.`);
  if (!["current", "absent", "unknown"].includes(queue.subscriber_status)) {
    throw new Error(`Queue ${index} has an invalid subscriber_status.`);
  }

  const hasSubscriberField = Object.hasOwn(queue, "has_current_subscriber");
  if (
    queue.subscriber_status === "current" &&
    (!hasSubscriberField || queue.has_current_subscriber !== true)
  ) {
    throw new Error(
      `Queue ${index} must report has_current_subscriber true when subscriber_status is current.`,
    );
  }
  if (
    queue.subscriber_status === "absent" &&
    (!hasSubscriberField || queue.has_current_subscriber !== false)
  ) {
    throw new Error(
      `Queue ${index} must report has_current_subscriber false when subscriber_status is absent.`,
    );
  }
  if (queue.subscriber_status === "unknown" && hasSubscriberField) {
    throw new Error(
      `Queue ${index} must omit has_current_subscriber when subscriber_status is unknown.`,
    );
  }
}

export function classifyObservationMode(queues) {
  if (!Array.isArray(queues)) throw new Error("The ledger has no queues array.");
  queues.forEach(assertQueueCoupling);
  if (queues.length === 0) return "indeterminate";

  const statuses = new Set(queues.map((queue) => queue.subscriber_status));
  if (statuses.size === 1 && statuses.has("unknown")) return "offline";
  if (!statuses.has("unknown")) return "live";
  throw new Error("The subscriber projection mixes authoritative and unknown queue states.");
}

function validateError(value, required) {
  if (value === null && !required) return;
  if (!isRecord(value) || typeof value.code !== "string" || typeof value.message !== "string") {
    throw new Error(required
      ? "An unknown read must carry an honest structured error."
      : "The BFF response has an invalid error field.");
  }
}

export function validateEnvelope(value) {
  if (!isRecord(value)) throw new Error("The BFF response is not an object.");
  if (value.authority !== "substrate-delivery-only") {
    throw new Error("The BFF response has an unexpected authority.");
  }
  if (value.artifact !== "fkst.delivery.observe.v1") {
    throw new Error("The BFF response has an unexpected artifact.");
  }
  if (!VALID_AVAILABILITY.has(value.availability)) {
    throw new Error("The BFF response has an invalid availability.");
  }
  if (!VALID_OBSERVATION_MODES.has(value.observation_mode)) {
    throw new Error("The BFF response has an invalid observation_mode.");
  }
  if (typeof value.acquired_at !== "string") {
    throw new Error("The BFF response has no acquisition timestamp.");
  }

  if (value.availability === "available") {
    if (!isRecord(value.ledger) || value.ledger.schema_version !== 1) {
      throw new Error("The available ledger is not schema_version 1.");
    }
    for (const field of ["queues", "deliveries", "dead_letters"]) {
      if (!Array.isArray(value.ledger[field])) {
        throw new Error(`The available ledger has no ${field} array.`);
      }
    }
    if (typeof value.generated_at !== "string" || !Number.isFinite(value.snapshot_age_ms)) {
      throw new Error("The available ledger has invalid snapshot metadata.");
    }
    if (!isRecord(value.ledger.limits)) {
      throw new Error("The available ledger has no limits object.");
    }
    for (const field of ["max_deliveries", "max_dead_letters"]) {
      if (!isNonNegativeInteger(value.ledger.limits[field])) {
        throw new Error(`The available ledger has an invalid limits.${field}.`);
      }
    }
    if (!isRecord(value.ledger.truncated)) {
      throw new Error("The available ledger has no truncated object.");
    }
    for (const field of ["deliveries", "dead_letters"]) {
      if (typeof value.ledger.truncated[field] !== "boolean") {
        throw new Error(`The available ledger has an invalid truncated.${field}.`);
      }
    }

    const classifiedMode = classifyObservationMode(value.ledger.queues);
    if (value.observation_mode !== classifiedMode) {
      throw new Error(
        `The BFF observation_mode is ${value.observation_mode}; the queue projection classifies as ${classifiedMode}.`,
      );
    }
    validateError(value.error, false);
    if (value.error !== null) {
      throw new Error("An available ledger must not carry an error.");
    }
  } else {
    if (
      value.ledger !== null ||
      value.generated_at !== null ||
      value.snapshot_age_ms !== null
    ) {
      throw new Error("A non-available ledger must not carry snapshot facts.");
    }
    if (value.observation_mode !== "indeterminate") {
      throw new Error("A non-available ledger must have indeterminate observation mode.");
    }
    validateError(value.error, value.availability === "unknown");
    if (value.availability === "unavailable" && value.error !== null) {
      throw new Error("An unavailable first-run ledger must not be presented as an error.");
    }
  }

  return value;
}

export function formatDetailProjection(envelope, collection) {
  const config = PROJECTION_CONFIG[collection];
  if (!config) throw new Error(`Unsupported detail projection: ${collection}`);
  const validated = validateEnvelope(envelope);
  if (validated.availability !== "available") {
    throw new Error("Detail projections require an available ledger.");
  }

  const shown = validated.ledger[collection].length;
  const limit = validated.ledger.limits[config.limit];
  const truncated = validated.ledger.truncated[collection];
  return Object.freeze({
    countLabel: truncated ? `>=${shown}` : String(shown),
    detailLabel: truncated
      ? `${shown} shown; more exist · limit ${limit}`
      : `${shown} shown · limit ${limit} · exact count`,
    statusLabel: truncated ? "partial detail projection" : "complete detail projection",
    truncated,
    shown,
    limit,
  });
}

export async function readEngineLedger() {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ENGINE_LEDGER_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    const body = validateEnvelope(await response.json());

    if (!response.ok && body.availability !== "unknown") {
      throw new Error(`The BFF returned HTTP ${response.status}.`);
    }

    return body;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function syntheticEnvelope() {
  return {
    authority: "substrate-delivery-only",
    artifact: "fkst.delivery.observe.v1",
    generated_at: "2026-07-21T00:00:00.000Z",
    acquired_at: "2026-07-21T00:00:01.000Z",
    snapshot_age_ms: 1000,
    availability: "available",
    observation_mode: "live",
    error: null,
    ledger: {
      schema_version: 1,
      limits: { max_deliveries: 2, max_dead_letters: 1 },
      truncated: { deliveries: true, dead_letters: false },
      queues: [
        {
          queue: "implementation",
          subscriber_status: "current",
          has_current_subscriber: true,
        },
      ],
      deliveries: [{ delivery_id: "d-1" }, { delivery_id: "d-2" }],
      dead_letters: [{ delivery_id: "dl-1" }],
    },
  };
}

async function runContractTests() {
  const { strict: assert } = await import("node:assert");
  const first = syntheticEnvelope();
  assert.deepEqual(formatDetailProjection(first, "deliveries"), {
    countLabel: ">=2",
    detailLabel: "2 shown; more exist · limit 2",
    statusLabel: "partial detail projection",
    truncated: true,
    shown: 2,
    limit: 2,
  });
  assert.equal(formatDetailProjection(first, "dead_letters").countLabel, "1");
  assert.match(formatDetailProjection(first, "dead_letters").detailLabel, /exact count/);
  console.log("PASS X-02 deliveries truncated: >=N and partial-detail disclosure");
  console.log("PASS X-02 dead_letters exact: exact count retained when flag is false");

  const second = syntheticEnvelope();
  second.ledger.truncated.deliveries = false;
  second.ledger.truncated.dead_letters = true;
  assert.equal(formatDetailProjection(second, "deliveries").countLabel, "2");
  assert.equal(formatDetailProjection(second, "dead_letters").countLabel, ">=1");
  assert.equal(
    formatDetailProjection(second, "dead_letters").detailLabel,
    "1 shown; more exist · limit 1",
  );
  console.log("PASS X-02 deliveries exact: exact count retained when flag is false");
  console.log("PASS X-02 dead_letters truncated: >=N and partial-detail disclosure");
}

const isNodeDirectExecution =
  typeof process !== "undefined" &&
  process.argv?.[1] &&
  new URL(`file://${process.argv[1]}`).href === import.meta.url;

if (isNodeDirectExecution && process.argv.includes("--contract-test")) {
  await runContractTests();
}
