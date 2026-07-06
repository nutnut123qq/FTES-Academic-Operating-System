import useSWRMutation from "swr/mutation"
import {
    transferOwnership,
    type GroupTransferOwnershipRequest,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link transferOwnership}.
 */
export const usePostTransferGroupOwnershipSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; request: GroupTransferOwnershipRequest }
    >("POST_TRANSFER_GROUP_OWNERSHIP_SWR", async (_key, { arg }) => {
        return transferOwnership(arg.id, arg.request)
    })

    return swr
}
