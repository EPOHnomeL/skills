#!/usr/bin/env bash
# Gate A — headless, data-layer correctness for a scaffolded knowledge bank.
# Proves the parts that DON'T need a browser: the meta generator runs, the ADR-chip mapping
# (contextToAdrs) is populated (i.e. contextSlugByName was authored, not string-matched), and the
# doc surfaces are actually served. Gate B (nav renders / glossary drawer populates) needs a headless
# browser and is deferred to the user's Playwright decision — see references/testing-notes.md.
set -euo pipefail
FX="$(cd "$(dirname "$0")/fixture-repo" && pwd)"
cd "$FX"
PORT=8137
fail() { echo "GATE A FAIL: $*" >&2; exit 1; }

echo "1) meta generator runs"
node tooling/docs-meta.mjs >/dev/null || fail "docs-meta.mjs threw"

echo "2) _meta.json structure + contextToAdrs populated and correct"
python3 - << 'PY' || exit 1
import json
d = json.load(open("docs/architecture/_meta.json"))
assert "files" in d and "contextToAdrs" in d and "generatedAt" in d, "missing top-level keys"
got = {k: sorted(v) for k, v in d["contextToAdrs"].items()}
want = {"ordering": ["0001"], "billing": ["0001", "0002"], "fulfillment": ["0002"]}
assert got == want, f"contextToAdrs mismatch: got {got} want {want}"
assert len(d["files"]) >= 10, f"too few files indexed: {len(d['files'])}"
print("   contextToAdrs OK:", got)
PY

echo "3) doc surfaces serve (python http.server from repo root)"
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
sleep 1
for path in /docs/index.html /CONTEXT.md /CONTEXT-MAP.md \
            /docs/architecture/_meta.json /docs/architecture/overview.md \
            /docs/architecture/contexts/01-ordering.md /packages/ordering/CONTEXT.md; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}${path}")
  [ "$code" = "200" ] || fail "$path -> HTTP $code"
  echo "   200  $path"
done

echo "GATE A PASS"
