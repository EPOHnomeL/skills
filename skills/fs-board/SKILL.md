---
name: fs-board
description: >-
  Regenerate Jonathan's Fuelswitch work board — a single ranked snapshot that
  cross-walks his open GitHub PRs, Jira issues, and live .scratch/ dirs and flags
  the gaps between them. Use when asked to refresh/regenerate the FS board, run
  /fs-board, prep for standup, or answer "what's on my plate / what should I work on"
  for Fuelswitch.
allowed-tools:
  - Bash
  - PowerShell
  - Glob
  - Read
  - Write
  - mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql
---

# fs-board

The board is a **cross-walk** — it joins Jonathan's open PRs ↔ Jira issues ↔ `.scratch/` dirs and
surfaces where they disagree (a PR with no ticket, a ticket whose PR already merged). Match the
previous board (now in `03-Generated/archived/`) for shape and tone.

## Paths
- fs2 repo: the path given as an argument, else `C:\Code\Yknot\fs2` (the canonical clone).
- `.scratch/`: **only** `C:\Code\Yknot\fs2\.scratch\` — do not scan any other clone (e.g. an old Desktop copy).
- Output: `C:\Users\lemon\Desktop\Admin\Obsidian Vault\Work\03-Generated\Board.md`.

## Steps

1. **GitHub** — list open PRs:
   `gh pr list -R Yknot-BCS/fs2 --state open --limit 60 --json number,title,author,isDraft,reviewDecision,statusCheckRollup,headRefName,url,updatedAt`
   Split into **mine** (author login `EPOHnomeL`) vs **others' PRs to review**. Record draft status,
   review decision, and a CI rollup (✅ pass / ❌ fail / pending) per PR. Skip `fs-marketing` unless asked.

2. **Jira** — call `searchJiraIssuesUsingJql` with
   cloudId `ad33c03b-52d5-40ad-b9c7-4f8b5966dd9f`, `maxResults: 100`,
   `fields: ["key","summary","status","priority","issuetype"]`,
   jql: `project in (BUG, FSE) AND statusCategory != Done AND assignee = currentUser() ORDER BY priority DESC, updated DESC`.
   The payload is large and ignores the `fields`/format params, so the tool saves it to a file and
   returns the path. Parse that file from disk with PowerShell so the raw payload stays out of context,
   then emit a compact table:
   `$j = Get-Content '<saved-file>' -Raw | ConvertFrom-Json; $j.issues.nodes | ForEach-Object { ... key, fields.summary, fields.status.name, fields.priority.name, fields.issuetype.name }`
   If the issue count equals `maxResults`, the query capped — note "may be more" in the snapshot header.

3. **`.scratch/`** — list the `.scratch/` dir from Paths with a shell `ls -la "<repo>/.scratch"`; Glob
   silently skips this dot-directory, so don't rely on it. Skim each entry (`README`/`TODO`/`*.md`/plan/
   report) and one-line what it is and whether it's promotable or stale. Treat it as optional: if empty
   or absent, note "none".

4. **Cross-walk** — link each PR to its Jira issue via the `BUG-###`/`FSE-###` token in the PR title or
   branch; link `.scratch` dirs by topic. Flag the gaps: PRs with no ticket, issues "In Review" with no
   open PR, issues referencing a PR that's no longer open (likely merged → walk to Done), and drafts
   blocked on external signals.

5. **Write** `03-Generated\Board.md` with real `- [ ]` checkboxes (Obsidian Tasks compatible) and
   `[KEY](https://fuelswitch.atlassian.net/browse/KEY)` / PR-URL links. Archive first: move any existing
   `Board.md` to `03-Generated\archived\Board <its-snapshot-date>.md`. Structure (the archived board is
   your exemplar for finer grouping and tone):
   - Frontmatter `cssclasses: [wide]`, then the `# FS Board — My Work` title.
   - `Snapshot: <today's date> • via /fs-board • N PRs · M issues` (add the cap caveat if step 2 capped).
   - `## 🔀 PRs to review / fix` — mine needing action + others' PRs to review.
   - `## 🚧 Drafts (WIP — not for review)`
   - `## 🔥 Urgent` — URGENT-status and Highest-priority open issues.
   - `## 👀 In Review` · `## 🛠 In Progress` · `## 🧪 Testing` — by Jira status, priority-ordered, PR links inline.
   - `## 📋 Not Started / Backlog` — priority-ordered, sub-grouped by priority band and epic.
   - `## ⚠️ Needs attention (cross-walk gaps)` — the gaps from step 4.
   - `## .scratch` — promote-or-delete candidates, or "none".

6. **Reply in chat** with a 3–5 line summary: PR / open-issue counts and the top 3 things to do next.
   Point to the file for the rest — the board lives there, not in chat.
