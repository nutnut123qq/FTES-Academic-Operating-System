import React from "react"
import { render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { QuestBoardView, QuestItemView } from "@/modules/api/rest/gamification"

/**
 * Component — the `/quests` QuestBoard wiring (task 2.5). The heavy presentation
 * primitives (HeroUI, the async/skeleton/chip/meter blocks, phosphor icons) are
 * mocked to trivial renderers so the test pins THIS component's own behaviour,
 * not theirs:
 *  - guests see a sign-in prompt and NO quest cards,
 *  - a signed-in board lists every seeded quest ordered by `sortOrder`,
 *  - a fully-claimed quest shows a done marker and drops its CTA,
 *  - known codes render a CTA linking to the earning surface; unknown/admin codes
 *    and the auto-complete DAILY_LOGIN render no CTA,
 *  - the header echoes today's coins and the wallet balance.
 *
 * `t` is mocked to echo the message key, so assertions key off the message id.
 */

// next-intl: echo the key; useLocale → "vi".
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

// redux: drive the keycloak `authenticated` flag from a mutable module var.
let authenticated = true
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: { keycloak: { authenticated: boolean } }) => unknown) =>
        selector({ keycloak: { authenticated } }),
}))

// The two SWR hooks the board reads — controllable per test.
let questsResult: { data: QuestBoardView | undefined; error: unknown; isLoading: boolean; mutate: () => void }
let walletResult: { data: { balance: number } | undefined }
vi.mock("@/hooks/swr/api/rest/queries/useGetMyQuestsSwr", () => ({
    useGetMyQuestsSwr: () => questsResult,
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetMyWalletSwr", () => ({
    useGetMyWalletSwr: () => walletResult,
}))

// i18n Link → a plain anchor so we can read hrefs.
vi.mock("@/i18n/navigation", () => ({
    Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

// Phosphor icons → inert spans (avoid pulling the icon set into the render).
// Enumerate the exact icons index.tsx + map.tsx import: a catch-all Proxy
// namespace answers EVERY property probe (then/__esModule/symbols) with a
// function, which destabilises ESM interop and crashes the happy-dom worker.
vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        // index.tsx
        CheckCircleIcon: Icon,
        CoinsIcon: Icon,
        SignInIcon: Icon,
        WalletIcon: Icon,
        // map.tsx
        ArrowRightIcon: Icon,
        BookOpenIcon: Icon,
        ChatCircleIcon: Icon,
        FireIcon: Icon,
        HeartIcon: Icon,
        PencilSimpleLineIcon: Icon,
        TargetIcon: Icon,
    }
})

// HeroUI primitives used directly by index.tsx.
vi.mock("@heroui/react", () => {
    const Chip = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
    Chip.Label = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
    return {
        Chip,
        Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    }
})

// Block components → minimal renderers preserving the branch semantics we assert.
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ isEmpty, children }: { isEmpty?: boolean; children: React.ReactNode }) =>
        isEmpty ? <div data-testid="empty" /> : <>{children}</>,
}))
vi.mock("@/components/blocks/async/EmptyContent", () => ({
    EmptyContent: ({ title, action }: { title: React.ReactNode; action?: React.ReactNode }) => (
        <div data-testid="empty-content">
            {title}
            {action}
        </div>
    ),
}))
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({ Skeleton: () => <div /> }))
vi.mock("@/components/blocks/gamification/GamificationChip", () => ({
    GamificationChip: ({ value }: { value: React.ReactNode }) => <span data-testid="stat-chip">{value}</span>,
}))
vi.mock("@/components/blocks/stats/ProgressMeter", () => ({
    ProgressMeter: ({ label }: { label: React.ReactNode }) => <div data-testid="meter">{label}</div>,
}))

import { QuestBoard } from "./index"

const q = (over: Partial<QuestItemView>): QuestItemView => ({
    code: "LESSON_COMPLETE",
    title: "quest",
    description: null,
    rewardCoin: 50,
    targetCount: 1,
    dailyLimit: 1,
    eventCount: 0,
    completedCount: 0,
    coinEarnedToday: 0,
    sortOrder: 0,
    ...over,
})

