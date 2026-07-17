import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { StreakView } from "@/modules/api/rest/gamification"

/**
 * Component — {@link StreakChip} (task 3.1): reads the live streak from
 * `GET /me/streak` and shows a skeleton pill until the first fetch lands. The
 * popover wrapper + icons are mocked to passthroughs so the test pins the chip's
 * own loading/value branch. `t` echoes the message key.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

let streakResult: { data: StreakView | undefined; isLoading: boolean }
vi.mock("@/hooks/swr/api/rest/queries", () => ({
    useGetMyStreakSwr: () => streakResult,
}))

vi.mock("../StreakPopover", () => ({
    StreakPopover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@phosphor-icons/react", () => ({ FireIcon: () => <span /> }))

vi.mock("@heroui/react", () => ({
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: () => <div data-testid="skeleton" />,
}))

import { StreakChip } from "./index"

beforeEach(() => {
    streakResult = { data: undefined, isLoading: false }
})

describe("StreakChip", () => {
    it("shows a skeleton pill while the first fetch is in flight", () => {
        streakResult = { data: undefined, isLoading: true }
        render(<StreakChip />)
        expect(screen.getByTestId("skeleton")).toBeTruthy()
        expect(screen.queryByRole("button")).toBeNull()
    })

    it("renders the current streak once loaded, with an accessible label", () => {
        streakResult = {
            data: { currentStreak: 9, longestStreak: 12, lastActiveDate: "2026-07-16", freezeAvailable: 1 },
            isLoading: false,
        }
        render(<StreakChip />)
        const button = screen.getByRole("button")
        expect(button.textContent).toContain("9")
        expect(button.getAttribute("aria-label")).toBe("streak.chipLabel")
    })

    it("falls back to 0 when there is no streak data (guest / not yet fetched)", () => {
        streakResult = { data: undefined, isLoading: false }
        render(<StreakChip />)
        expect(screen.getByRole("button").textContent).toContain("0")
    })
})
