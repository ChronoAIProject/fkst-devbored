# HG-V1R — v1 rescope gate (bounded console-v1 product cut)

Status: **OPEN — activated by owner receipt, 2026-07-21**
(receipt text: `FKST/PM-PLAN-V2-REFACTOR.md` §0a).
Authority basis: ADR-035 (`docs/08-DECISIONS.md`).
Plan of record: `FKST/PM-PLAN-V2-REFACTOR.md` (Fable+Codex converged,
Codex RECONCILE-VERDICT: ACCEPT, round 4, 2026-07-21).

This is a NEW gate identifier. It deliberately does not reuse HG-01..HG-05:
those authorize tiers of the full-app/v2 Flutter track and are untouched by
this gate. R-039 remains mandatory for HG-02 and every full-app/v2 runtime
path.

## What HG-V1R authorizes

1. Execution of PM-PLAN-V2-REFACTOR.md Phases 0–3, and Phase 4 after its own
   Codex convergence round.
2. The provenance-only baseline commit of `demo/` + `local-bff/` on
   `develop` (as-is, inventoried, before any fix/refactor commits), with the
   recorded caveat that baseline code is not executable authority until
   integrated under the Phase-0 contracts.
3. The protocol decision: devbored-only live surfaces; legacy
   `fkst:github-devloop:*` screens remain clearly-labeled recorded history.
4. The bounded package change and pin path defined in ADR-035.
5. A scripted-lifecycle local deployment (doctor/start/stop/status/restart
   scripts) against a fresh sandbox repo (PM default
   `ChronoAIProject/fkst-devbored-sandbox`, created at S1b earliest; owner
   may veto the name before creation).
6. Exactly one write from the console: create issue + apply the deployed
   config's enabled label, under the full Phase-2 guard set.
7. **Sandbox-scoped GitHub writes by the loop bot** (`FKST_GITHUB_WRITE=1`)
   from Phase 2.1 onward, confined to the fresh sandbox repo, with the merge
   stage held disabled by the frozen config (`docs/v1/DEPLOYMENT.md` §4
   posture table). Merge enablement (config version 2) is HG-V1R.live only.

## What HG-V1R does NOT waive (hard limits, doctrine)

- The FE/console never writes state markers, bot comments, or state labels;
  human interaction is only program-defined legal input (create issue,
  human comment, opt-in label, close own issue).
- No engine control from the console beyond operator-owned scripts; no
  `FKST_GITHUB_WRITE`; no redb/socket access; CLI-only engine reads.
- Exactly one live-sandbox mutator at any time.
- No claim against any full-app/v2 readiness row.

## Sub-gates (serial, fail-closed)

| Sub-gate | When | Closes on |
|---|---|---|
| HG-V1R.pin | after Phase-1 S1a | exact `packages` commit recorded in ADR-035 + the 08-READINESS v1 note; Opus review pass; PM acceptance |
| HG-V1R.live | before any LIVE merge acceptance (Phase 3 stretch) | explicit owner call |
| HG-V1R.close | end of Phase 3 | acceptance dossier: sandbox-write complete run (real GitHub effects, merge held by `merge.enabled=false`), configured-roster + GitHub-reconstructed debate proof, restart resume, write-arc pickup |
| HG-V1R.fe-writes | before any Phase-4 write endpoint exists | frozen Phase-4 effect contract: closed mutation surface, per-write-family default-off flags, receipts, negative tests (plan Phase 4) |

## Execution loop (owner receipt, binding)

Fable is main PM; Codex `gpt-5.6-sol` agents implement; a fresh Opus 4.8
independently reviews every piece; a dev agent failing repeatedly is taken
over by a fresh Fable subagent; every PM→dev handoff states requirements and
acceptance criteria; the PM merges, then PM+Codex jointly review code and
features post-merge; the loop repeats until the owner's feature set is
achieved end-to-end without bugs.

⟦AI:FKST⟧
