## Context

The shared REST client (`restRequest`) already powers `challenges`, `course`, `subject`, and `identity`. The backend commerce domain in `vn.ftes.aos.commerce.web` exposes five REST controllers:

- `CartController` — `/api/v1/commerce/cart/**`
- `OrderController` — `/api/v1/commerce/**`
- `ProductController` — `/api/v1/commerce/**`
- `CommerceAdminController` — `/api/v1/commerce/admin/**`
- `WebhookController` — `/api/v1/commerce/webhooks/**`

The frontend has legacy GraphQL checkout flows (`courseEnroll`, `purchaseMembership`, `purchaseAiSubscription`, `coursePricePreview`) that predate the commerce module; none of them overlap with the new commerce REST surface (cart, order, product, refund, reconciliation). This change wires the commerce REST controllers into the same REST infrastructure used by the other domains.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/commerce/` for `CartController`, `OrderController`, `ProductController`, and `CommerceAdminController`.
- Add SWR mutation wrappers for every writing endpoint (POST/PUT/DELETE).
- Add SWR query wrappers for read endpoints.
- Update `src/modules/api/rest/index.ts` to re-export `./commerce`.
- Document the intentionally skipped `WebhookController`.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not implement `WebhookController`; it is a server-to-server VietQR endpoint with `secure-token` auth, not called by the FE.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap, and error mapping. Commerce needs no special envelope handling.

### 2. Group all commerce clients in one folder
**Rationale:** `src/modules/api/rest/commerce/` mirrors the backend package `commerce.web` and keeps the module boundary clear, just as `course/` and `subject/` did.

### 3. Skip `WebhookController`
**Rationale:** `WebhookController` exposes `POST /api/v1/commerce/webhooks/vietqr` for VietQR to notify the backend. It uses a backend-only `secure-token` header and is not a client-facing endpoint. Documented as out-of-scope.

### 4. No GraphQL overlap in this surface
**Rationale:** Existing GraphQL checkout flows (`courseEnroll`, `purchaseMembership`, `purchaseAiSubscription`, `coursePricePreview`) target legacy payment resolvers, not the new commerce module. The commerce REST endpoints (cart, order, product, admin refund/reconciliation) have no equivalent GraphQL operations, so none are skipped for duplication reasons.

### 5. Read endpoints get SWR query hooks
**Rationale:** `cart`, `myOrders`, `order detail`, `invoice`, `product list/detail`, `refund queue`, and `reconciliation runs` are reads. They belong in `src/hooks/swr/api/rest/queries/` following SWR semantics. Writes go in `mutations/`.

### 6. Types inferred from `CommerceDtos.java`
**Rationale:** `CommerceDtos` is the backend source of truth. We mirror record shapes using TypeScript interfaces, using `string` for UUIDs, `number` for BigDecimal amounts (frontend typically renders VND/coin values as numbers), and ISO strings for timestamps.

### 7. Admin endpoints named clearly
**Rationale:** Admin product CRUD and refund/reconciliation functions are prefixed or grouped by controller name (`createProduct`, `updateProduct`, `approveRefundRequest`, etc.) to avoid confusion with user-facing endpoints.

## Risks / Trade-offs

- **[Risk]** `ProductController` mixes public reads (`/products`, `/products/{slug}`) with admin writes (`/admin/products/**`). The same REST module exposes both; callers must ensure admin UIs hold the `commerce.product.manage` permission.
- **[Risk]** `CommerceAdminController` uses `ReconciliationRunView` as a public record inside the controller. We mirror it as `ReconciliationRunView` in the frontend types.
- **[Trade-off]** `OrderController` includes invoice and refund operations that might one day move to dedicated controllers. Keeping them in the commerce module is fine because they share the same base path.

## Affected Files / Modules

- `src/modules/api/rest/commerce/types.ts`
- `src/modules/api/rest/commerce/commerce.ts`
- `src/modules/api/rest/commerce/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
