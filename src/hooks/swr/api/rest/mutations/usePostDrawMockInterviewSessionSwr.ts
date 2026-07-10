import useSWRMutation from "swr/mutation"
import {
    drawSession,
    type DrawSessionRequest,
    type SessionDrawView,
} from "@/modules/api/rest/mockinterview"

/**
 * SWR mutation wrapper for {@link drawSession}.
 */
export const usePostDrawMockInterviewSessionSwr = () => {
    const swr = useSWRMutation<SessionDrawView, Error, string, DrawSessionRequest>(
        "POST_DRAW_MOCK_INTERVIEW_SESSION_SWR",
        async (_key, { arg }) => {
            return drawSession(arg)
        },
    )

    return swr
}
