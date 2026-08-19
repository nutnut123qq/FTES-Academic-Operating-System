"use client"

import useSWR from "swr"
import { getAppearanceCatalog, type AppearanceCatalogView } from "@/modules/api/rest/profile"
import { useAppSelector } from "@/redux/hooks"

/**
 * Danh mục cho màn CHỌN ảnh đại diện: KHUNG viền + ALBUM ảnh mặc định.
 *
 * <p>Cùng khoá SWR (`GET_APPEARANCE_CATALOG_SWR`) với {@link useAvatarFrames}, nên dù
 * bảng xếp hạng đang tra khung và trang hồ sơ đang mở màn chọn thì vẫn chỉ MỘT request:
 * danh mục dùng chung, chỉ đổi khi chạy seed. Route nằm dưới `/me` nên đòi đăng nhập —
 * khách vãng lai khoá key về `null` (không request, không 401).
 *
 * @returns `{ frames, avatars, isLoading }` — hai danh sách rỗng khi chưa/không tải được.
 */
export const useAppearanceCatalogSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const { data, isLoading } = useSWR<AppearanceCatalogView>(
        authenticated ? (["GET_APPEARANCE_CATALOG_SWR"] as const) : null,
        () => getAppearanceCatalog(),
        {
            shouldRetryOnError: false,
            // Danh mục chỉ đổi khi seed — không revalidate theo focus/stale.
            revalidateOnFocus: false,
            revalidateIfStale: false,
        },
    )

    return {
        frames: data?.frames ?? [],
        avatars: data?.avatars ?? [],
        isLoading,
    }
}
