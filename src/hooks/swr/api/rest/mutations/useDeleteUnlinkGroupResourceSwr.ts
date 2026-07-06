import useSWRMutation from "swr/mutation"
import { unlinkResource } from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link unlinkResource}.
 */
export const useDeleteUnlinkGroupResourceSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; resourceId: string }
    >("DELETE_UNLINK_GROUP_RESOURCE_SWR", async (_key, { arg }) => {
        return unlinkResource(arg.id, arg.resourceId)
    })

    return swr
}
