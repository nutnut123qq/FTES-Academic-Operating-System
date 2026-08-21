import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — trạng thái RỖNG của kho challenge phải nói ĐÚNG chuyện đang xảy ra.
 *
 * Trước đây cả hai trạng thái dùng chung đúng một câu (`practice.coding.empty` =
 * "Không có bài nào khớp bộ lọc"), nên khi môn thật sự chưa có bài nào thì màn hình đổ
 * lỗi cho một bộ lọc mà người học không hề đặt. Hai câu đó nay tách đôi và đây là chỗ
 * ghim: rỗng-vì-môn-trống ≠ rỗng-vì-bộ-lọc.
 *
 * Cũng ghim luôn việc banner `scopeNote` đã CHẾT: nó là câu xin lỗi cho nhánh fallback
 * "đổ cả kho công khai" — còn banner nghĩa là fallback đã sống lại.
 *
 * `useTranslations` trả về chính KEY, nên assert đọc thẳng đường dẫn khoá i18n.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))
vi.mock("next/dynamic", () => ({
    default:
        () =>
        ({
            challengeId,
            subjectCode,
            inModal,
        }: {
            challengeId: string
            subjectCode: string
            inModal: boolean
        }) => (
            <div
                data-testid="challenge-view"
                data-challenge-id={challengeId}
                data-subject-code={subjectCode}
                data-in-modal={String(inModal)}
            />
        ),
}))
vi.mock("@heroui/react", async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    const Modal = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
        isOpen ? <div role="dialog">{children}</div> : null
    Modal.Backdrop = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Container = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Dialog = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.CloseTrigger = () => <button type="button">close</button>
    return { ...actual, Modal }
})
vi.mock("@/i18n/navigation", () => ({
    Link: ({
        children,
        href,
    }: {
        children?: React.ReactNode
        href: string
    }) => <a href={href}>{children}</a>,
}))

// `vi.hoisted` vì factory của `vi.mock` bị nâng lên đầu file — biến khai báo thường sẽ
// chưa khởi tạo khi factory chạy.
const { useQuerySubjectCodingChallengesSwr } = vi.hoisted(() => ({
    useQuerySubjectCodingChallengesSwr: vi.fn(),
}))
// Chỉ thay CÁI HOOK; phần còn lại của module (CHALLENGE_TYPES, collectChallengeTags…)
// vẫn là hàng thật vì danh sách dựng hàng tag/menu từ chúng.
vi.mock("../hooks/useQuerySubjectCodingChallengesSwr", async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useQuerySubjectCodingChallengesSwr,
}))

import { CodingChallengeList } from "./CodingChallengeList"
import type { CodingChallenge } from "../hooks/useQuerySubjectCodingChallengesSwr"

/** Một dòng challenge đã map (chỉ field danh sách đọc mới quan trọng). */
const row = (id: string, title: string, tags: Array<string> = []): CodingChallenge => ({
    id,
    slug: id,
    title,
    description: "",
    type: "CODING",
    mode: "INDIVIDUAL",
    status: "PUBLISHED",
    lifecycle: "running",
    subjectId: "subject-jpd113",
    startsAt: null,
    endsAt: null,
    maxSubmissions: 3,
    submissionCount: 0,
    courseId: null,
    tags: tags.map((slug) => ({ slug, label: slug })),
})

/** Kết quả hook, với danh sách dòng cho trước. */
const bank = (challenges: Array<CodingChallenge>) => ({
    challenges,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
})

