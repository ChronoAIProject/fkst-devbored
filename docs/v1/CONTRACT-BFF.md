# fkst-devbored v1 — frozen local BFF interface contract

Status: **FROZEN — Phase 0**

Contract identifier: `fkst.bff.v1`

Applies to: the Phase-1 refactor of `local-bff/server.mjs` and all v1 browser consumers

Authority boundary: substrate supplies engine-delivery facts; GitHub supplies durable business facts; the BFF is a disposable projection and the sole same-origin UI host.

The words **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative. A route, field, status, command shape, or limit not listed here is not part of v1. There is no v1 engine-control route, arbitrary command route, generic GitHub proxy, SSE route, config-write route, marker-write route, or fallback-to-fixture behavior.

## 1. Immutable startup configuration

### 1.1 Two inputs, one immutable startup snapshot

The BFF reads exactly two JSON inputs before opening its listener:

1. a BFF launch manifest with schema `fkst.bff.startup.v1`; and
2. the one deployment business config referenced by that manifest, with schema `devbored.config.v1`.

Both are parsed once. The resulting `StartupSnapshotV1` is deeply immutable and is the only configuration visible to route handlers, adapters, admission logic, and the write gate. Environment variables and request data MUST NOT override any snapshot field. The only launch switch outside the manifest is `--enable-writes`; its absence means `false`. It can narrow permissions but cannot alter the manifest.

The manifest is a strict object with exactly these fields:

| Field | Type and constraint |
| --- | --- |
| `schema` | exact string `fkst.bff.startup.v1` |
| `mode` | exact string `live` or `fixture` |
| `listen` | exact object `{ "host": "127.0.0.1", "port": integer }`; `port` is `1024..65535`, defaulted by the manifest author to `8471` rather than by the BFF |
| `uiRoot` | non-empty absolute path to an existing directory; canonicalized once with `realpath` |
| `fixtureRoot` | absolute existing directory in fixture mode; `null` in live mode |
| `deploymentConfig` | non-empty absolute path to an existing regular UTF-8 JSON file |
| `configDigestSidecar` | exact string `${deploymentConfig}.sha256`; no alternate location |
| `targetRepo` | exact object `{ "host": "github.com", "owner": string, "name": string }`; owner and name each match `^[A-Za-z0-9_.-]{1,100}$` and the combined `owner/name` is the sole server-side repo allowlist |
| `trustedBotLogin` | GitHub login string `1..100` bytes; normalized at startup by trim, ASCII lowercase, then removal of one terminal `[bot]` suffix |
| `expectedHumanLogin` | GitHub login string subject to the same normalization; MUST differ from `trustedBotLogin` |
| `humanGhConfigDir` | absolute existing directory in live mode; `null` in fixture mode; it identifies the isolated human `gh` auth context and is not a secret value |
| `substrateBinary` | absolute existing executable regular-file path in live mode; `null` in fixture mode |
| `ghBinary` | absolute existing executable regular-file path in live mode; `null` in fixture mode |
| `durableRoot` | absolute existing directory in live mode; `null` in fixture mode; the BFF MUST NOT create it |

Unknown manifest fields, duplicate object member names, symlinked authority files, relative paths, non-regular executable files, and invalid mode-dependent nullability are startup-fatal. Secrets, GitHub tokens, a configurable command, argv fragments, CORS origins, additional repositories, and arbitrary environment variables are forbidden manifest fields.

After validating `devbored.config.v1`, the BFF records this derived immutable object:

```text
StartupSnapshotV1 {
  contract                 : "fkst.bff.v1"
  mode                     : "live" | "fixture"
  origin                   : "http://127.0.0.1:<port>"
  target_repo              : "<owner>/<name>"
  trusted_bot_login        : NormalizedGitHubLogin
  expected_human_login     : NormalizedGitHubLogin
  writes_requested         : boolean
  writes_launch_enabled    : boolean
  devbored_config          : DevboredConfigV1
  config_version           : positive safe integer
  config_digest            : "sha256:<64 lowercase hex digits>"
  startup_manifest_raw_sha256 : "sha256:<64 lowercase hex digits>"
  deployment_config_raw_sha256 : "sha256:<64 lowercase hex digits>"
  digest_sidecar_raw_sha256    : "sha256:<64 lowercase hex digits>"
  config_file_state        : "unchanged" | "changed" | "unreadable"
}
```

`config_version` is a response/evidence field name only. Its value is passed through from the existing JSON number at `devbored_config.version`. A second config version field MUST NOT be added to `devbored.config.v1`, and a string form such as `"7"` MUST NOT be substituted. `config_digest` is derived as specified in section 2 and is not inserted into the config object.

### 1.2 `devbored.config.v1` schema consumed by the BFF

The BFF accepts exactly the existing complete business-config shape below. Every listed object is required; every leaf is required; `null` is forbidden. Unknown fields are rejected at every defined object level. Dynamic keys are permitted only inside `labels.state` and `labels.priorityClasses`.

