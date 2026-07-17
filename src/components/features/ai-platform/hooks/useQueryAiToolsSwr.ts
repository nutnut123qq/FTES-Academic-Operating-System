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
    /**
     * Where the tile's CTA navigates. Every tile has a real destination —
     * `undefined` marks the one intent-driven tile (`tutor`) whose "continue
     * learning" action is resolved at press time from the viewer's enrollments
     * rather than a fixed URL. A tile that is neither `href`-backed nor `tutor`
     * is dead and MUST NOT render.
     */
    href?: string
}

/**
 * Curated product catalog: the tools the hub markets, each pinned to the BE AI
 * feature key it maps onto AND the learner surface its tile drives to. The catalog
 * itself is a fixed product surface (the BE has no "tools list" endpoint), but each
 * tool is validated + enriched against the real per-feature quota the BE reports —
 * a tool only renders if the BE exposes its feature, and its remaining-quota is live.
 *
 * `mentor` (teaching assistant) is intentionally ABSENT: it moved to the Admin
 * lecturer AI console, so a learner has no real surface to use it on — a dead tile
 * we don't market here. `tutor` has no static `href`: its "continue learning" jump
 * is resolved from the viewer's enrollments when pressed.
 */
const TOOL_CATALOG: ReadonlyArray<{
    key: string
    category: AiToolCategory
    feature: string
    href?: string
}> = [
    { key: "tutor", category: "student", feature: "TUTOR_CHAT" },
    { key: "planner", category: "student", feature: "STUDY_PLANNER", href: "/ai/tools/planner" },
    { key: "summary", category: "learning", feature: "SUMMARY", href: "/ai/tools/summary" },
    { key: "flashcards", category: "learning", feature: "FLASHCARDS", href: "/ai/tools/flashcards" },
    { key: "quiz", category: "learning", feature: "QUIZ_GEN", href: "/ai/tools/quiz" },
    { key: "debug", category: "coding", feature: "DEBUG", href: "/ai/tools/debug" },
    { key: "cvReview", category: "career", feature: "CV_REVIEW", href: "/ai/tools/cv-review" },
]

/**
 * Loads the AI tools hub from the real BE quota map (`/ai/quotas/me`). Keeps only
 * catalog tools whose feature the BE reports, attaching live remaining quota + the
 * learner surface the tile drives to.
 */
export const useQueryAiToolsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["GET_AI_TOOLS_QUOTA"], async () => {
        const quota = await getMyAiQuota()
        return TOOL_CATALOG.filter((tool) => tool.feature in quota).map<AiTool>((tool) => ({
            id: tool.key,
            key: tool.key,
            category: tool.category,
            remaining: quota[tool.feature] ?? 0,
            href: tool.href,
        }))
    })
    return { tools: data ?? [], isLoading, error, mutate }
}
