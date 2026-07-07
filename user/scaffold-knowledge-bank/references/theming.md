# Theming — use the project's styling, not the example's

The SPA's look is driven entirely by CSS custom properties in a `:root` block (plus a
`:root[data-theme="dark"]` block) at the top of `index.html`, marked with the
`/* SKILL: replace theme */` sentinel. Substitute these with the target project's palette and fonts;
do **not** ship the bundled example colors as if they were the project's brand.

## What to set

| Token | Role | Where to source it |
| --- | --- | --- |
| `--primary`, `--primary-strong`, `--primary-soft` | brand accent (active nav, links, line-highlight band) | the project's primary brand color; `*-soft` is the same hue at low alpha |
| `--accent` | secondary accent (section labels) | secondary brand color |
| `--bg`, `--card`, `--fg`, `--heading-fg`, `--muted-fg`, `--border` | surfaces + text | the project's neutrals |
| `--code-bg`, `--pre-bg`, `--pre-fg`, `--tooltip-bg`, `--tooltip-fg` | code/tooltip surfaces | usually leave as sensible defaults |
| fonts (`font-family` in `body`/mono rules) | typography | the project's UI + mono fonts |

Set **both** the light `:root` block and the `:root[data-theme="dark"]` block, or dark mode keeps
the example palette.

## How to derive it (in priority order)

1. **Existing design tokens** — if the repo has CSS variables, a Tailwind `theme.extend.colors`, a
   `tokens.json`/`theme.ts`, or a brand stylesheet, read the primary/accent/neutrals from there.
2. **A brand guide / logo** — pull the hex values the team already uses.
3. **Ask** — if there's no discoverable source, ask the user for primary + accent hex (one question),
   and keep the example neutrals.

## Two colors that are NOT in the token block (adjust separately)

- **Mermaid `classDef` colors** live in the markdown (`overview.md` and any page with a diagram), not
  in `:root`. They're author-controlled per page — set them to the project palette when you author the
  system map, or they'll stay the example green/blue.
- The **code drawer's code background** (`#2d2d2d`) is a generic dark editor surface; leave it unless
  the project has a strong reason to change it. (The line-highlight band already uses `--primary-soft`,
  so it themes automatically.)

## Don't break the seam
After substituting, delete the `/* SKILL: replace theme */` comment line (same discipline as the
registry sentinels). Re-run `pnpm documentation` and confirm the SPA renders in the project's colors.
