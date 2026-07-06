import useSWRMutation from "swr/mutation"
import { pinPost } from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link pinPost}.
 */
export const usePutPinGroupPostSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; postId: string }
    >("PUT_PIN_GROUP_POST_SWR", async (_key, { arg }) => {
        return pinPost(arg.id, arg.postId)
    })

    return swr
}
