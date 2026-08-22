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
    /**
     * Số dòng xin về. Bỏ trống = mặc định của `getSeasonBoard` (50). Trần CỨNG phía backend
     * là 100 (`SeasonBoardService.MAX_LIMIT`), xin hơn cũng chỉ nhận 100.
     */
    limit?: number
    /** Bật/tắt để tab chưa mở thì không tốn request. */
    enabled?: boolean
}

/**
 * Payload bảng KÈM NHÃN câu hỏi đã hỏi. Nhãn nằm trong chính dữ liệu (chứ không ở một
 * state cạnh bên) vì `keepPreviousData` giữ lại đúng cái payload cũ — muốn biết nó trả lời
 * câu nào thì câu hỏi phải đi cùng nó.
 */
type TaggedSeasonBoardView = SeasonBoardView & {
    requestedBoard: SeasonBoardKey
    requestedSeason: string | null
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
    limit,
    enabled = true,
}: SeasonBoardQuery) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerUserId = useAppSelector((state) => state.user.user?.id ?? null)

    const { data, isLoading, isValidating, error, mutate } = useSWR<TaggedSeasonBoardView, Error>(
        // ★ `limit` PHẢI nằm trong key. Nó đổi nội dung câu trả lời (50 dòng vs 100 dòng),
        // nên hai lần đọc khác limit mà dùng chung một key thì lần xin 100 sẽ nhận lại
        // đúng 50 dòng đã cache và nút "Xem thêm" bấm xong không thấy gì đổi.
        enabled && authenticated
            ? (["GET_SEASON_BOARD_SWR", board, season, limit ?? null] as const)
            : null,
        // Dán NHÃN CÂU HỎI vào chính câu trả lời. Payload backend có `board` (chữ HOA) nhưng
        // không có kỳ đã HỎI (nó trả kỳ đã PHỤC VỤ), nên không suy ngược ra được — ghi lại
        // ở đây là cách rẻ nhất để tầng dưới biết dữ liệu đang cầm trả lời câu hỏi nào.
        async () => ({
            ...(await getSeasonBoard(board, { season, limit })),
            requestedBoard: board,
            requestedSeason: season ?? null,
        }),
        {
            shouldRetryOnError: false,
            // Chỉ giữ dữ liệu cũ để "Xem thêm" (cùng bảng, cùng kỳ, chỉ rộng `limit` ra) không
            // giật về khung xương giữa lúc người dùng đang đọc dở. Nhưng `keepPreviousData` áp
            // cho CẢ key, nên nó cũng giữ dữ liệu khi ĐỔI bảng / ĐỔI kỳ — xem `stale` bên dưới.
            keepPreviousData: true,
        },
    )

    /**
     * Dữ liệu đang cầm có trả lời ĐÚNG câu hỏi hiện tại không.
     *
     * `keepPreviousData` không phân biệt "cùng câu hỏi, cửa sổ rộng hơn" với "câu hỏi khác":
     * bấm sang tab Cộng đồng thì `data` vẫn là payload bảng Tổng, `rows` vẫn > 0, nên điều
     * kiện khung xương (`isLoading && rows.length === 0`) tắt và trang vẽ nguyên bục + 12
     * người của bảng TỔNG dưới dòng chú thích "bảng này đếm EXP cộng đồng", kèm `#3` ở cả
     * `SeasonHeader` lẫn thẻ ghim — rồi mới nhảy sang `#47` khi request về. Lệch nhãn ⇒ coi
     * như CHƯA CÓ dữ liệu, tức quay lại đúng khung xương như trước.
     */
    const stale = data !== undefined
        && (data.requestedBoard !== board || data.requestedSeason !== (season ?? null))
    // Một biến duy nhất cho mọi trường dẫn xuất: `undefined` đi qua `toSeasonBoardRows` /
    // `boardOutcome` đúng như ca "chưa có dữ liệu", nên không có trường nào sót lại giá trị cũ.
    const view: SeasonBoardView | undefined = stale ? undefined : data

    const rows: Array<SeasonBoardRow> = toSeasonBoardRows(view, viewerUserId)

    return {
        rows,
        /** Hạng người xem trên toàn dân số; `null` = chưa có EXP nào trong kỳ. */
        myRank: view?.myRank ?? null,
        /** EXP của người xem trong lát cắt này — lấy từ chính dòng của họ nếu có mặt. */
        myXp: view?.entries.find((entry) => entry.userId === viewerUserId)?.xp ?? null,
        /** Mã kỳ backend đã đọc; `null` khi không có kỳ nào đang chạy. */
        seasonCode: view?.seasonCode ?? null,
        /** Tên kỳ đọc được (V356); `null` ⇒ tầng vẽ rơi về `seasonCode`. */
        seasonName: view?.seasonName ?? null,
        /** Ngày chốt kỳ, cho đếm ngược; `null` ở bảng tích luỹ. */
        endsAt: view?.endsAt ?? null,
        /** `true` = đang xem TÍCH LUỸ. */
        lifetime: view?.lifetime ?? false,
        termId: view?.termId ?? null,
        /** `FAILED` | `NO_SEASON` | `EMPTY` | `OK` — bốn câu nói khác nhau, không gộp. */
        outcome: boardOutcome(view, error),
        viewerUserId,
        /** Khách chưa đăng nhập: KHÔNG tải gì cả — không phải lỗi, cũng không phải rỗng. */
        isGuest: !authenticated,
        // Dữ liệu lệch nhãn cũng là "đang tải": tầng vẽ chỉ có một cách nói đúng lúc đó.
        isLoading: authenticated && (isLoading || stale),
        isValidating,
        error,
        mutate,
    }
}
