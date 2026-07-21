import type { GhAdapter } from "./gh-adapter.ts";
import {
  normalizeActor,
} from "./security.ts";
import {
  projectEnabledIssue,
  projectTrustedMarkers,
  selectAuthoritativeState,
  stateLabelHint,
  type MarkerComment,
  type MarkerProjection,
  type MergeReadyMarkerFact,
  type ReviewResultMarkerFact,
  type StateMarkerFact,
} from "./markers.ts";
import type { JsonValue } from "./types.ts";

const MAX_ENTITIES = 100;
const MAX_NESTED_NODES = 100;

type UnknownRecord = Record<string, unknown>;

export interface GithubReadAdapter {
  readRepositoryProjection(repo: string): Promise<unknown>;
}

export interface GithubProjection {
  issues: JsonValue;
  pullRequests: JsonValue;
  markers: JsonValue;
}

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value: unknown, maximumBytes: number): string | null {
  return typeof value === "string" && Buffer.byteLength(value, "utf8") <= maximumBytes
    ? value
    : null;
}

function requiredBoundedString(value: unknown, maximumBytes: number): string | null {
  const result = boundedString(value, maximumBytes);
  return result === null || result === "" ? null : result;
}

function positiveInteger(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) > 0 ? (value as number) : null;
}

interface GraphqlConnection {
  nodes: unknown[];
  hasNextPage: boolean;
}

interface IssueEntity {
  record: UnknownRecord;
  number: number;
  title: string;
  url: string;
  updatedAt: string;
}

interface PullRequestEntity extends IssueEntity {
  authorLogin: string | null;
  state: string;
  headRefName: string;
  headSha: string;
}

function issueEntity(value: unknown): IssueEntity | null {
  if (!isRecord(value)) return null;
  const number = positiveInteger(value.number);
  const title = requiredBoundedString(value.title, 500);
  const url = requiredBoundedString(value.url, 2_048);
  const updatedAt = requiredBoundedString(value.updatedAt, 100);
  if (number === null || title === null || url === null || updatedAt === null) return null;
  return { record: value, number, title, url, updatedAt };
}

function pullRequestEntity(value: unknown): PullRequestEntity | null {
  const issueFields = issueEntity(value);
  if (issueFields === null) return null;
  const { record } = issueFields;
  const state = requiredBoundedString(record.state, 50);
  const headRefName = requiredBoundedString(record.headRefName, 500);
  const headSha = requiredBoundedString(record.headRefOid, 100);
  if (state === null || headRefName === null || headSha === null) return null;

  let authorLogin: string | null;
  if (record.author === null) {
    authorLogin = null;
  } else if (isRecord(record.author)) {
    authorLogin = requiredBoundedString(record.author.login, 100);
    if (authorLogin === null) return null;
  } else {
    return null;
  }
  return { ...issueFields, authorLogin, state, headRefName, headSha };
}

function graphqlConnection(value: unknown, maximumNodes: number): GraphqlConnection | null {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !isRecord(value.pageInfo)) return null;
  if (typeof value.pageInfo.hasNextPage !== "boolean") return null;
  if (value.nodes.length > maximumNodes) return null;
  return { nodes: value.nodes, hasNextPage: value.pageInfo.hasNextPage };
}

function repositoryConnections(payload: unknown): {
  issues: GraphqlConnection;
  pullRequests: GraphqlConnection;
} {
  if (!isRecord(payload)) throw new Error("invalid GitHub GraphQL response");
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error("GitHub GraphQL returned errors");
  }
  const data = isRecord(payload.data) ? payload.data : null;
  const repository = data !== null && isRecord(data.repository) ? data.repository : null;
  const issues = repository === null ? null : graphqlConnection(repository.issues, MAX_ENTITIES);
  const pullRequests = repository === null
    ? null
    : graphqlConnection(repository.pullRequests, MAX_ENTITIES);
  if (issues === null || pullRequests === null) {
    throw new Error("GitHub GraphQL response omitted bounded connections");
  }
  return { issues, pullRequests };
}

