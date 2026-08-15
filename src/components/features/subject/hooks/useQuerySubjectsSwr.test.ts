import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — bộ lọc KỲ của catalog môn phải đi tới BE, không lọc lại ở client.
 *
 * Hai nhánh duy nhất đáng ghim, vì chúng là chỗ dễ hỏng im lặng:
 *   (a) chọn "Kỳ 3" → query string mang `semester=3`;
 *   (b) chọn "Tất cả" → KHÔNG có tham số `semester` (gửi `null` thì axios serialize
 *       thành `semester=` — BE đọc ra chuỗi rỗng chứ không phải "bỏ lọc").
 *
 * `restRequest` bị mock nên test ghim đúng contract HTTP, không chạm axios/mạng.
 */

const restRequest = vi.fn()

vi.mock("@/modules/api/rest/client", () => ({
    restRequest: (...args: Array<unknown>) => restRequest(...args),
}))

import { fetchSubjectCatalog } from "./useQuerySubjectsSwr"

beforeEach(() => {
    restRequest.mockReset()
    restRequest.mockResolvedValue({ items: [], page: 0, size: 100, totalElements: 0, totalPages: 0 })
})

describe("fetchSubjectCatalog", () => {
    it("gửi semester=3 khi chọn Kỳ 3", async () => {
        await fetchSubjectCatalog(3)

        expect(restRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "GET",
                url: "/subjects",
                params: expect.objectContaining({ semester: 3 }),
            }),
        )
    })

    it("KHÔNG gửi tham số semester khi chọn Tất cả", async () => {
        await fetchSubjectCatalog(null)

        const config = restRequest.mock.calls[0]?.[0] as { params: Record<string, unknown> }
        expect(config.params.semester).toBeUndefined()
    })
})
