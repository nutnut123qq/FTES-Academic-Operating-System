import { restRequest } from "@/modules/api/rest/client"
import type {
    AddCartItemRequest,
    CartItemView,
    CartView,
    CheckoutRequest,
    CheckoutResult,
    CouponPreview,
    CouponValidateRequest,
    InvoiceView,
    OrderView,
    PageView,
    ProductForCourseView,
    ProductsForCourseResponse,
    ProductUpsertRequest,
    ProductView,
    RefundCreateRequest,
    RefundRequestView,
    RefundReviewRequest,
    ReconciliationRunView,
} from "./types"

// ---------------------------------------------------------------- CartController

/**
 * Returns the current user's shopping cart.
 *
 * `GET /api/v1/commerce/cart`
 */
export const getCart = async (): Promise<CartView> => {
    return restRequest<CartView>({
        method: "GET",
        url: "/commerce/cart",
        authenticated: true,
    })
}

/**
 * Adds a product to the current user's cart.
 *
 * `POST /api/v1/commerce/cart/items`
 */
export const addCartItem = async (
    request: AddCartItemRequest,
): Promise<CartItemView> => {
    return restRequest<CartItemView>({
        method: "POST",
        url: "/commerce/cart/items",
        data: request,
    })
}

/**
 * Removes an item from the current user's cart.
 *
 * `DELETE /api/v1/commerce/cart/items/{id}`
 */
export const removeCartItem = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/commerce/cart/items/${id}`,
    })
}

// ---------------------------------------------------------------- OrderController

/**
 * Creates an order from the selected cart items.
 *
 * `POST /api/v1/commerce/checkout`
 */
export const checkout = async (
    request: CheckoutRequest,
): Promise<CheckoutResult> => {
    return restRequest<CheckoutResult>({
        method: "POST",
        url: "/commerce/checkout",
        data: request,
    })
}

/**
 * Lists the current user's orders with pagination.
 *
 * `GET /api/v1/commerce/orders/me?page=&size=`
 */
export const getMyOrders = async (params?: {
    page?: number
    size?: number
}): Promise<PageView<OrderView>> => {
    return restRequest<PageView<OrderView>>({
        method: "GET",
        url: "/commerce/orders/me",
        params: {
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: true,
    })
}

/**
 * Returns the detail of a single order.
 *
 * `GET /api/v1/commerce/orders/{orderId}`
 */
export const getOrder = async (orderId: string): Promise<OrderView> => {
    return restRequest<OrderView>({
        method: "GET",
        url: `/commerce/orders/${orderId}`,
        authenticated: true,
    })
}

/**
 * Cancels an order.
 *
 * `POST /api/v1/commerce/orders/{orderId}/cancel`
 */
export const cancelOrder = async (orderId: string): Promise<OrderView> => {
    return restRequest<OrderView>({
        method: "POST",
        url: `/commerce/orders/${orderId}/cancel`,
    })
}

/**
 * Previews the discount for a coupon.
 *
 * `POST /api/v1/commerce/coupons/validate`
 */
export const validateCoupon = async (
    request: CouponValidateRequest,
): Promise<CouponPreview> => {
    return restRequest<CouponPreview>({
        method: "POST",
        url: "/commerce/coupons/validate",
        data: request,
    })
}

/**
 * Returns the invoice for an order.
 *
 * `GET /api/v1/commerce/orders/{orderId}/invoice`
 */
export const getInvoice = async (orderId: string): Promise<InvoiceView> => {
    return restRequest<InvoiceView>({
        method: "GET",
        url: `/commerce/orders/${orderId}/invoice`,
        authenticated: true,
    })
}

/**
 * Requests a refund for an order.
 *
 * `POST /api/v1/commerce/orders/{orderId}/refund-requests`
 */
export const requestRefund = async (
    orderId: string,
    request: RefundCreateRequest,
): Promise<RefundRequestView> => {
    return restRequest<RefundRequestView>({
        method: "POST",
        url: `/commerce/orders/${orderId}/refund-requests`,
        data: request,
    })
}

// ---------------------------------------------------------------- ProductController

/**
 * Lists active products with optional type filter.
 *
 * `GET /api/v1/commerce/products?type=&page=&size=`
 */
export const listProducts = async (params?: {
    type?: string | null
    page?: number
    size?: number
}): Promise<PageView<ProductView>> => {
    return restRequest<PageView<ProductView>>({
        method: "GET",
        url: "/commerce/products",
        params: {
            type: params?.type ?? undefined,
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: false,
    })
}

/**
 * Returns a single product by slug.
 *
 * `GET /api/v1/commerce/products/{slug}`
 */
export const getProductBySlug = async (slug: string): Promise<ProductView> => {
    return restRequest<ProductView>({
        method: "GET",
        url: `/commerce/products/${slug}`,
        authenticated: false,
    })
}

/**
 * Returns the ACTIVE COURSE_UNLOCK product that unlocks a given course, or
 * throws 404 when the course isn't on sale.
 *
 * `GET /api/v1/commerce/products/for-course/{courseId}?packageId={packageId}`
 *
 * `packageId` is OPTIONAL and backward compatible: when omitted the endpoint
 * behaves as before (the single/arbitrary latest COURSE_UNLOCK for the course).
 * When a PACKAGE course exposes N distinct COURSE_UNLOCK products (one per
 * package, each carrying its own `fulfillment_config.packageId`), pass the chosen
 * package's id so the BE resolves THAT package's product instead of collapsing to
 * an arbitrary one. Depends on the BE extending `ProductController.forCourse` with
 * the `packageId` query param + `findActiveCourseUnlockByPackage` repo query; until
 * that ships, the param is ignored server-side and the arbitrary product returns.
 */
export const getProductForCourse = async (
    courseId: string,
    packageId?: string,
    preferPriceVnd?: number,
): Promise<ProductForCourseView | null> => {
    // The endpoint returns a WRAPPED shape `{ products, cheapest }` with NO top-level
    // product id — reading `data.id` gives undefined, which then posts an empty
    // `productId` to the cart and 400s. Resolve a concrete `products[]` entry here.
    const res = await restRequest<ProductsForCourseResponse>({
        method: "GET",
        url: `/commerce/products/for-course/${courseId}`,
        params: packageId ? { packageId } : undefined,
        authenticated: false,
    })
    const products = res?.products ?? []
    if (products.length === 0) return null
    // PACKAGE course: return the product whose fulfillment targets the chosen package.
    // No match (BE hasn't seeded `fulfillment_config.packageId` yet) → null so the caller
    // keeps the buy CTA DISABLED rather than adding an arbitrary/wrong package.
    if (packageId) {
        return products.find((p) => p.packageId === packageId) ?? null
    }
    // Non-package (LEGACY): the course carries ONE canonical price (`course.salePrice`),
    // so the checkout must charge the COURSE_UNLOCK product whose price MATCHES that course
    // price — NOT an arbitrary "cheapest" one. A stale/duplicate cheaper product must never
    // undercut the advertised course price (the "shows 399k, charges 200k" bug). Prefer the
    // price-matching product; fall back to cheapest/first only when none matches (or no
    // target price was supplied). If no product matches the course price, the caller still
    // gets a product to buy, but that signals the BE product price is out of sync with the
    // course and should be reconciled.
    if (typeof preferPriceVnd === "number" && preferPriceVnd > 0) {
        const priced = products.find((p) => p.priceVnd === preferPriceVnd)
        if (priced) return priced
    }
    // Fallback: prefer the cheapest, matched back to its full `products[]` entry BY
    // `productId` (the `cheapest` summary keys on `productId`, NOT `id`); else the first.
    if (res.cheapest) {
        const matched = products.find((p) => p.id === res.cheapest?.productId)
        if (matched) return matched
    }
    return products[0]
}

/**
 * Creates a new product (requires `commerce.product.manage`).
 *
 * `POST /api/v1/commerce/admin/products`
 */
export const createProduct = async (
    request: ProductUpsertRequest,
): Promise<ProductView> => {
    return restRequest<ProductView>({
        method: "POST",
        url: "/commerce/admin/products",
        data: request,
    })
}

/**
 * Updates a product (requires `commerce.product.manage`).
 *
 * `PUT /api/v1/commerce/admin/products/{id}`
 */
export const updateProduct = async (
    id: string,
    request: ProductUpsertRequest,
): Promise<ProductView> => {
    return restRequest<ProductView>({
        method: "PUT",
        url: `/commerce/admin/products/${id}`,
        data: request,
    })
}

/**
 * Archives a product (requires `commerce.product.manage`).
 *
 * `DELETE /api/v1/commerce/admin/products/{id}`
 */
export const archiveProduct = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/commerce/admin/products/${id}`,
    })
}

