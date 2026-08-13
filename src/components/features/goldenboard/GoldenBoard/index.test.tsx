import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { GoldenBoardEntryView } from "@/modules/api/rest/course"

/**
 * Component — {@link GoldenBoard}, the shared bảng vàng rendering used by BOTH the home-page
 * Hall of Fame section and the `/goldenboard` page. Pins the split contract:
 *  - the three LOWEST `rank`s land on the podium (positions 1/2/3) and everything after falls
 *    into the numbered list starting at 4, regardless of the array order handed in,
 *  - the number shown is the POSITION, never the raw admin `rank` (which is 0-based and may
 *    repeat, so printing it would render "0" at the top of the board),
 *  - an empty board renders nothing at all (the caller owns the empty state),
 *  - a row that links a real account gets a `/u/{username}` link; an unlinked row stays plain
 *    text,
 *  - `headline` / `badgeLabel` / `lines` come straight from the BE row.
 */

// HeroUI primitives → trivial renderers (no styling under test).
vi.mock("@heroui/react", () => ({
    Chip: ({ children }: { children: React.ReactNode }) => <span data-testid="chip">{children}</span>,
    Skeleton: () => <div />,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

// i18n navigation → a plain anchor so the href is assertable (see the module's own docblock:
// the real Link ADDS the locale, which a unit test deliberately does not exercise).
vi.mock("@/i18n/navigation", () => ({
    Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}))

import { GoldenBoard, splitGoldenBoard } from "./index"

/** Minimal BE row; overrides win. */
const entry = (over: Partial<GoldenBoardEntryView> & { id: string }): GoldenBoardEntryView => ({
    rank: 0,
    userId: null,
    username: null,
    displayName: `Learner ${over.id}`,
    photoUrl: null,
    headline: null,
    badgeLabel: null,
    lines: [],
    ...over,
})

describe("GoldenBoard — podium / list split", () => {
    it("puts the three lowest ranks on the podium and the rest in the numbered list", () => {
        const entries = [
            entry({ id: "e5", rank: 4, displayName: "Fifth" }),
            entry({ id: "e1", rank: 0, displayName: "First" }),
            entry({ id: "e3", rank: 2, displayName: "Third" }),
            entry({ id: "e4", rank: 3, displayName: "Fourth" }),
            entry({ id: "e2", rank: 1, displayName: "Second" }),
        ]

        const { podium, rest } = splitGoldenBoard(entries)

        expect(podium.map((row) => row.name)).toEqual(["First", "Second", "Third"])
        expect(rest.map((row) => row.name)).toEqual(["Fourth", "Fifth"])
    })

    it("numbers the board by POSITION (1,2,3 then 4,5…), not by the raw admin rank", () => {
        // rank is 0-based here — printing it verbatim would put a "0" at the top of the board.
        render(
            <GoldenBoard
                entries={[
                    entry({ id: "e1", rank: 0, displayName: "First" }),
                    entry({ id: "e2", rank: 1, displayName: "Second" }),
                    entry({ id: "e3", rank: 2, displayName: "Third" }),
                    entry({ id: "e4", rank: 3, displayName: "Fourth" }),
                ]}
            />,
        )

        expect(screen.getByText("1")).toBeTruthy()
        expect(screen.getByText("4")).toBeTruthy()
        expect(screen.queryByText("0")).toBeNull()
        // the list starts numbering after the podium
        expect(screen.getByRole("list").getAttribute("start")).toBe("4")
    })

    it("renders a shorter-than-podium board without a list", () => {
        render(
            <GoldenBoard
                entries={[
                    entry({ id: "e1", rank: 0, displayName: "Only" }),
                    entry({ id: "e2", rank: 1, displayName: "Other" }),
                ]}
            />,
        )

        expect(screen.getByText("Only")).toBeTruthy()
        expect(screen.queryByRole("list")).toBeNull()
    })
})

describe("GoldenBoard — empty board", () => {
    it("renders NOTHING when the BE returns no entries", () => {
        const { container } = render(<GoldenBoard entries={[]} />)

        expect(container.innerHTML).toBe("")
    })
})

describe("GoldenBoard — row content", () => {
    it("shows headline, badge and achievement lines from the BE row", () => {
        render(
            <GoldenBoard
                entries={[
                    entry({ id: "e1", rank: 0, displayName: "Podium", headline: "GPA 9.4" }),
                    entry({ id: "e2", rank: 1 }),
                    entry({ id: "e3", rank: 2 }),
                    entry({
                        id: "e4",
                        rank: 3,
                        displayName: "Listed",
                        badgeLabel: "Hackathon",
                        lines: ["Shipped a first dashboard."],
                    }),
                ]}
            />,
        )

        expect(screen.getByText("GPA 9.4")).toBeTruthy()
        expect(screen.getByText("Hackathon")).toBeTruthy()
        expect(screen.getByText("Shipped a first dashboard.")).toBeTruthy()
    })

    it("links a row that carries a username to its profile, and leaves an unlinked row as text", () => {
        render(
            <GoldenBoard
                entries={[
                    entry({ id: "e1", rank: 0, displayName: "Linked", username: "khoana71", userId: "u1" }),
                    entry({ id: "e2", rank: 1, displayName: "Unlinked" }),
                    entry({ id: "e3", rank: 2 }),
                ]}
            />,
        )

        const links = screen.getAllByRole("link")
        expect(links).toHaveLength(1)
        expect(links[0].getAttribute("href")).toBe("/u/khoana71")
        expect(screen.getByText("Unlinked")).toBeTruthy()
    })
})
