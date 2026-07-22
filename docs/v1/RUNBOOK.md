# FKST-devbored v1 operator runbook

Status: skeleton for the operational v1. This document intentionally contains
no runnable command until the corresponding implementation phase has supplied
and verified it.

An **operator** is the person who prepares, starts, checks, and stops the
deployment. **FKST-substrate** is the engine that runs departments, queues,
delivery, retries, and liveness (whether the loop continues making progress).
The **runtime** is that live collection of engine and console processes. GitHub
issues and pull requests remain the durable business layer, meaning the lasting
source of work facts and evidence. A **pinned binary** is the exact approved
engine build rather than whichever build happens to be available on the host.
A **fixture** is stored example data used for demonstration or testing rather
than evidence read from a live system. A **council seat** is one configured
decision-making perspective in the loop.

Use these steps in order. Do not substitute the commands in
`demo/README.md` or `local-bff/README.md`: those documents describe the earlier
fixture and local read-only surfaces, not this operational v1.

## 1. Check prerequisites

**Purpose.** Confirm that the host has every required program, pinned binary,
repository permission, and writable runtime location before any service starts.
The final check must fail clearly when a prerequisite is missing rather than
allowing a partial deployment.

**Exact command placeholder**

```sh
# TODO(S1b): Insert the verified prerequisite-check command supplied by runtime bring-up.
```

**Expected output placeholder**

`TODO(S1b): Record the exact success output, including the verified pinned-binary source and runtime locations.`

| Symptom | Likely cause | Action |
| --- | --- | --- |
| The prerequisite check does not report success. | A required program, pinned binary, permission, or runtime location is unavailable. | Stop here; `TODO(S1b): add the exact remediation mapped to each check.` |

## 2. Confirm bot and human identities

**Purpose.** Verify that the trusted bot identity used by the loop is separate
from the human identity allowed to create work. The write path must reject the
bot as the human actor, including after GitHub's `[bot]` name normalization.

**Exact command placeholder**

```sh
# TODO(S1b): Insert the verified identity-check command that inspects separate bot and human credential storage.
```

**Expected output placeholder**

`TODO(S1b): Record the exact output, with secrets removed, that identifies two distinct actors without exposing credentials.`

| Symptom | Likely cause | Action |
| --- | --- | --- |
| The two checks resolve to the same actor, or either actor is unknown. | Bot and human credentials are missing, shared, or incorrectly separated. | Do not start or enable writes; `TODO(S1b): document the verified credential-separation repair.` |

## 3. Validate the deployment config

**Purpose.** Validate the one versioned deployment config that defines the
enabled label (the GitHub label that opts an issue into the loop), admission
rules (which issues may enter the loop), trusted bot, human actor, council
seats, agreement rule (how seats reach a decision), and budgets (limits on work
or evidence). A **config digest** is a computed fingerprint of the config in
one agreed exact byte form; validation must show both its version and digest.

**Exact command placeholder**

```sh
# TODO(S1b): Insert the verified config-validation command after the Phase 0 config contract is implemented.
```

**Expected output placeholder**

`TODO(S1b): Record the exact success output, including config_version, config_digest, target repository, and enabled label.`

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Validation fails or the version/digest is absent. | The file is invalid, its exact-byte fingerprint disagrees, or the wrong config was selected. | Do not continue; `TODO(S1b): add the exact safe validation and correction procedure.` |

## 4. Run doctor

**Purpose.** **Doctor** means the diagnostic performed before startup that
checks the composed deployment without starting normal loop processing. Use it
to catch binary, configuration, GitHub access, required-label creation,
directory, and connection problems early.

**Exact command placeholder**

```sh
# TODO(S1b): Insert the verified doctor command created by runtime bring-up.
```

**Expected output placeholder**

`TODO(S1b): Paste the exact healthy doctor summary and define every reported check.`

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Doctor reports one or more failed checks. | A deployment dependency or connection is not ready. | Do not start; `TODO(S1b): map each stable doctor error code to a verified corrective action.` |

## 5. Start the deployment

**Purpose.** Start the substrate-powered loop and the same-origin console
services using the validated startup config, which cannot change while the
deployment is running. **Same-origin** means the user interface and its local
server share one browser address and trust boundary.

**Exact command placeholder**

```sh
# TODO(S1b): Insert the verified start command created by runtime bring-up.
```

**Expected output placeholder**

`TODO(S1b): Record the exact startup output, process identifiers or status references, log locations, local console address, and default write-disabled state.`

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Startup exits, hangs, or reports only some services healthy. | A process failed, a required local address is unavailable, or the startup config cannot be locked in. | Keep writes disabled; `TODO(S1b): add the verified stop, log-inspection, and retry procedure.` |

