/**
 * Request/response DTOs for the commerce REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.commerce.web.dto.CommerceDtos`
 * plus `CommerceAdminController.ReconciliationRunView`.
 */

// ------------------------------------------------------------------ views

/** One product in the marketplace catalog. */
export interface ProductView {
    /** Product id (UUID). */
    id: string
    /** Product type, e.g. "COURSE", "SUBSCRIPTION", "MERCHANDISE", "AI_CREDITS", "VOUCHER". */
    type: string
    /** Display name. */
    name: string
    /** URL-friendly slug. */
    slug: string
    /** Human-readable description. */
    description?: string
    /** Price in VND. */
    priceVnd?: number
    /** Price in platform coins. */
    priceCoin?: number
    /** Available stock; null when not applicable. */
    stockQuantity?: number
    /** Product status, e.g. "ACTIVE" or "ARCHIVED". */
    status: string
}

/**
 * One COURSE_UNLOCK product inside `GET /commerce/products/for-course/{courseId}`'s
 * `products[]` list. Carries `id` (the productId to add to the cart), pricing, and the
 * per-package `packageId` (null for a non-package course).
 */
export interface ProductForCourseView {
    /** Product id (UUID) — the id to add to the cart. */
    id: string
    /** Display name. */
    name?: string
    /** Price in VND. */
    priceVnd?: number
    /** Price in platform coins. */
    priceCoin?: number
    /** The package this product unlocks, or null for a non-package course. */
    packageId?: string | null
}

/**
 * The `cheapest` summary inside the for-course response. NOTE: it keys the product by
 * **`productId`** (NOT `id` like `products[]`) — resolving it means matching `productId`
 * back to a `products[]` entry.
 */
export interface CheapestProductView {
    /** Product id of the cheapest option (matches a `products[].id`). */
    productId: string
    /** Price in VND. */
    priceVnd?: number
}

/**
 * Wrapped response of `GET /commerce/products/for-course/{courseId}`: a `products[]`
 * list (one per package for a PACKAGE course, else one) plus a `cheapest` summary.
 * There is NO top-level product id — a concrete product must be resolved from `products[]`.
 */
export interface ProductsForCourseResponse {
    products: ProductForCourseView[]
    cheapest: CheapestProductView | null
}

/** One item in the shopping cart. */
export interface CartItemView {
    /** Cart item id. */
    id: string
    /** Product id. */
    productId: string
    /** Quantity. */
    quantity: number
    /** Unit price at the time the item was added. */
    unitPrice?: number
}

/** Shopping cart aggregate. */
export interface CartView {
    /** Cart line items. */
    items: Array<CartItemView>
    /** Subtotal before discounts. */
    subtotal?: number
}

/** One line item inside an order. */
export interface OrderItemView {
    /** Order item id. */
    id: string
    /** Product id. */
    productId: string
    /** Unit pay amount (VND). */
    unitPayAmount?: number
    /** Quantity. */
    quantity: number
    /** Fulfillment status, e.g. "PENDING" or "FULFILLED". */
    fulfillmentStatus: string
}

/** Order summary/detail. */
export interface OrderView {
    /** Order id. */
    orderId: string
    /** Order status, e.g. "PENDING", "PAID", "CANCELLED". */
    status: string
    /** Total price in VND. */
    totalPrice?: number
    /** Discount amount in VND. */
    discountAmount?: number
    /** Total price in coins. */
    totalCoin?: number
    /** Payment method, e.g. "VIETQR" or "COIN". */
    payMethod: string
    /** QR code payload/image URL for VietQR payment. */
    qrCode?: string
    /** Order line items (populated in detail view). */
    items: Array<OrderItemView>
    /** Order creation timestamp (ISO-8601). */
    createdAt?: string
}

/** Checkout result returned after creating an order. */
export interface CheckoutResult {
    /** Created order id. */
    orderId: string
    /** Amount to pay in VND. */
    amount?: number
    /** Amount to pay in coins. */
    amountCoin?: number
    /** QR code for VietQR payment. */
    qrCode?: string
    /** Order status. */
    status: string
}

/** Paginated view used by several commerce endpoints. */
export interface PageView<T> {
    /** Page content. */
    items: Array<T>
    /** Current page number (0-based). */
    page: number
    /** Total element count across all pages. */
    totalElements: number
}

