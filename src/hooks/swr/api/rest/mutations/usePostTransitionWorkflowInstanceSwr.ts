import useSWRMutation from "swr/mutation"
import {
    transitionWorkflowInstance,
    type WorkflowInstanceResponse,
    type WorkflowTransitionRequest,
} from "@/modules/api/rest/workflow"

/**
 * SWR mutation wrapper for {@link transitionWorkflowInstance}.
 */
export const usePostTransitionWorkflowInstanceSwr = () => {
    const swr = useSWRMutation<
        WorkflowInstanceResponse,
        Error,
        string,
        { id: string; request: WorkflowTransitionRequest }
    >("POST_TRANSITION_WORKFLOW_INSTANCE_SWR", async (_key, { arg }) => {
        return transitionWorkflowInstance(arg.id, arg.request)
    })

    return swr
}
