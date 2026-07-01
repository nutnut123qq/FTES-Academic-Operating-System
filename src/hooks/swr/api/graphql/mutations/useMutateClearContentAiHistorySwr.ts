import useSWRMutation from "swr/mutation"
import { mutateClearContentAiHistory } from "@/modules/api/graphql/mutations/mutation-clear-content-ai-history"
import { type ClearContentAiHistoryRequest } from "@/modules/api/graphql/mutations/types/clear-content-ai-history"

type MutateClearContentAiHistoryResult = Awaited<ReturnType<typeof mutateClearContentAiHistory>>

/**
 * SWR mutation wrapper for {@link mutateClearContentAiHistory}.
 * Pass `{ contentId }` as arg; clears that content's saved conversation.
 */
export const useMutateClearContentAiHistorySwr = () => {
    const swr = useSWRMutation<
        MutateClearContentAiHistoryResult,
        Error,
        string,
        ClearContentAiHistoryRequest
    >(
        "MUTATE_CLEAR_CONTENT_AI_HISTORY_SWR",
        async (_key, { arg }) => {
            return mutateClearContentAiHistory({
                request: arg,
            })
        },
    )
    return swr
}
