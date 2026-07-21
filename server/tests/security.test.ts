import assert from "node:assert/strict";
import test from "node:test";
import { parseArgs } from "../src/config.ts";
import {
  constantTimeTokenEqual,
  evaluateWriteGuards,
  normalizeActor,
  type WriteGuardInput,
} from "../src/security.ts";

function validGuard(): WriteGuardInput {
  return {
    method: "POST",
    writesEnabled: true,
    demo: false,
    sandboxRepo: "demo-owner/sandbox-repo",
    targetRepo: "demo-owner/sandbox-repo",
    expectedHost: "127.0.0.1:8472",
    host: "127.0.0.1:8472",
    expectedOrigin: "http://127.0.0.1:8472",
    origin: "http://127.0.0.1:8472",
    sessionToken: "expected-session-token",
    presentedToken: "expected-session-token",
    actor: "verified-human",
    botLogin: "loop-agent[bot]",
  };
}

test("normalizes actors in trim, lowercase, bot-suffix order", () => {
  assert.equal(normalizeActor("  Loop-Agent[bot]  "), "loop-agent");
  assert.equal(normalizeActor("Verified-Human"), "verified-human");
});

test("uses digest-backed constant-time session-token comparison", () => {
  assert.equal(constantTimeTokenEqual("same", "same"), true);
  assert.equal(constantTimeTokenEqual("short", "a-different-length-token"), false);
});

test("accepts only the complete valid write-guard set", () => {
  assert.deepEqual(evaluateWriteGuards(validGuard()), { ok: true, status: 200, code: "ok" });
});

test("denies every write guard independently", () => {
  const cases: Array<[string, Partial<WriteGuardInput>, string]> = [
    ["method", { method: "GET" }, "method_not_allowed"],
    ["launch flag", { writesEnabled: false }, "writes_disabled"],
    ["demo", { demo: true }, "writes_disabled_in_demo"],
    ["missing allowlist", { sandboxRepo: null }, "repo_not_allowlisted"],
    ["repo mismatch", { targetRepo: "demo-owner/other-repo" }, "repo_not_allowlisted"],
    ["Host", { host: "localhost:8472" }, "invalid_host"],
    ["missing Origin", { origin: undefined }, "invalid_origin"],
    ["Origin", { origin: "http://localhost:8472" }, "invalid_origin"],
    ["missing token", { presentedToken: undefined }, "invalid_session_token"],
    ["token", { presentedToken: "wrong" }, "invalid_session_token"],
    ["actor unavailable", { actor: null }, "actor_unavailable"],
    ["bot unavailable", { botLogin: null }, "actor_unavailable"],
    ["actor is bot", { actor: " LOOP-AGENT[bot] " }, "actor_is_bot"],
  ];

  for (const [name, changes, expectedCode] of cases) {
    const result = evaluateWriteGuards({ ...validGuard(), ...changes });
    assert.equal(result.ok, false, name);
    assert.equal(result.code, expectedCode, name);
  }
});

test("configuration is loopback-only and read-only by default", () => {
  const config = parseArgs([]);
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.enableWrites, false);
  assert.equal(config.demo, false);
  assert.equal(config.sandboxRepo, null);
});

test("write configuration requires one sandbox repo and rejects demo writes", () => {
  assert.throws(() => parseArgs(["--enable-writes"]), /requires exactly one/);
  assert.throws(
    () =>
      parseArgs([
        "--enable-writes",
        "--sandbox-repo",
        "demo-owner/sandbox-repo",
        "--bot-login",
        "loop-agent",
        "--demo",
      ]),
    /cannot be enabled in demo mode/,
  );
  assert.throws(
    () => parseArgs(["--sandbox-repo", "one/repo", "--sandbox-repo", "two/repo"]),
    /only once/,
  );
});
