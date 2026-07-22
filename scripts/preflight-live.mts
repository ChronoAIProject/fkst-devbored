// Deterministic live-read preflight. Reuses the reviewed server adapters verbatim
// (gh actor + bounded GraphQL read, `fkst-framework observe` with the fixed argv,
// bounded `health`) and reports PASS / FAIL / UNKNOWN / UNAVAILABLE per integration
// without a GitHub mutation, engine start, or durable-root initialization.
// A configured external health script may retain its documented build/cache
// side effects. Configuration comes only from the documented
// FKST_* environment variables. The default/configured gh binary is checked for
// read-only authentication; repository, observe, and health reads require their
// explicit source configuration.
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import process from "node:process";

import { isSandboxRepo } from "../server/src/config.ts";
import { CommandExecutionError, NativeFileRunner } from "../server/src/exec-file.ts";
import { GhAdapter } from "../server/src/gh-adapter.ts";
import { acquireGithubProjection } from "../server/src/github-read.ts";
import { acquireObserveRuntime } from "../server/src/observe.ts";
import { normalizeActor } from "../server/src/security.ts";
import { acquireHealth } from "../server/src/snapshot.ts";
import type { FileRunner } from "../server/src/types.ts";

type Status = "PASS" | "FAIL" | "UNKNOWN" | "UNAVAILABLE";

interface Step {
  id: string;
  status: Status;
  reason: string | null;
  evidence: Record<string, unknown>;
}

