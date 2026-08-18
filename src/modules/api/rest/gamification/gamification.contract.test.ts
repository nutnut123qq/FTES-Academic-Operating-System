import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Contract — mọi đường dẫn REST của module gamification phải TỒN TẠI ở backend.
 *
 * ★ VÌ SAO GHIM BẰNG MÃ NGUỒN chứ không bằng một lần gọi hàm: một endpoint tự đặt không
 * hỏng lúc build, không hỏng lúc chạy test, và không hỏng cho tới khi có người mở trang
 * thật rồi thấy ba khối 404. Đợt trước FE đã tự đặt ba đường dẫn
 * (`/gamification/leaderboards/{board}`, `/gamification/seasons/current`,
 * `/gamification/me/avatar-frames`) mà backend chưa từng có và cũng không định có —
 * `SeasonBoardController` mở `/gamification/boards/{total|social}`, `courseLeaderboard`
 * là GraphQL, còn khung avatar nằm ở `/profiles/me/appearance/catalog`.
 *
 * Test này đọc chính file `gamification.ts` nên nó bắt được cả trường hợp ai đó thêm lại
 * một hàm gọi đường dẫn ma — điều mà một test gọi hàm sẽ không thấy nếu hàm đó chưa có
 * người dùng.
 */
const SOURCE = readFileSync(resolve(__dirname, "./gamification.ts"), "utf8")

/**
 * Chỉ phần MÃ, đã bỏ chú thích. Chú thích được phép NHẮC TÊN một tham số sai để giải
 * thích vì sao không dùng nó; luật ở đây là về thứ chạy thật, không phải về chữ.
 */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")

/** Đường dẫn KHÔNG có ở backend — từng được FE tự đặt ra. */
const FABRICATED_PATHS = [
    "/gamification/leaderboards/",
    "/gamification/seasons/current",
    "/gamification/me/avatar-frames",
]

describe("gamification REST contract", () => {
    it.each(FABRICATED_PATHS)("KHÔNG gọi đường dẫn không tồn tại: %s", (path) => {
        expect(SOURCE).not.toContain(path)
    })

    it("bảng theo kỳ gọi đúng route của SeasonBoardController", () => {
        expect(SOURCE).toContain("/gamification/boards/")
    })

    it("tham số kỳ là MÃ kỳ (`season`), không phải `seasonId`", () => {
        // `SeasonBoardService.page` nhận `seasonCode`; gửi `seasonId` thì backend lặng lẽ
        // bỏ qua và trả kỳ đang chạy — số liệu của một kỳ khác kỳ người xem đang hỏi.
        expect(CODE).not.toContain("seasonId")
    })

    it("KHÔNG gửi courseId: backend từ chối board=course có chủ đích", () => {
        expect(CODE).not.toContain("courseId")
    })
})
