import { normalizeActor } from "./security.ts";

export const STATE_STAGE_RANK = Object.freeze({
  thinking: 100,
  dependency_wait: 500,
  ready: 500,
  implementing: 600,
  "awaiting-pr": 625,
  "pr-open": 650,
  reviewing: 675,
  "merge-ready": 690,
  merging: 695,
  fixing: 700,
  "review-meta": 710,
  "impl-failed": 750,
  declined: 800,
  blocked: 800,
  "closed-unmerged": 825,
  merged: 900,
} as const);

export type LoopState = keyof typeof STATE_STAGE_RANK;

const STATE_LABELS: Readonly<Record<LoopState, string>> = Object.freeze({
  thinking: "fkst-dev:thinking",
  dependency_wait: "fkst-dev:ready",
  ready: "fkst-dev:ready",
  implementing: "fkst-dev:implementing",
  "awaiting-pr": "fkst-dev:awaiting-pr",
  "pr-open": "fkst-dev:pr-open",
  reviewing: "fkst-dev:reviewing",
  "merge-ready": "fkst-dev:merge-ready",
  merging: "fkst-dev:merging",
  merged: "fkst-dev:merged",
  "closed-unmerged": "fkst-dev:blocked",
  fixing: "fkst-dev:fixing",
  "review-meta": "fkst-dev:review-meta",
  "impl-failed": "fkst-dev:impl-failed",
  declined: "fkst-dev:declined",
  blocked: "fkst-dev:blocked",
});
const ALL_STATE_LABELS = new Set(Object.values(STATE_LABELS));

const STATE_MARKER = /<!-- fkst:github-devloop:state:v1[^\r\n]*?-->/gu;
const REVIEW_RESULT_MARKER = /<!-- fkst:github-devloop:review-result:v1[^\r\n]*?-->/gu;
const MERGE_READY_MARKER = /<!-- fkst:github-devloop:merge-ready:v1[^\r\n]*?-->/gu;
const ATTRIBUTE = /([\w.-]+)="([^"]*)"/gu;

export interface MarkerComment {
  author_login?: string;
  author?: { login?: string };
  user?: { login?: string };
  body?: string;
  created_at?: string;
  createdAt?: string;
}

interface MarkerBase {
  comment_created_at: string | null;
}

export interface StateMarkerFact extends MarkerBase {
  schema: "state:v1";
  proposal: string;
  state: LoopState;
  version: string | null;
  stage_rank: number;
}

export interface ReviewResultMarkerFact extends MarkerBase {
  schema: "review-result:v1";
  proposal: string;
  issue_proposal: string;
  decision: "approve" | "reject";
  dedup: string;
  fix_round?: number;
  gap?: string;
}

export interface MergeReadyMarkerFact extends MarkerBase {
  schema: "merge-ready:v1";
  proposal: string;
  pr: number;
  version: string;
  review_proposal: string;
  review_dedup: string;
  head_sha: string;
}

export interface MarkerProjection {
  state: StateMarkerFact[];
  review_result: ReviewResultMarkerFact[];
  merge_ready: MergeReadyMarkerFact[];
  trusted_comment_count: number;
  ignored_untrusted_comment_count: number;
}

function attributes(marker: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const match of marker.matchAll(ATTRIBUTE)) {
    const key = match[1];
    const value = match[2];
    if (key !== undefined && value !== undefined) result.set(key, value);
  }
  return result;
}

function commentAuthor(comment: MarkerComment): string | null {
  const value = comment.author_login ?? comment.author?.login ?? comment.user?.login;
  return value === undefined ? null : normalizeActor(value);
}

function commentCreatedAt(comment: MarkerComment): string | null {
  return comment.created_at ?? comment.createdAt ?? null;
}

function isLoopState(value: string | undefined): value is LoopState {
  return value !== undefined && Object.hasOwn(STATE_STAGE_RANK, value);
}

