import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — MỘT view, HAI chỗ dựng: route `/challenges/[challengeId]` và modal mở từ
 * danh sách đề PE.
 *
 * Đây là chỗ dễ vỡ LẶNG LẼ nhất của việc thêm modal: `page.tsx` render `<ChallengeView />`
 * TRỐNG TRƠN, nên chỉ cần một prop trở thành bắt buộc — hoặc fallback `useParams()` /
 * `useSearchParams()` bị bỏ đi — là deep link chết mà không lỗi biên dịch nào bắt được
 * (prop optional + TSX luôn truyền `{}`). Test ghim đúng hai điều:
 *
 * 1. **Route** — không prop nào cả → id lấy từ `useParams()`, `?subject=` lấy từ query,
 *    có link "quay lại" và có rail môn học bọc ngoài.
 * 2. **Modal** — id/subject đến từ PROP, `useParams()`/`useSearchParams()` rỗng (modal
 *    đứng trên trang khác, URL không hề đổi) → vẫn hỏi đúng challenge, và bỏ hai khung
 *    của trang: link "quay lại" (đã có × của dialog) và rail (đang đứng sẵn trên đó).
 *
 * `useTranslations` trả về chính KEY nên assert đọc thẳng đường dẫn khoá i18n.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

const { useParams, useSearchParams, push } = vi.hoisted(() => ({
    useParams: vi.fn(),
    useSearchParams: vi.fn(),
    push: vi.fn(),
}))
vi.mock("next/navigation", () => ({ useParams, useSearchParams }))
vi.mock("@/i18n/navigation", () => ({
    Link: ({ children, href }: { children?: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    useRouter: () => ({ push }),
}))

// Rail = khung của TRANG. Thay bằng marker để test hỏi được "có bọc rail không".
vi.mock("@/components/features/subject/SubjectWorkspaceShell", () => ({
    SubjectWorkspaceShell: ({
        children,
        subjectId,
    }: {
        children?: React.ReactNode
        subjectId: string
    }) => <div data-testid="workspace-rail" data-subject={subjectId}>{children}</div>,
}))

// Các surface nặng (monaco/sandpack/pdf) không liên quan tới việc lấy id — stub cho gọn.
vi.mock("./GradeCodePanel", () => ({ GradeCodePanel: () => null }))
vi.mock("./UiUxChallengeEditor", () => ({ UiUxChallengeEditor: () => null }))
vi.mock("./ChallengePaper", () => ({ ChallengePaper: () => null }))
vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: () => null,
}))

const { useQueryChallengeSwr } = vi.hoisted(() => ({ useQueryChallengeSwr: vi.fn() }))
vi.mock("../hooks/useQueryChallengeSwr", () => ({ useQueryChallengeSwr }))

import { ChallengeView } from "./index"
import type { ChallengeDetail } from "../hooks/useQueryChallengeSwr"

/** Challenge tối thiểu, KHÔNG kèm đề thi (paperUrl null) → surface "sắp có". */
const challenge = (id: string, title: string): ChallengeDetail =>
    ({
        id,
        slug: id,
        title,
        description: "",
        type: "other",
        mode: "INDIVIDUAL",
        status: "PUBLISHED",
        lifecycle: "running",
        subjectId: "subject-csd201",
        startsAt: null,
        endsAt: null,
        maxSubmissions: 3,
        submissionCount: 0,
        courseId: "",
        tags: [],
        requirements: [],
        steps: [],
        hints: [],
        starter: { html: "", css: "", js: "" },
        targetImageUrl: "",
        isLocked: false,
        paperUrl: null,
        paperMime: null,
    }) as unknown as ChallengeDetail

/** Kết quả hook đã tải xong. */
const loaded = (detail: ChallengeDetail) => ({
    challenge: detail,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
})

/** `?subject=` giả — chỉ `get` được dùng. */
const search = (subject: string | null) => ({ get: () => subject })

describe("ChallengeView — route vs modal", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useQueryChallengeSwr.mockReturnValue(loaded(challenge("ch-route", "Đề PE tuần 1")))
    })

    it("ROUTE: không prop nào → id lấy từ params, subject lấy từ query, có back + rail", () => {
        useParams.mockReturnValue({ challengeId: "ch-route" })
        useSearchParams.mockReturnValue(search("CSD201"))

        // đúng như `app/[locale]/challenges/[challengeId]/page.tsx` render
        render(<ChallengeView />)

        expect(useQueryChallengeSwr).toHaveBeenCalledWith("ch-route")
        expect(screen.getByText("Đề PE tuần 1")).toBeTruthy()
        // link quay lại trỏ về đúng tab thực hành của môn trong query
        const back = screen.getByRole("link", { name: /uiuxEditor.backToCatalog/ })
        expect(back.getAttribute("href")).toBe("/subjects/CSD201/practice")
        expect(screen.getByTestId("workspace-rail").dataset.subject).toBe("CSD201")
    })

    it("ROUTE: không có ?subject= → vẫn render, không rail, back về kho challenge", () => {
        useParams.mockReturnValue({ challengeId: "ch-route" })
        useSearchParams.mockReturnValue(search(null))

        render(<ChallengeView />)

        expect(useQueryChallengeSwr).toHaveBeenCalledWith("ch-route")
        expect(
            screen.getByRole("link", { name: /uiuxEditor.backToCatalog/ }).getAttribute("href"),
        ).toBe("/challenges")
        expect(screen.queryByTestId("workspace-rail")).toBeNull()
    })

    it("MODAL: id/subject từ PROP dù URL rỗng; bỏ back link và rail", () => {
        // modal đứng trên trang khác: route không mang challengeId, query không mang subject
        useParams.mockReturnValue({})
        useSearchParams.mockReturnValue(search(null))
        useQueryChallengeSwr.mockReturnValue(loaded(challenge("ch-modal", "Đề PE tuần 2")))

        render(<ChallengeView challengeId="ch-modal" subjectCode="CSD201" inModal />)

        expect(useQueryChallengeSwr).toHaveBeenCalledWith("ch-modal")
        expect(screen.getByText("Đề PE tuần 2")).toBeTruthy()
        expect(screen.queryByRole("link", { name: /uiuxEditor.backToCatalog/ })).toBeNull()
        expect(screen.queryByTestId("workspace-rail")).toBeNull()
    })

    it("PROP thắng params, nhưng vẫn qua đúng cổng lọc subject", () => {
        useParams.mockReturnValue({ challengeId: "ch-route" })
        useSearchParams.mockReturnValue(search("CSD201"))
        useQueryChallengeSwr.mockReturnValue(loaded(challenge("ch-modal", "Đề PE tuần 2")))

        // subject rác từ caller bị `challengeSubjectCode` chặn y như URL sửa tay
        render(<ChallengeView challengeId="ch-modal" subjectCode="../../evil" />)

        expect(useQueryChallengeSwr).toHaveBeenCalledWith("ch-modal")
        expect(screen.queryByTestId("workspace-rail")).toBeNull()
        expect(
            screen.getByRole("link", { name: /uiuxEditor.backToCatalog/ }).getAttribute("href"),
        ).toBe("/challenges")
    })
})
