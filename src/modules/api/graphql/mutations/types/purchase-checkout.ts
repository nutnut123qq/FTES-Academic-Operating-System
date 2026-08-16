/**
 * The payload both plan-purchase mutations (`purchaseMembership`,
 * `purchaseAiSubscription`) answer with — GraphQL `PurchaseCheckoutData`.
 *
 * This backend has NO redirect payment gateway. Both mutations delegate to the very
 * checkout the course purchase runs (cart → order → VietQR → bank webhook → fulfillment),
 * so the answer is a **bank-transfer QR payload plus an order id to poll**, never a URL to
 * navigate to. The schema still declares `checkoutUrl` / `checkoutFields` for old clients
 * and documents them as ALWAYS null; they are deliberately not selected nor typed here —
 * a field that is always null must not look like a payment route.
 */
export interface PurchaseCheckoutData {
    /**
     * Order id of the created (or re-used) order. Poll `GET /commerce/orders/{id}` with it
     * until the bank webhook settles the order — and it is also the transfer reference the
     * QR carries, so the buyer can quote it to support.
     */
    referenceId: string
    /** Same order id under the legacy gateway name. Kept because the schema returns it. */
    transactionId: string
    /** Amount due in VND, frozen when the order was created. */
    amount: number
    /** VietQR EMVCo payload to render as a QR code — the actual way to pay. */
    qrCode: string
    /**
     * Order status at creation time (normally `AWAITING_PAYMENT`). Only a seed for the
     * first render: the truth after that is the polled order.
     */
    orderStatus?: string | null
}

/**
 * The only pay method these two screens send. The backend accepts `VIETQR` and `COIN`
 * and REJECTS every external gateway name outright (no order is created), so sending
 * anything else would be a checkout that can never be paid.
 */
export const PLAN_PAY_METHOD = "VIETQR"
