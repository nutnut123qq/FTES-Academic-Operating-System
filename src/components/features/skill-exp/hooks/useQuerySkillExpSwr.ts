"use client"

import useSWR from "swr"
import { getCareerSkillCategories, getMyCareerSkillExp } from "@/modules/api/rest/career"
import { buildSkillExpChart, type SkillExpChartData } from "./skillExpModel"

// The view-model types + the mapping helpers live in `skillExpModel` (pure, unit
// tested); they are re-exported here so every consumer keeps a single import path.
export * from "./skillExpModel"

/**
 * Loads the learner's skill set and their EXP in it (changes `course-skill-exp` and
 * `default-skills-by-major`).
 *
 * - `GET /api/v1/career/me/skill-exp` → the default skill set of the learner's MAJOR
 *   plus their real EXP per category (zeros included). This drives which bars exist.
 * - `GET /api/v1/career/skill-categories` → the managed catalogue, consulted only for
 *   display labels and as the stand-in bucket list when the learner read is missing.
 *
 * Failure handling, and why the two reads are NOT treated alike: the learner read is
 * tolerated (a caller without the career permission simply gets none, and the chart
 * degrades to the catalogue at zero), while a catalogue that cannot be read surfaces
 * as the SWR `error` so the section shows its retryable ERROR state. An error must
 * never be dressed up as "you have not earned anything yet" — those are different
 * facts and the reader has to be able to tell which one they are looking at.
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
            return buildSkillExpChart(categories ?? [], totals)
        },
    )

    return { chart: data, isLoading, error, mutate }
}
