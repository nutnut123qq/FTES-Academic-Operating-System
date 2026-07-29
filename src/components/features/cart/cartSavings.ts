import type { CartItemView } from "@/modules/api/rest/commerce"

/** The cart-wide savings summary derived from each line's list vs charged price. */
export interface CartSavings {
    /** Sum of the charged line totals — the amount the buyer actually pays. */
    currentTotal: number
    /** Sum of the list/original line totals; equals `currentTotal + savedAmount`. */
    originalTotal: number
    /** `originalTotal − currentTotal` (never negative). */
    savedAmount: number
    /** `round(savedAmount / originalTotal × 100)`; 0 when nothing is saved. */
    savedPercent: number
    /** True when at least one line carries a real discount. */
    hasSavings: boolean
}

/**
 * Charged total for one line. A course is added to the cart exactly once (quantity is
 * always 1), so the line total is just the unit price — no × quantity.
 */
const lineCharged = (item: CartItemView): number => item.unitPrice ?? 0

/**
 * Per-line saving in VND (0 when the line has no compare price above its charged
 * unit price). Uses the SAME "the list price only counts when it beats the charged
 * price" rule as {@link import("./CartLineItem").CartLineItem}, so the per-row `−X%`
 * chip and the cart summary can never disagree. A course is only ever in the cart once
 * (quantity is always 1), so the saving is the plain list − charged gap, not × quantity.
 *
 * @param item - a cart line (carries `unitPrice`, optional `originalPriceVnd`)
 */
export const lineSaving = (item: CartItemView): number => {
    const unit = item.unitPrice ?? 0
    const original = item.originalPriceVnd ?? 0
    return original > unit ? original - unit : 0
}

/**
 * Derive the cart savings summary purely on the client from the line items' list vs
 * charged prices — no backend savings/preview endpoint is involved. When the
 * BE-charged `subtotal` is passed it becomes the current total (so the summary never
 * drifts from the footer figure) and the original is that plus the summed per-line
 * discounts, which guarantees `originalTotal = currentTotal + savedAmount` and that
 * the derived percent matches the shared PriceTag chip exactly.
 *
 * @param items - the cart line items
 * @param subtotal - the BE-charged cart total; falls back to the summed charged lines when omitted
 */
export const computeCartSavings = (items: CartItemView[], subtotal?: number): CartSavings => {
    const savedAmount = items.reduce((sum, item) => sum + lineSaving(item), 0)
    const currentTotal = subtotal ?? items.reduce((sum, item) => sum + lineCharged(item), 0)
    const originalTotal = currentTotal + savedAmount
    const savedPercent = originalTotal > 0 ? Math.round((savedAmount / originalTotal) * 100) : 0
    return { currentTotal, originalTotal, savedAmount, savedPercent, hasSavings: savedAmount > 0 }
}