interface Check {
  integration: "github" | "observe" | "health";
  status: Status;
  reason: string | null;
  steps: Step[];
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function envValue(name: string): string | null {
  const value = process.env[name]?.trim();
  return value === undefined || value === "" ? null : value;
}

function step(id: string, status: Status, reason: string | null, evidence: Record<string, unknown> = {}): Step {
  return { id, status, reason, evidence };
}

async function binaryReachable(candidate: string): Promise<boolean> {
  if (!candidate.includes("/") && !candidate.includes("\\")) return true;
  try {
    await access(candidate, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function checkGithub(runner: FileRunner): Promise<Check> {
  const ghBin = envValue("FKST_GH_BIN") ?? "gh";
  const repo = envValue("FKST_SANDBOX_REPO");
  const botLogin = envValue("FKST_BOT_LOGIN");
  const steps: Step[] = [];
  const done = (status: Status, reason: string | null): Check =>
    ({ integration: "github", status, reason, steps });

  if (repo !== null && !isSandboxRepo(repo)) {
    steps.push(step("sandbox_repo_config", "FAIL", "sandbox_repo_malformed", { repo }));
    return done("FAIL", "sandbox_repo_malformed");
  }
  if (botLogin !== null && normalizeActor(botLogin) === "") {
    steps.push(step("bot_login_config", "FAIL", "bot_login_malformed", {}));
    return done("FAIL", "bot_login_malformed");
  }

  const adapter = new GhAdapter(runner, ghBin);
  try {
    const actor = await adapter.resolveActor();
    steps.push(step("gh_actor_read", "PASS", null, { actor }));
  } catch (error) {
    if (error instanceof CommandExecutionError && error.exitCode === null && !error.timedOut) {
      steps.push(step("gh_actor_read", "UNAVAILABLE", "gh_binary_unavailable", {}));
      return done("UNAVAILABLE", "gh_binary_unavailable");
    }
    const evidence = error instanceof CommandExecutionError
      ? { exit_code: error.exitCode, timed_out: error.timedOut }
      : { error: error instanceof Error ? error.message : "unknown" };
    steps.push(step("gh_actor_read", "FAIL", "gh_actor_read_failed", evidence));
    return done("FAIL", "gh_actor_read_failed");
  }

  if (repo === null) {
    steps.push(step("sandbox_repo_config", "UNAVAILABLE", "sandbox_repo_not_configured", {}));
    return done("UNAVAILABLE", "sandbox_repo_not_configured");
  }
  steps.push(step("sandbox_repo_config", "PASS", null, { repo }));
  if (botLogin === null) {
    steps.push(step("bot_login_config", "UNAVAILABLE", "trusted_bot_not_configured", {}));
    return done("UNAVAILABLE", "trusted_bot_not_configured");
  }
  steps.push(step("bot_login_config", "PASS", null, {}));

  const projection = await acquireGithubProjection(adapter, repo, botLogin);
  const issues = isRecord(projection.issues) ? projection.issues : {};
  const pullRequests = isRecord(projection.pullRequests) ? projection.pullRequests : {};
  if (issues.availability === "available" && pullRequests.availability === "available") {
    steps.push(step("repository_projection_read", "PASS", null, {
      issue_count: issues.count ?? null,
      pull_request_count: pullRequests.count ?? null,
      issues_partial: issues.partial ?? null,
      pull_requests_partial: pullRequests.partial ?? null,
    }));
    return done("PASS", null);
  }
  steps.push(step("repository_projection_read", "FAIL", "github_projection_read_failed", {
    issues_reason: issues.reason ?? null,
    pull_requests_reason: pullRequests.reason ?? null,
  }));
  return done("FAIL", "github_projection_read_failed");
}

async function checkObserve(runner: FileRunner): Promise<Check> {
  const binary = envValue("FKST_OBSERVE_BIN");
  const durableRoot = envValue("FKST_DURABLE_ROOT");
  const steps: Step[] = [];
  const done = (status: Status, reason: string | null): Check =>
    ({ integration: "observe", status, reason, steps });

  if (binary === null && durableRoot === null) {
    steps.push(step("observe_config", "UNAVAILABLE", "observe_not_configured", {}));
    return done("UNAVAILABLE", "observe_not_configured");
  }
  if (binary === null || durableRoot === null) {
    steps.push(step("observe_config", "FAIL", "observe_pair_incomplete", {
      note: "FKST_OBSERVE_BIN and FKST_DURABLE_ROOT must be supplied together",
    }));
    return done("FAIL", "observe_pair_incomplete");
  }
  steps.push(step("observe_config", "PASS", null, {}));
  if (!(await binaryReachable(binary))) {
    steps.push(step("observe_binary", "UNAVAILABLE", "observe_binary_unavailable", {}));
    return done("UNAVAILABLE", "observe_binary_unavailable");
  }

  const runtime = await acquireObserveRuntime(runner, { binary, durableRoot });
  const projected = isRecord(runtime) ? runtime : {};
  if (projected.availability === "available") {
    steps.push(step("observe_snapshot_read", "PASS", null, {
      observation_mode: projected.observation_mode ?? null,
      queue_count: Array.isArray(projected.queues) ? projected.queues.length : null,
    }));
    return done("PASS", null);
  }
  const reason = typeof projected.reason === "string" ? projected.reason : "observe_failed";
  const status: Status = reason === "durable_root_missing" || reason === "observe_database_missing"
    ? "UNAVAILABLE"
    : reason === "observe_invalid_json" ||
        reason === "durable_root_invalid" ||
        reason === "observe_database_invalid"
      ? "FAIL"
      : "UNKNOWN";
  steps.push(step("observe_snapshot_read", status, reason, {}));
  return done(status, reason);
}

async function checkHealth(runner: FileRunner): Promise<Check> {
  const script = envValue("FKST_HEALTH_SCRIPT");
  const steps: Step[] = [];
  const done = (status: Status, reason: string | null): Check =>
    ({ integration: "health", status, reason, steps });

  if (script === null) {
    steps.push(step("health_config", "UNAVAILABLE", "health_not_configured", {}));
    return done("UNAVAILABLE", "health_not_configured");
  }
  steps.push(step("health_config", "PASS", null, {}));
  if (!(await binaryReachable(script))) {
    steps.push(step("health_script", "UNAVAILABLE", "health_script_unavailable", {}));
    return done("UNAVAILABLE", "health_script_unavailable");
  }

  const health = await acquireHealth(runner, script, {
    durableRoot: envValue("FKST_DURABLE_ROOT"),
  });
  const projected = isRecord(health) ? health : {};
  if (projected.availability === "available") {
    steps.push(step("health_verdict_read", "PASS", null, { verdict: projected.verdict ?? null }));
    return done("PASS", null);
  }
  const reason = typeof projected.reason === "string" ? projected.reason : "health_command_failed";
  const status: Status = reason === "unrecognized_health_verdict"
    ? "FAIL"
    : reason === "durable_root_missing" || reason === "observe_database_missing"
      ? "UNAVAILABLE"
      : "UNKNOWN";
  const firstLine = typeof projected.raw === "string"
    ? projected.raw.split(/\r?\n/u, 1)[0] ?? null
    : null;
  steps.push(step("health_verdict_read", status, reason, {
    first_output_line: firstLine,
    exit_code: projected.exit_code ?? null,
    failure_signature: projected.failure_signature ?? null,
  }));
  return done(status, reason);
}

const jsonOnly = process.argv.slice(2).includes("--json");
const runner = new NativeFileRunner();
const checks: Check[] = [
  await checkGithub(runner),
  await checkObserve(runner),
  await checkHealth(runner),
];

const counts = { PASS: 0, FAIL: 0, UNKNOWN: 0, UNAVAILABLE: 0 };
for (const check of checks) counts[check.status] += 1;
const report = {
  schema: "fkst.console.live-preflight.v1",
  generated_at: new Date().toISOString(),
  posture: "read-only",
  checks,
  summary: {
    counts,
    live_read_possible: counts.PASS > 0,
    all_integrations_ready: counts.PASS === checks.length,
  },
};

if (jsonOnly) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  for (const check of checks) {
    const reason = check.reason === null ? "" : ` (${check.reason})`;
    process.stdout.write(`[${check.status}] ${check.integration}${reason}\n`);
    for (const entry of check.steps) {
      const stepReason = entry.reason === null ? "" : ` (${entry.reason})`;
      process.stdout.write(`  - ${entry.id}: ${entry.status}${stepReason}\n`);
    }
  }
  process.stdout.write(
    `live read possible: ${report.summary.live_read_possible ? "yes" : "no"}\n`,
  );
  process.stdout.write(`LIVE_PREFLIGHT_JSON=${JSON.stringify(report)}\n`);
}
process.exitCode = counts.FAIL > 0 ? 1 : 0;
