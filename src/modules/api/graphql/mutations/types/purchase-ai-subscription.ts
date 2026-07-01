import type { GraphQLResponse } from "../../types"
import type { PaymentType } from "@/modules/types/enums/payment-type"

/** Payload inside `purchaseAiSubscription.data` after the standard API wrapper. */
export interface PurchaseAiSubscriptionData {
    /** URL the user should be redirected to complete payment. */
    checkoutUrl: string
    /** Payment-gateway reference ID for reconciliation. */
    referenceId: string
    /** Internal transaction row ID. */
    transactionId: string
    /** Checkout amount in VND. */
    amount: number
    /** SePay PG only: JSON of signed fields to POST as a form to `checkoutUrl`. */
    checkoutFields?: string | null
}

/** GraphQL `PurchaseAiSubscriptionRequest` body. */
export interface PurchaseAiSubscriptionRequest {
    /** AI subscription tier slug to purchase. */
    tier: string
    /** Payment gateway to use (PayOS or SePay). */
    paymentType: PaymentType
    /** PayOS return URL after successful payment. */
    payosReturnUrl?: string
    /** PayOS cancel URL if user aborts checkout. */
    payosCancelUrl?: string
}

/** Apollo response shape for `purchaseAiSubscription`. */
export interface MutatePurchaseAiSubscriptionResponse {
    /** Top-level `purchaseAiSubscription` field wrapping the standard API response. */
    purchaseAiSubscription: GraphQLResponse<PurchaseAiSubscriptionData>
}
