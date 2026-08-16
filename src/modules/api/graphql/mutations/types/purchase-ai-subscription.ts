import type { GraphQLResponse } from "../../types"
import type { PurchaseCheckoutData } from "./purchase-checkout"

/**
 * Payload inside `purchaseAiSubscription.data` — the shared plan checkout ticket
 * ({@link PurchaseCheckoutData}): a VietQR payload plus the order id to poll.
 */
export type PurchaseAiSubscriptionData = PurchaseCheckoutData

/** GraphQL `PurchaseAiSubscriptionRequest` body. */
export interface PurchaseAiSubscriptionRequest {
    /** AI subscription tier slug to purchase (the product slug from `aiSubscriptionTiers`). */
    tier: string
    /**
     * Pay method of THIS backend — `VIETQR` (default when omitted) or `COIN`. External
     * gateway names are rejected server-side without creating an order, so this screen
     * only ever sends `VIETQR`.
     */
    paymentType?: string
}

/** Apollo response shape for `purchaseAiSubscription`. */
export interface MutatePurchaseAiSubscriptionResponse {
    /** Top-level `purchaseAiSubscription` field wrapping the standard API response. */
    purchaseAiSubscription: GraphQLResponse<PurchaseAiSubscriptionData>
}