/** Coupon discount preview. */
export interface CouponPreview {
    /** Discount amount in VND. */
    discount: number
}

/** Invoice metadata and download URL. */
export interface InvoiceView {
    /** Invoice number. */
    invoiceNumber: string
    /** Presigned URL to download the invoice PDF. */
    presignedUrl: string
}

/** Refund request summary. */
export interface RefundRequestView {
    /** Refund request id (UUID). */
    id: string
    /** Order id. */
    orderId: string
    /** Refund status, e.g. "PENDING", "APPROVED", "REJECTED". */
    status: string
    /** Reason provided by the user. */
    reason: string
    /** Refund amount in VND. */
    amount?: number
    /** Refund channel, e.g. "ORIGINAL" or "WALLET". */
    channel: string
}

/** One reconciliation run. */
export interface ReconciliationRunView {
    /** Run id (UUID). */
    id: string
    /** Number of mismatched transactions detected. */
    mismatchCount: number
    /** Run timestamp (ISO-8601). */
    ranAt: string
}

// ------------------------------------------------------------------ requests

/** Body sent to `POST /api/v1/commerce/admin/products` and `PUT /api/v1/commerce/admin/products/{id}`. */
export interface ProductUpsertRequest {
    /** Product type. */
    type: string
    /** Display name. */
    name: string
    /** URL-friendly slug. */
    slug: string
    /** Human-readable description. */
    description?: string
    /** Price in VND. */
    priceVnd?: number
    /** Price in coins. */
    priceCoin?: number
    /** Fulfillment config JSON/string. */
    fulfillmentConfig: string
    /** Available stock; null when not applicable. */
    stockQuantity?: number
    /** Product status; defaults may apply server-side. */
    status?: string
}

/** Body sent to `POST /api/v1/commerce/cart/items`. */
export interface AddCartItemRequest {
    /** Product id to add. */
    productId: string
    /** Quantity (>= 1). */
    quantity: number
}

/** Body sent to `POST /api/v1/commerce/checkout`. */
export interface CheckoutRequest {
    /** Cart item ids to checkout. */
    itemIds: Array<string>
    /** Optional coupon code. */
    couponName?: string
    /** Payment method: "VIETQR" or "COIN". */
    payMethod: string
    /** Idempotency key to avoid duplicate orders. */
    idempotencyKey: string
}

/** Body sent to `POST /api/v1/commerce/coupons/validate`. */
export interface CouponValidateRequest {
    /** Coupon code. */
    couponName: string
    /** Order amount in VND. */
    orderAmount: number
}

/** Body sent to `POST /api/v1/commerce/orders/{orderId}/refund-requests`. */
export interface RefundCreateRequest {
    /** Reason for the refund. */
    reason: string
    /** Refund channel; optional depending on policy. */
    channel?: string
}

/** Body sent to `POST /api/v1/commerce/admin/refund-requests/{id}/reject`. */
export interface RefundReviewRequest {
    /** Rejection note. */
    note?: string
}

// ------------------------------------------------------------------ order status

/** Lifecycle status of an order (mirrors backend `OrderStatus`). */
export type OrderStatus =
    | "PENDING"
    | "AWAITING_PAYMENT"
    | "PAID"
    | "FULFILLING"
    | "SUCCESS"
    | "FAILED"
    | "CANCELLED"
    | "EXPIRED"
    | "REFUNDED"

/**
 * Statuses at which polling should stop: the order is settled (paid) or dead
 * (failed/cancelled/expired/refunded). `AWAITING_PAYMENT`/`PENDING`/`FULFILLING`
 * are still in flight.
 */
const TERMINAL_ORDER_STATUSES: ReadonlyArray<string> = [
    "PAID",
    "SUCCESS",
    "FAILED",
    "CANCELLED",
    "EXPIRED",
    "REFUNDED",
]

/** True when the order has reached a settled/dead status → stop polling. */
export const isTerminalOrderStatus = (status?: string): boolean =>
    status != null && TERMINAL_ORDER_STATUSES.includes(status)

/** True when the order is successfully paid (or fulfilled). */
export const isPaidOrderStatus = (status?: string): boolean =>
    status === "PAID" || status === "SUCCESS" || status === "FULFILLING"
