---
name: doc-sync
description: Review the non-docs commits landed since the last docs commit and update the docs to match the code. Maps changed identifiers to the docs that reference them, edits as-is pages freely, respects glossary-only CONTEXT.md and never-auto-write ADR rules, walks documented sync-chains, and flags ADR contradictions. Stops before committing.
argument-hint: "(optional) git range or SHA — defaults to <last-docs-commit>..HEAD"
---

# /doc-sync — bring the docs back in line with the code

Read the code changes that landed since the docs were last touched, find the docs that describe that code, and edit them to match. Produce a **drift map first**, then apply edits, then **stop** — the user reviews the diff and commits.

This skill never commits, pushes, or runs `--apply`-style mutations. It edits files in the working tree and hands control back.

## 1. Determine the range

The range is everything since the docs were last synced. Use the most recent commit whose subject starts with `docs` as the boundary:

```bash
# Boundary = newest commit whose SUBJECT starts with "docs"
git log --grep '^docs' --format='%H %s' -n 5      # sanity-check what you're anchoring on
BOUNDARY=$(git log --grep '^docs' --format='%H' -n 1)
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

Also note the **behavioural** changes that don't surface as a renamed symbol: added/removed `FIXME`/`TODO` comments, and added guards / `throw`s / validations / rollback or idempotency checks. A change like this often _fixes_ a documented gotcha without touching any identifier a grep would catch — see prong (c) in step 3.

## 3. Map each change to the docs that describe it

Two-pronged. Do both:

**a) Symbol-grep (highest signal).** For each identifier from step 2, grep every doc surface. Any doc that names it is at risk:

```bash
# docs surfaces: root + per-package CONTEXT, the map, ADRs, architecture pages, agent docs
rg -n 'RecTransferStatus|IN_PROGRESS|mintRecsForRequest' \
   CONTEXT.md CONTEXT-MAP.md CLAUDE.md \
   docs/ $(git ls-files '**/CONTEXT.md')
```

**b) Structural home (don't miss the obvious owner).** Use [CONTEXT-MAP.md](../../../CONTEXT-MAP.md):

- Its **per-package table** maps a changed `packages/<x>/` directory → that package's `CONTEXT.md`.
- Its **cluster map** maps load-bearing areas → the ADRs that govern them. If the diff touches a cluster, the listed ADRs are in the review set (to _check against_, per the rules below — not to rewrite).
- The architecture context pages ([docs/architecture/contexts/](../../../docs/architecture/contexts/)) and sub-module deep-dives ([docs/architecture/sub-modules/](../../../docs/architecture/sub-modules/)) describe behaviour by domain; grep them by identifier (prong a) since the map doesn't link them by file path.

**c) Resolved-gotcha / resolved-FIXME sweep (the living-docs prong).** Docs don't only drift when a symbol is renamed — they drift when a bug they _warn about_ gets fixed. A fix commit usually **adds a guard** rather than renaming anything, so prongs (a)/(b) miss it, yet it can turn a documented gotcha into a lie — and a gotcha that warns you off a now-correct path is worse than none. When the diff adds a guard / validation / `throw` / rollback / idempotency check, removes a `FIXME`/`TODO`, or otherwise closes a gap:

- Grep the **gotcha surfaces** for a note describing the gap this change just closed: the `## Gotchas`, `## Boundaries and gotchas`, `## Flagged ambiguities`, `## Open questions` sections, inline `⚠️` blocks, and [docs/diagnostics.md](../../../docs/diagnostics.md). Grep keys here are _behavioural_, not identifiers — the gotcha's own phrasing: `FIXME`, `TODO`, "no writer", "not idempotent", "no rollback", "bypasses", "latent bug", "no warning", "treat as a hard rule".
- A gotcha the code now handles is **stale** — rewrite it to "enforced — &lt;how, cite the guard&gt;" or delete it (per the step-5 rule for that surface). If a doc quotes a `FIXME(...)`/`TODO` the diff removed, drop the warning.
- The reverse also holds: a commit that _introduces_ a foot-gun (a new TODO, a non-idempotent path, a known gap) is a candidate **new** gotcha — surface it in the drift map for the user to confirm; don't silently invent one.

If a `.scratch/docs-gotchas/` staging tree exists, it already maps gotchas → code with verified line refs — use it as the worklist for this prong.

## 4. Emit the drift map (before editing)

Output a map the user can scan in one pass. Group by changed code area. For each, list the docs hit and the proposed edit:

```
DRIFT MAP  (range a1b2c3d..HEAD, 4 commits)

packages/irec/src/issuance.ts  (a1b2c3d "feat(irec): ...")
  ↳ packages/irec/CONTEXT.md         — Phase-1 description now wrong → edit
  ↳ docs/architecture/contexts/04-issuance.md — new status value missing → edit
  ↳ docs/.../issuance/state-machine.md — transition added → edit

packages/db/src/schema/user.prisma  (e4f5g6h "feat(auth): ...")
  ↳ FLAG (ADR-contradiction): adds Role.VERIFIER; ADR 0004 + CLAUDE.md
     state the role set is fixed at four. Not editing — see flags below.
```

