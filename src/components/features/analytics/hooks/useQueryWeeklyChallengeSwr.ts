"use client"

import useSWR from "swr"

/** A recent finisher of the weekly challenge. */
export interface WeeklyChallengeFinisher {
    username: string
    avatar: string | null
    /** ISO timestamp of when they passed. */
    passedAt: string
}

/** The featured weekly-challenge event. */
export interface WeeklyChallenge {
    /** Routable challenge title. */
    title: string
    /** Destination when the title / "try now" is pressed. */
    href: string
    /** ISO timestamp the event closes. */
    weekEndAt: string
    /** Whether the viewer has already passed it. */
    viewerPassed: boolean
    /** Total people who passed. */
    passedCount: number
    /** Recent finishers (avatar row). */
    leaderboard: Array<WeeklyChallengeFinisher>
}

// ponytail: mock BE — no weekly-challenge endpoint yet. Deterministic sample event
// closing 3 days out; SWR-shaped for a drop-in swap (weeklyChallenge()) later.
const fetchWeeklyChallengeMock = async (): Promise<WeeklyChallenge> => {
    const now = Date.now()
    return {
        title: "Tối ưu truy vấn SQL N+1",
        href: "/challenges",
        weekEndAt: new Date(now + 3 * 86_400_000 + 5 * 3_600_000).toISOString(),
        viewerPassed: false,
        passedCount: 42,
        leaderboard: [
            { username: "an_le", avatar: null, passedAt: new Date(now - 20 * 60_000).toISOString() },
            { username: "huy_tran", avatar: null, passedAt: new Date(now - 3 * 3_600_000).toISOString() },
            { username: "lan_pham", avatar: null, passedAt: new Date(now - 26 * 3_600_000).toISOString() },
        ],
    }
}

/** Loads the featured weekly-challenge event. Mocked; SWR-shaped. */
export const useQueryWeeklyChallengeSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "weeklyChallenge"],
        () => fetchWeeklyChallengeMock(),
    )
    return { data, isLoading, error, mutate }
}
