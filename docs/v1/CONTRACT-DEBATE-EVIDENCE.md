# Debate Evidence Contract v1

Status: Phase-0 freeze for Phase-1 S1a emission and console reconstruction. The package does not emit this evidence at the time of this freeze.

## 1. Purpose and schema identity

The versioned schema ID is `devbored.debate-evidence.v1`. One record carries one complete consensus group for one proposal round: an ordered roster and every seat's verdict, bounded argument text, and a digest of that exact argument.

Digest-only evidence is invalid. The argument strings themselves MUST be present in the trusted GitHub comment so the debate can be reconstructed without package queues, runtime state, worktrees, logs, or local files.

## 2. Carrier form

Evidence is carried by one regular GitHub issue comment:

- Design evidence is posted to the originating issue.
- Review evidence is posted as a pull-request timeline comment (the Issues API comment for that PR), not as an inline diff review comment.
- The carrier must pass the trusted bot identity and carrier-association rules in `CONTRACT-PROJECTION.md` §5.
- The raw comment body contains exactly one sentinel and exactly one fenced JSON document in this byte layout, with a terminal newline optional:

````text
<!-- fkst:devbored:debate-evidence:v1 -->
```json
{"schema":"devbored.debate-evidence.v1","proposal":"devbored/issue/owner/repo/42/consensus/design","round":1,"roster":["teleology","fidelity","scope"],"config_version":1,"config_digest":"<value produced by CONTRACT-BFF.md>","seats":[{"seat":"teleology","verdict":"approve","argument":"The proposal serves the stated outcome.","argument_digest":"sha256:<64-lowercase-hex>"},{"seat":"fidelity","verdict":"approve","argument":"The implementation matches the requested behavior.","argument_digest":"sha256:<64-lowercase-hex>"},{"seat":"scope","verdict":"abstain","argument":"The remaining scope choice needs clarification.","argument_digest":"sha256:<64-lowercase-hex>"}]}
```
````

The example digest placeholders are illustrative and therefore are not fixture bytes.

The JSON between the fences MUST be one RFC 8259 JSON object, encoded as UTF-8, with no duplicate keys. The emitter MUST produce the compact, single-line member order shown in §3; readers MUST accept insignificant JSON whitespace but reject duplicate keys, invalid UTF-8, a non-object root, extra top-level or seat keys, and more than one evidence sentinel or JSON fence. Human prose outside the exact envelope is forbidden so reconstruction does not depend on Markdown heuristics.

The evidence sentinel is not one of the five Phase-0 package markers enumerated by `CONTRACT-PROJECTION.md`; S1a introduces it. Pre-S1a readers following unknown-schema tolerance ignore it. S1a and the console add a dedicated evidence parser rather than treating its JSON fields as HTML attributes.

## 3. Record shape and field rules

Top-level members are required exactly once and emitted in this order:

| Field | Type and rule |
| --- | --- |
| `schema` | Exact string `devbored.debate-evidence.v1`. |
| `proposal` | Non-empty string, at most 200 UTF-8 bytes, equal to the consensus `proposal_id` for this group. Control characters are forbidden. |
| `round` | Positive JSON integer in canonical decimal form. This is the attempted/emitted consensus round, not a comment sequence number. |
| `roster` | Array of 1 through 4 distinct marker-safe seat IDs in configured order. Each ID matches `^[A-Za-z0-9_.-]+$`. |
| `config_version` | The exact serialized value of the existing `devbored.config.v1` top-level `version` field: a positive JSON integer, not a string. It is copied from that parsed startup config and has no independent counter, default, or second version source. |
| `config_digest` | Exact digest value produced for the startup config by the canonical-config-byte contract in sibling [`CONTRACT-BFF.md`](./CONTRACT-BFF.md). S1a and the console MUST call/port that normative algorithm and golden vectors. This contract intentionally does not redefine the algorithm. |
| `seats` | Ordered array of complete seat records as defined below. |

The existing config schema and numeric `version` are established at `packages/packages/devbored/config.lua:152-157`; the documented JSON field is at `packages/packages/devbored/docs/config-contract.md:7-13`. `config_version` preserves that serialized JSON value. In particular, converting the package's current string-valued `effect_version` back into evidence would violate this contract.

Each `seats` member is an object with exactly these members, emitted in this order:

| Field | Type and rule |
| --- | --- |
| `seat` | Marker-safe seat ID, exactly equal to `roster[index]`. |
| `verdict` | Exactly `approve`, `abstain`, `comment`, or `reject`. |
| `argument` | Non-empty JSON string containing the exact argument accepted for that seat and round; see §4. |
| `argument_digest` | Lowercase `sha256:` followed by 64 lowercase hexadecimal digits, computed over the exact UTF-8 bytes of the decoded `argument`, with no Unicode normalization, newline conversion, trimming, or JSON-escape bytes. |