// ---------------------------------------------------------------- CommerceAdminController

/**
 * Lists pending refund requests (requires `commerce.refund.approve`).
 *
 * `GET /api/v1/commerce/admin/refund-requests?page=&size=`
 */
export const getRefundQueue = async (params?: {
    page?: number
    size?: number
}): Promise<PageView<RefundRequestView>> => {
    return restRequest<PageView<RefundRequestView>>({
        method: "GET",
        url: "/commerce/admin/refund-requests",
        params: {
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: true,
    })
}

/**
 * Approves a refund request (requires `commerce.refund.approve`).
 *
 * `POST /api/v1/commerce/admin/refund-requests/{id}/approve`
 */
export const approveRefundRequest = async (
    id: string,
): Promise<RefundRequestView> => {
    return restRequest<RefundRequestView>({
        method: "POST",
        url: `/commerce/admin/refund-requests/${id}/approve`,
    })
}

/**
 * Rejects a refund request (requires `commerce.refund.approve`).
 *
 * `POST /api/v1/commerce/admin/refund-requests/{id}/reject`
 */
export const rejectRefundRequest = async (
    id: string,
    request: RefundReviewRequest,
): Promise<RefundRequestView> => {
    return restRequest<RefundRequestView>({
        method: "POST",
        url: `/commerce/admin/refund-requests/${id}/reject`,
        data: request,
    })
}

/**
 * Lists reconciliation runs (requires `commerce.reconcile`).
 *
 * `GET /api/v1/commerce/admin/reconciliation/runs?page=&size=`
 */
export const getReconciliationRuns = async (params?: {
    page?: number
    size?: number
}): Promise<PageView<ReconciliationRunView>> => {
    return restRequest<PageView<ReconciliationRunView>>({
        method: "GET",
        url: "/commerce/admin/reconciliation/runs",
        params: {
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: true,
    })
}
