import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type {
    GoldenBoardTermOptionView,
    GoldenBoardView,
} from "@/modules/api/rest/course"

/**
 * Component — {@link GoldenBoardPage} (`/goldenboard`). Pins the term-picker contract:
 *  - the picker lists EXACTLY what `GET /golden-board/terms` returned (the endpoint already
 *    filters to terms that HAVE a board, so the page must not invent or drop options),
 *  - with no `?term=` the page shows the BE's own "latest" board and marks that term selected,
 *  - picking a term mirrors it to `?term=<code>` via `replace` (shareable link, no history spam),
 *  - a term that exists but has no rows shows the per-term empty state, NOT an error,
 *  - an unknown `?term=` in the URL (BE `TERM_NOT_FOUND`) degrades to the "term not found" state
 *    with the picker still on screen, so the visitor is never stranded on a blank page.
 *
 * `t` echoes the message key (+ params) so assertions key off ids.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
        params ? `${key}:${JSON.stringify(params)}` : key,
    useLocale: () => "en",
}))

vi.mock("@phosphor-icons/react", () => ({
    TrophyIcon: () => <span />,
    TrayIcon: () => <span />,
    WarningOctagonIcon: () => <span />,
    ArrowLeftIcon: () => <span />,
}))

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
        variant,
    }: {
        children: React.ReactNode
        onPress?: () => void
        variant?: string
    }) => (
        <button type="button" data-variant={variant} onClick={onPress}>
            {children}
        </button>
    ),
    Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Skeleton: () => <div />,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

// The board itself has its own suite; here it only has to prove it received rows.
vi.mock("../GoldenBoard", () => ({
    GoldenBoard: ({ entries }: { entries: ReadonlyArray<unknown> }) => (
        <div data-testid="board">{entries.length}</div>
    ),
    GoldenBoardSkeleton: () => <div data-testid="board-skeleton" />,
}))

vi.mock("@/components/blocks/navigation/BackLink", () => ({ BackLink: () => <span /> }))

// Routing: the URL is an input we control per test; `replace` is captured.
const replace = vi.fn()
let urlSearch = ""
vi.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams(urlSearch),
}))
vi.mock("@/i18n/navigation", () => ({
    usePathname: () => "/goldenboard",
    useRouter: () => ({ replace }),
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

// The three public reads, controllable per test.
type Swr<T> = { data?: T; isLoading: boolean; error?: unknown }
let termsSwr: Swr<Array<GoldenBoardTermOptionView>>
let latestSwr: Swr<GoldenBoardView>
let termBoardSwr: Swr<GoldenBoardView>
vi.mock("@/hooks/swr/api/rest/queries/useGetGoldenBoardTermsSwr", () => ({
    useGetGoldenBoardTermsSwr: () => termsSwr,
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetGoldenBoardLatestSwr", () => ({
    useGetGoldenBoardLatestSwr: () => latestSwr,
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetGoldenBoardForTermSwr", () => ({
    useGetGoldenBoardForTermSwr: () => termBoardSwr,
}))

import { GoldenBoardPage, isTermSelected } from "./index"

const term = (
    id: string,
    code: string,
    name: string,
    entryCount = 3,
): GoldenBoardTermOptionView => ({
    id,
    code,
    name,
    startsAt: "2026-01-01T00:00:00Z",
    endsAt: "2026-04-01T00:00:00Z",
    status: "ACTIVE",
    entryCount,
})

const board = (termId: string | null, entryCount: number): GoldenBoardView => ({
    term: termId
        ? {
            id: termId,
            code: termId.toUpperCase(),
            name: `Term ${termId}`,
            startsAt: "2026-01-01T00:00:00Z",
            endsAt: "2026-04-01T00:00:00Z",
            status: "ACTIVE",
        }
        : null,
    entries: Array.from({ length: entryCount }, (_, index) => ({
        id: `row-${index}`,
        rank: index,
        userId: null,
        username: null,
        displayName: `Learner ${index}`,
        photoUrl: null,
        headline: null,
        badgeLabel: null,
        lines: [],
    })),
})

beforeEach(() => {
    replace.mockClear()
    urlSearch = ""
    termsSwr = { data: [term("sp26", "SP26", "Spring 2026"), term("fa25", "FA25", "Fall 2025")], isLoading: false }
    latestSwr = { data: board("sp26", 5), isLoading: false }
    termBoardSwr = { data: undefined, isLoading: false }
})

describe("GoldenBoardPage — term picker", () => {
    it("lists exactly the terms the BE returned, with their entry counts", () => {
        render(<GoldenBoardPage />)

        expect(screen.getByText("Spring 2026")).toBeTruthy()
        expect(screen.getByText("Fall 2025")).toBeTruthy()
        // entryCount badges ride along
        expect(screen.getAllByText("3")).toHaveLength(2)
        // and nothing beyond the BE list is offered
        expect(screen.queryByText("Summer 2025")).toBeNull()
    })

    it("hides the picker entirely when no term has a board", () => {
        termsSwr = { data: [], isLoading: false }
        latestSwr = { data: board(null, 0), isLoading: false }

        render(<GoldenBoardPage />)

        expect(screen.queryByText("Spring 2026")).toBeNull()
        expect(screen.getByText("empty.title")).toBeTruthy()
    })

    it("defaults to the BE's latest board and marks that term selected", () => {
        render(<GoldenBoardPage />)

        expect(screen.getByTestId("board").textContent).toBe("5")
        const selected = screen.getByText("Spring 2026").closest("button")
        expect(selected?.getAttribute("data-variant")).toBe("secondary")
        expect(screen.getByText("Fall 2025").closest("button")?.getAttribute("data-variant")).toBe("ghost")
    })

    it("mirrors the picked term to ?term=<code> so the board is linkable", () => {
        render(<GoldenBoardPage />)

        fireEvent.click(screen.getByText("Fall 2025"))

        expect(replace).toHaveBeenCalledWith("/goldenboard?term=FA25", { scroll: false })
    })

    it("marks the URL term selected whether the link carries the code or the id", () => {
        const option = { id: "sp26", code: "SP26" }
        expect(isTermSelected(option, "SP26", null)).toBe(true)
        expect(isTermSelected(option, "sp26", null)).toBe(true)
        expect(isTermSelected(option, "FA25", null)).toBe(false)
        // no ?term= → the latest board decides
        expect(isTermSelected(option, null, "sp26")).toBe(true)
        expect(isTermSelected(option, null, "fa25")).toBe(false)
    })
})

describe("GoldenBoardPage — degenerate boards", () => {
    it("shows the per-term empty state (not an error) when a real term has no rows", () => {
        urlSearch = "term=FA25"
        termBoardSwr = { data: board("fa25", 0), isLoading: false }

        render(<GoldenBoardPage />)

        expect(screen.getByText("emptyTerm.title")).toBeTruthy()
        expect(screen.queryByText("unknownTerm.title")).toBeNull()
        // the picker stays on screen as the way out
        expect(screen.getByText("Spring 2026")).toBeTruthy()
    })

    it("degrades an unknown ?term= to the term-not-found state, keeping the picker", () => {
        urlSearch = "term=NOPE"
        termBoardSwr = { data: undefined, isLoading: false, error: new Error("TERM_NOT_FOUND") }

        render(<GoldenBoardPage />)

        expect(screen.getByText("unknownTerm.title")).toBeTruthy()
        expect(screen.queryByTestId("board")).toBeNull()
        expect(screen.getByText("Spring 2026")).toBeTruthy()

        // the recovery action drops ?term= and falls back to the latest board
        fireEvent.click(screen.getByText("unknownTerm.action"))
        expect(replace).toHaveBeenCalledWith("/goldenboard", { scroll: false })
    })

    it("reports a failing DEFAULT board as a load failure, not as a bad term the visitor never typed", () => {
        latestSwr = { data: undefined, isLoading: false, error: new Error("network") }

        render(<GoldenBoardPage />)

        expect(screen.getByText("loadFailed.title")).toBeTruthy()
        expect(screen.queryByText("unknownTerm.title")).toBeNull()
    })

    it("shows the layout-matching skeleton on first load, never a bare spinner", () => {
        termsSwr = { data: undefined, isLoading: true }
        latestSwr = { data: undefined, isLoading: true }

        render(<GoldenBoardPage />)

        expect(screen.getByTestId("board-skeleton")).toBeTruthy()
    })
})
