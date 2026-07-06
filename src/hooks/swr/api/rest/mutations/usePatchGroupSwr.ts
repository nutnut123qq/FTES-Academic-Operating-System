import useSWRMutation from "swr/mutation"
import {
    updateGroup,
    type GroupResponse,
    type GroupUpdateGroupRequest,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link updateGroup}.
 */
export const usePatchGroupSwr = () => {
    const swr = useSWRMutation<
        GroupResponse,
        Error,
        string,
        { id: string; request: GroupUpdateGroupRequest }
    >("PATCH_GROUP_SWR", async (_key, { arg }) => {
        return updateGroup(arg.id, arg.request)
    })

    return swr
}
