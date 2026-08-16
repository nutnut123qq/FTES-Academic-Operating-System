import type { CoinQuoteView } from "@/modules/api/rest/commerce"

/** Số Xu áp vào + số tiền hệ quả, dùng để VẼ bước Tóm tắt. */
export interface CoinBreakdown {
    /** Số Xu thực sự áp được sau khi kẹp trần (luôn là số nguyên `>= 0`). */
    coinApplied: number
    /** Số VND được giảm nhờ Xu (`coinApplied × vndPerCoin`, không vượt quá số tiền đơn). */
    coinDiscountVnd: number
    /** Số VND CÒN PHẢI TRẢ sau khi trừ Xu (không âm). */
    payableVnd: number
}

/**
 * Kẹp số Xu người dùng chọn vào TRẦN do BACKEND cấp.
 *
 * Trần là `min(maxApplicableCoin, balance)` — hai con số đều của backend, FE không tự
 * suy ra trần từ số tiền đơn. Lấy `min` của cả hai vì chúng đến từ CÙNG một báo giá:
 * nếu backend đổi chính sách (ví dụ chỉ cho giảm 50% đơn) thì `maxApplicableCoin` nhỏ
 * hơn số dư, còn khi số dư mới là chỗ chặn thì nó nhỏ hơn. Không có báo giá ⇒ trần 0
 * (chưa biết trần thì KHÔNG cho áp Xu, thà không giảm còn hơn xin quá mức rồi 422).
 *
 * Kết quả luôn là số nguyên: Xu không chia nhỏ, và backend nhận `Long`.
 *
 * @param requested - số Xu người dùng gõ/kéo (có thể âm, lẻ, hoặc quá tay)
 * @param quote - báo giá `GET /commerce/coin/quote`; `undefined` khi chưa tải xong
 */
export const clampCoinToApply = (
    requested: number,
    quote: CoinQuoteView | undefined,
): number => {
    if (!quote) return 0
    const ceiling = Math.max(0, Math.min(quote.maxApplicableCoin, quote.balance))
    if (!Number.isFinite(requested) || requested <= 0) return 0
    return Math.min(Math.floor(requested), Math.floor(ceiling))
}

/**
 * Quy đổi HIỂN THỊ: số Xu áp vào → số tiền còn phải trả.
 *
 * Tỉ lệ `vndPerCoin` và trần đều lấy từ báo giá của backend, và FE **chỉ gửi lên số
 * Xu** (`coinToApply`) chứ không gửi số tiền — số tiền cuối cùng do backend tính lại
 * bằng cùng một công thức. Hàm này chỉ để người mua thấy trước con số, nên nó phải
 * khớp tuyệt đối với backend: cùng trần, cùng tỉ lệ, cùng phép kẹp không-âm.
 *
 * Chặn thêm ở FE: phần giảm không bao giờ vượt quá số tiền đơn, nên `payableVnd`
 * không thể âm (một đơn "âm tiền" là chỗ để người ta moi tiền ra khỏi hệ thống).
 *
 * @param netVnd - số tiền phải trả TRƯỚC khi áp Xu (đã trừ mã giảm giá)
 * @param requestedCoin - số Xu người dùng chọn (sẽ được kẹp)
 * @param quote - báo giá của backend; `undefined` ⇒ không áp Xu, trả nguyên `netVnd`
 */
export const coinBreakdown = (
    netVnd: number,
    requestedCoin: number,
    quote: CoinQuoteView | undefined,
): CoinBreakdown => {
    const base = Math.max(0, netVnd)
    const coinApplied = clampCoinToApply(requestedCoin, quote)
    // Đơn 0đ: KHÔNG có gì để giảm, nên cũng không được "áp" Xu nào — trả về 0 Xu chứ
    // không phải "áp N Xu, giảm 0đ" (số đó mà gửi lên checkout là đốt Xu lấy không).
    if (!quote || coinApplied === 0 || base === 0) {
        return { coinApplied: 0, coinDiscountVnd: 0, payableVnd: base }
    }
    const coinDiscountVnd = Math.min(coinApplied * quote.vndPerCoin, base)
    return {
        coinApplied,
        coinDiscountVnd,
        payableVnd: Math.max(base - coinDiscountVnd, 0),
    }
}

/**
 * Ví có trả trọn đơn được không (bật lựa chọn "Thanh toán bằng Ví" ở tab Thanh toán).
 *
 * So `maxDiscountVnd` (mức giảm TỐI ĐA backend cho phép, đã kẹp theo cả số dư lẫn trần
 * chính sách) với `payableVnd`. KHÔNG tự nhân `balance × vndPerCoin` rồi so: nếu backend
 * có trần chỉ cho giảm một phần đơn thì số dư to vẫn không trả trọn được, và tự tính ở FE
 * sẽ bật nút để rồi checkout 422.
 *
 * `payableVnd` là SỐ TIỀN ĐƯỢC HỎI, không phải phần dư sau khi áp Xu — `OrderController`
 * trả thẳng tham số `amountVnd`/`order.totalPrice` vào field đó. Bản đầu đọc nó như "còn
 * phải trả sau khi áp trọn trần" nên điều kiện `<= 0` chỉ đúng với đơn 0đ, tức lựa chọn
 * trả trọn bằng Ví KHÔNG BAO GIỜ bật.
 */
export const walletCoversAll = (quote: CoinQuoteView | undefined): boolean =>
    quote != null
    && quote.maxApplicableCoin > 0
    && quote.payableVnd > 0
    && quote.maxDiscountVnd >= quote.payableVnd
