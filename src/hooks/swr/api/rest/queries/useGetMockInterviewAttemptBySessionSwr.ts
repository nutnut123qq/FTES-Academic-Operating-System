"use client"

import useSWR from "swr"
import { getAttemptBySession, type ScorecardView } from "@/modules/api/rest/mockinterview"

/**
 * SWR query wrapper for {@link getAttemptBySession} — fetches the graded scorecard
 * for a completed session so the result is URL-addressable / refresh-safe.
 */
export const useGetMockInterviewAttemptBySessionSwr = (sessionId: string) => {
    const swr = useSWR<ScorecardView | null, Error>(
        sessionId ? ["GET_MOCK_INTERVIEW_ATTEMPT_BY_SESSION_SWR", sessionId] : null,
        () => getAttemptBySession(sessionId),
    )

    return swr
}
