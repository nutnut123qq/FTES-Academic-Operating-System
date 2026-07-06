import useSWRMutation from "swr/mutation"
import { unreactToMessage } from "@/modules/api/rest/chat"

/**
 * SWR mutation wrapper for {@link unreactToMessage}.
 */
export const usePostUnreactToMessageSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { messageId: string; emoji: string }
    >("POST_UNREACT_TO_MESSAGE_SWR", async (_key, { arg }) => {
        return unreactToMessage(arg.messageId, arg.emoji)
    })

    return swr
}
