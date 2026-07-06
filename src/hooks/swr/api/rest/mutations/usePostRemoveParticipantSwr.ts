import useSWRMutation from "swr/mutation"
import { removeParticipant } from "@/modules/api/rest/chat"

/**
 * SWR mutation wrapper for {@link removeParticipant}.
 */
export const usePostRemoveParticipantSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { conversationId: string; userId: string }
    >("POST_REMOVE_PARTICIPANT_SWR", async (_key, { arg }) => {
        return removeParticipant(arg.conversationId, arg.userId)
    })

    return swr
}
