---
name: doc-sync
description: Review the non-docs commits landed since the last docs commit and update the docs to match the code. Maps changed identifiers to the docs that reference them, edits as-is pages freely, respects glossary-only CONTEXT.md and never-auto-write ADR rules, walks documented sync-chains, and flags ADR contradictions. Stops before committing.
argument-hint: "(optional) git range or SHA — defaults to <last-docs-commit>..HEAD"
---

# /doc-sync — bring the docs back in line with the code

> **Portability (genericized from the reference repo; see references/doc-sync-genericize-note.md).** This skill
> assumes the doc layout `scaffold-knowledge-bank` produces. Two layout facts are conditional:
> (1) **CONTEXT-MAP.md is multi-context only** — in a single-context repo it won't exist; skip the
> structural-home prong (§3b) and rely on symbol-grep alone. (2) **`packages/*`/`apps/*`/`ops/`
> globs are monorepo-shaped** — parameterise them to this repo's layout (a single-package repo
> collapses to one `CONTEXT.md` + `src/`). The boundary uses a committed `.docs-sync-baseline`
> marker (not a commit-subject heuristic); the prefix in any leftover `^docs` filter is just for
> *skipping* docs-only commits inside a range, not for finding the range.

Read the code changes that landed since the docs were last touched, find the docs that describe that code, and edit them to match. Produce a **drift map first**, then apply edits, then **stop** — the user reviews the diff and commits.

This skill never commits, pushes, or runs `--apply`-style mutations. It edits files in the working tree and hands control back.

## 1. Determine the range

The range is everything since the docs were last synced. The last-synced point is recorded in a **committed baseline file** `.docs-sync-baseline` (a single SHA), written inside the sync's own `docs:` commit (step 7). Anchor on that file — never on a commit-subject heuristic, which any interstitial docs commit (a typo fix, last week's own auto-sync) would advance, silently swallowing the code changes behind it.

```bash
# Boundary = the last-synced SHA the previous run recorded.
if [ -f .docs-sync-baseline ]; then
  BOUNDARY=$(cat .docs-sync-baseline)
else
  BOUNDARY=$(git rev-list --max-parents=0 HEAD | tail -1)   # first run: review all history
fi
git log --oneline "$BOUNDARY"..HEAD               # the commits to review
```

- If the user passed an argument, use it verbatim as the range/SHA instead (`/doc-sync HEAD~20..HEAD`, `/doc-sync a1b2c3d`).
- A **mixed** commit (code + docs in one) won't start with `docs` and so lands _inside_ the review set — that's correct; review its code half.
- If `$BOUNDARY..HEAD` is empty, say so and stop. Nothing to sync.

Skip commits that are purely docs (subject starts with `docs`) if any slipped into an explicit range — they're not code changes.

## 2. Collect the changed identifiers

For the whole range, gather the concrete things the code changed — these are the grep keys for step 3:

```bash
git diff "$BOUNDARY"..HEAD --stat                 # which files/packages moved
git diff "$BOUNDARY"..HEAD                          # read it; pull out identifiers
```

From the diff, extract: changed/added/removed **enum values**, **exported function/type names**, **Prisma model or field names**, **script names** (`pnpm ops:*`, package scripts), **route/procedure names**, **env vars**, and **file paths** that moved or were deleted. These — not prose summaries — are what docs go stale against.

## 3. Map each change to the docs that describe it

Two-pronged. Do both:

**a) Symbol-grep (highest signal).** For each identifier from step 2, grep every doc surface. Any doc that names it is at risk:

```bash
# docs surfaces: root + per-package CONTEXT, the map, ADRs, architecture pages, agent docs
rg -n 'SomeEnum|SOME_VALUE|someRenamedFn' \
   CONTEXT.md CONTEXT-MAP.md CLAUDE.md \
   docs/ $(git ls-files '**/CONTEXT.md')
```

