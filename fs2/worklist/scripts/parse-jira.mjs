#!/usr/bin/env node
// Parse a saved searchJiraIssuesUsingJql result file into TSV.
// Handles both shapes: { issues: [...] } (raw Jira) and { issues: { nodes: [...] } } (MCP markdown/json).
// Usage: node parse-jira.mjs "<path-to-saved-result-file>"
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node parse-jira.mjs <jira-result-file>");
  process.exit(1);
}

let json;
try {
  json = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error("Could not parse JSON: " + e.message);
  process.exit(1);
}

const issues = Array.isArray(json.issues)
  ? json.issues
  : (json.issues?.nodes ?? json.nodes ?? []);

for (const it of issues) {
  const f = it.fields ?? {};
  const row = [
    it.key ?? "?",
    f.status?.name ?? "?",
    f.priority?.name ?? "?",
    f.issuetype?.name ?? "?",
    (f.summary ?? "").replace(/\s+/g, " ").trim(),
  ];
  console.log(row.join("\t"));
}
console.error(`TOTAL ${issues.length}`);
