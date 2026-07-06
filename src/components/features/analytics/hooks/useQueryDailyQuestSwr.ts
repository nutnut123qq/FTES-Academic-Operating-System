"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"

/** Daily-quest task key — drives the row icon + label. */
export type DailyQuestKey = "readContent" | "passChallenge" | "reviewFlashcards"

/** A single daily-quest checklist task with today's progress. */
export interface DailyQuestTask {
    /** i18n key under `analytics.overview.quest.tasks.*`. */
    key: DailyQuestKey
    /** Progress achieved today. */
    current: number
    /** Target to complete the task. */
    target: number
}

/** Today's daily-quest state. */
export interface DailyQuest {
    /** The checklist rows. */
    tasks: Array<DailyQuestTask>
    /** Reward coins granted when every task is complete. */
    reward: number
    /** Whether all tasks are complete (claim becomes available). */
    allDone: boolean
    /** Whether the reward has already been claimed today. */
    claimed: boolean
}

// ponytail: mock BE — no daily-quest endpoint yet. Deterministic seed with
// per-task current/target; SWR-shaped for a drop-in swap (myDailyQuest()) later.
const fetchDailyQuestMock = async (): Promise<DailyQuest> => {
    const tasks: Array<DailyQuestTask> = [
        { key: "readContent", current: 1, target: 1 },
        { key: "passChallenge", current: 0, target: 1 },
        { key: "reviewFlashcards", current: 8, target: 10 },
    ]
    const allDone = tasks.every((task) => task.current >= task.target)
    return { tasks, reward: 20, allDone, claimed: false }
}

/**
 * Loads today's daily-quest checklist + exposes a local `claim` so the reward can
 * be granted without a BE round-trip (mock: flips `claimed`). Content-first shape
 * mirrors StarCI's quest. SWR-shaped for a drop-in swap later.
 */
export const useQueryDailyQuestSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "quest"],
        () => fetchDailyQuestMock(),
    )
    // local claimed override (mock; no BE mutation)
    const [claimed, setClaimed] = useState(false)

    const claim = useCallback(() => {
        setClaimed(true)
    }, [])

    const merged: DailyQuest | undefined = data
        ? { ...data, claimed: data.claimed || claimed }
        : undefined

    return { data: merged, claim, isLoading, error, mutate }
}
