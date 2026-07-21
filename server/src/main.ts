import { pathToFileURL } from "node:url";
import { parseArgs } from "./config.ts";
import { NativeFileRunner } from "./exec-file.ts";
import { GhAdapter } from "./gh-adapter.ts";
import { createBffServer } from "./http-server.ts";
import { createSnapshotProvider } from "./snapshot.ts";

export async function start(argv: readonly string[]): Promise<void> {
  const config = parseArgs(argv);
  const runner = new NativeFileRunner();
  const gh = new GhAdapter(runner, config.ghBin);
  const snapshots = createSnapshotProvider(config, runner, gh);
  const bff = createBffServer({ config, snapshots, gh });

  bff.server.on("error", (error) => {
    console.error(`FKST local BFF failed: ${error.message}`);
    process.exitCode = 1;
  });
  bff.server.listen(config.port, config.host, () => {
    const mode = config.demo ? "recorded demo" : "local";
    const posture = config.enableWrites ? "guarded write-enabled" : "read-only";
    console.log(`FKST local BFF (${mode}, ${posture}) listening on http://${config.host}:${config.port}`);
  });

  let stopping = false;
  const stop = async (signal: string): Promise<void> => {
    if (stopping) return;
    stopping = true;
    try {
      await bff.close();
    } catch {
      console.error(`FKST local BFF could not stop cleanly after ${signal}`);
      process.exitCode = 1;
    }
  };
  process.once("SIGINT", () => void stop("SIGINT"));
  process.once("SIGTERM", () => void stop("SIGTERM"));
}

const isDirectExecution = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (isDirectExecution) {
  start(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FKST local BFF configuration error: ${message}`);
    process.exitCode = 1;
  });
}
