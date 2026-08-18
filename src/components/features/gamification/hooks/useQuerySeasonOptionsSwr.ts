"use client"

import useSWR from "swr"
import { getSeasonOptions, type SeasonOptionView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"

/**
 * Danh sách KỲ cho ô chọn mùa (`GET /api/v1/gamification/boards/seasons`).
 *
 * Gác cùng leaf với chính bảng nên khách vãng lai khoá key về `null`: bắn đi chỉ nhận
 * 401 rồi hiện một ô chọn rỗng ở chỗ lẽ ra phải mời đăng nhập.
 *
 * ⚠️ Hỏng ở đây KHÔNG được làm hỏng bảng. Bảng đọc được kỳ đang chạy mà không cần danh
 * sách này (bỏ trống `season` là backend tự lấy kỳ RUNNING); mất danh sách chỉ có nghĩa
 * là "không đổi kỳ được", không phải "không xem được gì". Nên `error` trả ra ngoài để
 * tầng vẽ thu ô chọn lại, chứ không ném lên chặn cả trang.
 */
export const useQuerySeasonOptionsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const { data, isLoading, error } = useSWR<Array<SeasonOptionView>, Error>(
        authenticated ? (["GET_SEASON_OPTIONS_SWR"] as const) : null,
        () => getSeasonOptions(),
        { shouldRetryOnError: false },
    )

    return {
        seasons: data ?? [],
        isLoading: authenticated && isLoading,
        error,
    }
}
