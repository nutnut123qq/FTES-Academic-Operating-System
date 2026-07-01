import useSWRMutation from "swr/mutation"
import { mutateCreateContentAiSession } from "@/modules/api/graphql/mutations/mutation-create-content-ai-session"
import { type CreateContentAiSessionRequest } from "@/modules/api/graphql/mutations/types/create-content-ai-session"

type MutateCreateContentAiSessionResult = Awaited<ReturnType<typeof mutateCreateContentAiSession>>

/**
 * SWR mutation wrapper for {@link mutateCreateContentAiSession}.
 * Pass `{ contentId }` as arg; starts a new conversation and returns its id.
 */
export const useMutateCreateContentAiSessionSwr = () => {
    const swr = useSWRMutation<
        MutateCreateContentAiSessionResult,
        Error,
        string,
        CreateContentAiSessionRequest
    >(
        "MUTATE_CREATE_CONTENT_AI_SESSION_SWR",
        async (_key, { arg }) => {
            return mutateCreateContentAiSession({
                request: arg,
            })
        },
    )
    return swr
}
