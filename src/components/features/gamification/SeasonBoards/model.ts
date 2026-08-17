// Mô hình THUẦN (không React, không SWR) cho ba bảng xếp hạng theo kì.
//
// Tách ra file riêng vì đây là chỗ dễ sai nhất của tính năng và là chỗ duy nhất
// đáng ghim bằng unit test: phân biệt "bảng RỖNG" với "bảng LỖI", đếm ngược kì, và
// gộp ba nguồn EXP thành một đơn vị duy nhất.

import { RestError } from "@/modules/api/rest/client"
import type {
    SeasonBoardEntryView,
    SeasonBoardKey,
    SeasonBoardView,
    SeasonWindowView,
} from "@/modules/api/rest/gamification"

/** Ba bảng, đúng thứ tự hiển thị trên tab. */
export const SEASON_BOARDS: ReadonlyArray<SeasonBoardKey> = ["course", "community", "total"]

/**
 * VÌ SAO một bảng không vẽ được. `null` = không có sự cố nào (dữ liệu về bình thường,
 * kể cả khi danh sách rỗng thật).
 *
 * ★ BẪY CỦA CẢ DỰ ÁN (đã tái diễn 3 lần): gộp RỖNG với LỖI. Màn "chưa có ai lên bảng"
 * và màn "máy chủ chưa có endpoint này" trông giống hệt nhau nếu cả hai cùng rơi vào
 * nhánh empty — và không ai đi sửa cái thứ hai vì nó không kêu. Hai lane BE của đợt này
 * CHƯA merge, nên 404/501 là trạng thái RẤT có thật, phải nói thành lời.
 */
export type BoardFailure =
    /** 404/501/405 — route chưa tồn tại trên máy chủ ⇒ lane BE chưa được deploy. */
    | "NOT_DEPLOYED"
    /** 401/403 — phải đăng nhập (hoặc không đủ quyền) mới đọc được bảng. */
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

/** Một dòng đã chuẩn hoá để vẽ (tên đã giải, EXP đã tách nguồn). */
export interface SeasonBoardRow {
    userId: string
    rank: number
    /** Tên hiển thị đã giải xong — KHÔNG bao giờ là uuid thô hay `legacy_*`. */
    displayName: string
    /** Username để `UserAvatar` sinh chữ cái đầu; rỗng khi BE không có. */
    username: string
    avatar: string | null
    frame: SeasonBoardEntryView["avatarFrame"]
    badges: SeasonBoardEntryView["badges"]
    /** EXP của lát cắt bảng này đếm. */
    xp: number
    courseXp: number
    communityXp: number
    workplaceXp: number
    isViewer: boolean
}

/** Chuỗi `legacy_<uuid>` do migration để lại — không bao giờ được hiện ra mặt người dùng. */
const isLegacyPlaceholder = (value: string | null): boolean =>
    typeof value === "string" && value.startsWith("legacy_")

/**
 * Đổi một dòng máy chủ thành {@link SeasonBoardRow}.
 *
 * Thứ tự rơi tên: `displayName` → `username` → `#<8 ký tự đầu id>`. Không bịa tên,
 * không in uuid trần, và lọc `legacy_*` ở CẢ hai trường (bảng xếp hạng lộ tên rác thì
 * người dùng mất tin vào cả con số bên cạnh).
 */
export const toSeasonBoardRow = (
    entry: SeasonBoardEntryView,
    viewerUserId?: string | null,
): SeasonBoardRow => {
    const rawName = isLegacyPlaceholder(entry.displayName) ? null : entry.displayName
    const rawUsername = isLegacyPlaceholder(entry.username) ? null : entry.username
    return {
        userId: entry.userId,
        rank: entry.rank,
        displayName: rawName ?? rawUsername ?? `#${entry.userId.slice(0, 8)}`,
        username: rawUsername ?? "",
        avatar: entry.avatarUrl,
        frame: entry.avatarFrame,
        badges: entry.badges ?? [],
        xp: entry.xp,
        courseXp: entry.courseXp,
        communityXp: entry.communityXp,
        workplaceXp: entry.workplaceXp,
        isViewer: Boolean(viewerUserId) && entry.userId === viewerUserId,
    }
}

/**
 * Chuẩn hoá cả bảng. GIỮ NGUYÊN thứ tự máy chủ trả — hạng do BE tính trên toàn dân số,
 * sắp lại ở client sẽ làm hạng hiển thị lệch với hạng thật khi cửa sổ bị cắt.
 */
export const toSeasonBoardRows = (
    view: SeasonBoardView | undefined,
    viewerUserId?: string | null,
): Array<SeasonBoardRow> =>
    (view?.entries ?? []).map((entry) => toSeasonBoardRow(entry, viewerUserId))

/** Ba nguồn EXP của một dòng, để vẽ thanh phân tách + giải thích thứ hạng. */
export interface XpBreakdownSlice {
    key: "course" | "community" | "workplace"
    value: number
}

/**
 * Tách EXP một dòng thành ba nguồn.
 *
 * ★ Ba nguồn này là BA LÁT CẮT của MỘT đơn vị EXP duy nhất — không quy đổi, không hệ số.
 * Đây chính là thứ trả lời câu "vì sao tôi hạng 3 bảng này mà hạng 40 bảng kia".
 */
export const xpBreakdown = (row: SeasonBoardRow): Array<XpBreakdownSlice> => [
    { key: "course", value: row.courseXp },
    { key: "community", value: row.communityXp },
    { key: "workplace", value: row.workplaceXp },
]

/** Kì còn lại bao lâu. */
export interface SeasonCountdown {
    /** Số ngày trọn vẹn còn lại. */
    days: number
    /** Số giờ lẻ sau khi trừ {@link days}. */
    hours: number
    /** Kì đã qua thời điểm kết thúc (đang chờ chốt). */
    ended: boolean
}

/**
 * Còn bao lâu hết kì.
 *
 * @param season - kì đang chạy, hoặc `null`/`undefined` khi KHÔNG có kì nào.
 * @param now - thời điểm hiện tại (tiêm vào để test tất định).
 * @returns `null` khi không có kì hoặc `endsAt` không đọc được — người gọi phải nói
 *   thẳng "chưa có kì nào đang chạy", TUYỆT ĐỐI không hiển thị "còn 0 ngày" (0 ngày là
 *   một câu khẳng định sai: nó bảo kì sắp hết trong khi thực ra chẳng có kì nào).
 */
export const seasonCountdown = (
    season: SeasonWindowView | null | undefined,
    now: Date,
): SeasonCountdown | null => {
    if (!season?.endsAt) {
        return null
    }
    const endsAt = new Date(season.endsAt).getTime()
    if (Number.isNaN(endsAt)) {
        return null
    }
    const remaining = endsAt - now.getTime()
    if (remaining <= 0) {
        return { days: 0, hours: 0, ended: true }
    }
    const hoursTotal = Math.floor(remaining / 3_600_000)
    return { days: Math.floor(hoursTotal / 24), hours: hoursTotal % 24, ended: false }
}
