"use client"

import useSWR from "swr"
import { getStats, type MockInterviewStatsView } from "@/modules/api/rest/mockinterview"

/**
 * SWR query wrapper for {@link getStats} — per-enrollment progress aggregate.
 */
export const useGetMockInterviewStatsSwr = (courseRef: string) => {
    const swr = useSWR<MockInterviewStatsView, Error>(
        courseRef ? ["GET_MOCK_INTERVIEW_STATS_SWR", courseRef] : null,
        () => getStats(courseRef),
    )

    return swr
}
