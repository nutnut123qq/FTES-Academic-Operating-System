"use client"

import useSWR from "swr"
import { getAttempts, type AttemptListView } from "@/modules/api/rest/mockinterview"

/**
 * SWR query wrapper for {@link getAttempts} — graded history, newest-first.
 */
export const useGetMockInterviewAttemptsSwr = (courseRef: string, limit = 10, offset = 0) => {
    const swr = useSWR<AttemptListView, Error>(
        courseRef ? ["GET_MOCK_INTERVIEW_ATTEMPTS_SWR", courseRef, limit, offset] : null,
        () => getAttempts(courseRef, limit, offset),
    )

    return swr
}