| JSON path | Type and constraint |
| --- | --- |
| `$.schema` | exact string `devbored.config.v1` |
| `$.version` | positive safe integer `1..9007199254740991`; becomes `config_version` unchanged |
| `$.labels.prefix` | non-empty string |
| `$.labels.enabled` | non-empty string beginning with `labels.prefix`; sole enabled label used by discovery and POST |
| `$.labels.claimed` | non-empty string beginning with `labels.prefix` |
| `$.labels.state` | non-empty object whose dynamic keys and values are non-empty strings; every value begins with `labels.prefix` |
| `$.labels.priorityClasses` | non-empty object whose dynamic keys and values are non-empty strings; every value begins with `labels.prefix` |
| `$.intake.requireEnabledLabel` | boolean |
| `$.intake.milestones` | dense array of distinct positive safe integers; `[]` means unrestricted and is not a default |
| `$.intake.authorPolicy` | exact string `any`, `collaborator`, or `member` |
| `$.stages.design.enabled` | boolean |
| `$.stages.design.seats` | ordered dense array of `1..4` distinct strings matching `^[A-Za-z0-9._-]+$` |
| `$.stages.design.agreement` | exact string `majority` or `unanimous` |
| `$.stages.design.budgets.maxRounds` | positive safe integer |
| `$.stages.design.budgets.timeoutSeconds` | positive safe integer |
| `$.stages.review.enabled` | boolean |
| `$.stages.review.seats` | ordered dense array of `1..4` distinct strings matching `^[A-Za-z0-9._-]+$` |
| `$.stages.review.agreement` | exact string `majority` or `unanimous` |
| `$.stages.review.budgets.maxRounds` | positive safe integer |
| `$.stages.review.budgets.timeoutSeconds` | positive safe integer |
| `$.stages.implement.enabled` | boolean |
| `$.stages.implement.model` | non-empty string |
| `$.stages.implement.effort` | non-empty string |
| `$.stages.implement.localTestCommand` | non-empty string; display-only to this BFF and never executed |
| `$.stages.merge.enabled` | boolean |
| `$.stages.merge.requireCiGreen` | boolean |
| `$.stages.merge.requireHeadBoundApproval` | boolean |
| `$.stages.merge.targetBranch` | non-empty string |

The config input is capped at `262144` raw bytes. It MUST be valid UTF-8 without a BOM, contain one top-level object, contain no duplicate member names, and have no trailing non-whitespace token. The BFF applies all semantic constraints above before computing an effective write posture.

### 1.3 Startup validation and fail-closed behavior

Startup order is fixed:

1. Read and strictly parse the manifest; resolve every filesystem path to a canonical absolute path.
2. Read and retain the raw manifest bytes, raw config bytes, and raw sidecar bytes.
3. Strictly decode and validate `devbored.config.v1`.
4. Canonicalize the decoded config and compute `config_digest` per section 2.
5. Parse the sidecar and require byte-for-byte digest equality.
6. In live mode, resolve and validate both executables, validate the existing durable root without creating or opening engine-owned files, and resolve the human actor with the isolated `GH_CONFIG_DIR`.
7. Require the resolved normalized actor to equal `expectedHumanLogin` and not equal `trustedBotLogin`.
8. Set immutable `writes_launch_enabled = (mode == "live" && --enable-writes present)` after the startup actor/executable checks pass. This records only launch permission. The current effective write gate is request-time state and can become open only after fresh matching evidence exists; a failed gate never grants a weaker posture.
9. Generate the session token, build the route registry, then bind the listener. No request is accepted earlier.

Invalid startup input exits non-zero before binding and prints only a safe diagnostic code plus the offending field name. Tokens, config contents, local auth contents, command output, and raw paths from child-process errors MUST NOT be printed to the browser.

The BFF watches the manifest, config, and sidecar and also synchronously re-reads all three before every API request and immediately before spawning the POST command. If any file is unreadable or its raw bytes differ from the retained startup bytes, the BFF atomically latches `config_file_state` to `changed` or `unreadable`. The latch never clears during that process, even if the old bytes are restored. The BFF never hot-reloads.

After the latch trips:

- static UI assets and `GET /api/v1/health` remain reachable;
- `GET /api/v1/config` returns the retained startup config with the latched state and `freshness.state = "stale"`;
- the engine route may continue because its artifact is substrate-owned, but its envelope includes `config_file_state` and cannot open the write gate;
- every GitHub read returns `503 config_changed` with `availability = "unknown"`, preventing projection under stale admission rules; and
- POST returns `503 config_changed` before any `gh` process is spawned.

A process restart against validated new bytes is the only recovery.

## 2. Canonical bytes and config digest

### 2.1 Canonicalization algorithm

The canonicalizer accepts a strictly parsed JSON value and emits exactly one byte sequence. It is deliberately a safe-integer JSON profile so the Node BFF and the package runtime cannot disagree through binary floating-point formatting.

