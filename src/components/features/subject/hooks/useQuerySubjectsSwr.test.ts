import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — bộ lọc catalog môn phải đi tới BE, KHÔNG lọc lại ở client.
 *
 * Ba nhánh đáng ghim, vì chúng là chỗ dễ hỏng im lặng:
 *   (a) chọn "Kỳ 3" / một ngành / gõ từ khoá → query string mang đúng tham số;
 *   (b) chọn "Tất cả" → KHÔNG có tham số tương ứng (gửi `null` thì axios serialize thành
 *       `semester=` — BE đọc ra chuỗi rỗng chứ không phải "bỏ lọc");
 *   (c) trang nào cũng hỏi BE đúng `page`/`size` — lọc ở client trên một trang tải sẵn sẽ cắt
 *       cụt catalog ~400 môn mà không báo gì.
 *
 * `restRequest` bị mock nên test ghim đúng contract HTTP, không chạm axios/mạng.
 */

const restRequest = vi.fn()

vi.mock("@/modules/api/rest/client", () => ({
    restRequest: (...args: Array<unknown>) => restRequest(...args),
}))

import { fetchSubjectCatalogPage, SUBJECT_PAGE_SIZE } from "./useQuerySubjectsSwr"

const paramsOfLastCall = () =>
    (restRequest.mock.calls[0]?.[0] as { params: Record<string, unknown> }).params

beforeEach(() => {
    restRequest.mockReset()
    restRequest.mockResolvedValue({ items: [], page: 0, size: 24, totalElements: 0, totalPages: 0 })
})

describe("fetchSubjectCatalogPage", () => {
    it("gửi semester/major/q khi có lọc", async () => {
        await fetchSubjectCatalogPage({ semester: 3, major: "SE", q: "  lap trinh " }, 0)

        expect(restRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "GET",
                url: "/subjects",
                params: expect.objectContaining({
                    semester: 3,
                    major: "SE",
                    // từ khoá được trim trước khi gửi
                    q: "lap trinh",
                    page: 0,
                    size: SUBJECT_PAGE_SIZE,
                }),
            }),
        )
    })

    it("KHÔNG gửi tham số nào khi chọn Tất cả", async () => {
        await fetchSubjectCatalogPage({}, 0)

        const params = paramsOfLastCall()
        expect(params.semester).toBeUndefined()
        expect(params.major).toBeUndefined()
        expect(params.q).toBeUndefined()
    })

    it("khoảng trắng thuần không tính là tìm kiếm", async () => {
        await fetchSubjectCatalogPage({ q: "   " }, 0)

        expect(paramsOfLastCall().q).toBeUndefined()
    })

    it("trang sau hỏi đúng page của BE", async () => {
        await fetchSubjectCatalogPage({ major: "BIT" }, 2)

        expect(paramsOfLastCall()).toMatchObject({ page: 2, size: SUBJECT_PAGE_SIZE })
    })
})
