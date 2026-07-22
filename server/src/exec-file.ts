import { execFile } from "node:child_process";
import type { CommandLimits, CommandResult, FileRunner } from "./types.ts";

interface ExecFailureShape extends Error {
  code?: number | string;
  killed?: boolean;
  signal?: NodeJS.Signals;
}

const STDERR_EXCERPT_LIMIT = 2_048;

export class CommandExecutionError extends Error {
  readonly exitCode: number | null;
  readonly timedOut: boolean;
  readonly stderrExcerpt: string;

  constructor(exitCode: number | null, timedOut: boolean, stderrExcerpt = "") {
    super(timedOut ? "command timed out" : "command failed");
    this.name = "CommandExecutionError";
    this.exitCode = exitCode;
    this.timedOut = timedOut;
    this.stderrExcerpt = stderrExcerpt.slice(0, STDERR_EXCERPT_LIMIT);
  }
}

export class NativeFileRunner implements FileRunner {
  run(file: string, argv: readonly string[], limits: CommandLimits): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      execFile(
        file,
        [...argv],
        {
          encoding: "utf8",
          killSignal: "SIGKILL",
          maxBuffer: limits.maxOutputBytes,
          shell: false,
          timeout: limits.timeoutMs,
          windowsHide: true,
        },
        (error, stdout, stderr) => {
          if (error !== null) {
            const failure = error as ExecFailureShape;
            const exitCode = typeof failure.code === "number" ? failure.code : null;
            const timedOut = failure.killed === true && failure.signal === "SIGKILL";
            reject(
              new CommandExecutionError(
                exitCode,
                timedOut,
                typeof stderr === "string" ? stderr : "",
              ),
            );
            return;
          }
          resolve({ stdout, stderr });
        },
      );
    });
  }
}
