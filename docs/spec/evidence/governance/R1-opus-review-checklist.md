# Wave R1 independent Opus review checklist

Status: **FROZEN FOR R-001/R-004/R-007/R-009/R-012/R-013**

Each task receives a new `claude` / `claude-opus-4-8` session after its Sol
owner reaches `DEV_VERIFIED`. A review session is never reused for another task
or a rework cycle. The reviewer has no implementation authorship and works in
read-only/plan mode.

## Required review input

- exact task id, base commit, artifact commit, and final task-state commit;
- exact Sol agent/provider/model/provider-session metadata from
  [R1-dispatch.json](R1-dispatch.json);
- the complete committed `base..head` diff and both commit objects;
- the current authoritative `full-app/v2` spec and task-map row;
- the task's exclusive/forbidden paths and acceptance packet;
- dependency pin/status evidence and declared downstream executable gates; and
- for R-007/R-009, the standing-Fable semantic advisory plus PM disposition.

## Mandatory checks

1. Pre-review HEAD and porcelain are recorded; post-review HEAD is unchanged
   and porcelain remains clean.
2. Every changed path is inside the task's exclusive roots; there is no shared
   parent file, product/UI/runtime code, dependency edit, manifest/barrel/CI
   edit, or reference-package authority.
3. Each task commit has exactly one matching `FKST-Task`, `FKST-Agent-ID`,
   `FKST-Provider`, `FKST-Model`, and `FKST-Provider-Session` trailer.
4. Before Opus, the task-state is append-only, its top-level state remains
   `DEV_VERIFIED`, and every submission cites the actual artifact commit. A
   packet-required standing-Fable advisory may be recorded truthfully with
   advisory-only authority; it never claims Opus, PM, runtime, or integration
   acceptance.
5. Every JSON parses; the reported commands/results/digests can be reproduced
   from the named sources; bounded output is redacted; dependency before/after
   evidence agrees with current immutable pins.
6. Declarative fixture assertions are labelled as non-executable. Behavioral
   claims are `PLANNED_UNVERIFIED` with an exact downstream task; a missing seam
   remains a gap rather than a fabricated pass.
7. The task-specific acceptance row is completely met, including Fable's Wave
   R1 packet dispositions and the exact two-primary-dependency boundary.
8. The reviewer searches for contradictions, omitted fields, hidden extra
   authority, overclaims, nondeterministic digest recipes, and cross-lane
   ownership leakage rather than relying only on the author's checklist.

## Verdict contract

Return exactly one first line:

```text
OPUS_REVIEW: APPROVE
```

or:

```text
OPUS_REVIEW: CHANGES_REQUESTED
```

Then list requirement-scoped findings with severity, exact file/JSON path or
commit evidence, and required correction. `APPROVE` must include the commands
and results used, clean pre/post facts, reviewed base/head, independence
confirmation, and any residual non-blocking risk. Silence or a stalled session
does not count as review.

After `CHANGES_REQUESTED`, the same Sol owner appends a new implementation and
task-state submission without rewriting history. A different fresh Opus session
reviews the full history and the prior finding dispositions. The main PM may
return an Opus-approved task and independently decides acceptance/integration.

## Post-wave schema addendum

Wave R1 exposed truthful but inconsistent submission/advisory aliases. They are
grandfathered append-only. R2 and later follow
[task-state-contract.v1.json](task-state-contract.v1.json): submissions always
contain `review_cycle`, full `commit`, and `result`; Fable records use
`advisories`; Opus records use `reviews`; and `FABLE_ADVISORY` plus advisory or
PM `RETURNED` are members of the closed transition vocabulary.

⟦AI:FKST⟧
