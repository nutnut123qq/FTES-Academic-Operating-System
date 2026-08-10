import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — màn soạn thẻ ghi nhớ.
 *
 * Điều phải ghim: MỌI đường tạo thẻ đều gửi `status: "DRAFT"` TƯỜNG MINH. BE mặc định
 * `PUBLISHED` khi thiếu trường này, nên quên nó ở đường nhận-cả-lô là đẩy thẳng thẻ AI chưa ai
 * duyệt tới học viên — đúng thứ góp ý 2026-07-26 phàn nàn. Đây là loại lỗi không component
 * test thì không ai thấy cho tới khi học viên đọc phải thẻ máy.
 */

const create = vi.fn(() => Promise.resolve({}))
const createBulk = vi.fn(() => Promise.resolve([]))
const patch = vi.fn(() => Promise.resolve({}))
const remove = vi.fn(() => Promise.resolve())

vi.mock("@/hooks/swr/api/rest/mutations", () => ({
    usePostLessonFlashcardSwr: () => ({ trigger: create, isMutating: false }),
    usePostLessonFlashcardsBulkSwr: () => ({ trigger: createBulk, isMutating: false }),
    usePatchLessonFlashcardSwr: () => ({ trigger: patch }),
    useDeleteLessonFlashcardSwr: () => ({ trigger: remove }),
}))

// runRest chạy thẳng action rồi trả kết quả (không toast trong test).
vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => (action: () => Promise<unknown>) => action(),
}))

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }))

vi.mock("@heroui/react", () => ({
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
    Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
    TextArea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
    TextField: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Button: ({
        children,
        onPress,
        isDisabled,
        "aria-label": ariaLabel,
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
        "aria-label"?: string
    }) => (
        <button type="button" aria-label={ariaLabel} disabled={isDisabled} onClick={onPress}>
            {children}
        </button>
    ),
}))

vi.mock("@phosphor-icons/react", () => ({
    PencilSimpleIcon: () => <span />,
    PlusIcon: () => <span />,
    TrashIcon: () => <span />,
}))

import { LessonFlashcardManager } from "./LessonFlashcardManager"

const AI_DRAFTS = [
    { q: "Cổng XOR?", a: "Khác nhau thì 1" },
    { q: "Flip-flop D?", a: "Chốt theo cạnh xung" },
]

describe("LessonFlashcardManager — trạng thái thẻ tạo mới", () => {
    beforeEach(() => {
        create.mockClear()
        createBulk.mockClear()
        patch.mockClear()
    })

    it("nhận CẢ LÔ thẻ AI phải gửi status DRAFT + origin AI_ACCEPTED", () => {
        render(
            <LessonFlashcardManager
                lessonId="l1"
                cards={[]}
                aiDrafts={AI_DRAFTS}
                onChanged={vi.fn()}
            />,
        )

        fireEvent.click(screen.getByText("flashcard.manage.acceptAll"))

        expect(createBulk).toHaveBeenCalledTimes(1)
        expect(createBulk).toHaveBeenCalledWith([
            { front: "Cổng XOR?", back: "Khác nhau thì 1", status: "DRAFT", origin: "AI_ACCEPTED" },
            { front: "Flip-flop D?", back: "Chốt theo cạnh xung", status: "DRAFT", origin: "AI_ACCEPTED" },
        ])
    })

    it("thẻ gõ tay cũng vào DRAFT, không lên sóng ngay", () => {
        render(<LessonFlashcardManager lessonId="l1" cards={[]} onChanged={vi.fn()} />)

        const [front, back] = screen.getAllByRole("textbox")
        fireEvent.change(front, { target: { value: "Câu hỏi tay" } })
        fireEvent.change(back, { target: { value: "Đáp án tay" } })
        fireEvent.click(screen.getByText("flashcard.manage.add"))

        expect(create).toHaveBeenCalledWith(
            expect.objectContaining({ front: "Câu hỏi tay", back: "Đáp án tay", status: "DRAFT" }),
        )
    })

    // Sửa chính tả một thẻ ĐANG xuất bản không được âm thầm kéo nó về nháp — học viên đang
    // học sẽ mất thẻ giữa chừng.
    it("SỬA thẻ thì KHÔNG gửi status", () => {
        const published = {
            id: "c1",
            front: "Câu cũ",
            back: "Đáp cũ",
            hint: null,
            sortOrder: 1,
            status: "PUBLISHED",
            origin: "MANUAL",
        }
        render(<LessonFlashcardManager lessonId="l1" cards={[published]} onChanged={vi.fn()} />)

        fireEvent.click(screen.getByLabelText("flashcard.manage.edit"))
        fireEvent.click(screen.getByText("flashcard.manage.save"))

        expect(patch).toHaveBeenCalledTimes(1)
        const [[arg]] = patch.mock.calls as unknown as Array<[{ request: Record<string, unknown> }]>
        expect(arg.request).not.toHaveProperty("status")
    })

    it("không có bản nháp AI thì không hiện nút nhận cả lô", () => {
        render(<LessonFlashcardManager lessonId="l1" cards={[]} onChanged={vi.fn()} />)

        expect(screen.queryByText("flashcard.manage.acceptAll")).toBeNull()
    })
})
