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
 * `GET /api/v1/commerce/products/for-course/{courseId}`
 */
export const getProductForCourse = async (courseId: string): Promise<ProductView> => {
    return restRequest<ProductView>({
        method: "GET",
        url: `/commerce/products/for-course/${courseId}`,
        authenticated: false,
    })
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
