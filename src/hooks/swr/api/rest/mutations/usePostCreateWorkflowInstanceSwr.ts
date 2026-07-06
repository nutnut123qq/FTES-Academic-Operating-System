import useSWRMutation from "swr/mutation"
import {
    createWorkflowInstance,
    type WorkflowCreateInstanceRequest,
    type WorkflowInstanceResponse,
} from "@/modules/api/rest/workflow"

/**
 * SWR mutation wrapper for {@link createWorkflowInstance}.
 */
export const usePostCreateWorkflowInstanceSwr = () => {
    const swr = useSWRMutation<
        WorkflowInstanceResponse,
        Error,
        string,
        WorkflowCreateInstanceRequest
    >("POST_CREATE_WORKFLOW_INSTANCE_SWR", async (_key, { arg }) => {
        return createWorkflowInstance(arg)
    })

    return swr
}
