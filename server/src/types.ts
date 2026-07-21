export type Availability = "available" | "unavailable" | "unknown";

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface SnapshotV1 {
  schema: "fkst.console.snapshot.v1";
  capture: {
    kind: string;
    captured_at: string;
    sanitized_at?: string;
    timezone: string;
  };
  provenance: Record<string, JsonValue>;
  data: {
    mode: "demo" | "local";
    posture: string;
    issues: JsonValue;
    pull_requests: JsonValue;
    markers: JsonValue;
    council: JsonValue;
    runtime: JsonValue;
    health: JsonValue;
  };
}

export interface SnapshotProvider {
  getSnapshot(): Promise<SnapshotV1>;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
}

export interface FileRunner {
  run(file: string, argv: readonly string[], limits: CommandLimits): Promise<CommandResult>;
}

export interface CommandLimits {
  timeoutMs: number;
  maxOutputBytes: number;
}
