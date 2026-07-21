# User-experience specification

Status: **AUTHORITATIVE TARGET — FIXTURE UI REQUIRES HG-01; RUNTIME UI REQUIRES HG-02**
Version: `full-app/v2`

Workflows and Council are the product's primary mechanisms, not secondary
settings panels. Visual language follows the settled Linear-shaped guidance in
`docs/06-DESIGN-LANGUAGE.md`, but no mock authorizes a control unsupported by
the integrated package.

## Onboarding and navigation

First-run order is fixed:

```text
Dependencies → Connection → Workflow → Council → Doctor → Start
```

Persistent navigation after setup is grouped by user concern:

```text
FKST
  OPERATE
    Overview
    Work
  DESIGN
    Workflows
    Council
  SYSTEM
    Runtime
    Setup
  Settings

Setup
  Readiness → Dependencies → Connections → Doctor
```

- Selected connection scopes Workflow, Council, Work, Runtime, and Doctor.
- “All connections” is available only for Overview and read-only Work.
- One persistent context bar—not every page independently—identifies the active
  connection, repo, Doctor state, running/next Workflow+Council versions,
  process ownership, and DRY/LIVE posture.
- Setup contains Readiness, dependency pins, Connections, and Doctor as a
  resumable stepper. They are not four competing top-level destinations.
- The primary page action is singular and right-aligned. Destructive or LIVE
  actions require an explicit review screen; secondary refresh/filter actions
  never share their visual weight.
- Until every P0 readiness row in `08-READINESS.md` passes, setup shows a blocking
  readiness report rather than a fake workflow editor or fixture-backed Start button.

## Primary views

| View | Purpose | Real inputs | Actions |
|---|---|---|---|
| Readiness | Prove app coding/runtime prerequisites | readiness evidence | inspect/copy remediation |
| Dependencies/Connection | Pin substrate/devloop and repo/tool contexts | pins + live probes | add/edit/select |
| Workflows | Choose/configure bounded operating path | app Workflow files + accepted runtime evidence | draft/validate/diff/activate |
| Workflow detail | Explain stages, Council assignments, gates/effects | frozen schema + compatibility manifest | inspect/clone supported template |
| Council | Define seats and stage policies | app Council files + accepted runtime evidence | draft/validate/diff/activate |
| Council run | Read actual rounds/decision/dissent | trusted emitted evidence | filter/open provenance |
| Doctor | Authorize exact connection/config revision | live probes | run/copy remediation |
| Overview | Needs-attention across the active mechanism | qualified projections | navigate/refresh |
| Work list/board | Operate issues/PRs by workflow/council state | GitHub + trusted app evidence | filter/group/drill in |
| Detail | Explain a work item end to end | GitHub/git/evidence | open source/human comment |
| Runtime | Delivery/process facts only | substrate observe + owned evidence | refresh/start/stop when legal |
| Settings | Preferences, write guard, diagnostics | app prefs/derived actor | configure/export/purge cache |

Every screen is owned by one feature ViewModel and invokes application use
cases. Widgets never read a file/database, spawn a command, call GitHub, or
interpret a loop transition. Cross-feature navigation passes qualified ids,
not mutable model instances or infrastructure services.

## Workflow experience

Workflow is shown before Start and before the generic work board. The selected
definition exposes:

- schema/id/version/digest, manifest family, and source path;
- supported bounded stages and their order;
- a read-only outcome-route summary, stage-attempt/total-transition/rework-cycle
  budgets, and the exact operator-hold outcomes;
- which stages invoke a Council policy;
- budgets, machine gates, intake, posture effects, and activation timing;
- desired versus runtime-accepted digest;
- semantic diff, validation errors, backup destination, and conflicts; and
- dependency-gated capabilities omitted from this workflow family.

While a loop is running, edits are visibly “Next launch.” Save may stage the
draft, but Accept/Activate is disabled until Stop. The active immutable snapshot
and next desired version are shown side by side; neither is silently replaced.

V1 does not expose a free-form graph canvas. The editor may select/reorder/edit
only what the Step-0 compatibility manifest and integrated package consume.
Unsupported stage kinds or topology do not survive as local-only drafts.

## Council experience

Council answers three product questions:

1. Who is seated for this workflow stage?
2. What decision policy/budget applies?
3. What did each seat actually contribute and what decision followed?

The configuration side shows stable seat ids/names/lenses, bounded rosters,
stage policy assignment, agreement/dissent policy, round/timeout budgets, file
version/digest, diff/conflict/backup, and desired versus accepted state.

The evidence side shows round number, seat, trusted carrier author, bounded excerpt,
verdict/decision/dissent only when structurally emitted, completeness, and
GitHub/provenance links. Empty or missing evidence is unknown/absent.

The Council run explains that approval or changes-requested ends the current
Council stage, while only inconclusive may advance to another bounded round.
Workflow detail shows where changes-requested, CI failure, exhausted attempts,
or round/transition/cycle caps route next; it never implies an unbounded retry.

No persona prompt-body editor, per-seat model/effort selector, semantic score,
or decorative “intelligence” metric ships without a consumed schema and
mechanically derivable evidence.

## Work views

List and board render one canonical qualified entity set. Each row/card shows:

- repo-qualified issue/PR identity and two-line title;
- accepted Workflow id/version/stage or unknown;
- Council policy/decision status or unknown;
- claim holder/mode, label hints/drift, linked issue/PR, head/CI, age or unknown;
- freshness/completeness and evidence access.

