"use client"

import useSWR from "swr"

/** The viewer's AI-credit pool seen through two rolling windows. */
export interface AiQuota {
    /** Single credit pool viewed through a 5-hour and a weekly window. */
    credit: {
        used5h: number
        limit5h: number
        remaining5h: number
        usedWeek: number
        limitWeek: number
        remainingWeek: number
    }
    /** Paid tier label when subscribed (null → free). */
    tier: "plus" | "pro" | "max" | null
}

// ponytail: mock BE — no AI-quota endpoint yet. Deterministic sample; SWR-shaped
// for a drop-in swap (myAiQuota()) later.
const fetchAiQuotaMock = async (): Promise<AiQuota> => ({
    credit: {
        used5h: 18,
        limit5h: 50,
        remaining5h: 32,
        usedWeek: 140,
        limitWeek: 250,
        remainingWeek: 110,
    },
    tier: null,
})

/** Loads the viewer's AI credit quota. Mocked; SWR-shaped. */
export const useQueryAiQuotaSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "aiQuota"],
        () => fetchAiQuotaMock(),
    )
    return { data, isLoading, error, mutate }
}
