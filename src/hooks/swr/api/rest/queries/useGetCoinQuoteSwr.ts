"use client"

import useSWR from "swr"
import { getCoinQuote, type CoinQuoteView } from "@/modules/api/rest/commerce"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/**
 * SWR query wrapper for {@link getCoinQuote} (`GET /commerce/coin/quote?amountVnd=`).
 *
 * Trả về TRẦN Xu áp được + tỉ lệ quy đổi cho MỘT số tiền cụ thể. Modal thanh toán gọi
 * nó với số tiền SAU khi trừ mã giảm giá, nên đổi mã giảm giá là báo giá tự tính lại —
 * FE không tự suy trần từ số dư.
 *
 * Auth-gated giống {@link import("./useGetMyWalletSwr").useGetMyWalletSwr}: khách chưa
 * đăng nhập key `null` nên không bắn `/coin/quote` (401 + retry storm), và key mang
 * VIEWER ID vì báo giá chứa SỐ DƯ VÍ — đăng xuất A rồi đăng nhập B trong cùng tab mà
 * dùng key trần thì SWR vẽ lại số dư của A cho B.
 *
 * `amountVnd <= 0` (đơn 0đ / chưa có số tiền) cũng key `null`: không có gì để giảm.
 *
 * @param amountVnd - số tiền VND cần báo giá (đã trừ mã giảm giá)
 * @param enabled - tắt hẳn khi modal đóng, khỏi giữ poll/revalidate vô ích
 */
export const useGetCoinQuoteSwr = (amountVnd: number, enabled = true) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<CoinQuoteView, Error>(
        enabled && authenticated && viewerId && amountVnd > 0
            ? ["GET_COIN_QUOTE_SWR", viewerId, amountVnd]
            : null,
        () => getCoinQuote({ amountVnd }),
    )

    return swr
}
