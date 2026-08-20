import React from "react"
import { render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { QuestBoardView, QuestItemView } from "@/modules/api/rest/gamification"
import type { QuestDestinationInput } from "@/components/features/gamification/QuestBoard/model"

/**
 * Component — quest rows LINK to the place the quest is actually done, on both
 * surfaces that draw them:
 *  - the compact dashboard widget (`DailyQuest`, this folder), and
 *  - the full `/quests` board (`QuestBoard`),
 *
 * …from ONE shared table (`questDestination`). The last describe block is the
 * anti-drift guard: it swaps the table for a sentinel and asserts BOTH surfaces
 * follow it, so a component that grew a private code→route branch fails here even
 * though its own tests would still pass.
 *
 * A quest with no honest destination (`DAILY_LOGIN`, `STREAK_7_BONUS`, an unknown
 * admin code, anything already claimed out today) must render a row that is
 * genuinely NON-interactive — no anchor, no button, no pointer cursor, no hover
 * paint. "It renders the text" is not the assertion; "there is nothing to press"
 * is.
 */

// next-intl: echo the key plus interpolation values, so an aria-label can be read
// back with the title that was interpolated into it.
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

// The quest board gates on the keycloak flag; the widget does not.
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: { keycloak: { authenticated: boolean } }) => unknown) =>
        selector({ keycloak: { authenticated: true } }),
}))

// ONE quest cache feeds both surfaces (that is the point of the widget) — so one
// mock drives both renders.
let questsResult: {
    data: QuestBoardView | undefined
    error: unknown
    isLoading: boolean
    mutate: () => void
}
vi.mock("@/hooks/swr/api/rest/queries/useGetMyQuestsSwr", () => ({
    useGetMyQuestsSwr: () => questsResult,
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetMyWalletSwr", () => ({
    useGetMyWalletSwr: () => ({ data: { balance: 0 } }),
}))

/**
 * Swaps the shared destination table for the whole file, per test. `null` keeps the
 * REAL table (the default for every test but the cross-surface guard), so these
 * tests pin the actual routes users get, not a fixture.
 */
let destinationOverride: ((input: QuestDestinationInput) => string | null) | null = null
vi.mock("@/components/features/gamification/QuestBoard/model", async (importOriginal) => {
    const actual = await importOriginal<
        typeof import("@/components/features/gamification/QuestBoard/model")
    >()
    return {
        ...actual,
        questDestination: (input: QuestDestinationInput) =>
            destinationOverride ? destinationOverride(input) : actual.questDestination(input),
    }
})

// i18n Link → a plain anchor forwarding every prop, so hrefs, classes and the
// accessible name are all readable off the rendered element.
vi.mock("@/i18n/navigation", () => ({
    Link: (props: React.ComponentProps<"a">) => <a {...props} />,
}))

// Phosphor icons → inert spans. Enumerated (not a Proxy): a catch-all namespace
// answers every ESM interop probe and destabilises the happy-dom worker.
vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        ArrowRightIcon: Icon,
        BookOpenIcon: Icon,
        ChatCircleIcon: Icon,
        CheckCircleIcon: Icon,
        CircleIcon: Icon,
        CoinsIcon: Icon,
        FireIcon: Icon,
        HeartIcon: Icon,
        PencilSimpleLineIcon: Icon,
        SignInIcon: Icon,
        TargetIcon: Icon,
        WalletIcon: Icon,
    }
})

