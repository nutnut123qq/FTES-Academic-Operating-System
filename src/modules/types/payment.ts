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
/**
 * MỘT dòng hàng đang mua, hiện ở bước Tóm tắt của {@link PaymentContext}.
 *
 * Người mua phải thấy MÌNH ĐANG MUA CÁI GÌ trước khi trả tiền: chỉ hiện
 * "Giỏ hàng (3 sản phẩm)" + một cục tiền là không đủ để đối chiếu.
 */
export interface PaymentLine {
    /** Khoá React (cart-item id hoặc product id). */
    id: string
    /** Tên khoá học/sản phẩm. */
    name: string
    /** Giá THỰC TRẢ của dòng này (VND). */
    priceVnd: number
    /** Giá niêm yết trước giảm; gạch ngang khi lớn hơn `priceVnd`. */
    originalPriceVnd?: number | null
    /** Ảnh bìa của dòng; thiếu thì ô ảnh để trống. */
    imageUrl?: string | null
}

export interface PaymentContext {
    /** Cart-item ids to check out (one for buy-now, many for a cart). */
    itemIds: Array<string>
    /**
     * Từng dòng hàng đang mua (tên · ảnh · giá) cho bước Tóm tắt. Bỏ trống thì modal
     * tự dựng MỘT dòng từ `title`/`imageUrl`/`amountVnd` — đúng cho lối mua-ngay một
     * khoá; giỏ hàng nhiều món BẮT BUỘC truyền để người mua đối chiếu được.
     */
    lines?: Array<PaymentLine>
    /** Human-readable summary shown at the top of the modal (product or cart label). */
    title: string
    /** Amount payable in VND — drives the VietQR flow. `0` when the item is coin-only. */
    amountVnd: number
    /**
     * The pre-discount VND list total, when the purchase carries a discount. Drives the
     * struck-through original price + "you save" line in the modal summary (VND path only).
     * Omit when there is no discount (or the price is coin-only) — the summary then shows
     * the payable amount alone.
     */
    originalAmountVnd?: number
    /** Amount payable in FTES Coin — enables the "pay with coins" (COIN) flow when set. */
    amountCoin?: number
    /**
     * Optional course cover art shown as the rounded thumbnail beside the title on the
     * modal's Summary step (and the slim recap line on the Payment step). Threaded from
     * the entry points that carry a single cover (course buy-now, package/whole-course
     * gate). Omit for a multi-item cart checkout — the summary then shows the title with
     * no thumbnail (`CoverImage` owns that empty-surface fallback).
     */
    imageUrl?: string
    /**
     * Optional callback fired when the payment reaches a successful settled status.
     * Use this to revalidate gated data (e.g. lesson content/stream) without a reload.
     */
    onSuccess?: () => void
    /**
     * Optional "start learning" destination for a course purchase. When set, the
     * success step shows a cheering-mascot congratulations with a CTA that routes
     * here (the course's `/learn` page). Omit for cart / non-course checkouts — the
     * success step then congratulates without the learn CTA.
     */
    learnHref?: string
    /**
     * Resume an EXISTING unpaid order instead of running checkout. Set by the "pay invoice"
     * popup: the modal skips checkout and jumps straight to the awaiting-QR step for this order.
     * When set, `itemIds` is ignored.
     */
    resumeOrderId?: string
    /** The stored VietQR payload (EMVCo string) of the order being resumed. */
    resumeQrCode?: string
}
