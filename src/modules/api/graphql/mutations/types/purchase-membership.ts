import type { GraphQLResponse } from "../../types"
import type { PurchaseCheckoutData } from "./purchase-checkout"

/**
 * Payload inside `purchaseMembership.data` — the shared plan checkout ticket
 * ({@link PurchaseCheckoutData}): a VietQR payload plus the order id to poll.
 */
export type PurchaseMembershipData = PurchaseCheckoutData

/** GraphQL `PurchaseMembershipRequest` body. */
export interface PurchaseMembershipRequest {
    /**
     * Pay method of THIS backend — `VIETQR` (default when omitted) or `COIN`. External
     * gateway names (payos/sepay/stripe/paypal/crypto) are rejected server-side without
     * creating an order, so this screen only ever sends `VIETQR`.
     */
    paymentType?: string
}

/** Apollo response shape for `purchaseMembership`. */
export interface MutatePurchaseMembershipResponse {
    /** Top-level `purchaseMembership` field wrapping the standard API response. */
    purchaseMembership: GraphQLResponse<PurchaseMembershipData>
}
