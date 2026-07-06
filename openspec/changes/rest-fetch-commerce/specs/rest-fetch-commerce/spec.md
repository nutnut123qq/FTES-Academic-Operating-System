## ADDED Requirements

### Requirement: Commerce REST client reuses the shared REST wrapper
The commerce REST client SHALL import `restRequest` from `src/modules/api/rest/client/` and SHALL NOT create its own axios instance or envelope handling.

#### Scenario: Add item to cart
- **WHEN** `addCartItem(request)` is called
- **THEN** it performs `POST /api/v1/commerce/cart/items` through `restRequest` and returns `CartItemView`

### Requirement: CartController endpoints are exposed via REST
The commerce REST client SHALL expose typed functions for all `CartController` endpoints.

#### Scenario: Get cart
- **WHEN** `getCart()` is called
- **THEN** it performs `GET /api/v1/commerce/cart` and returns `CartView`

#### Scenario: Remove cart item
- **WHEN** `removeCartItem(id)` is called
- **THEN** it performs `DELETE /api/v1/commerce/cart/items/{id}` and resolves with `void`

### Requirement: OrderController endpoints are exposed via REST
The commerce REST client SHALL expose typed functions for all `OrderController` endpoints.

#### Scenario: Checkout
- **WHEN** `checkout(request)` is called
- **THEN** it performs `POST /api/v1/commerce/checkout` and returns `CheckoutResult`

#### Scenario: List my orders
- **WHEN** `getMyOrders(page, size)` is called
- **THEN** it performs `GET /api/v1/commerce/orders/me?page=&size=` and returns `PageView<OrderView>`

#### Scenario: Get order detail
- **WHEN** `getOrder(orderId)` is called
- **THEN** it performs `GET /api/v1/commerce/orders/{orderId}` and returns `OrderView`

#### Scenario: Cancel order
- **WHEN** `cancelOrder(orderId)` is called
- **THEN** it performs `POST /api/v1/commerce/orders/{orderId}/cancel` and returns `OrderView`

#### Scenario: Validate coupon
- **WHEN** `validateCoupon(request)` is called
- **THEN** it performs `POST /api/v1/commerce/coupons/validate` and returns `CouponPreview`

#### Scenario: Get invoice
- **WHEN** `getInvoice(orderId)` is called
- **THEN** it performs `GET /api/v1/commerce/orders/{orderId}/invoice` and returns `InvoiceView`

#### Scenario: Request refund
- **WHEN** `requestRefund(orderId, request)` is called
- **THEN** it performs `POST /api/v1/commerce/orders/{orderId}/refund-requests` and returns `RefundRequestView`

### Requirement: ProductController endpoints are exposed via REST
The commerce REST client SHALL expose typed functions for all `ProductController` endpoints.

#### Scenario: List products
- **WHEN** `listProducts(type, page, size)` is called
- **THEN** it performs `GET /api/v1/commerce/products?type=&page=&size=` and returns `PageView<ProductView>`

#### Scenario: Get product detail
- **WHEN** `getProductBySlug(slug)` is called
- **THEN** it performs `GET /api/v1/commerce/products/{slug}` and returns `ProductView`

#### Scenario: Create product
- **WHEN** `createProduct(request)` is called
- **THEN** it performs `POST /api/v1/commerce/admin/products` and returns `ProductView`

#### Scenario: Update product
- **WHEN** `updateProduct(id, request)` is called
- **THEN** it performs `PUT /api/v1/commerce/admin/products/{id}` and returns `ProductView`

#### Scenario: Archive product
- **WHEN** `archiveProduct(id)` is called
- **THEN** it performs `DELETE /api/v1/commerce/admin/products/{id}` and resolves with `void`

### Requirement: CommerceAdminController endpoints are exposed via REST
The commerce REST client SHALL expose typed functions for all `CommerceAdminController` endpoints.

#### Scenario: List refund queue
- **WHEN** `getRefundQueue(page, size)` is called
- **THEN** it performs `GET /api/v1/commerce/admin/refund-requests?page=&size=` and returns `PageView<RefundRequestView>`

#### Scenario: Approve refund request
- **WHEN** `approveRefundRequest(id)` is called
- **THEN** it performs `POST /api/v1/commerce/admin/refund-requests/{id}/approve` and returns `RefundRequestView`

#### Scenario: Reject refund request
- **WHEN** `rejectRefundRequest(id, request)` is called
- **THEN** it performs `POST /api/v1/commerce/admin/refund-requests/{id}/reject` and returns `RefundRequestView`

#### Scenario: List reconciliation runs
- **WHEN** `getReconciliationRuns(page, size)` is called
- **THEN** it performs `GET /api/v1/commerce/admin/reconciliation/runs?page=&size=` and returns `PageView<ReconciliationRunView>`

### Requirement: SWR mutation wrappers exist for every writing endpoint
For every POST/PUT/DELETE commerce REST function, a corresponding `usePost*Swr` hook SHALL exist in `src/hooks/swr/api/rest/mutations/` following the existing naming and generic pattern.

#### Scenario: Use checkout hook
- **WHEN** a component calls `usePostCheckoutSwr().trigger(request)`
- **THEN** the hook invokes `checkout(request)` through `useSWRMutation`

### Requirement: SWR query wrappers exist for read endpoints
For every GET commerce REST function, a corresponding `useGet*Swr` hook SHALL exist in `src/hooks/swr/api/rest/queries/`.

#### Scenario: Use cart hook
- **WHEN** a component calls `useGetCartSwr()`
- **THEN** the hook invokes `getCart()` through `useSWR`

### Requirement: Commerce module is re-exported from the REST barrel
- **WHEN** `src/modules/api/rest/index.ts` is updated
- **THEN** it adds `export * from "./commerce"` alongside existing module exports

### Requirement: WebhookController is documented and skipped
The `WebhookController` server-to-server VietQR endpoint SHALL NOT receive a REST client in this change.

#### Scenario: Skip VietQR webhook
- **WHEN** reviewing the commerce surface
- **THEN** `POST /api/v1/commerce/webhooks/vietqr` is listed as backend-only and omitted
