import useSWRMutation from "swr/mutation"
import {
    resubmitWorkflowInstance,
    type WorkflowInstanceResponse,
    type WorkflowResubmitRequest,
} from "@/modules/api/rest/workflow"

/**
 * SWR mutation wrapper for {@link resubmitWorkflowInstance}.
 */
export const usePostResubmitWorkflowInstanceSwr = () => {
    const swr = useSWRMutation<
        WorkflowInstanceResponse,
        Error,
        string,
        { id: string; request?: WorkflowResubmitRequest }
    >("POST_RESUBMIT_WORKFLOW_INSTANCE_SWR", async (_key, { arg }) => {
        return resubmitWorkflowInstance(arg.id, arg.request)
    })

    return swr
}
