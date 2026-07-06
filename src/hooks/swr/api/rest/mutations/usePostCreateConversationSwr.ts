import useSWRMutation from "swr/mutation"
import {
    createConversation,
    type ConversationResponse,
    type CreateConversationRequest,
} from "@/modules/api/rest/chat"

/**
 * SWR mutation wrapper for {@link createConversation}.
 */
export const usePostCreateConversationSwr = () => {
    const swr = useSWRMutation<
        ConversationResponse,
        Error,
        string,
        CreateConversationRequest
    >("POST_CREATE_CONVERSATION_SWR", async (_key, { arg }) => {
        return createConversation(arg)
    })

    return swr
}