1. **Input decoding:** input bytes MUST be valid UTF-8 without a BOM. Duplicate member names, lone Unicode surrogates, invalid escapes, trailing non-whitespace tokens, and non-object config roots are rejected before canonicalization.
2. **Objects:** emit `{`, then members sorted by the unsigned lexicographic order of each key's UTF-8 bytes, then `}`. Emit each member as canonical string key, `:`, canonical value. Separate members with `,`. No whitespace is emitted. Sorting by UTF-8 bytes is equivalent to Unicode scalar-value order for valid UTF-8; locale and UTF-16 code-unit sorting are forbidden.
3. **Arrays:** preserve input order exactly. Emit `[`, comma-separated canonical values, `]`, with no whitespace.
4. **Numbers:** every accepted number MUST be an integer in `[-9007199254740991, 9007199254740991]`. Emit minimal base-10 ASCII with no leading `+`, no leading zero, no decimal point, and no exponent. Both input `-0` and `0` emit `0`; for example, input `1e3` emits `1000`. Fractions, infinities, NaN, and integers outside the range are rejected.
5. **Strings and keys:** operate on Unicode scalar values. Emit surrounding `"`. Escape U+0022 as `\"`, U+005C as `\\`, and U+0008/U+0009/U+000A/U+000C/U+000D as `\b`, `\t`, `\n`, `\f`, `\r`. Emit every other U+0000..U+001F as lowercase `\u00xx`. Do not escape `/`. Emit all other scalar values directly as UTF-8, including U+2028, U+2029, and non-ASCII characters. Unicode normalization MUST NOT be applied.
6. **Literals:** emit exactly `true`, `false`, or `null`.
7. **Document termination:** emit no BOM, no spaces, and **no trailing newline**. A newline or other insignificant whitespace in source JSON does not survive canonicalization.

`config_digest` is lowercase SHA-256 over exactly those canonical UTF-8 bytes:

```text
config_digest = "sha256:" + lowercase_hex(SHA256(canonical_utf8_bytes(config)))
```

### 2.2 Sidecar and self-reference decision

The digest is stored **beside** the config, never inside it. For config path `/absolute/devbored.json`, the required sidecar is `/absolute/devbored.json.sha256`. Its entire content is exactly:

```text
sha256:<64 lowercase hexadecimal digits>\n
```

That is 72 ASCII bytes: the seven-byte `sha256:` prefix, 64 hex digits, and one LF. CRLF, uppercase hex, additional whitespace, filenames, or multiple lines are invalid. The sidecar is excluded from the digest input, so there is no self-reference. The BFF always recomputes the digest and compares; it never trusts the sidecar as the computation.

### 2.3 Golden vectors

The `Input JSON` column shows source JSON text; `\n`, `\t`, `\u0000`, `\"`, and `\\` denote the corresponding JSON source escapes. The canonical column shows the exact UTF-8 character sequence before hashing and never has a terminal LF.

| ID | Input JSON | Canonical UTF-8 bytes | SHA-256 hex |
| --- | --- | --- | --- |
| V1 empty object | `{}` | `{}` | `44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a` |
| V2 key order | `{"z":0,"a":1}` | `{"a":1,"z":0}` | `b55af27c4bd5f02ebeca8f901b84d2940b22e7bea7230e4d06f275d903bfdd72` |
| V3 UTF-8 keys/values | `{"é":"café","😀":"雪","a":"λ"}` | `{"a":"λ","é":"café","😀":"雪"}` | `b420571cdd4100504d70d039ec3094e2404fd424ab1e80a5d8e519058a7e2168` |
| V4 number normalization | `{"z":-0,"e":1e3,"i":9007199254740991}` | `{"e":1000,"i":9007199254740991,"z":0}` | `3a589cfe2ac8f7b698a9d6e96323b30fb3beb84c87dce46f080f13e514f6176b` |
| V5 string escaping | `{"s":"quote\" slash\\ line\n tab\t nul\u0000"}` | `{"s":"quote\" slash\\ line\n tab\t nul\u0000"}` | `7bbff8a24574976c67c147f315e5eebf051f7db5c319524ec03fcecaf8acb808` |
| V6 trailing source LF | `{\n  "a": 1\n}\n` | `{"a":1}` | `015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862` |
| V7 array/literals | `{"v":[3,true,null,"x"]}` | `{"v":[3,true,null,"x"]}` | `77853480388702d19d590a39afb937b13dd95419a38d99200c3360e07863d9d7` |
| V8 scalar key order | `{"😀":1,"":2}` | `{"":2,"😀":1}` | `cddbdeacace14eb6923e88dfafb2a3e7df21ec908682f50a886b7b9567692d02` |

> **V8 warning:** the first key of V8 is U+E000, an invisible private-use character (raw canonical hex `7b22ee8080223a322c22f09f9880223a317d`). Most editors render it as nothing — never retype or hand-edit this row; copy bytes exactly, or the golden vector silently corrupts.

V8 is intentionally different from UTF-16 code-unit ordering: U+E000 sorts before U+1F600 under this contract.

## 3. Executable resolution and argv-only adapters

### 3.1 Closed executable allowlist

Live mode has exactly two child-process executable identities:

| Adapter | Startup source | Resolution and allowlist rule |
| --- | --- | --- |
| `substrate.observe.v1` | `substrateBinary` | The supplied absolute path is resolved once with `realpath`; it MUST be an executable regular file named `fkst-framework`. The exact canonical path plus startup file identity `(device, inode, size, mtime_ns)` is retained. |
| `github.gh.v1` | `ghBinary` | The supplied absolute path is resolved once with `realpath`; it MUST be an executable regular file named `gh`. The exact canonical path plus startup file identity is retained. |

