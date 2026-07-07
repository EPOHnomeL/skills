#!/usr/bin/env node
// docs-check — fail when a knowledge-bank file references something that
// doesn't exist: a moved/deleted page, a mistyped source path, or a
// `file#Lnn` anchor that has drifted past the end of its target file. This
// guards the two drift modes a weekly LLM doc-sync can't reliably catch and
// that drift continuously (links break on file moves; line anchors shift on
// every edit to a referenced file). Run on every PR via `pnpm docs:check`.
//
// Deliberately small and dependency-free. It does NOT judge prose (that's
// doc-sync's job) — it only proves references resolve. Pair it with the weekly
// drift-sync routine (populate-knowledge-bank): the script proves what a script
// can prove for free; the LLM pass judges prose-vs-behaviour.
//
// Usage: node tooling/docs-check.mjs [root]   (root defaults to repo root)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// SKILL: replace — the documentation surface for THIS repo. docs-check
// validates references inside exactly these files. Match it to your knowledge
// bank's layout (see references/ci-reference-check.md §"The surface seam"):
//   ROOT_FILES     — root context files (drop AGENTS.md / CONTEXT-MAP.md if absent)
//   DOC_DIRS       — directories walked recursively for *.md
//   CONTEXT_GROUPS — dirs whose immediate */CONTEXT.md children are docs (monorepo)
//   EXTRA_FILES    — any one-off context files not covered above
const ROOT_FILES = ["CONTEXT.md", "CONTEXT-MAP.md", "CLAUDE.md", "AGENTS.md"];
const DOC_DIRS = ["docs"];
const CONTEXT_GROUPS = ["packages", "apps"];
const EXTRA_FILES = ["ops/CONTEXT.md"];

// A file can opt out (e.g. a scaffold/template with illustrative placeholder
// links) with this marker in an HTML comment — explicit beats guessing.
const IGNORE_MARKER = "docs-check-ignore-file";

export function docFiles(root) {
  const roots = [
    ...ROOT_FILES.map((f) => join(root, f)),
    ...DOC_DIRS.map((d) => join(root, d)),
    ...EXTRA_FILES.map((f) => join(root, f)),
  ];
  for (const group of CONTEXT_GROUPS) {
    const dir = join(root, group);
    if (!existsSync(dir)) continue;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) roots.push(join(dir, e.name, "CONTEXT.md"));
    }
  }

  const found = new Set();
  const walk = (p) => {
    if (!existsSync(p)) return;
    if (statSync(p).isDirectory())
      readdirSync(p).forEach((c) => walk(join(p, c)));
    else if (p.toLowerCase().endsWith(".md")) found.add(resolve(p));
  };
  roots.forEach(walk);
  return [...found];
}

// Scan markdown link destinations by hand: CommonMark allows angle-bracket
// destinations (`[t](<a (b).ts>)`) and balanced parens in bare ones, both of
// which a `\(([^)]+)\)` regex truncates — and docs link to route-group paths
// like `(admin)/…` wrapped in `<…>` for exactly that reason.
export function linkDestinations(body) {
  const dests = [];
  let i = 0;
  while (i < body.length) {
    const open = body.indexOf("](", i);
    if (open < 0) break;
    let j = open + 2;
    while (body[j] === " " || body[j] === "\t") j++;
    let dest = "";
    if (body[j] === "<") {
      const close = body.indexOf(">", j + 1);
      if (close < 0) {
        i = j;
        continue;
      }
      dest = body.slice(j + 1, close);
      j = close + 1;
    } else {
      let depth = 0;
      const start = j;
      while (j < body.length) {
        const c = body[j];
        if (c === "(") depth++;
        else if (c === ")") {
          if (depth === 0) break;
          depth--;
        } else if (c === " " || c === "\t" || c === "\n" || c === "\r") break;
        j++;
      }
      dest = body.slice(start, j);
    }
    if (dest) dests.push(dest);
    i = j + 1;
  }
  return dests;
}

// Turn link destinations into the references we check: in-repo markdown links
// and code references, each with its `#Lnn`/`#Lnn-Lmm` line anchor if present.
// External (`http`, `mailto`, …) and bare `#anchor` destinations are skipped.
export function parseReferences(body) {
  const refs = [];
  for (const dest of linkDestinations(body)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(dest)) continue; // scheme → external
    const hash = dest.indexOf("#");
    const target = hash >= 0 ? dest.slice(0, hash) : dest;
    if (!target) continue; // bare in-page anchor
    const fragment = hash >= 0 ? dest.slice(hash + 1) : "";
    const m = fragment.match(/^L(\d+)(?:-L?(\d+))?$/);
    const line = m ? { start: +m[1], end: m[2] ? +m[2] : +m[1] } : null;
    refs.push({ kind: target.endsWith(".md") ? "md" : "code", target, line });
  }
  return refs;
}

function countLines(absPath) {
  const c = readFileSync(absPath, "utf8");
  if (c === "") return 0;
  const lines = c.split(/\r?\n/);
  return lines[lines.length - 1] === "" ? lines.length - 1 : lines.length;
}

// Validate one file's references against the filesystem. Returns violations:
// { sourceFile, reference, kind, reason }.
export function validateFile(absPath, root) {
  const body = readFileSync(absPath, "utf8");
  if (body.includes(IGNORE_MARKER)) return [];
  const out = [];
  for (const ref of parseReferences(body)) {
    let t = ref.target;
    try {
      t = decodeURIComponent(t);
    } catch {
      /* leave as-is */
    }
    const abs = t.startsWith("/")
      ? resolve(root, t.replace(/^\/+/, ""))
      : resolve(dirname(absPath), t);
    if (!existsSync(abs)) {
      out.push({
        sourceFile: absPath,
        reference: ref.target,
        kind: ref.kind === "md" ? "missing-link" : "missing-code-ref",
        reason: `target does not exist: ${ref.target}`,
      });
    } else if (ref.line) {
      const lines = countLines(abs);
      if (ref.line.end > lines) {
        out.push({
          sourceFile: absPath,
          reference: ref.target,
          kind: "line-out-of-range",
          reason: `line ${ref.line.end} past end of file (${lines} lines): ${ref.target}`,
        });
      }
    }
  }
  return out;
}

export function checkDocs(root) {
  return docFiles(root).flatMap((f) => validateFile(f, root));
}

function main() {
  const root = resolve(
    process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  );
  const violations = checkDocs(root);
  if (violations.length === 0) {
    process.stdout.write("docs-check: no broken references found.\n");
    return;
  }
  const rel = (p) =>
    "/" + posix.normalize(relative(root, p).split("\\").join("/"));
  const byFile = new Map();
  for (const v of violations) {
    const k = rel(v.sourceFile);
    (byFile.get(k) ?? byFile.set(k, []).get(k)).push(v);
  }
  process.stdout.write(
    `docs-check: ${violations.length} broken reference(s) in ${byFile.size} file(s):\n\n`,
  );
  for (const [file, group] of byFile) {
    process.stdout.write(`${file}\n`);
    for (const v of group) process.stdout.write(`  [${v.kind}] ${v.reason}\n`);
    process.stdout.write("\n");
  }
  process.exitCode = 1;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
