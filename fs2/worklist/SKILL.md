---
name: worklist
description: Pulls the current user's Jira work (assigned, not Done) and cross-references each ticket with open GitHub PRs, their Vercel build status, and any matching local plan in the repo's .scratch dir, then emits one ranked worklist table plus a table of open dependabot HIGH alerts. Per-user preferences (boards, ranking, styling) are stored and asked on first run. Use when the user asks to pull/repull their worklist or work table, "what's my work", "my jira + PRs", a dev→master release checklist, or to refresh the ranked todo.
---

# Worklist

Builds a single ranked table of the current user's outstanding work: Jira tickets ⟷ open PRs ⟷ Vercel build ⟷ `.scratch` plans, plus open dependabot HIGH alerts that gate `dev → master`.

Preferences differ per team member, so nothing user-specific is hardcoded here. They live in a per-user config file and are asked once.

## Step 0 — Load or create the user's config

Config file: `~/.claude/worklist-config.json` (per machine/user). Read it first.

- **If it exists**, use it. (Re-run setup if the user says "reconfigure worklist" / "change my worklist prefs".)
- **If it is missing**, run **first-run setup**: auto-detect what you can, then ask the rest with one `AskUserQuestion`, then write the file. See [REFERENCE.md](REFERENCE.md) § Setup for the exact questions and schema.

Auto-detect (don't ask): the Jira **cloudId** via `getAccessibleAtlassianResources` (if >1 site, ask which); the **assignee** is always `currentUser()` (no username needed); the **GitHub repo** from `gh repo view --json nameWithOwner` in the working dir.

Ask (saved to config): **projects/boards**, **Ready-for-Production handling** (exclude / collapsed count / full rows), **ranking** (workflow status / Jira priority / none), **output style** (single table / grouped / checklist).

## Workflow

1. **Pull Jira.** Call `searchJiraIssuesUsingJql` with the config's cloudId and JQL
   `assignee = currentUser() AND statusCategory != Done AND project in (<projects>) ORDER BY status ASC, priority DESC`,
   `fields: ["summary","status","priority","issuetype"]`, `maxResults: 100`. The result almost always overflows the token cap and is saved to a file — take that path from the error and run:
   `node <skill>/scripts/parse-jira.mjs "<saved-file-path>"` → TSV `key  status  priority  type  summary` (handles both `.issues[]` and `.issues.nodes[]` shapes).
2. **Pull GitHub + .scratch.** Run `node <skill>/scripts/gather.mjs` from inside the repo. It prints open PRs (number, draft?, base, author, extracted Jira code, Vercel state, lint), open dependabot HIGH alerts, and a `.scratch/` listing.
3. **Cross-reference** (rules in [REFERENCE.md](REFERENCE.md)): PR ↔ ticket by the `[A-Z]{2,}-\d+` code in PR title/branch; ticket/PR ↔ `.scratch` by theme → note the plan file in the Action column. Flag PRs **merged since a prior pull** and **status changes** when a previous table is in context.
4. **Apply config:** drop / collapse / keep Ready-for-Production per setting; rank remaining items per the chosen ranking; render in the chosen output style.
5. **Gate marking:** `Gates dev→master?` = YES for non-draft green PRs awaiting merge and for open dependabot HIGH alerts. Draft PRs and others' PRs sort below the user's tickets.
6. **Emit** the dependabot HIGH table, then the worklist, then a 1–2 line **dev → master critical path** summary (the YES rows only).

## Notes

- Never read the full raw Jira result inline — it overflows; always parse the saved file with the script.
- `jq` is not installed; use `gh --jq` (bundled) or the node scripts.
- If `gh` auth or the Atlassian MCP is unavailable, say so and emit whatever half you could gather.
- Default fallbacks if config is somehow incomplete: projects `["BUG","FSE"]`, repo `Yknot-BCS/fs2`, exclude Ready-for-Production, rank by workflow status, single table.
