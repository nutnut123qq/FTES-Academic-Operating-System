"use client"

import useSWR from "swr"
import { getSeasonBoard, type SeasonBoardKey, type SeasonBoardView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { toSeasonBoardRows, type SeasonBoardRow } from "../SeasonBoards/model"

/** Tham số của một lần đọc bảng. */
export interface SeasonBoardQuery {
    /** `course` | `community` | `total`. */
    board: SeasonBoardKey
    /** Kì cần xem; bỏ trống = kì đang chạy. */
    seasonId?: string | null
    /** CHỈ dùng với `board="course"` — bảng đó xếp hạng NỘI BỘ một khoá. */
    courseId?: string | null
    /** Bật/tắt để tab chưa mở thì không tốn request. */
    enabled?: boolean
}

/**
 * Một trong ba bảng xếp hạng theo kì.
 *
 * Bảng `course` BẮT BUỘC có `courseId` (xếp hạng nội bộ một khoá) — thiếu thì khoá
 * luôn request thay vì gọi một URL vô nghĩa rồi hiện lỗi máy chủ.
 *
 * ⚠️ `error` đi thẳng ra ngoài, KHÔNG bị nuốt: tầng vẽ phân loại bằng
 * `classifyBoardFailure` để tách "máy chủ chưa có endpoint" khỏi "chưa ai lên bảng".
 * `shouldRetryOnError: false` vì 404 do lane BE chưa merge sẽ không tự lành.
 */
export const useQuerySeasonBoardSwr = ({
    board,
    seasonId = null,
    courseId = null,
    enabled = true,
}: SeasonBoardQuery) => {
    const viewerUserId = useAppSelector((state) => state.user.user?.id ?? null)
    const missingCourse = board === "course" && !courseId

    const { data, isLoading, isValidating, error, mutate } = useSWR<SeasonBoardView, Error>(
        enabled && !missingCourse
            ? (["GET_SEASON_BOARD_SWR", board, seasonId, courseId] as const)
            : null,
        () => getSeasonBoard(board, { seasonId, courseId }),
        { shouldRetryOnError: false },
    )

    const rows: Array<SeasonBoardRow> = toSeasonBoardRows(data, viewerUserId)

    return {
        rows,
        myRank: data?.myRank ?? null,
        computedAt: data?.computedAt ?? null,
        seasonId: data?.seasonId ?? null,
        viewerUserId,
        /** Bảng khoá học đang chờ người dùng chọn khoá (KHÔNG phải rỗng, cũng KHÔNG phải lỗi). */
        awaitingCourse: missingCourse,
        isLoading,
        isValidating,
        error,
        mutate,
    }
}
