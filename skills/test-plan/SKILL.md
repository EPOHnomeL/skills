---
name: test-plan
description: Produce a staging test plan for a Jira ticket or PR — what to verify, the blast radius to regression-check, and staging checks written as a developer pass then a senior pass. Use when the user wants a test plan / testing methodology / staging verification steps for a change and what to look for; or when another skill needs a pre-merge verification handoff.
argument-hint: "(optional) Jira issue key (e.g. FSE-123), PR number/URL, or 'current branch'"
---

# /test-plan — staging verification for a ticket or PR

Turn a Jira ticket or PR into one followable document: how to verify the change in staging and what to look for. It is run as two passes over the same staging deploy — a **developer pass** by whoever built it, then a **senior pass** by the reviewer. The plan lives in the gap between two things you gather first: the **intent** (what the ticket promised) and the **diff** (what actually changed).

## 1. Resolve the target — intent + diff

From the arg (issue key, PR number/URL, or current branch), get **both** sides:

- **Intent** — fetch the Jira issue (Atlassian MCP `getJiraIssue`) and read its acceptance criteria / expected behaviour. If the issue has no explicit criteria, derive expected behaviour from the description and **say so in the plan**.
- **Diff** — `gh pr view <n>` / `gh pr diff <n>`, or `git diff origin/dev...HEAD` for the current branch. Note base branch and the PR's Vercel preview URL.
- Given only one, find the other: PRs carry the Jira key in the branch/title; the Jira issue often links the PR.

**Done when:** you hold the intent and the diff, and know which PR + preview deploy they map to.

## 2. Read the diff — map the blast radius

Assign **every** changed file to one of two buckets:

- **Change surface** — the new/modified behaviour the ticket asked for. → drives the happy-path checks.
- **Blast radius** — code that calls into, shares state with, or sits downstream of the change. In fs2 terms: router procedures consuming a changed lib, other features reading the same Prisma models, meters/chain flows when a calc or balance moved, anything importing a touched shared package. → drives the regression checks.

**Done when:** every changed file is bucketed and the blast radius is named as *specific flows a tester can open* — not "related areas".

## 3. Run the module's automated tests

Run `/test` scoped to the changed area (a file path or `-t` pattern) — not the whole suite. This is the cheap deterministic layer beneath the manual passes; record the result verbatim (green, or the failing tests). If the change has no runnable tests (UI-only, infra, an external webhook), state that — the manual passes then carry the weight.

**Done when:** the automated result is recorded as green / failing-list / none-because-X.

## 4. Locate staging + judge reproducibility

Capture the entry point: the PR's **Vercel preview deployment** (link in the PR's checks), or whichever staging URL the team points at the ticket. Note the test account/role, feature flags, and seed data a tester needs before step 1.

Then judge each behaviour from step 2 — can a tester drive it through the staging UI or API?

- **Reproducible** → it becomes a numbered step in a pass below.
- **Not reproducible** (a rare race, a one-shot migration, an external webhook, prod-only data volume) → don't invent a step. State it's not reproducible, **why**, and the fallback that gives confidence instead: focused code review, a log line or metric to watch after deploy, a targeted automated test, or a manual DB/console check.

**Done when:** staging entry point + preconditions are captured, and every behaviour is marked reproducible-in-staging or flagged not-reproducible-with-fallback.

## 5. Write the two passes

Each step uses the same schema: **Setup** (precondition/state) → **Do** (exact action + input) → **Expect** (observable result) → **Watch for** (the red flags — console/network errors, wrong data, a broken neighbour, a slow response). Write every step concrete enough that someone who did **not** build the feature can follow it — the senior is the audience test.

- **Developer pass** (built it): exercise every path on the change surface end-to-end. Confirm the happy path, the specific edge cases the code handles, and each acceptance criterion. You know the mechanism — prove it fires.
- **Senior pass** (reviewer, no implementation knowledge): confirm the ticket is actually solved from the user's side, probe the edge cases the developer may have rationalised away, and walk the **blast radius** to confirm nothing adjacent broke. Assumes the developer pass is already green.

**Done when:** every acceptance criterion maps to at least one step, and every blast-radius flow has a senior-pass regression check.

## 6. Emit and place it

Render the plan in the template below. Then offer to post it as a comment on the Jira issue and/or the PR, or hand it back as markdown — don't post without the user's nod.

## Template

```markdown
# Test plan — <ISSUE-KEY> / PR #<n>

**Intent:** <1–2 lines: what should be true after this ships. Note if derived from description vs explicit AC.>
**Staging:** <Vercel preview URL or staging URL>
**Preconditions:** <account/role · feature flags · seed data needed before step 1>

## Automated tests
`<command>` → <green / N failing (list) / none exist because …>

## Developer pass — <you>
1. **Setup:** … **Do:** … **Expect:** … **Watch for:** …
2. …

## Senior pass — <reviewer>
_Assumes the developer pass is green._
1. **Setup:** … **Do:** … **Expect:** … **Watch for:** …   ← acceptance criterion
2. **Setup:** … **Do:** … **Expect:** … **Watch for:** …   ← blast-radius regression
…

## Not reproducible in staging
- **<behaviour>** — <why it can't be driven here> · **Instead:** <code-review focus / log or metric to watch / targeted test / manual check>

## Sign-off
- [ ] Developer pass green — <name>
- [ ] Senior pass green — <name>
```

## Red flags — STOP

- Writing steps before the blast radius is mapped → the plan verifies the feature and misses the regression that ships with it.
- A step the senior can't follow without reading the diff → it isn't a test step, it's a note to yourself. Rewrite with concrete inputs and an observable Expect.
- Inventing staging steps for a behaviour that can't be reproduced there → say "not reproducible" and give the fallback instead of a step that will never really run.
- Marking a pass green while the module's automated tests are red → fix or explain the failures first; a green pass over red tests is a false sign-off.
