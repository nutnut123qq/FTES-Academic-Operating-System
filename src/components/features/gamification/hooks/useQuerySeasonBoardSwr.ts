"use client"

import useSWR from "swr"
import { getSeasonBoard, type SeasonBoardKey, type SeasonBoardView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { boardOutcome, toSeasonBoardRows, type SeasonBoardRow } from "../SeasonBoards/model"

/** Tham số của một lần đọc bảng. */
export interface SeasonBoardQuery {
    /** `total` | `social` — hai bảng backend phục vụ. */
    board: SeasonBoardKey
    /** MÃ kỳ cần xem; bỏ trống = kỳ đang chạy. */
    season?: string | null
    /** Bật/tắt để tab chưa mở thì không tốn request. */
    enabled?: boolean
}

/**
 * Một trong hai bảng xếp hạng theo kỳ (`GET /api/v1/gamification/boards/{board}`).
 *
 * Endpoint ĐÒI ĐĂNG NHẬP (leaf `gamification.board.read`), nên khách vãng lai khoá key
 * về `null`: bắn đi chỉ nhận 401 rồi hiện một khối lỗi ở chỗ lẽ ra phải mời đăng nhập.
 *
 * ⚠️ `error` đi thẳng ra ngoài, KHÔNG bị nuốt: tầng vẽ phân loại bằng
 * `classifyBoardFailure`, và dùng `outcome` để tách "chưa khai kỳ nào" (`NO_SEASON` —
 * cờ do backend cấp) khỏi "kỳ đang chạy nhưng chưa ai lên bảng".
 */
export const useQuerySeasonBoardSwr = ({
    board,
    season = null,
    enabled = true,
}: SeasonBoardQuery) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerUserId = useAppSelector((state) => state.user.user?.id ?? null)

    const { data, isLoading, isValidating, error, mutate } = useSWR<SeasonBoardView, Error>(
        enabled && authenticated
            ? (["GET_SEASON_BOARD_SWR", board, season] as const)
            : null,
        () => getSeasonBoard(board, { season }),
        { shouldRetryOnError: false },
    )

    const rows: Array<SeasonBoardRow> = toSeasonBoardRows(data, viewerUserId)

    return {
        rows,
        /** Hạng người xem trên toàn dân số; `null` = chưa có EXP nào trong kỳ. */
        myRank: data?.myRank ?? null,
        /** EXP của người xem trong lát cắt này — lấy từ chính dòng của họ nếu có mặt. */
        myXp: data?.entries.find((entry) => entry.userId === viewerUserId)?.xp ?? null,
        /** Mã kỳ backend đã đọc; `null` khi không có kỳ nào đang chạy. */
        seasonCode: data?.seasonCode ?? null,
        /** Tên kỳ đọc được (V354); `null` ⇒ tầng vẽ rơi về `seasonCode`. */
        seasonName: data?.seasonName ?? null,
        /** Ngày chốt kỳ, cho đếm ngược; `null` ở bảng tích luỹ. */
        endsAt: data?.endsAt ?? null,
        /** `true` = đang xem TÍCH LUỸ. */
        lifetime: data?.lifetime ?? false,
        termId: data?.termId ?? null,
        /** `FAILED` | `NO_SEASON` | `EMPTY` | `OK` — bốn câu nói khác nhau, không gộp. */
        outcome: boardOutcome(data, error),
        viewerUserId,
        /** Khách chưa đăng nhập: KHÔNG tải gì cả — không phải lỗi, cũng không phải rỗng. */
        isGuest: !authenticated,
        isLoading: authenticated && isLoading,
        isValidating,
        error,
        mutate,
    }
}
