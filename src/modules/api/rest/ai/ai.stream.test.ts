import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — `sendSessionMessageStream` tách event SSE của trợ giảng AI.
 *
 * Ranh giới giữa hai event là MỘT DÒNG TRỐNG, viết bằng LF hay CRLF đều hợp lệ theo spec. Bản cũ cắt
 * bằng `buffer.indexOf("\n\n")`: chuỗi `"\r\n\r\n"` không có hai `\n` liền nhau nên trượt sạch mọi
 * ranh giới, cả stream dồn vào buffer rồi bị `dispatch(buffer)` cuối hàm xử lý như MỘT block — chỉ
 * còn `event:` cuối cùng, mất hết delta.
 *
 * Biến thể CRLF dựng NGAY TẠI ĐÂY thay vì thêm fixture trên đĩa: fixture dễ bị `core.autocrlf` viết
 * lại lúc checkout nên test sẽ phụ thuộc cấu hình git của máy chạy (đúng cái bẫy đã dính ở
 * `FTES-AOS-Admin`, xem change `sse-crlf-block-boundary`).
 */

vi.mock("@/modules/api/rest/client", () => ({ restRequest: vi.fn() }))
vi.mock("@/resources/env/public", () => ({
    publicEnv: () => ({ api: { http: "https://api.test" } }),
}))
vi.mock("@/modules/storage/local/storage", () => ({
    LocalStorage: { getItemAsString: () => "token" },
}))
vi.mock("@/modules/storage/local/enums/id", () => ({
    LocalStorageId: { KeycloakAccessToken: "token" },
}))

import { sendSessionMessageStream } from "./ai"

/** Stream LF chuẩn: hai delta, một done — đủ để thấy block có bị gộp hay không. */
const LF_STREAM =
    "event: delta\ndata:Xin " +
    "\n\nevent: delta\ndata:chào\n\n" +
    'event: done\ndata:{"messageId":"m1"}\n\n'

/** Response giả: phát payload thành từng mảnh `chunkSize` byte, cắt cả giữa ký tự UTF-8. */
function streamResponse(payload: string, chunkSize: number) {
    const bytes = new TextEncoder().encode(payload)
    let offset = 0
    return {
        ok: true,
        status: 200,
        body: {
            getReader: () => ({
                read: async () => {
                    if (offset >= bytes.length) return { done: true, value: undefined }
                    const value = bytes.slice(offset, offset + chunkSize)
                    offset += chunkSize
                    return { done: false, value }
                },
            }),
        },
    } as unknown as Response
}

function collect() {
    const deltas: Array<string> = []
    const dones: Array<unknown> = []
    const errors: Array<string> = []
    return {
        deltas,
        dones,
        errors,
        handlers: {
            onDelta: (t: string) => deltas.push(t),
            onDone: (d: unknown) => dones.push(d),
            onError: (c: string) => errors.push(c),
        },
    }
}

beforeEach(() => {
    vi.clearAllMocks()
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe("sendSessionMessageStream — ranh giới event", () => {
    it("stream LF: mỗi delta về riêng, done parse đúng", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse(LF_STREAM, 7)))
        const c = collect()

        await sendSessionMessageStream("s1", "hỏi", c.handlers)

        expect(c.deltas).toEqual(["Xin ", "chào"])
        expect(c.dones).toEqual([{ messageId: "m1" }])
        expect(c.errors).toEqual([])
    })

    it("stream CRLF: ra ĐÚNG cùng kết quả, không dính \\r vào nội dung", async () => {
        const crlf = LF_STREAM.replace(/\n/g, "\r\n")
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse(crlf, 5)))
        const c = collect()

        await sendSessionMessageStream("s1", "hỏi", c.handlers)

        // Hai khẳng định tách bạch: `deltas.length` bắt lỗi gộp block, `toEqual` bắt lỗi sót `\r`.
        expect(c.deltas).toHaveLength(2)
        expect(c.deltas).toEqual(["Xin ", "chào"])
        expect(c.deltas.join("")).not.toContain("\r")
        expect(c.dones).toEqual([{ messageId: "m1" }])
    })

    it("ranh giới bị cắt ngang giữa hai lần đọc vẫn chỉ phát MỘT lần", async () => {
        // chunk 1 byte ⇒ mọi ranh giới đều bị cắt rời, và ký tự tiếng Việt cũng bị xé giữa chừng.
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse(LF_STREAM, 1)))
        const c = collect()

        await sendSessionMessageStream("s1", "hỏi", c.handlers)

        expect(c.deltas).toEqual(["Xin ", "chào"])
        expect(c.dones).toHaveLength(1)
    })
})

/**
 * Ca này mới thật sự cần việc strip `\r` per-line, và mutation check đã lộ ra rằng bộ test trước đó
 * KHÔNG phủ: bộ tách block nuốt luôn `\r` đứng ngay trước ranh giới, nên block chỉ có MỘT dòng
 * `data:` thì dòng đó vốn đã sạch. Chỉ khi block có NHIỀU dòng `data:` (spec SSE cho phép, và
 * `dispatch` cố ý join chúng bằng "\n") thì dòng không-cuối mới còn `\r` dính vào nội dung.
 */
describe("sendSessionMessageStream — block nhiều dòng data", () => {
    const MULTILINE = "event: delta\ndata:dòng 1\ndata:dòng 2\n\n"

    it("LF: hai dòng data ghép bằng \n", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse(MULTILINE, 6)))
        const c = collect()
        await sendSessionMessageStream("s1", "hỏi", c.handlers)
        expect(c.deltas).toEqual(["dòng 1\ndòng 2"])
    })

    it("CRLF: ghép ra ĐÚNG như LF — không có \r kẹt giữa hai dòng", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse(MULTILINE.replace(/\n/g, "\r\n"), 6)))
        const c = collect()
        await sendSessionMessageStream("s1", "hỏi", c.handlers)
        expect(c.deltas).toEqual(["dòng 1\ndòng 2"])
    })
})
