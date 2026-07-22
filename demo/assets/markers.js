const MARKER_LINE_PATTERN = /<!-- fkst:github-devloop:([a-z][\w-]*):v(\d+)\b(.*?)-->/g;
const ATTRIBUTE_PATTERN = /([A-Za-z0-9_.-]+)="([^"]*)"/g;

// The two-argument result API has no policy parameter. This pinned fallback is
// the browser equivalent of the configured trusted-bot gate and mirrors the
// versioned demo trust fixture; route code may attach the fetched policy as an
// override without changing the frozen context fields.
const RESULT_TRUST_POLICY = Object.freeze({
  trustedLoopActor: Object.freeze({login: 'devloop-bot'}),
  allowedAssociations: Object.freeze(['OWNER', 'MEMBER', 'COLLABORATOR'])
});

export const STATE_STAGE_RANKS = Object.freeze({
  thinking: 100,
  dependency_wait: 500,
  ready: 500,
  implementing: 600,
  'awaiting-pr': 625,
  'pr-open': 650,
  reviewing: 675,
  'merge-ready': 690,
  merging: 695,
  fixing: 700,
  'review-meta': 710,
  'impl-failed': 750,
  declined: 800,
  blocked: 800,
  'closed-unmerged': 825,
  merged: 900
});

export const KNOWN_STATES = Object.freeze(Object.keys(STATE_STAGE_RANKS));

const KNOWN_STATE_SET = new Set(KNOWN_STATES);
const MAX_VERSION_KEY_LENGTH = 40;
const TIMEOUT_ORDER_STATES = Object.freeze([
  'thinking',
  'ready',
  'implementing',
  'awaiting-pr',
  'impl-failed',
  'pr-open',
  'reviewing',
  'review-meta',
  'merge-ready',
  'merging',
  'fixing',
  'blocked'
]);
const SLASH_SUFFIX_SPECS = Object.freeze({
  'review-meta-action': {kind: 'review_meta_action', shape: 'numeric'},
  'review-loop': {kind: 'review_loop', shape: 'numeric'},
  'ready-split': {kind: 'ready_split', shape: 'numeric'},
  reimplement: {kind: 'reimplement', shape: 'numeric'},
  'timeout-reconcile': {kind: 'timeout_reconcile', shape: 'stateNumeric'},
  timeout: {kind: 'timeout', shape: 'stateNumeric'},
  rereview: {kind: 'rereview', shape: 'numberHex'},
  'review-meta': {kind: 'review_meta', shape: 'numeric'},
  review: {kind: 'review', shape: 'numeric'},
  loop: {kind: 'loop', shape: 'numeric'},
  fix: {kind: 'fix', shape: 'numeric'}
});
const HYPHEN_SUFFIX_SPECS = Object.freeze([
  {name: 'review-meta-action', kind: 'review_meta_action', parts: 1},
  {name: 'review-loop', kind: 'review_loop', parts: 1},
  {name: 'ready-split', kind: 'ready_split', parts: 1},
  {name: 'reimplement', kind: 'reimplement', parts: 1},
  {name: 'timeout-reconcile', kind: 'timeout_reconcile', stateNumeric: true},
  {name: 'timeout', kind: 'timeout', stateNumeric: true},
  {name: 'rereview', kind: 'rereview', parts: 2},
  {name: 'review-meta', kind: 'review_meta', parts: 1},
  {name: 'review', kind: 'review', parts: 1},
  {name: 'loop', kind: 'loop', parts: 1},
  {name: 'fix', kind: 'fix', parts: 1}
]);

