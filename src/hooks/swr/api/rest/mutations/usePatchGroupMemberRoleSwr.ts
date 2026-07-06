import useSWRMutation from "swr/mutation"
import {
    changeMemberRole,
    type GroupRoleChangeRequest,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link changeMemberRole}.
 */
export const usePatchGroupMemberRoleSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; userId: string; request: GroupRoleChangeRequest }
    >("PATCH_GROUP_MEMBER_ROLE_SWR", async (_key, { arg }) => {
        return changeMemberRole(arg.id, arg.userId, arg.request)
    })

    return swr
}
