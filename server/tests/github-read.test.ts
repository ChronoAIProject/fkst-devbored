import assert from "node:assert/strict";
import test from "node:test";
import {
  acquireGithubProjection,
  type GithubReadAdapter,
} from "../src/github-read.ts";

function connection(nodes: unknown[], hasNextPage = false): Record<string, unknown> {
  return { nodes, pageInfo: { hasNextPage } };
}

function payload(
  issues: unknown[],
  pullRequests: unknown[],
  options: { issuesPartial?: boolean; pullRequestsPartial?: boolean } = {},
): Record<string, unknown> {
  return {
    data: {
      repository: {
        issues: connection(issues, options.issuesPartial),
        pullRequests: connection(pullRequests, options.pullRequestsPartial),
      },
    },
  };
}

const expectedProposal = "github-devloop/issue/demo-owner/sandbox-repo/42";
const trustedEarlier =
  `<!-- fkst:github-devloop:state:v1 proposal="${expectedProposal}" state="fixing" version="demo/2026-07-21T10-00-00Z" stage_rank="700" -->`;
const trustedLater =
  `<!-- fkst:github-devloop:state:v1 proposal="${expectedProposal}" state="reviewing" version="demo/2026-07-21T11-00-00Z" stage_rank="675" -->`;
const reviewProposal =
  "github-devloop/pr-review/demo-owner-sandbox-repo-2415501633/17/demo-2026-07-21T11-00-00Z/1111111111111111111111111111111111111111";
const reviewDedup = `consensus:${reviewProposal}/review`;
const reviewMarker =
  `<!-- fkst:github-devloop:review-result:v1 proposal="${reviewProposal}" issue_proposal="${expectedProposal}" decision="approve" dedup="${reviewDedup}" -->`;
const mergeMarker =
  `<!-- fkst:github-devloop:merge-ready:v1 proposal="${expectedProposal}" pr="17" version="demo/2026-07-21T11-00-00Z" review_proposal="${reviewProposal}" review_dedup="${reviewDedup}" head_sha="1111111111111111111111111111111111111111" -->`;

function enabledIssue(): Record<string, unknown> {
  return {
    number: 42,
    title: "Enabled issue",
    url: "https://example.invalid/issues/42",
    updatedAt: "2026-07-21T11:00:01Z",
    labels: connection([{ name: "fkst-dev:enabled" }, { name: "fkst-dev:reviewing" }]),
    comments: connection([
      {
        author: { login: "loop-agent[bot]" },
        body: trustedEarlier,
        createdAt: "2026-07-21T10:00:01Z",
      },
      {
        author: { login: "loop-agent" },
        body: trustedLater,
        createdAt: "2026-07-21T11:00:01Z",
      },
      {
        author: { login: "loop-agent" },
        body: '<!-- fkst:github-devloop:state:v1 proposal="github-devloop/issue/another/repo/42" state="merged" version="demo/2026-07-21T13-00-00Z" stage_rank="900" -->',
        createdAt: "2026-07-21T13:00:01Z",
      },
      {
        author: { login: "forger" },
        body: `<!-- fkst:github-devloop:state:v1 proposal="${expectedProposal}" state="merged" version="demo/2026-07-21T14-00-00Z" stage_rank="900" -->`,
        createdAt: "2026-07-21T14:00:01Z",
      },
    ]),
  };
}

function botPullRequest(commentsPartial = false): Record<string, unknown> {
  return {
    number: 17,
    title: "Bot PR",
    url: "https://example.invalid/pulls/17",
    updatedAt: "2026-07-21T11:00:01Z",
    state: "OPEN",
    headRefName: "demo-head",
    headRefOid: "1111111111111111111111111111111111111111",
    author: { login: "loop-agent[bot]" },
    labels: connection([]),
    comments: connection([
      {
        author: { login: "loop-agent" },
        body: reviewMarker,
        createdAt: "2026-07-21T11:00:02Z",
      },
      {
        author: { login: "loop-agent[bot]" },
        body: mergeMarker,
        createdAt: "2026-07-21T11:00:03Z",
      },
      {
        author: { login: "forger" },
        body: `<!-- fkst:github-devloop:state:v1 proposal="${expectedProposal}" state="merged" version="forged" stage_rank="900" -->`,
        createdAt: "2026-07-21T11:00:04Z",
      },
    ], commentsPartial),
  };
}

