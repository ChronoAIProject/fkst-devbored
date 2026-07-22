import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CommandExecutionError } from "./exec-file.ts";
import {
  acquireObserveRuntime,
  classifyMissingDurableState,
  defaultPathProbe,
  MISSING_DURABLE_REASONS,
  unconfiguredRuntime,
  type PathProbe,
} from "./observe.ts";
import { GhAdapter } from "./gh-adapter.ts";
import {
  acquireGithubProjection,
  type GithubReadAdapter,
} from "./github-read.ts";
import type { ServerConfig } from "./config.ts";
import type { FileRunner, JsonValue, SnapshotProvider, SnapshotV1 } from "./types.ts";

const FIXTURE_PATH = fileURLToPath(
  new URL("../../demo/fixtures/snapshot.v1.json", import.meta.url),
);
const HEALTH_LIMITS = Object.freeze({ timeoutMs: 5_000, maxOutputBytes: 128 * 1024 });

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateSnapshotFixture(value: unknown): SnapshotV1 {
  if (!isRecord(value) || value.schema !== "fkst.console.snapshot.v1") {
    throw new Error("demo fixture has an unsupported schema");
  }
  if (!isRecord(value.capture) || typeof value.capture.captured_at !== "string") {
    throw new Error("demo fixture is missing capture metadata");
  }
  if (!isRecord(value.provenance)) {
    throw new Error("demo fixture is missing provenance metadata");
  }
  if (!isRecord(value.data) || value.data.mode !== "demo") {
    throw new Error("demo fixture must identify demo mode");
  }
  return value as unknown as SnapshotV1;
}

export class FixtureSnapshotProvider implements SnapshotProvider {
  private fixture: Promise<SnapshotV1> | null = null;

  getSnapshot(): Promise<SnapshotV1> {
    this.fixture ??= readFile(FIXTURE_PATH, "utf8").then((source) =>
      validateSnapshotFixture(JSON.parse(source) as unknown),
    );
    return this.fixture;
  }
}

function unknownSingleton(artifact: string, reason: string): JsonValue {
  return {
    availability: "unavailable",
    artifact,
    snapshot_age_ms: null,
    value: null,
    reason,
  };
}

function unconfiguredHealth(): JsonValue {
  return {
    availability: "unavailable",
    artifact: "scripts/run.sh health stdout",
    verdict: null,
    raw: null,
    reason: "health_not_configured",
  };
}

export interface HealthProbeContext {
  durableRoot?: string | null;
  pathExists?: PathProbe;
}

// The pinned public devloop's board renderer reports a failed engine read with
// exactly this stderr shape (scripts/board.py `fetch_observe` wrapping the
// engine's startup error). Only this validated signature, combined with a
// read-only probe confirming the durable state is actually absent, may narrow
// a health failure to a durable-state reason. The matched raw stderr is never
// projected; only the signature name is.
const DEVLOOP_OBSERVE_FAILURE_SIGNATURE =
  /^error: fkst-framework observe --json failed;[^\n]*open existing durable delivery database/mu;
const DEVLOOP_OBSERVE_FAILURE_SIGNATURE_NAME = "public_devloop_observe_read_failed";

export async function acquireHealth(
  runner: FileRunner,
  script: string | null,
  context: HealthProbeContext = {},
): Promise<JsonValue> {
  if (script === null) return unconfiguredHealth();
  try {
    const result = await runner.run(script, ["health"], HEALTH_LIMITS);
    const firstLine = result.stdout.split(/\r?\n/u, 1)[0] ?? "";
    if (firstLine !== "HEALTHY" && !/^\d+ ANOMALIES NEEDING ATTENTION$/u.test(firstLine)) {
      return {
        availability: "unknown",
        artifact: "scripts/run.sh health stdout",
        verdict: null,
        raw: result.stdout,
        reason: "unrecognized_health_verdict",
      };
    }
    return {
      availability: "available",
      artifact: "scripts/run.sh health stdout",
      verdict: firstLine,
      raw: result.stdout,
      exit_code_semantics: "zero does not distinguish healthy from anomaly verdicts",
    };
  } catch (error) {
    const exitCode = error instanceof CommandExecutionError ? error.exitCode : null;
    const signatureMatched =
      error instanceof CommandExecutionError &&
      DEVLOOP_OBSERVE_FAILURE_SIGNATURE.test(error.stderrExcerpt);
    const durableRoot = context.durableRoot ?? null;
    if (durableRoot !== null && exitCode === 1 && signatureMatched) {
      const reason = await classifyMissingDurableState(
        durableRoot,
        context.pathExists ?? defaultPathProbe,
      );
      if (reason !== null && MISSING_DURABLE_REASONS.has(reason)) {
        return {
          availability: "unavailable",
          artifact: "scripts/run.sh health stdout",
          verdict: null,
          raw: null,
          reason,
          exit_code: exitCode,
          failure_signature: DEVLOOP_OBSERVE_FAILURE_SIGNATURE_NAME,
        };
      }
    }
    return {
      availability: "unknown",
      artifact: "scripts/run.sh health stdout",
      verdict: null,
      raw: null,
      reason: "health_command_failed",
      exit_code: exitCode,
      failure_signature: signatureMatched ? DEVLOOP_OBSERVE_FAILURE_SIGNATURE_NAME : null,
    };
  }
}

export class LocalSnapshotProvider implements SnapshotProvider {
  private readonly config: ServerConfig;
  private readonly runner: FileRunner;
  private readonly clock: () => Date;
  private readonly github: GithubReadAdapter;

  constructor(
    config: ServerConfig,
    runner: FileRunner,
    clock: () => Date = () => new Date(),
    github: GithubReadAdapter = new GhAdapter(runner, config.ghBin),
  ) {
    this.config = config;
    this.runner = runner;
    this.clock = clock;
    this.github = github;
  }

  async getSnapshot(): Promise<SnapshotV1> {
    const capturedAt = this.clock();
    const [runtime, health, github] = await Promise.all([
      this.config.observe === null
        ? Promise.resolve(unconfiguredRuntime())
        : acquireObserveRuntime(this.runner, this.config.observe, () => capturedAt.getTime()),
      acquireHealth(this.runner, this.config.healthScript, {
        durableRoot: this.config.observe?.durableRoot ?? null,
      }),
      acquireGithubProjection(this.github, this.config.sandboxRepo, this.config.botLogin),
    ]);

    return {
      schema: "fkst.console.snapshot.v1",
      capture: {
        kind: "local-disposable-projection",
        captured_at: capturedAt.toISOString(),
        timezone: "UTC",
      },
      provenance: {
        mode: "local",
        authority: {
          business_state: "trusted GitHub markers when configured",
          delivery_state: "fkst.delivery.observe.v1 current snapshot only",
          health: "verbatim health output when configured",
        },
        historical_timeline_available: false,
      },
      data: {
        mode: "local",
        posture: this.config.enableWrites ? "write-requested" : "read-only",
        issues: github.issues,
        pull_requests: github.pullRequests,
        markers: github.markers,
        council: unknownSingleton("Council evidence projection", "council_source_not_configured"),
        runtime,
        health,
      },
    };
  }
}

export function createSnapshotProvider(
  config: ServerConfig,
  runner: FileRunner,
  github: GithubReadAdapter = new GhAdapter(runner, config.ghBin),
): SnapshotProvider {
  return config.demo
    ? new FixtureSnapshotProvider()
    : new LocalSnapshotProvider(config, runner, () => new Date(), github);
}
