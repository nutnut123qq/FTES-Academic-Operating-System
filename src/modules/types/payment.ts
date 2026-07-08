/**
 * Payload the payment overlay carries to the shared {@link PaymentModal}.
 *
 * Every purchase entry point (marketplace "buy now", cart checkout) resolves the
 * cart-item ids to pay for, then calls `usePaymentOverlayState().open(context)`.
 * The modal reads this to run `POST /commerce/checkout` and render the summary.
 *
 * The checkout endpoint keys off cart-item ids (not product ids), so callers add
 * the product(s) to the cart first and pass the resulting item ids here.
 */
export interface PaymentContext {
    /** Cart-item ids to check out (one for buy-now, many for a cart). */
    itemIds: Array<string>
    /** Human-readable summary shown at the top of the modal (product or cart label). */
    title: string
    /** Amount payable in VND — drives the VietQR flow. `0` when the item is coin-only. */
    amountVnd: number
    /** Amount payable in FTES Coin — enables the "pay with coins" (COIN) flow when set. */
    amountCoin?: number
}
