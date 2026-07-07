# claude-skills

Personal dotfiles-style repo for my custom [Claude Code](https://claude.com/claude-code) skills —
one version-controlled source of truth for skills that otherwise scatter across every project's
`.claude/skills/` directory.

## Layout — organized by deploy target

Claude Code only loads skills from a `.claude/skills/` directory (global or per-project). Each top
folder here **maps to one of those load paths**, so deploying is a straight symlink/copy per folder.

| Folder | Deploys to | What's in it |
|---|---|---|
| `user/` | `~/.claude/skills/` | My everyday global set — loads in every project (36 skills). |
| `vault/` | `…/Obsidian Vault/Work/.claude/skills/` | Vault-scoped admin tools: `fs-board`, `prune-skills`. |
| `fs2/` | `C:/Code/Yknot/fs2/.claude/skills/` | fs2-only project skills (12) — `worklist`, `pull`, `push`, `do`, `qa`, `test`, `incident`, `doc-sync`, `explain-as-html`, `html-demo-wizard`, `resolving-merge-conflicts`, `thermo-nuclear-code-quality-review`. |

**DRY, not a full mirror.** `fs2/` holds only skills *unique* to fs2. The Matt Pocock set and other
skills that also live in `user/` are not re-vendored here — deploy `user/` first, then `fs2/` on top.
The `ponytail*` skills are excluded: they come from the [ponytail](https://github.com/DietrichGebert/ponytail)
plugin and are re-installable.

## Provenance

Some skills under `user/` are vendored third-party, not authored by me. See
[`PROVENANCE-matt-pocock.md`](PROVENANCE-matt-pocock.md) — the Matt Pocock engineering/productivity
set ([mattpocock/skills](https://github.com/mattpocock/skills), MIT), with a refresh recipe and
pinned commit.

## Deploy

These are the source of truth; the live `.claude/skills/` dirs are wired from here. On Windows,
symlinks need Developer Mode or an elevated shell (`New-Item -ItemType SymbolicLink`).

**Symlink a whole set (edits stay live, dotfiles-style):**

```powershell
# global set
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude\skills" -Target "C:\Code\claude-skills\user"
```

**Or symlink individual skills** (when the target dir must also hold other, non-repo skills):

```powershell
$repo = "C:\Code\claude-skills"
Get-ChildItem "$repo\fs2" -Directory | ForEach-Object {
  New-Item -ItemType SymbolicLink -Path "C:\Code\Yknot\fs2\.claude\skills\$($_.Name)" -Target $_.FullName
}
```

**Or just copy** (a snapshot, will drift):

```powershell
Copy-Item "C:\Code\claude-skills\user\*" "$env:USERPROFILE\.claude\skills\" -Recurse -Force
```
