#!/usr/bin/env node
// Vendored from upstream@9aa1d25e0c9180cefff7e4f1e2c7302a9f874bf0. Do NOT hand-edit; run scripts/refresh-spa.mjs.
// Build the code-graph artifact the architecture SPA renders on its
// "Code Graph" page. We drive GitNexus (https://github.com/abhigyanpatwari/GitNexus)
// to index the repo, then pull nodes/edges/clusters back out via its `cypher`
// CLI command and normalize them into a compact JSON shape we own.
//
//   GitNexus (local index)  →  cypher dumps  →  docs/architecture/graph/code-graph.json
//
// GitNexus has no turnkey graph export, so `cypher` is the extraction surface.
// Its output is JSON-wrapped Markdown tables ({ markdown, row_count }); we ask
// for scalar columns only and parse the table rows.
//
// The index store lands in `.gitnexus/` and the artifact under
// docs/architecture/graph/ — both gitignored. Nothing here is committed; the
// graph is a local-only build to keep the repo small. The SPA degrades
// gracefully if the artifact is missing — the page just says "not generated
// yet". Run via `pnpm documentation:setup-graph`.
//
// Flags:
//   --skip-analyze   reuse the existing .gitnexus/ index (skip re-indexing)
//   --path <dir>     analyze a sub-tree instead of the whole repo (for testing)
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "..", "..");
const outDir = join(root, "docs", "architecture", "graph");
const outFile = join(outDir, "code-graph.json");

const args = process.argv.slice(2);
const skipAnalyze = args.includes("--skip-analyze");
const pathIdx = args.indexOf("--path");
const analyzePath = pathIdx >= 0 ? args[pathIdx + 1] : ".";

// `gitnexus` is invoked via npx by default so contributors don't need a global
// install; override with GITNEXUS_BIN (e.g. a globally-installed `gitnexus`).
// We run through a shell (execSync) so the OS resolves `npx`→`npx.cmd` on
// Windows — Node refuses to spawn .cmd files directly since v18.20.
const binEnv = process.env.GITNEXUS_BIN;
const [bin, baseArgs] = binEnv
  ? [binEnv, []]
  : ["npx", ["-y", "gitnexus@latest"]];

// Code directories worth graphing. Everything else (docs, root configs,
// generated output) is dropped so the graph stays a *code* graph and bounded.
// These mirror the SPA's CODE_PREFIXES so every node can feed `fsOpenCode`.
// SKILL: replace CODE_DIRS (optional) — adjust if this repo isn't a packages/apps monorepo.
const CODE_DIRS = ["packages/", "apps/", "ops/", "tooling/", "turbo/"];
// Node kinds we keep: files plus code symbols. Folder/Section (markdown
// headings) are structural noise for a code graph.
const SYMBOL_KINDS = new Set([
  "File",
  "Function",
  "Method",
  "Class",
  "Const",
  "Interface",
  "Enum",
  "Type",
  "Variable",
]);