describe("CodingChallengeList — trạng thái rỗng", () => {
    beforeEach(() => {
        useQuerySubjectCodingChallengesSwr.mockReset()
    })

    it("môn chưa có bài nào → nói THẾ, không đổ lỗi cho bộ lọc", () => {
        useQuerySubjectCodingChallengesSwr.mockReturnValue(bank([]))

        render(<CodingChallengeList subjectId="JPD113" onBack={() => {}} />)

        expect(screen.getByText("practice.coding.emptySubject")).toBeTruthy()
        expect(screen.getByText("practice.coding.emptySubjectHint")).toBeTruthy()
        expect(screen.queryByText("practice.coding.empty")).toBeNull()
    })

    it("môn CÓ bài nhưng bộ lọc cắt hết → nói về BỘ LỌC", () => {
        useQuerySubjectCodingChallengesSwr.mockReturnValue(
            bank([row("jpd-1", "Đọc hiểu Katakana")]),
        )

        render(<CodingChallengeList subjectId="JPD113" onBack={() => {}} />)
        // gõ tìm kiếm không khớp dòng nào → rỗng, nhưng NGUYÊN NHÂN là bộ lọc
        fireEvent.change(screen.getByRole("searchbox"), {
            target: { value: "khong-ton-tai" },
        })

        expect(screen.getByText("practice.coding.empty")).toBeTruthy()
        expect(screen.queryByText("practice.coding.emptySubject")).toBeNull()
    })

    it("không bao giờ treo banner 'đang chiếu cả kho công khai' nữa", () => {
        useQuerySubjectCodingChallengesSwr.mockReturnValue(
            bank([row("jpd-1", "Đọc hiểu Katakana")]),
        )

        render(<CodingChallengeList subjectId="JPD113" onBack={() => {}} />)

        expect(screen.queryByText("practice.coding.scopeNote")).toBeNull()
    })
})

describe("CodingChallengeList — chip tag khi đổi môn", () => {
    beforeEach(() => {
        useQuerySubjectCodingChallengesSwr.mockReset()
        useQuerySubjectCodingChallengesSwr.mockReturnValue(
            bank([row("csd-1", "Tìm kiếm nhị phân", ["csd201"])]),
        )
    })

    it("đổi môn → bỏ chọn hết tag, không mang chip môn cũ theo", () => {
        const { rerender } = render(
            <CodingChallengeList subjectId="CSD201" onBack={() => {}} />,
        )
        // hook được gọi với tag rỗng ở lần đầu
        expect(useQuerySubjectCodingChallengesSwr).toHaveBeenLastCalledWith("CSD201", [])

        // người học chọn chip tag `csd201`
        fireEvent.click(screen.getByRole("button", { name: "csd201", pressed: false }))
        expect(useQuerySubjectCodingChallengesSwr).toHaveBeenLastCalledWith("CSD201", [
            "csd201",
        ])

        // sang môn khác: route chỉ đổi param nên component KHÔNG remount
        rerender(<CodingChallengeList subjectId="JPD113" onBack={() => {}} />)

        expect(useQuerySubjectCodingChallengesSwr).toHaveBeenLastCalledWith("JPD113", [])
    })
})

describe("CodingChallengeList — mở đề PE", () => {
    beforeEach(() => {
        useQuerySubjectCodingChallengesSwr.mockReset()
    })

    it("PE mở ChallengeView trong popup và giữ nguyên trang Practice", () => {
        useQuerySubjectCodingChallengesSwr.mockReturnValue(
            bank([
                {
                    ...row("uuid-pe-csd201", "Đề PE CSD201", ["pe", "csd201"]),
                    slug: "pe-csd201",
                },
            ]),
        )

        render(<CodingChallengeList subjectId="CSD201" onBack={() => {}} />)
        fireEvent.click(screen.getByText("Đề PE CSD201").closest("button")!)

        const view = screen.getByTestId("challenge-view")
        expect(view.getAttribute("data-challenge-id")).toBe("pe-csd201")
        expect(view.getAttribute("data-subject-code")).toBe("CSD201")
        expect(view.getAttribute("data-in-modal")).toBe("true")
        expect(screen.queryByRole("link", { name: /Đề PE CSD201/ })).toBeNull()
    })

    it("challenge thường vẫn đi trang giải như trước", () => {
        useQuerySubjectCodingChallengesSwr.mockReturnValue(
            bank([row("binary-search", "Tìm kiếm nhị phân")]),
        )

        render(<CodingChallengeList subjectId="CSD201" onBack={() => {}} />)

        expect(screen.getByText("Tìm kiếm nhị phân").closest("a")?.getAttribute("href")).toBe(
            "/challenges/binary-search?subject=CSD201",
        )
        expect(screen.queryByTestId("challenge-view")).toBeNull()
    })
})
