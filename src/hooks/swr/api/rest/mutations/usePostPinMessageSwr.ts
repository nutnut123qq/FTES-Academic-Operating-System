import useSWRMutation from "swr/mutation"
import { pinMessage } from "@/modules/api/rest/chat"

/**
 * SWR mutation wrapper for {@link pinMessage}.
 */
export const usePostPinMessageSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { conversationId: string; messageId: string }
    >("POST_PIN_MESSAGE_SWR", async (_key, { arg }) => {
        return pinMessage(arg.conversationId, arg.messageId)
    })

    return swr
}
