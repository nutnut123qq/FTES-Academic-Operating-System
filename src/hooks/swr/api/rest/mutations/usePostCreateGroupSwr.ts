import useSWRMutation from "swr/mutation"
import {
    createGroup,
    type GroupCreateGroupRequest,
    type GroupResponse,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link createGroup}.
 */
export const usePostCreateGroupSwr = () => {
    const swr = useSWRMutation<
        GroupResponse,
        Error,
        string,
        GroupCreateGroupRequest
    >("POST_CREATE_GROUP_SWR", async (_key, { arg }) => {
        return createGroup(arg)
    })

    return swr
}
