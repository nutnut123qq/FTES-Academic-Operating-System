import useSWRMutation from "swr/mutation"
import { reactToMessage } from "@/modules/api/rest/chat"

/**
 * SWR mutation wrapper for {@link reactToMessage}.
 */
export const usePostReactToMessageSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { messageId: string; emoji: string }
    >("POST_REACT_TO_MESSAGE_SWR", async (_key, { arg }) => {
        return reactToMessage(arg.messageId, arg.emoji)
    })

    return swr
}
