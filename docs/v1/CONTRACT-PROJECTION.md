# Console Projection Contract v1

Status: Phase-0 freeze for the live `fkst:devbored:*` read plane. This contract is normative for the console projection. It describes the protocol emitted by the package at the time of the freeze; it does not extend that protocol.

## 1. Scope and invariants

The projection reads GitHub issue comments and pull-request timeline comments, establishes carrier trust before inspecting marker bodies, parses only canonical `fkst:devbored:*` marker bytes, and derives console facts without writing to GitHub.

The following rules are unconditional:

- Live surfaces consume only the current `fkst:devbored:*` protocol. They ignore every `fkst:github-devloop:*` marker, even when a comment also contains a current marker. The legacy parser at `fkst-devbored/demo/assets/markers.js` is recorded-history code and MUST NOT be imported, called, wrapped, or used as a fallback by the live projection.
- Labels and ordinary prose are hints, not lifecycle authority. Only trusted, canonical markers become projected facts.
- Trust is evaluated before marker syntax or attributes are inspected.
- A bad, unknown, or future marker never throws out of the projection boundary. It produces no fact and, where specified below, a bounded diagnostic.
- Parsing and selection are deterministic. GitHub comment order, timestamps, and lexical comparison are never semantic tiebreakers.

The comment endpoints MUST be fully paginated before a projection is declared complete. A partial or failed page fetch yields a partial/degraded entity, not an apparently complete fact set.

## 2. Complete emitted schema inventory

The package has exactly five marker builders and render branches at this freeze. Each row cites the package source that actually emits its bytes.

| Schema ID | Canonical attributes, in byte order | Package-source emission citation |
| --- | --- | --- |
| `fkst:devbored:state:v1` | `work_item`, `state`, `version`, `stage_rank`, and terminal-only `why` | `packages/packages/devbored/markers.lua:287-297` |
| `fkst:devbored:consensus:v1` | `proposal_id`, `stage`, `outcome`, `round`, `seats` | `packages/packages/devbored/markers.lua:298-305` |
| `fkst:devbored:review:v1` | `pr`, `head_sha`, `decision`, `seats` | `packages/packages/devbored/markers.lua:306-312` |
| `fkst:devbored:merge-ready:v1` | `pr`, `head_sha`, `version` | `packages/packages/devbored/markers.lua:313-318` |
| `fkst:devbored:failure:v1` | `work_item`, `error_class`, `fingerprint`, `why` | `packages/packages/devbored/markers.lua:319-323` |

The exported builder list independently closes the inventory at `packages/packages/devbored/markers.lua:331-349`. No legacy `fkst:github-devloop:*` schema and no Phase-1 debate-evidence schema is part of this five-schema inventory.

## 3. Carrier and attribute grammar

### 3.1 Marker extraction

A canonical marker is one single-line HTML comment of this form:

```text
<!-- fkst:devbored:<kind>:v1 <attribute-list> -->
```

One GitHub comment body may contain surrounding human-readable text, but it is a valid marker carrier only when it contains exactly one occurrence of the literal prefix `<!-- fkst:devbored:` and that occurrence forms exactly one complete HTML comment. Zero occurrences means “not a marker comment.” Multiple occurrences, a truncated occurrence, or an occurrence spanning non-canonical bytes means “malformed carrier.” These rules mirror the package extraction boundary at `packages/packages/devbored/markers.lua:355-388`.

The projection MUST first classify and discard legacy occurrences. A body containing any `fkst:github-devloop:*` text is never allowed to make that legacy text authoritative. If the same body also contains a current marker, the current marker is parsed according to this contract; the legacy occurrence remains inert and does not count toward the current-prefix cardinality.

### 3.2 Canonical attributes

The attribute list is byte-significant:

- There is exactly one ASCII space before each attribute, exactly one `=` between its name and value, and double quotes around every value.
- Attribute names, presence, and order are exactly those in §2 and §4. Missing, duplicate, extra, or reordered attributes are malformed.
- String attributes are non-empty. They contain no control character and no literal `--`.
- The only entity encodings are `&amp;`, `&quot;`, `&lt;`, and `&gt;`, used for `&`, `"`, `<`, and `>` respectively. Decode exactly once, then require re-encoding to reproduce the original attribute bytes. Unknown, unnecessary, double, or non-canonical entity encodings are malformed. The package implementation is `packages/packages/devbored/markers.lua:167-209`.
- Integer attributes are canonical unsigned base-10 decimal: ASCII digits only, no sign, decimal point, exponent, whitespace, or leading zero except the value `0`. Parse and compare them as arbitrary-precision integers; a JavaScript `Number` round-trip MUST NOT be used where it can lose precision. Package numeric parsing is at `packages/packages/devbored/markers.lua:408-423`.
- Marker-safe tokens contain only ASCII letters, digits, `_`, `.`, or `-`. A `fingerprint` additionally permits `:`, `/`. A `head_sha` is exactly 40 or 64 hexadecimal characters; normalize it to lowercase only after canonical parsing for equality checks.
- `seats` is a non-empty comma-separated list of distinct marker-safe tokens with no whitespace, leading/trailing comma, or empty element. Its order is semantic roster order.

