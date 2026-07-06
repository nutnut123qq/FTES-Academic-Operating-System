import useSWRMutation from "swr/mutation"
import { recallMessage } from "@/modules/api/rest/chat"

/**
 * SWR mutation wrapper for {@link recallMessage}.
 */
export const usePostRecallMessageSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_RECALL_MESSAGE_SWR",
        async (_key, { arg }) => {
            return recallMessage(arg)
        },
    )

    return swr
}
