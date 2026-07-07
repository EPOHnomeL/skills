#!/usr/bin/env node
// Gather open PRs (+ Vercel/lint status), open dependabot HIGH alerts, and a .scratch listing.
// Run from inside the target git repo. Repo is auto-detected; pass OWNER/REPO as arg to override.
// Usage: node gather.mjs [owner/repo]
import { execSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const sh = (cmd) =>
  execSync(cmd, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  });
const tryShBuf = (cmd) => {
  try {
    return sh(cmd);
  } catch (e) {
    return null;
  }
};

let repo = process.argv[2];
if (!repo)
  repo = (
    tryShBuf("gh repo view --json nameWithOwner -q .nameWithOwner") ?? ""
  ).trim();
console.log("REPO\t" + (repo || "(unknown)"));

// ---- Open PRs ----
console.log(
  "=== OPEN PRS (number | draft? | base | author | code | vercel | lint | title) ===",
);
const prRaw = tryShBuf(
  "gh pr list --state open --limit 100 --json number,title,isDraft,baseRefName,headRefName,author,statusCheckRollup",
);
if (prRaw == null) {
  console.log("PR_ERROR\tgh pr list failed (auth / not a repo?)");
} else {
  for (const p of JSON.parse(prRaw)) {
    const roll = p.statusCheckRollup ?? [];
    const vercel =
      roll.find((c) => c.context === "Vercel")?.state ??
      roll.find((c) => (c.name ?? "").toLowerCase().includes("vercel"))
        ?.conclusion ??
      "-";
    const lint = roll.find((c) => c.name === "lint")?.conclusion ?? "-";
    const code = (`${p.title} ${p.headRefName}`.match(/[A-Z]{2,}-\d+/) ?? [
      "-",
    ])[0];
    console.log(
      [
        p.number,
        p.isDraft ? "DRAFT" : "ready",
        p.baseRefName,
        p.author?.login ?? "?",
        code,
        `vercel=${vercel}`,
        `lint=${lint}`,
        p.title,
      ].join("\t"),
    );
  }
}

// ---- Dependabot HIGH ----
console.log(
  "=== DEPENDABOT HIGH (number | pkg | score | scope | fix | summary) ===",
);
const depRaw = repo
  ? tryShBuf(
      `gh api "repos/${repo}/dependabot/alerts?state=open&severity=high&per_page=100"`,
    )
  : null;
if (depRaw == null) {
  console.log("DEP_ERROR\tcould not fetch alerts (need repo + security perms)");
} else {
  for (const a of JSON.parse(depRaw)) {
    console.log(
      [
        "#" + a.number,
        a.dependency?.package?.name ?? "?",
        a.security_advisory?.cvss?.score ?? "?",
        a.dependency?.scope ?? "?",
        a.security_vulnerability?.first_patched_version?.identifier ?? "?",
        a.security_advisory?.summary ?? "",
      ].join("\t"),
    );
  }
}

// ---- .scratch listing (2 levels deep) ----
console.log("=== .scratch ===");
const root = (tryShBuf("git rev-parse --show-toplevel") ?? "").trim();
const scratch = root ? join(root, ".scratch") : ".scratch";
if (existsSync(scratch)) {
  const walk = (dir, prefix = "", depth = 2) => {
    for (const e of readdirSync(dir).sort()) {
      const full = join(dir, e);
      const isDir = statSync(full).isDirectory();
      console.log(prefix + (isDir ? e + "/" : e));
      if (isDir && depth > 1) walk(full, prefix + "  ", depth - 1);
    }
  };
  walk(scratch);
} else {
  console.log("(no .scratch dir)");
}
