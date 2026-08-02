import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — rẽ nhánh nguồn thẻ ghi nhớ.
 *
 * Điều phải ghim: bài CÓ bộ thẻ do giảng viên soạn thì tuyệt đối KHÔNG gọi đường sinh AI.
 * Đây là cả lý do tồn tại của change (góp ý 2026-07-26: AI đề xuất câu ngoài lề, lõi phải là
 * câu hỏi người dạy chọn) — và là thứ dễ hỏng lặng lẽ nhất khi ai đó dọn effect sau này.
 */

const generate = vi.fn()
const streamState = { text: "", isStreaming: false, error: null as string | null, generate }
vi.mock("./useLessonAiStream", () => ({ useLessonAiStream: () => streamState }))

const flashcardsSwr = vi.fn()
vi.mock("@/hooks/swr/api/rest/queries", () => ({
    useGetLessonFlashcardsSwr: () => flashcardsSwr(),
}))

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }))

vi.mock("@heroui/react", () => ({
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Button: ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
        <button type="button" onClick={onPress}>{children}</button>
    ),
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

vi.mock("@phosphor-icons/react", () => ({
    ArrowClockwiseIcon: () => <span />,
    CheckCircleIcon: () => <span />,
    CursorClickIcon: () => <span />,
}))

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ isLoading, children }: { isLoading: boolean; children: React.ReactNode }) =>
        isLoading ? <div data-testid="loading" /> : <>{children}</>,
}))
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({ Skeleton: () => <div /> }))
vi.mock("@/components/blocks/stats/ProgressMeter", () => ({ ProgressMeter: () => <div /> }))

import { LessonAiFlashcards } from "./LessonAiFlashcards"

/** Một thẻ đã publish của giảng viên. */
const authoredCard = (over: Record<string, unknown> = {}) => ({
    id: "c1",
    front: "Cổng NAND làm gì?",
    back: "Phủ định của AND",
    hint: null,
    sortOrder: 1,
    status: "PUBLISHED",
    origin: "MANUAL",
    ...over,
})

describe("LessonAiFlashcards — nguồn thẻ", () => {
    beforeEach(() => {
        generate.mockClear()
        streamState.text = ""
        streamState.isStreaming = false
        streamState.error = null
    })

    it("có bộ giảng viên soạn → hiện thẻ đó và KHÔNG gọi AI lần nào", () => {
        flashcardsSwr.mockReturnValue({
            data: { lessonId: "l1", source: "AUTHORED", canManage: false, cards: [authoredCard()] },
            isLoading: false,
        })
        render(<LessonAiFlashcards lessonId="l1" />)

        expect(generate).not.toHaveBeenCalled()
        expect(screen.getByText("Cổng NAND làm gì?")).toBeTruthy()
        // mock i18n trả thẳng key (không kèm namespace "contentAi")
        expect(screen.getByText("flashcard.authoredBy")).toBeTruthy()
    })

    it("chưa có bộ tay → giữ nguyên luồng sinh bằng AI", () => {
        flashcardsSwr.mockReturnValue({
            data: { lessonId: "l1", source: "AI", canManage: false, cards: [] },
            isLoading: false,
        })
        render(<LessonAiFlashcards lessonId="l1" />)

        expect(generate).toHaveBeenCalledTimes(1)
    })

    // Sinh AI trong lúc còn đang hỏi bộ tay = vừa đốt quota vừa có thể đè lên bộ vừa về.
    it("KHÔNG sinh AI khi còn đang hỏi bộ thẻ tay", () => {
        flashcardsSwr.mockReturnValue({ data: undefined, isLoading: true })
        render(<LessonAiFlashcards lessonId="l1" />)

        expect(generate).not.toHaveBeenCalled()
    })

    // Bài chưa mở khoá trả 403 → SWR lỗi. Không được vì thế mà mất luôn đường AI cũ.
    it("hỏi bộ tay lỗi → vẫn chạy luồng AI như trước", () => {
        flashcardsSwr.mockReturnValue({ data: undefined, isLoading: false, error: new Error("403") })
        render(<LessonAiFlashcards lessonId="l1" />)

        expect(generate).toHaveBeenCalledTimes(1)
    })

    // Thẻ DRAFT là bản nháp của người soạn, học viên không được thấy.
    it("bỏ qua thẻ DRAFT, chỉ lấy PUBLISHED", () => {
        flashcardsSwr.mockReturnValue({
            data: {
                lessonId: "l1",
                source: "AUTHORED",
                canManage: true,
                cards: [authoredCard({ id: "d1", front: "Thẻ nháp", status: "DRAFT" }), authoredCard()],
            },
            isLoading: false,
        })
        render(<LessonAiFlashcards lessonId="l1" />)

        expect(screen.queryByText("Thẻ nháp")).toBeNull()
        expect(screen.getByText("Cổng NAND làm gì?")).toBeTruthy()
    })
})
