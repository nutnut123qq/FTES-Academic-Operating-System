// Mô hình THUẦN (không React, không SWR) cho hai bảng xếp hạng theo KỲ.
//
// Tách ra file riêng vì đây là chỗ dễ sai nhất của tính năng và là chỗ duy nhất
// đáng ghim bằng unit test: phân biệt "bảng RỖNG" với "CHƯA KHAI KỲ NÀO" với "LỖI".

import { RestError } from "@/modules/api/rest/client"
import type {
    SeasonBoardEntryView,
    SeasonBoardKey,
    SeasonBoardView,
} from "@/modules/api/rest/gamification"

/** Hai bảng backend phục vụ. */
export const SEASON_BOARDS: ReadonlyArray<SeasonBoardKey> = ["total", "social"]

/**
 * BA lát cắt người dùng chọn được trên thanh chọn bảng.
 *
 * <p>Khác {@link SEASON_BOARDS} một mục: `course`. Với người dùng thì cả ba là "xem bảng
 * nào", nhưng chỉ hai cái đầu là bảng của `GET /gamification/boards/{board}` — bảng khoá
 * học có công thức riêng ở GraphQL `courseLeaderboard`, và backend TỪ CHỐI `board=course`
 * có chủ đích để không đẻ ra hai con số cùng tên gọi.
 *
 * <p>Thứ tự cố ý: `total` đứng đầu vì đó là bảng đua giải có phần thưởng thật.
 */
export const SEASON_SCOPES = ["total", "course", "social"] as const

export type SeasonScope = (typeof SEASON_SCOPES)[number]

/**
 * VÌ SAO một bảng không vẽ được. `null` = không có sự cố nào (dữ liệu về bình thường,
 * kể cả khi danh sách rỗng thật).
 *
 * ★ BẪY CỦA CẢ DỰ ÁN (đã tái diễn nhiều lần): gộp RỖNG với LỖI. Màn "chưa có ai lên
 * bảng" và màn "máy chủ trả 500" trông giống hệt nhau nếu cả hai cùng rơi vào nhánh
 * empty — và không ai đi sửa cái thứ hai vì nó không kêu.
 */
export type BoardFailure =
    /** 404/501/405 — route chưa tồn tại trên máy chủ ⇒ bản backend đang chạy chưa có tính năng. */
    | "NOT_DEPLOYED"
    /** 401/403 — phải đăng nhập (hoặc thiếu leaf `gamification.board.read`). */
    | "UNAUTHENTICATED"
    /** Mọi lỗi còn lại: 5xx, đứt mạng (status 0), envelope hỏng… */
    | "FAILED"

/**
 * Xếp một lỗi SWR/REST vào {@link BoardFailure}.
 *
 * @param error - giá trị `error` của SWR (thường là {@link RestError}, nhưng có thể là
 *   `TypeError` khi đứt mạng, nên hàm này không được giả định kiểu).
 * @returns lý do hỏng, hoặc `null` khi KHÔNG có lỗi.
 *
 * Lưu ý: `undefined`/`null` trả `null` — người gọi tuyệt đối không được coi "không có
 * lỗi" là "không có dữ liệu".
 */
export const classifyBoardFailure = (error: unknown): BoardFailure | null => {
    if (error === null || error === undefined || error === false) {
        return null
    }
    if (error instanceof RestError) {
        // 404 = route không tồn tại; 501 = có route nhưng chưa cài; 405 = sai method vì
        // BE mới chỉ mount một phần. Cả ba đều là "bản BE đang chạy chưa có tính năng".
        if (error.status === 404 || error.status === 501 || error.status === 405) {
            return "NOT_DEPLOYED"
        }
        if (error.status === 401 || error.status === 403) {
            return "UNAUTHENTICATED"
        }
        return "FAILED"
    }
    return "FAILED"
}

/**
 * BỐN kết cục của một lần đọc bảng — bốn câu nói khác nhau, không được gộp bất kỳ hai
 * cái nào.
 *
 * `NO_SEASON` là ca backend cấp cờ riêng để FE nói đúng ("ban quản trị chưa mở kỳ"),
 * còn `EMPTY` là "kỳ đang chạy, chưa ai kiếm EXP". Trộn hai cái này lại là nói với
 * người dùng "chưa ai có điểm" trong khi sự thật là "chưa khai kỳ nào" — và người đọc
 * sẽ đi tìm lỗi ở chỗ họ không có lỗi.
 */
export type BoardOutcome = "FAILED" | "NO_SEASON" | "EMPTY" | "OK"

/**
 * Kết cục của một lần đọc bảng, theo đúng thứ tự ưu tiên LỖI → KHÔNG KỲ → RỖNG → CÓ.
 *
 * @param view - dữ liệu backend trả; `undefined` khi chưa có (đang tải hoặc đã lỗi).
 * @param error - lỗi SWR.
 *
 * Lỗi đi TRƯỚC: một bảng lỗi mà `view` còn cache cũ vẫn phải kêu lên là lỗi.
 */
