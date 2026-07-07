---
name: push
description: Push committed changes for this repo using the right flow — straight to dev for chores/docs, or branch+PR for features/bugfixes. Encodes when --force-with-lease and --no-verify are appropriate.
argument-hint: "(optional) override target branch or PR title"
---

# /push — fs2 push flow

Decide which of two flows applies based on what's actually in the diff, then execute it. Never push to `master`/`main`. Never use bare `--force`. Never use `--no-verify` for code changes.

## Decide the flow

Run `git status` and `git diff --stat` (plus `git log @{u}..HEAD` if upstream exists) and classify the change:

**Chore flow → push straight to `dev`:**

- Docs only (`*.md`, `CONTEXT.md`, `docs/**`, `.claude/**`, ADRs)
- Comments / JSDoc only
- Formatting / whitespace / import order
- Renames or moves with no behavior change
- Config bumps that don't touch runtime (`.editorconfig`, `.prettierrc`, `.gitignore`)

**Feature / bugfix flow → new branch + PR:**

- Any `.ts`/`.tsx`/`.js`/`.prisma` change with behavior impact
- Schema changes (always)
- Anything touching the load-bearing clusters in CLAUDE.md (auth, db, irec, chain, api, validators, notify, inngest)
- Anything in `ops/` or `fuelswitch-contracts/` — STOP and confirm with user; these are human-driven
- Mixed diffs (chore + code) → treat as code

If you're unsure, it's a feature/bugfix. Ask the user only if the diff is genuinely ambiguous.

## Chore flow

```bash
git push origin dev                       # if pre-push hook is slow and diff is truly non-code:
git push origin dev --no-verify           # ONLY for pure docs/comments/style
```

`--no-verify` is allowed here because Husky's `pre-push` runs `lint:strict` which is irrelevant for pure-docs changes. Still **never** `--no-verify` if a single line of `.ts`/`.tsx`/`.prisma` is in the diff.

If the current branch is not `dev`, first confirm with the user — don't silently push someone else's feature branch to `dev`.

## Feature / bugfix flow

1. If on `dev`, create a branch: `git checkout -b <kind>/<short-slug>` where `<kind>` is `feat` / `fix` / `refactor`. Slug from the diff's intent.
2. Push with upstream: `git push -u origin <branch>`.
3. Open a PR against `dev` using `gh pr create` — title under 70 chars, body has Summary + Test plan (see CLAUDE.md PR template). Target branch is `dev`, NOT `master`.
4. Print the PR URL.
5. `git checkout dev` — return the working tree to `dev` once the PR is filed (and any PR-body edits are done). The default working branch is `dev`; don't leave the tree parked on the feature branch.

Pre-push hook (`lint:strict`) must pass — do **not** `--no-verify`. If it fails, fix the lint errors; don't bypass.

## --force-with-lease

Use `--force-with-lease` (never bare `--force`) when:

- You rebased a feature branch onto updated `dev` (post `/pull`)
- You amended commits on a branch that's already pushed
- You squashed locally before merging

```bash
git push --force-with-lease origin <branch>
```

Never force-push to `dev` or `master`. If you think you need to, stop and ask.

## Quick reference

| Situation                    | Command                                       |
| ---------------------------- | --------------------------------------------- |
| Docs/comments only, on `dev` | `git push origin dev --no-verify`             |
| Code change, on `dev`        | New branch + PR                               |
| Rebased feature branch       | `git push --force-with-lease origin <branch>` |
| Amended on pushed branch     | `git push --force-with-lease origin <branch>` |
| Anything → `master`          | STOP. Confirm with user.                      |

## If the push is blocked

If `git push` fails for a reason you cannot fix in-band — auto-mode classifier denial, permission prompt rejected, sandbox restriction, missing credentials, hook failure you're not allowed to bypass — **stop and ask the user to run the push themselves.**

- Do **not** try to work around the block by branching, force-pushing, or switching remotes unless the user explicitly directs that.
- Tell the user the exact command you would have run, the commit SHA(s) that are ready, and which branch they live on. Example:
  > `git push origin dev` is blocked. Commit `12bed1ba` is on `dev` and ready — please push when you're at the terminal.
- Leave local state clean: don't delete the commit, don't reset, don't checkout away unless asked.

## Red flags — STOP

- `--no-verify` with `.ts`/`.tsx`/`.prisma` in the diff → fix the lint/test, don't bypass
- Bare `--force` → use `--force-with-lease`
- Push to `master` without explicit user instruction
- Push to `dev` from someone else's feature branch
- Touching `ops/` or `fuelswitch-contracts/` → confirm with user first