## 6. Verify the runtime and GitHub connection

**Purpose.** Confirm that the substrate loop is live and that the console can
read trusted work and debate evidence from the configured GitHub repository.
A **projection** is the console's read-only view of facts stored elsewhere; it
must not become a second business authority.

**Exact command placeholder**

```sh
# TODO(S1b): Insert the verified status/connection command after runtime bring-up and the S2 GitHub read plane are integrated.
```

**Expected output placeholder**

`TODO(Phase 2): Capture the first verified live output showing runtime health, the configured repository, fresh trusted markers (structured GitHub evidence), debate evidence, and matching config version/digest.`

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Runtime is healthy but GitHub state is disconnected, stale, partial, or untrusted. | Credentials, repository access, incomplete page fetching, GitHub request limits, unrecognized evidence, or a version/digest mismatch may be responsible. | Do not create work; `TODO(Phase 2): add the verified diagnosis path for each live connection state.` |

## 7. Create work

**Purpose.** After live evidence passes the required version-and-digest checks,
use the single permitted write to create one issue and apply the exact enabled
label derived from the startup config. A **write** is an action that changes
GitHub; it is default-off, human-only, and unavailable in fixture mode.

**Exact command or operator-action placeholder**

```text
TODO(Phase 2): Insert the verified create-issue action after the guarded write path is implemented and tests prove invalid or unauthorized requests are rejected.
```

**Expected output placeholder**

`TODO(Phase 2): Record the exact success response and safe identifiers, including the created issue and applied enabled label.`

| Symptom | Likely cause | Action |
| --- | --- | --- |
| The write is disabled or rejected. | A guard may have failed: actor, repository, admission rule, config version, config digest, unchanged config bytes, fixture/live mode, per-launch browser token, request shape, or whether writes are turned on. | Do not bypass the guard; `TODO(Phase 2): map the public error to a safe operator check while keeping credentials and internal details private.` |

## 8. Watch the loop pick up the work

**Purpose.** Observe the newly created issue until the configured loop admits
it and publishes trusted progress and debate evidence to GitHub. A **poll** is
one scheduled check for new work; acceptance requires pickup within one poll,
without inventing a fixed time interval here. A **round** is one council
decision cycle, and the **roster** is the ordered list of participating seats.

**Exact command placeholder**

```sh
# TODO(S1b): Insert the verified watch/status command; Phase 2 must validate it against a fresh live issue.
```

**Expected output placeholder**

`TODO(Phase 2): Capture the exact ordered pickup evidence, including proposal, round, roster, per-seat verdicts and arguments, and matching config version/digest.`

| Symptom | Likely cause | Action |
| --- | --- | --- |
| The issue is not picked up, or its evidence is missing or untrusted. | The enabled label, admission rules, polling, loop health, or evidence emission may not match the deployed config. | Preserve the issue and logs; `TODO(Phase 2): add the verified comparison and escalation procedure.` |

## 9. Stop and restart

**Purpose.** Stop the scripted services cleanly, then restart them against the
same durable GitHub work and confirm that processing resumes without duplicate
effects. This v1 provides scripted lifecycle handling, not automatic recovery
after a machine reboot.

**Exact command placeholders**

```sh
# TODO(S1b): Insert the verified stop command.
# TODO(S1b): Insert the verified restart command.
```

**Expected output placeholder**

`TODO(Phase 3): Capture the accepted stop/restart output and the GitHub-only proof that an in-flight issue resumed without duplication.`

| Symptom | Likely cause | Action |
| --- | --- | --- |
| A process remains running, restart loses work, or duplicate evidence appears. | Shutdown, durable recovery, or duplicate prevention failed. | Disable writes and preserve evidence; `TODO(Phase 3): add the accepted recovery and incident-escalation procedure.` |

## 10. Diagnose a failure

**Purpose.** Collect limited, secret-free evidence from lifecycle status, logs,
runtime observation, the age of console data, GitHub comments and labels, and
the config version/digest match. Classify what is unknown as unknown, and never
turn missing data into a zero or a successful state.

**Exact command placeholder**

```sh
# TODO(S1b): Insert the verified failure-evidence or limited log/status commands, with secrets removed and output-size limits.
```

**Expected output placeholder**

`TODO(Phase 3): Provide an example evidence package with secrets removed and the final symptom-to-cause-to-action matrix after acceptance testing.`

| Symptom | Likely cause | Action |
| --- | --- | --- |
| The failure does not match a documented case. | The deployment has encountered an unclassified runtime, GitHub, projection, config, identity, or recovery fault. | Keep writes disabled, preserve the issue and secret-free evidence, and escalate; `TODO(Phase 3): name the owner and exact evidence package required.` |