## 5. Apply edits — per-surface rules

Edit in the working tree. **Different doc types get different rules** — do not edit them all the same way:

| Surface                                                                      | Rule                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/architecture/contexts/*`, `docs/architecture/sub-modules/*`            | **As-is descriptions — edit freely** to match the code. These are the primary target.                                                                                                                                                                                               |
| `CONTEXT.md`, `packages/*/CONTEXT.md`, `apps/*/CONTEXT.md`, `ops/CONTEXT.md` | **Glossary only.** Edit _only_ if a domain **term** changed (renamed noun, new/removed concept, changed meaning). Never add implementation detail — that violates the glossary-only rule in [CONTEXT-MAP.md](../../../CONTEXT-MAP.md) §Conventions. One or two sentences per entry. |
| `CONTEXT-MAP.md`                                                             | Edit only if **package/cluster structure** changed (package added/renamed, a load-bearing flow added/renamed/moved).                                                                                                                                                                |
| `docs/agents/commands.md`, `gotchas.md`, `workflows.md`                      | Edit if a **command, script, or flow** the doc describes changed.                                                                                                                                                                                                                   |
| `CLAUDE.md`                                                                  | Real maintained file, but it's meant to **stay minimal** ("should not need to grow"). Touch only when a fact it states drifted — usually as one node of a sync-chain (below), rarely on its own.                                                                                    |
| `docs/adr/*`, `packages/*/docs/adr/*`                                        | **Never auto-write or rewrite an ADR.** See flags (step 6).                                                                                                                                                                                                                         |

### Sync-chains — the part most doc updates get wrong

Some facts have a **canonical home** (usually an ADR) and are **deliberately restated** across several files that "must stay in sync." CLAUDE.md documents these chains explicitly (e.g. the tRPC procedure taxonomy is restated across 7 files; the `Role` enum rule spans schema + seed + several docs).

When a synced fact drifts:

1. Identify the **canonical home** (the ADR or the file CLAUDE.md names as canonical).
2. If the code change merely _describes the current state_ of that fact → update the canonical doc, then `rg` the fact across all docs and update **every restatement** so they don't contradict each other.
3. If the code change **contradicts the ADR's actual decision** (not just its phrasing) → **do not rewrite the ADR.** Flag it (step 6). An ADR is a deliberate decision; superseding it is a human call.

Leaving 6 of 7 copies stale is worse than leaving all 7 stale — internally contradictory docs mislead. Walk the whole chain or flag the whole thing.

## 6. Flags — chat only

Two things you surface but **never edit a file for**:

- **ADR-contradiction** — a code change that conflicts with an ADR's decision (e.g. a new `Role` value vs ADR 0004's fixed set, a new tRPC procedure flavour vs ADR 0003).
- **ADR-candidate** — a change that looks like a deliberate, hard-to-reverse, traded-off decision with no ADR behind it.

Report these in the run output only. Do **not** file them as tracked work or open an ADR — the user triages whether a flag becomes tracked work.

```
FLAGS  (no files touched)
  [ADR-contradiction] e4f5g6h adds Role.VERIFIER — ADR 0004 + CLAUDE.md
     fix the role set at four. Needs a new ADR + seed row, not a doc edit.
  [ADR-candidate?]     a1b2c3d introduces meter-provider failover retry —
     looks decision-worthy; no ADR. Consider one.
```

## 7. Hand back — do not commit

Finish with:

1. A summary: range reviewed, docs edited (list paths), sync-chains walked, flags raised.
2. The literal next step for the user — **you do not run these**:

```bash
git diff --stat                 # review what doc-sync changed
git add -A && git commit -m "docs: sync with <range>"   # user runs this
```

Stop there. Committing and pushing are the user's call (`/push` handles the chore-flow for pure-docs changes).

## Guardrails

- **No commits, no pushes, no `--apply`.** Edit the working tree and stop.
- **Glossary discipline.** `CONTEXT.md` is a glossary, never a spec or changelog. If you're about to write implementation detail into one, you're editing the wrong surface — it belongs in an architecture/sub-module page.
- **Don't invent docs.** If changed code has no doc describing it and isn't ADR-worthy, note "undocumented, no drift" — don't manufacture a new page unless the user asks.
- **Don't widen scope.** Only the range's changes. Pre-existing drift unrelated to these commits is out of scope — mention it in one line at most.
- **When unsure whether a fact is canonical-vs-restatement,** grep it across docs first; if it appears in 2+ places, treat it as a chain.
