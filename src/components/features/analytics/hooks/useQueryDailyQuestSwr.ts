"use client"

import { useMemo } from "react"
import { useGetMyQuestsSwr } from "@/hooks/swr/api/rest/queries/useGetMyQuestsSwr"
import { questProgress } from "@/components/features/gamification/QuestBoard/model"

/** A single daily-quest row for the analytics widget, derived from a live quest. */
export interface DailyQuestRow {
    /** Backend quest `code` — drives the row icon. */
    code: string
    /** Quest title, shown verbatim from the backend (already localized). */
    title: string
    /** Events counted so far today, clamped to the day's ceiling. */
    current: number
    /** The day's ceiling (`targetCount × dailyLimit`). */
    total: number
    /** Whether every claim for the day is used. */
    isDone: boolean
}

/** Today's daily-quest summary for the analytics overview widget. */
export interface DailyQuestSummary {
    /** Quest rows ordered by the backend `sortOrder`. */
    rows: Array<DailyQuestRow>
    /** FTES coins credited today across all quests (`QuestBoardView.totalCoinToday`). */
    totalCoinToday: number
    /** How many quests are fully claimed for the day. */
    doneCount: number
    /** Total quest count. */
    totalCount: number
}

/**
 * Analytics-overview view of today's quests, mapped from the live quest board
 * (`useGetMyQuestsSwr` → `GET /gamification/me/quests`). The widget shows the
 * quest rows and today's coin total and links to the full `/quests` board — it
 * is the SAME cache the board reads, so the two never disagree. No mock, no local
 * claim: coins auto-credit on the backend worker (the quest hook polls 60s).
 */
export const useQueryDailyQuestSwr = () => {
    const { data, isLoading, error, mutate } = useGetMyQuestsSwr()

    const summary = useMemo<DailyQuestSummary | undefined>(() => {
        if (!data) return undefined
        const rows = [...data.quests]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((quest) => {
                const { current, total, isDone } = questProgress(quest)
                return { code: quest.code, title: quest.title, current, total, isDone }
            })
        return {
            rows,
            totalCoinToday: data.totalCoinToday,
            doneCount: rows.filter((row) => row.isDone).length,
            totalCount: rows.length,
        }
    }, [data])

    return { data: summary, isLoading, error, mutate }
}
