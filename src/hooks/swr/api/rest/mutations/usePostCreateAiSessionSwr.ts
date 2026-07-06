import useSWRMutation from "swr/mutation"
import {
    createSession,
    type CreateSessionRequest,
    type AiSessionView,
} from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link createSession}.
 */
export const usePostCreateAiSessionSwr = () => {
    const swr = useSWRMutation<AiSessionView, Error, string, CreateSessionRequest>(
        "POST_CREATE_AI_SESSION_SWR",
        async (_key, { arg }) => {
            return createSession(arg)
        },
    )

    return swr
}
