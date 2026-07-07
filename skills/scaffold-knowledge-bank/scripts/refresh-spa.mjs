#!/usr/bin/env node
// refresh-spa.mjs — re-vendor the upstream knowledge-bank machinery into this skill.
//
// upstream is canonical. This pulls the four machinery files at a pinned ref,
// re-inserts the `SKILL: replace` sentinels by anchoring on DURABLE declarations (never line
// numbers, so an upstream SPA refactor doesn't break us), stamps provenance, and updates
// PROVENANCE.md. The same `decorate()` used here is what produced the shipped assets — so this
// script is authoritative, not a side tool.
//
// Usage:
//   node scripts/refresh-spa.mjs --repo <url> --ref <branch|tag|sha> [--sha <sha-for-stamp>]
//   node scripts/refresh-spa.mjs --from-local <dir> --sha <sha>   # decorate from already-checked-out files (used in tests)
//
// NOTE: upstream is project-specific. A refresh re-introduces the upstream brand, seed registries, glossary-
// priority order, ADR-page copy, and the narrower TS/JS language list. decorate() handles the
// header, the registry/CODE_PREFIXES/brand/theme SENTINELS, and themes the highlight band — it does
// NOT neutralize the upstream domain content or broaden the language list. After pulling, re-run the
// genericization (brand -> generic, seed registries -> your neutral example, broaden CODE_EXTS /
// LANG_MAP) as a documented post-refresh step.
//
// // The git fetch runs with your git credentials in your environment. Prefer a STABLE branch ref
// (main/dev) over a one-off feature-branch SHA, which may be squashed/rebased away on merge.

import { execSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL = resolve(fileURLToPath(import.meta.url), "..", "..");
const FILES = {
  "docs/architecture/index.html": "assets/index.html",
  "docs/architecture/README.md": "references/authoring-conventions.md",
  "tooling/docs-meta.mjs": "assets/docs-meta.mjs",
  "tooling/docs-graph.mjs": "assets/docs-graph.mjs",
};

function args() {
  const a = process.argv.slice(2);
  const o = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith("--")) o[a[i].slice(2)] = a[i + 1] && !a[i + 1].startsWith("--") ? a[++i] : true;
  }
  return o;
}

// Insert `add` immediately before the unique anchor. Throws if the anchor isn't unique — a moved
// or refactored-away anchor must fail loud, not silently skip a seam.
function before(text, anchor, add) {
  const n = text.split(anchor).length - 1;
  if (n !== 1) throw new Error(`anchor not unique (${n}x): ${anchor.slice(0, 60)}…`);
  return text.replace(anchor, add + anchor);
}

function decorateIndexHtml(t, sha) {
  t = before(
    t,
    '    <meta charset="utf-8" />\n',
    "",
  ); // no-op guard that charset exists
  const hdr = `    <!-- Vendored from upstream@${sha}. Do NOT hand-edit; run scripts/refresh-spa.mjs. Repo-specific seams are marked \`SKILL: replace\`. -->\n`;
  t = t.replace('    <meta charset="utf-8" />\n', '    <meta charset="utf-8" />\n' + hdr);
  const seam = (n) =>
    `      // SKILL: replace ${n} — derive per references/registry-substitution.md; replace the literal below. Remove this line when done.\n`;
  for (const [n, anchor] of [
    ["CONTEXTS", "      const CONTEXTS = ["],
    ["SUBMODULES", "      const SUBMODULES = ["],
    ["GLOSSARY_SOURCES", "      const GLOSSARY_SOURCES = ["],
    ["REFERENCES", "      const REFERENCES = ["],
    ["ADRS", "      const ADRS = ["],
    ["NODE_TO_SLUG", "      const NODE_TO_SLUG = {"],
  ]) {
    t = before(t, anchor, seam(n));
  }
  t = before(
    t,
    '      const CODE_PREFIXES = ["/packages/", "/apps/", "/ops/", "/tooling/", "/turbo/"];',
    "      // SKILL: replace CODE_PREFIXES (optional) — code-drawer path prefixes; change only if this repo's code dirs differ.\n",
  );
  // theme seam — mark the :root design tokens (light + dark) for project substitution.
  t = before(
    t,
    "      :root {\n        --bg:",
    "      /* SKILL: replace theme — substitute these design tokens (and the dark block below) with the project's palette/fonts; see references/theming.md. */\n",
  );
  // theme the line-highlight band if upstream still hardcodes the brand green.
  if (t.includes("background: rgba(150, 199, 72, 0.22);"))
    t = t.replace("background: rgba(150, 199, 72, 0.22);", "background: var(--primary-soft);");
  // brand sentinels — anchored on STRUCTURE (not brand text) so they work for any upstream brand.
  t = before(t, "    <title>", "    <!-- SKILL: replace brand (title) -->\n");
  t = before(
    t,
    '          <span class="dot"></span>\n',
    '',
  ); // guard: dot span exists
  t = t.replace(
    '          <span class="dot"></span>\n',
    '          <span class="dot"></span>\n          <!-- SKILL: replace brand (sidebar) -->\n',
  );
  return t;
}

