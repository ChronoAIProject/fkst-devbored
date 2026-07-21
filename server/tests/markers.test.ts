import assert from "node:assert/strict";
import test from "node:test";
import {
  expectedStateLabel,
  projectEnabledIssue,
  projectTrustedMarkers,
  selectAuthoritativeState,
  stateStageRank,
  type MarkerComment,
} from "../src/markers.ts";

const trustedState =
  '<!-- fkst:github-devloop:state:v1 proposal="demo/issue/42" state="ready" version="v1" stage_rank="500" -->';

test("trust gate runs before marker scanning and blocks forged business state", () => {
  let untrustedBodyRead = false;
  const forged = {
    author_login: "forger",
    get body(): string {
      untrustedBodyRead = true;
      throw new Error("untrusted bodies must not be scanned");
    },
  } satisfies MarkerComment;
  const comments: MarkerComment[] = [
    forged,
    {
      author: { login: "LOOP-AGENT[bot]" },
      createdAt: "2026-07-21T00:00:00Z",
      body: `trusted prose\n${trustedState}`,
    },
  ];

  const projection = projectTrustedMarkers(comments, [" loop-agent "]);
  assert.equal(untrustedBodyRead, false);
  assert.equal(projection.ignored_untrusted_comment_count, 1);
  assert.equal(projection.state.length, 1);
  assert.equal(projection.state[0]?.state, "ready");
});

test("parses exactly state, review-result, and merge-ready v1 markers", () => {
  const body = [
    trustedState,
    '<!-- fkst:github-devloop:review-result:v1 proposal="review/1" issue_proposal="demo/issue/42" decision="approve" dedup="review-dedup" -->',
    '<!-- fkst:github-devloop:merge-ready:v1 proposal="demo/issue/42" pr="17" version="v1" review_proposal="review/1" review_dedup="review-dedup" head_sha="abcdef1234" -->',
    '<!-- fkst:github-devloop:result:v1 proposal="demo/issue/42" decision="approve" -->',
  ].join("\n");
  const projection = projectTrustedMarkers([{ author_login: "loop-agent", body }], ["loop-agent"]);
  assert.equal(projection.state.length, 1);
  assert.equal(projection.review_result.length, 1);
  assert.equal(projection.merge_ready.length, 1);
  assert.equal(projection.merge_ready[0]?.head_sha, "abcdef1234");
});

test("reject review markers require the reader-side fix round and safe gap", () => {
  const incomplete =
    '<!-- fkst:github-devloop:review-result:v1 proposal="review/1" issue_proposal="issue/1" decision="reject" dedup="d1" gap="fix this" -->';
  const valid =
    '<!-- fkst:github-devloop:review-result:v1 proposal="review/2" issue_proposal="issue/1" decision="reject" dedup="d2" fix_round="2" gap="bounded gap" -->';
  const projection = projectTrustedMarkers(
    [{ author_login: "loop-agent", body: `${incomplete}\n${valid}` }],
    ["loop-agent"],
  );
  assert.equal(projection.review_result.length, 1);
  assert.equal(projection.review_result[0]?.fix_round, 2);
});

test("uses state stage rank and treats both state-label collisions as hints", () => {
  assert.equal(stateStageRank("awaiting-pr"), 625);
  assert.equal(stateStageRank("pr-open"), 650);
  assert.equal(expectedStateLabel("dependency_wait"), expectedStateLabel("ready"));
  assert.equal(expectedStateLabel("closed-unmerged"), expectedStateLabel("blocked"));
});

test("enabled is a hard admission gate before marker projection", () => {
  const comments = [{ author_login: "loop-agent", body: trustedState }];
  assert.equal(projectEnabledIssue(["fkst-dev:ready"], comments, ["loop-agent"]), null);
  assert.equal(
    projectEnabledIssue(["fkst-dev:enabled", "fkst-dev:ready"], comments, ["loop-agent"])?.state
      .length,
    1,
  );
});

test("equal-order conflicting state facts withhold authority instead of taking first", () => {
  const projection = projectTrustedMarkers(
    [
      {
        author_login: "loop-agent",
        body: [
          '<!-- fkst:github-devloop:state:v1 proposal="github-devloop/issue/o/r/1" state="reviewing" version="same-version" stage_rank="700" -->',
          '<!-- fkst:github-devloop:state:v1 proposal="github-devloop/issue/o/r/1" state="fixing" version="same-version" stage_rank="700" -->',
        ].join("\n"),
      },
    ],
    ["loop-agent"],
  );
  assert.equal(selectAuthoritativeState(projection.state), null);
  const opaqueProjection = projectTrustedMarkers(
    [
      {
        author_login: "loop-agent",
        body: [
          '<!-- fkst:github-devloop:state:v1 proposal="github-devloop/issue/o/r/1" state="reviewing" version="opaque-a" stage_rank="675" -->',
          '<!-- fkst:github-devloop:state:v1 proposal="github-devloop/issue/o/r/1" state="merged" version="opaque-b" stage_rank="900" -->',
        ].join("\n"),
      },
    ],
    ["loop-agent"],
  );
  assert.equal(selectAuthoritativeState(opaqueProjection.state), null);

  const numericProjection = projectTrustedMarkers(
    [
      {
        author_login: "loop-agent",
        body: [
          '<!-- fkst:github-devloop:state:v1 proposal="github-devloop/issue/o/r/1" state="merged" version="ready/github-devloop/issue/o/r/1/2026-07-21T11-00-00Z/loop/2" stage_rank="900" -->',
          '<!-- fkst:github-devloop:state:v1 proposal="github-devloop/issue/o/r/1" state="reviewing" version="ready/github-devloop/issue/o/r/1/2026-07-21T11-00-00Z/loop/10" stage_rank="675" -->',
        ].join("\n"),
      },
    ],
    ["loop-agent"],
  );
  assert.equal(selectAuthoritativeState(numericProjection.state)?.state, "reviewing");

  const chainProjection = projectTrustedMarkers(
    [
      {
        author_login: "loop-agent",
        body: [
          '<!-- fkst:github-devloop:state:v1 proposal="github-devloop/issue/o/r/1" state="merged" version="ready/github-devloop/issue/o/r/1/2026-07-21T11-00-00Z/loop/10/fix/2" stage_rank="900" -->',
          '<!-- fkst:github-devloop:state:v1 proposal="github-devloop/issue/o/r/1" state="fixing" version="ready/github-devloop/issue/o/r/1/2026-07-21T11-00-00Z/loop/10/fix/11" stage_rank="700" -->',
        ].join("\n"),
      },
    ],
    ["loop-agent"],
  );
  assert.equal(selectAuthoritativeState(chainProjection.state)?.state, "fixing");
});
