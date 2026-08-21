import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Bề mặt LÀM BÀI được chọn theo type — chỗ đã hỏng LẶNG LẼ một lần.
 *
 * `mapChallengeType` có nhánh `default: "coding"`, nên mọi type backend mà FE chưa khai
 * đều biến thành `"coding"`; `ChallengeSolveSurface` lại chọn bề mặt THEO chính giá trị
 * đó. Hệ quả: 423 đề `ESSAY` sinh cho catalog môn mở ra TRÌNH SOẠN CODE kèm bộ chọn ngôn
 * ngữ, và nút nộp gửi `{payloadType:"CODE"}` cho một bài văn. Không lỗi, không cảnh báo —
 * chỉ sai bề mặt, nên không test nào bắt được.
 *
 * Test này ghim cả hai đầu của cặp đó: `essay` phải ra panel tự luận, `coding` vẫn phải ra
 * panel code. Ghim một đầu thôi thì lần refactor sau đổi thứ tự nhánh vẫn lọt.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

const { useParams, useSearchParams } = vi.hoisted(() => ({
    useParams: vi.fn(() => ({ challengeId: "ch-1" })),
    useSearchParams: vi.fn(() => ({ get: () => null })),
}))
vi.mock("next/navigation", () => ({ useParams, useSearchParams }))
vi.mock("@/i18n/navigation", () => ({
    Link: ({ children, href }: { children?: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    useRouter: () => ({ push: vi.fn() }),
}))

// Ba bề mặt làm bài → marker, để assert hỏi "cái NÀO được dựng" chứ không đọc nội dung.
vi.mock("./GradeCodePanel", () => ({
    GradeCodePanel: () => <div data-testid="surface-code" />,
}))
vi.mock("./EssayChallengePanel", () => ({
    EssayChallengePanel: ({ challengeId }: { challengeId: string }) => (
        <div data-testid="surface-essay" data-challenge={challengeId} />
    ),
}))
vi.mock("./UiUxChallengeEditor", () => ({
    UiUxChallengeEditor: () => <div data-testid="surface-uiux" />,
}))
vi.mock("./ChallengePaper", () => ({ ChallengePaper: () => null }))
vi.mock("@/components/reuseable/MarkdownContent", () => ({ MarkdownContent: () => null }))
vi.mock("@/components/features/subject/SubjectWorkspaceShell", () => ({
    SubjectWorkspaceShell: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

const { useQueryChallengeSwr } = vi.hoisted(() => ({ useQueryChallengeSwr: vi.fn() }))
vi.mock("../hooks/useQueryChallengeSwr", () => ({ useQueryChallengeSwr }))

import { ChallengeView } from "./index"
import { mapChallengeType } from "../hooks/useQueryChallengesSwr"
import type { ChallengeDetail } from "../hooks/useQueryChallengeSwr"

/** Challenge không kèm đề thi (paperUrl null) → đi vào nhánh chọn bề mặt theo type. */
const challenge = (type: string): ChallengeDetail =>
    ({
        id: "tu-luan-acc302-1",
        slug: "tu-luan-acc302-1",
        title: "Phân loại chi phí và phân tích điểm hòa vốn",
        description: "Đề bài…",
        type,
        mode: "INDIVIDUAL",
        status: "RUNNING",
        lifecycle: "running",
        maxSubmissions: 5,
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

const loaded = (detail: ChallengeDetail) => ({
    challenge: detail,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
})

describe("mapChallengeType", () => {
    it("ESSAY của backend KHÔNG được rơi vào nhánh mặc định 'coding'", () => {
        expect(mapChallengeType("ESSAY")).toBe("essay")
    })

    it("type backend thật sự lạ vẫn về 'coding' (facet đi tới được, không vỡ nhãn)", () => {
        expect(mapChallengeType("SOMETHING_NEW")).toBe("coding")
    })
})

describe("ChallengeSolveSurface — bề mặt theo type", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("ESSAY → panel tự luận, KHÔNG phải trình soạn code", () => {
        useQueryChallengeSwr.mockReturnValue(loaded(challenge("essay")))

        render(<ChallengeView />)

        const surface = screen.getByTestId("surface-essay")
        expect(surface).toBeTruthy()
        // Panel tự luận nhận SLUG — đúng thứ useQueryChallengeSubmissionSwr tra được.
        expect(surface.dataset.challenge).toBe("tu-luan-acc302-1")
        expect(screen.queryByTestId("surface-code")).toBeNull()
    })

    it("CODING → vẫn là trình soạn code (nhánh essay không nuốt mất)", () => {
        useQueryChallengeSwr.mockReturnValue(loaded(challenge("coding")))

        render(<ChallengeView />)

        expect(screen.getByTestId("surface-code")).toBeTruthy()
        expect(screen.queryByTestId("surface-essay")).toBeNull()
    })
})
