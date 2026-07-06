"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"

/** A single daily-quest checklist item. */
export interface DailyQuestTask {
    /** i18n key under `analytics.overview.quest.tasks.*`. */
    key: string
    /** Whether the learner has completed it today. */
    done: boolean
}

// ponytail: mock BE — no daily-quest endpoint yet. Deterministic seed list,
// SWR-shaped for a drop-in swap (myDailyQuest()) later.
const fetchDailyQuestMock = async (): Promise<Array<DailyQuestTask>> => [
    { key: "readLesson", done: true },
    { key: "passChallenge", done: false },
    { key: "reviewFlashcards", done: false },
    { key: "askAi", done: false },
]

/**
 * Loads today's daily-quest checklist + exposes a local `toggle` so the checklist
 * is interactive without a BE round-trip. Seeds from SWR once, then holds toggle
 * state locally (mock). SWR-shaped for a drop-in swap later.
 */
export const useQueryDailyQuestSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "quest"],
        () => fetchDailyQuestMock(),
    )
    // local override map (key → done); mirrors the seeded quest but toggleable
    const [overrides, setOverrides] = useState<Record<string, boolean>>({})

    const tasks: Array<DailyQuestTask> = (data ?? []).map((task) =>
        task.key in overrides ? { ...task, done: overrides[task.key] } : task,
    )

    const toggle = useCallback((key: string) => {
        setOverrides((prev) => {
            const current = prev[key] ?? (data ?? []).find((t) => t.key === key)?.done ?? false
            return { ...prev, [key]: !current }
        })
    }, [data])

    return { tasks, toggle, isLoading, error, mutate }
}
