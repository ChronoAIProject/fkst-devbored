import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_TOKEN_HEADER = "x-fkst-session-token" as const;

export function normalizeActor(value: string): string {
  return value.trim().toLowerCase().replace(/\[bot\]$/u, "");
}

export function makeSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function constantTimeTokenEqual(presented: string, expected: string): boolean {
  const presentedDigest = createHash("sha256").update(presented, "utf8").digest();
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(presentedDigest, expectedDigest);
}

export interface WriteGuardInput {
  method: string | undefined;
  writesEnabled: boolean;
  demo: boolean;
  sandboxRepo: string | null;
  targetRepo: string | null;
  expectedHost: string;
  host: string | undefined;
  expectedOrigin: string;
  origin: string | undefined;
  sessionToken: string;
  presentedToken: string | undefined;
  actor: string | null;
  botLogin: string | null;
}

export interface WriteGuardResult {
  ok: boolean;
  status: number;
  code: string;
}

function denied(status: number, code: string): WriteGuardResult {
  return { ok: false, status, code };
}

export function evaluateWriteBoundary(input: WriteGuardInput): WriteGuardResult {
  if (input.method !== "POST") return denied(405, "method_not_allowed");
  if (!input.writesEnabled) return denied(403, "writes_disabled");
  if (input.demo) return denied(403, "writes_disabled_in_demo");
  if (
    input.sandboxRepo === null ||
    input.targetRepo === null ||
    input.targetRepo !== input.sandboxRepo
  ) {
    return denied(403, "repo_not_allowlisted");
  }
  if (input.host !== input.expectedHost) return denied(403, "invalid_host");
  if (input.origin !== input.expectedOrigin) return denied(403, "invalid_origin");
  if (
    input.presentedToken === undefined ||
    !constantTimeTokenEqual(input.presentedToken, input.sessionToken)
  ) {
    return denied(403, "invalid_session_token");
  }
  return { ok: true, status: 200, code: "ok" };
}

export function evaluateWriteGuards(input: WriteGuardInput): WriteGuardResult {
  const boundary = evaluateWriteBoundary(input);
  if (!boundary.ok) return boundary;
  if (input.actor === null) return denied(503, "actor_unavailable");

  const actor = normalizeActor(input.actor);
  const bot = input.botLogin === null ? "" : normalizeActor(input.botLogin);
  if (actor === "" || bot === "") return denied(503, "actor_unavailable");
  if (actor === bot) return denied(403, "actor_is_bot");
  return { ok: true, status: 200, code: "ok" };
}
