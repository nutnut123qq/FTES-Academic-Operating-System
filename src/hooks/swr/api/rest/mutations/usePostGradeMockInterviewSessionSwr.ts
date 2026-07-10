import useSWRMutation from "swr/mutation"
import { gradeSession, type ScorecardView } from "@/modules/api/rest/mockinterview"

/**
 * SWR mutation wrapper for {@link gradeSession} (arg = sessionId).
 */
export const usePostGradeMockInterviewSessionSwr = () => {
    const swr = useSWRMutation<ScorecardView, Error, string, string>(
        "POST_GRADE_MOCK_INTERVIEW_SESSION_SWR",
        async (_key, { arg }) => {
            return gradeSession(arg)
        },
    )

    return swr
}
