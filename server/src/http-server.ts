import { Buffer } from "node:buffer";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import type { ServerConfig } from "./config.ts";
import type { GhAdapter } from "./gh-adapter.ts";
import {
  evaluateWriteBoundary,
  evaluateWriteGuards,
  makeSessionToken,
  normalizeActor,
  SESSION_TOKEN_HEADER,
  type WriteGuardInput,
} from "./security.ts";
import type { SnapshotProvider, SnapshotV1 } from "./types.ts";

const MAX_REQUEST_BODY_BYTES = 16_384;
const MAX_TITLE_BYTES = 200;
const MAX_BODY_BYTES = 8_000;
const DEFAULT_MAX_SSE_CLIENTS = 8;
const DEFAULT_SSE_HEARTBEAT_MS = 15_000;

interface PublicError {
  error: { code: string; message: string };
}

interface ActorResolution {
  actor: string | null;
  normalized: string | null;
  error: string | null;
}

interface CreateIssueBody {
  title: string;
  body: string;
}

export interface BffDependencies {
  config: ServerConfig;
  snapshots: SnapshotProvider;
  gh: Pick<GhAdapter, "resolveActor" | "createEnabledIssue">;
  sessionToken?: string;
  maxSseClients?: number;
  sseHeartbeatMs?: number;
}

export interface BffServer {
  server: http.Server;
  close(): Promise<void>;
}

function setSecurityHeaders(response: ServerResponse): void {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  setSecurityHeaders(response);
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.statusCode = status;
  response.end(`${JSON.stringify(value)}\n`);
}

function publicError(code: string, message: string): PublicError {
  return { error: { code, message } };
}

function sendGuardFailure(response: ServerResponse, status: number, code: string): void {
  const messages: Record<string, string> = {
    method_not_allowed: "This resource does not accept that HTTP method.",
    writes_disabled: "Writes are disabled for this launch.",
    writes_disabled_in_demo: "Writes are unavailable in recorded demo mode.",
    repo_not_allowlisted: "The target repository is not the configured sandbox.",
    invalid_host: "The request Host does not match this loopback session.",
    invalid_origin: "The request Origin does not match this loopback session.",
    invalid_session_token: "The per-launch session token is missing or invalid.",
    actor_unavailable: "The authenticated GitHub actor could not be verified.",
    actor_is_bot: "The authenticated GitHub actor is the configured loop bot.",
  };
  sendJson(response, status, publicError(code, messages[code] ?? "The request was denied."));
}

function expectedAuthority(request: IncomingMessage, config: ServerConfig): string {
  const port = config.port === 0 ? request.socket.localPort : config.port;
  return `${config.host}:${String(port ?? "")}`;
}

function expectedOrigin(request: IncomingMessage, config: ServerConfig): string {
  return `http://${expectedAuthority(request, config)}`;
}

function routeUrl(request: IncomingMessage, config: ServerConfig): URL | null {
  try {
    return new URL(request.url ?? "", expectedOrigin(request, config));
  } catch {
    return null;
  }
}

async function readJsonBody(request: IncomingMessage): Promise<CreateIssueBody> {
  const mediaType = (request.headers["content-type"] ?? "").split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") throw Object.assign(new Error("content_type"), { status: 415 });

  const declaredLength = request.headers["content-length"];
  if (declaredLength !== undefined) {
    const parsed = Number(declaredLength);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      throw Object.assign(new Error("invalid_content_length"), { status: 400 });
    }
    if (parsed > MAX_REQUEST_BODY_BYTES) {
      request.resume();
      throw Object.assign(new Error("body_too_large"), { status: 413 });
    }
  }

  const chunks: Buffer[] = [];
  let total = 0;
  let tooLarge = false;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    total += buffer.byteLength;
    if (total > MAX_REQUEST_BODY_BYTES) {
      tooLarge = true;
    } else {
      chunks.push(buffer);
    }
  }
  if (tooLarge) throw Object.assign(new Error("body_too_large"), { status: 413 });

  let value: unknown;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw Object.assign(new Error("invalid_json"), { status: 400 });
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw Object.assign(new Error("invalid_body"), { status: 422 });
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 2 || keys[0] !== "body" || keys[1] !== "title") {
    throw Object.assign(new Error("invalid_body_fields"), { status: 422 });
  }
  if (
    typeof record.title !== "string" ||
    record.title.trim() === "" ||
    Buffer.byteLength(record.title, "utf8") > MAX_TITLE_BYTES ||
    typeof record.body !== "string" ||
    Buffer.byteLength(record.body, "utf8") > MAX_BODY_BYTES
  ) {
    throw Object.assign(new Error("invalid_body_fields"), { status: 422 });
  }
  return { title: record.title, body: record.body };
}

