import useSWRMutation from "swr/mutation"
import { claimWorkflowQueueItem } from "@/modules/api/rest/workflow"

/**
 * SWR mutation wrapper for {@link claimWorkflowQueueItem}.
 */
export const usePostClaimWorkflowQueueItemSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_CLAIM_WORKFLOW_QUEUE_ITEM_SWR",
        async (_key, { arg }) => {
            return claimWorkflowQueueItem(arg)
        },
    )

    return swr
}
