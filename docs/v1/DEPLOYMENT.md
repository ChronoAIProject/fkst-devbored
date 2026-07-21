# v1 deployment + sandbox strategy freeze (Phase 0, PM-owned)

Status: FROZEN pending owner vetoes on the OPEN-DECISION items.
Authority: PM-PLAN-V2-REFACTOR.md §4 Phase 0; ADR-035; HG-V1R.
Normative config identity: `config_version` is the exact serialized value of
this document's `version` field (no second version field exists anywhere).
The canonical-byte digest algorithm and its golden vectors have exactly ONE
normative home: `CONTRACT-BFF.md` §2 — this file and the debate-evidence
contract reference it and never redefine it.

## 1. The frozen v1 `devbored.config.v1` document

Per `packages/packages/devbored/docs/config-contract.md` (loader is
fail-closed; no defaults; version CAS; atomic temp-file+rename writes —
the same seam the Phase-4 config editor will drive).

```json
{
  "schema": "devbored.config.v1",
  "version": 1,
  "labels": {
    "prefix": "devbored:",
    "enabled": "devbored:enabled",
    "claimed": "devbored:claimed",
    "state": {
      "thinking": "devbored:thinking",
      "ready": "devbored:ready",
      "implementing": "devbored:implementing",
      "awaiting-pr": "devbored:awaiting-pr",
      "pr-open": "devbored:pr-open",
      "reviewing": "devbored:reviewing",
      "merge-ready": "devbored:merge-ready",
      "merging": "devbored:merging",
      "fixing": "devbored:fixing",
      "impl-failed": "devbored:impl-failed",
      "blocked": "devbored:blocked",
      "merged": "devbored:merged"
    },
    "priorityClasses": {
      "expedite": "devbored:priority-expedite",
      "normal": "devbored:priority-normal"
    }
  },
  "intake": {
    "requireEnabledLabel": true,
    "milestones": [],
    "authorPolicy": "collaborator"
  },
  "stages": {
    "design": {
      "enabled": true,
      "seats": ["product-fit", "architecture", "security", "delivery-cost"],
      "agreement": "majority",
      "budgets": { "maxRounds": 3, "timeoutSeconds": 3600 }
    },
    "review": {
      "enabled": true,
      "seats": ["correctness", "test-adequacy", "scope", "security"],
      "agreement": "unanimous",
      "budgets": { "maxRounds": 3, "timeoutSeconds": 3600 }
    },
    "implement": {
      "enabled": true,
      "model": "gpt-5.6-sol",
      "effort": "high",
      "localTestCommand": "npm test --silent"
    },
    "merge": {
      "enabled": false,
      "requireCiGreen": true,
      "requireHeadBoundApproval": true,
      "targetBranch": "main"
    }
  }
}
```

Notes, binding on implementers:

- **This document is complete — no moving identity** (round-6 correction).
  The state-label map is **exhaustive**: it covers exactly the 12-state
  vocabulary in `packages/packages/devbored/markers.lua:5-18`
  (`state_stage_rank`); terminal states are `merged`, `impl-failed`,
  `blocked` (`markers.lua:20-24`). Adding any state to the package is a
  config `version` bump plus a map entry — never a silent default.
- **`merge.enabled` is `false` in version 1 by design**: the loop runs real
  GitHub effects up to and including `merge-ready` and **holds there**,
  because the merge stage does not execute. Enabling merge is a config
  `version` 2 bump made only under gate HG-V1R.live. This is how "safe real
  effects, merge held" is expressed as a host/config fact, not a code mode.
- **Seed project (frozen)**: a self-contained Node.js utility library
  (~200 lines) with a Jest test suite, committed at sandbox bootstrap;
  `implement.localTestCommand` is `npm test --silent` against it.
- **Config identity**: `version` above is the serialized `config_version`.
  `config_digest` is computed with the CONTRACT-BFF.md §2 canonical-byte
  algorithm over this exact document at **Phase-0 close (P0-CLOSE)** and
  recorded here in an appended "Frozen identity" line before Phase 1
  dispatch. S1a/S2 build against that recorded identity.
- **Label prefix `devbored:` is deliberate protocol isolation** — it shares
  nothing with the legacy `fkst-dev:*` label family, so legacy history can
  never be re-admitted by the promoted runtime and the console's write applies
  a label the legacy loop ignores.