function positiveInteger(value: string | undefined): number | null {
  if (value === undefined || !/^[1-9]\d*$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function nonNegativeInteger(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseStateMarker(marker: string, createdAt: string | null): StateMarkerFact | null {
  const attrs = attributes(marker);
  const proposal = attrs.get("proposal");
  const state = attrs.get("state");
  if (proposal === undefined || proposal === "" || !isLoopState(state)) return null;
  const explicitRank = nonNegativeInteger(attrs.get("stage_rank"));
  return {
    schema: "state:v1",
    proposal,
    state,
    version: attrs.get("version") ?? null,
    stage_rank: explicitRank ?? STATE_STAGE_RANK[state],
    comment_created_at: createdAt,
  };
}

function parseReviewResultMarker(
  marker: string,
  createdAt: string | null,
): ReviewResultMarkerFact | null {
  const attrs = attributes(marker);
  const proposal = attrs.get("proposal");
  const issueProposal = attrs.get("issue_proposal");
  const decision = attrs.get("decision");
  const dedup = attrs.get("dedup");
  if (
    proposal === undefined ||
    proposal === "" ||
    issueProposal === undefined ||
    issueProposal === "" ||
    (decision !== "approve" && decision !== "reject") ||
    dedup === undefined ||
    dedup === ""
  ) {
    return null;
  }

  const fact: ReviewResultMarkerFact = {
    schema: "review-result:v1",
    proposal,
    issue_proposal: issueProposal,
    decision,
    dedup,
    comment_created_at: createdAt,
  };
  if (decision === "reject") {
    const fixRound = positiveInteger(attrs.get("fix_round"));
    const gap = attrs.get("gap");
    if (
      fixRound === null ||
      gap === undefined ||
      gap === "" ||
      gap.length > 240 ||
      /[\u0000-\u001f\u007f<>"]/u.test(gap)
    ) {
      return null;
    }
    fact.fix_round = fixRound;
    fact.gap = gap;
  }
  return fact;
}

function parseMergeReadyMarker(
  marker: string,
  createdAt: string | null,
): MergeReadyMarkerFact | null {
  const attrs = attributes(marker);
  const proposal = attrs.get("proposal");
  const pr = positiveInteger(attrs.get("pr"));
  const version = attrs.get("version");
  const reviewProposal = attrs.get("review_proposal");
  const reviewDedup = attrs.get("review_dedup");
  const headSha = attrs.get("head_sha");
  if (
    proposal === undefined ||
    proposal === "" ||
    pr === null ||
    version === undefined ||
    version === "" ||
    reviewProposal === undefined ||
    reviewProposal === "" ||
    reviewDedup === undefined ||
    reviewDedup === "" ||
    headSha === undefined ||
    !/^[0-9a-fA-F]{1,64}$/u.test(headSha)
  ) {
    return null;
  }
  return {
    schema: "merge-ready:v1",
    proposal,
    pr,
    version,
    review_proposal: reviewProposal,
    review_dedup: reviewDedup,
    head_sha: headSha,
    comment_created_at: createdAt,
  };
}

export function projectTrustedMarkers(
  comments: readonly MarkerComment[],
  trustedAuthors: readonly string[],
): MarkerProjection {
  const trusted = new Set(trustedAuthors.map(normalizeActor).filter((value) => value !== ""));

  // This filter intentionally completes before any comment body is read.
  const trustedComments = comments.filter((comment) => {
    const author = commentAuthor(comment);
    return author !== null && trusted.has(author);
  });

  const projection: MarkerProjection = {
    state: [],
    review_result: [],
    merge_ready: [],
    trusted_comment_count: trustedComments.length,
    ignored_untrusted_comment_count: comments.length - trustedComments.length,
  };

  for (const comment of trustedComments) {
    const body = typeof comment.body === "string" ? comment.body : "";
    const createdAt = commentCreatedAt(comment);
    for (const match of body.matchAll(STATE_MARKER)) {
      const fact = parseStateMarker(match[0], createdAt);
      if (fact !== null) projection.state.push(fact);
    }
    for (const match of body.matchAll(REVIEW_RESULT_MARKER)) {
      const fact = parseReviewResultMarker(match[0], createdAt);
      if (fact !== null) projection.review_result.push(fact);
    }
    for (const match of body.matchAll(MERGE_READY_MARKER)) {
      const fact = parseMergeReadyMarker(match[0], createdAt);
      if (fact !== null) projection.merge_ready.push(fact);
    }
  }
  return projection;
}

export function isEnabledIssue(labels: readonly string[]): boolean {
  return labels.includes("fkst-dev:enabled");
}

export function expectedStateLabel(state: LoopState): string {
  return STATE_LABELS[state];
}

export function stateStageRank(state: LoopState): number {
  return STATE_STAGE_RANK[state];
}

type TransitionSuffixKind =
  | "loop"
  | "fix"
  | "reimplement"
  | "timeout"
  | "timeout_reconcile"
  | "review_meta_action"
  | "review_loop"
  | "ready_split"
  | "review_meta"
  | "review"
  | "rereview";

interface TransitionSuffix {
  kind: TransitionSuffixKind;
  n: number;
  state?: string;
}

interface ParsedTransitionVersion {
  base: string;
  suffixes: TransitionSuffix[];
}

const NUMERIC_SLASH_SUFFIXES = new Map<string, TransitionSuffixKind>([
  ["review-meta-action", "review_meta_action"],
  ["review-loop", "review_loop"],
  ["ready-split", "ready_split"],
  ["reimplement", "reimplement"],
  ["review-meta", "review_meta"],
  ["review", "review"],
  ["loop", "loop"],
  ["fix", "fix"],
]);
const STATE_NUMERIC_SLASH_SUFFIXES = new Map<string, TransitionSuffixKind>([
  ["timeout-reconcile", "timeout_reconcile"],
  ["timeout", "timeout"],
]);
const HYPHEN_SUFFIXES: ReadonlyArray<{
  name: string;
  kind: TransitionSuffixKind;
  shape: "numeric" | "state-numeric" | "n-hex";
}> = [
  { name: "review-meta-action", kind: "review_meta_action", shape: "numeric" },
  { name: "review-loop", kind: "review_loop", shape: "numeric" },
  { name: "ready-split", kind: "ready_split", shape: "numeric" },
  { name: "reimplement", kind: "reimplement", shape: "numeric" },
  { name: "timeout-reconcile", kind: "timeout_reconcile", shape: "state-numeric" },
  { name: "timeout", kind: "timeout", shape: "state-numeric" },
  { name: "rereview", kind: "rereview", shape: "n-hex" },
  { name: "review-meta", kind: "review_meta", shape: "numeric" },
  { name: "review", kind: "review", shape: "numeric" },
  { name: "loop", kind: "loop", shape: "numeric" },
  { name: "fix", kind: "fix", shape: "numeric" },
];
const TIMEOUT_ORDER_STATES = new Set([
  "thinking", "ready", "implementing", "awaiting-pr", "impl-failed", "pr-open",
  "reviewing", "review-meta", "merge-ready", "merging", "fixing", "blocked",
]);

function parsedRound(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function slashSuffixChain(parts: readonly string[], start: number): TransitionSuffix[] | null {
  const suffixes: TransitionSuffix[] = [];
  let position = start;
  while (position < parts.length) {
    const name = parts[position];
    const numericKind = name === undefined ? undefined : NUMERIC_SLASH_SUFFIXES.get(name);
    if (numericKind !== undefined) {
      const n = parsedRound(parts[position + 1]);
      if (n === null) return null;
      suffixes.push({ kind: numericKind, n });
      position += 2;
      continue;
    }
    const stateKind = name === undefined ? undefined : STATE_NUMERIC_SLASH_SUFFIXES.get(name);
    if (stateKind !== undefined) {
      const state = parts[position + 1];
      const n = parsedRound(parts[position + 2]);
      if (state === undefined || state === "" || n === null) return null;
      suffixes.push({ kind: stateKind, state, n });
      position += 3;
      continue;
    }
    if (name === "rereview") {
      const n = parsedRound(parts[position + 1]);
      const hex = parts[position + 2];
      if (n === null || hex === undefined || !/^[0-9a-fA-F]+$/u.test(hex)) return null;
      suffixes.push({ kind: "rereview", n });
      position += 3;
      continue;
    }
    return null;
  }
  return suffixes;
}

function parseSlashVersion(version: string): ParsedTransitionVersion {
  const parts = version.split("/");
  for (let position = 0; position < parts.length; position += 1) {
    const suffixes = slashSuffixChain(parts, position);
    if (suffixes !== null) return { base: parts.slice(0, position).join("/"), suffixes };
  }
  return { base: version, suffixes: [] };
}

function parseHyphenSuffix(base: string): { base: string; suffix: TransitionSuffix } | null {
  for (const spec of HYPHEN_SUFFIXES) {
    const prefix = `-${spec.name}-`;
    const position = base.lastIndexOf(prefix);
    if (position < 0) continue;
    const parts = base.slice(position + prefix.length).split("-");
    if (spec.shape === "numeric" && parts.length === 1) {
      const n = parsedRound(parts[0]);
      if (n !== null) return { base: base.slice(0, position), suffix: { kind: spec.kind, n } };
    } else if (spec.shape === "state-numeric" && parts.length >= 2) {
      const n = parsedRound(parts.at(-1));
      const state = parts.slice(0, -1).join("-");
      if (n !== null && state !== "") {
        return { base: base.slice(0, position), suffix: { kind: spec.kind, n, state } };
      }
    } else if (spec.shape === "n-hex" && parts.length === 2) {
      const n = parsedRound(parts[0]);
      if (n !== null && /^[0-9a-fA-F]+$/u.test(parts[1] ?? "")) {
        return { base: base.slice(0, position), suffix: { kind: spec.kind, n } };
      }
    }
  }
  return null;
}

function parseTransitionVersion(version: string): ParsedTransitionVersion {
  const parsed = parseSlashVersion(version);
  const hyphenSuffixes: TransitionSuffix[] = [];
  while (true) {
    const next = parseHyphenSuffix(parsed.base);
    if (next === null) break;
    parsed.base = next.base;
    hyphenSuffixes.unshift(next.suffix);
  }
  parsed.suffixes = [...hyphenSuffixes, ...parsed.suffixes];
  return parsed;
}

function maximumRound(parsed: ParsedTransitionVersion, kind: TransitionSuffixKind): number {
  let highest = 0;
  for (const suffix of parsed.suffixes) {
    if (suffix.kind === kind && suffix.n > highest) highest = suffix.n;
  }
  return highest;
}

function maximumTimeoutRound(parsed: ParsedTransitionVersion): number {
  let highest = 0;
  for (const suffix of parsed.suffixes) {
    if (
      suffix.kind === "timeout" && suffix.state !== undefined &&
      TIMEOUT_ORDER_STATES.has(suffix.state) && suffix.n > highest
    ) highest = suffix.n;
  }
  return highest;
}

function comparableBase(base: string): string {
  return base.startsWith("consensus:") ? base.slice("consensus:".length) : base;
}

function versionTimestamp(base: string): string {
  const timestamps = [...base.matchAll(/\d{4}-\d{2}-\d{2}T\d{2}[:-]\d{2}[:-]\d{2}Z/gu)];
  return timestamps.at(-1)?.[0]?.replaceAll(":", "-") ?? "";
}

function transitionSuffixKey(parsed: ParsedTransitionVersion): readonly number[] {
  return [
    maximumRound(parsed, "loop"),
    maximumRound(parsed, "fix"),
    maximumRound(parsed, "reimplement"),
    maximumTimeoutRound(parsed),
    maximumRound(parsed, "review_meta_action"),
    maximumRound(parsed, "review_loop"),
    maximumRound(parsed, "ready_split"),
  ];
}

function compareOrderKeys(left: readonly (number | string)[], right: readonly (number | string)[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;
    if (leftPart === rightPart) continue;
    if (typeof leftPart === "number" && typeof rightPart === "number") {
      return leftPart > rightPart ? 1 : -1;
    }
    return String(leftPart) > String(rightPart) ? 1 : -1;
  }
  return 0;
}

function compareTransitionVersions(left: string | null, right: string | null): number | null {
  if (left === right) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  const leftParsed = parseTransitionVersion(left);
  const rightParsed = parseTransitionVersion(right);
  const leftBase = comparableBase(leftParsed.base);
  const rightBase = comparableBase(rightParsed.base);
  if (leftBase === rightBase) {
    return compareOrderKeys(transitionSuffixKey(leftParsed), transitionSuffixKey(rightParsed));
  }
  const leftTimestamp = versionTimestamp(leftBase);
  const rightTimestamp = versionTimestamp(rightBase);
  if (leftTimestamp === "" && rightTimestamp === "") return null;
  const primaryOrder = compareOrderKeys(
    [leftTimestamp === "" ? 0 : 1, leftTimestamp],
    [rightTimestamp === "" ? 0 : 1, rightTimestamp],
  );
  return primaryOrder === 0
    ? compareOrderKeys(transitionSuffixKey(leftParsed), transitionSuffixKey(rightParsed))
    : primaryOrder;
}

function compareStateFacts(left: StateMarkerFact, right: StateMarkerFact): number | null {
  const versionOrder = compareTransitionVersions(left.version, right.version);
  if (versionOrder === null || versionOrder !== 0) return versionOrder;
  return Math.sign(left.stage_rank - right.stage_rank);
}

export function selectAuthoritativeState(
  facts: readonly StateMarkerFact[],
): StateMarkerFact | null {
  const candidates = facts.filter((candidate) =>
    facts.every((other) => {
      if (candidate === other) return true;
      const order = compareStateFacts(candidate, other);
      return order !== null && order >= 0;
    }),
  );
  const first = candidates[0];
  if (first === undefined) return null;
  const firstSignature = JSON.stringify([
    first.proposal,
    first.state,
    first.version,
    first.stage_rank,
  ]);
  return candidates.every(
    (fact) =>
      JSON.stringify([fact.proposal, fact.state, fact.version, fact.stage_rank]) ===
      firstSignature,
  )
    ? first
    : null;
}

export function stateLabelHint(labels: readonly string[], state: LoopState): {
  expected: string;
  matches: boolean;
} {
  const expected = expectedStateLabel(state);
  const stateLabels = labels.filter((label) => ALL_STATE_LABELS.has(label));
  return {
    expected,
    matches: stateLabels.includes(expected) && stateLabels.every((label) => label === expected),
  };
}

export function projectEnabledIssue(
  labels: readonly string[],
  comments: readonly MarkerComment[],
  trustedAuthors: readonly string[],
): MarkerProjection | null {
  if (!isEnabledIssue(labels)) return null;
  return projectTrustedMarkers(comments, trustedAuthors);
}