export const boardOutcome = (
    view: SeasonBoardView | undefined,
    error?: unknown,
): BoardOutcome => {
    if (classifyBoardFailure(error) !== null) {
        return "FAILED"
    }
    if (!view) {
        // Chưa có dữ liệu mà cũng không lỗi = đang tải; người gọi xử nhánh loading
        // trước khi hỏi tới đây, nên coi như rỗng là an toàn nhất.
        return "EMPTY"
    }
    if (view.state === "NO_SEASON") {
        return "NO_SEASON"
    }
    return view.entries.length === 0 ? "EMPTY" : "OK"
}

/** Một dòng đã chuẩn hoá để vẽ. */
export interface SeasonBoardRow {
    userId: string
    rank: number
    /** EXP của lát cắt bảng này đếm. */
    xp: number
    isViewer: boolean
    /**
     * Tên hiển thị; `null` khi người này chưa có hồ sơ — tầng vẽ rơi về
     * {@link shortUserLabel}. Tài khoản không hồ sơ vẫn kiếm được EXP nên đây là trạng
     * thái BÌNH THƯỜNG, không phải sự cố.
     */
    name: string | null
    avatarUrl: string | null
    /** Mã khung viền đang đeo; `null` = không đeo khung nào. */
    avatarFrame: string | null
}

/**
 * Đổi một dòng máy chủ thành {@link SeasonBoardRow}.
 *
 * Danh tính do backend gắn từ V356 (`SeasonBoardController#withIdentity`). Trước đó dòng
 * chỉ có `(userId, xp, rank)` nên bảng vẽ mọi người thành mã rút gọn — và KHUNG VIỀN,
 * thứ cả cơ chế mùa giải dựng lên để trao, không có đường nào hiện lên chính cái bảng
 * trao nó.
 *
 * ⚠️ `displayName` rỗng cũng phải rơi về `null`, không chỉ `undefined`: chuỗi rỗng lọt
 * qua `??` và cho ra một dòng KHÔNG có nhãn nào cả.
 */
export const toSeasonBoardRow = (
    entry: SeasonBoardEntryView,
    viewerUserId?: string | null,
): SeasonBoardRow => ({
    userId: entry.userId,
    rank: entry.rank,
    xp: entry.xp,
    isViewer: Boolean(viewerUserId) && entry.userId === viewerUserId,
    name: blankToNull(entry.displayName) ?? blankToNull(entry.username),
    avatarUrl: blankToNull(entry.avatarUrl),
    avatarFrame: blankToNull(entry.avatarFrame),
})

/** `""` và `"   "` là "không có", y như `null` — xem chú thích ở {@link toSeasonBoardRow}. */
const blankToNull = (raw: string | null | undefined): string | null => {
    const trimmed = raw?.trim()
    return trimmed ? trimmed : null
}

/**
 * Chuẩn hoá cả bảng. GIỮ NGUYÊN thứ tự máy chủ trả — hạng do backend tính trên toàn dân
 * số, sắp lại ở client sẽ làm hạng hiển thị lệch với hạng thật khi cửa sổ bị cắt.
 */
export const toSeasonBoardRows = (
    view: SeasonBoardView | undefined,
    viewerUserId?: string | null,
): Array<SeasonBoardRow> =>
    (view?.entries ?? []).map((entry) => toSeasonBoardRow(entry, viewerUserId))

/**
 * Nhãn DỰ PHÒNG cho một dòng không có tên (người chưa lập hồ sơ).
 *
 * Mã rút gọn của userId là thứ duy nhất thật còn lại. Nó xấu, và nó phải xấu: một cái tên
 * đẹp bịa ra ở đây sẽ che mất việc người đó chưa có hồ sơ.
 */
export const shortUserLabel = (userId: string): string => `#${userId.slice(0, 8)}`

/**
 * Nhãn ĐỌC ĐƯỢC của một kỳ. Đây là hàm duy nhất được phép quyết định "hiện chữ gì cho kỳ này".
 *
 * <p><b>Mã kỳ KHÔNG BAO GIỜ được in nguyên ra màn hình.</b> Nó được dựng ở
 * {@code SeasonTermSyncService} theo công thức {@code T-<mã kỳ>-<8 ký tự băm md5(termId)>}; phần
 * băm có mặt để hai kỳ trùng mã ở hai năm khác nhau không đụng nhau, nó không mang thông tin nào
 * cho người đọc. In thẳng ra cho người dùng thấy "T-SU26-bfd6f768" — đã xảy ra thật trên
 * production.
 *
 * <p>Thứ tự rơi: tên backend (V356) → phần MÃ KỲ cắt ra từ mã mùa ("SU26") → `null`. Trả `null`
 * thay vì một chuỗi bịa để người gọi tự chọn câu phù hợp với chỗ của mình (ô chọn nói "Kỳ đang
 * chạy", dải mùa nói câu khác) — hàm này không biết nó đang được vẽ ở đâu.
 */
export const seasonDisplayName = (
    name: string | null | undefined,
    code: string | null | undefined,
): string | null => {
    const trimmedName = name?.trim()
    if (trimmedName) {
        return trimmedName
    }
    const trimmedCode = code?.trim()
    if (!trimmedCode) {
        return null
    }
    // `T-<mã kỳ>-<8 hex>`. Chỉ cắt khi khớp ĐÚNG khuôn — mã seed tay không theo khuôn này thì để
    // nguyên còn hơn cắt bừa mất nghĩa.
    const match = /^T-(.+)-[0-9a-f]{8}$/.exec(trimmedCode)
    return match ? match[1] : trimmedCode
}