function labelNames(value: readonly unknown[]): string[] | null {
  const labels: string[] = [];
  for (const candidate of value) {
    const name = isRecord(candidate) ? boundedString(candidate.name, 100) : null;
    if (name === null) return null;
    labels.push(name);
  }
  return labels;
}

function markerComments(value: readonly unknown[]): MarkerComment[] | null {
  const comments: MarkerComment[] = [];
  for (const candidate of value) {
    if (!isRecord(candidate)) return null;
    const body = boundedString(candidate.body, 256 * 1024);
    const createdAt = boundedString(candidate.createdAt ?? candidate.created_at, 100);
    if (body === null || createdAt === null) return null;
    const authorValue = candidate.author;
    const author = isRecord(authorValue) ? boundedString(authorValue.login, 100) : null;
    if (authorValue !== null && author === null) return null;
    comments.push({
      ...(author === null ? {} : { author: { login: author } }),
      body,
      created_at: createdAt,
    });
  }
  return comments;
}

function markerCounts(projection: MarkerProjection): {
  state: number;
  review_result: number;
  merge_ready: number;
  ignored_untrusted_comments: number;
} {
  return {
    state: projection.state.length,
    review_result: projection.review_result.length,
    merge_ready: projection.merge_ready.length,
    ignored_untrusted_comments: projection.ignored_untrusted_comment_count,
  };
}

function emptyMarkerProjection(): MarkerProjection {
  return {
    state: [],
    review_result: [],
    merge_ready: [],
    trusted_comment_count: 0,
    ignored_untrusted_comment_count: 0,
  };
}

function issueBoundProjection(
  projection: MarkerProjection,
  expectedProposal: string,
): MarkerProjection {
  return {
    ...projection,
    state: projection.state.filter((fact) => fact.proposal === expectedProposal),
    review_result: projection.review_result.filter(
      (fact) => fact.issue_proposal === expectedProposal,
    ),
    merge_ready: projection.merge_ready.filter(
      (fact) => fact.proposal === expectedProposal,
    ),
  };
}

function trustedFacts(projection: MarkerProjection): {
  stateMarkers: JsonValue[];
  reviewResultMarkers: JsonValue[];
  mergeReadyMarkers: JsonValue[];
  evidence: JsonValue[];
} {
  const stateMarkers = projection.state.map((fact) => ({ ...fact, trusted: true })) as JsonValue[];
  const reviewResultMarkers = projection.review_result.map((fact) => ({
    ...fact,
    trusted: true,
  })) as JsonValue[];
  const mergeReadyMarkers = projection.merge_ready.map((fact) => ({
    ...fact,
    trusted: true,
  })) as JsonValue[];
  return {
    stateMarkers,
    reviewResultMarkers,
    mergeReadyMarkers,
    evidence: [...stateMarkers, ...reviewResultMarkers, ...mergeReadyMarkers],
  };
}

type PullRequestLane = "open" | "review" | "gate" | "held" | "merged";

interface IssueAuthority {
  projection: MarkerProjection;
  state: StateMarkerFact | null;
}

function decimalChecksum(value: string): string {
  let hash = 2_166_136_261n;
  for (const byte of Buffer.from(value, "utf8")) {
    hash = (hash * 16_777_619n + BigInt(byte)) % 4_294_967_291n;
  }
  return hash.toString().padStart(10, "0");
}

