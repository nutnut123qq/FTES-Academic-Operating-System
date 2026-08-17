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

/** Hai bảng backend phục vụ, đúng thứ tự hiển thị trên tab. */
export const SEASON_BOARDS: ReadonlyArray<SeasonBoardKey> = ["total", "social"]

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
}

/**
 * Đổi một dòng máy chủ thành {@link SeasonBoardRow}.
 *
 * ⚠️ KHÔNG có tên ở đây, và đó không phải thiếu sót của hàm này: `EntryView` của backend
 * chỉ mang `(userId, xp, rank)`. FE không có endpoint nào đổi một mớ userId sang hồ sơ,
 * nên tầng vẽ hiện mã rút gọn cho người khác và tên thật cho chính người xem (danh tính
 * đó FE đã cầm sẵn trong store). Bịa một cái tên ở đây thì cả bảng thành vô nghĩa.
 */
export const toSeasonBoardRow = (
    entry: SeasonBoardEntryView,
    viewerUserId?: string | null,
): SeasonBoardRow => ({
    userId: entry.userId,
    rank: entry.rank,
    xp: entry.xp,
    isViewer: Boolean(viewerUserId) && entry.userId === viewerUserId,
})

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
 * Nhãn thay tên cho một dòng KHÔNG phải người xem.
 *
 * Mã rút gọn của userId là thứ DUY NHẤT thật mà FE đang có. Nó xấu, và nó phải xấu:
 * một cái tên đẹp bịa ra sẽ khiến không ai đi bổ sung tên vào contract backend.
 */
export const shortUserLabel = (userId: string): string => `#${userId.slice(0, 8)}`
