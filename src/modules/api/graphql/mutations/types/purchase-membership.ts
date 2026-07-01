import type { GraphQLResponse } from "../../types"
import type { PaymentType } from "@/modules/types/enums/payment-type"

/** Payload inside `purchaseMembership.data` after the standard API wrapper. */
export interface PurchaseMembershipData {
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

/** GraphQL `PurchaseMembershipRequest` body. */
export interface PurchaseMembershipRequest {
    /** Payment gateway to use (PayOS / Sepay / Stripe / PayPal / Crypto). */
    paymentType: PaymentType
    /** PayOS return URL after successful payment. */
    payosReturnUrl?: string
    /** PayOS cancel URL if user aborts checkout. */
    payosCancelUrl?: string
}

/** Apollo response shape for `purchaseMembership`. */
export interface MutatePurchaseMembershipResponse {
    /** Top-level `purchaseMembership` field wrapping the standard API response. */
    purchaseMembership: GraphQLResponse<PurchaseMembershipData>
}
