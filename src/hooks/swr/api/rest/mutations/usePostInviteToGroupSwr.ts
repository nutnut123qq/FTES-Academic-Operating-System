import useSWRMutation from "swr/mutation"
import {
    inviteToGroup,
    type GroupInviteRequest,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link inviteToGroup}.
 */
export const usePostInviteToGroupSwr = () => {
    const swr = useSWRMutation<
        string,
        Error,
        string,
        { id: string; request: GroupInviteRequest }
    >("POST_INVITE_TO_GROUP_SWR", async (_key, { arg }) => {
        return inviteToGroup(arg.id, arg.request)
    })

    return swr
}
