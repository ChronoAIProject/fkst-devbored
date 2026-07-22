import { formatDetailProjection, readEngineLedger } from "./runtime-api.js";
import { formatAsOf } from "./format.js";

const POLL_INTERVAL_MS = 2_000;
const ARTIFACT_FALLBACK = "fkst.delivery.observe.v1";
const content = document.querySelector("#runtime-content");
const connectionStatus = document.querySelector("#connection-status");
const lastRead = document.querySelector("#last-read");

let stopped = false;
let timer = null;

function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.attrs) {
    for (const [name, value] of Object.entries(options.attrs)) {
      node.setAttribute(name, value);
    }
  }
  node.append(...children);
  return node;
}

function formatTimestamp(value) {
  if (!value) return "unavailable";
  const formatted = formatAsOf(value);
  return formatted === "unknown" ? "unavailable" : formatted;
}

function formatDuration(value) {
  if (!Number.isFinite(value)) return "unavailable";
  if (value < 1_000) return `${Math.max(0, Math.round(value))} ms`;
  if (value < 60_000) return `${(value / 1_000).toFixed(1)} s`;
  return `${(value / 60_000).toFixed(1)} min`;
}

function formatBoolean(value) {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "not reported";
}

function formatOptional(value) {
  return value === undefined || value === null || value === "" ? "—" : String(value);
}

function formatSource(source) {
  if (!source || typeof source !== "object") return "—";
  return formatOptional(source.kind);
}

function panelFooter(envelope) {
  return element("footer", { className: "panel-footer" }, [
    element("span", { text: `Artifact: ${envelope.artifact || ARTIFACT_FALLBACK}` }),
    element("span", { text: `Snapshot age: ${formatDuration(envelope.snapshot_age_ms)}` }),
  ]);
}

function metric(label, value, note) {
  return element("article", { className: "metric" }, [
    element("p", { className: "metric__label", text: label }),
    element("p", { className: "metric__value", text: String(value) }),
    element("p", { className: "metric__note", text: note }),
  ]);
}

function table(headers, rows, emptyMessage) {
  if (rows.length === 0) {
    return element("div", { className: "table-empty", text: emptyMessage });
  }

  const head = element("thead", {}, [
    element(
      "tr",
      {},
      headers.map((header) => element("th", { text: header, attrs: { scope: "col" } })),
    ),
  ]);
  const body = element(
    "tbody",
    {},
    rows.map((row) =>
      element(
        "tr",
        {},
        row.map((cell) => element("td", { text: formatOptional(cell) })),
      ),
    ),
  );

  return element("div", { className: "table-wrap" }, [element("table", {}, [head, body])]);
}

function projectionDisclosure(projection) {
  return element("div", { className: "projection-disclosure" }, [
    element("span", {
      className: `projection-status${projection.truncated ? " projection-status--partial" : ""}`,
      text: projection.statusLabel,
    }),
    element("span", { className: "projection-detail", text: projection.detailLabel }),
  ]);
}

function ledgerPanel(title, description, tableNode, envelope, projection = null) {
  const heading = element("header", { className: "panel-heading" }, [
    element("div", { className: "panel-heading__copy" }, [
      element("h2", { text: title }),
      element("p", { text: description }),
    ]),
  ]);
  if (projection) heading.append(projectionDisclosure(projection));

  return element("section", { className: "ledger-panel" }, [
    heading,
    tableNode,
    panelFooter(envelope),
  ]);
}

function modePresentation(observationMode) {
  if (observationMode === "live") {
    return {
      eyebrow: "Validated live snapshot · schema_version 1",
      title: "Engine delivery ledger is online",
      pillClass: "online",
      pillText: "Online · live",
      acquiredLabel: "Last live acquisition",
    };
  }
  if (observationMode === "offline") {
    return {
      eyebrow: "Offline snapshot — valid ledger data, no live authority",
      title: "Validated engine delivery ledger",
      pillClass: "offline",
      pillText: "Offline snapshot",
      acquiredLabel: "Offline snapshot acquired",
    };
  }
  return {
    eyebrow: "Validated snapshot · observation mode indeterminate",
    title: "Engine delivery ledger is available",
    pillClass: "unknown",
    pillText: "Indeterminate",
    acquiredLabel: "Snapshot acquired",
  };
}