test("projects proposal-bound issues and a correlated merge gate after the trust gate", async () => {
  const calls: string[] = [];
  const adapter: GithubReadAdapter = {
    async readRepositoryProjection(repo): Promise<unknown> {
      calls.push(repo);
      return payload(
        [
          enabledIssue(),
          {
            number: 99,
            title: "Not enabled",
            url: "https://example.invalid/issues/99",
            updatedAt: "2026-07-21T11:00:01Z",
            labels: connection([{ name: "fkst-dev:merged" }]),
            comments: connection([]),
          },
        ],
        [
          botPullRequest(),
          {
            number: 18,
            title: "Human PR is outside bot lane",
            url: "https://example.invalid/pulls/18",
            updatedAt: "2026-07-21T11:00:01Z",
            state: "OPEN",
            headRefName: "human-head",
            headRefOid: "2222222222222222222222222222222222222222",
            author: { login: "verified-human" },
            labels: connection([]),
            comments: connection([]),
          },
        ],
      );
    },
  };

  const projection = await acquireGithubProjection(
    adapter,
    "demo-owner/sandbox-repo",
    "loop-agent",
  );
  assert.deepEqual(calls, ["demo-owner/sandbox-repo"]);

  const issues = projection.issues as Record<string, unknown>;
  const issueItems = issues.items as Array<Record<string, unknown>>;
  assert.equal(issues.count, 1);
  assert.equal(issues.partial, false);
  assert.equal(issueItems[0]?.expected_proposal, expectedProposal);
  assert.equal((issueItems[0]?.state as Record<string, unknown>).name, "reviewing");
  assert.deepEqual(issueItems[0]?.label_hint, {
    expected: "fkst-dev:reviewing",
    matches: true,
  });
  const issueEvidence = issueItems[0]?.evidence as Array<Record<string, unknown>>;
  assert.equal(issueEvidence.length, 2, "wrong-proposal and forged state facts are excluded");
  assert.ok(issueEvidence.every((fact) => fact.trusted === true));
  assert.ok(issueEvidence.every((fact) => !Object.hasOwn(fact, "body")));

  const prs = projection.pullRequests as Record<string, unknown>;
  const prItems = prs.items as Array<Record<string, unknown>>;
  assert.equal(prs.count, 1);
  assert.equal(prs.partial, false);
  assert.equal(prItems[0]?.raw_state, "OPEN");
  assert.equal(prItems[0]?.state, "OPEN");
  assert.equal(prItems[0]?.lane, "gate");
  assert.equal(prItems[0]?.merge_ready, true);
  assert.equal((prItems[0]?.review_result_markers as unknown[]).length, 1);
  assert.equal((prItems[0]?.merge_ready_markers as unknown[]).length, 1);
  assert.equal((prItems[0]?.correlated_merge_ready_markers as unknown[]).length, 1);
  assert.equal((prItems[0]?.state_markers as unknown[]).length, 2);
  const prEvidence = prItems[0]?.evidence as Array<Record<string, unknown>>;
  assert.equal(prEvidence.length, 4);
  assert.ok(prEvidence.every((fact) => fact.trusted === true));
  assert.ok(prEvidence.every((fact) => !Object.hasOwn(fact, "body")));

  const markers = projection.markers as Record<string, unknown>;
  assert.deepEqual(markers.trusted_authors, ["loop-agent"]);
  assert.equal(
    (markers.projected as Record<string, unknown>).ignored_untrusted_comment_count,
    2,
  );
});

test("null and malformed top-level issue nodes force entity partial before filtering", async () => {
  const malformedUnmanagedIssue = {
    ...enabledIssue(),
    number: "42",
    title: null,
    labels: connection([{ name: "not-enabled" }]),
  };
  const adapter: GithubReadAdapter = {
    async readRepositoryProjection(): Promise<unknown> {
      return payload([null, malformedUnmanagedIssue], []);
    },
  };
  const projection = await acquireGithubProjection(
    adapter,
    "demo-owner/sandbox-repo",
    "loop-agent",
  );
  const issues = projection.issues as Record<string, unknown>;
  assert.equal(issues.availability, "available");
  assert.equal(issues.partial, true);
  assert.equal((issues.completeness as Record<string, unknown>).entities, "partial");
  assert.equal(issues.count, 0);
  assert.deepEqual(issues.items, []);
  assert.equal((projection.markers as Record<string, unknown>).partial, true);
});

test("null and malformed top-level PR nodes force entity partial before bot admission", async () => {
  const malformedHumanPullRequest = {
    ...botPullRequest(),
    title: 17,
    headRefOid: null,
    author: { login: "verified-human" },
  };
  const adapter: GithubReadAdapter = {
    async readRepositoryProjection(): Promise<unknown> {
      return payload([], [null, malformedHumanPullRequest]);
    },
  };
  const projection = await acquireGithubProjection(
    adapter,
    "demo-owner/sandbox-repo",
    "loop-agent",
  );
  const pullRequests = projection.pullRequests as Record<string, unknown>;
  assert.equal(pullRequests.availability, "available");
  assert.equal(pullRequests.partial, true);
  assert.equal(
    (pullRequests.completeness as Record<string, unknown>).entities,
    "partial",
  );
  assert.equal(pullRequests.count, 0);
  assert.deepEqual(pullRequests.items, []);
  assert.equal((projection.markers as Record<string, unknown>).partial, true);
});

