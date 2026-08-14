import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CodingChallenge } from "../hooks/useQuerySubjectCodingChallengesSwr"

/**
 * Component — rail "Challenges của môn" trên tab Tổng quan của một môn.
 *
 * Rail này nói về SỐ BÀI của môn, nên nó chỉ được nói khi đã BIẾT. Trước đây nhánh render
 * chỉ có hai trạng thái (có dòng / "Môn này chưa có challenge nào"), trong khi hook đọc kho
 * phải chạy hai request tuần tự và luôn xong SAU cổng loading của cả trang — nên mỗi lần mở
 * trang môn, skeleton trang vừa tắt là rail khẳng định môn trống rồi mới nhảy sang danh sách.
 * Đó là một lời nói dối chắc chắn xảy ra, không phải hên xui.
 *
 * Bốn ca dưới đây ghim ĐÚNG hành vi đó, mỗi ca một trạng thái của cùng một hook:
 *  - đang tải → shimmer, TUYỆT ĐỐI không có câu "chưa có challenge nào",
 *  - đọc xong mà môn trống thật → mới được nói câu đó,
 *  - có bài → liệt bài, không nói câu đó,
 *  - đọc hỏng → im lặng (tab Luyện tập mới là nơi có lỗi + nút Thử lại).
 *
 * `t` echo lại key nên assertion bám message id (`overview.noChallenges`).
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

vi.mock("next/navigation", () => ({
    useParams: () => ({ subjectId: "JPD113" }),
}))

// i18n Link → thẻ <a> thường (đọc được href); router chỉ cần push giả.
vi.mock("@/i18n/navigation", () => ({
    Link: ({ href, children }: { href: string; children?: React.ReactNode }) => (
        <a href={href}>{children}</a>
    ),
    useRouter: () => ({ push: vi.fn() }),
}))

// HeroUI primitives dùng trực tiếp trong index.tsx → renderer tối giản.
vi.mock("@heroui/react", () => {
    const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Modal = ({ isOpen, children }: { isOpen?: boolean; children?: React.ReactNode }) =>
        isOpen ? <div>{children}</div> : null
    Modal.Backdrop = Passthrough
    Modal.Container = Passthrough
    Modal.Dialog = Passthrough
    Modal.Header = Passthrough
    Modal.Body = Passthrough
    Modal.Footer = Passthrough
    return {
        Modal,
        Button: ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
            <button type="button" onClick={onPress}>{children}</button>
        ),
        Chip: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    }
})

// Phosphor: liệt đúng các icon index.tsx import (Proxy catch-all làm hỏng ESM interop).
vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        CaretRightIcon: Icon,
        ChatCircleIcon: Icon,
        FileTextIcon: Icon,
        GraduationCapIcon: Icon,
        HeartIcon: Icon,
        PushPinIcon: Icon,
        SignOutIcon: Icon,
        TargetIcon: Icon,
        UsersIcon: Icon,
        XIcon: Icon,
    }
})

// AsyncContent giữ nguyên NGỮ NGHĨA nhánh (lỗi → loading → nội dung) vì cổng loading của
// cả trang chính là thứ tắt TRƯỚC rail — bài test cần nó chạy đúng, không phải bị vô hiệu.
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({
        isLoading,
        skeleton,
        error,
        children,
    }: {
        isLoading: boolean
        skeleton: React.ReactNode
        error?: unknown
        children: React.ReactNode
    }) => (error ? <div data-testid="page-error" /> : isLoading ? <>{skeleton}</> : <>{children}</>),
}))

// Skeleton → ô có testid để đếm được shimmer của rail.
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: () => <div data-testid="skeleton" />,
}))

vi.mock("@/components/features/identity", () => ({
    UserLink: ({ displayName }: { displayName?: string }) => <span>{displayName}</span>,
}))

// Bốn hook còn lại của trang: cố định ở trạng thái "đã tải xong" để chỉ còn MỘT biến số là
// trạng thái của hook challenge.
vi.mock("../hooks/useQuerySubjectOverviewSwr", () => ({
    useQuerySubjectOverviewSwr: () => ({
        overview: {
            stats: { members: 12, moderators: 2, resources: 3 },
            pinnedPost: null,
            newResources: [],
            activeMembers: [],
            activeOverflow: 0,
        },
        error: undefined,
        mutate: vi.fn(),
    }),
}))
vi.mock("../hooks/useQuerySubjectSwr", () => ({
    useQuerySubjectSwr: () => ({
        subject: { uuid: "uuid-jpd113", name: "Tiếng Nhật 1", isMember: true, courseLinks: [] },
        error: undefined,
        isMembershipLoading: false,
    }),
}))
vi.mock("../hooks/useMutateSubjectMembershipSwr", () => ({
    useMutateSubjectMembershipSwr: () => ({
        join: vi.fn(),
        leave: vi.fn(),
        isJoining: false,
        isLeaving: false,
    }),
}))
vi.mock("../hooks/useQuerySubjectFeedSwr", () => ({
    useQuerySubjectFeedSwr: () => ({ posts: [] }),
}))

// Hook challenge — biến số duy nhất của bài test.
let challengesResult: {
    challenges: Array<CodingChallenge>
    isLoading: boolean
    error: unknown
}
vi.mock("../hooks/useQuerySubjectCodingChallengesSwr", () => ({
    useQuerySubjectCodingChallengesSwr: () => challengesResult,
}))

import { SubjectOverview } from "./index"

const challenge = (over: Partial<CodingChallenge>): CodingChallenge => ({
    id: "c1",
    slug: "c1",
    title: "Bài JPD113 số 1",
    description: "",
    type: "CODING",
    mode: "INDIVIDUAL",
    status: "PUBLISHED",
    lifecycle: "running",
    subjectId: "uuid-jpd113",
    startsAt: "2026-08-01T00:00:00Z",
    endsAt: null,
    maxSubmissions: 3,
    submissionCount: 0,
    courseId: null,
    tags: [],
    ...over,
})

beforeEach(() => {
    challengesResult = { challenges: [], isLoading: false, error: undefined }
    localStorage.clear()
})

describe("SubjectOverview — rail Challenges của môn", () => {
    it("ĐANG TẢI: hiện shimmer và KHÔNG khẳng định môn chưa có challenge nào", () => {
        // Đúng hình dạng SWR trả về trước khi fetch xong: keepPreviousData=false nên
        // data===undefined → challenges rỗng VÀ error rỗng. Đây là ca mà bản cũ nói dối.
        challengesResult = { challenges: [], isLoading: true, error: undefined }
        render(<SubjectOverview />)
        expect(screen.queryByText("overview.noChallenges")).toBeNull()
        expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0)
    })

    it("ĐỌC XONG mà môn trống thật: mới được nói chưa có challenge nào, và hết shimmer", () => {
        challengesResult = { challenges: [], isLoading: false, error: undefined }
        render(<SubjectOverview />)
        expect(screen.getByText("overview.noChallenges")).toBeTruthy()
        expect(screen.queryAllByTestId("skeleton")).toHaveLength(0)
    })

    it("CÓ BÀI: liệt bài, không shimmer, không câu 'chưa có challenge nào'", () => {
        challengesResult = {
            challenges: [challenge({ id: "c1", title: "Bài JPD113 số 1" })],
            isLoading: false,
            error: undefined,
        }
        render(<SubjectOverview />)
        expect(screen.getByText("Bài JPD113 số 1").closest("a")?.getAttribute("href")).toBe(
            "/challenges/c1",
        )
        expect(screen.queryByText("overview.noChallenges")).toBeNull()
        expect(screen.queryAllByTestId("skeleton")).toHaveLength(0)
    })

    it("ĐỌC HỎNG: im lặng — không nói môn trống, cũng không treo shimmer vĩnh viễn", () => {
        challengesResult = { challenges: [], isLoading: false, error: new Error("subject 404") }
        render(<SubjectOverview />)
        expect(screen.queryByText("overview.noChallenges")).toBeNull()
        expect(screen.queryAllByTestId("skeleton")).toHaveLength(0)
    })
})
