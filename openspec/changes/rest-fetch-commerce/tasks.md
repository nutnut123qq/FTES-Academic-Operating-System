## 1. Commerce REST types

- [x] 1.1 Create `src/modules/api/rest/commerce/types.ts` with request/response interfaces inferred from backend `CommerceDtos` and `CommerceAdminController.ReconciliationRunView`.

## 2. Commerce REST client

- [x] 2.1 Create `src/modules/api/rest/commerce/commerce.ts` exporting REST functions for `CartController`, `OrderController`, `ProductController`, and `CommerceAdminController`.
- [x] 2.2 Create `src/modules/api/rest/commerce/index.ts` barrel re-exporting types and functions.
- [x] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./commerce"`.

### Endpoint mapping

**Out-of-scope — BỎ QUA (ghi trong design.md):**
- `POST /api/v1/commerce/webhooks/vietqr` — server-to-server VietQR webhook; no FE client.

**REST-only — implement in `commerce.ts`:**
- Cart: `getCart`, `addCartItem`, `removeCartItem`
- Order: `checkout`, `getMyOrders`, `getOrder`, `cancelOrder`, `validateCoupon`, `getInvoice`, `requestRefund`
- Product: `listProducts`, `getProductBySlug`, `createProduct`, `updateProduct`, `archiveProduct`
- CommerceAdmin: `getRefundQueue`, `approveRefundRequest`, `rejectRefundRequest`, `getReconciliationRuns`

## 3. SWR mutation wrappers

- [x] 3.1 Create `usePostAddCartItemSwr.ts`
- [x] 3.2 Create `usePostRemoveCartItemSwr.ts`
- [x] 3.3 Create `usePostCheckoutSwr.ts`
- [x] 3.4 Create `usePostCancelOrderSwr.ts`
- [x] 3.5 Create `usePostValidateCouponSwr.ts`
- [x] 3.6 Create `usePostRequestRefundSwr.ts`
- [x] 3.7 Create `usePostCreateProductSwr.ts`
- [x] 3.8 Create `usePostUpdateProductSwr.ts`
- [x] 3.9 Create `usePostArchiveProductSwr.ts`
- [x] 3.10 Create `usePostApproveRefundRequestSwr.ts`
- [x] 3.11 Create `usePostRejectRefundRequestSwr.ts`
- [x] 3.12 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [x] 4.1 Create `useGetCartSwr.ts`
- [x] 4.2 Create `useGetMyOrdersSwr.ts`
- [x] 4.3 Create `useGetOrderSwr.ts`
- [x] 4.4 Create `useGetInvoiceSwr.ts`
- [x] 4.5 Create `useGetProductsSwr.ts`
- [x] 4.6 Create `useGetProductBySlugSwr.ts`
- [x] 4.7 Create `useGetRefundQueueSwr.ts`
- [x] 4.8 Create `useGetReconciliationRunsSwr.ts`
- [x] 4.9 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [x] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [x] 5.2 Run `npm run build` (webpack) and ensure a green build.
