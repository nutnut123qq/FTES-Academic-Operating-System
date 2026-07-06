import useSWRMutation from "swr/mutation"
import { unpinPost } from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link unpinPost}.
 */
export const useDeleteUnpinGroupPostSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; postId: string }
    >("DELETE_UNPIN_GROUP_POST_SWR", async (_key, { arg }) => {
        return unpinPost(arg.id, arg.postId)
    })

    return swr
}
