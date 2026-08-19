import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — thanh tương tác dưới nội dung: cụm THẢ CẢM XÚC bên trái, LƯỢT XEM bên phải.
 *
 * File này gác đúng một ranh giới: hai nửa đó BẬT TẮT ĐỘC LẬP. Bài tài liệu bỏ thả cảm xúc
 * nhưng vẫn phải đếm lượt xem — trước đây cả cụm bị gỡ nguyên khối nên mất luôn lượt xem.
 * Không có ca nào ở đây thì lỗi đó tái diễn im lặng: hai bề mặt gọi tới (`LessonReactionFooter`
 * và `Discussion`) đều MOCK component này trong test của chúng, nên không nơi nào khác nhìn
 * thấy nhánh `showReactions`.
 */

vi.mock("@heroui/react", () => {
    const Tooltip = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Tooltip.Trigger = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Tooltip.Content = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    return { Tooltip, cn: (...a: Array<unknown>) => a.filter(Boolean).join(" ") }
})

vi.mock("@phosphor-icons/react", () => ({
    EyeIcon: () => <span data-testid="eye-icon" />,
}))

vi.mock("./ReactionBar", () => ({
    ReactionBar: () => <div data-testid="reaction-bar" />,
}))

import { InteractionBar } from "./InteractionBar"
import { ReactionType, type ReactionSummary } from "@/modules/api/graphql/queries/types/discussion"

const summary: ReactionSummary = {
    counts: [{ type: ReactionType.Like, count: 3 }],
    total: 3,
    myReaction: null,
    viewCount: 42,
}

describe("InteractionBar — cảm xúc và lượt xem bật tắt độc lập", () => {
    it("mặc định: hiện CẢ cụm cảm xúc lẫn lượt xem", () => {
        render(<InteractionBar summary={summary} onReact={vi.fn()} viewCount={42} />)
        expect(screen.getByTestId("reaction-bar")).toBeTruthy()
        expect(screen.getByText("42")).toBeTruthy()
    })

    it("showReactions=false: BỎ cảm xúc nhưng GIỮ lượt xem", () => {
        // Đây là ca của bài TÀI LIỆU. Assert cả hai vế: thiếu vế thứ hai thì bản gỡ sạch
        // nguyên cụm (đã từng ship) vẫn lọt qua.
        render(
            <InteractionBar summary={summary} onReact={vi.fn()} viewCount={42} showReactions={false} />,
        )
        expect(screen.queryByTestId("reaction-bar")).toBeNull()
        expect(screen.getByText("42")).toBeTruthy()
        expect(screen.getByTestId("eye-icon")).toBeTruthy()
    })

    it("không truyền viewCount: ẩn lượt xem, cảm xúc vẫn còn", () => {
        render(<InteractionBar summary={summary} onReact={vi.fn()} />)
        expect(screen.getByTestId("reaction-bar")).toBeTruthy()
        expect(screen.queryByTestId("eye-icon")).toBeNull()
    })
})
