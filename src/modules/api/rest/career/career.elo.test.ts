import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * GHIM CÁCH ĐỔI ĐƯỜNG của đợt `skill-elo-rename` ở tầng client REST.
 *
 * Vì sao đây là chỗ đáng ghim nhất: app này TỰ deploy qua Vercel ngay khi nhánh merge, còn backend
 * deploy BẰNG TAY. Nên chắc chắn có một khoảng thời gian bản FE này đang chạy trước backend đã đổi
 * tên. Nếu `getMyCareerElo` chỉ gọi đường mới, khoảng đó trả `404`, biểu đồ Elo trên hồ sơ hiện
 * "chưa đọc được Elo của bạn" cho TẤT CẢ mọi người — đúng hình dạng sự cố "Could not load the badge
 * list" mà dự án này đã dính một lần rồi.
 *
 * Ba điều bị khoá:
 * 1. mặc định gọi đường MỚI `/career/me/elo`;
 * 2. `404` (và CHỈ `404`) thì thử lại đường CŨ `/career/me/skill-exp` — backend giữ nó làm alias
 *    deprecated đúng cho khoảng lệch này;
 * 3. `401/403/5xx/mạng đứt` KHÔNG được thử lại: chúng là câu trả lời THẬT cho request này (quyền,
 *    hỏng hóc) và phải tới thẳng người gọi, nếu không tầng trên sẽ phân nhánh nhầm loại lỗi.
 */

const restRequest = vi.fn()

vi.mock("@/modules/api/rest/client", async () => {
    // RestError THẬT: `getMyCareerElo` phân nhánh bằng `instanceof`, mock một class giả sẽ làm
    // nhánh đó luôn sai và test hoá ra chỉ chứng minh chính cái mock.
    const actual = await vi.importActual<typeof import("@/modules/api/rest/client")>(
        "@/modules/api/rest/client",
    )
    return {
        ...actual,
        restRequest: (...args: Array<unknown>) => restRequest(...args),
    }
})

import { RestError } from "@/modules/api/rest/client"
import { getMyCareerElo } from "./career"

const NEW_PATH = "/career/me/elo"
const LEGACY_PATH = "/career/me/skill-exp"

const payload = { majorCode: "SE", majorLabel: "Kỹ thuật phần mềm", source: "MAJOR_DEFAULTS", items: [] }

beforeEach(() => {
    restRequest.mockReset()
})

describe("getMyCareerElo", () => {
    it("gọi đường MỚI /career/me/elo và trả thẳng payload", async () => {
        restRequest.mockResolvedValue(payload)

        const result = await getMyCareerElo()

        expect(restRequest).toHaveBeenCalledTimes(1)
        expect(restRequest).toHaveBeenCalledWith({
            method: "GET",
            url: NEW_PATH,
            authenticated: true,
        })
        expect(result).toBe(payload)
    })

    it("404 ở đường mới ⇒ thử lại alias CŨ (backend chưa deploy bản đổi tên)", async () => {
        const legacyPayload = { ...payload, items: [{ slug: "programming", label: "Lập trình", sortOrder: 10, totalExp: 250 }] }
        restRequest
            .mockRejectedValueOnce(new RestError("chưa có route", 404))
            .mockResolvedValueOnce(legacyPayload)

        const result = await getMyCareerElo()

        expect(restRequest).toHaveBeenCalledTimes(2)
        expect(restRequest).toHaveBeenNthCalledWith(2, {
            method: "GET",
            url: LEGACY_PATH,
            authenticated: true,
        })
        expect(result).toBe(legacyPayload)
    })

    it.each([
        ["401 khách chưa đăng nhập", 401],
        ["403 thiếu quyền career", 403],
        ["500 backend hỏng", 500],
        ["0 mạng đứt", 0],
    ])("KHÔNG thử lại alias cũ khi %s", async (_label, status) => {
        restRequest.mockRejectedValue(new RestError("nope", status))

        await expect(getMyCareerElo()).rejects.toBeInstanceOf(RestError)
        expect(restRequest).toHaveBeenCalledTimes(1)
    })

    it("lỗi KHÔNG phải RestError (bug trong client) cũng nổi lên nguyên vẹn", async () => {
        restRequest.mockRejectedValue(new TypeError("fetch failed"))

        await expect(getMyCareerElo()).rejects.toBeInstanceOf(TypeError)
        expect(restRequest).toHaveBeenCalledTimes(1)
    })

    it("404 ở CẢ HAI đường ⇒ ném 404 (không có gì để đọc thật)", async () => {
        restRequest.mockRejectedValue(new RestError("không có", 404))

        await expect(getMyCareerElo()).rejects.toBeInstanceOf(RestError)
        expect(restRequest).toHaveBeenCalledTimes(2)
    })
})
