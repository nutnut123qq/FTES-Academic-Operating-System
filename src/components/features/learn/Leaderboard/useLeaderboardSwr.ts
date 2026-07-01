"use client"

import useSWR from "swr"
import { useAppSelector } from "@/redux/hooks"
import { queryCourseLeaderboard } from "@/modules/api/graphql/queries/query-course-leaderboard"

/**
 * The course-leaderboard fetch, keyed by course id. Shared by the page (board) and
 * the left category rail (which lives in a different layout slot) — SWR dedupes the
 * same key, so both render from one request + one cache.
 */
export const useLeaderboardSwr = () => {
    const courseId = useAppSelector((state) => state.course.entity?.id)
    return useSWR(
        courseId ? ["course-leaderboard", courseId] : null,
        async () => {
            const response = await queryCourseLeaderboard({
                request: { courseId: courseId as string },
            })
            return response.data?.courseLeaderboard.data ?? null
        },
    )
}
