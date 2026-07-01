"use client"

import useSWR from "swr"
import { queryMyCodingProgress } from "@/modules/api/graphql/queries/query-my-coding-progress"
import { type MyCodingProgress } from "@/modules/api/graphql/queries/types/coding"

/**
 * SWR hook for the signed-in user's coding-practice status (solved / attempted /
 * revealed ids + total points), used to overlay per-problem status onto the
 * catalog. Returns null when the user has no coding activity (or is anonymous).
 *
 * @returns the SWR handle (data = {@link MyCodingProgress} or null).
 */
export const useMyCodingProgressSwr = () => {
    return useSWR(
        ["PRACTICE_MY_CODING_PROGRESS_SWR"],
        async (): Promise<MyCodingProgress | null> => {
            const response = await queryMyCodingProgress({})
            return response.data?.myCodingProgress.data ?? null
        },
    )
}
