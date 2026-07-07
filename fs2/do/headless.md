# Headless Jira access (curl)

Reached only when `/do` runs in the morning routine's cloud sandbox, where the Atlassian MCP is blocked (`MCP tool call requires approval`). Do every Jira read/write with curl and these env vars:

- `$ATLASSIAN_SITE_URL` — host only, no scheme, no trailing slash (e.g. `fuelswitch.atlassian.net`)
- `$ATLASSIAN_EMAIL`
- `$ATLASSIAN_API_TOKEN`

Build the auth header once:

```bash
AUTH=$(printf "%s:%s" "$ATLASSIAN_EMAIL" "$ATLASSIAN_API_TOKEN" | base64 -w0)
```

**Never log `$ATLASSIAN_API_TOKEN`** — not in PR bodies, commit messages, console output, or files.

## Precheck (before any Jira call)

```bash
# network
HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "https://$ATLASSIAN_SITE_URL/status")
# 000 / "Could not resolve host" / "Host not in allowlist" → abort:
#   "Network allowlist missing Atlassian domains — add *.atlassian.net to the routine's network policy." Do not retry.

# credentials
HTTP=$(curl -sS -o /tmp/myself.json -w "%{http_code}" \
  -H "Authorization: Basic $AUTH" -H "Accept: application/json" \
  "https://$ATLASSIAN_SITE_URL/rest/api/3/myself")
# not 200 → abort "Atlassian auth failed (HTTP $HTTP)".
```

## Read one ticket

```bash
curl -sS -G -H "Authorization: Basic $AUTH" -H "Accept: application/json" \
  --data-urlencode 'fields=summary,description,status,assignee,issuetype,priority' \
  "https://$ATLASSIAN_SITE_URL/rest/api/3/issue/<KEY>"
```

## Transition (claim / advance)

Transition **ids are not stable** across projects — resolve by name at run time, never hardcode blindly:

```bash
# 1. list available transitions, find the id whose "name" matches your target
curl -sS -H "Authorization: Basic $AUTH" -H "Accept: application/json" \
  "https://$ATLASSIAN_SITE_URL/rest/api/3/issue/<KEY>/transitions"

# 2. POST it
curl -sS -X POST -H "Authorization: Basic $AUTH" -H "Content-Type: application/json" \
  "https://$ATLASSIAN_SITE_URL/rest/api/3/issue/<KEY>/transitions" \
  -d '{"transition":{"id":"<ID>"}}'
```

Observed BUG-board ids (verify via step 1 anyway): `In Progress = 21`, `In Review = 31`. **Never POST** `Testing (2)`, `Ready for Production (3)`, or `Done (41)` — those are past the agent ceiling.

## Comment (ADF required)

Jira v3 comments must be Atlassian Document Format:

```bash
curl -sS -X POST -H "Authorization: Basic $AUTH" -H "Content-Type: application/json" \
  "https://$ATLASSIAN_SITE_URL/rest/api/3/issue/<KEY>/comment" \
  -d '{"body":{"type":"doc","version":1,"content":[
        {"type":"paragraph","content":[{"type":"text","text":"PR opened: <URL>"}]}
      ]}}'
```

For the multi-step **Testing Methodology**, build the `content` array from an `orderedList` of `listItem`/`paragraph` nodes (one step per item) rather than cramming it into a single paragraph.