The argument digest is a corruption/equality check, not a replacement for `argument`. A missing argument, an empty argument, a digest mismatch, or a digest without its argument invalidates the entire group.

## 4. Bounds and overflow behavior

Bounds apply to consensus results before an evidence object or GitHub comment effect is generated:

- Each accepted `argument` is non-empty and at most 2,000 UTF-8 bytes. This matches the current consensus answer cap (`packages/packages/consensus/angle_answers.lua:5-18`) and its byte-counting helper (`packages/libraries/contract/strings.lua:27-29`). The exact already-accepted argument is copied; it is never summarized, trimmed again, normalized, or silently truncated for evidence.
- `roster` contains at most four seats, matching the existing devbored config validator (`packages/packages/devbored/config.lua:45-62`).
- `proposal` is at most 200 UTF-8 bytes.
- After JSON escaping and addition of the exact sentinel/fence wrapper, the entire UTF-8 comment body is at most 16,384 bytes.

Overflow behavior is fail closed. If any per-field bound or the final rendered-comment budget is exceeded, S1a MUST emit no debate-evidence comment, no success/reached/review/merge-ready marker for that group, and no state advancement based on that result; it returns/raises a deterministic `debate-evidence-overflow` failure for retry or operator resolution. Continuation comments are forbidden in v1.

Justification: a single atomic carrier avoids partial multi-comment evidence, and the normal four-seat maximum fits comfortably inside the conservative budget.

### TODO(P0-PROJ-GH-COMMENT-LIMIT): verify the hosted GitHub maximum

GitHub's authoritative REST documentation defines issue/PR timeline comment `body` as a required string and documents `422` validation, but does not state a numeric maximum: [GitHub REST API — Create an issue comment](https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#create-an-issue-comment). Until GitHub publishes or the deployment acceptance probe records an authoritative limit, v1 assumes only 16,384 UTF-8 bytes and enforces that smaller cap client-side. This is a deliberate safety margin, not a claim about GitHub's actual maximum.

## 5. Binding and group identity

Every evidence record is self-contained. No binding field may be inherited from another comment, a marker, an API route, or local configuration.

The group/round identity is the tuple:

```text
(proposal, round)
```

Within that identity, `roster`, `config_version`, and `config_digest` are immutable bindings. Any difference in one of them is a conflict, not a second rendition of the same group.

A usable evidence group also requires a trusted canonical `fkst:devbored:consensus:v1` fact on the same GitHub issue or PR whose `proposal_id == proposal`, integer `round == round`, and ordered `seats` CSV equals `roster`. For review evidence, the proposal identity must bind the same PR/head according to the package's review proposal format; for design evidence, it must bind the same originating issue. A mismatch makes the evidence unusable and fail closed for that group.

The evidence `config_version` and `config_digest` must equal the BFF's immutable startup-config values. A console viewing archived evidence under a different active config may display it as historical, but MUST label the mismatch and MUST NOT present it as evidence for the active run.

## 6. Completeness, duplicates, conflicts, and partial writes

A group is complete only when all of the following are true:

1. One trusted carrier parses fully under §§2-4.
2. `roster` contains 1-4 distinct seats.
3. `seats.length == roster.length`.
4. For every zero-based index `i`, `seats[i].seat == roster[i]`; there are no missing, extra, duplicate, or reordered seats.
5. Every verdict is allowed, every argument satisfies the pre-generation bound, and every argument digest recomputes exactly.
6. All binding fields correlate with the trusted consensus marker and the GitHub carrier entity as required by §5.
7. All GitHub comment pages for that entity were fetched successfully.

Duplicate and conflict rules:

- Multiple byte-identical, fully valid records at the same `(proposal, round)` are idempotent retry duplicates and coalesce to one group. Their comment URLs may all be retained as provenance.
- Multiple semantically identical records with different insignificant JSON whitespace also coalesce after strict parse and field comparison.
- If two otherwise parseable trusted records at the same identity differ in roster, config binding, any seat/verdict/argument/digest, or carrier entity, the identity is `conflicted`; none is selected.
- A trusted evidence sentinel with a parseable `(proposal, round)` but missing or invalid seats makes that identity `incomplete`, even if another comment supplies the missing seats. Readers MUST NOT union or patch partial records across comments.
- A trusted malformed evidence sentinel whose identity cannot be safely parsed degrades debate evidence for that GitHub entity and is surfaced as a bounded diagnostic; it is never ignored as if completeness were proven.

