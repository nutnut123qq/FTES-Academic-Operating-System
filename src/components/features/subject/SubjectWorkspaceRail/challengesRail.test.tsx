import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CodingChallenge } from "../hooks/useQuerySubjectCodingChallengesSwr"

/**
 * Component — thẻ "Challenges của môn" trong rail lối tắt của workspace môn.
 *
 * Bài test này ĐI THEO rail: trước đây rail là nửa phải của tab Tổng quan nên các ca render
 * `<SubjectOverview />`; nay rail do `SubjectWorkspaceShell` gắn làm sidebar phải của cả
 * workspace, nên chúng render thẳng `<SubjectWorkspaceRail />`. Hành vi được ghim thì KHÔNG
 * đổi một chữ — đây là dời nhà, không phải nới lỏng assertion.
 *
 * Thẻ này nói về SỐ BÀI của môn, nên nó chỉ được nói khi đã BIẾT. Hook đọc kho phải chạy hai
 * request tuần tự, nên có một quãng `challenges === []` VÀ `error === undefined` mà bản hai
 * trạng thái (có dòng / "chưa có challenge nào") sẽ khẳng định môn trống — một lời nói dối
 * chắc chắn xảy ra, không phải hên xui.
 *
 * Bốn ca dưới đây ghim đúng bốn trạng thái của cùng một hook:
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

// i18n Link → thẻ <a> thường (đọc được href); router chỉ cần push giả.
vi.mock("@/i18n/navigation", () => ({
    Link: ({ href, children }: { href: string; children?: React.ReactNode }) => (
        <a href={href}>{children}</a>
    ),
    useRouter: () => ({ push: vi.fn() }),
}))

// HeroUI primitives dùng trực tiếp trong rail → renderer tối giản.
vi.mock("@heroui/react", () => {
    const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Modal = ({ isOpen, children }: { isOpen?: boolean; children?: React.ReactNode }) =>
        isOpen ? <div>{children}</div> : null
    Modal.Backdrop = Passthrough
    Modal.Container = Passthrough
    Modal.Dialog = Passthrough
    Modal.CloseTrigger = ({ "aria-label": label }: { "aria-label"?: string }) => (
        <button type="button" aria-label={label} />
    )
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

// Phosphor: liệt đúng các icon rail import (Proxy catch-all làm hỏng ESM interop).
vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        ArrowSquareOutIcon: Icon,
        CaretRightIcon: Icon,
        FileTextIcon: Icon,
        GraduationCapIcon: Icon,
        TargetIcon: Icon,
    }
})

// Skeleton → ô có testid để đếm được shimmer của thẻ.
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: () => <div data-testid="skeleton" />,
}))

vi.mock("@/components/features/identity", () => ({
    UserLink: ({ displayName }: { displayName?: string }) => <span>{displayName}</span>,
}))

// Ba hook còn lại của rail: cố định ở trạng thái "đã tải xong" để chỉ còn MỘT biến số là
// trạng thái của hook challenge.
vi.mock("../hooks/useQuerySubjectOverviewSwr", () => ({
    useQuerySubjectOverviewSwr: () => ({
        overview: { newResources: [] },
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
vi.mock("../hooks/useQuerySubjectMembersSwr", () => ({
    useQuerySubjectMembersSwr: () => ({ members: [], isLoading: false, error: undefined }),
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

import { SubjectWorkspaceRail } from "./index"

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

const renderRail = () => render(<SubjectWorkspaceRail subjectId="JPD113" />)

beforeEach(() => {
    challengesResult = { challenges: [], isLoading: false, error: undefined }
    localStorage.clear()
})

describe("SubjectWorkspaceRail — thẻ Challenges của môn", () => {
    it("ĐANG TẢI: hiện shimmer và KHÔNG khẳng định môn chưa có challenge nào", () => {
        // Đúng hình dạng SWR trả về trước khi fetch xong: keepPreviousData=false nên
        // data===undefined → challenges rỗng VÀ error rỗng. Đây là ca mà bản cũ nói dối.
        challengesResult = { challenges: [], isLoading: true, error: undefined }
        renderRail()
        expect(screen.queryByText("overview.noChallenges")).toBeNull()
        expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0)
    })

    it("ĐỌC XONG mà môn trống thật: mới được nói chưa có challenge nào, và hết shimmer", () => {
        challengesResult = { challenges: [], isLoading: false, error: undefined }
        renderRail()
        expect(screen.getByText("overview.noChallenges")).toBeTruthy()
        expect(screen.queryAllByTestId("skeleton")).toHaveLength(0)
    })

    it("CÓ BÀI: liệt bài, không shimmer, không câu 'chưa có challenge nào'", () => {
        challengesResult = {
            challenges: [challenge({ id: "c1", title: "Bài JPD113 số 1" })],
            isLoading: false,
            error: undefined,
        }
        renderRail()
        expect(screen.getByText("Bài JPD113 số 1")).toBeTruthy()
        expect(screen.queryByText("overview.noChallenges")).toBeNull()
        expect(screen.queryAllByTestId("skeleton")).toHaveLength(0)
    })

    /**
     * The row OPENS IN PLACE — it is not a link any more.
     *
     * This rail is where a PE paper is actually reached, so it is the rail that owns the
     * dialog. The assertion is deliberately "no anchor, and the dialog appears": the body
     * of the dialog is loaded with `next/dynamic`, so waiting for the solver itself would
     * be testing the loader rather than the wiring.
     */
    it("BẤM MỘT BÀI: mở ngay tại chỗ, không phải link điều hướng đi", async () => {
        challengesResult = {
            challenges: [challenge({ id: "c1", title: "Bài JPD113 số 1" })],
            isLoading: false,
            error: undefined,
        }
        renderRail()

        const row = screen.getByText("Bài JPD113 số 1").closest("button")
        expect(row).toBeTruthy()
        expect(screen.getByText("Bài JPD113 số 1").closest("a")).toBeNull()
        expect(screen.queryByText("practice.exam.openFullPage")).toBeNull()

        fireEvent.click(row as HTMLButtonElement)

        // The dialog is open: its own control back to the real page is on screen, and that
        // page is still the deep link the row used to navigate to.
        expect(await screen.findByText("practice.exam.openFullPage")).toBeTruthy()
    })

    it("ĐỌC HỎNG: im lặng — không nói môn trống, cũng không treo shimmer vĩnh viễn", () => {
        challengesResult = { challenges: [], isLoading: false, error: new Error("subject 404") }
        renderRail()
        expect(screen.queryByText("overview.noChallenges")).toBeNull()
        expect(screen.queryAllByTestId("skeleton")).toHaveLength(0)
    })
})
