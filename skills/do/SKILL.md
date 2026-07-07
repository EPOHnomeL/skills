---
name: do
description: Run a single Jira BUG ticket to its next lifecycle step, or report where it sits and whose move it is. User-invoked by name (`/do BUG-114`).
disable-model-invocation: true
argument-hint: "<TICKET-KEY> (e.g. BUG-114)"
---

# /do &lt;TICKET&gt; — advance one Jira ticket by exactly one lifecycle step

Read a ticket's **lifecycle position** (its Jira status) and **assignee**, then take the single action that is the agent's to take — or, when it isn't the agent's move, report where the ticket sits and whose move it is. The agent's authority stops at the **ceiling**: `In Review`.

The lifecycle this encodes — statuses, transition owners, the ceiling — is defined once in [ticket-lifecycle.md](../../../docs/agents/ticket-lifecycle.md). This skill is the _executor_; that doc is the _law_. If they ever disagree, the doc wins — fix the skill.

## 0. Read the ticket

Fetch `status`, `assignee`, `summary`, `description` for `<TICKET>`.

- **Interactive** (default): use the Atlassian MCP (`getJiraIssue`).
- **Headless** — the morning routine's sandbox blocks the MCP (you'll see `MCP tool call requires approval`): use curl. Every headless Jira read/write recipe is in [headless.md](headless.md).

Then route on **status**:

| Status                                                           | Action                                                                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **FOR AI**                                                       | Implement → `In Review`. The pipeline in §1.                                                                               |
| **In Review**                                                    | Check out the live PR branch for the human (§2a); freshen it (§2b) if >3 days open **and** behind `dev`; else report (§3). |
| **In Progress**                                                  | Report (§3). A ticket stuck here with no PR usually means a prior run blocked — say so.                                    |
| **Not Started / Testing / Ready for Production / Done / URGENT** | Report (§3). Read-only — not the agent's move.                                                                             |

## 1. FOR AI → In Review (the only branch that writes code)

Completion criterion: the ticket ends at **`In Review` with a PR, both reviews recorded into it, and a Testing Methodology posted** — _or_ at **`In Progress` with a comment explaining why not** (ambiguous). Never half of each.