function renderAvailable(envelope) {
  const { ledger } = envelope;
  const presentation = modePresentation(envelope.observation_mode);
  const deliveryProjection = formatDetailProjection(envelope, "deliveries");
  const deadLetterProjection = formatDetailProjection(envelope, "dead_letters");
  const totalDepth = ledger.queues.reduce((sum, queue) => sum + queue.depth, 0);
  const metrics = element(
    "section",
    { className: "metrics", attrs: { "aria-label": "Ledger snapshot summary" } },
    [
      metric("Queue rows", ledger.queues.length, "queues with a current delivery row"),
      metric("Queue depth", totalDepth, "engine delivery depth, not work"),
      metric(
        "Current deliveries",
        deliveryProjection.countLabel,
        deliveryProjection.truncated ? "lower bound; detail projection is partial" : "exact snapshot count",
      ),
      metric(
        "Dead letters",
        deadLetterProjection.countLabel,
        deadLetterProjection.truncated ? "lower bound; detail projection is partial" : "exact snapshot count",
      ),
    ],
  );

  const queueRows = ledger.queues.map((queue) => [
    queue.queue,
    queue.depth,
    queue.pending,
    queue.in_flight,
    queue.retrying,
    queue.subscriber_status,
    formatBoolean(queue.has_current_subscriber),
    queue.oldest_pending_age_ms === null || queue.oldest_pending_age_ms === undefined
      ? "—"
      : formatDuration(queue.oldest_pending_age_ms),
  ]);
  const deliveryRows = ledger.deliveries.map((delivery) => [
    delivery.delivery_id,
    delivery.queue,
    delivery.dept,
    delivery.status,
    delivery.attempt,
    delivery.redrive_count,
    delivery.lease_until_ms ? formatTimestamp(delivery.lease_until_ms) : "—",
    formatSource(delivery.source),
  ]);
  const deadLetterRows = ledger.dead_letters.map((deadLetter) => [
    deadLetter.delivery_id,
    deadLetter.queue,
    deadLetter.dept,
    deadLetter.attempts,
    deadLetter.redrive_count,
    formatBoolean(deadLetter.replayable),
    formatBoolean(deadLetter.permanent),
    deadLetter.error_excerpt,
    formatSource(deadLetter.source),
  ]);

  const deliveryEmpty = deliveryProjection.truncated
    ? "No delivery rows are shown in this partial projection; more exist beyond the limit."
    : "No current delivery rows are present in this validated snapshot.";
  const deadLetterEmpty = deadLetterProjection.truncated
    ? "No dead-letter rows are shown in this partial projection; more exist beyond the limit."
    : "No dead-letter rows are present in this validated snapshot.";

  const view = document.createDocumentFragment();
  view.append(
    element(
      "section",
      {
        className: "snapshot-note",
        attrs: { "data-observation-mode": envelope.observation_mode },
      },
      [
        element("div", {}, [
          element("p", { className: "eyebrow", text: presentation.eyebrow }),
          element("h2", { text: presentation.title }),
        ]),
        element("dl", { className: "snapshot-meta" }, [
          element("div", {}, [
            element("dt", { text: "Generated" }),
            element("dd", { text: formatTimestamp(envelope.generated_at) }),
          ]),
          element("div", {}, [
            element("dt", { text: "Acquired" }),
            element("dd", { text: formatTimestamp(envelope.acquired_at) }),
          ]),
        ]),
      ],
    ),
    metrics,
    ledgerPanel(
      "Queues",
      "Current engine-delivery queue facts. Subscriber “unknown” means no graph authority, not no subscriber.",
      table(
        [
          "Queue",
          "Depth",
          "Pending",
          "In-flight",
          "Retrying",
          "Subscriber",
          "Current subscriber",
          "Oldest pending",
        ],
        queueRows,
        "No queue rows are present in this validated snapshot; observation mode is indeterminate.",
      ),
      envelope,
    ),
    ledgerPanel(
      "Current deliveries",
      "Statuses preserve the engine spelling: pending, in-flight, or retrying.",
      table(
        ["Delivery", "Queue", "Department", "Status", "Attempt", "Redrives", "Lease until", "Source kind"],
        deliveryRows,
        deliveryEmpty,
      ),
      envelope,
      deliveryProjection,
    ),
    ledgerPanel(
      "Dead letters",
      "Dead-letter rows describe delivery outcomes only; they do not classify business work.",
      table(
        [
          "Delivery",
          "Queue",
          "Department",
          "Attempts",
          "Redrives",
          "Replayable",
          "Permanent",
          "Error excerpt",
          "Source kind",
        ],
        deadLetterRows,
        deadLetterEmpty,
      ),
      envelope,
      deadLetterProjection,
    ),
  );

  content.replaceChildren(view);
  connectionStatus.className = `connection-pill connection-pill--${presentation.pillClass}`;
  connectionStatus.textContent = presentation.pillText;
  lastRead.textContent = `${presentation.acquiredLabel} ${formatTimestamp(envelope.acquired_at)}`;
}

