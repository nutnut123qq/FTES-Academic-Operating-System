"use client"

import useSWR from "swr"
import { getMyAiQuota } from "@/modules/api/rest/ai"

/** Category buckets the AI hub groups tools under (i18n suffix under `aiPlatform.categories.*`). */
export type AiToolCategory = "student" | "learning" | "coding" | "career" | "teacher"

/** A single AI tool tile in the hub. */
export interface AiTool {
    /** Opaque id (stable, mirrors `key`). */
    id: string
    /** Stable slug — drives the i18n lookup `aiPlatform.tools.<key>.{name,desc}`. */
    key: string
    /** Which category bucket this tool renders under. */
    category: AiToolCategory
    /** Remaining quota for this tool's BE feature (from `/ai/quotas/me`). */
    remaining: number
}

/**
 * Curated product catalog: the tools the hub markets, each pinned to the BE AI
 * feature key it maps onto. The catalog itself is a fixed product surface (the BE
 * has no "tools list" endpoint), but each tool is validated + enriched against the
 * real per-feature quota the BE reports — a tool only renders if the BE exposes its
 * feature, and its remaining-quota is live.
 */
const TOOL_CATALOG: ReadonlyArray<{ key: string; category: AiToolCategory; feature: string }> = [
    { key: "tutor", category: "student", feature: "TUTOR_CHAT" },
    { key: "planner", category: "student", feature: "STUDY_PLANNER" },
    { key: "summary", category: "learning", feature: "SUMMARY" },
    { key: "flashcards", category: "learning", feature: "FLASHCARDS" },
    { key: "quiz", category: "learning", feature: "QUIZ_GEN" },
    { key: "debug", category: "coding", feature: "DEBUG" },
    { key: "cvReview", category: "career", feature: "CV_REVIEW" },
    { key: "mentor", category: "teacher", feature: "MENTOR" },
]

/**
 * Loads the AI tools hub from the real BE quota map (`/ai/quotas/me`). Keeps only
 * catalog tools whose feature the BE reports, attaching live remaining quota.
 */
export const useQueryAiToolsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["GET_AI_TOOLS_QUOTA"], async () => {
        const quota = await getMyAiQuota()
        return TOOL_CATALOG.filter((tool) => tool.feature in quota).map<AiTool>((tool) => ({
            id: tool.key,
            key: tool.key,
            category: tool.category,
            remaining: quota[tool.feature] ?? 0,
        }))
    })
    return { tools: data ?? [], isLoading, error, mutate }
}
