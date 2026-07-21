import assert from "node:assert/strict";
import test from "node:test";
import {
  buildActorArgv,
  buildCreateIssueArgv,
  buildRepositoryReadArgv,
  GhAdapter,
} from "../src/gh-adapter.ts";
import type { CommandLimits, CommandResult, FileRunner } from "../src/types.ts";

test("constructs the gh actor lookup as fixed argv", () => {
  assert.deepEqual(buildActorArgv(), ["api", "user", "--jq", ".login"]);
});

test("constructs one fixed bounded GraphQL read with pageInfo on every connection", () => {
  const argv = buildRepositoryReadArgv("demo-owner/sandbox-repo");
  assert.deepEqual(argv.slice(0, 3), ["api", "graphql", "-f"]);
  assert.equal(argv[4], "-F");
  assert.equal(argv[5], "owner=demo-owner");
  assert.equal(argv[6], "-F");
  assert.equal(argv[7], "name=sandbox-repo");
  assert.match(argv[3] ?? "", /^query=query FkstConsoleProjection/u);
  assert.equal((argv[3]?.match(/pageInfo \{ hasNextPage \}/gu) ?? []).length, 6);
  assert.equal((argv[3]?.match(/first: 100/gu) ?? []).length, 6);
  assert.doesNotMatch(argv.join("\n"), /--method|-X|mutation/u);
});

test("keeps issue input in argv elements and fixes the enable label atomically", () => {
  const title = "$(touch should-not-run); title";
  const body = "body && gh issue close 1\n`still-data`";
  const argv = buildCreateIssueArgv("demo-owner/sandbox-repo", title, body);
  assert.deepEqual(argv, [
    "issue",
    "create",
    "--repo",
    "demo-owner/sandbox-repo",
    "--title",
    title,
    "--body",
    body,
    "--label",
    "fkst-dev:enabled",
  ]);
});

test("actor adapter passes only file plus argv to the bounded runner", async () => {
  const calls: Array<{ file: string; argv: readonly string[]; limits: CommandLimits }> = [];
  const runner: FileRunner = {
    async run(file, argv, limits): Promise<CommandResult> {
      calls.push({ file, argv, limits });
      return { stdout: "Verified-Human\n", stderr: "" };
    },
  };
  const adapter = new GhAdapter(runner, "gh");
  assert.equal(await adapter.resolveActor(), "Verified-Human");
  assert.deepEqual(calls[0]?.argv, ["api", "user", "--jq", ".login"]);
  assert.equal(calls[0]?.file, "gh");
  assert.ok((calls[0]?.limits.maxOutputBytes ?? 0) <= 4_096);
  assert.ok((calls[0]?.limits.timeoutMs ?? 0) <= 5_000);
});

test("read adapter executes only bounded fixed argv and parses JSON", async () => {
  const calls: Array<{ file: string; argv: readonly string[]; limits: CommandLimits }> = [];
  const runner: FileRunner = {
    async run(file, argv, limits): Promise<CommandResult> {
      calls.push({ file, argv, limits });
      return {
        stdout: JSON.stringify({
          data: {
            repository: {
              issues: { nodes: [], pageInfo: { hasNextPage: false } },
              pullRequests: { nodes: [], pageInfo: { hasNextPage: false } },
            },
          },
        }),
        stderr: "",
      };
    },
  };
  const adapter = new GhAdapter(runner, "gh");
  assert.deepEqual(
    await adapter.readRepositoryProjection("demo-owner/sandbox-repo"),
    {
      data: {
        repository: {
          issues: { nodes: [], pageInfo: { hasNextPage: false } },
          pullRequests: { nodes: [], pageInfo: { hasNextPage: false } },
        },
      },
    },
  );
  assert.equal(calls.length, 1);
  for (const call of calls) {
    assert.equal(call.file, "gh");
    assert.ok(call.limits.timeoutMs <= 8_000);
    assert.ok(call.limits.maxOutputBytes <= 1024 * 1024);
  }
});