function renderUnavailable(availability, envelope, detail) {
  const isUnavailable = availability === "unavailable";
  const title = isUnavailable
    ? "Engine ledger snapshot is unavailable"
    : "Engine ledger availability is unknown";
  const explanation = isUnavailable
    ? "The allowlisted observe command exited 2 because its durable database is unavailable. This is an expected empty-root or first-run result."
    : "The substrate read did not produce a validated schema_version 1 snapshot.";

  const panel = element(
    "section",
    {
      className: `unavailable unavailable--${availability}`,
      attrs: { "data-runtime-state": availability },
    },
    [
      element("div", { className: "unavailable__mark", text: isUnavailable ? "N/A" : "?" }),
      element("p", {
        className: "eyebrow",
        text: isUnavailable ? "Snapshot unavailable" : "Known-unknown read state",
      }),
      element("h2", { text: title }),
      element("p", { className: "unavailable__copy", text: explanation }),
      element("p", {
        className: "unavailable__guardrail",
        text: "No queue, delivery, or dead-letter counts are shown. Unavailable is not zero.",
      }),
      detail
        ? element("p", { className: "unavailable__detail", text: detail })
        : document.createTextNode(""),
      panelFooter(envelope),
    ],
  );

  content.replaceChildren(panel);
  connectionStatus.className = `connection-pill connection-pill--${
    isUnavailable ? "offline" : "unknown"
  }`;
  connectionStatus.textContent = isUnavailable ? "Unavailable" : "Unknown";
  lastRead.textContent = envelope.acquired_at
    ? `Last attempted ${formatTimestamp(envelope.acquired_at)}`
    : "Waiting for a validated local read";
}

function unknownEnvelope() {
  return {
    artifact: ARTIFACT_FALLBACK,
    acquired_at: null,
    snapshot_age_ms: null,
    availability: "unknown",
    observation_mode: "indeterminate",
    ledger: null,
    error: null,
  };
}

async function poll() {
  try {
    const envelope = await readEngineLedger();
    if (envelope.availability === "available") {
      renderAvailable(envelope);
    } else {
      renderUnavailable(envelope.availability, envelope, envelope.error?.message);
    }
  } catch (error) {
    const detail = error.name === "AbortError"
      ? "The local BFF read timed out. Retrying automatically."
      : "The local BFF could not be reached or returned an invalid response. Retrying automatically.";
    renderUnavailable("unknown", unknownEnvelope(), detail);
  } finally {
    if (!stopped) timer = window.setTimeout(poll, POLL_INTERVAL_MS);
  }
}

window.addEventListener("pagehide", () => {
  stopped = true;
  if (timer !== null) window.clearTimeout(timer);
});

renderUnavailable("unknown", unknownEnvelope(), "Checking the local BFF now.");
poll();
