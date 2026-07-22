# Council authority and acquisition decision

Status: accepted architecture decision for E8 on 2026-07-22. Fable PM framed the authority questions; a fresh read-only Codex GPT-5.6 Sol arbitration returned `SOL_COUNCIL_DECISION=PASS`. This decision defines the next implementation contract. It is not evidence that live Council acquisition already exists.

## Decision

Council remains a first-class application mechanism. Its accepted business evidence is a complete machine-readable record written by the public devloop producer into a trusted GitHub comment on the relevant Workflow issue or pull request. The console validates and projects that record read-only; it does not deliberate, recompute outcomes, persist Council state, or write Council evidence.

The authority chain is:

```text
Council mechanism decides
  -> public devloop emits a versioned record
  -> trusted GitHub comment is the accepted durable artifact
  -> console validates and projects it read-only
```

`fkst-substrate` remains the authority for current delivery facts only. Its queue, dead-letter, subscriber, and in-flight delivery projection can corroborate that a producer event moved through the engine, but it cannot prove an accepted Council decision and never overrides GitHub. A delivery may be acknowledged and disappear; its payload is reduced to generic metadata/digest; therefore the delivery ledger cannot reconstruct Council history.

This preserves exactly two primary FKST integrations:

1. the public devloop supplies Workflow/Council evidence and its GitHub-native accepted artifacts; and
2. `fkst-substrate` supplies read-only Runtime delivery observation.

GitHub and `gh` remain the public devloop's existing transport/tooling seam rather than a third FKST product dependency. Devbored, older consensus packages, and their fixture artifacts remain reference-only and are never a live fallback.

## Source precedence

1. A complete trusted full Council marker group is canonical for decision and contribution evidence.
2. Existing trusted public-devloop `result:v1` and `review-result:v1` records are canonical only for decision fields they actually contain. They produce a partial decision-only Council projection with contribution roster, rationale, and dissent unavailable.
3. In-flight substrate consensus/delivery events are corroborating transport evidence only.
4. Labels, localized prose such as `Verdicts:`, logs, model/persona names, fixture Council data, and devbored artifacts have no live Council authority.
5. Matching duplicate records deduplicate. Conflicting full/legacy records for one lineage are withheld as `council_evidence_conflict`; newest timestamp does not silently win.

GitHub remains canonical until a future substrate API explicitly stores durable accepted business records and a separately approved authority-equivalence/cutover ADR exists. A durable root or a new observe field alone is not a migration trigger.

## Configuration

Live Council acquisition must be explicitly selected through one ephemeral server enum:

```text
--council-source github-markers
FKST_COUNCIL_SOURCE=github-markers
```

It reuses `FKST_SANDBOX_REPO`, `FKST_BOT_LOGIN`, and `FKST_GH_BIN`. There is no second Council repository, trusted-author list, executable, database, browser-storage setting, roster authority, or mutable console control-plane file.

Without the explicit source, the current result remains:

```json
{
  "availability": "unavailable",
  "reason": "council_source_not_configured",
  "value": null
}
```

## Projection envelope

The console owns `fkst.console.council-evidence.v1`, a provenance-preserving read envelope containing:

- `availability`, `partial`, and `reason`;
- repository, entity kind/number, stable comment database ID/URL, normalized trusted author, timestamp, completeness, and source marker schema;
- proposal ID, lineage, phase, round, recorded outcome/mode/agreement/threshold/approval/total facts; and
- contribution seat ID, execution status, verdict, stance, and bounded opaque evidence reference when those fields exist in a complete producer record.

Unknown or unavailable values are null, never inferred from prose or converted to zero. The console validates producer-recorded consistency but does not calculate a different outcome from seat verdicts.

The future full producer contract belongs to the public devloop and requires a versioned decision marker plus same-comment contribution markers bound to one proposal, lineage, phase, and round. Seat IDs must be unique and bounded; the valid contribution count must equal the producer-recorded total. Changing/deploying that producer contract is outside this repository and remains human-gated.

## Trust and failure semantics

Admission order is binding:

1. query exactly the configured repository through the existing fixed-argv GitHub reader;
2. require complete entity/comment pagination;
3. normalize and filter the configured trusted author before scanning any body;
4. bind evidence to repository, entity, proposal, lineage/dedup identity, and phase;
5. bind PR review evidence to its issue proposal and current head identity;
6. require stable comment identity plus timestamp;
7. validate the whole recognized marker group before admitting any contribution; and
8. ignore unknown schemas and count untrusted comments only as diagnostics.

Failure states are distinct:

- source absent -> `unavailable/council_source_not_configured`;
- repository or trusted bot absent -> existing GitHub configuration reason;
- GitHub timeout/rate/shape failure -> `unknown`, never an empty ledger;
- incomplete pagination -> partial and affected evidence withheld;
- complete scan with no Council marker -> available empty collection;
- untrusted or unknown marker -> ignored;
- recognized malformed group -> partial/unknown `council_evidence_malformed`; and
- full/legacy disagreement -> `council_evidence_conflict`, neither selected.

Missing substrate configuration or durable state does not make valid GitHub Council evidence unavailable.

## Implementation boundary

The current code may next implement an explicitly partial, read-only GitHub Council projection from trusted existing `result:v1` intake evidence and already validated `review-result:v1` review evidence. The UI label must say that decision evidence is available while contribution roster and dissent are unavailable for legacy records.

It must not parse localized prose, manufacture seats from reference source defaults, infer rationale/dissent, reuse fixture Council data in live mode, create a Council POST route, add a database/executable, or initialize/read substrate durable state for Council.

The existing sole mutation remains the separately guarded issue-admission operation. Future Council marker production belongs to the public devloop's own adapter/locking/dedup/CAS path. Producer schema changes, deployment, real marker emission, Console-triggered Council execution/reruns, roster/policy editing, and any Council write remain human-gated.

## Acceptance gates

Implementation cannot claim full live Council until tests cover unconfigured, complete-empty, partial legacy intake/review, full three-seat decision with recorded dissent, trust normalization, forged-author rejection, malformed/conflicting groups, stale PR head, pagination truncation, deduplication, GitHub failure, substrate independence, UI state distinctions, and the absence of new write/database/devbored/executable surfaces.

A real trusted sandbox record from the pinned public devloop is required before raising the claim from contract-tested to live. A full seats-and-dissent claim additionally requires the pinned public devloop to emit and document the full versioned producer record.