No `PATH` search, shell lookup, alias, wrapper name, request-supplied path, environment override, or fallback candidate is allowed. Before each spawn, the executable is restatted and MUST match its retained canonical path and file identity; otherwise the call fails with `executable_changed`. Fixture mode resolves and spawns neither executable.

The substrate adapter has one command shape only:

```text
<substrateBinary> observe --durable-root <durableRoot> --json --limit 1000
```

The BFF MUST NOT open `delivery.redb`, touch `/tmp/fkst-observe-*.sock`, create `durableRoot`, invoke `run`, or expose an engine mutation.

The GitHub adapter owns all `gh` argv construction. Its public typed methods are exactly:

```text
resolveActor()
readRepository()
listIssues(pageCursor, pageSize)
listPulls(pageCursor, pageSize)
readIssue(number)
listIssueComments(number, pageCursor)
readPull(number)
listPullIssueComments(number, pageCursor)
listPullReviewComments(number, pageCursor)
listPullReviews(number, pageCursor)
readCheckRollup(number)
readCollaboratorPermission(login)
readOrganizationMembership(login)
readLabel(name)
createEnabledIssue(input, requestId)
```

Every method selects a code-owned `gh api` template whose method is GET except `createEnabledIssue`, which uses one POST to `repos/<owner>/<repo>/issues`. Owner, repo, numeric entity ID, page cursor, and page size are separately validated values inserted into fixed argv positions. There is no method accepting arbitrary argv, endpoint text, HTTP method, GraphQL, extension, alias, shell fragment, or a second repository.

`createEnabledIssue` sends a canonical JSON object on stdin through `gh api --method POST repos/<owner>/<repo>/issues --input -`. That one GitHub request contains `title`, `body`, `labels: [startupConfig.labels.enabled]`, and either the validated `milestone` or no milestone member. It MUST NOT create first and label in a second request.

### 3.2 Exec adapter interface

All processes pass through one injected interface:

```text
ExecAdapter.run(ExecRequest) -> Promise<ExecResult>

ExecRequest {
  adapter_id   : "substrate.observe.v1" | "github.gh.v1"
  executable   : internally allowlisted canonical path
  argv         : readonly array of strings
  cwd          : internally selected canonical directory
  env          : exact allowlisted environment map
  stdin_bytes  : Uint8Array | null
  timeout_ms   : positive integer
  stdout_cap   : positive integer bytes
  stderr_cap   : positive integer bytes
}

ExecResult {
  exit_code        : integer | null
  signal           : string | null
  stdout_bytes     : Uint8Array
  stderr_bytes     : Uint8Array
  timed_out        : boolean
  stdout_truncated : boolean
  stderr_truncated : boolean
  duration_ms      : non-negative integer
}
```

The implementation MUST use a no-shell primitive equivalent to Node `spawn`/`execFile` with an argv array and `shell: false`. Timeout or either output-cap breach kills the child process group, waits for exit, discards the result as authority, and returns a typed adapter error. UTF-8 decoding is strict for JSON authority bytes; invalid UTF-8 is `upstream_invalid`, not replacement text. Stderr is diagnostic only and never parsed as authority or returned publicly.

| Operation | Timeout | stdout cap | stderr cap | stdin cap |
| --- | ---: | ---: | ---: | ---: |
| substrate observe | `5000 ms` | `1048576` bytes | `65536` bytes | `0` |
| GitHub actor/repo/permission/label probe | `10000 ms` | `262144` bytes | `65536` bytes | `0` |
| GitHub list page | `15000 ms` | `4194304` bytes | `65536` bytes | `0` |
| GitHub entity/comments/reviews/checks read | `20000 ms` | `8388608` bytes | `65536` bytes | `0` |
| GitHub create-enabled-issue | `30000 ms` | `1048576` bytes | `65536` bytes | `16384` bytes |

Substrate receives only `LANG=C.UTF-8`, `LC_ALL=C.UTF-8`, and `NO_COLOR=1` in addition to the minimum process-runtime variables required by the operating system. GitHub receives only those variables plus `GH_CONFIG_DIR=<humanGhConfigDir>`, `GH_PROMPT_DISABLED=1`, `GIT_TERMINAL_PROMPT=0`, and `PAGER=cat`. Inherited `GH_TOKEN`, `GITHUB_TOKEN`, `GH_HOST`, editor variables, and proxy overrides are stripped. The BFF never sets `FKST_GITHUB_WRITE`.

## 4. Frozen v1 route descriptors

Every API route requires the session and same-origin checks in section 6. GET routes accept no request body; a positive `Content-Length`, a present `Transfer-Encoding`, or any received body byte is `400 body_not_allowed`. The maximum request-target length is `2048` bytes. Route output is capped at `8388608` bytes; exceeding it yields an unknown envelope rather than a truncated JSON document.

