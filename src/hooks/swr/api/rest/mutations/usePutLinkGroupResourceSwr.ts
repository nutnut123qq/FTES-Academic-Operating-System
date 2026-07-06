import useSWRMutation from "swr/mutation"
import {
    linkResource,
    type GroupResourceNote,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link linkResource}.
 */
export const usePutLinkGroupResourceSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; resourceId: string; request?: GroupResourceNote }
    >("PUT_LINK_GROUP_RESOURCE_SWR", async (_key, { arg }) => {
        return linkResource(arg.id, arg.resourceId, arg.request)
    })

    return swr
}
