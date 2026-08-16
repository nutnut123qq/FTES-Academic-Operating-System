import React from "react"
import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PublicProfile } from "../../hooks/useQueryPublicProfileSwr"

/**
 * Component — the public profile's Overview tab after the profile-page cleanup:
 *  - the counter row is FRAMELESS (icon + number), so no `MetricCard` is rendered,
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
    data: { recentPosts: Array<{ id: string; title: string; likeCount: number; commentCount: number; dateLabel: string }> } | undefined
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
                { id: "post-1", title: "Bài viết đầu", likeCount: 2, commentCount: 1, dateLabel: "01/07/2026" },
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
    it("shows the four counters as bare numbers, with no metric card frame", () => {
        render(<ProfileOverviewTab profile={PROFILE} />)

        expect(screen.getByText("128")).toBeTruthy() // followers
        expect(screen.getByText("34")).toBeTruthy() // following
        expect(screen.getByText("2")).toBeTruthy() // projects (array length, not a page)
        expect(screen.getByText("1")).toBeTruthy() // achievements
        expect(screen.queryByTestId("metric-card")).toBeNull()
    })

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
})
