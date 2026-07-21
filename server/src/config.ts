import { normalizeActor } from "./security.ts";

export const LOOPBACK_HOST = "127.0.0.1" as const;

export interface ServerConfig {
  host: typeof LOOPBACK_HOST;
  port: number;
  demo: boolean;
  enableWrites: boolean;
  sandboxRepo: string | null;
  botLogin: string | null;
  ghBin: string;
  observe: { binary: string; durableRoot: string } | null;
  healthScript: string | null;
}

const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;

function requireValue(argv: readonly string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${flag} requires one value`);
  }
  return value;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("--port must be an integer from 1 through 65535");
  }
  return port;
}

export function isSandboxRepo(value: string): boolean {
  return REPO_PATTERN.test(value) && !value.includes("..") && !value.startsWith(".");
}

export function parseArgs(argv: readonly string[]): ServerConfig {
  let port = 8_472;
  let demo = false;
  let enableWrites = false;
  let sandboxRepo: string | null = null;
  let botLogin: string | null = null;
  let ghBin = "gh";
  let observeBinary: string | null = null;
  let durableRoot: string | null = null;
  let healthScript: string | null = null;
  const seen = new Set<string>();

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === undefined || !flag.startsWith("--")) {
      throw new Error(`unexpected argument: ${flag ?? ""}`);
    }
    if (seen.has(flag)) throw new Error(`${flag} may be specified only once`);
    seen.add(flag);

    switch (flag) {
      case "--demo":
        demo = true;
        break;
      case "--enable-writes":
        enableWrites = true;
        break;
      case "--port":
        port = parsePort(requireValue(argv, index, flag));
        index += 1;
        break;
      case "--sandbox-repo":
        sandboxRepo = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--bot-login":
        botLogin = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--gh-bin":
        ghBin = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--observe-bin":
        observeBinary = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--durable-root":
        durableRoot = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--health-script":
        healthScript = requireValue(argv, index, flag);
        index += 1;
        break;
      default:
        throw new Error(`unknown argument: ${flag}`);
    }
  }

  if ((observeBinary === null) !== (durableRoot === null)) {
    throw new Error("--observe-bin and --durable-root must be supplied together");
  }
  if (sandboxRepo !== null && !isSandboxRepo(sandboxRepo)) {
    throw new Error("--sandbox-repo must be exactly one owner/name repository");
  }
  if (botLogin !== null && normalizeActor(botLogin) === "") {
    throw new Error("--bot-login must normalize to a non-empty login");
  }
  if (enableWrites && demo) {
    throw new Error("writes cannot be enabled in demo mode");
  }
  if (enableWrites && (sandboxRepo === null || botLogin === null)) {
    throw new Error("--enable-writes requires exactly one --sandbox-repo and one --bot-login");
  }

  return {
    host: LOOPBACK_HOST,
    port,
    demo,
    enableWrites,
    sandboxRepo,
    botLogin,
    ghBin,
    observe:
      observeBinary === null || durableRoot === null
        ? null
        : { binary: observeBinary, durableRoot },
    healthScript,
  };
}
