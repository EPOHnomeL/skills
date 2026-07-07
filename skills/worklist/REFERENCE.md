# Worklist — reference

## Setup (first run / "reconfigure worklist")

Auto-detect first, then ask only what's left.

1. **cloudId** — `getAccessibleAtlassianResources`. One site → use it. Multiple → ask which.
2. **repo** — `gh repo view --json nameWithOwner -q .nameWithOwner` in the cwd. Used for the dependabot API path.
3. **assignee** — always `currentUser()` in JQL; never ask for a username.

Then one `AskUserQuestion` with these (multiSelect where noted):

- **Jira boards** (multiSelect) — which projects to pull. Discover live options with `getVisibleJiraProjects` if unsure; common here: `BUG`, `FSE`, `KAIA`.
- **Ready-for-Production** — `Exclude (just push)` · `Collapsed count only` · `Include full rows`.
- **Ranking** — `By workflow status` · `Strict Jira priority` · `By workflow status, none`.
- **Output style** — `Single ranked table` · `Grouped tables` · `Compact checklist`.

Write `~/.claude/worklist-config.json`:

```json
{
  "cloudId": "<uuid>",
  "projects": ["BUG", "FSE"],
  "readyForProd": "exclude", // exclude | collapse | include
  "ranking": "status", // status | priority | none
  "output": "single-table", // single-table | grouped | checklist
  "repoFallback": "Yknot-BCS/fs2"
}
```

Confirm the saved settings back to the user in one line, then continue the workflow.

## Ranking orders

**By workflow status** (most actionable → least), Ready-for-Production removed:
`In Review → Testing → In Progress → URGENT (demoted) → Not Started → To Do`.
`URGENT` is a board _status_ (distinct from `priority`); the user treats it as low/non-blocking, so it sorts near the backlog.

**Strict Jira priority**: `URGENT → High → Medium → Low → Lowest` (priority field).

Within any bucket, keep the JQL's secondary sort (priority desc).

## Cross-reference rules

- **PR ↔ ticket**: extract `/[A-Z]{2,}-\d+/` from the PR title and head branch; match to the Jira key. A ticket may have 0..n PRs; show the most recent open one, and note merged ones.
- **Vercel build**: from `statusCheckRollup`, `context == "Vercel"` → `.state` (SUCCESS/FAILURE/PENDING). Fallback: a check whose `name` contains "vercel" → `.conclusion`. Also surface `lint` conclusion when red.
- **`.scratch` ↔ work**: match by theme/keyword to a plan file and cite it in the Action column. Known recurring links in `Yknot-BCS/fs2`:
  - IREC/GCC date & SF04 issues (`BUG-130/133/135/140`) → `.scratch/explain/irec-date-tz-and-sf04-atomicity.html`
  - SAST-day DECLINE / picker overlap → `.scratch/explain/trafford-park-sast-day-overlap.html`, `picker-ceiling-snap.html`
  - Redemption rounding / status lock (`BUG-131`) → `.scratch/redemption-status-lock/`, `docs-gotchas/redemption/RED-*`
  - Inert issuance enum slots (`BUG-152`) → `.scratch/backlog/issues/03-inert-issuance-enum-slots.md`, `docs-gotchas/issuance/ISS-1`
  - Meter ingestion reliability (`BUG-154`, `BUG-167`) → `.scratch/backlog/issues/05-meter-ingestion-reliability-todos.md`
  - PayFast webhook (`BUG-151`) → `.scratch/payfast-edge-cases/`, `docs-gotchas/finance/FIN-1/FIN-2`
  - Security hardening stack (`FSE-60`, security/step-\* PRs) → `.scratch/security-todo/` (~50 items)
  - Reconciler (`FSE-82`) → `.scratch/backlog/issues/02-reconciler-db-chain-evident-omnibus.md`
  - Chain/Inngest layering (`FSE-81`) → `.scratch/backlog/issues/01,06,07`
    These are heuristics — always re-glob `.scratch/` (the gather script lists it) rather than trusting this list.

## Output table

`Rank | Code / PR | Description | Status | PR / Build | Gates dev→master? | .scratch / Action`

- Dependabot HIGH alerts render as a separate table above the worklist (package, score, scope, fix version, note).
- Close with the **dev → master critical path**: just the `Gates = YES` rows, one or two lines.
- When a prior table is in context, prepend a short "changes since last pull" note (merged PRs, status moves, new tickets).