| Method and route | Authority and artifact | Live mode | Fixture mode | Request body limit |
| --- | --- | --- | --- | ---: |
| `GET /api/v1/health` | BFF process/integrity report, artifact `fkst.bff.health.v1`; it is operational metadata, never engine or GitHub business authority | available | available | `0` |
| `GET /api/v1/config` | retained validated startup `devbored.config.v1`, artifact `devbored.config.v1`; returns `config_version`, `config_digest`, config object, mode, `config_file_state`, and write posture, but no local paths or auth material | available | returns the fixture launch's validated config and a recorded-data mode marker | `0` |
| `GET /api/v1/connections/local/engine` | direct validated stdout of the one substrate `observe --json` command, artifact `fkst.delivery.observe.v1`; engine-delivery facts only | available | recorded engine fixture only | `0` |
| `GET /api/v1/github/board` | GitHub issue/PR metadata plus trusted `fkst:devbored:*` and debate-evidence comments after admission/projection, artifact `fkst.devbored.github-board.v1`; GitHub is durable business authority | available | recorded GitHub fixtures only | `0` |
| `GET /api/v1/github/issues/:number` | the allowlisted repository's issue, all bounded issue-comment pages, trusted marker projection, and complete/partial debate evidence, artifact `fkst.devbored.github-issue.v1` | available | matching recorded fixture or `404` | `0` |
| `GET /api/v1/github/pulls/:number` | the allowlisted repository's PR, issue comments, review comments, reviews, check rollup, trusted marker projection, and linked debate evidence, artifact `fkst.devbored.github-pull.v1` | available | matching recorded fixture or `404` | `0` |
| `POST /api/v1/github/issues` | one GitHub create-issue request containing the exact startup enabled label, artifact `fkst.devbored.github-issue-create.v1`; resulting GitHub issue URL/number is the receipt | available only when every write gate is open | registered but always `403 fixture_write_disabled` and never spawns | `16384` bytes |

No other `/api/v1` method or path exists. Unsupported methods return `405 method_not_allowed` with an exact `Allow` header; unknown paths return `404 route_not_found`. Static UI paths are outside the API registry and support GET/HEAD only.

`GET /api/v1/github/board` accepts only `limit` and `cursor` query members. `limit` is a canonical decimal integer `1..100`, default `50`; `cursor` is an opaque base64url string `1..512` bytes previously emitted by the BFF. Repeated or unknown query members are rejected. One refresh scans at most `500` GitHub candidates and emits a cursor/partial reason if more exist.

`:number` is a canonical positive decimal integer `1..2147483647` with no sign or leading zero. Detail routes accept no query members. Each comment/review collection follows GitHub pagination until completion, `1000` records, or `8388608` upstream bytes, whichever occurs first. Each comment body is capped at `65536` UTF-8 bytes. A body or collection over its cap is marked partial; truncated content MUST NOT be parsed as a marker or debate argument. Inaccessible entities are `404 entity_not_found` only when GitHub authoritatively returns not-found; auth, rate-limit, timeout, and pagination failures remain `unknown`, never an empty entity.

The POST requires `Content-Type: application/json` with optional `charset=utf-8` and rejects content encoding. Its strict body is:

```text
CreateEnabledIssueV1 {
  title     : string, 1..256 Unicode scalar values and <= 1024 UTF-8 bytes
  body      : string, 0..8192 UTF-8 bytes
  milestone : null | positive safe integer
}
```

Unknown or duplicate keys are rejected. If startup `intake.milestones` is non-empty, `milestone` MUST be one of those numbers. If it is empty, `milestone` MUST be `null`. The request also requires `X-FKST-Request-Id`, a lowercase canonical UUID v4. The BFF retains up to `256` request IDs for the process lifetime:

- same ID and same SHA-256 of canonical request body returns the original success receipt without a second GitHub call;
- same ID with a different body returns `409 idempotency_conflict`;
- an in-flight duplicate waits for the first result;
- a timed-out or transport-ambiguous first attempt is retained as `ambiguous` and later duplicates return `409 ambiguous_write` until an operator verifies GitHub and restarts; the BFF never blindly retries a write.

## 5. Common error and freshness envelopes

Every API response, including errors, is JSON plus one LF and uses this exact outer shape:

```text
BffEnvelopeV1<T> {
  schema            : "fkst.bff.envelope.v1"
  request_id        : lowercase UUID v4 generated by the BFF
  mode              : "live" | "fixture"
  authority         : "bff" | "startup-config" | "substrate" | "github"
  artifact          : route-specific artifact string from section 4
  config_version    : positive safe integer
  config_digest     : "sha256:<64 lowercase hex digits>"
  config_file_state : "unchanged" | "changed" | "unreadable"
  availability      : "available" | "unavailable" | "unknown"
  freshness         : FreshnessV1
  partial           : PartialV1
  data              : T | null
  error             : BffErrorV1 | null
}

FreshnessV1 {
  acquired_at        : RFC3339 UTC instant with millisecond precision | null
  source_generated_at: RFC3339 UTC instant with millisecond precision | null
  evaluated_at       : RFC3339 UTC instant with millisecond precision
  snapshot_age_ms    : non-negative safe integer | null
  stale_after_ms     : non-negative safe integer | null
  state              : "fresh" | "stale" | "recorded" | "unknown"
  basis              : "source_generated_at" | "acquired_at" | "fixture_captured_at" | "none"
}

PartialV1 {
  is_partial   : boolean
  reasons      : readonly array of "candidate_cap" | "pagination_cap" | "output_cap" | "inaccessible_entity" | "rate_limited" | "invalid_entity" | "incomplete_evidence"
  omitted_count: non-negative safe integer | null
}

BffErrorV1 {
  code      : stable lowercase snake_case string
  message   : safe operator-facing string
  retryable : boolean
}
```

