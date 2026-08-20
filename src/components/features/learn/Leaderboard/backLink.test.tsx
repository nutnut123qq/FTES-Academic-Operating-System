import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
// `vi.mock` được vitest hoist lên trên import, nên import thật vẫn nằm ở đầu file.
import { Leaderboard } from "./index"

/**
 * Component — the way OUT of the course leaderboard (`/courses/<id>/learn/leaderboard`).
 *
 * The bug this pins: `learn/layout.tsx` deliberately drops `LearnToolsRail` on this
 * route ("a single XP board, full width"), and that rail was the ONLY thing on the page
 * pointing back at the course. With no back affordance of its own, the board became a
 * dead end — the only link in it went FORWARD, to the season boards. So the assertion is
 * not merely "some link exists" but "a back affordance aimed at THIS course's Học phần
 * page", which is what a fresh tab / deep link needs.
 */

vi.mock("next-intl", () => ({
    useTranslations: (ns?: string) => (key: string) => `${ns}.${key}`,
    useLocale: () => "vi",
}))

// Trang chỉ dựng cho một khoá cụ thể — id này phải chảy vào href quay lại.
vi.mock("next/navigation", () => ({
    useParams: () => ({ courseId: "course-42" }),
}))

// `@/i18n/navigation` → thẻ <a> trần: BackLink deep-link render Link, và href chính là
// thứ cần soi. `useRouter` chỉ cần tồn tại (nhánh history không chạy trong tab mới).
vi.mock("@/i18n/navigation", () => ({
    Link: ({ href, children, ...rest }: { href: string, children: React.ReactNode }) => (
        <a href={href} {...rest}>{children}</a>
    ),
    useRouter: () => ({ back: vi.fn() }),
}))

vi.mock("@phosphor-icons/react", () => ({
    ArrowLeftIcon: () => <span />,
    InfoIcon: () => <span />,
}))

vi.mock("@heroui/react", () => ({
    Button: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

// Khối con của bảng: không thuộc phạm vi test lối quay lại.
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/components/blocks/layout/PageHeader", () => ({
    PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}))
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: () => <div />,
}))
vi.mock("./LeaderboardPodium", () => ({ LeaderboardPodium: () => <div /> }))
vi.mock("./LeaderboardTable", () => ({ LeaderboardTable: () => <div /> }))
vi.mock("./LeaderboardChampion", () => ({ LeaderboardChampion: () => <div /> }))

vi.mock("../hooks/useQueryLearnLeaderboardSwr", () => ({
    rankEntriesByCategory: () => [],
    useQueryLearnLeaderboardSwr: () => ({
        entries: [],
        computedAt: undefined,
        viewerUserId: undefined,
        isLoading: false,
        isValidating: false,
        error: undefined,
        mutate: vi.fn(),
    }),
}))

describe("Leaderboard — lối quay lại", () => {
    it("có link quay về trang Học phần của ĐÚNG khoá đang xem", () => {
        render(<Leaderboard />)

        // `common.back` là nhãn mặc định của BackLink; mock `t` echo lại key.
        const back = screen.getByRole("link", { name: "common.back" })
        expect(back).toHaveProperty(
            "href",
            expect.stringContaining("/courses/course-42/learn/content"),
        )
    })

    it("không phải chỉ có link ĐI TIẾP sang bảng theo kỳ", () => {
        // Chính là ảnh người test chụp: trang chỉ có mỗi link tiến tới bảng mùa giải,
        // không có gì lùi lại. Nếu BackLink bị gỡ, `getByRole` ở test trên đã đỏ; ở đây
        // chốt thêm rằng link quay lại KHÔNG trỏ vào bảng theo kỳ.
        render(<Leaderboard />)

        const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"))
        expect(hrefs).toContain("/courses/course-42/learn/content")
        expect(hrefs.length).toBeGreaterThan(1)
    })
})
