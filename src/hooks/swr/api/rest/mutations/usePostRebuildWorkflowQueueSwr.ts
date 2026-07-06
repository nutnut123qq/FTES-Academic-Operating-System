import useSWRMutation from "swr/mutation"
import { rebuildWorkflowQueue } from "@/modules/api/rest/workflow"

/**
 * SWR mutation wrapper for {@link rebuildWorkflowQueue}.
 */
export const usePostRebuildWorkflowQueueSwr = () => {
    const swr = useSWRMutation<number, Error, string>(
        "POST_REBUILD_WORKFLOW_QUEUE_SWR",
        async (_key) => {
            return rebuildWorkflowQueue()
        },
    )

    return swr
}