Freshness thresholds are `5000 ms` for health, `10000 ms` for engine, `300000 ms` for GitHub reads, and `null` for the immutable config. Engine age uses the validated ledger `generated_at_ms`; GitHub age uses the time the complete projection was acquired; fixture responses use the fixture's required `captured_at` and always have `state = "recorded"`. A source timestamp more than `5000 ms` in the future makes freshness `unknown` with `clock_skew`; it is never clamped to zero.

`availability = "available"` requires non-null `data` validated against the route artifact. `unavailable` is reserved for an authoritative known absence such as substrate exit `2` indicating no readable ledger; it has `data = null`. `unknown` is used for unreachable, invalid, timed-out, rate-limited, config-changed, or incomplete authority and requires `data = null` plus a non-null error. A partially available GitHub page may retain data only when each included entity is independently complete and `partial.is_partial = true` identifies omissions; incomplete debate evidence itself never becomes a complete debate.

The unknown-is-never-zero rule is structural:

- unknown timestamps, ages, counts, budgets, and omitted counts are `null`, never `0`;
- an empty list or count `0` is valid only after a complete authoritative read proves emptiness;
- truncated collections carry an explicit lower-bound discriminator in route data and MUST NOT be presented as exact counts;
- unreachable engine/GitHub reads MUST NOT reuse cached zeroes or fixture values; and
- health freshness MUST NOT be used as GitHub freshness or business health.

Required public error mappings are:

| HTTP | Codes |
| ---: | --- |
| `400` | `invalid_request_target`, `body_not_allowed`, `invalid_query`, `invalid_entity_number` |
| `401` | `session_invalid` (used identically for a missing or incorrect token) |
| `403` | `origin_forbidden`, `host_forbidden`, `writes_disabled`, `fixture_write_disabled`, `actor_forbidden`, `author_policy_forbidden` |
| `404` | `route_not_found`, `entity_not_found` |
| `405` | `method_not_allowed` |
| `409` | `idempotency_conflict`, `ambiguous_write`, `evidence_config_mismatch` |
| `413` | `body_too_large` |
| `415` | `unsupported_media_type`, `content_encoding_forbidden` |
| `422` | `invalid_body`, `milestone_forbidden` |
| `429` | `github_rate_limited` |
| `500` | `internal_error` |
| `502` | `upstream_failed`, `upstream_invalid`, `output_cap_exceeded`, `clock_skew` |
| `503` | `config_changed`, `write_gate_closed`, `executable_changed`, `github_unavailable` |
| `504` | `upstream_timeout` |

Errors MUST NOT include a token, credential, raw stderr, full command, arbitrary GitHub response body, local absolute path, stack trace, or fixture source path.

## 6. Same-origin listener and the single write guard

### 6.1 One origin and one port

The BFF owns one IPv4 loopback listener at `http://127.0.0.1:8471` unless the manifest selects another allowed port. It serves the boot HTML, all UI assets, and every API route from that listener. The browser uses relative `/api/v1/...` URLs. Port `8472` is not opened, `localhost` and `[::1]` are not alternate origins, and no `Access-Control-Allow-*` header is emitted. Binding failure is startup-fatal; the BFF does not probe or increment to another port.

Every request MUST have an exact `Host` header `127.0.0.1:<startup-port>`. API requests with an `Origin` header require exact equality with the startup origin. POST requires the exact Origin even if a client omits it. `Sec-Fetch-Site`, when present, MUST be `same-origin` or `none`; POST requires `same-origin`. These checks occur before body parsing.

