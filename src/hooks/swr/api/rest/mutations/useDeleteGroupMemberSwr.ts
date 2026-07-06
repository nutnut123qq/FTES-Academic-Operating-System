import useSWRMutation from "swr/mutation"
import { removeMember } from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link removeMember}.
 */
export const useDeleteGroupMemberSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; userId: string }
    >("DELETE_GROUP_MEMBER_SWR", async (_key, { arg }) => {
        return removeMember(arg.id, arg.userId)
    })

    return swr
}
