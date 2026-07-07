---
name: test-plan
description: Produce a staging testing methodology for a Jira ticket or PR — what to verify plus the blast radius to regression-check, as one flat list of one-line manual checks the developer runs first and the senior re-runs after. Use when the user wants a test plan / testing methodology / staging verification steps for a change and what to look for; or when another skill needs a pre-merge verification handoff.
argument-hint: "(optional) Jira issue key (e.g. FSE-123), PR number/URL, or 'current branch'"
---

# /test-plan — staging verification for a ticket or PR

Turn a Jira ticket or PR into a short, followable methodology: how to verify the change in staging and what to look for. It's **one** methodology run twice over the same staging deploy — the developer who built it runs it first, then the senior re-runs the same checks independently. The plan lives in the gap between two things you gather first: the **intent** (what the ticket promised) and the **diff** (what actually changed).

**Terse by default.** The whole plan should fit on a screen. Every check is one line (see step 5); shared setup lives in a single framing line, not repeated per check.

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

Run `/test` scoped to the changed area (a file path or `-t` pattern) — not the whole suite. This is the cheap deterministic layer beneath the manual checks; record the result in **one line** (green, or the failing tests). If the change has no runnable tests (UI-only, infra, an external webhook), say so — the manual checks then carry the weight.

**Done when:** the automated result is one line: green / failing-list / none-because-X.

## 4. Locate staging + judge reproducibility

Capture the entry point: the PR's **Vercel preview deployment** (link in the PR's checks), or whichever staging URL the team points at the ticket. Note the test account/role, feature flags, and seed data a tester needs before the first check.

Then judge each behaviour from step 2 — can a tester drive it through the staging UI or API?

- **Reproducible** → it becomes a one-line check.
- **Not reproducible** (a rare race, a one-shot migration, an external webhook, prod-only data volume) → don't invent a check. State it's not reproducible, **why**, and the fallback that gives confidence instead: focused code review, a log line or metric to watch after deploy, a targeted automated test, or a manual DB/console check.

**Done when:** staging entry point + preconditions are captured, and every behaviour is marked reproducible-in-staging or flagged not-reproducible-with-fallback.

## 5. Write the methodology — one flat list, one line per check

Open with a **framing line**: what the change does, the shared way to exercise every check, and the single pass condition — so no check repeats setup. Then one flat list, each check exactly one line:

> **\<action\>** — \<trigger, including the repeat or edge that exercises the fix\> → \<observable result, phrased so the failure mode is named\>

It's **one** list, run by two people in turn — the developer runs it first, the senior re-runs it after — so write every check for someone who did **not** build the feature: concrete action, observable result, no implementation knowledge assumed. Cover both the change surface (happy path + each acceptance criterion + the edges the code handles) and the **blast radius** (one check per adjacent flow that could break); tag the regression checks so the reason shows.

Fold "what to look for" **into** the → result — name what must and must not happen ("no second invoice", "balance must not grow", "the repeat errors"). Don't give it its own field. A check that spills past one line is hiding shared setup — hoist that to the framing line.

**Done when:** every acceptance criterion and every blast-radius flow is one line, all shared setup sits in the framing line, and a reader who didn't build it could follow each check.

## 6. Emit and place it

Render the plan in the template below. Then offer to post it as a comment on the Jira issue and/or the PR, or hand it back as markdown — don't post without the user's nod.

## Template

```markdown
# Test plan — <ISSUE-KEY> / PR #<n>

**Change:** <one line: what's true after this ships>  ·  **Staging:** <preview URL>
**Setup:** <account/role · flags · seed data before the first check>  ·  **Automated:** `<cmd>` → <green / N failing / none, because …>

## Testing methodology (manual / UI)

<Framing line: what the change does + the shared way to exercise every check + the single pass condition. So no check below repeats it.>

- **<action>** — <trigger, incl. the repeat/edge> → <expected; failure mode named>
- **<action>** — <trigger> → <expected>
- **<action>** — <trigger> → <expected>   ← regression (blast radius)
- …

## Not reproducible in staging
- **<behaviour>** — <why> · **Instead:** <review focus / log or metric / targeted test / manual check>

## Sign-off
- [ ] Developer — <name>    - [ ] Senior — <name>
```

## Red flags — STOP

- A check longer than one line → it's carrying shared setup; hoist that to the framing line and state only the trigger → result.
- Writing checks before the blast radius is mapped → the plan verifies the feature and misses the regression that ships with it.
- A check the senior can't follow without reading the diff → name the concrete action and the observable result instead.
- Inventing a staging check for a behaviour that can't be reproduced there → say "not reproducible" and give the fallback.
- Marking the run green while the module's automated tests are red → fix or explain the failures first; green over red tests is a false sign-off.
