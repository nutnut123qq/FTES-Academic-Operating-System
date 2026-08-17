"use client"

import useSWR from "swr"
import { getMyAvatarFrameLadder, type AvatarFrameLadderView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/**
 * Thang khung avatar của người xem (khung đang đeo + mọi bậc + điều kiện mở).
 *
 * Auth-gated: khách vãng lai khoá key về `null` nên endpoint không bắn (tránh 401 +
 * bão retry). Key mang VIEWER ID vì `unlocked`/`currentCode` là dữ liệu riêng từng
 * người — trên key trần, đăng xuất A rồi đăng nhập B trong cùng tab sẽ cho B thấy
 * thang khung của A.
 *
 * ⚠️ `error` không bị nuốt (xem `classifyBoardFailure`).
 */
export const useQueryAvatarFrameLadderSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()

    const { data, isLoading, error, mutate } = useSWR<AvatarFrameLadderView, Error>(
        authenticated && viewerId ? (["GET_AVATAR_FRAME_LADDER_SWR", viewerId] as const) : null,
        () => getMyAvatarFrameLadder(),
        { shouldRetryOnError: false },
    )

    return {
        ladder: data,
        items: data?.items ?? [],
        lifetimeXp: data?.lifetimeXp ?? 0,
        /** Khách chưa đăng nhập: không tải gì cả — đây KHÔNG phải lỗi, cũng không phải rỗng. */
        isGuest: !authenticated || !viewerId,
        isLoading: authenticated && isLoading,
        error,
        mutate,
    }
}
