"use client"

import { useCallback, useEffect, useState } from "react"
import { useGetCoinQuoteSwr } from "@/hooks/swr/api/rest/queries/useGetCoinQuoteSwr"
import { clampCoinToApply, coinBreakdown } from "@/components/modals/PaymentModal/coinDiscount"

/**
 * Phần "dùng Xu" của hộp thoại mua gói: báo giá của backend + số Xu người mua đang chọn.
 *
 * **Trần luôn là của backend.** `GET /commerce/coin/quote` trả `maxApplicableCoin` cho
 * ĐÚNG số tiền này, và mọi con số hiển thị đều tính lại từ báo giá đó bằng cùng công thức
 * backend dùng lúc checkout ({@link coinBreakdown}) — nên số hiện trước khi bấm không lệch
 * số bị trừ. Chưa có báo giá ⇒ trần 0 ⇒ không áp Xu, thà không giảm còn hơn xin quá mức
 * rồi ăn 422.
 *
 * **Mặc định là KHÔNG dùng Xu.** Xu là tiền; tự tiêu hộ ngay khi mở hộp thoại là quyết định
 * thay người mua. Muốn tiêu thì có nút "dùng tối đa" ngay cạnh.
 *
 * @param amountVnd - giá gói (VND) mà báo giá tính trên
 * @param enabled - hộp thoại đang mở; đóng lại thì ngừng hỏi báo giá và quên lựa chọn cũ
 */
export const usePlanCoin = (amountVnd: number, enabled: boolean) => {
    const quoteSwr = useGetCoinQuoteSwr(amountVnd, enabled)
    const [requested, setRequested] = useState(0)

    // Đổi gói (giá khác) hoặc đóng hộp thoại ⇒ quên lựa chọn cũ. Nếu giữ lại, mở hộp thoại
    // cho gói khác sẽ thấy sẵn một số Xu mình chưa từng chọn cho gói đó.
    useEffect(() => {
        setRequested(0)
    }, [amountVnd, enabled])

    const quote = quoteSwr.data
    const breakdown = coinBreakdown(amountVnd, requested, quote)
    const maxCoin = clampCoinToApply(Number.MAX_SAFE_INTEGER, quote)

    const setCoin = useCallback(
        (next: number) => {
            setRequested(clampCoinToApply(next, quote))
        },
        [quote],
    )

    return {
        /** Báo giá thô của backend (`undefined` khi chưa tải xong / lỗi). */
        quote,
        /** Đang hỏi báo giá lần đầu. */
        isLoading: quoteSwr.isLoading && !quoteSwr.data,
        /** Không hỏi được báo giá — vẫn cho trả đủ bằng chuyển khoản, chỉ là không giảm được. */
        hasError: !quoteSwr.data && quoteSwr.error != null,
        /** TRẦN Xu áp được cho đơn này. `0` ⇒ không có gì để trượt. */
        maxCoin,
        /** Số Xu đang chọn (đã kẹp trần). */
        coin: breakdown.coinApplied,
        /** Số tiền giảm được + số còn phải trả, theo lựa chọn hiện tại. */
        breakdown,
        /** Lựa chọn hiện tại có phủ trọn đơn không (⇒ không còn gì để chuyển khoản). */
        coversAll: breakdown.coinApplied > 0 && breakdown.payableVnd === 0,
        setCoin,
        /** Xu vừa bị trừ / vừa được hoàn ⇒ đọc lại số dư. */
        refresh: quoteSwr.mutate,
    }
}