**b) Structural home (don't miss the obvious owner).** Use [CONTEXT-MAP.md](../../../CONTEXT-MAP.md):

- Its **per-package table** maps a changed `packages/<x>/` directory → that package's `CONTEXT.md`.
- Its **cluster map** maps load-bearing areas → the ADRs that govern them. If the diff touches a cluster, the listed ADRs are in the review set (to _check against_, per the rules below — not to rewrite).
- The architecture context pages ([docs/architecture/contexts/](../../../docs/architecture/contexts/)) and sub-module deep-dives ([docs/architecture/sub-modules/](../../../docs/architecture/sub-modules/)) describe behaviour by domain; grep them by identifier (prong a) since the map doesn't link them by file path.

## 4. Emit the drift map (before editing)

Output a map the user can scan in one pass. Group by changed code area. For each, list the docs hit and the proposed edit:

```
DRIFT MAP  (range a1b2c3d..HEAD, 4 commits)

<pkg>/src/<area>.ts  (a1b2c3d "feat(<area>): ...")
  ↳ <pkg>/CONTEXT.md                 — term/description now wrong → edit
  ↳ docs/architecture/contexts/NN-<context>.md — new status value missing → edit
  ↳ docs/.../<context>/state-machine.md — transition added → edit

<pkg>/src/schema/<model>.prisma  (e4f5g6h "feat(<area>): ...")
  ↳ FLAG (ADR-contradiction): adds SOME_VALUE; ADR NNNN + the root agent file
     state this set is fixed. Not editing — see flags below.
```

## 5. Apply edits — per-surface rules

Edit in the working tree. **Different doc types get different rules** — do not edit them all the same way:

| Surface                                                                      | Rule                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/architecture/contexts/*`, `docs/architecture/sub-modules/*`            | **As-is descriptions — edit freely** to match the code. These are the primary target.                                                                                                                                                                                               |
| `CONTEXT.md`, `packages/*/CONTEXT.md`, `apps/*/CONTEXT.md`, `ops/CONTEXT.md` | **Glossary only.** Edit _only_ if a domain **term** changed (renamed noun, new/removed concept, changed meaning). Never add implementation detail — that violates the glossary-only rule in [CONTEXT-MAP.md](../../../CONTEXT-MAP.md) §Conventions. One or two sentences per entry. |
| `CONTEXT-MAP.md`                                                             | Edit only if **package/cluster structure** changed (package added/renamed, a load-bearing flow added/renamed/moved).                                                                                                                                                                |
| `docs/agents/*` (any agent doc describing a command/script/flow)             | Edit if a **command, script, or flow** the doc describes changed. (v1 seeds `issue-tracker`/`triage-labels`/`domain`; a repo may add more.)                                                                                                                                          |
| Root agent file (`CLAUDE.md` **or** `AGENTS.md`)                             | Real maintained file, meant to stay minimal. Touch only when a fact it states drifted — usually as one node of a sync-chain (below), rarely on its own.                                                                                                                              |
| `docs/adr/*`, `packages/*/docs/adr/*`                                        | **Never auto-write or rewrite an ADR.** See flags (step 6).                                                                                                                                                                                                                         |

### Sync-chains — the part most doc updates get wrong

Some facts have a **canonical home** (usually an ADR) and are **deliberately restated** across several files that "must stay in sync." CLAUDE.md documents these chains explicitly (e.g. a taxonomy or rule deliberately restated across N files — schema, seed, and several docs).

When a synced fact drifts:

1. Identify the **canonical home** (the ADR or the file CLAUDE.md names as canonical).
2. If the code change merely _describes the current state_ of that fact → update the canonical doc, then `rg` the fact across all docs and update **every restatement** so they don't contradict each other.
3. If the code change **contradicts the ADR's actual decision** (not just its phrasing) → **do not rewrite the ADR.** Flag it (step 6). An ADR is a deliberate decision; superseding it is a human call.

Leaving 6 of 7 copies stale is worse than leaving all 7 stale — internally contradictory docs mislead. Walk the whole chain or flag the whole thing.

## 6. Flags — chat only

Two things you surface but **never edit a file for**:

- **ADR-contradiction** — a code change that conflicts with an ADR's decision (e.g. a new enum value vs an ADR's fixed set, a new variant vs an ADR that constrained the options).
- **ADR-candidate** — a change that looks like a deliberate, hard-to-reverse, traded-off decision with no ADR behind it.

Report these in the run output only. Do **not** file them as tracked work or open an ADR — the user triages whether a flag becomes tracked work.

```
FLAGS  (no files touched)
  [ADR-contradiction] e4f5g6h adds SOME_VALUE — ADR NNNN + the root agent file
     fix this set as closed. Needs a new ADR, not a doc edit.
  [ADR-candidate?]     a1b2c3d introduces <new deliberate behaviour> —
     looks decision-worthy; no ADR. Consider one.
```

## 7. Hand back — do not commit

Finish with:

1. A summary: range reviewed, docs edited (list paths), sync-chains walked, flags raised.
2. The literal next step for the user — **you do not run these**:

```bash
git diff --stat                                   # review what doc-sync changed
git rev-parse HEAD > .docs-sync-baseline          # record the point synced up to (pre-docs-commit HEAD)
git add -A && git commit -m "docs: sync with <range>"   # user runs this; MUST include .docs-sync-baseline
```

Stop there. Committing and pushing are the user's call (use your repo's push flow for pure-docs changes). The commit **must** include the updated `.docs-sync-baseline` so the next run starts where this one ended.

## Guardrails

- **No commits, no pushes, no `--apply`.** Edit the working tree and stop.
- **Glossary discipline.** `CONTEXT.md` is a glossary, never a spec or changelog. If you're about to write implementation detail into one, you're editing the wrong surface — it belongs in an architecture/sub-module page.
- **Don't invent docs.** If changed code has no doc describing it and isn't ADR-worthy, note "undocumented, no drift" — don't manufacture a new page unless the user asks.
- **Don't widen scope.** Only the range's changes. Pre-existing drift unrelated to these commits is out of scope — mention it in one line at most.
- **When unsure whether a fact is canonical-vs-restatement,** grep it across docs first; if it appears in 2+ places, treat it as a chain.
