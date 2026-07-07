---
name: pull
description: Rebase `dev` into the current branch and resolve the conflicts with fs2 rules for Prisma schema, lockfiles, generated files, and load-bearing clusters. Use when the user says pull / rebase / "catch up with dev", or another skill needs a branch brought up to date before pushing.
argument-hint: "(optional) base branch — defaults to dev"
---

# /pull — rebase dev into current branch

Bring the current branch up to date with `dev` (or the branch the user names) via rebase, then resolve conflicts with fs2-specific knowledge of what to keep.

## Flow

```bash
git fetch origin                          # always fetch first
git status                                # must be clean — stash or commit before rebasing
git rebase origin/dev                     # or the arg the user passed
```

If the working tree is dirty, **stash before rebasing** (`git stash push -m "pre-rebase"`) and pop after. Rebase refuses on a dirty tree — don't waste the round-trip.

If already on `dev`: this becomes `git pull --rebase origin dev`. Same conflict rules apply.

## Conflict resolution — the fs2 rules

Every conflict resolves to one of four moves. When rebase pauses, read each conflicted file and pick its move before reaching for the user.

**Merge by hand (take both sides):**

- **`packages/db/src/schema/*.prisma`** — schema split by domain (user, wallet, registry, issuance, redemption, trade, transfers, irec, inngest, growthpoint, shared). Conflicts are real domain conflicts; merge both sides' fields/models, then `pnpm db:generate` after the rebase. Material divergence → ask.
- **`packages/api/src/root.ts`** — router registration list. Take both sides' imports/registrations.
- **`packages/api/src/router/*.ts`** — both added procedures → take both. Both modified the _same_ procedure → ask.
- **`turbo.json` `globalEnv`** — union both sides' entries.
- **`pnpm-workspace.yaml` `catalog:`** — take both; flag version conflicts to the user.

**Take theirs (incoming `dev`):**

- **`pnpm-lock.yaml`** — accept `dev`'s, then `pnpm i` after the rebase.
- **`packages/db/src/generated/**`** — generated Prisma client; accept `dev`'s, then `pnpm db:generate`.
- **`apps/nextjs/.next/**`** — should be gitignored; accept `dev`'s and investigate why it's tracked.

**Take ours (your branch):** files _you_ intentionally changed for the feature. Don't lose your work to `dev` just because the conflict marker is intimidating.

**Always ask the user:**

- Load-bearing clusters per CLAUDE.md — `packages/chain/`, `packages/irec/`, `packages/auth/`, `packages/inngest/`.
- `ops/` or `fuelswitch-contracts/`.
- Env validators — `packages/*/src/env.ts`, `apps/nextjs/src/env.ts`.
- Anything where both sides clearly modified the same business logic.

## After conflicts resolved

For each conflict cluster:

```bash
git add <resolved files>
git rebase --continue
```

Repeat until the rebase finishes. Then run only what the diff touched — not workspace-wide or nextjs typecheck (those are long-running and user-driven):

```bash
pnpm i                                    # if pnpm-lock.yaml or any package.json changed
pnpm db:generate                          # if any *.prisma changed
pnpm -F @repo/api build                   # if packages/api types feel stale
pnpm typecheck                            # the specific changed package's typecheck
```

## After rebase

The branch's history is rewritten. If it was already pushed, force with lease (never bare `--force`) — see [/push](../push/SKILL.md):

```bash
git push --force-with-lease origin <branch>
```

## Red flags — STOP

- Aborting a rebase mid-flight without telling the user (`git rebase --abort` discards your conflict resolution).
- Resolving a load-bearing-cluster conflict without confirming the intent.
- Force-pushing `dev` to fix a rebase mess → don't; ask the user.
