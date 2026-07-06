import useSWRMutation from "swr/mutation"
import { unpinMessage } from "@/modules/api/rest/chat"

/**
 * SWR mutation wrapper for {@link unpinMessage}.
 */
export const usePostUnpinMessageSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { conversationId: string; messageId: string }
    >("POST_UNPIN_MESSAGE_SWR", async (_key, { arg }) => {
        return unpinMessage(arg.conversationId, arg.messageId)
    })

    return swr
}
