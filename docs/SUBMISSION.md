# OpenAI Build Week — submission dossier

Category: **Developer Tools** · Deadline: **July 21 2026, 5:00 pm PT**
(July 22, 08:00 SGT) · Official rules: <https://openai.devpost.com/rules>

## Requirements checklist

| Requirement | Status / where |
|---|---|
| Working software built with Codex / GPT-5.6 | ✅ this repo — recorded model `gpt-5.6-sol` in every build session |
| Public repo **with licensing** (or private + shared with `testing@devpost.com` and `build-week-event@openai.com`) | ✅ public, [Apache-2.0](../LICENSE) |
| README describing Codex collaboration, where it accelerated, where key decisions were made | ✅ [README → "How Codex built this"](../README.md#how-codex-built-this) |
| Installation / testing instructions (judges must run it without rebuilding) | ✅ [README → run](../README.md#the-console-recorded-demo) + [demo/README.md](../demo/README.md); no build step, two commands |
| Existing-project rule: clearly identify work added during the submission window (from Jul 13), timestamped | ✅ the console, BFF, validator, and README were built **2026-07-21** (session roster below); pre-window work is the contract kernel, labeled as such in the README |
| **`/feedback` Codex Session ID** for the primary thread | ⬜ owner action — see below |
| Demo video: **< 3 min**, public (YouTube etc.), shows the project working, audio explains how Codex/GPT-5.6 were used | ⬜ owner action — script = the 5-beat walk in [demo/README.md](../demo/README.md) |
| Devpost form: category, description, repo URL, video URL, session ID | ⬜ owner action |
| Personal eligibility (age, jurisdiction, employment/conflicts) | ⬜ owner confirms |

## `/feedback` Session ID

**Recommended primary session:** `019f8484-93cd-7951-9991-28b1eb0655a1`
(stream *w2-unify* — the largest single Codex thread of the build; it executed
the whole-console unification wave across every page: single chrome/nav/banner
system, persona-readability pass, contrast/palette normalization, robustness
fallbacks.)

To submit: `codex resume 019f8484-93cd-7951-9991-28b1eb0655a1`, run
`/feedback`, and verify the returned Session ID before the deadline.

**Honesty note (stated in the README as well):** this project was deliberately
built as a **multi-session harness** — many Codex sessions with frozen
interfaces between them, in the spirit of Symphony. No single thread contains
a strict majority of the code; *w2-unify* is the largest single-thread
contribution to the final product. The complete roster is disclosed below so
judges can audit the full build rather than one window into it.

### Full build-session roster (2026-07-21, model `gpt-5.6-sol`, cli 0.144.6)

| Session ID | Stream | What it built |
|---|---|---|
| `019f8484-93cd-7951-9991-28b1eb0655a1` | w2-unify | **primary** — whole-console unification: chrome, nav, persona glosses, self-test readability |
| `019f84cb-2a73-7552-b708-0b30ad2063b3` | w3a-reader | trusted marker reader; faithful `transition_version` port + 51-case parity corpus |
| `019f846b-bbca-7b43-8a25-a822888796e0` | r2c-validator | strict `validateSeatEvidence` / `validateRoundFact`; black-box self-check |
| `019f8441-3444-7493-92fc-2de0be469fd2` | s2-council | council sandbox (contract-driven authoring) |
| `019f8441-3444-74f1-8729-471f888f1e1b` | s1-validator | contract validator + 55-case self-test |
| `019f846b-bbd1-7ab3-b9f7-4c21651e8a76` | r2a-authority | trust gates, policy-owned authority, CAS repairs |
| `019f8441-3444-70d3-8479-20f8d564ebd2` | s5-fixtures | fixture sanitization + contract copies |
| `019f84cb-2a73-7113-94e9-78f784a5647f` | w3c-bff | BFF availability/observation-mode + truncation honesty |
| `019f8441-3444-7263-ad7a-da74d75b59c3` | s4-debate | who-decided screen (recorded consensus) |
| `019f846b-bbed-77a1-834f-60db25177328` | r2b-board | board truthfulness rebuild (fixture-rendered) |
| `019f84cb-2a73-7cd1-ba5d-d48fa670d437` | w3b-board | board shared-reader adoption + state vocabulary |
| `019f846b-bbf4-7510-b475-81bd4230c727` | r2e-bff | loopback engine-snapshot BFF (initial) |
| `019f846b-bbf3-7c42-815d-97ca8012547e` | r2d-sandbox | preview gating + subset disclosure |
| `019f84cb-2a73-7320-a504-d741fd27832b` | w3d-council | council render-path fixes |
| `019f84cb-2a73-75c3-9417-8fe13d4c9b67` | w3e-chrome | index catalog, scoped honesty claims |
| `019f8441-3444-74c0-9440-8f28784fe729` | s3-evidence | evidence-chain screen (initial) |
| `019f8441-3444-7e71-baf5-752bce7d336d` | s9-nav | shared banner/nav + route rewire |

Codex additionally served as an adversarial **reviewer** in separate sessions
(scope-dossier RETURN with 8 blocking fixes; round-close review that found 5
latent semantic faults) and argued three seats of the recorded naming
deliberation. Session rollout files live under the local Codex home
(`~/.codex/sessions/2026/07/21/`).

## Submission form values (copy-paste)

- **Project name:** FKST Devbored
- **Category:** Developer Tools
- **Repo URL:** <https://github.com/ChronoAIProject/fkst-devbored>
- **Elevator:** A lean harness for Codex dev loops — the loop does the work,
  a configurable council decides, GitHub carries the evidence durably, and a
  no-build HTML console renders it honestly (markers = fact, labels = hints,
  unknown ≠ zero).
- **Video URL:** _(owner fills after upload)_
- **`/feedback` Session ID:** _(owner fills after running /feedback)_
