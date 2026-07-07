// Run with: node --test tooling/docs-check.test.mjs
// Repo-agnostic: every case builds a throwaway tmp tree, so this travels with
// the script unchanged regardless of your repo's documentation surface.
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { checkDocs, parseReferences, validateFile } from "./docs-check.mjs";

const SELF = fileURLToPath(import.meta.url);
const CLI = SELF.replace(/\.test\.mjs$/, ".mjs");

// --- parser: behaviour, not shape ---

test("parses a relative markdown link", () => {
  const refs = parseReferences("see [map](../CONTEXT-MAP.md)");
  assert.deepEqual(refs, [
    { kind: "md", target: "../CONTEXT-MAP.md", line: null },
  ]);
});

test("parses a code reference with a #L line range", () => {
  const refs = parseReferences("[x](packages/api/src/trpc.ts#L12-L20)");
  assert.deepEqual(refs, [
    {
      kind: "code",
      target: "packages/api/src/trpc.ts",
      line: { start: 12, end: 20 },
    },
  ]);
});

test("handles an angle-bracket route-group destination", () => {
  const refs = parseReferences("[t](<apps/web/src/app/(admin)/page.tsx>)");
  assert.deepEqual(refs, [
    { kind: "code", target: "apps/web/src/app/(admin)/page.tsx", line: null },
  ]);
});

test("ignores external links and bare anchors", () => {
  const refs = parseReferences(
    "[a](https://x.com) [b](mailto:a@b.c) [c](#heading)",
  );
  assert.deepEqual(refs, []);
});

// --- validator + CLI: against a throwaway tree ---

function fixtureTree() {
  const root = mkdtempSync(join(tmpdir(), "docs-check-"));
  mkdirSync(join(root, "docs"), { recursive: true });
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src", "real.ts"), "a\nb\nc\n");
  writeFileSync(join(root, "docs", "other.md"), "# Other\n");
  return root;
}

test("no violations when every reference resolves", () => {
  const root = fixtureTree();
  writeFileSync(
    join(root, "docs", "page.md"),
    "[sib](./other.md) and [code](../src/real.ts#L1-L2)",
  );
  assert.deepEqual(validateFile(join(root, "docs", "page.md"), root), []);
});

test("flags a missing link, a missing code ref, and an out-of-range line", () => {
  const root = fixtureTree();
  writeFileSync(join(root, "docs", "a.md"), "[gone](./gone.md)");
  writeFileSync(join(root, "docs", "b.md"), "[gone](../src/gone.ts)");
  writeFileSync(join(root, "docs", "c.md"), "[stale](../src/real.ts#L99)");
  const kinds = checkDocs(root)
    .map((v) => v.kind)
    .sort();
  assert.deepEqual(kinds, [
    "line-out-of-range",
    "missing-code-ref",
    "missing-link",
  ]);
});

test("skips a file carrying the ignore marker", () => {
  const root = fixtureTree();
  writeFileSync(
    join(root, "docs", "tmpl.md"),
    "<!-- docs-check-ignore-file -->\n[ph](./NNNN.md)",
  );
  assert.deepEqual(validateFile(join(root, "docs", "tmpl.md"), root), []);
});

test("CLI exits 0 on a clean tree and non-zero with violations named", () => {
  const clean = fixtureTree();
  writeFileSync(join(clean, "docs", "page.md"), "[sib](./other.md)");
  execFileSync(process.execPath, [CLI, clean]); // throws on non-zero exit

  const broken = fixtureTree();
  writeFileSync(join(broken, "docs", "page.md"), "[gone](./gone.md)");
  let status = 0;
  let stdout = "";
  try {
    stdout = execFileSync(process.execPath, [CLI, broken], { encoding: "utf8" });
  } catch (e) {
    status = e.status;
    stdout = e.stdout;
  }
  assert.notEqual(status, 0);
  assert.match(stdout, /gone\.md/);
});