The boot document is generated per request with `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and a CSP limited to same-origin resources. Assets are static but API responses are always `Cache-Control: no-store`.

### 6.2 Per-launch session token

At launch the BFF obtains exactly 32 bytes from the operating-system CSPRNG and base64url-encodes them without padding. It injects the resulting 43-character token only into the generated boot HTML:

```html
<meta name="fkst-session-token" content="<base64url-token>">
```

The UI reads it once and sends `X-FKST-Session: <token>` on every API request. The token MUST NOT appear in a URL, cookie, local/session storage, fixture, log, error, static asset, or response body. API validation uses a constant-time comparison. Missing and wrong tokens are indistinguishable except for the stable public error code; both are rejected before adapters run. Restart invalidates all old pages and tokens.

### 6.3 Preconditions for `POST /api/v1/github/issues`

All of the following MUST be true immediately before spawning `gh`; failure is closed and no write occurs:

1. startup mode is `live`;
2. `--enable-writes` was present; default is off;
3. Host, Origin, `Sec-Fetch-Site`, session token, content type, body, title, milestone, and idempotency checks passed;
4. manifest/config/sidecar bytes and both executable identities still match startup;
5. target repo is exactly the startup `owner/name` on `github.com`;
6. `resolveActor()` under the isolated `GH_CONFIG_DIR` succeeds on this request, normalizes to `expectedHumanLogin`, and does not normalize to `trustedBotLogin`;
7. `intake.authorPolicy` is preflighted: `any` accepts the verified human; `collaborator` requires the repo collaborator-permission API to confirm the actor; `member` requires actor=personal-repo owner or active membership in the owning organization; unknown/hidden/inaccessible results fail closed;
8. when `intake.milestones` is non-empty, the submitted milestone belongs to it; when empty, no milestone is sent;
9. the exact `labels.enabled` exists in the target repo and is the sole submitted label;
10. a successful live GitHub projection acquired within the last `300000 ms` contains at least one trusted, complete fresh-run evidence group whose JSON-number `config_version` independently equals startup `config_version` and whose `config_digest` independently equals startup `config_digest`; and
11. no prior request with this request ID is ambiguous or conflicts.

The two evidence comparisons are separate checks; matching one never compensates for the other. Missing, partial, untrusted, legacy `fkst:github-devloop:*`, wrong-typed, stale, or conflicting evidence keeps the write gate closed. The BFF never writes a bot marker, bot comment, state label, approval, merge, close, engine command, redb record, or `FKST_GITHUB_WRITE` setting.

## 7. Fixture/live separation

Mode is selected once by the startup manifest and cannot change during a process.

| Behavior | `live` | `fixture` |
| --- | --- | --- |
| UI/static routes | served by BFF | served by BFF with persistent `Recorded demo data` banner |
| health/config GET | live process + retained deployment config | fixture process + retained fixture config; freshness is `recorded` |
| engine GET | executes the allowlisted substrate command | reads and validates the named recorded engine fixture; no spawn |
| GitHub GET routes | execute typed `gh` adapter reads; only devbored live protocol is projected | read and validate recorded fixtures; no `gh`; legacy fixture history may render only when explicitly labeled recorded/legacy |
| POST route | conditionally enabled by section 6 | always `403 fixture_write_disabled` before body execution; never hidden behind a fake success |
| Missing/invalid source | unknown/unavailable live envelope; never fixtures | unknown fixture envelope; never live adapters |

Fixture files are startup-enumerated regular files below canonical `fixtureRoot`, may not escape it by symlink, and each carries exact `schema`, `captured_at`, and `artifact` metadata. Fixture bytes are validated by the same projection validators used in live mode. Fixture mode MUST NOT resolve credentials, inspect `GH_CONFIG_DIR`, spawn any child, access the network, or set `writes_launch_enabled` true. Live mode MUST NOT load fixture data as fallback, including after an adapter timeout or rate limit.

Live marker projection recognizes only `fkst:devbored:*` and the frozen debate-evidence v1 schema. Legacy `fkst:github-devloop:*` comments are ignored as live authority. Unknown devbored schemas are surfaced as unsupported/partial rather than guessed.

## 8. Test injection points

Production adapters are constructed explicitly; modules do not capture `child_process`, clock, random, filesystem, or `fetch` globals at import time.

```text
createExecAdapter({ spawnImpl, clock, processKiller }) -> ExecAdapter
createGhAdapter({ execAdapter, ghExecutable, targetRepo, ghConfigDir }) -> GhAdapter
createObserveAdapter({ execAdapter, substrateExecutable, durableRoot }) -> ObserveAdapter
createBff({ registry, startupSnapshot, execAdapter, ghAdapter, observeAdapter,
            clock, randomBytes, fileIntegrityProbe, fixtureStore })