function decorateMjs(t, sha, sentinels) {
  t = t.replace(
    "#!/usr/bin/env node\n",
    `#!/usr/bin/env node\n// Vendored from upstream@${sha}. Do NOT hand-edit; run scripts/refresh-spa.mjs.\n`,
  );
  for (const [anchor, add] of sentinels) t = before(t, anchor, add);
  return t;
}

function decorate(srcDir, sha) {
  // index.html
  writeFileSync(join(SKILL, "assets/index.html"), decorateIndexHtml(readFileSync(join(srcDir, "docs/architecture/index.html"), "utf8"), sha));
  // README (reference, no sentinels)
  cpSync(join(srcDir, "docs/architecture/README.md"), join(SKILL, "references/authoring-conventions.md"));
  // docs-meta.mjs (one semantic seam)
  writeFileSync(
    join(SKILL, "assets/docs-meta.mjs"),
    decorateMjs(readFileSync(join(srcDir, "tooling/docs-meta.mjs"), "utf8"), sha, [
      [
        "const contextSlugByName = {",
        "// SKILL: replace contextSlugByName — author cluster-name(lowercased) -> slug; see references/registry-substitution.md\n",
      ],
    ]),
  );
  // docs-graph.mjs (one layout seam: CODE_DIRS)
  writeFileSync(
    join(SKILL, "assets/docs-graph.mjs"),
    decorateMjs(readFileSync(join(srcDir, "tooling/docs-graph.mjs"), "utf8"), sha, [
      [
        'const CODE_DIRS = ["packages/", "apps/", "ops/", "tooling/", "turbo/"];',
        "// SKILL: replace CODE_DIRS (optional) — adjust if this repo isn't a packages/apps monorepo.\n",
      ],
    ]),
  );
  console.log(`decorated assets from ${srcDir} @ ${sha}`);
}

function gitCheckout(repo, ref) {
  const dir = mkdtempSync(join(tmpdir(), "the reference repo-refresh-"));
  const run = (c) => execSync(c, { cwd: dir, stdio: ["ignore", "pipe", "inherit"] }).toString().trim();
  const isSha = /^[0-9a-f]{7,40}$/i.test(ref);
  execSync(`git init -q`, { cwd: dir });
  execSync(`git remote add origin ${repo}`, { cwd: dir });
  // blobless, single-commit fetch
  execSync(`git fetch --depth 1 --filter=blob:none origin ${ref}`, { cwd: dir, stdio: ["ignore", "pipe", "inherit"] });
  execSync(`git checkout -q FETCH_HEAD`, { cwd: dir });
  const sha = run(`git rev-parse HEAD`);
  return { dir, sha };
}

function stampProvenance(sha, repo, ref) {
  const p = join(SKILL, "PROVENANCE.md");
  if (!existsSync(p)) return;
  let t = readFileSync(p, "utf8");
  t = t.replace(/\| Pinned ref \(SHA\) \| `[^`]*` \|/, `| Pinned ref (SHA) | \`${sha}\` |`);
  t = t.replace(/\| Snapshot taken \| [^|]* \|/, `| Snapshot taken | ${new Date().toISOString().slice(0, 10)} |`);
  if (ref) t = t.replace(/\| Branch at snapshot \| [^|]* \|/, `| Branch at snapshot | ${ref} |`);
  writeFileSync(p, t);
  console.log(`PROVENANCE.md stamped: ${sha}`);
}

const o = args();
if (o["from-local"]) {
  if (!o.sha) throw new Error("--from-local requires --sha");
  decorate(resolve(o["from-local"]), o.sha);
} else {
  const repo = o.repo;
  if (!repo) throw new Error("--repo <url> required (no default — supply your source repo)");
  if (!o.ref) throw new Error("--ref <branch|tag|sha> required (prefer a stable branch over a feature-branch SHA)");
  console.log(`fetching ${repo} @ ${o.ref} …`);
  const { dir, sha } = gitCheckout(repo, o.ref);
  decorate(dir, o.sha || sha);
  stampProvenance(o.sha || sha, repo, typeof o.ref === "string" ? o.ref : "");
}