Grouping modes are Workflow, workflow stage, Council status, connection, and
claim. Grouping never changes membership/totals. Exact state/decision labels
come from the frozen app evidence schema, not a hardcoded copy of reference
`devbored` markers.

## Detail and evidence order

Detail answers:

1. Which Workflow/config digest admitted this item?
2. What is the current trusted workflow stage/terminal fact?
3. Which Council evidence caused or informed the transition?
4. What issue/PR/head/CI facts support it?
5. What human action is legal now?

Substrate deliveries appear in a separate runtime context and never as proof
of work progress. Reference-topology evidence is labeled unsupported/migration
input unless explicitly admitted by a compatibility manifest.

## Runtime and lifecycle

Runtime labels its data “engine delivery facts.” It shows queue/delivery/dead-
letter snapshots, truncation, owned process evidence, graph digest, accepted
Workflow/Council provenance, and bounded logs.

Run control distinguishes ready, owned running, unowned observation, starting,
stopping, crashed, and fatal `cleanupFailed`. Only owned
`starting`/`ownedRunning` process states expose a legal Stop; Restart appears
only for `ownedRunning` after current Doctor proof. `cleanupFailed` shows the
last validated typed cleanup receipt, survivor count or unknown result, and a
single contained cleanup/reconcile action. It blocks Start/Restart until a new
zero-survivor receipt succeeds; the UI never offers “ignore” or PID-only kill.
No unowned or already-stopping process exposes a signal action. DRY/LIVE copy is
generated from the integrated package's tested effect matrix, never inherited
from the reference topology.

`starting` explicitly shows “waiting for runtime configuration acknowledgement,”
the bounded deadline, and a safe Stop action. Launch PID/argv never renders as
`active`. A timeout, malformed/duplicate/prior-process receipt, or digest/process
mismatch returns to `acceptedForNextLaunch` with typed remediation after the
owned process is stopped.

The Start review names the exact connection revision, managed clone, immutable
launch id, Workflow/Council versions and digests, effect posture, and LIVE
allowlist. It also shows the immutable filesystem-profile digest and a concise
six-root/protected-path summary, including Git-broker versus Codex-worktree
authority; raw credential paths are never shown. Start remains disabled until the no-effect acceptance receipt and
current Doctor report match those values. The review labels that receipt
“preflight,” not “active configuration.” Automatic Merge is not shown unless
the compatibility manifest admits the public exact-head effect; otherwise the
terminal copy is “Ready for operator merge.”

## Required states

Every primary view implements:

1. loading;
2. empty (source empty versus filter empty);
3. stale;
4. degraded/partial;
5. unverified/readiness-blocked; and
6. fixture (all effects/lifecycle disabled).

Mutating flows additionally implement idle, validating, confirmation, in
progress, success-with-authoritative-link/receipt, ambiguous-reconciling,
publication-outcome-unknown hold, conflict, failed-retryable, and failed-terminal
states. `failed-retryable` is legal for comment/write transport only after
reconciliation proves `confirmedNotSent`; unresolved ambiguity never exposes
automatic Retry. Closing a dialog cannot
hide an in-flight operation; its state remains visible in the owning page.

Unknown values use one shared component. `?? 0`, empty-as-success, and green
defaults are prohibited.

## Design/accessibility

- Theme tokens use canonical oklch values from the legacy design-language file.
- Light and dark themes map through semantic tokens; both are independently
  tested for WCAG AA contrast instead of deriving one by opacity alone.
- Inter is UI typeface; Space Grotesk is wordmark-only.
- Status uses text plus shape; hue is not the only signal.
- Cards are multi-line objects; lists prefer hairline separation.
- No gradients, glows, decorative KPIs, emoji icons, or looping activity.
- One semantic icon family is used throughout. Icons that trigger actions have
  accessible names; unfamiliar or high-consequence actions retain text labels.
- All interactions are keyboard reachable with visible focus and WCAG AA contrast.
  A route change moves focus to the new page heading, while Back restores the
  prior filter, draft, expansion, and scroll context.
- Pointer targets are at least 44 by 44 logical pixels; dense tables may keep
  compact rows only when every interactive target still meets that bound.
- Text remains usable at the supported platform text-scale extremes. Load-bearing
  identities wrap or expose the complete value accessibly; they are never silently
  clipped into an ambiguous repo, branch, workflow, seat, or revision.
- Forms keep visible labels, field-level helper/error text, a validation summary,
  and focus the first invalid field after submission.
- Motion is interaction-bound, ≤120ms, and respects reduced motion.
- Operations that outlast immediate feedback expose determinate progress when
  available and otherwise an honest in-progress state; closing a dialog never
  removes that operation from its owning page.
- Narrow windows collapse secondary panels before primary identity/evidence.
  Tables progressively remove nonessential columns, then render accessible cards;
  essential evidence is never hidden behind unavoidable horizontal scrolling.
- Lists expected to exceed 50 visible items use pagination or virtualization and
  preserve keyboard order, selection, filters, and the truthful total/completeness
  state.

## Surface admission

A surface ships only when it maps to an operating-loop step, has a real source
and degradation state, performs a real tested effect, and has been exercised by
the app-integrated topology. A beautiful reference/mock-only surface is cut.

⟦AI:FKST⟧