A known-schema grammar violation yields no fact and a `malformed` diagnostic. It MUST NOT throw or partially project attributes.

## 4. Schema semantics

### 4.1 `state:v1`

Required attributes are `work_item`, `state`, integer `version >= 0`, and integer `stage_rank >= 0`. `why` is required for terminal states and forbidden otherwise.

| `state` | Required `stage_rank` | Terminal |
| --- | ---: | --- |
| `thinking` | 100 | no |
| `ready` | 500 | no |
| `implementing` | 600 | no |
| `awaiting-pr` | 625 | no |
| `pr-open` | 650 | no |
| `reviewing` | 675 | no |
| `merge-ready` | 690 | no |
| `merging` | 695 | no |
| `fixing` | 700 | no |
| `impl-failed` | 750 | yes |
| `blocked` | 800 | yes |
| `merged` | 900 | yes |

A state/rank mismatch is malformed. The package enforces this mapping at `packages/packages/devbored/markers.lua:5-24` and `packages/packages/devbored/markers.lua:212-230`.

Group state markers by exact decoded `work_item`. Select the lexicographically greatest integer pair `(version, stage_rank)`: greater `version` wins; at equal version, greater `stage_rank` wins. `round`, comment creation time, comment ID, API order, and string ordering do not participate. This is the package comparator at `packages/packages/devbored/markers.lua:460-477`.

At the greatest pair, byte-identical duplicates coalesce. If two trusted canonical markers for the same `work_item` have the same pair but disagree in any decoded attribute, including `state` or `why`, the work item is `conflicted`: project no authoritative lifecycle state and surface a conflict diagnostic. Never choose the first or last comment.

### 4.2 `consensus:v1`

- `proposal_id`: non-empty safe string.
- `stage`: exactly `design` or `review`.
- `outcome`: exactly `reached`, `converge`, or `stalled`.
- `round`: positive integer.
- `seats`: ordered roster CSV per §3.2.

The package normalizer is `packages/packages/devbored/markers.lua:232-241`.

The consensus identity is `(proposal_id, stage, round)`. Exact duplicate facts coalesce. If canonical trusted facts at one identity disagree on `outcome` or ordered `seats`, that identity is conflicted and yields no consensus outcome. Rounds order by numeric `round`; they do not participate in lifecycle state ordering.

### 4.3 `review:v1`

- `pr`: positive integer.
- `head_sha`: 40- or 64-hex object ID.
- `decision`: exactly `approve` or `reject`.
- `seats`: ordered roster CSV per §3.2.

The package normalizer is `packages/packages/devbored/markers.lua:243-251`.

The review identity is `(pr, lowercase(head_sha))`. Exact duplicates coalesce. An `approve` and `reject` at the same identity, or different ordered rosters at that identity, conflict and yield no review authorization. A fact for a head other than the PR's current GitHub head is historical only and MUST NOT authorize merge.

### 4.4 `merge-ready:v1`

- `pr`: positive integer.
- `head_sha`: 40- or 64-hex object ID.
- `version`: non-negative integer.

The package normalizer is `packages/packages/devbored/markers.lua:253-260`.

A merge-ready fact is usable only when its `pr` and lowercased `head_sha` equal the selected PR and its current GitHub head, and its integer `version` equals the selected authoritative state version. It does not create a second lifecycle ordering and it cannot rescue a conflicted or absent state. Exact duplicates coalesce. Different heads at the same `(pr, version)` remain distinct historical facts; only the current head can authorize.

### 4.5 `failure:v1`

- `work_item`: non-empty safe string.
- `error_class`: marker-safe token.
- `fingerprint`: non-empty stable key using ASCII letters, digits, `_`, `.`, `:`, `/`, or `-`.
- `why`: non-empty safe string.

The package normalizer is `packages/packages/devbored/markers.lua:262-270`.

Failure facts are an unordered set keyed by `(work_item, error_class, fingerprint)`. Exact duplicates coalesce. Different `why` values at the same key are conflicting evidence and that key yields no authoritative failure description. A failure fact never substitutes for a terminal state marker and its required `why`.

## 5. Trust and association policy

A marker carrier is trusted only if all of the following hold:

1. The launch resolves exactly one non-empty trusted bot identity from the frozen deployment configuration. On the package side this identity is supplied as `FKST_GITHUB_BOT_LOGIN`; absence, ambiguity, or resolution failure makes every marker untrusted.
2. Normalize the configured login and the GitHub comment author's login by trimming, ASCII-lowercasing, and removing one terminal `[bot]`. The normalized values must be non-empty and exactly equal. Near matches, display names, email addresses, numeric IDs, and substring matches fail.
3. The comment's GitHub `author_association`, ASCII-uppercased, is exactly `OWNER`, `MEMBER`, or `COLLABORATOR`. Missing, empty, `NONE`, `CONTRIBUTOR`, `FIRST_TIMER`, `FIRST_TIME_CONTRIBUTOR`, or any future value fails closed.
4. The trust checks use GitHub response metadata, never fields embedded in the marker body or mutable local storage.

The association allowlist in item 3 is carrier authority, not issue admission. The deployed `devbored.config.v1` `intake.authorPolicy` independently controls whether the work item's author is admissible: `member` allows `MEMBER|OWNER`, `collaborator` allows `COLLABORATOR|MEMBER|OWNER`, and `any` imposes no author-association restriction. The package mapping is `packages/packages/devbored/core.lua:57-66`, and its application to the issue author is `packages/packages/devbored/core.lua:68-99`. The two policies MUST NOT be conflated.

Trust filtering MUST occur before any body scan or parse. Untrusted comments contribute no marker, conflict, malformed-marker diagnostic, or version candidate.

## 6. Mixed, unknown, and malformed inputs

| Input | Required live behavior |
| --- | --- |
| Any `fkst:github-devloop:*` marker | Ignore entirely; never parse, select, translate, or combine with current facts. |
| Unknown `fkst:devbored:<kind>:*` kind | Ignore gracefully and optionally record bounded `unsupportedSchema`; never throw. |
| Known kind with a version other than `v1` | Ignore gracefully and optionally record bounded `unsupportedSchema`; never throw. |
| Malformed known `v1` marker | Produce no fact, record bounded `malformed`, and continue projecting other comments; never throw. |
| Multiple current markers in one comment | Treat that comment as malformed and project none of them. |
| Untrusted comment | Ignore before inspecting its body. |
| Incomplete GitHub pagination/read | Mark the affected entity partial/degraded and withhold any completeness-dependent authorization. |

Diagnostics MUST contain schema/kind, carrier URL or comment ID, and a stable error class; they MUST NOT echo unbounded comment bodies.

The package parser currently returns an error for unknown schema/kind (`packages/packages/devbored/markers.lua:425-452`). That package behavior does not authorize the console to throw: additive protocol evolution requires this projection boundary to tolerate and ignore unknown schemas.

## 7. Conformance corpus

The projection's positive byte corpus is the package's canonical fixture bytes, imported at test time from these exact files:

- `packages/packages/devbored/tests/fixtures/markers/state.txt`
- `packages/packages/devbored/tests/fixtures/markers/consensus.txt`
- `packages/packages/devbored/tests/fixtures/markers/review.txt`
- `packages/packages/devbored/tests/fixtures/markers/merge-ready.txt`
- `packages/packages/devbored/tests/fixtures/markers/failure.txt`

Tests MUST read/import these files directly from the pinned package checkout. They MUST NOT copy their text into console fixtures, regenerate them, normalize line endings, append a newline, pretty-print, or otherwise retype them. The package test names this directory and asserts exact builder-to-file equality at `packages/packages/devbored/tests/marker_contracts_test.lua:4-5` and `packages/packages/devbored/tests/marker_contracts_test.lua:100-153`.

Conformance also requires generated negative cases for: untrusted identity, disallowed/missing association, malformed/truncated marker, duplicate current markers in one carrier, unknown kind, unknown version, non-canonical integer/entity/order, equal-pair state conflict, review conflict, mixed legacy/current history, and partial pagination. Negative cases are console-owned and do not replace the imported positive corpus.

## 8. Precedent contradictions resolved by this freeze

1. Package marker trust checks normalized bot login only (`packages/packages/devbored/docs/marker-contracts.md:103-109`; runtime use at `packages/packages/devbored/departments/observe_pr/facts.lua:10-15`), while the console requirement includes an association policy. This freeze adds a fail-closed carrier-association gate for the console. Package/runtime parity should be reviewed before declaring live evidence trusted.
2. The legacy demo parser recognizes `fkst:github-devloop:*`, accepts legacy state vocabulary and CAS string versions, and scans multiple markers line-by-line (`fkst-devbored/demo/assets/markers.js:1-75`, `fkst-devbored/demo/assets/markers.js:188-221`). The package protocol recognizes the five schemas in §2 and integer state ordering. This freeze prohibits protocol translation or mixing.
3. The package parser treats unknown trusted devbored schemas as parse errors (`packages/packages/devbored/markers.lua:425-452`), whereas the Phase-0 console contract requires forward-compatible ignore-without-throw behavior. The difference is deliberate at the external projection boundary.