class ActorResolver {
  private resolution: Promise<ActorResolution> | null = null;
  private readonly config: ServerConfig;
  private readonly gh: Pick<GhAdapter, "resolveActor">;

  constructor(
    config: ServerConfig,
    gh: Pick<GhAdapter, "resolveActor">,
  ) {
    this.config = config;
    this.gh = gh;
  }

  get(): Promise<ActorResolution> {
    if (!this.config.enableWrites || this.config.demo) {
      return Promise.resolve({ actor: null, normalized: null, error: "writes_disabled" });
    }
    this.resolution ??= this.gh
      .resolveActor()
      .then((actor) => ({ actor, normalized: normalizeActor(actor), error: null }))
      .catch(() => ({ actor: null, normalized: null, error: "actor_unavailable" }));
    return this.resolution;
  }
}

class SseHub {
  private readonly responses = new Set<ServerResponse>();
  private readonly snapshots: SnapshotProvider;
  private readonly maxClients: number;
  private readonly heartbeatMs: number;

  constructor(
    snapshots: SnapshotProvider,
    maxClients: number,
    heartbeatMs: number,
  ) {
    this.snapshots = snapshots;
    this.maxClients = maxClients;
    this.heartbeatMs = heartbeatMs;
  }

  async connect(request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (this.responses.size >= this.maxClients) {
      sendJson(response, 503, publicError("sse_capacity", "The local SSE client limit was reached."));
      return;
    }
    const snapshot = await this.snapshots.getSnapshot();
    setSecurityHeaders(response);
    response.statusCode = 200;
    response.setHeader("Connection", "keep-alive");
    response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    response.setHeader("X-Accel-Buffering", "no");
    response.flushHeaders();
    this.responses.add(response);
    response.write(`retry: 5000\nevent: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);

    const heartbeat = setInterval(() => {
      if (!response.destroyed && !response.writableEnded) response.write(": heartbeat\n\n");
    }, this.heartbeatMs);
    heartbeat.unref();

    const cleanup = (): void => {
      clearInterval(heartbeat);
      this.responses.delete(response);
    };
    request.once("close", cleanup);
    response.once("close", cleanup);
  }

  close(): void {
    for (const response of this.responses) response.end();
    this.responses.clear();
  }
}

export function createBffServer(dependencies: BffDependencies): BffServer {
  const { config, snapshots, gh } = dependencies;
  const token = dependencies.sessionToken ?? makeSessionToken();
  const actors = new ActorResolver(config, gh);
  const sse = new SseHub(
    snapshots,
    dependencies.maxSseClients ?? DEFAULT_MAX_SSE_CLIENTS,
    dependencies.sseHeartbeatMs ?? DEFAULT_SSE_HEARTBEAT_MS,
  );

  async function handleIssueCreate(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    const authority = expectedAuthority(request, config);
    const guardInput: WriteGuardInput = {
      method: request.method,
      writesEnabled: config.enableWrites,
      demo: config.demo,
      sandboxRepo: config.sandboxRepo,
      targetRepo: config.sandboxRepo,
      expectedHost: authority,
      host: request.headers.host,
      expectedOrigin: `http://${authority}`,
      origin: request.headers.origin,
      sessionToken: token,
      presentedToken: request.headers[SESSION_TOKEN_HEADER] as string | undefined,
      actor: null,
      botLogin: config.botLogin,
    };
    const boundary = evaluateWriteBoundary(guardInput);
    if (!boundary.ok) {
      sendGuardFailure(response, boundary.status, boundary.code);
      return;
    }

    let body: CreateIssueBody;
    try {
      body = await readJsonBody(request);
    } catch (error) {
      const status =
        error !== null && typeof error === "object" && "status" in error
          ? Number((error as { status: unknown }).status)
          : 400;
      const code = error instanceof Error ? error.message : "invalid_body";
      sendJson(response, status, publicError(code, "The issue request body was rejected."));
      return;
    }

    const actorResolution = await actors.get();
    guardInput.actor = actorResolution.actor;
    const fullGuard = evaluateWriteGuards(guardInput);
    if (!fullGuard.ok) {
      sendGuardFailure(response, fullGuard.status, fullGuard.code);
      return;
    }

    try {
      const repo = config.sandboxRepo;
      if (repo === null || actorResolution.actor === null || actorResolution.normalized === null) {
        sendGuardFailure(response, 503, "actor_unavailable");
        return;
      }
      const issueUrl = await gh.createEnabledIssue(repo, body.title, body.body);
      const issueNumber = Number(new URL(issueUrl).pathname.split("/").at(-1));
      response.setHeader("Location", issueUrl);
      sendJson(response, 201, {
        schema: "fkst.console.issue-created.v1",
        actor: {
          login: actorResolution.actor,
          normalized: actorResolution.normalized,
        },
        issue: { number: issueNumber, url: issueUrl, repo, label: "fkst-dev:enabled" },
      });
    } catch {
      sendJson(
        response,
        502,
        publicError("github_write_failed", "GitHub did not confirm issue creation."),
      );
    }
  }

