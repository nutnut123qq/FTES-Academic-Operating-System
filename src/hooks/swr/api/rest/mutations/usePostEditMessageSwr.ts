import useSWRMutation from "swr/mutation"
import {
    editMessage,
    type EditMessageRequest,
    type ChatMessageResponse,
} from "@/modules/api/rest/chat"

/**
 * SWR mutation wrapper for {@link editMessage}.
 */
export const usePostEditMessageSwr = () => {
    const swr = useSWRMutation<
        ChatMessageResponse,
        Error,
        string,
        { messageId: string; request: EditMessageRequest }
    >("POST_EDIT_MESSAGE_SWR", async (_key, { arg }) => {
        return editMessage(arg.messageId, arg.request)
    })

    return swr
}