Fail-closed partial-write rule: if only some expected seat arguments reach GitHub, the group is incomplete and the console reconstructs no debate for that round. Existing consensus/review/merge markers may be shown as marker facts, but the UI MUST explicitly say “debate evidence incomplete” and MUST NOT render missing seats as silent absences, summaries, or locally recovered text.

Because v1 uses one comment per complete group and forbids continuations, a successful GitHub comment creation is the only evidence write. S1a MUST read the created comment back, apply trust and strict parse, and verify byte/semantic equality before emitting dependent success markers or advancing state. An ambiguous timeout, `422`, read-back failure, wrong author/association, or mismatched body is not success and fails closed under the package's idempotent effect key.

## 7. GitHub-only reconstruction algorithm

The console reconstructs debate solely from GitHub as follows:

1. Fetch the selected issue or PR and every page of its regular timeline comments using the configured GitHub host/auth context. No package queue, local fixture, BFF disk cache, runtime log, worktree, or substrate file is consulted for debate content.
2. Apply `CONTRACT-PROJECTION.md` §5 trust filtering before inspecting comment bodies.
3. Locate exact v1 evidence sentinels. Parse the fenced JSON strictly under §§2-4; recompute every `argument_digest` from the decoded argument's UTF-8 bytes.
4. Parse trusted canonical consensus markers with `CONTRACT-PROJECTION.md`, then correlate proposal, numeric round, ordered roster, carrier issue/PR, and config binding under §5.
5. Group records by `(proposal, round)`, apply §6 duplicate/conflict/completeness rules, and reject any group affected by partial pagination.
6. For a proposal, sort complete groups by numeric `round` ascending. Within each round, preserve `roster`/`seats` array order exactly. The reconstructed transcript item is exactly `{round, seat, verdict, argument, argument_digest}` plus GitHub comment URL provenance; no generated prose is substituted.
7. If any requested round is incomplete or conflicted, return an explicit incomplete/conflicted reconstruction. Do not splice in fixture text, consensus payload bodies, local files, or a later round's arguments.

“Exact debate” means the ordered verdict and argument strings that were accepted by consensus and committed to GitHub under this schema. Markdown rendering is presentation only; the raw JSON-decoded strings are authoritative.

## 8. Conformance obligations for S1a and the console

S1a must publish package-owned canonical fixtures for at least: one complete design round, one complete review round, all four verdicts, UTF-8 arguments, JSON escaping, maximum-size arguments, digest mismatch, missing seat, reordered seat, duplicate-identical record, duplicate-conflicting record, wrong config version/digest, partial pagination/write, and comment-budget overflow.

Console tests MUST import those future package fixture bytes directly from the pinned package checkout and MUST NOT retype them. This is the same fixture-ownership rule as `CONTRACT-PROJECTION.md` §7. Until S1a exists, no synthetic console fixture can be presented as package parity evidence.

Cross-runtime tests for `config_digest` MUST use the golden vectors owned by sibling [`CONTRACT-BFF.md`](./CONTRACT-BFF.md); this contract neither forks nor paraphrases that canonical-byte algorithm.

## 9. Precedent contradictions resolved by this freeze

1. Current reached payload construction retains only `angle` and `verdict` in `angle_results` (`packages/packages/consensus/core.lua:703-707`), although it separately builds a combined prose `body` (`packages/packages/consensus/core.lua:708-734`). Devbored's reached handlers publish only consensus/state/review markers, so the per-seat arguments are not carried to GitHub (`packages/packages/devbored/core.lua:585-639`; `packages/packages/devbored/departments/review_result/effects.lua:94-110`). This contract requires ordered argument-bearing evidence.
2. Current converge payloads call a field `digest` but set it equal to a bounded reply rather than a cryptographic digest (`packages/packages/consensus/core.lua:631-644`). This contract carries the full bounded argument and a real SHA-256 digest of that exact argument.
3. Current consensus payloads serialize `effect_version` as a string (`packages/packages/consensus/core.lua:741-743`, `packages/packages/consensus/core.lua:800-802`), while `devbored.config.v1.version` is a positive JSON integer (`packages/packages/devbored/config.lua:152-157`). Evidence `config_version` is the latter exact serialized value and introduces no independent version field.
4. Current package marker trust establishes bot-login equality but no carrier-association gate (`packages/packages/devbored/departments/observe_pr/facts.lua:10-15`). Evidence follows the stricter console trust freeze in `CONTRACT-PROJECTION.md` §5; runtime parity must be closed before live acceptance.