// Six seeded quests, supplied OUT of order to prove the board sorts by sortOrder.
const SEED: Array<QuestItemView> = [
    q({ code: "UNKNOWN_ADMIN", title: "Admin quest", sortOrder: 5 }),
    q({ code: "DAILY_LOGIN", title: "Đăng nhập", sortOrder: 0, completedCount: 1, coinEarnedToday: 50 }),
    q({ code: "LESSON_COMPLETE", title: "Hoàn thành bài học", sortOrder: 1, dailyLimit: 3 }),
    q({ code: "COMMUNITY_POST", title: "Đăng bài", sortOrder: 2 }),
    q({ code: "COMMUNITY_COMMENT", title: "Bình luận", sortOrder: 3, dailyLimit: 2, completedCount: 2 }),
    q({ code: "LIKE_3_POSTS", title: "Thả tim", sortOrder: 4 }),
]

beforeEach(() => {
    authenticated = true
    questsResult = {
        data: { dateVn: "2026-07-16", totalCoinToday: 50, quests: SEED },
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
    }
    walletResult = { data: { balance: 1200 } }
})

afterEach(() => {
    vi.clearAllMocks()
})

describe("QuestBoard", () => {
    it("gates guests with a sign-in prompt and renders no quests", () => {
        authenticated = false
        render(<QuestBoard />)
        expect(screen.getByTestId("empty-content")).toBeTruthy()
        expect(screen.getByText("signInPrompt")).toBeTruthy()
        expect(screen.queryByText("Hoàn thành bài học")).toBeNull()
        // the guest sign-in CTA points at the auth surface
        const link = screen.getByText("signIn").closest("a")
        expect(link?.getAttribute("href")).toBe("/vi/authentication")
    })

    it("lists every seeded quest ordered by sortOrder", () => {
        render(<QuestBoard />)
        const titles = ["Đăng nhập", "Hoàn thành bài học", "Đăng bài", "Bình luận", "Thả tim", "Admin quest"]
        for (const title of titles) expect(screen.getByText(title)).toBeTruthy()
        // assert the rendered DOM order matches sortOrder (out-of-order input → sorted output)
        const body = document.body.textContent ?? ""
        const positions = titles.map((title) => body.indexOf(title))
        for (let i = 1; i < positions.length; i += 1) {
            expect(positions[i]).toBeGreaterThan(positions[i - 1])
        }
    })

    it("shows a done marker and no CTA when a quest is fully claimed", () => {
        render(<QuestBoard />)
        // COMMUNITY_COMMENT (limit 2, claimed 2) is done → its card has "done", no link
        const card = screen.getByText("Bình luận").closest("div[class*='rounded-2xl']") as HTMLElement
        expect(within(card).getByText("done")).toBeTruthy()
        expect(within(card).queryByRole("link")).toBeNull()
    })

    it("renders a CTA to the earning surface for a known, not-done quest", () => {
        render(<QuestBoard />)
        const card = screen.getByText("Hoàn thành bài học").closest("div[class*='rounded-2xl']") as HTMLElement
        const link = within(card).getByRole("link")
        expect(link.getAttribute("href")).toBe("/vi/courses/me")
    })

    it("renders no CTA for unknown/admin codes and for auto-complete DAILY_LOGIN", () => {
        render(<QuestBoard />)
        const admin = screen.getByText("Admin quest").closest("div[class*='rounded-2xl']") as HTMLElement
        expect(within(admin).queryByRole("link")).toBeNull()
        const login = screen.getByText("Đăng nhập").closest("div[class*='rounded-2xl']") as HTMLElement
        // DAILY_LOGIN is also done here (claimed 1/1) → done marker, never a CTA
        expect(within(login).queryByRole("link")).toBeNull()
    })

    it("echoes today's coins and the wallet balance in the header", () => {
        render(<QuestBoard />)
        const chips = screen.getAllByTestId("stat-chip").map((el) => el.textContent)
        expect(chips).toContain("50") // totalCoinToday
        expect(chips).toContain("1.200") // wallet balance, vi-VN grouped
    })
})
