"use client"

import useSWR from "swr"
import { getInProgress, type SessionView } from "@/modules/api/rest/mockinterview"

/**
 * SWR query wrapper for {@link getInProgress} — the resumable in-progress session.
 */
export const useGetMockInterviewInProgressSwr = (courseRef: string) => {
    const swr = useSWR<SessionView | null, Error>(
        courseRef ? ["GET_MOCK_INTERVIEW_IN_PROGRESS_SWR", courseRef] : null,
        () => getInProgress(courseRef),
    )

    return swr
}