vi.mock("@heroui/react", () => {
    const Chip = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
    Chip.Label = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
    return {
        Chip,
        Typography: ({ children, className }: { children: React.ReactNode, className?: string }) => (
            <span className={className}>{children}</span>
        ),
        cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    }
})

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ isEmpty, children }: { isEmpty?: boolean, children: React.ReactNode }) =>
        isEmpty ? <div data-testid="empty" /> : <>{children}</>,
}))
vi.mock("@/components/blocks/async/EmptyContent", () => ({
    EmptyContent: ({ title }: { title: React.ReactNode }) => <div>{title}</div>,
}))
vi.mock("@/components/blocks/skeleton/Skeleton", () => {
    const Skeleton = () => <div />
    Skeleton.Typography = () => <div />
    return { Skeleton }
})
vi.mock("@/components/blocks/gamification/GamificationChip", () => ({
    GamificationChip: ({ value }: { value: React.ReactNode }) => <span>{value}</span>,
}))
vi.mock("@/components/blocks/stats/ProgressMeter", () => ({
    ProgressMeter: ({ label }: { label: React.ReactNode }) => <div>{label}</div>,
}))
vi.mock("@/components/reuseable/FtesMascot", () => ({ FtesMascot: () => <span /> }))
vi.mock("@/components/features/mascot-moments", () => ({ MascotCelebration: () => <span /> }))

import { QuestBoard } from "@/components/features/gamification/QuestBoard"
import { DailyQuest } from "./index"

/** A quest row with the seed's defaults, overridable per test. */
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

/** Wrap quests in a board payload for the shared SWR mock. */
const board = (quests: Array<QuestItemView>): QuestBoardView => ({
    dateVn: "2026-08-21",
    totalCoinToday: 50,
    quests,
})

/**
 * The widget row that carries a title. The title `Typography` is the row's direct
 * child, so its parent IS the row element — an `<a>` when the quest has somewhere
 * to go, a `<div>` when it does not.
 */
const rowOf = (title: string, scope: HTMLElement = document.body) =>
    within(scope).getByText(title).parentElement as HTMLElement

beforeEach(() => {
    destinationOverride = null
    questsResult = {
        data: board([
            q({ code: "DAILY_LOGIN", title: "Đăng nhập hằng ngày", completedCount: 1, sortOrder: 0 }),
            q({ code: "LESSON_COMPLETE", title: "Hoàn thành 1 bài học", sortOrder: 1 }),
            q({ code: "COMMUNITY_COMMENT", title: "Bình luận cộng đồng", dailyLimit: 2, sortOrder: 2 }),
            q({ code: "COMMUNITY_POST", title: "Đăng bài cộng đồng", sortOrder: 3 }),
        ]),
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
    }
})

afterEach(() => {
    vi.clearAllMocks()
})

