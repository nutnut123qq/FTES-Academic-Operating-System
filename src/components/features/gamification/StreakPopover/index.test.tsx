import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ActivityDaysView, StreakView } from "@/modules/api/rest/gamification"

/**
 * Component — the streak-live surfaces (task 3.4): {@link StreakPopover} wiring
 * to `GET /me/streak` + `/me/activity-days`, plus the freeze action posting to
 * `/me/streak/freeze` and revalidating. The heavy primitives (HeroUI, phosphor,
 * toast) are mocked to trivial renderers so the test pins THIS component's own
 * behaviour. The real {@link StreakHeatmap} renders so we can assert the dense
 * `12 × 7` fill. `t` echoes the message key.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

// The streak + activity-days query hooks — controllable per test.
let streakResult: { data: StreakView | undefined; isLoading: boolean }
let activityResult: { data: ActivityDaysView | undefined }
vi.mock("@/hooks/swr/api/rest/queries", () => ({
    useGetMyStreakSwr: () => streakResult,
    useGetMyActivityDaysSwr: () => activityResult,
    GET_MY_ACTIVITY_DAYS_SWR_KEY: "GET_MY_ACTIVITY_DAYS_SWR",
}))

// The freeze mutation — trigger is a spy so we can assert it fired.
const freezeTrigger = vi.fn().mockResolvedValue(undefined)
vi.mock("@/hooks/swr/api/rest/mutations", () => ({
    usePostUseStreakFreezeSwr: () => ({ trigger: freezeTrigger, isMutating: false }),
}))

// SWR global config — capture the revalidation keys.
const mutateSpy = vi.fn()
vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: mutateSpy }) }))

// Toast runner: run the action and forward its result (null on throw).
vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => async (action: () => Promise<unknown>) => {
        try {
            return await action()
        } catch {
            return null
        }
    },
}))

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return { FireIcon: Icon, SnowflakeIcon: Icon }
})

vi.mock("@heroui/react", () => {
    const Popover = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Popover.Trigger = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Popover.Content = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    return {
        Popover,
        Button: ({ children, onPress, isDisabled }: { children: React.ReactNode; onPress?: () => void; isDisabled?: boolean }) => (
            <button type="button" disabled={isDisabled} onClick={onPress}>
                {children}
            </button>
        ),
        Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    }
})

vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: () => <div data-testid="skeleton" />,
}))

import { StreakPopover } from "./index"

beforeEach(() => {
    streakResult = {
        data: { currentStreak: 7, longestStreak: 21, lastActiveDate: "2026-07-16", freezeAvailable: 2 },
        isLoading: false,
    }
    activityResult = { data: { weeks: 12, days: [{ date: "2026-07-16", xp: 60 }] } }
})

afterEach(() => {
    vi.clearAllMocks()
})

describe("StreakPopover", () => {
    it("renders the current streak, longest streak, and freeze inventory", () => {
        render(<StreakPopover><span>trigger</span></StreakPopover>)
        expect(screen.getByText("streak.daysCount")).toBeTruthy()
        expect(screen.getByText("streak.longest")).toBeTruthy()
        expect(screen.getByText("streak.freezeCount")).toBeTruthy()
        expect(screen.getByText("streak.useFreeze")).toBeTruthy()
    })

    it("fills a dense 12 × 7 heatmap grid", () => {
        render(<StreakPopover><span>trigger</span></StreakPopover>)
        expect(screen.getAllByRole("gridcell")).toHaveLength(12 * 7)
    })

    it("consumes a freeze and revalidates the streak + activity windows", async () => {
        render(<StreakPopover><span>trigger</span></StreakPopover>)
        fireEvent.click(screen.getByText("streak.useFreeze"))
        await waitFor(() => expect(freezeTrigger).toHaveBeenCalledTimes(1))
        expect(mutateSpy).toHaveBeenCalledWith(["GET_MY_STREAK_SWR"])
        expect(mutateSpy).toHaveBeenCalledWith(["GET_MY_ACTIVITY_DAYS_SWR", 12])
    })

    it("disables the freeze action when no freeze is available", () => {
        streakResult = {
            data: { currentStreak: 3, longestStreak: 3, lastActiveDate: "2026-07-16", freezeAvailable: 0 },
            isLoading: false,
        }
        render(<StreakPopover><span>trigger</span></StreakPopover>)
        const button = screen.getByText("streak.useFreeze").closest("button")
        expect(button?.disabled).toBe(true)
    })

    it("shows a skeleton headline while the first streak fetch is in flight", () => {
        streakResult = { data: undefined, isLoading: true }
        render(<StreakPopover><span>trigger</span></StreakPopover>)
        expect(screen.getByTestId("skeleton")).toBeTruthy()
    })
})
