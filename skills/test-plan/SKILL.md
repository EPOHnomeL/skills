---
name: test-plan
description: Produce a staging testing methodology for a Jira ticket or PR — a "Testing methodology" heading and a flat list of one-line manual steps to verify the change works and nothing adjacent broke, run by the developer then the senior. Use when the user wants a test plan / testing methodology / manual staging steps for a change and what to look for; or when another skill needs a pre-merge verification handoff.
argument-hint: "(optional) Jira issue key (e.g. FSE-123), PR number/URL, or 'current branch'"
---

# /test-plan — staging verification for a ticket or PR

Turn a Jira ticket or PR into one thing: a **Testing methodology** — a short flat list of manual steps to verify the change in staging and what to look for. One list, run by two people in turn: the developer who built it first, then the senior. Steps 1–4 are your legwork; step 5 is the only thing you output.

## 1. Resolve the target — intent + diff

From the arg (issue key, PR number/URL, or current branch), get **both** sides:

- **Intent** — fetch the Jira issue (Atlassian MCP `getJiraIssue`) and read its acceptance criteria / expected behaviour. If none are explicit, derive them from the description.
- **Diff** — `gh pr view <n>` / `gh pr diff <n>`, or `git diff origin/dev...HEAD` for the current branch. Note the PR's Vercel preview URL.
- Given only one, find the other: PRs carry the Jira key in the branch/title; the Jira issue often links the PR.

**Done when:** you hold the intent and the diff, and know which preview deploy they map to.

## 2. Read the diff — map the blast radius

Sort **every** changed file into:

- **Change surface** — the behaviour the ticket asked for. → the steps that verify it works.
- **Blast radius** — code that calls into, shares state with, or sits downstream of the change (router procedures on a changed lib, features reading the same Prisma models, meters/chain when a calc or balance moved, importers of a touched shared package). → the steps that verify nothing adjacent broke.

**Done when:** the blast radius is named as *specific flows a tester can open* — not "related areas".

## 3. Run the module's automated tests

Run `/test` scoped to the changed area (a file path or `-t` pattern), not the whole suite. Report the result to the user in chat (green / failing) — it does **not** go in the methodology, which is manual only. If there's nothing runnable, skip it.

## 4. Judge reproducibility

For each behaviour, ask: can a tester drive it through the staging UI or API? **Reproducible** → it's a step. **Not reproducible** (a rare race, a one-shot migration, an external webhook, prod-only data) → don't invent a step; add a plain line saying it can't be reproduced in staging, why, and the fallback (code review, a log/metric to watch after deploy, a targeted test).

**Done when:** every behaviour is either a step or a stated not-reproducible line.

## 5. Write the methodology

Output **only** this — a heading, an optional one-line framing sentence, and a flat bullet list. No metadata block, no automated-test line, no sign-off.

```markdown
## Testing methodology (manual)

<Optional framing line: what the change does, the shared way to exercise each step, and the pass condition — so no step repeats it. Add the staging URL / test account here only if a tester needs it.>

- **<action>** — <do it, including the repeat or edge that exercises the change> → <what you should see; name what must and must not happen>
- **<action>** — <do it> → <what you should see>
- **<behaviour>** — can't be reproduced in staging (<why>); instead <fallback>
- …
```

Every step is **one line**: `**action** — trigger → result`. Fold "what to look for" into the → result ("no second invoice", "balance must not grow", "the repeat errors"). Write it for someone who did **not** build the feature — concrete action, observable result, no implementation knowledge assumed. Cover both the change surface and the blast-radius flows in the same list. If a step spills past one line, it's hiding shared setup — hoist that to the framing line.

Then offer to post it as a comment on the Jira issue and/or PR, or hand it back as markdown — don't post without the user's nod.

## Red flags — STOP

- Wrapping the list in a metadata block, automated-test line, or sign-off → output just the heading and the steps.
- A step longer than one line → hoist shared setup to the framing line; state only the trigger → result.
- Writing steps before the blast radius is mapped → the methodology verifies the feature and misses the regression that ships with it.
- A step the senior can't follow without reading the diff → name the concrete action and the observable result instead.
- Inventing a step for a behaviour that can't be reproduced in staging → state it can't be, and give the fallback.
