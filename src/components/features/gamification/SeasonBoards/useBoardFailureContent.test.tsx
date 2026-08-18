import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — {@link useBoardFailureContent}, chỗ luật "RỖNG ≠ LỖI" thành chữ trên màn.
 *
 * Ghim đúng thứ người dùng sẽ nhìn thấy khi hai lane BE chưa merge:
 *  - 404 ⇒ nội dung LỖI "máy chủ chưa có endpoint", KHÔNG phải `null` (null nghĩa là
 *    `AsyncContent` rơi xuống nhánh empty và vẽ "chưa có ai lên bảng" — nói dối),
 *  - câu lỗi phải CHỨA đường dẫn endpoint + mã trạng thái, để người sửa biết đi đâu,
 *  - 404 KHÔNG kèm nút "thử lại" (route không tồn tại thì bấm mãi cũng thế),
 *  - 5xx thì CÓ nút thử lại,
 *  - không có lỗi ⇒ `null`, để nhánh rỗng/nội dung chạy như thường.
 *
 * `t` echo key kèm tham số nội suy, nên khẳng định được endpoint/status thật sự chảy vào câu chữ.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}:${JSON.stringify(values)}` : key,
}))

import { RestError } from "@/modules/api/rest/client"
import { useBoardFailureContent } from "./useBoardFailureContent"

/** Harness: gọi hook rồi in ra kết quả để test đọc được. */
const Harness = ({ error, onRetry }: { error: unknown; onRetry?: () => void }) => {
    const failureContent = useBoardFailureContent()
    const content = failureContent(error, "GET /gamification/leaderboards/total", onRetry)
    if (!content) {
        return <div data-testid="no-failure">no-failure</div>
    }
    return (
        <div>
            <span data-testid="title">{content.title}</span>
            <span data-testid="description">{content.description}</span>
            <span data-testid="has-retry">{content.onRetry ? "yes" : "no"}</span>
        </div>
    )
}

describe("useBoardFailureContent", () => {
    it("★ 404 ⇒ nội dung LỖI 'chưa deploy', KHÔNG phải null (null sẽ thành màn rỗng giả)", () => {
        render(<Harness error={new RestError("Not Found", 404)} onRetry={() => {}} />)

        expect(screen.queryByTestId("no-failure")).toBeNull()
        expect(screen.getByTestId("title").textContent).toBe("notDeployedTitle")
    })

    it("câu lỗi mang theo ĐƯỜNG DẪN endpoint + MÃ trạng thái", () => {
        render(<Harness error={new RestError("Not Found", 404)} />)

        const description = screen.getByTestId("description").textContent ?? ""
        expect(description).toContain("GET /gamification/leaderboards/total")
        expect(description).toContain("404")
    })

    it("404 KHÔNG có nút thử lại — route không tồn tại thì bấm bao nhiêu lần cũng thế", () => {
        render(<Harness error={new RestError("Not Found", 404)} onRetry={() => {}} />)

        expect(screen.getByTestId("has-retry").textContent).toBe("no")
    })

    it("5xx ⇒ lỗi tạm thời, CÓ nút thử lại", () => {
        render(<Harness error={new RestError("Server Error", 500)} onRetry={() => {}} />)

        expect(screen.getByTestId("title").textContent).toBe("failedTitle")
        expect(screen.getByTestId("has-retry").textContent).toBe("yes")
    })

    it("401 ⇒ câu 'cần đăng nhập', không phải câu lỗi máy chủ chung chung", () => {
        render(<Harness error={new RestError("Unauthenticated", 401)} onRetry={() => {}} />)

        expect(screen.getByTestId("title").textContent).toBe("unauthenticatedTitle")
    })

    it("đứt mạng (status 0) ⇒ mã hiện '—', không in số 0 vô nghĩa", () => {
        render(<Harness error={new RestError("Network Error", 0)} />)

        expect(screen.getByTestId("description").textContent).toContain("—")
    })

    it("không có lỗi ⇒ null, nhường đường cho nhánh rỗng/nội dung", () => {
        render(<Harness error={undefined} />)

        expect(screen.getByTestId("no-failure")).toBeTruthy()
    })
})
