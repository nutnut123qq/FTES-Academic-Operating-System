import useSWRMutation from "swr/mutation"
import {
    addParticipant,
    type AddParticipantRequest,
} from "@/modules/api/rest/chat"

/**
 * SWR mutation wrapper for {@link addParticipant}.
 */
export const usePostAddParticipantSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { conversationId: string; request: AddParticipantRequest }
    >("POST_ADD_PARTICIPANT_SWR", async (_key, { arg }) => {
        return addParticipant(arg.conversationId, arg.request)
    })

    return swr
}
