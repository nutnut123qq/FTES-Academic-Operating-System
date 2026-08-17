"use client"

import useSWR from "swr"
import { getCurrentSeason, type SeasonWindowView } from "@/modules/api/rest/gamification"

/**
 * Kì học đang chạy — mùa mà CẢ BA bảng xếp hạng bám theo.
 *
 * Không gate theo đăng nhập: khách vãng lai vẫn cần biết đang là kì nào thì bảng
 * công khai mới có nghĩa.
 *
 * ⚠️ KHÔNG nuốt lỗi ở đây. `error` được trả nguyên vẹn cho tầng vẽ để nó phân loại
 * bằng `classifyBoardFailure` — máy chủ chưa có endpoint (404) phải hiện thành một
 * câu đọc được, không được biến thành "chưa có kì nào đang chạy" (đó là hai chuyện
 * hoàn toàn khác nhau: một cái là hạ tầng thiếu, một cái là ban quản trị chưa mở kì).
 *
 * `retry` tắt vì 404 sẽ không tự lành: thử lại chỉ tạo bão request trong khi lane BE
 * chưa deploy.
 */
export const useQueryCurrentSeasonSwr = () => {
    const { data, isLoading, error, mutate } = useSWR<SeasonWindowView, Error>(
        ["GET_CURRENT_SEASON_SWR"],
        () => getCurrentSeason(),
        { shouldRetryOnError: false },
    )

    return { season: data ?? null, isLoading, error, mutate }
}
