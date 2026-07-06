## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, `subject`, and `identity`. The commerce domain exposes its own REST controllers for cart, checkout, orders, products, and admin operations, but the frontend currently has no typed REST layer for them. Surfacing these endpoints through the same REST infrastructure lets cart, checkout, order history, and admin commerce UIs call the backend consistently without ad-hoc axios calls.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client for the commerce controller cluster under `src/modules/api/rest/commerce/` covering:
  - `CartController` — get cart, add item, remove item.
  - `OrderController` — checkout, my orders, order detail, cancel, coupon validation, invoice, refund request.
  - `ProductController` — public product list/detail and admin product CRUD.
  - `CommerceAdminController` — refund queue, approve/reject refund, reconciliation runs.
- Add `usePost*Swr` mutation hooks in `src/hooks/swr/api/rest/mutations/` for every mutating REST endpoint.
- Add `useGet*Swr` query hooks in `src/hooks/swr/api/rest/queries/` for read endpoints.
- Update `src/modules/api/rest/index.ts` to re-export `./commerce`.
- Explicitly document that `WebhookController` is server-to-server only and out of scope.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-commerce`: REST client + SWR wrappers for the commerce controller cluster.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/commerce/` and `src/hooks/swr/api/rest/mutations/` (plus new query hooks in `src/hooks/swr/api/rest/queries/`).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
