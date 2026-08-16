import React from "react"
import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PublicProfile } from "../../hooks/useQueryPublicProfileSwr"

/**
 * Component — the public profile's Overview tab after the profile-page cleanup:
 *  - the counter row is NOT here any more — it moved into the identity card, above the
 *    tab strip (see `ProfileStatsRow`, which carries that test now),
 *  - projects / achievements no longer preview here (they live in the Profile tab),
 *  - this person's community posts DO render here (moved off the Connections tab),
 *  - with no posts the tab still shows an empty state, never a blank panel.
 *
 * `t` echoes the message key, so assertions key off the message id.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

// Phosphor icons → inert spans (enumerated, no catch-all Proxy).
vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        CaretRightIcon: Icon,
        MedalIcon: Icon,
        StackIcon: Icon,
        UserPlusIcon: Icon,
        UsersThreeIcon: Icon,
    }
})

vi.mock("@heroui/react", () => ({
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

/**
 * `PostEngagementBar` là component THẬT có test riêng (và kéo theo cả hook lưu bài, chia sẻ,
 * chục icon). Ở đây chỉ cần biết mỗi bài được gắn một thanh tương tác và nhận đúng dữ liệu,
 * nên mock nó thành một nhãn phơi props ra DOM.
 */
vi.mock("@/components/reuseable/PostEngagementBar", () => ({
    PostEngagementBar: ({ likes, liked, commentsCount, saveEntityId }: {
        likes: number; liked: boolean; commentsCount: number; saveEntityId?: string
    }) => (
        <div
            data-testid="engagement-bar"
            data-likes={likes}
            data-liked={String(liked)}
            data-comments={commentsCount}
            data-save-id={saveEntityId}
        />
    ),
}))

vi.mock("@/components/features/community/hooks/useMutateReactPostSwr", () => ({
    useMutateReactPostSwr: () => vi.fn(),
}))

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

vi.mock("@/i18n/navigation", () => ({
    Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}))

// Blocks → minimal renderers keeping the branch semantics we assert. A MetricCard
// stand-in is registered too: if the counter row regressed back to cards, the test
// would see it.
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ isLoading, skeleton, children }: {
        isLoading?: boolean
        skeleton?: React.ReactNode
        children: React.ReactNode
    }) => (isLoading ? <>{skeleton}</> : <>{children}</>),
}))
vi.mock("@/components/blocks/async/EmptyContent", () => ({
    EmptyContent: ({ title }: { title: React.ReactNode }) => (
        <div data-testid="empty-content">{title}</div>
    ),
}))
vi.mock("@/components/blocks/cards/LabeledCard", () => ({
    LabeledCard: ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
        <section>
            <h2>{label}</h2>
            {children}
        </section>
    ),
}))
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: { ListRow: () => <div data-testid="skeleton-row" /> },
}))
vi.mock("@/components/blocks/stats/MetricCard", () => ({
    MetricCard: () => <div data-testid="metric-card" />,
}))

// The shared community hook — controllable per test.
let communityResult: {
    data: { recentPosts: Array<{ id: string; title: string; likeCount: number; commentCount: number; dateLabel: string; likedByMe: boolean; bookmarkedByMe: boolean }> } | undefined
    isLoading: boolean
    error: unknown
    mutate: () => void
}
vi.mock("../../hooks/useQueryPublicCommunitySwr", () => ({
    useQueryPublicCommunitySwr: () => communityResult,
}))

import { ProfileOverviewTab } from "./index"

const PROFILE = {
    userId: "u-1",
    username: "minh",
    name: "Minh",
    headline: "",
    about: "xin chao",
    campus: "",
    skills: [],
    followers: 128,
    following: 34,
    avatarUrl: "",
    contactEmail: "",
    phone: "",
    academic: null,
    socialLinks: [],
    projects: [
        { id: "p-1", title: "Dự án 1", description: "", techStack: [], repoUrl: "", demoUrl: "", highlighted: true, sortOrder: 0 },
        { id: "p-2", title: "Dự án 2", description: "", techStack: [], repoUrl: "", demoUrl: "", highlighted: false, sortOrder: 1 },
    ],
    achievements: [
        { id: "a-1", title: "Thành tích 1", description: "", achievedAt: "2026-01-01" },
    ],
    assets: [],
} as unknown as PublicProfile

beforeEach(() => {
    communityResult = {
        data: {
            recentPosts: [
                { id: "post-1", title: "Bài viết đầu", likeCount: 3, commentCount: 2, dateLabel: "01/07/2026", likedByMe: true, bookmarkedByMe: false },
            ],
        },
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
    }
})

afterEach(() => {
    vi.clearAllMocks()
})

describe("ProfileOverviewTab", () => {
    it("no longer previews projects or achievements — those moved to the Profile tab", () => {
        render(<ProfileOverviewTab profile={PROFILE} />)

        expect(screen.queryByText("profile.portfolio.projects")).toBeNull()
        expect(screen.queryByText("publicProfile.stats.achievements")).toBeNull()
        expect(screen.queryByText("Dự án 1")).toBeNull()
        expect(screen.queryByText("Thành tích 1")).toBeNull()
    })

    it("renders the profile's community posts, linking each to its thread", () => {
        render(<ProfileOverviewTab profile={PROFILE} />)

        expect(screen.getByText("publicProfile.community.postsTitle")).toBeTruthy()
        const link = screen.getByRole("link", { name: /Bài viết đầu/ })
        expect(link.getAttribute("href")).toBe("/community/post-1")
    })

    it("keeps a real empty state when the person has no posts", () => {
        communityResult = { data: { recentPosts: [] }, isLoading: false, error: undefined, mutate: vi.fn() }
        render(<ProfileOverviewTab profile={PROFILE} />)

        expect(screen.getByTestId("empty-content")).toBeTruthy()
        expect(screen.getByText("publicProfile.community.postsEmpty")).toBeTruthy()
    })

    /**
     * Chủ dự án chốt: hồ sơ người khác phải có thích / bình luận / chia sẻ / lưu ngay trên
     * từng bài, giống ngoài cộng đồng — trước đó hàng bài chỉ là một dòng chữ đếm số.
     */
    it("mỗi bài có thanh tương tác mang đúng số liệu và trạng thái của người xem", () => {
        render(<ProfileOverviewTab profile={PROFILE} />)

        const bars = screen.getAllByTestId("engagement-bar")
        expect(bars.length).toBe(1)
        expect(bars[0].getAttribute("data-likes")).toBe("3")
        expect(bars[0].getAttribute("data-comments")).toBe("2")
        expect(bars[0].getAttribute("data-save-id")).toBe("post-1")
    })
})
