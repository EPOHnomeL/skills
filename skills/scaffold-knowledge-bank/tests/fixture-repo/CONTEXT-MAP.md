# Context Map

## Workspace layout
- `packages/ordering` — order capture and checkout
- `packages/billing` — invoicing and payments
- `packages/fulfillment` — warehouse picking and shipping

## Per-package CONTEXT index
| Package | CONTEXT.md |
| --- | --- |
| ordering | /packages/ordering/CONTEXT.md |
| billing | /packages/billing/CONTEXT.md |
| fulfillment | /packages/fulfillment/CONTEXT.md |

## Cluster map

- **Order Capture & Checkout** — `packages/ordering/`. Highest blast radius for revenue. **ADRs:** [0001 — Events not HTTP](docs/adr/0001-events-not-http.md).
- **Billing & Invoicing** — `packages/billing/`. Money movement; correctness-critical. **ADRs:** [0001 — Events not HTTP](docs/adr/0001-events-not-http.md), [0002 — ID references only](docs/adr/0002-id-references-only.md).
- **Warehouse Fulfillment** — `packages/fulfillment/`. Physical-world side effects. **ADRs:** [0002 — ID references only](docs/adr/0002-id-references-only.md).
