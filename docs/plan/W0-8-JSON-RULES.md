# W0-8 - Canonical JSON rules

> **Historical Step-0 evidence.** The current package validator and fixtures
> remain authoritative; see [`docs/spec/04-DATA-CONTRACTS.md`](../spec/04-DATA-CONTRACTS.md).

Status: **frozen for the W0 corpus-backed subset**
Contract version: `contracts/v1` (`FROZEN-PARTIAL`)
Date: 2026-07-20

These rules govern `DevboredConfig`, `ConsensusProposal`, and
`ConsensusResult` in the pure Dart package at `contracts/`. Marker comments are
not JSON; their separate byte-canonical grammar is implemented by the marker
types and documented in the W0-7 source map.

## Encoding and document shape

1. Input JSON bytes are UTF-8. A byte-order mark is not emitted. Invalid UTF-8
   must be rejected by the adapter before a contract parser is called.
2. Each input is one complete JSON document. Truncated input, trailing tokens,
   or a non-object top level is rejected.
3. Object key order is **not significant when reading**. A parser must select
   fields by key, never by textual order.
4. `toJson()` uses the field order shown by the corpus for deterministic debug
   output, but that order carries no meaning and is not an integrity mechanism.
5. Array order **is significant**. In particular, configured seats, proposal
   angles, and result angle records preserve participant/emission order.
6. JSON strings are decoded according to JSON escaping. Marker HTML-entity
   escaping does not apply to JSON fields.

## Unknown fields

| Contract | Rule | Reason |
| --- | --- | --- |
| `devbored.config.v1` | **REJECT** unknown fields at every defined object level | Configuration is authoritative input. A typo or a writer from a newer schema must not be silently accepted under `v1`; schema/version advancement is the compatibility mechanism. Dynamic keys inside `labels.state` and `labels.priorityClasses` are data, not unknown contract fields. |
| `consensus.proposal.v1` | **IGNORE** unknown fields | This is an observed upstream payload. Additive producer metadata must not take the console offline; all known required fields remain strictly validated. Ignored fields are not retained or re-emitted as authority. |
| `consensus.consensus_reached.v1` | **IGNORE** unknown fields | Same observed-payload rule. The console validates the known reached-result control fields and discards unrecognized additions. |

Ignoring an unknown observed field never permits a missing, wrong-typed, or
invalid known field. An unknown schema discriminator is always rejected.

## Numbers and versions

- JSON numeric contract fields for versions, rounds, counts, milestone IDs,
  and timeouts are integers, never floating-point numbers or numeric strings,
  unless the published seam explicitly says otherwise.
- `DevboredConfig.version`, milestone IDs, `maxRounds`, and `timeoutSeconds`
  are positive JSON integers. Boolean values are not integers.
- The marker wire format is text, so marker `version`, `stage_rank`, `round`,
  and `pr` attributes use canonical unsigned decimal strings. Dart exposes
  them as `int`. Zero is allowed only where the marker contract says
  non-negative; signs, whitespace, decimal points, exponents, and leading
  zeroes are rejected.
- The observed sibling consensus seam is the explicit exception:
  `effect_version` is JSON string `"7"` in both slice fixtures because the Lua
  builder emits `tostring(config.version)`. Dart validates it as a canonical
  positive decimal string, exposes it as `int`, and re-emits a decimal string.
- Config rollback protection compares integer values. A read with
  `version < previousVersion` fails with
  `devbored config error: version moved backward`; equal and greater versions
  are accepted after all other validation succeeds.

## Strings, arrays, and null

- Required strings must have the exact constraints in the source map. No
  parser trims or normalizes contract text.
- Config seat arrays contain 1 through 4 distinct marker-safe names and retain
  order. Proposal angles contain 1 through 4 non-empty single-line strings and
  retain order. Reached result angles are distinct and retain order.
- `intake.milestones: []` is an explicit unrestricted list, not an omitted
  default. Other required arrays cannot be replaced with `null`.
- Missing and `null` are rejected for every currently implemented required
  field. Nullable console projection fields described in `docs/05` are not in
  the W0 Dart implementation yet.

## Instants

- Instants are ISO-8601 strings with an explicit UTC `Z` or numeric offset.
- Parsers must reject timezone-free timestamps and impossible calendar values.
- Parsed instants are normalized to UTC for comparison. Serialization uses UTC
  ISO-8601 with `Z`; source text may be retained separately only as provenance.
- No current W0 config/proposal/result field is an instant. This rule is frozen
  now so later corpus-backed observed types do not introduce epoch/locale
  ambiguity. Fields such as `updated_at` that helped an upstream producer
  derive `dedup_key` are not reconstructed from the dedup string.

## Canonicality and integrity

JSON key ordering and whitespace are not byte authorities. Integrity checks,
deduplication, and compare-and-swap operations must operate on their specified
semantic keys or explicitly defined source bytes, never on a locally
reformatted JSON string. By contrast, marker comments are intentionally
byte-canonical: parse then build must reproduce every marker fixture exactly.

## Fixture policy

`contracts/test/round_trip_test.dart` reads the reference fixtures directly
through the repository-relative sibling path `../packages/...` (resolved from
the console repository root). Fixtures are not copied into `contracts/`.
Keeping one corpus avoids duplicate bytes and makes upstream drift fail the
console tests immediately without a separate checksum manifest.