function sanitizeKey(value: string): string {
  const sanitized = value
    .replaceAll(/[^A-Za-z0-9_.\-/#]/gu, "-")
    .replaceAll(/\/+/gu, "/")
    .replaceAll(/^\/+|\/+$/gu, "");
  const segments = sanitized.split("/").map((segment) =>
    segment === "." || segment === ".." ? "-" : segment,
  );
  return segments.join("/") || "empty";
}

function safeVersionSegment(version: string): string {
  let safe = sanitizeKey(version)
    .replaceAll(/[\/#]/gu, "-")
    .replaceAll(/-+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "");
  if (safe === "") safe = "version";
  if (safe.length > 40) {
    const suffix = `-${decimalChecksum(version)}`;
    safe = `${safe.slice(0, 40 - suffix.length).replaceAll(/-+$/gu, "")}${suffix}`;
  }
  return safe || "version";
}

function safeReviewRepoSegment(repo: string): string {
  let safe = sanitizeKey(repo).slice(0, 100).replaceAll(/\/+$/gu, "")
    .replaceAll("/", "-")
    .replaceAll(/-+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "");
  if (safe === "") safe = "repo";
  const suffix = `-${decimalChecksum(repo)}`;
  if (safe.length > 48 || !safe.endsWith(suffix)) {
    safe = `${safe.slice(0, 48 - suffix.length).replaceAll(/-+$/gu, "")}${suffix}`;
  }
  return safe;
}

function stripTrailingFix(version: string): string {
  return version.replace(/(?:\/fix\/\d+|-fix-\d+)$/u, "");
}

function versionFixRound(version: string): number {
  let highest = 0;
  for (const match of version.matchAll(/(?:\/fix\/|-fix-)(\d+)/gu)) {
    const round = Number(match[1] ?? "0");
    if (Number.isSafeInteger(round) && round > highest) highest = round;
  }
  return highest;
}

function parseReviewProposal(value: string): {
  repo: string;
  pr: number;
  version: string;
  headSha: string;
} | null {
  const prefix = "github-devloop/pr-review/";
  if (!value.startsWith(prefix)) return null;
  const parts = value.slice(prefix.length).split("/");
  if (parts.length !== 4) return null;
  const [repo, prText, version, headSha] = parts;
  const pr = Number(prText);
  if (
    repo === undefined || repo === "" ||
    !Number.isSafeInteger(pr) || pr < 1 ||
    version === undefined || version === "" ||
    headSha === undefined || !/^[0-9a-fA-F]{1,64}$/u.test(headSha)
  ) return null;
  return { repo, pr, version, headSha };
}

function canonicalReviewDedup(dedup: string, reviewProposal: string): string | null {
  const canonical = `consensus:${reviewProposal}/review`;
  if (dedup === canonical || new RegExp(`^${escapeRegExp(canonical)}/loop/\\d+$`, "u").test(dedup)) {
    return canonical;
  }
  const redrive = new RegExp(
    `^consensus:${escapeRegExp(reviewProposal)}/r/[ms]/[1-9]\\d*/attempt/[1-9]\\d*(?:/loop/\\d+)?$`,
    "u",
  );
  return redrive.test(dedup) ? canonical : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function reviewBinding(
  fact: ReviewResultMarkerFact,
  issueAuthorities: ReadonlyMap<string, IssueAuthority>,
  repo: string,
  pullRequestNumber: number,
  headSha: string,
): { fact: ReviewResultMarkerFact; canonicalDedup: string } | null {
  const issue = issueAuthorities.get(fact.issue_proposal);
  const issueVersion = issue?.state?.version;
  const review = parseReviewProposal(fact.proposal);
  const canonicalDedup = canonicalReviewDedup(fact.dedup, fact.proposal);
  if (
    issueVersion === null || issueVersion === undefined ||
    review === null ||
    review.repo !== safeReviewRepoSegment(repo) ||
    review.pr !== pullRequestNumber ||
    review.version !== safeVersionSegment(stripTrailingFix(issueVersion)) ||
    review.headSha !== headSha ||
    canonicalDedup === null ||
    (fact.decision === "reject" && fact.fix_round !== versionFixRound(issueVersion))
  ) return null;
  return { fact, canonicalDedup };
}

function correlatedMergeReady(
  projection: MarkerProjection,
  issueAuthorities: ReadonlyMap<string, IssueAuthority>,
  repo: string,
  pullRequestNumber: number,
  headSha: string,
): {
  reviews: ReviewResultMarkerFact[];
  merges: MergeReadyMarkerFact[];
} {
  const reviews = projection.review_result.flatMap((fact) => {
    const binding = reviewBinding(
      fact,
      issueAuthorities,
      repo,
      pullRequestNumber,
      headSha,
    );
    return binding === null ? [] : [binding];
  });
  const merges = projection.merge_ready.filter((mergeFact) => {
    const issueVersion = issueAuthorities.get(mergeFact.proposal)?.state?.version;
    const review = parseReviewProposal(mergeFact.review_proposal);
    const canonicalMergeDedup = canonicalReviewDedup(
      mergeFact.review_dedup,
      mergeFact.review_proposal,
    );
    return issueVersion !== null && issueVersion !== undefined &&
      mergeFact.version === issueVersion &&
      mergeFact.pr === pullRequestNumber &&
      mergeFact.head_sha === headSha &&
      review !== null &&
      review.repo === safeReviewRepoSegment(repo) &&
      review.pr === pullRequestNumber &&
      review.version === safeVersionSegment(issueVersion) &&
      review.headSha === headSha &&
      canonicalMergeDedup !== null &&
      reviews.some(
        (candidate) =>
          candidate.fact.decision === "approve" &&
          candidate.fact.issue_proposal === mergeFact.proposal &&
          candidate.fact.proposal === mergeFact.review_proposal &&
          candidate.canonicalDedup === canonicalMergeDedup,
      );
  });
  return { reviews: reviews.map((binding) => binding.fact), merges };
}

function lifecycleLane(state: string): PullRequestLane | null {
  switch (state) {
    case "reviewing":
    case "review-meta":
      return "review";
    case "merge-ready":
    case "merging":
      return "gate";
    case "fixing":
    case "blocked":
    case "closed-unmerged":
    case "impl-failed":
    case "declined":
      return "held";
    case "merged":
      return "merged";
    case "thinking":
    case "dependency_wait":
    case "ready":
    case "implementing":
    case "awaiting-pr":
    case "pr-open":
      return "open";
    default:
      return null;
  }
}

function latestReviewDecision(
  reviews: readonly ReviewResultMarkerFact[],
): ReviewResultMarkerFact | null {
  return [...reviews].sort((left, right) =>
    (left.comment_created_at ?? "").localeCompare(right.comment_created_at ?? ""),
  ).at(-1) ?? null;
}

function pullRequestLane(
  state: StateMarkerFact | null,
  reviews: readonly ReviewResultMarkerFact[],
  mergeReady: boolean,
  rawState: string,
): PullRequestLane {
  if (mergeReady) return "gate";
  const stateLane = state === null ? null : lifecycleLane(state.state);
  if (stateLane !== null) return stateLane;
  const latestReview = latestReviewDecision(reviews);
  if (latestReview?.decision === "reject") return "held";
  if (latestReview?.decision === "approve") return "review";
  const normalizedRawState = rawState.toLowerCase();
  if (normalizedRawState === "merged") return "merged";
  if (normalizedRawState === "closed") return "held";
  return "open";
}

function unavailableCollection(artifact: string, reason: string): JsonValue {
  return {
    availability: "unknown",
    artifact,
    snapshot_age_ms: null,
    count: null,
    items: null,
    reason,
  };
}

function unconfiguredCollection(artifact: string, reason: string): JsonValue {
  return {
    availability: "unavailable",
    artifact,
    snapshot_age_ms: null,
    count: null,
    items: null,
    reason,
  };
}

function parseIssueProjection(
  connection: GraphqlConnection,
  botLogin: string,
  repo: string,
): {
  collection: JsonValue;
  projections: MarkerProjection[];
  authorities: Map<string, IssueAuthority>;
  partial: boolean;
} {
  const items: JsonValue[] = [];
  const projections: MarkerProjection[] = [];
  const authorities = new Map<string, IssueAuthority>();
  let entitiesDamaged = false;
  let labelsTruncated = false;
  let commentsTruncated = false;
  for (const candidate of connection.nodes) {
    const entity = issueEntity(candidate);
    if (entity === null) {
      entitiesDamaged = true;
      continue;
    }
    const labelsConnection = graphqlConnection(entity.record.labels, MAX_NESTED_NODES);
    const commentsConnection = graphqlConnection(entity.record.comments, MAX_NESTED_NODES);
    const labels = labelsConnection === null ? null : labelNames(labelsConnection.nodes);
    const comments = commentsConnection === null ? null : markerComments(commentsConnection.nodes);
    if (labelsConnection === null || labels === null) {
      labelsTruncated = true;
      continue;
    }
    labelsTruncated ||= labelsConnection.hasNextPage;
    commentsTruncated ||=
      commentsConnection === null || commentsConnection.hasNextPage || comments === null;
    if (!labels.includes("fkst-dev:enabled")) continue;

    const expectedProposal = `github-devloop/issue/${repo}/${entity.number}`;
    const commentsComplete =
      commentsConnection !== null && !commentsConnection.hasNextPage && comments !== null;
    const parsedProjection = commentsComplete
      ? projectEnabledIssue(labels, comments, [botLogin])
      : emptyMarkerProjection();
    const markerProjection = issueBoundProjection(
      parsedProjection ?? emptyMarkerProjection(),
      expectedProposal,
    );

    const state = selectAuthoritativeState(markerProjection.state);
    authorities.set(expectedProposal, { projection: markerProjection, state });
    const facts = trustedFacts(markerProjection);
    projections.push(markerProjection);
    items.push({
      number: entity.number,
      title: entity.title,
      url: entity.url,
      updated_at: entity.updatedAt,
      labels,
      admitted: true,
      expected_proposal: expectedProposal,
      marker_authority: commentsComplete ? "complete" : "withheld",
      marker_authority_reason: commentsComplete ? null : "github_comments_truncated",
      state:
        state === null
          ? null
          : {
              name: state.state,
              stage_rank: state.stage_rank,
              version: state.version,
              proposal: state.proposal,
              comment_created_at: state.comment_created_at,
            },
      label_hint: state === null ? null : stateLabelHint(labels, state.state),
      marker_counts: markerCounts(markerProjection),
      state_markers: facts.stateMarkers,
      review_result_markers: facts.reviewResultMarkers,
      merge_ready_markers: facts.mergeReadyMarkers,
      evidence: facts.evidence,
    });
  }
  const entitiesPartial = connection.hasNextPage || entitiesDamaged;
  const partial = entitiesPartial || labelsTruncated || commentsTruncated;
  return {
    collection: {
      availability: "available",
      artifact: "GitHub open issue projection",
      snapshot_age_ms: 0,
      partial,
      completeness: {
        entities: entitiesPartial ? "partial" : "complete",
        labels: labelsTruncated ? "partial" : "complete",
        comments: commentsTruncated ? "partial" : "complete",
      },
      truncation: {
        entities: connection.hasNextPage,
        labels: labelsTruncated,
        comments: commentsTruncated,
      },
      history_scope: "open issues and at most the first 100 comments per returned issue",
      count: items.length,
      items,
    },
    projections,
    authorities,
    partial,
  };
}

function parsePullRequestProjection(
  connection: GraphqlConnection,
  botLogin: string,
  repo: string,
  issueAuthorities: ReadonlyMap<string, IssueAuthority>,
): {
  collection: JsonValue;
  projections: MarkerProjection[];
  partial: boolean;
} {
  const normalizedBot = normalizeActor(botLogin);
  const items: JsonValue[] = [];
  const projections: MarkerProjection[] = [];
  let entitiesDamaged = false;
  let labelsTruncated = false;
  let commentsTruncated = false;
  for (const candidate of connection.nodes) {
    const entity = pullRequestEntity(candidate);
    if (entity === null) {
      entitiesDamaged = true;
      continue;
    }
    const labelsConnection = graphqlConnection(entity.record.labels, MAX_NESTED_NODES);
    const commentsConnection = graphqlConnection(entity.record.comments, MAX_NESTED_NODES);
    const labels = labelsConnection === null ? null : labelNames(labelsConnection.nodes);
    const comments = commentsConnection === null ? null : markerComments(commentsConnection.nodes);
    labelsTruncated ||= labelsConnection === null || labelsConnection.hasNextPage || labels === null;
    commentsTruncated ||=
      commentsConnection === null || commentsConnection.hasNextPage || comments === null;
    if (
      entity.authorLogin === null ||
      normalizeActor(entity.authorLogin) !== normalizedBot
    ) continue;

    const commentsComplete =
      commentsConnection !== null && !commentsConnection.hasNextPage && comments !== null;
    const projection = commentsComplete
      ? projectTrustedMarkers(comments, [botLogin])
      : emptyMarkerProjection();
    const correlated = correlatedMergeReady(
      projection,
      issueAuthorities,
      repo,
      entity.number,
      entity.headSha,
    );
    const linkedProposals = new Set([
      ...correlated.reviews.map((fact) => fact.issue_proposal),
      ...correlated.merges.map((fact) => fact.proposal),
    ]);
    const linkedProposal = linkedProposals.size === 1 ? [...linkedProposals][0] ?? null : null;
    const linkedAuthority = linkedProposal === null
      ? null
      : issueAuthorities.get(linkedProposal) ?? null;
    const authoritativeState = linkedAuthority?.state ?? null;
    const displayProjection: MarkerProjection = {
      ...projection,
      state: linkedAuthority?.projection.state ?? [],
    };
    const facts = trustedFacts(displayProjection);
    const mergeReady = correlated.merges.length > 0;
    const lane = pullRequestLane(
      authoritativeState,
      correlated.reviews,
      mergeReady,
      entity.state,
    );
    projections.push(projection);
    items.push({
      number: entity.number,
      title: entity.title,
      url: entity.url,
      updated_at: entity.updatedAt,
      state: entity.state,
      raw_state: entity.state,
      business_state:
        authoritativeState === null
          ? null
          : {
              name: authoritativeState.state,
              stage_rank: authoritativeState.stage_rank,
              version: authoritativeState.version,
              proposal: authoritativeState.proposal,
              comment_created_at: authoritativeState.comment_created_at,
            },
      lane,
      marker_authority: commentsComplete ? "complete" : "withheld",
      marker_authority_reason: commentsComplete ? null : "github_comments_truncated",
      head_ref: entity.headRefName,
      head_sha: entity.headSha,
      author: {
        login: entity.authorLogin,
        normalized: normalizeActor(entity.authorLogin),
      },
      labels: labels ?? [],
      marker_counts: markerCounts(projection),
      merge_ready: mergeReady,
      correlated_review_result_markers: correlated.reviews.map((fact) => ({
        ...fact,
        trusted: true,
      })),
      correlated_merge_ready_markers: correlated.merges.map((fact) => ({
        ...fact,
        trusted: true,
      })),
      state_markers: facts.stateMarkers,
      review_result_markers: facts.reviewResultMarkers,
      merge_ready_markers: facts.mergeReadyMarkers,
      evidence: facts.evidence,
    });
  }
  const entitiesPartial = connection.hasNextPage || entitiesDamaged;
  const partial = entitiesPartial || labelsTruncated || commentsTruncated;
  return {
    collection: {
      availability: "available",
      artifact: "GitHub open pull-request projection",
      snapshot_age_ms: 0,
      partial,
      completeness: {
        entities: entitiesPartial ? "partial" : "complete",
        labels: labelsTruncated ? "partial" : "complete",
        comments: commentsTruncated ? "partial" : "complete",
      },
      truncation: {
        entities: connection.hasNextPage,
        labels: labelsTruncated,
        comments: commentsTruncated,
      },
      history_scope: "open pull requests and at most the first 100 comments per returned PR",
      count: items.length,
      items,
    },
    projections,
    partial,
  };
}

function aggregateMarkers(
  botLogin: string,
  issueProjections: readonly MarkerProjection[],
  pullRequestProjections: readonly MarkerProjection[],
  partial: boolean,
): JsonValue {
  const all = [...issueProjections, ...pullRequestProjections];
  return {
    availability: "available",
    artifact: "trusted github-devloop comment-marker projection",
    trusted_authors: [normalizeActor(botLogin)],
    partial,
    projected: {
      state_count: all.reduce((total, projection) => total + projection.state.length, 0),
      review_result_count: all.reduce(
        (total, projection) => total + projection.review_result.length,
        0,
      ),
      merge_ready_count: all.reduce(
        (total, projection) => total + projection.merge_ready.length,
        0,
      ),
      ignored_untrusted_comment_count: all.reduce(
        (total, projection) => total + projection.ignored_untrusted_comment_count,
        0,
      ),
    },
  };
}

export async function acquireGithubProjection(
  adapter: GithubReadAdapter,
  repo: string | null,
  botLogin: string | null,
): Promise<GithubProjection> {
  if (repo === null) {
    return {
      issues: unconfiguredCollection("GitHub open issue projection", "sandbox_repo_not_configured"),
      pullRequests: unconfiguredCollection(
        "GitHub open pull-request projection",
        "sandbox_repo_not_configured",
      ),
      markers: unconfiguredCollection(
        "trusted github-devloop comment-marker projection",
        "sandbox_repo_not_configured",
      ),
    };
  }
  if (botLogin === null || normalizeActor(botLogin) === "") {
    return {
      issues: unconfiguredCollection("GitHub open issue projection", "trusted_bot_not_configured"),
      pullRequests: unconfiguredCollection(
        "GitHub open pull-request projection",
        "trusted_bot_not_configured",
      ),
      markers: unconfiguredCollection(
        "trusted github-devloop comment-marker projection",
        "trusted_bot_not_configured",
      ),
    };
  }

  let issueProjection: ReturnType<typeof parseIssueProjection> | null = null;
  let pullRequestProjection: ReturnType<typeof parsePullRequestProjection> | null = null;
  try {
    const payload = await adapter.readRepositoryProjection(repo);
    const connections = repositoryConnections(payload);
    issueProjection = parseIssueProjection(connections.issues, botLogin, repo);
    pullRequestProjection = parsePullRequestProjection(
      connections.pullRequests,
      botLogin,
      repo,
      issueProjection.authorities,
    );
  } catch {
    // Read failure, timeout, output limit, GraphQL errors, or an incomplete shape all
    // degrade to unknown. A read-plane failure must not fail the HTTP snapshot.
  }

  const issues =
    issueProjection?.collection ??
    unavailableCollection("GitHub open issue projection", "github_issue_read_failed");
  const pullRequests =
    pullRequestProjection?.collection ??
    unavailableCollection("GitHub open pull-request projection", "github_pr_read_failed");
  if (issueProjection === null && pullRequestProjection === null) {
    return {
      issues,
      pullRequests,
      markers: unavailableCollection(
        "trusted github-devloop comment-marker projection",
        "github_reads_failed",
      ),
    };
  }
  return {
    issues,
    pullRequests,
    markers: aggregateMarkers(
      botLogin,
      issueProjection?.projections ?? [],
      pullRequestProjection?.projections ?? [],
      issueProjection === null ||
        pullRequestProjection === null ||
        issueProjection?.partial === true ||
        pullRequestProjection?.partial === true,
    ),
  };
}

export type GithubAdapterContract = Pick<
  GhAdapter,
  "readRepositoryProjection"
>;
