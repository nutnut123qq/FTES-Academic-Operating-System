import useSWRMutation from "swr/mutation"
import {
    respondToInvitation,
    type GroupRespondInviteRequest,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link respondToInvitation}.
 */
export const usePostRespondToInvitationSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; request: GroupRespondInviteRequest }
    >("POST_RESPOND_TO_INVITATION_SWR", async (_key, { arg }) => {
        return respondToInvitation(arg.id, arg.request)
    })

    return swr
}