// Wrap any arg containing whitespace in double quotes. Our cypher queries
// contain spaces/parens but no inner double quotes, so this is sufficient and
// works under both cmd.exe and POSIX shells.
function shellQuote(a) {
  return /[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a;
}

function run(extraArgs, { capture = false } = {}) {
  const cmd = [bin, ...baseArgs, ...extraArgs].map(shellQuote).join(" ");
  return execSync(cmd, {
    cwd: root,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    maxBuffer: 512 * 1024 * 1024,
    encoding: "utf8",
  });
}

// `cypher` returns { markdown: "| h |\n| --- |\n| v |", row_count } or
// { error }. We only ever select scalar columns, so a naive pipe-split is safe.
function cypher(query) {
  const raw = run(["cypher", query], { capture: true });
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`cypher returned non-JSON output:\n${raw.slice(0, 500)}`);
  }
  if (parsed.error) throw new Error(`cypher error: ${parsed.error}`);
  const md = parsed.markdown || "";
  const lines = md.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return []; // header + separator only → no rows
  const headers = splitRow(lines[0]);
  return lines.slice(2).map((line) => {
    const cells = splitRow(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

function splitRow(line) {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
}

// "packages/api/src/lib/minting.ts" → "api"; "apps/nextjs/..." → "nextjs".
function packageOf(filePath) {
  const m = filePath.match(/^(?:packages|apps)\/([^/]+)\//);
  if (m) return m[1];
  const top = filePath.split("/")[0];
  return top || "(root)";
}

function underCodeDir(filePath) {
  return CODE_DIRS.some((d) => filePath.startsWith(d));
}

console.log(`docs-graph: using ${bin} ${baseArgs.join(" ")}`.trim());

if (!skipAnalyze) {
  console.log(`docs-graph: indexing ${analyzePath} (this can take a while)…`);
  // --index-only: do NOT inject into CLAUDE.md/AGENTS.md or install skill files.
  // --force: always produce a complete, current graph.
  run(["analyze", analyzePath, "--index-only", "--force"]);
} else {
  console.log("docs-graph: --skip-analyze, reusing existing .gitnexus index");
}

// GitNexus stores Leiden communities as `Community` nodes joined to their
// members by `(:Symbol)-[:MEMBER_OF]->(:Community)` — not as a scalar on the
// symbol. Pull the labels and the membership edges separately.
console.log("docs-graph: extracting communities…");
const communityLabel = new Map(); // communityId → human label
for (const r of cypher(
  "MATCH (c:Community) RETURN c.id AS id, c.label AS label",
)) {
  if (r.id) communityLabel.set(r.id, r.label || r.id);
}
// Relationships live in a single `CodeRelation` table with the kind in the
// `type` property, so we match by node label + r.type rather than a rel table.
const memberCommunity = new Map(); // symbolId → communityId
for (const r of cypher(
  "MATCH (s)-[r]->(c:Community) WHERE r.type = 'MEMBER_OF' " +
    "RETURN s.id AS symbol, c.id AS community",
)) {
  if (r.symbol && r.community) memberCommunity.set(r.symbol, r.community);
}

console.log("docs-graph: extracting nodes…");
const rawNodes = cypher(
  "MATCH (n) RETURN n.id AS id, n.name AS name, labels(n) AS kind, " +
    "n.filePath AS filePath, n.startLine AS line",
);

const nodes = [];
const kept = new Set();
for (const r of rawNodes) {
  if (!r.id || !SYMBOL_KINDS.has(r.kind)) continue;
  const filePath = (r.filePath || "").split("\\").join("/");
  if (!filePath || !underCodeDir(filePath)) continue;
  const pkg = packageOf(filePath);
  const clusterId = memberCommunity.get(r.id) || null;
  const lineNum = Number.parseInt(r.line, 10);
  nodes.push({
    id: r.id,
    label: r.name || r.id,
    kind: r.kind,
    package: pkg,
    filePath: "/" + filePath,
    line: Number.isFinite(lineNum) && lineNum > 0 ? lineNum : 1,
    clusterId,
  });
  kept.add(r.id);
}

console.log("docs-graph: extracting edges…");
const rawEdges = cypher(
  "MATCH (a)-[r]->(b) RETURN a.id AS source, b.id AS target, r.type AS type",
);

// GitNexus relation types are SCREAMING_CASE and plural; normalize to the
// stable singular vocabulary the SPA filters on. This mapping is the artifact
// contract — keep it in sync with the renderer's edge-kind toggles.
const TYPE_MAP = {
  IMPORTS: "import",
  CALLS: "call",
  CONTAINS: "contains",
  EXTENDS: "extends",
  IMPLEMENTS: "implements",
  REFERENCES: "references",
};

// `defines` (File→symbol containment) is ~65% of all edges and adds no signal
// the node's own filePath doesn't carry — drop it, leaving a real dependency
// graph (import, call, extends, …).
const DROP_KINDS = new Set(["defines"]);
const edges = [];
const seenEdge = new Set();
const degree = new Map();
for (const r of rawEdges) {
  if (!kept.has(r.source) || !kept.has(r.target)) continue; // drop dangling
  const kind = TYPE_MAP[r.type] || (r.type || "relates").toLowerCase();
  if (DROP_KINDS.has(kind)) continue;
  const key = `${r.source} ${r.target} ${kind}`;
  if (seenEdge.has(key)) continue;
  seenEdge.add(key);
  edges.push({ source: r.source, target: r.target, kind });
  degree.set(r.source, (degree.get(r.source) || 0) + 1);
  degree.set(r.target, (degree.get(r.target) || 0) + 1);
}

// Prune now-isolated nodes (mostly unreferenced consts) — a graph view should
// show connected things; they stay reachable via the source itself.
const connectedNodes = nodes.filter((n) => degree.get(n.id));
const usedClustersConnected = new Set();
for (const n of connectedNodes)
  if (n.clusterId) usedClustersConnected.add(n.clusterId);

// Only emit clusters that still have a connected member, carrying GitNexus's
// own human-readable community label. The SPA uses these to colour and annotate
// symbols; it groups the overview by package (communities are sparse).
const clusters = [...usedClustersConnected].map((id) => ({
  id,
  label: communityLabel.get(id) || id,
}));

const artifact = {
  generatedAt: new Date().toISOString(),
  nodes: connectedNodes,
  edges,
  clusters,
};

if (!connectedNodes.length) {
  throw new Error(
    "docs-graph: extraction produced 0 connected nodes — refusing to " +
      "overwrite the artifact. Check that `gitnexus analyze` succeeded.",
  );
}

mkdirSync(outDir, { recursive: true });
// Atomic write: never leave a half-written artifact over a good one. Minified
// — this is a machine-read artifact, not a hand-edited file.
const tmp = outFile + ".tmp";
writeFileSync(tmp, JSON.stringify(artifact));
renameSync(tmp, outFile);

console.log(
  `docs-graph: wrote ${connectedNodes.length} nodes (pruned ${nodes.length - connectedNodes.length} isolated), ` +
    `${edges.length} edges, ${clusters.length} clusters → docs/architecture/graph/code-graph.json`,
);