function own(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/** Normalize REST "slug[bot]" and GraphQL "slug" logins to one identity. */
export function normalizeLogin(login) {
  if (typeof login !== 'string') return null;
  const normalized = login.trim().toLowerCase().replace(/\[bot\]$/, '');
  return normalized || null;
}

export function commentAuthorLogin(comment) {
  if (!comment || typeof comment !== 'object') return null;
  return normalizeLogin(
    comment.author_login ?? comment.author?.login ?? comment.user?.login
  );
}

function normalizedPolicy(policy) {
  const trustedLogin = normalizeLogin(policy?.trustedLoopActor?.login);
  const allowedAssociations = new Set(
    Array.isArray(policy?.allowedAssociations)
      ? policy.allowedAssociations
          .filter((association) => typeof association === 'string')
          .map((association) => association.trim().toUpperCase())
          .filter(Boolean)
      : []
  );
  return {trustedLogin, allowedAssociations};
}

function commentAssociation(comment) {
  const association = comment?.authorAssociation ?? comment?.author_association;
  return typeof association === 'string' ? association.trim().toUpperCase() : null;
}

function isTrustedWithPolicy(comment, policy) {
  const author = commentAuthorLogin(comment);
  const association = commentAssociation(comment);
  return Boolean(
    policy.trustedLogin &&
    author === policy.trustedLogin &&
    association &&
    policy.allowedAssociations.has(association)
  );
}

/** Trust is policy-owned; issue authorship is deliberately not consulted. */
export function isTrustedComment(comment, policy) {
  return isTrustedWithPolicy(comment, normalizedPolicy(policy));
}

export function parseMarkerAttributes(markerText) {
  const attributes = {};
  ATTRIBUTE_PATTERN.lastIndex = 0;
  let match;
  while ((match = ATTRIBUTE_PATTERN.exec(String(markerText ?? ''))) !== null) {
    attributes[match[1]] = match[2];
  }
  return attributes;
}

function readStageRank(attributes, state) {
  const rawRank = attributes.stage_rank;
  if (typeof rawRank === 'string' && /^\d+$/.test(rawRank)) {
    const explicitRank = Number(rawRank);
    if (Number.isFinite(explicitRank)) return explicitRank;
  }
  return STATE_STAGE_RANKS[state];
}

function commentCreatedAt(comment) {
  return comment?.createdAt ?? comment?.created_at ?? null;
}

function commentId(comment) {
  return comment?.id ?? comment?.databaseId ?? comment?.database_id ?? null;
}

function markerFromMatch(match, carrier) {
  const schema = match[1];
  const schemaVersion = Number(match[2]);
  const raw = match[0];
  const attributes = parseMarkerAttributes(raw);

  const marker = {
    schema,
    schemaVersion,
    attributes,
    proposal: attributes.proposal,
    raw,
    ...carrier
  };

  if (schema === 'state') {
    marker.state = attributes.state;
    marker.version = attributes.version;
    marker.stageRank = readStageRank(attributes, attributes.state);
  }

  return marker;
}

function markerIsStructurallyReadable(marker) {
  return Boolean(
    marker &&
    own(marker.attributes, 'proposal') &&
    (marker.schema !== 'state' || KNOWN_STATE_SET.has(marker.state))
  );
}

function scanMarkers(comments, policy) {
  if (!Array.isArray(comments)) return [];

  const trustPolicy = normalizedPolicy(policy);
  const markers = [];
  comments.forEach((comment, commentIndex) => {
    // The trust gate must run before marker syntax or comment bodies are inspected.
    if (!isTrustedWithPolicy(comment, trustPolicy)) return;
    if (typeof comment?.body !== 'string') return;

    const author = commentAuthorLogin(comment);
    const association = commentAssociation(comment);
    const lines = comment.body.split(/\r?\n/);
    lines.forEach((line, lineIndex) => {
      MARKER_LINE_PATTERN.lastIndex = 0;
      let match;
      let lineMarkerIndex = 0;
      while ((match = MARKER_LINE_PATTERN.exec(line)) !== null) {
        markers.push(markerFromMatch(match, {
          author,
          association,
          trusted: true,
          createdAt: commentCreatedAt(comment),
          commentId: commentId(comment),
          comment,
          commentIndex,
          lineIndex,
          lineMarkerIndex
        }));
        lineMarkerIndex += 1;
      }
    });
  });
  return markers;
}

/**
 * Read markers only after a comment passes the explicit trust policy.
 * Marker scanning is line-local and requires the contract's literal "<!-- " prefix.
 */
export function readTrustedMarkers(comments, policy) {
  const trustPolicy = normalizedPolicy(policy);
  if (!trustPolicy.trustedLogin || trustPolicy.allowedAssociations.size === 0) return [];
  return scanMarkers(comments, policy).filter((marker) => (
    markerIsStructurallyReadable(marker)
  ));
}

function stringValue(value) {
  return String(value ?? '');
}

function decimalChecksum(value) {
  let hash = 2166136261n;
  for (const byte of new TextEncoder().encode(stringValue(value))) {
    hash = (hash * 16777619n + BigInt(byte)) % 4294967291n;
  }
  return hash.toString().padStart(10, '0');
}

function sanitizeKey(value) {
  let sanitized = stringValue(value)
    .replace(/[^A-Za-z0-9_./#-]/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
  if (!sanitized) return 'empty';

  sanitized = sanitized
    .split('/')
    .map((segment) => (segment === '.' || segment === '..' ? '-' : segment))
    .join('/');
  return sanitized || 'empty';
}

/** Byte-faithful port of contract.transition_version.safe_version_segment. */
export function safeVersionSegment(version) {
  let safe = sanitizeKey(version)
    .replace(/[/#]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!safe) safe = 'version';
  if (safe.length > MAX_VERSION_KEY_LENGTH) {
    const suffix = `-${decimalChecksum(version)}`;
    safe = `${safe.slice(0, MAX_VERSION_KEY_LENGTH - suffix.length).replace(/-+$/g, '')}${suffix}`;
  }
  return safe || 'version';
}

function luaNumber(value) {
  const text = stringValue(value);
  if (!text) return null;
  const number = Number(text);
  return Number.isNaN(number) ? null : number;
}

function parseSlashSuffixChain(parts, startPosition) {
  const suffixes = [];
  let position = startPosition;
  while (position < parts.length) {
    const spec = SLASH_SUFFIX_SPECS[parts[position]];
    if (!spec) return null;

    let suffix;
    if (spec.shape === 'numeric') {
      const raw = parts[position + 1];
      if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
      const number = Number(raw);
      if (Number.isNaN(number)) return null;
      suffix = {kind: spec.kind, n: number, separator: 'slash'};
      position += 2;
    } else if (spec.shape === 'stateNumeric') {
      const state = parts[position + 1];
      const raw = parts[position + 2];
      if (!state || typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
      const number = Number(raw);
      if (Number.isNaN(number)) return null;
      suffix = {kind: spec.kind, state, n: number, separator: 'slash'};
      position += 3;
    } else {
      const number = luaNumber(parts[position + 1]);
      const hex = parts[position + 2];
      if (number === null || typeof hex !== 'string' || !/^[0-9A-Fa-f]+$/.test(hex)) return null;
      suffix = {kind: spec.kind, n: number, hex, separator: 'slash'};
      position += 3;
    }
    suffixes.push(suffix);
  }
  return suffixes;
}

function parseSlashVersion(value) {
  const text = stringValue(value);
  const parts = text.split('/');
  for (let position = 0; position < parts.length; position += 1) {
    const suffixes = parseSlashSuffixChain(parts, position);
    if (suffixes) return {base: parts.slice(0, position).join('/'), suffixes};
  }
  return {base: text, suffixes: []};
}

function parseHyphenOnce(base) {
  for (const spec of HYPHEN_SUFFIX_SPECS) {
    const prefix = `-${spec.name}-`;
    const prefixPosition = base.lastIndexOf(prefix);
    if (prefixPosition < 0) continue;

    const suffixParts = base.slice(prefixPosition + prefix.length).split('-').filter(Boolean);
    if (spec.stateNumeric && suffixParts.length >= 2) {
      const number = luaNumber(suffixParts.at(-1));
      if (number !== null) {
        return {
          base: base.slice(0, prefixPosition),
          suffix: {
            kind: spec.kind,
            state: suffixParts.slice(0, -1).join('-'),
            n: number,
            separator: 'hyphen'
          }
        };
      }
    } else if (suffixParts.length === spec.parts) {
      if (spec.kind === 'rereview') {
        const number = luaNumber(suffixParts[0]);
        const hex = suffixParts[1];
        if (number !== null && /^[0-9A-Fa-f]+$/.test(hex)) {
          return {
            base: base.slice(0, prefixPosition),
            suffix: {kind: spec.kind, n: number, hex, separator: 'hyphen'}
          };
        }
      } else {
        const number = luaNumber(suffixParts.at(-1));
        if (number !== null) {
          return {
            base: base.slice(0, prefixPosition),
            suffix: {kind: spec.kind, n: number, separator: 'hyphen'}
          };
        }
      }
    }
  }
  return null;
}

/** Parse slash and hyphen suffix chains in the engine's exact precedence order. */
export function parseTransitionVersion(version) {
  const parsed = parseSlashVersion(version);
  const hyphenSuffixes = [];
  while (true) {
    const next = parseHyphenOnce(parsed.base);
    if (!next) break;
    parsed.base = next.base;
    hyphenSuffixes.unshift(next.suffix);
  }
  parsed.suffixes.push(...hyphenSuffixes);
  return parsed;
}

function maxRound(parsed, kind) {
  let maximum = 0;
  for (const suffix of parsed.suffixes ?? []) {
    if (suffix.kind === kind) maximum = Math.max(maximum, Number(suffix.n) || 0);
  }
  return maximum;
}

function maxTimeoutRound(parsed) {
  let maximum = 0;
  for (const state of TIMEOUT_ORDER_STATES) {
    let stateMaximum = 0;
    for (const suffix of parsed.suffixes ?? []) {
      if (suffix.kind === 'timeout' && stringValue(suffix.state) === state) {
        stateMaximum = Math.max(stateMaximum, Number(suffix.n) || 0);
      }
    }
    maximum = Math.max(maximum, stateMaximum);
  }
  return maximum;
}

function comparableTransitionBase(parsed) {
  const base = stringValue(parsed?.base);
  return base.startsWith('consensus:') ? base.slice('consensus:'.length) : base;
}

function lastUpdatedAt(version) {
  const matches = stringValue(version).matchAll(/\d{4}-\d{2}-\d{2}T\d{2}[-:]\d{2}[-:]\d{2}Z/g);
  let updatedAt = '';
  for (const match of matches) updatedAt = match[0].replaceAll(':', '-');
  return updatedAt;
}

function padDigits(digits) {
  const text = stringValue(digits);
  return text.length >= 12 ? text : text.padStart(12, '0');
}

function padNumericRuns(text) {
  return stringValue(text).replace(/\d+/g, padDigits);
}

function sourceVersionOrderKey(version) {
  let rest = stringValue(version);
  if (rest.startsWith('consensus:')) {
    rest = rest.slice('consensus:'.length);
  } else if (rest.startsWith('ready/')) {
    rest = rest.slice('ready/'.length).replace(/^consensus-/, '');
  }

  const timestamps = [...rest.matchAll(/\d{4}-\d{2}-\d{2}T\d{2}[-:]\d{2}[-:]\d{2}Z/g)];
  const timestamp = timestamps.at(-1)?.[0];
  if (timestamp) {
    const endPosition = rest.indexOf(timestamp) + timestamp.length;
    const suffix = rest.slice(endPosition);
    const loopNumber = suffix.match(/\/loop\/(\d+)$/)?.[1] ?? '0';
    const suffixTie = suffix.replace(/\/loop\/\d+$/, '');
    return `${timestamp.replaceAll(':', '-')}/loop/${padDigits(loopNumber)}${padNumericRuns(suffixTie)}`;
  }
  return padNumericRuns(rest);
}

function versionKey(parsed, stageRank = 0) {
  const base = comparableTransitionBase(parsed);
  const updatedAt = lastUpdatedAt(base);
  return {
    primaryKind: updatedAt ? 1 : 0,
    primary: updatedAt || sourceVersionOrderKey(safeVersionSegment(base)),
    loop: maxRound(parsed, 'loop'),
    fix: maxRound(parsed, 'fix'),
    reimplement: maxRound(parsed, 'reimplement'),
    timeout: maxTimeoutRound(parsed),
    reviewMetaAction: maxRound(parsed, 'review_meta_action'),
    reviewLoop: maxRound(parsed, 'review_loop'),
    readySplit: maxRound(parsed, 'ready_split'),
    stageRank: Number(stageRank) || 0
  };
}

function comparePrimitive(left, right) {
  if (left === right) return 0;
  return left > right ? 1 : -1;
}

/** Compare transition versions without allowing stage rank to influence the result. */
export function compareTransitionVersions(left, right) {
  if (left === right) return 0;
  if (left == null) return right == null ? 0 : -1;
  if (right == null) return 1;

  const leftParsed = parseTransitionVersion(left);
  const rightParsed = parseTransitionVersion(right);
  const leftBase = comparableTransitionBase(leftParsed);
  const rightBase = comparableTransitionBase(rightParsed);
  const sameBase = (
    leftBase === rightBase || safeVersionSegment(leftBase) === safeVersionSegment(rightBase)
  );
  const leftKey = versionKey(leftParsed);
  const rightKey = versionKey(rightParsed);
  for (const field of [
    ...(sameBase ? [] : ['primaryKind', 'primary']),
    'loop',
    'fix',
    'reimplement',
    'timeout',
    'reviewMetaAction',
    'reviewLoop',
    'readySplit'
  ]) {
    const order = comparePrimitive(leftKey[field], rightKey[field]);
    if (order !== 0) return order;
  }
  return 0;
}

function markerStageRank(marker) {
  if (Number.isFinite(marker?.stageRank)) return marker.stageRank;
  return STATE_STAGE_RANKS[marker?.state] ?? 0;
}

/** Version is the primary CAS key; stage rank is used only when versions tie. */
export function compareStateMarkers(left, right) {
  const versionOrder = compareTransitionVersions(
    left?.version ?? left?.attributes?.version,
    right?.version ?? right?.attributes?.version
  );
  if (versionOrder !== 0) return versionOrder;
  return comparePrimitive(markerStageRank(left), markerStageRank(right));
}

function contextFailure(context) {
  if (!context || typeof context !== 'object') return 'context';
  const repo = typeof context.repo === 'string' ? context.repo.trim() : '';
  const issueNumber = stringValue(context.issueNumber);
  const expectedProposal = typeof context.expectedProposal === 'string'
    ? context.expectedProposal
    : '';
  if (!repo || !/^\d+$/.test(issueNumber) || !expectedProposal) return 'context';
  const routeProposal = `github-devloop/issue/${repo}/${issueNumber}`;
  return routeProposal === expectedProposal ? null : 'context.expectedProposal';
}

function failed(status, failedPredicate) {
  return {fact: null, status, failedPredicate};
}

function ok(fact) {
  return {fact, status: 'ok'};
}

function usablePolicy(policy) {
  const normalized = normalizedPolicy(policy);
  return Boolean(normalized.trustedLogin && normalized.allowedAssociations.size > 0);
}

function hasTrustedComment(comments, policy) {
  const normalized = normalizedPolicy(policy);
  return Array.isArray(comments) && comments.some((comment) => (
    isTrustedWithPolicy(comment, normalized)
  ));
}

/**
 * Select the current accepted state for an independently supplied route context.
 * Trusted state history is allowed to contain multiple transitions; a tied,
 * semantically divergent CAS winner is reported as ambiguous rather than guessed.
 */
export function selectCurrentState(comments, policy, context) {
  const contextPredicate = contextFailure(context);
  if (contextPredicate) return failed('unknown', contextPredicate);
  if (!usablePolicy(policy)) return failed('unknown', 'trustedAuthorPolicy');

  const candidates = scanMarkers(comments, policy).filter((marker) => (
    marker.schema === 'state' && marker.schemaVersion === 1
  ));
  if (candidates.length === 0) {
    return failed('unknown', hasTrustedComment(comments, policy) ? 'stateMarker' : 'trustedAuthor');
  }

  if (candidates.some((marker) => !KNOWN_STATE_SET.has(marker.state))) {
    return failed('ambiguous', 'state');
  }
  if (candidates.some((marker) => marker.proposal !== context.expectedProposal)) {
    return failed('ambiguous', 'proposal');
  }

  let current = null;
  for (const marker of candidates) {
    if (current === null) {
      current = marker;
      continue;
    }
    const order = compareStateMarkers(marker, current);
    if (order > 0) current = marker;
    else if (order === 0 && marker.state !== current.state) {
      return failed('ambiguous', 'stateConflict');
    }
  }
  return current ? ok(current) : failed('unknown', 'stateMarker');
}

/**
 * Read the sole trusted result fact for a route. The frozen two-argument API uses
 * the pinned demo gate unless route code supplies its fetched policy as an override.
 */
export function readResultFact(comments, context) {
  const contextPredicate = contextFailure(context);
  if (contextPredicate) return failed('unknown', contextPredicate);
  const policy = context?.trustPolicy ?? context?.policy ?? RESULT_TRUST_POLICY;
  if (!usablePolicy(policy)) return failed('unknown', 'trustedAuthorPolicy');

  const candidates = scanMarkers(comments, policy).filter((marker) => (
    marker.schema === 'result' && marker.schemaVersion === 1
  ));
  if (candidates.length === 0) {
    return failed('unknown', hasTrustedComment(comments, policy) ? 'resultMarker' : 'trustedAuthor');
  }

  if (candidates.some((marker) => marker.proposal !== context.expectedProposal)) {
    return failed('ambiguous', 'proposal');
  }

  if (context.expectedLogicalIdentity !== undefined) {
    const expectedIdentity = stringValue(context.expectedLogicalIdentity);
    const identitiesMatch = candidates.every((marker) => (
      (marker.attributes.lineage ?? marker.attributes.dedup) === expectedIdentity
    ));
    if (!expectedIdentity || !identitiesMatch) return failed('ambiguous', 'logicalIdentity');
  }

  const decisions = candidates.map((marker) => marker.attributes.decision);
  if (decisions.some((decision) => decision !== 'approve' && decision !== 'reject')) {
    return failed('ambiguous', 'decision');
  }
  if (candidates.length !== 1) {
    return failed(
      'ambiguous',
      new Set(decisions).size > 1 ? 'decisionConflict' : 'cardinality'
    );
  }

  const marker = candidates[0];
  return ok({
    ...marker,
    decision: marker.attributes.decision,
    dedupKey: marker.attributes.dedup,
    logicalIdentity: marker.attributes.lineage ?? marker.attributes.dedup
  });
}

/** Carrier chronology is display-only and is never used as the accepted-state CAS. */
export function compareCarrierChronology(left, right) {
  const leftTime = Date.parse(left?.createdAt ?? '');
  const rightTime = Date.parse(right?.createdAt ?? '');
  const safeLeftTime = Number.isNaN(leftTime) ? Number.POSITIVE_INFINITY : leftTime;
  const safeRightTime = Number.isNaN(rightTime) ? Number.POSITIVE_INFINITY : rightTime;
  return (
    safeLeftTime - safeRightTime ||
    (left?.commentIndex ?? 0) - (right?.commentIndex ?? 0) ||
    (left?.lineIndex ?? 0) - (right?.lineIndex ?? 0) ||
    (left?.lineMarkerIndex ?? 0) - (right?.lineMarkerIndex ?? 0)
  );
}