1. **Claim.** Transition `FOR AI → In Progress` first, so no human or concurrent run double-grabs it.
2. **Guard against a duplicate.** If a `claude/<KEY>-*` branch already exists on the remote, **stop** — a prior run got partway. Report the inconsistency; do not open a second PR. (This replaces the old branch-existence dedup hack: with status now advancing, a `FOR AI` ticket should never already have a branch.)
3. **Branch.** `git fetch origin && git checkout -B claude/<KEY>-<slug> origin/dev` (slug from the summary). The `claude/` prefix is mandatory — the routine sandbox 403s anything else.
4. **Decide actionability.** If the ticket is ambiguous, needs a product decision, or is out of scope → **escape hatch**: post a Jira comment naming exactly what's unclear and what decision a human must make. Leave the ticket in `In Progress` (out of the FOR-AI queue, visibly stuck), open no PR, stop.
5. **Implement.** Follow the bug flow — `/diagnosing-bugs` if the cause isn't obvious, `/ponytail` for the change itself. Match scope: a bug fix is a bug fix; don't bundle a refactor. Run the relevant tests (`/test`).
6. **PR → `dev`.** Open via `gh` (interactive) or the GitHub MCP (headless). Body: `Closes <KEY>` on its own line, a Summary, what changed & why, files touched, risks/assumptions, a Test plan, and the two review placeholders per [workflows.md § Post-PR reviews](../../../docs/agents/workflows.md#post-pr-reviews). Never target `master`.
7. **Reviews.** Run `thermo-nuclear-code-quality-review` and `/security-review`; splice each one's full output into its PR placeholder. `/do` is where the existing post-PR mandate actually gets executed.
8. **Testing Methodology.** Run [`/test-plan`](../test-plan/SKILL.md) for `<KEY>` and post its output into the Jira ticket — a manual staging methodology a second senior can follow _without reading the diff_.
9. **Advance.** Transition `In Progress → In Review` and comment on the ticket linking the PR. **Stop — this is the ceiling.**

## 2. In Review → local branch moves (within the ceiling)

The status is the ceiling: never merge, never change it. But two **local, reversible** moves tee up the human who owns the next step. Both target the **live (open) PR's** branch — ignore branches of closed/superseded PRs (BUG-114's #369 vs the live #468 is the canonical trap).

### 2a. Check out the branch for the human

When the next move is a human step that needs the working tree on the PR's branch — an interactive `pnpm db:push`, a local manual verify, a draft to finish — check it out so they can run it immediately. Unlike freshening, this is safe on **any** branch (human-owned `fix/…` included): it's a local checkout, no push.

1. Only if the working tree is **clean** — never clobber uncommitted work. Dirty → skip, say so.
2. `git fetch origin <branch>` (only if absent locally), then `git checkout <branch>`. No force, no push, no status change.
3. **Watch the file trap:** the skill/docs may live on `dev` and not on an older PR branch, so checking the branch out can swap them out of the tree. If you still need a `dev`-only file (e.g. to edit this skill), do that on `dev` first, then check the PR branch out last so the human lands on it.
4. **Schema guard — before handing off a `pnpm db:push`.** `prisma db push` syncs your _local_ schema to the DB's _current_ state, **not** to `dev` — and the dev DB is **shared**. So a `db:push` from a branch whose `.prisma` files are behind `dev` silently **drops every index/constraint that landed on `dev` since the branch forked**, reverting the shared DB to the stale schema. (BUG-114: pushing the 73-commits-behind `fix/…` branch dropped `EmailVerification_token_key` and `PasswordReset_token_key` — unrelated to the ticket's own `Int → Float` change, which was a Mongo no-op.) Run `git diff HEAD origin/dev -- '*.prisma'` first: if `dev` carries schema the branch lacks, **do not report the push** — the branch must be rebased onto `dev` first (a `claude/` branch via §2b; a human-owned `fix/…` branch's rebase is the human's to drive). Only hand off `pnpm db:push` once the branch's schema is current with `dev`.
5. Report which branch is now checked out and the exact command the human runs next (e.g. `pnpm db:push`).

### 2b. Freshen a stale branch

Act only when **both** hold: the PR has been open **> 3 days** and its `claude/<KEY>-*` branch is **behind `origin/dev`**. Condition 2 is the real trigger (no point pulling if `dev` hasn't moved); condition 1 is the "a while" guard so a fresh PR's diff and senior #1's in-flight review comments aren't churned every morning. Force-push makes this **`claude/`-branch only** — never force-push a human-owned `fix/…` branch.

1. Check the branch out; run [`/pull`](../pull/SKILL.md) to rebase `origin/dev` in under the fs2 conflict rules.
2. Clean → `git push --force-with-lease` (never bare `--force`; safe on an agent-owned `claude/` branch). Comment `Refreshed against dev @ <sha>`.
3. Conflicts the fs2 rules can't resolve → comment `needs a manual dev merge — conflicts in <files>`, leave the branch untouched, no force-push.

Never merge the PR, never change the status. Still the ceiling.

## 3. Report — whose move is it?

For any status that isn't the agent's move, change nothing and print three lines:

- **Position** — the status and what it means (per [ticket-lifecycle.md](../../../docs/agents/ticket-lifecycle.md)).
- **Whose move** — the owning role of the _next_ transition (e.g. `In Review` → senior #1's code review), plus the ticket's **assignee**.
- **Agent action** — usually `none — ceiling` (for `In Review`, note whether §2 checked out the branch for a human step or freshened it).

This is the "where is it / who does it" answer the skill exists to give.

## Red flags — STOP

- About to set `Testing`, `Ready for Production`, or `Done` → past the ceiling. Don't.
- About to merge a PR, or push to `dev`/`master` → don't.
- Bare `git push --force` → use `--force-with-lease`.
- About to tell a human to `pnpm db:push` from a branch behind `dev` → STOP. `db push` reverts the **shared** dev DB to your local schema, dropping any index/constraint `dev` added since the fork. Rebase onto `dev` first (§2a step 4).
- Opening a second PR for a ticket that already has a `claude/<KEY>-*` branch → stop, report.
- Re-implementing a ticket that isn't `FOR AI` → stop, report (§3).
