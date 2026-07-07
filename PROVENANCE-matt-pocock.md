# Vendored Matt Pocock skills — provenance

These skill directories are **vendored** (bundled) into this kit so a fresh clone is
self-contained — the bootstrap (especially `/grill-with-docs`) works with **no dependency on a
global `~/.claude/skills` install**.

- **Source:** [mattpocock/skills](https://github.com/mattpocock/skills)
- **License:** MIT (see upstream `LICENSE`)
- **Pinned commit:** `5d78bd0903420f97c791f834201e550c765699f8`

## What's bundled and why

| Skill | Upstream path | Role in this kit |
| --- | --- | --- |
| `grill-with-docs` | `skills/engineering/` | Step 4 entry point (locked — user types it) |
| `grill-me` | `skills/productivity/` | grill without docs (locked) |
| **`grilling`** | `skills/productivity/` | **engine** `grill-*` delegates to — was the missing piece |
| **`domain-modeling`** | `skills/engineering/` | **engine** the grill uses to write ADRs/CONTEXT (was missing) |
| `setup-matt-pocock-skills` | `skills/engineering/` | Step 3 — issue tracker / labels / doc layout |
| `tdd` | `skills/engineering/` | test runner workflow |
| `to-prd`, `to-issues`, `triage`, `prototype`, `handoff`, `improve-codebase-architecture` | `skills/engineering/` + `productivity/` | ongoing engineering workflow referenced in `CLAUDE.md` |

`grilling` and `domain-modeling` are **not** locked (`disable-model-invocation` is absent), so the
user-typed `/grill-with-docs` can delegate to them. The wrappers (`grill-with-docs`, `grill-me`,
`setup-matt-pocock-skills`, `to-*`, `triage`, `prototype`, `handoff`,
`improve-codebase-architecture`) keep their upstream `disable-model-invocation: true` lock — see the
invocation matrix in [`app-init.md`](../../app-init.md) and [`CLAUDE.md`](../../CLAUDE.md).

## Refreshing

```sh
git clone https://github.com/mattpocock/skills /tmp/mp-skills
for s in grill-with-docs grill-me grilling domain-modeling setup-matt-pocock-skills \
         tdd to-issues to-prd triage prototype handoff improve-codebase-architecture; do
  src=$(find /tmp/mp-skills/skills -maxdepth 2 -type d -name "$s" | head -1)
  rm -rf ".claude/skills/$s" && cp -r "$src" ".claude/skills/$s"
done
# then bump the pinned commit above
```
