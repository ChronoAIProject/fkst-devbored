# FKST-devbored — product README draft

Status: pre-acceptance draft. Product naming, verified source links, media,
license, and final attribution remain explicitly open until their named phase.

## Origin story

The owner identifies an OpenAI article about Symphony as the inspiration for
this product. `TODO(Phase 3): Verify the article's exact title and official URL,
then add the link here; if it cannot be confirmed, retain it only as an
owner-provided reference and do not add details.`

## Built on prior work

Built on **FKST-substrate**; this product reuses it. FKST-substrate is the
engine that runs the product's departments, queues, delivery, retries, and
liveness, while GitHub issues and pull requests hold lasting work facts and
evidence.

FKST-substrate and devloop are pre-existing upstream work, meaning foundations
received from earlier projects rather than created for this product. Their
implementations and histories predate this product and must be credited as
prior work rather than presented as newly authored here. `TODO(Phase 3): Add
verified upstream repository links, authorship, and applicable notices from the
authoritative sources.`

## What v1 ships

**Durable** means retained on GitHub rather than treated as local application
state. A **council loop** is a configured group of seats—each seat is one
named decision-making perspective—that reviews work through the substrate.
**File-configured** means deployment behavior comes from a versioned config
file. **End-to-end** means the described path runs as one connected live flow
rather than as disconnected demonstrations.

The governing plan states the v1 claim verbatim:

> "A one-repo, one-deployment, file-configured operational v1: a
> substrate-powered configurable council loop working GitHub issues end-to-end —
> with the council's debate durably recorded on GitHub — observed and fed
> through a local read-only console with exactly one write."

A **read-only console** may display the runtime and GitHub evidence but cannot
control the engine. The one **write** is the guarded, human action that creates
an issue and applies the exact enabled label from the deployment config.

This v1 does not claim proofs tying a launch to one saved config snapshot,
automatic service recovery after a machine reboot, multiple repositories,
future full-app Workflow/Council data formats controlling the live loop, or
engine control from the console.

## Operator quickstart

Follow [the v1 operator runbook](RUNBOOK.md) in order. It covers prerequisites,
separate bot and human identities, config validation, doctor, start, live
verification, work creation, pickup, stop/restart, and failure diagnosis.

`TODO(S1b): Replace this placeholder with the condensed, verified lifecycle
commands after runtime bring-up creates and tests them.`

`TODO(Phase 2): Add the verified single-write and live-pickup steps only after
the guarded write path and first live evidence pass.`

Do not use the fixture demo commands as an operational quickstart. The fixture
demo uses stored example data and is not evidence of live GitHub business
connectivity.

## Product tour

### Header banner slot

**oklch** is a way to specify colors with perceptual lightness, colorfulness,
and hue controls. The **K-node mark** is the named product mark referenced by
the media plan; its authoritative source asset must be verified before use.

`TODO(Phase 3): Generate and embed the approximately 1280×400 header banner
from the demo's own oklch color tokens and K-node mark, using the approved
image-capture steps.`

### Screenshot slots

`TODO(Phase 3): Capture and embed every shipped screen at 1440px with the
approved light crop after acceptance; state honestly whether each applicable
image came from fixture or live data.`

**Alt text** is a concise description for readers who cannot see an image.
`TODO(Phase 3): Add alt text and a one-sentence operator-oriented caption for
each final screenshot once the accepted screen inventory is known.`

## Advisory naming deliberation

The candidate names are **FKST-agora**, **FKST-kanban**, and
**FKST-devbored**. This naming exercise is advisory: it informs the README
name, but the owner may veto the result.

The deliberation must run through the real deployed path. A **digest** is a
computed fingerprint used to check that content or config bytes match; it does
not replace the human-readable argument. A **round** is one council decision
cycle, and the **roster** is its ordered list of seats. The configured council
runs on FKST-substrate, and GitHub receives trusted (accepted-source and
accepted-format), ordered per-seat verdicts and arguments kept within agreed
size limits, together with their digests, the proposal, round, roster, config
version, and config digest.

The result must be reconstructable solely from GitHub, without consulting
local files and without using the fixture Council reducer as runtime evidence.
`TODO(Phase 3): Run the accepted substrate-to-GitHub naming deliberation,
link its verified GitHub evidence, summarize each candidate's arguments and
verdicts, record the advisory result, and note any owner veto.`

## License

### OPEN-DECISION

The governing sources do not specify the product's license.
`TODO(Phase 3): The owner must choose or confirm the license; then add the
exact license name, verified license-file link, and any required notices.`

## Attribution

`TODO(Phase 3): Add the final verified attribution for FKST-substrate,
devloop, reused assets, third-party components, and generated media. Include
authoritative links and required notices only after checking their sources.`
