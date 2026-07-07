#!/usr/bin/env bash
# Regression test for doc-sync correction #1: the committed `.docs-sync-baseline` marker must NOT
# drop code changes that sit behind an interstitial docs commit — the exact failure of the old
# "newest commit whose subject starts with docs" heuristic.
#
# Scenario:
#   C1 init  →  C2 "docs: sync" (records baseline = C1)  →  C3 "feat: X" (CODE)  →  C4 "docs: typo"
# The prefix heuristic anchors on C4 and misses C3. The baseline file anchors on C1 and catches it.
set -euo pipefail
R=$(mktemp -d); cd "$R"
git init -q; git config user.email t@t; git config user.name t

git commit -q --allow-empty -m "init"
C1=$(git rev-parse HEAD)
echo "$C1" > .docs-sync-baseline
git add .docs-sync-baseline; git commit -q -m "docs: sync with baseline"
echo "feature code" > feature.ts; git add feature.ts; git commit -q -m "feat: add X"   # <-- must be caught
C3=$(git rev-parse HEAD)
git commit -q --allow-empty -m "docs: fix a typo"                                       # interstitial

# OLD heuristic boundary
OLD=$(git log --grep '^docs' --format='%H' -n 1)
old_range=$(git log --oneline "$OLD"..HEAD | wc -l)
old_has_c3=$(git rev-list "$OLD"..HEAD | grep -c "$C3" || true)

# NEW baseline boundary
NEW=$(cat .docs-sync-baseline)
new_has_c3=$(git rev-list "$NEW"..HEAD | grep -c "$C3" || true)

echo "old heuristic boundary=${OLD:0:7}  range_size=$old_range  catches_feat_X=$old_has_c3"
echo "baseline   boundary=${NEW:0:7}  catches_feat_X=$new_has_c3"

[ "$old_has_c3" = "0" ] || { echo "UNEXPECTED: heuristic caught it; test invalid"; exit 1; }
[ "$new_has_c3" = "1" ] || { echo "FAIL: baseline marker dropped feat: X"; exit 1; }
echo "PASS — heuristic drops the code commit; baseline marker catches it."
cd /; rm -rf "$R"