describe("DailyQuest — rows link to where the quest is done", () => {
    it("links each mapped quest row to its earning surface", () => {
        render(<DailyQuest />)
        // Locale-LESS hrefs: the mock swaps next-intl's Link for a plain <a>, and the
        // real Link prepends the active locale itself (a "/vi/…" here would ship as
        // "/vi/vi/…", a genuine 404).
        expect(rowOf("Hoàn thành 1 bài học").getAttribute("href")).toBe("/courses/me")
        expect(rowOf("Bình luận cộng đồng").getAttribute("href")).toBe("/community")
        expect(rowOf("Đăng bài cộng đồng").getAttribute("href")).toBe("/community/new")
    })

    it("names the destination for screen readers with the quest title", () => {
        render(<DailyQuest />)
        expect(rowOf("Đăng bài cộng đồng").getAttribute("aria-label")).toBe(
            "goDoAria(title=Đăng bài cộng đồng)",
        )
    })

    // ★ The honesty pin. `DAILY_LOGIN` is satisfied by being here; there is nowhere
    // to send anyone. The row must not merely lack an href — it must not LOOK
    // pressable either.
    it("leaves DAILY_LOGIN completely non-interactive", () => {
        render(<DailyQuest />)
        const row = rowOf("Đăng nhập hằng ngày")
        expect(row.tagName).toBe("DIV")
        expect(within(row).queryByRole("link")).toBeNull()
        expect(within(row).queryByRole("button")).toBeNull()
        expect(row.className).not.toContain("cursor-pointer")
        expect(row.className).not.toMatch(/hover:/)
    })

    it("leaves STREAK_7_BONUS non-interactive — a streak is kept, not visited", () => {
        questsResult.data = board([q({ code: "STREAK_7_BONUS", title: "Chuỗi 7 ngày", sortOrder: 0 })])
        render(<DailyQuest />)
        const row = rowOf("Chuỗi 7 ngày")
        expect(row.tagName).toBe("DIV")
        expect(within(row).queryByRole("link")).toBeNull()
        expect(row.className).not.toMatch(/hover:/)
    })

    it("leaves an unknown admin code non-interactive rather than guessing a route", () => {
        questsResult.data = board([q({ code: "SOME_ADMIN_QUEST", title: "Nhiệm vụ lạ", sortOrder: 0 })])
        render(<DailyQuest />)
        expect(rowOf("Nhiệm vụ lạ").tagName).toBe("DIV")
    })

    // Nothing left to earn today → no trip worth taking, so the row stops nagging.
    it("drops the link once every claim for the day is used", () => {
        questsResult.data = board([
            q({ code: "COMMUNITY_POST", title: "Đăng bài cộng đồng", completedCount: 1, sortOrder: 0 }),
        ])
        render(<DailyQuest />)
        const row = rowOf("Đăng bài cộng đồng")
        expect(row.tagName).toBe("DIV")
        expect(within(row).queryByRole("link")).toBeNull()
    })

    // The widget is dense by design (it sits in a dashboard card beside four other
    // blocks): navigation was added to the rows, not height. A padding utility here
    // would push the fourth row past the fold.
    it("adds navigation without making the row taller", () => {
        render(<DailyQuest />)
        const row = rowOf("Đăng bài cộng đồng")
        expect(row.className).not.toMatch(/\bp-|\bpy-|\bmy-|\bh-/)
    })

    it("still links out to the full board", () => {
        render(<DailyQuest />)
        expect(screen.getByText("overview.quest.viewAll").closest("a")?.getAttribute("href")).toBe(
            "/quests",
        )
    })
})

describe("both quest surfaces route from the SAME table", () => {
    /** The `/quests` card carrying a title — an `<a>` when the quest has a destination. */
    const cardOf = (title: string, scope: HTMLElement) =>
        within(scope).getByText(title).closest("[class*='rounded-2xl']") as HTMLElement

    // ★ Anti-drift. Neither component may own a code→route branch: swapping the
    // shared table must move BOTH of them. A surface that hardcoded "/community/new"
    // for COMMUNITY_POST keeps rendering "/community/new" here and fails.
    it("follows the shared table on the widget AND on the board", () => {
        destinationOverride = ({ code }) => `/sentinel/${code}`
        const { container: widget } = render(<DailyQuest />)
        const { container: boardEl } = render(<QuestBoard />)

        const widgetHref = rowOf("Đăng bài cộng đồng", widget).getAttribute("href")
        const boardHref = cardOf("Đăng bài cộng đồng", boardEl).getAttribute("href")
        expect(widgetHref).toBe("/sentinel/COMMUNITY_POST")
        expect(boardHref).toBe("/sentinel/COMMUNITY_POST")
        expect(widgetHref).toBe(boardHref)
    })

    // …and the same in the other direction: when the table says "nowhere", neither
    // surface may invent a link of its own.
    it("makes BOTH surfaces inert when the shared table says there is nowhere to go", () => {
        destinationOverride = () => null
        const { container: widget } = render(<DailyQuest />)
        const { container: boardEl } = render(<QuestBoard />)

        expect(rowOf("Hoàn thành 1 bài học", widget).tagName).toBe("DIV")
        expect(cardOf("Hoàn thành 1 bài học", boardEl).tagName).toBe("DIV")
        // the widget's "view all" link is the board's own navigation, not a quest row
        expect(within(widget).getAllByRole("link")).toHaveLength(1)
        expect(within(boardEl).queryAllByRole("link")).toHaveLength(0)
    })
})
