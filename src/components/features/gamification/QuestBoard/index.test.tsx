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
 *  - the header echoes today's coins and the wallet balance,
 *  - the per-claim EXP reward renders beside the coin when the backend quotes
 *    one, and renders NOTHING when it does not.
 *
 * `t` is mocked to echo the message key PLUS its interpolation values
 * (`perClaimXp(xp=100)`), so assertions key off the message id AND can pin the
 * actual number rendered — a test that only matched the key would still pass if
 * a null EXP leaked through as "+0".
 */

// next-intl: echo the key and any interpolation values; useLocale → "vi".
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) => {
        if (!values) return key
        const args = Object.entries(values)
            .map(([name, value]) => `${name}=${String(value)}`)
            .join(",")
        return `${key}(${args})`
    },
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
//
// The EXP fields deliberately cover all four backend states across the six cards:
//  - a quoted number (`LESSON_COMPLETE`, `COMMUNITY_POST`, `LIKE_3_POSTS`),
//  - an explicit `null` (`DAILY_LOGIN` — no EXP; also null trigger),
//  - a genuine `0` (`COMMUNITY_COMMENT` — a rule that really pays zero),
//  - the field ABSENT (`UNKNOWN_ADMIN` — a backend that predates `rewardXp`).
const SEED: Array<QuestItemView> = [
    q({ code: "UNKNOWN_ADMIN", title: "Admin quest", sortOrder: 5 }),
    q({
        code: "DAILY_LOGIN",
        title: "Đăng nhập",
        sortOrder: 0,
        completedCount: 1,
        coinEarnedToday: 50,
        rewardXp: null,
        triggerEventXp: null,
    }),
    q({
        code: "LESSON_COMPLETE",
        title: "Hoàn thành bài học",
        sortOrder: 1,
        dailyLimit: 3,
        rewardXp: 100,
        triggerEventXp: 500,
    }),
    q({ code: "COMMUNITY_POST", title: "Đăng bài", sortOrder: 2, rewardXp: 100, triggerEventXp: 20 }),
    q({
        code: "COMMUNITY_COMMENT",
        title: "Bình luận",
        sortOrder: 3,
        dailyLimit: 2,
        completedCount: 2,
        rewardXp: 0,
        triggerEventXp: 10,
    }),
    q({ code: "LIKE_3_POSTS", title: "Thả tim", sortOrder: 4, rewardXp: 100, triggerEventXp: 10 }),
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
        // The guest sign-in CTA points at the auth surface, LOCALE-LESS: the mock
        // above swaps next-intl's `Link` for a plain <a>, so this asserts the href
        // handed TO the locale-aware Link — which prepends the locale itself. A
        // "/vi/..." here would ship as "/vi/vi/authentication" (404) in the browser.
        const link = screen.getByText("signIn").closest("a")
        expect(link?.getAttribute("href")).toBe("/authentication")
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
        // Locale-less — next-intl's Link adds the prefix (see the guest-gate test).
        expect(link.getAttribute("href")).toBe("/courses/me")
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

    // ------------------------------------------------------------------ EXP reward
    //
    // The owner's report was "the quest board never shows the EXP". These pin BOTH
    // halves of the fix: the number appears when the backend quotes one, and
    // absolutely nothing appears when it does not.

    /** The card element wrapping a quest title. */
    const cardOf = (title: string) =>
        screen.getByText(title).closest("div[class*='rounded-2xl']") as HTMLElement

    it("shows the per-claim EXP beside the coin reward", () => {
        render(<QuestBoard />)
        const card = cardOf("Hoàn thành bài học")
        // both rewards are on the card, both per-CLAIM, neither replacing the other
        expect(within(card).getByText("perClaim(coin=50)")).toBeTruthy()
        expect(within(card).getByText("perClaimXp(xp=100)")).toBeTruthy()
    })

    // ★ The regression that matters: `null` must render NOTHING. Asserting only
    // "the 100 shows up" would still pass with a `?? 0` bug printing "+0 EXP" on
    // every quest the backend said pays none.
    it("renders NO EXP at all when rewardXp is null — never '+0'", () => {
        render(<QuestBoard />)
        const card = cardOf("Đăng nhập")
        expect(within(card).queryByText(/^perClaimXp/)).toBeNull()
        // the coin reward is untouched — this is about EXP only
        expect(within(card).getByText("perClaim(coin=50)")).toBeTruthy()
    })

    it("renders no EXP when the backend predates the field entirely", () => {
        render(<QuestBoard />)
        expect(within(cardOf("Admin quest")).queryByText(/^perClaimXp/)).toBeNull()
    })

    // The other side of the same distinction: a rule that genuinely pays 0 must
    // SHOW its zero. If a null-guard were written as a truthiness check, this
    // card would silently lose its reward line.
    it("shows a genuine zero, so 0 and null stay distinguishable on screen", () => {
        render(<QuestBoard />)
        expect(within(cardOf("Bình luận")).getByText("perClaimXp(xp=0)")).toBeTruthy()
    })

    // `triggerEventXp` is what the ACTIVITY pays, not what the QUEST pays. Putting
    // it on the card lets a learner read "+600 EXP" off a quest that pays 100.
    it("never renders triggerEventXp, and never the sum of the two", () => {
        render(<QuestBoard />)
        const body = document.body.textContent ?? ""
        expect(body).toContain("perClaimXp(xp=100)")
        expect(body).not.toContain("500") // the lesson.completed trigger value
        expect(body).not.toContain("600") // rewardXp + triggerEventXp
    })
})