test("withholds all marker authority when GraphQL reports truncated comments", async () => {
  const adapter: GithubReadAdapter = {
    async readRepositoryProjection(): Promise<unknown> {
      return payload([], [botPullRequest(true)]);
    },
  };
  const projection = await acquireGithubProjection(
    adapter,
    "demo-owner/sandbox-repo",
    "loop-agent",
  );
  const prs = projection.pullRequests as Record<string, unknown>;
  const item = (prs.items as Array<Record<string, unknown>>)[0];
  assert.equal(prs.partial, true);
  assert.deepEqual((prs.completeness as Record<string, unknown>).comments, "partial");
  assert.equal(item?.marker_authority, "withheld");
  assert.equal(item?.state, "OPEN");
  assert.equal(item?.lane, "open");
  assert.equal(item?.merge_ready, false);
  assert.deepEqual(item?.evidence, []);
  assert.equal((projection.markers as Record<string, unknown>).partial, true);
});

test("over-bound and malformed nested connections are partial and never empty-complete", async () => {
  const overBoundLabels = enabledIssue();
  overBoundLabels.labels = connection(
    Array.from({ length: 101 }, (_, index) => ({
      name: index === 0 ? "fkst-dev:enabled" : `label-${index}`,
    })),
  );
  const malformedLabels = {
    ...enabledIssue(),
    number: 43,
    url: "https://example.invalid/issues/43",
    labels: connection([{ name: "fkst-dev:enabled" }, {}]),
  };
  const overBoundComments = botPullRequest();
  overBoundComments.comments = connection(
    Array.from({ length: 101 }, (_, index) => ({
      author: null,
      body: `non-marker-${index}`,
      createdAt: "2026-07-21T11:01:00Z",
    })),
  );
  const malformedComments = {
    ...botPullRequest(),
    number: 19,
    url: "https://example.invalid/pulls/19",
    comments: connection([{}]),
  };
  const adapter: GithubReadAdapter = {
    async readRepositoryProjection(): Promise<unknown> {
      return payload(
        [overBoundLabels, malformedLabels],
        [overBoundComments, malformedComments],
      );
    },
  };
  const projection = await acquireGithubProjection(
    adapter,
    "demo-owner/sandbox-repo",
    "loop-agent",
  );
  const issues = projection.issues as Record<string, unknown>;
  assert.equal(issues.partial, true);
  assert.equal(issues.count, 0);
  assert.equal((issues.completeness as Record<string, unknown>).labels, "partial");
  const prs = projection.pullRequests as Record<string, unknown>;
  assert.equal(prs.partial, true);
  assert.equal((prs.completeness as Record<string, unknown>).comments, "partial");
  const items = prs.items as Array<Record<string, unknown>>;
  assert.equal(items.length, 2);
  assert.ok(items.every((item) => item.marker_authority === "withheld"));
  assert.ok(items.every((item) => item.merge_ready === false));
  assert.ok(items.every((item) => Array.isArray(item.evidence) && item.evidence.length === 0));
});

test("requires review correlation, PR number, and current head SHA for merge readiness", async () => {
  const wrongHead = botPullRequest();
  const comments = wrongHead.comments as {
    nodes: Array<Record<string, unknown>>;
  };
  comments.nodes[1] = {
    ...comments.nodes[1],
    body: mergeMarker.replace(
      'head_sha="1111111111111111111111111111111111111111"',
      'head_sha="2222222222222222222222222222222222222222"',
    ),
  };
  const adapter: GithubReadAdapter = {
    async readRepositoryProjection(): Promise<unknown> {
      return payload([enabledIssue()], [wrongHead]);
    },
  };
  const projection = await acquireGithubProjection(
    adapter,
    "demo-owner/sandbox-repo",
    "loop-agent",
  );
  const item = ((projection.pullRequests as Record<string, unknown>).items as Array<Record<string, unknown>>)[0];
  assert.equal(item?.merge_ready, false);
  assert.equal(item?.lane, "review", "the current-head approval remains review evidence");
  assert.deepEqual(item?.correlated_merge_ready_markers, []);
});

test("GitHub read errors remain unknown with null counts", async () => {
  const adapter: GithubReadAdapter = {
    async readRepositoryProjection(): Promise<never> {
      throw new Error("rate limited");
    },
  };
  const projection = await acquireGithubProjection(adapter, "demo-owner/sandbox-repo", "loop-agent");
  assert.deepEqual(projection.issues, {
    availability: "unknown",
    artifact: "GitHub open issue projection",
    snapshot_age_ms: null,
    count: null,
    items: null,
    reason: "github_issue_read_failed",
  });
  assert.equal((projection.pullRequests as Record<string, unknown>).count, null);
  assert.equal((projection.markers as Record<string, unknown>).availability, "unknown");
});

test("missing repo or trusted bot performs no GitHub read and never reports zero", async () => {
  const adapter: GithubReadAdapter = {
    async readRepositoryProjection(): Promise<never> {
      throw new Error("must not execute");
    },
  };
  const withoutRepo = await acquireGithubProjection(adapter, null, "loop-agent");
  assert.equal((withoutRepo.issues as Record<string, unknown>).availability, "unavailable");
  assert.equal((withoutRepo.issues as Record<string, unknown>).count, null);
  const withoutBot = await acquireGithubProjection(adapter, "demo-owner/sandbox-repo", null);
  assert.equal((withoutBot.markers as Record<string, unknown>).availability, "unavailable");
  assert.equal((withoutBot.pullRequests as Record<string, unknown>).count, null);
});
