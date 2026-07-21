import type { FileRunner } from "./types.ts";

const ACTOR_LIMITS = Object.freeze({ timeoutMs: 5_000, maxOutputBytes: 4_096 });
const READ_LIMITS = Object.freeze({ timeoutMs: 8_000, maxOutputBytes: 1024 * 1024 });
const WRITE_LIMITS = Object.freeze({ timeoutMs: 10_000, maxOutputBytes: 65_536 });

// Every authority-bearing connection has pageInfo. A single bounded request avoids
// treating the convenient but completeness-opaque `gh issue/pr list --json comments`
// expansion as a complete comment history.
const REPOSITORY_PROJECTION_QUERY = `
query FkstConsoleProjection($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    issues(first: 100, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}) {
      pageInfo { hasNextPage }
      nodes {
        number title url updatedAt
        labels(first: 100) { pageInfo { hasNextPage } nodes { name } }
        comments(first: 100) {
          pageInfo { hasNextPage }
          nodes { body createdAt author { login } }
        }
      }
    }
    pullRequests(first: 100, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}) {
      pageInfo { hasNextPage }
      nodes {
        number title url updatedAt state headRefName headRefOid
        author { login }
        labels(first: 100) { pageInfo { hasNextPage } nodes { name } }
        comments(first: 100) {
          pageInfo { hasNextPage }
          nodes { body createdAt author { login } }
        }
      }
    }
  }
  rateLimit { cost remaining resetAt }
}`.trim();

export function buildActorArgv(): readonly string[] {
  return ["api", "user", "--jq", ".login"];
}

export function buildCreateIssueArgv(
  repo: string,
  title: string,
  body: string,
): readonly string[] {
  return [
    "issue",
    "create",
    "--repo",
    repo,
    "--title",
    title,
    "--body",
    body,
    "--label",
    "fkst-dev:enabled",
  ];
}

export function buildRepositoryReadArgv(repo: string): readonly string[] {
  const separator = repo.indexOf("/");
  const owner = repo.slice(0, separator);
  const name = repo.slice(separator + 1);
  return [
    "api",
    "graphql",
    "-f",
    `query=${REPOSITORY_PROJECTION_QUERY}`,
    "-F",
    `owner=${owner}`,
    "-F",
    `name=${name}`,
  ];
}

export class GhAdapter {
  private readonly runner: FileRunner;
  private readonly binary: string;

  constructor(runner: FileRunner, binary: string) {
    this.runner = runner;
    this.binary = binary;
  }

  async resolveActor(): Promise<string> {
    const { stdout } = await this.runner.run(this.binary, buildActorArgv(), ACTOR_LIMITS);
    const actor = stdout.trim();
    if (actor === "" || actor.length > 100 || actor.includes("\n") || actor.includes("\r")) {
      throw new Error("gh returned an invalid actor");
    }
    return actor;
  }

  async readRepositoryProjection(repo: string): Promise<unknown> {
    const { stdout } = await this.runner.run(
      this.binary,
      buildRepositoryReadArgv(repo),
      READ_LIMITS,
    );
    return JSON.parse(stdout) as unknown;
  }

  async createEnabledIssue(repo: string, title: string, body: string): Promise<string> {
    const { stdout } = await this.runner.run(
      this.binary,
      buildCreateIssueArgv(repo, title, body),
      WRITE_LIMITS,
    );
    const issueUrl = stdout.trim();
    let parsed: URL;
    try {
      parsed = new URL(issueUrl);
    } catch {
      throw new Error("gh returned an invalid issue URL");
    }
    const expectedPrefix = `/${repo}/issues/`;
    const issueNumber = parsed.pathname.slice(expectedPrefix.length);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "github.com" ||
      !parsed.pathname.startsWith(expectedPrefix) ||
      !/^[1-9]\d*$/u.test(issueNumber) ||
      parsed.search !== "" ||
      parsed.hash !== ""
    ) {
      throw new Error("gh returned an issue URL outside the sandbox repository");
    }
    return issueUrl;
  }
}
