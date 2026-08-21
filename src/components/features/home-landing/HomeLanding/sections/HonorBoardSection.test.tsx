import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { GoldenBoardView } from "@/modules/api/rest/course"

/**
 * Component — {@link HonorBoardSection}, the home-page "FTES Hall of Fame" band, now fed by
 * `GET /api/v1/golden-board/latest` instead of the deleted hardcoded `ACHIEVERS` array.
 *
 * The contract that matters for an ANONYMOUS visitor on the landing page: the band is silent
 * about its own async state. It renders nothing at all while loading, nothing when the BE fails,
 * and nothing on the legitimate 200-with-`entries: []` the BE returns before any board exists —
 * so the home page can never show a spinner that never resolves or an error box. When rows do
 * arrive it renders the shared board plus the term chip and the "Goldenboard" CTA.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
        params ? `${key}:${JSON.stringify(params)}` : key,
    useLocale: () => "en",
}))

vi.mock("@phosphor-icons/react", () => ({
    TrophyIcon: () => <span />,
    ArrowRightIcon: () => <span />,
}))

vi.mock("@heroui/react", () => ({
    Button: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
        <button type="button" onClick={onPress}>
            {children}
        </button>
    ),
    Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

vi.mock("@/components/features/goldenboard/GoldenBoard", () => ({
    GoldenBoard: ({ entries }: { entries: ReadonlyArray<unknown> }) => (
        <div data-testid="board">{entries.length}</div>
    ),
}))

const push = vi.fn()
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }) }))

let latestSwr: { data?: GoldenBoardView; isLoading: boolean; error?: unknown }
vi.mock("@/hooks/swr/api/rest/queries/useGetGoldenBoardLatestSwr", () => ({
    useGetGoldenBoardLatestSwr: () => latestSwr,
}))

import { HonorBoardSection } from "./HonorBoardSection"

const view = (entryCount: number, withTerm = true): GoldenBoardView => ({
    term: withTerm
        ? {
            id: "sp26",
            code: "SP26",
            name: "Spring 2026",
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
    push.mockClear()
    latestSwr = { data: view(4), isLoading: false }
})

describe("HonorBoardSection", () => {
    it("renders the latest board with its term chip once rows arrive", () => {
        render(<HonorBoardSection />)

        expect(screen.getByText("honor.title")).toBeTruthy()
        expect(screen.getByTestId("board").textContent).toBe("4")
        expect(screen.getByText("honor.term:{\"term\":\"Spring 2026\"}")).toBeTruthy()
    })

    it("renders NOTHING when the BE returns an empty board (term null, entries [])", () => {
        latestSwr = { data: view(0, false), isLoading: false }

        const { container } = render(<HonorBoardSection />)

        expect(container.innerHTML).toBe("")
    })

    it("renders NOTHING while loading — no spinner on the landing page", () => {
        latestSwr = { data: undefined, isLoading: true }

        const { container } = render(<HonorBoardSection />)

        expect(container.innerHTML).toBe("")
    })

    it("renders NOTHING on a BE failure — no error box for an anonymous visitor", () => {
        latestSwr = { data: undefined, isLoading: false, error: new Error("boom") }

        const { container } = render(<HonorBoardSection />)

        expect(container.innerHTML).toBe("")
    })

    it("points the CTA at the new /goldenboard page", () => {
        render(<HonorBoardSection />)

        fireEvent.click(screen.getByText("honor.cta"))

        expect(push).toHaveBeenCalledWith("/goldenboard")
    })
})
