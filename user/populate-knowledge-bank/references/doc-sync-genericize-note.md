# Genericizing `doc-sync-SKILL.md`

`doc-sync` is repo-local (not globally installed — confirmed: absent from `~/.claude/skills/`).
Its **7-step process, per-surface rules concept, sync-chains, flags, and guardrails are fully
portable** — ship them verbatim. What's the reference repo-specific falls into three buckets. Line numbers are
against the verbatim copy in this folder.

## Bucket 1 — pure illustrative examples (replace with placeholders or the target repo's own)

These are the reference repo identifiers/paths/ADR-numbers used only as examples. They mislead in another repo.
Swap for neutral placeholders (`SomeEnum|SOME_VALUE|someФn`, `<pkg>`, `ADR NNNN`) or the target's.

| Lines | the reference repo-specific content | Action |
| --- | --- | --- |
| 49 | `rg -n 'RecTransferStatus\|IN_PROGRESS\|mintRecsForRequest'` | placeholder identifiers |
| 65–75 | DRIFT MAP example: `packages/irec/src/issuance.ts`, `packages/irec/CONTEXT.md`, "Phase-1", `04-issuance.md`, `packages/db/src/schema/user.prisma`, `Role.VERIFIER`, `ADR 0004` | rewrite with placeholder paths/ids |
| 92 | "tRPC procedure taxonomy restated across 7 files; the `Role` enum rule spans schema + seed" | generalise to "e.g. a rule restated across N files" |
| 106, 113–116 | FLAGS examples: `Role.VERIFIER` vs `ADR 0004`, tRPC flavour vs `ADR 0003`, meter-provider failover | placeholder ADR numbers + a generic decision example |

## Bucket 2 — layout/structure assumptions (mostly satisfied IF the repo was scaffolded by v1, but two are conditional)

The doc surfaces this skill greps/edits assume the layout the **scaffold-knowledge-bank** skill
produces (`CONTEXT.md`, `docs/architecture/contexts|sub-modules`, `docs/adr/`, `docs/agents/`).
That's fine — v2 runs *after* v1. The genuinely variable parts:

| Lines | Assumption | Action |
| --- | --- | --- |
| 50–51, 54, 84 | `CONTEXT-MAP.md` + its "§Conventions" exists | **multi-context only.** Single-context repos have no map — make the structural-home prong (step 3b) conditional on the map existing; fall back to symbol-grep alone. |
| 56, 83–84 (table) | `packages/*`, `apps/*`, `ops/` globs | **monorepo only.** A single-package repo collapses these to one `CONTEXT.md` + `src/`. Parameterise the package globs. |
| 86 | `docs/agents/commands.md`, `gotchas.md`, `workflows.md` | **the reference repo-extra files.** `setup-matt-pocock-skills` only creates `issue-tracker.md`/`triage-labels.md`/`domain.md`. Either drop this row or generalise to "any `docs/agents/*` describing a command/flow." |
| 87 | `CLAUDE.md` "should not need to grow" (the reference repo's exact phrasing) | generalise to "the root agent file (`CLAUDE.md` **or** `AGENTS.md`)" — v1 already handles either. |
| 131 | "`/push` handles the chore-flow" | repo-local skill. Drop or replace with "your push flow." |

## Bucket 3 — boundary detection is a CORRECTNESS BUG, not a config knob

| Lines | Problem | Action |
| --- | --- | --- |
| 15, 18–21, 28 | Docs boundary = "newest commit whose subject starts with `docs`". **Broken regardless of prefix:** any interstitial docs commit (a typo fix, last week's own auto-sync) advances the boundary and **swallows the code changes behind it**. Parameterizing the prefix does not fix this — it's a heuristic over commit subjects standing in for a fact the tool should record. In the headless weekly run the "visible anchor commit" output lands in a PR body nobody reads line-by-line, so visible ≈ silent. | **Replace the heuristic with a durable baseline marker the sync writes on success.** A committed state file (`.docs-sync-baseline` holding the last-synced SHA), updated inside the sync's own `docs:` commit. Range = `$(cat .docs-sync-baseline)..HEAD`; bootstrap to all-history on first run and write the file. Chosen over a moving git tag (needs a separate force-push that's easy to drop in CI) and over git notes (`refs/notes/*` aren't fetched/pushed by default — silently lost). The file rides in the same docs commit/PR, merges with it, and is `cat`-able headless. Update steps 1 and 7 of the skill accordingly. |

## What NOT to touch

Steps 1–2 mechanics, the per-surface **rules** (edit-freely / glossary-only / never-auto-write),
the sync-chain algorithm (canonical home → walk every restatement → flag contradictions, never
rewrite an ADR), the flags taxonomy, and all guardrails (no commit/push/`--apply`, glossary
discipline, don't-invent-docs, don't-widen-scope). These are the portable spine — verbatim.