  async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = routeUrl(request, config);
    if (url === null) {
      sendJson(response, 400, publicError("invalid_request_target", "The request target is invalid."));
      return;
    }

    const authority = expectedAuthority(request, config);
    if (request.headers.host !== authority) {
      sendGuardFailure(response, 403, "invalid_host");
      return;
    }
    if (url.search !== "") {
      sendJson(response, 404, publicError("not_found", "No API resource exists at this path."));
      return;
    }
    if (request.headers.origin !== undefined && request.headers.origin !== `http://${authority}`) {
      sendGuardFailure(response, 403, "invalid_origin");
      return;
    }

    const readRoutes = new Set([
      "/api/v1/snapshot",
      "/api/v1/events",
      "/api/v1/session",
      "/api/v1/health",
    ]);
    if (readRoutes.has(url.pathname) && request.method !== "GET") {
      response.setHeader("Allow", "GET");
      sendGuardFailure(response, 405, "method_not_allowed");
      return;
    }
    if (url.pathname === "/api/v1/issues" && request.method !== "POST") {
      response.setHeader("Allow", "POST");
      sendGuardFailure(response, 405, "method_not_allowed");
      return;
    }

    if (url.pathname === "/api/v1/snapshot") {
      sendJson(response, 200, await snapshots.getSnapshot());
      return;
    }
    if (url.pathname === "/api/v1/events") {
      await sse.connect(request, response);
      return;
    }
    if (url.pathname === "/api/v1/session") {
      const actor = await actors.get();
      const bot = config.botLogin === null ? null : normalizeActor(config.botLogin);
      const actorAllowed =
        actor.normalized !== null && bot !== null && actor.normalized !== "" && actor.normalized !== bot;
      sendJson(response, 200, {
        schema: "fkst.console.session.v1",
        posture: config.demo
          ? "recorded-read-only"
          : config.enableWrites && actorAllowed
            ? "write-enabled"
            : config.enableWrites
              ? "write-blocked"
              : "read-only",
        actor: actor.actor === null ? null : { login: actor.actor, normalized: actor.normalized },
        write: {
          requested: config.enableWrites,
          available: config.enableWrites && !config.demo && actorAllowed,
          sandbox_repo: config.sandboxRepo,
          reason: actor.error ?? (actorAllowed || !config.enableWrites ? null : "actor_is_bot"),
        },
        same_origin_token: { header: SESSION_TOKEN_HEADER, token },
      });
      return;
    }
    if (url.pathname === "/api/v1/health") {
      const snapshot: SnapshotV1 = await snapshots.getSnapshot();
      sendJson(response, 200, {
        schema: "fkst.console.health.v1",
        bff: { status: "ok", bind: authority, mode: config.demo ? "demo" : "local" },
        source: snapshot.data.health,
      });
      return;
    }
    if (url.pathname === "/api/v1/issues") {
      await handleIssueCreate(request, response);
      return;
    }
    sendJson(response, 404, publicError("not_found", "No API resource exists at this path."));
  }

  const server = http.createServer((request, response) => {
    handleRequest(request, response).catch(() => {
      if (!response.headersSent) {
        sendJson(response, 500, publicError("internal_error", "The local BFF request failed."));
      } else {
        response.destroy();
      }
    });
  });
  server.headersTimeout = 5_000;
  server.keepAliveTimeout = 5_000;
  server.maxConnections = 32;
  server.maxHeadersCount = 64;
  server.requestTimeout = 10_000;

  return {
    server,
    close: () =>
      new Promise((resolve, reject) => {
        sse.close();
        server.close((error) => {
          if (error !== undefined) reject(error);
          else resolve();
        });
      }),
  };
}
