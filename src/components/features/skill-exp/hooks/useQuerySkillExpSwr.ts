"use client"

import useSWR from "swr"
import { getCareerSkillCategories, getMyCareerSkillExp } from "@/modules/api/rest/career"
import { buildSkillExpChart, type SkillExpChartData } from "./skillExpModel"

// The view-model types + the mapping helpers live in `skillExpModel` (pure, unit
// tested); they are re-exported here so every consumer keeps a single import path.
export * from "./skillExpModel"

/**
 * Loads the learner's EXP per skill category (change `course-skill-exp`).
 *
 * - `GET /api/v1/career/skill-categories` → the managed catalogue (which bars exist),
 * - `GET /api/v1/career/me/skill-exp` → the learner's accumulated total per category.
 *
 * Failure handling mirrors the sibling skill-graph reader: the learner's own totals
 * are tolerated (a caller without the career permission simply gets none, so every
 * category reads `0` and the surface shows its EMPTY state instead of failing),
 * while a catalogue that cannot be read surfaces as the SWR `error` so the section
 * shows its retryable error state rather than pretending the learner has no EXP.
 *
 * @returns `{ chart, isLoading, error, mutate }` — `mutate` re-runs the fetch.
 */
export const useQuerySkillExpSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["skill-exp"] as const,
        async (): Promise<SkillExpChartData> => {
            const [categories, totals] = await Promise.all([
                getCareerSkillCategories(),
                getMyCareerSkillExp().catch(() => []),
            ])
            return buildSkillExpChart(categories ?? [], totals ?? [])
        },
    )

    return { chart: data, isLoading, error, mutate }
}