- Seats are 1–4 marker-safe names, roster order preserved (loader-enforced).
  Names follow the persona-readability rule: literal engineering roles; the
  console displays each with a plain-English one-liner.

## 2. Identities (OPEN-DECISION defaults — owner may veto until S1b compose)

| Role | Default | Rule |
|---|---|---|
| Loop bot (`FKST_GITHUB_BOT_LOGIN`, trusted marker author) | `ctkm-aelf` | writes markers/labels/PRs; must be repo collaborator |
| Human write actor (console's one write) | `calvintkm` | must differ from bot after `[bot]` normalization (write-gate enforced); must satisfy `authorPolicy: collaborator` |
| BFF write auth context | dedicated `GH_CONFIG_DIR` holding the human actor's token only | isolated so the active `gh` login cannot drift under the server |

OPEN-DECISION: owner may substitute a dedicated bot account for `ctkm-aelf`.
The trust policy fixture and the projection's trusted-actor rule bind to
whatever this table finally says, never to a hardcoded login.

## 3. Sandbox repo strategy

- Name: **`ChronoAIProject/fkst-devbored-sandbox`** (PM default; owner veto
  open until creation at S1b — created then, never earlier).
- Visibility: **private at creation** (reversible; flip public only when/if
  the README needs public evidence links — OPEN-DECISION at Phase 3).
- Default branch `main` = the loop's `merge.targetBranch`.
- Seeded with the **frozen seed project** (binding, same definition as §1):
  a self-contained Node.js utility library (~200 lines) with a Jest test
  suite, committed at sandbox bootstrap; `npm test --silent` is the loop's
  meaningful local gate against it.
- Label provisioning at bootstrap: every label named in §1 is created before
  the loop starts (missing labels are a fail-closed compose error, not a
  runtime surprise).
- **Fresh-only admission**: the repo starts with zero issues; every test
  issue is created during acceptance runs (each acceptance uses its own
  issue). Legacy repo `fkst-packages-testing` is never a target of this
  deployment.
- **One live-sandbox mutator at any time** (HG-V1R hard limit): during
  Phases 2–3 the designated operator stream owns the sandbox exclusively.

## 4. Host environment facts (compose-time; scripted by S1b `doctor`/`start`)

**Write postures (round-6 corrected — real evidence requires real writes):**

| Posture | `FKST_GITHUB_WRITE` | When | What it can produce |
|---|---|---|---|
| No-write effect audit | unset | Phase-1 S1b compose smoke runs | dry-run logs only; makes NO GitHub-evidence claims |
| **Sandbox-write** | `1` (+ `FKST_GITHUB_BOT_LOGIN` set, fail-closed otherwise) | Phase 2.1 onward, on the fresh sandbox only | real trusted comments/labels/PRs — the debate evidence Phase 2/3 require; **merge cannot occur** because `merge.enabled=false` in the frozen config |
| Merge-enabled | `1` + config `version` 2 (`merge.enabled=true`) | only under HG-V1R.live (owner call) | real merges to the sandbox integration target |

| Fact | Value |
|---|---|
| `FKST_DEVBORED_CONFIG` | `<host-root>/config/devbored.config.v1.json` (the §1 document) |
| `FKST_GITHUB_BOT_LOGIN` | per §2 |
| `FKST_GITHUB_WRITE` | per the posture table above |
| Durable root | `~/.fkst-devbored-v1/durable` (never `/tmp`; engine-owned redb) |
| Runtime root | `~/.fkst-devbored-v1/runtime` (scratch) |
| Engine binary | `substrate/target/release/fkst-framework` — TODO(S1b): record SHA-256 + build provenance at compose |
| Package roots | pinned `packages` checkout at the HG-V1R.pin commit (recorded in ADR-035 at the pin gate) |

## 5. Frozen identity (recorded at P0-CLOSE)

**`config_version=1`,
`config_digest=sha256:e93f1cd22dac3ae02c79a11c719daa175476295d82c5c973cf3ee8a8690de6b3`**
— computed per CONTRACT-BFF.md §2 over the §1 document's canonical bytes
(1242 bytes: UTF-8, sorted keys, compact separators; all numbers are plain
integers so no normalization edge applies). Any §1 change invalidates this
line and bumps `version`.

⟦AI:FKST⟧