```

`FakeExecAdapter` is an in-memory scripted fake implementing `run`. Each script entry specifies the exact expected `adapter_id`, executable identity, argv array, cwd, environment map, stdin bytes, timeout, and caps, plus a returned `ExecResult` or typed failure. It records calls and fails a test on an unconsumed expectation, extra call, shell string, wrong argv order, wrong cap, unexpected environment member, or spawn in fixture mode. Timeout, signal, invalid UTF-8, stdout/stderr cap, and executable-change tests use this fake; tests never execute a real binary.

`FakeGhAdapter` implements the high-level methods listed in section 3. It returns typed paginated GitHub records/errors and records method arguments. Route/projection tests inject it directly to simulate pagination, rate limits, inaccessible entities, untrusted authors, duplicate/conflicting markers, incomplete debate evidence, actor mismatch, author-policy failures, idempotent replay, and ambiguous writes without coupling tests to CLI JSON.

Adapter contract tests inject `FakeExecAdapter` into the **real** `GhAdapter` and assert the exact fixed `gh api` argv, isolated environment, JSON stdin, timeout, and caps. Handler tests inject `FakeGhAdapter`. End-to-end local tests may use a temporary fake executable only in a test-owned temporary directory and a manifest explicitly marked test-only; production resolution rules remain unchanged.

The clock, CSPRNG, and file-integrity probe are separately injected so freshness boundaries, token rotation, and the permanent changed-bytes latch are deterministic. A test fake MUST NOT be selectable through production request data or production environment variables.

## 9. Route-registry ownership and merge rule

The sole v1 registry module is `local-bff/src/routes/registry.mjs`. It owns the complete `(method, path-pattern)` set from section 4, request-body limits, allowed content types, mode matrix, session requirement, authority/artifact names, freshness threshold, handler binding, and `Allow` headers. The server dispatches only through this registry; handlers MUST NOT self-register or maintain secondary route tables.

The registry and shared `local-bff/src/http/envelope.mjs` error/freshness definitions are PM-owned merge points. Parallel implementation streams may add handlers, adapters, validators, tests, and an exported `RouteContribution` proposal, but MUST NOT edit the registry or common envelope module in their stream commits.

The merge rule is serial:

1. each stream hands the PM its handler plus a descriptor matching one frozen row;
2. the PM verifies method/path uniqueness, mode/body/security metadata, authority, artifact, and envelope conformance;
3. the PM alone adds the descriptor and import to the registry;
4. duplicate method/path, a route absent from section 4, weakened limits, a second envelope, or unresolved merge markers reject the merge; and
5. the registry completeness test compares its normalized descriptors byte-for-byte with the seven frozen descriptors in section 4.

Changing, adding, or removing a v1 route after this freeze requires a PM-owned contract revision and reviewer sign-off before registry integration. A parallel stream cannot win a route conflict by merge order.

## 10. Migration notes and precedent reconciliation

These are refactor notes only; this Phase-0 task changes no implementation.

| Current location/behavior | Phase-1 destination or required migration |
| --- | --- |
| `local-bff/server.mjs` constants, validation, exec, routing, server lifecycle, and inline contract tests | split into `src/config`, `src/canonical-json`, `src/exec`, `src/adapters`, `src/projection`, `src/http`, `src/routes`, and separate tests; behavior is accepted only where this contract retains it |
| hard-coded absolute substrate path and `/tmp/fkst-bff-sandbox` | validated immutable startup manifest paths; durable root must already exist |
| `SERVER_START_ALLOWLIST` with only the engine command | typed observe and GitHub adapters behind the closed executable/operation allowlists in section 3 |
| `execFile` callback in `runObserve` | injected `ExecAdapter`, process-group timeout, strict byte caps, strict UTF-8, typed errors |
| `makeEnvelope`/`publicError` and route-specific ad hoc errors | the single common envelope and public error mapping in section 5 |
| `ALLOWED_ORIGINS`, `applyCors`, API listener on `8472` | removed; one `127.0.0.1:8471`-by-manifest origin serves UI and API with Host/Origin/session checks and no CORS |
| engine-only `handleRequest` | PM-owned seven-entry registry; no handler-local registration |
| startup `mkdir(durableRoot)` | removed; validation is read-only and an absent durable root is startup-fatal in live mode |
| `demo/assets/runtime-api.js` absolute `http://127.0.0.1:8472/...` | relative `/api/v1/...` requests plus `X-FKST-Session` from boot metadata and common-envelope validation |
| `demo/assets/live-runtime.js` engine-specific rendering | retain its honest unavailable/unknown and partial-count ideas, then consume common freshness/artifact fields; no zero for unknown |
| current CORS-based two-port static demo | BFF-served same-origin UI; fixture mode still uses the BFF and cannot spawn or write |
| inline tests selected by `--contract-test` | module-level unit/contract tests using the injection points in section 8 |

Precedent contradictions and their v1 resolution:

1. PM plan section 4 says the config file carries an explicit `config_version`, while binding section 10 says not to introduce a second version field. This contract follows section 10: existing `devbored.config.v1.version` remains the only stored field and is passed through under the evidence/envelope name `config_version`.
2. `packages/packages/devbored/docs/config-contract.md` and the current Lua loader validate required fields but do not reject unknown fields; `fkst-devbored/docs/plan/W0-8-JSON-RULES.md` says authoritative v1 config rejects unknown fields at every defined level. This contract freezes the stricter rejection rule. Phase-1 package/BFF parity tests must expose and resolve the current Lua gap rather than weakening the BFF.
3. The binding plan requires one origin and removal of the `8471/8472` split, while the current BFF and `runtime-api.js` explicitly implement that split and a three-origin CORS allowlist. The current files are migration precedents, not v1 authority; section 6 supersedes their ports and CORS behavior.
4. The current BFF maps substrate exit `2` to a known unavailable ledger and uses `null` snapshot facts, while some UI phrases call this "offline." This contract preserves the data distinction: exit `2` is `availability = "unavailable"`; a successfully validated ledger whose subscriber status is unknown may still be `availability = "available"` with an offline observation mode inside engine data.
5. `CONSOLE-CONTRACTS.md` requires every observed panel to name its artifact/snapshot age and forbids unreachable=`0`; the current engine consumer follows this, but it has no common envelope for GitHub/config/health. Section 5 generalizes that rule across all v1 routes and explicitly prevents health freshness from standing in for GitHub freshness.

There are no unresolved `OPEN-DECISION` items in this contract. Runtime-specific implementation details may vary only where this document does not alter an observable route, authority, security guard, byte algorithm, or limit.
